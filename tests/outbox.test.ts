import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createOutboxStore,
  runOutboxLab,
} from '../src/utils/outboxLab.server.ts'
import { outboxSchema } from '../src/utils/outboxModels.ts'
import type { OutboxInput } from '../src/utils/outboxModels.ts'

const defaults: OutboxInput = {
  strategy: 'outbox',
  fault: 'after-commit',
  deduplicate: true,
}

test('producer transaction commits order and event together or rolls both back', () => {
  const store = createOutboxStore()
  assert.throws(() => store.placeOrder(true, true), /rollback/)
  assert.deepEqual(store.snapshot().orders, [])
  assert.deepEqual(store.snapshot().outbox, [])
  const event = store.placeOrder(true)
  event.amountCents = 1
  const snapshot = store.snapshot()
  assert.equal(snapshot.orders.length, 1)
  assert.equal(snapshot.outbox[0].event.amountCents, 4900)
  snapshot.outbox[0].status = 'sent'
  assert.equal(store.snapshot().outbox[0].status, 'pending')
  assert.throws(() => store.placeOrder(true), /already exists/)
  assert.equal(store.snapshot().orders.length, 1)
})

test('a restarted relay recovers the persisted event while a direct publish loses it', () => {
  const recovered = runOutboxLab(defaults)
  assert.equal(recovered.orders.length, 1)
  assert.equal(recovered.invoices.length, 1)
  assert.equal(recovered.outbox[0].status, 'sent')
  const lost = runOutboxLab({ ...defaults, strategy: 'direct' })
  assert.equal(lost.orders.length, 1)
  assert.equal(lost.invoices.length, 0)
  assert.equal(lost.deliveries, 0)
  assert.deepEqual(
    runOutboxLab(defaults),
    recovered,
    'no state leaks between runs',
  )
})

test('acknowledgement loss redelivers the stable event and deduplication prevents double billing', () => {
  for (const strategy of ['outbox', 'direct'] as const) {
    const safe = runOutboxLab({ ...defaults, strategy, fault: 'ack-lost' })
    assert.equal(safe.deliveries, 2)
    assert.equal(safe.duplicates, 1)
    assert.equal(safe.invoices.length, 1)
    const unsafe = runOutboxLab({
      ...defaults,
      strategy,
      fault: 'ack-lost',
      deduplicate: false,
    })
    assert.equal(unsafe.invoices.length, 2)
    assert.equal(unsafe.processed.length, 0)
  }
})

test('consumer marker and invoice roll back together, permitting a safe retry', () => {
  const store = createOutboxStore()
  const event = store.placeOrder(true)
  assert.throws(() => store.consume(event, true, true), /rollback/)
  assert.deepEqual(store.snapshot().invoices, [])
  assert.deepEqual(store.snapshot().processed, [])
  assert.equal(store.consume(event, true), 'created')
  assert.equal(store.consume(event, true), 'duplicate')
  assert.equal(store.snapshot().invoices.length, 1)
  const run = runOutboxLab({ ...defaults, fault: 'consumer-crash' })
  assert.equal(run.deliveries, 2)
  assert.equal(run.invoices.length, 1)
})

test('poison events stop after three deliveries and remain available for investigation', () => {
  const run = runOutboxLab({ ...defaults, fault: 'poison' })
  assert.equal(run.deliveries, 3)
  assert.equal(run.outbox[0].attempts, 3)
  assert.equal(run.outbox[0].status, 'dead')
  assert.equal(run.invoices.length, 0)
  assert.equal(run.orders.length, 1)
})

test('every scenario stays bounded and producer rollback cannot create an invoice', () => {
  for (const fault of outboxSchema.shape.fault.options) {
    for (const strategy of outboxSchema.shape.strategy.options) {
      for (const deduplicate of [false, true]) {
        const result = runOutboxLab({ fault, strategy, deduplicate })
        assert.ok(result.deliveries <= 3)
        assert.ok(result.report.steps.length < 20)
        if (deduplicate) assert.ok(result.invoices.length <= 1)
        if (fault === 'before-commit') {
          assert.equal(
            result.orders.length +
              result.outbox.length +
              result.invoices.length +
              result.processed.length +
              result.deliveries,
            0,
          )
        }
      }
    }
  }
  for (const patch of [
    { fault: 'arbitrary' },
    { strategy: 'queue-url' },
    { deduplicate: 'true' },
  ]) {
    assert.equal(
      outboxSchema.safeParse({ ...defaults, ...patch }).success,
      false,
    )
  }
})
