import type { OutboxInput } from './outboxModels.ts'
import type { ScenarioReport } from './scenarioReport.ts'

type OrderEvent = { id: string; orderId: string; amountCents: number }
type OutboxRow = {
  event: OrderEvent
  status: 'pending' | 'sent' | 'dead'
  attempts: number
}
type Store = {
  orders: { id: string; amountCents: number }[]
  outbox: OutboxRow[]
  processed: string[]
  invoices: { orderId: string; amountCents: number }[]
}

export function createOutboxStore() {
  let state: Store = { orders: [], outbox: [], processed: [], invoices: [] }
  return {
    placeOrder(withOutbox: boolean, failBeforeCommit = false) {
      const event = {
        id: 'order-1001:placed',
        orderId: 'order-1001',
        amountCents: 4900,
      }
      if (state.orders.some((order) => order.id === event.orderId))
        throw new Error('Order already exists')
      // Prepare both writes in isolation, then publish one committed snapshot.
      const next = structuredClone(state)
      next.orders.push({ id: event.orderId, amountCents: event.amountCents })
      if (withOutbox)
        next.outbox.push({ event, status: 'pending', attempts: 0 })
      if (failBeforeCommit) throw new Error('Simulated database rollback')
      state = next
      return structuredClone(event)
    },
    consume(event: OrderEvent, deduplicate: boolean, failBeforeCommit = false) {
      const key = `billing:${event.id}`
      if (deduplicate && state.processed.includes(key))
        return 'duplicate' as const
      // The consumer marker and business effect share a transaction too.
      const next = structuredClone(state)
      next.invoices.push({
        orderId: event.orderId,
        amountCents: event.amountCents,
      })
      if (deduplicate) next.processed.push(key)
      if (failBeforeCommit) throw new Error('Simulated consumer rollback')
      state = next
      return 'created' as const
    },
    recordAttempt(eventId: string) {
      const row = state.outbox.find((row) => row.event.id === eventId)
      if (row) row.attempts++
    },
    mark(eventId: string, status: 'sent' | 'dead') {
      const row = state.outbox.find((row) => row.event.id === eventId)
      if (row) row.status = status
    },
    snapshot: () => structuredClone(state),
  }
}

export function runOutboxLab(input: OutboxInput) {
  const store = createOutboxStore()
  const steps: ScenarioReport['steps'] = []
  const record = (label: string, detail: string) =>
    steps.push({ label, detail })
  let event: OrderEvent | undefined
  let deliveries = 0
  let duplicates = 0
  const withOutbox = input.strategy === 'outbox'
  try {
    event = store.placeOrder(withOutbox, input.fault === 'before-commit')
    record(
      'Order committed',
      withOutbox
        ? 'Order 1001 ($49.00) and its pending event committed together in the model store.'
        : 'Order 1001 ($49.00) committed. A separate direct publish has not happened yet.',
    )
  } catch {
    record(
      'Producer transaction rolled back',
      'Neither the order nor its event exists. There is nothing to deliver or invoice.',
    )
  }

  if (event && input.fault === 'after-commit') {
    event = undefined // The crashed producer loses its local variables.
    record(
      'Producer stops after commit',
      'The model discards the unsent event held by the producer. Committed storage remains.',
    )
    event = store
      .snapshot()
      .outbox.find((row) => row.status === 'pending')?.event
    record(
      'Relay restarts',
      event
        ? 'The relay discovers the pending event from storage; it does not need the original request.'
        : 'There is no persisted event to discover. The order has no invoice and no automatic retry path.',
    )
  }

  if (event) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      deliveries++
      store.recordAttempt(event.id)
      record(
        `Delivery attempt ${attempt}`,
        `Send the same event ID ${event.id} to the billing consumer.`,
      )
      try {
        if (input.fault === 'poison')
          throw new Error('Unsupported event schema')
        const result = store.consume(
          event,
          input.deduplicate,
          input.fault === 'consumer-crash' && attempt === 1,
        )
        if (result === 'duplicate') {
          duplicates++
          record(
            'Duplicate suppressed',
            'Billing already committed this event. Return success without creating another invoice.',
          )
        } else {
          record(
            'Invoice committed',
            input.deduplicate
              ? 'The $49.00 invoice and the processed-event marker committed together.'
              : 'A $49.00 invoice was added without checking or recording a processed-event marker.',
          )
        }
        if (input.fault === 'ack-lost' && attempt === 1) {
          record(
            'Acknowledgement lost',
            'Billing committed, but the publisher did not receive confirmation. Retrying may deliver the event again.',
          )
          throw new Error('Simulated acknowledgement loss')
        }
        store.mark(event.id, 'sent')
        record(
          'Delivery acknowledged',
          withOutbox
            ? 'The relay marks the outbox event sent only after acknowledgement.'
            : 'The direct caller received success. No outbox record exists.',
        )
        break
      } catch {
        if (input.fault === 'consumer-crash' && attempt === 1) {
          record(
            'Consumer transaction rolled back',
            'Both invoice and processed marker rolled back. A retry can still create the invoice.',
          )
        }
        if (attempt === 3) {
          store.mark(event.id, 'dead')
          record(
            withOutbox
              ? 'Moved to dead-letter state'
              : 'Direct caller gives up',
            withOutbox
              ? 'After three failed deliveries, retain the event for investigation. Repair the consumer and explicitly replay with the same event ID; no silent deletion.'
              : 'The retry limit is exhausted. There is no durable outbox entry for an operator to replay.',
          )
        } else {
          record(
            'Retry scheduled',
            withOutbox
              ? 'The event stays pending. The model advances to the next relay attempt; a real worker uses backoff and a durable schedule.'
              : 'The direct caller retries while it is still alive. This retry plan would be lost on restart.',
          )
        }
      }
    }
  }
  const snapshot = store.snapshot()
  const total = snapshot.invoices.reduce(
    (sum, invoice) => sum + invoice.amountCents,
    0,
  )
  const summary =
    snapshot.orders.length === 0
      ? 'Rollback kept both sides empty: no order, no invoice, and no event.'
      : snapshot.invoices.length === 0
        ? withOutbox && snapshot.outbox.some((row) => row.status === 'dead')
          ? 'The order is saved, but billing is not complete. The failed event is retained for investigation and replay.'
          : 'The order is saved, but its invoice is missing. A direct publish cannot recover an event that was never persisted.'
        : snapshot.invoices.length > 1
          ? 'One order produced duplicate invoices. At-least-once delivery needs an idempotent consumer.'
          : 'One order produced one invoice. Delivery retries did not duplicate the business effect.'
  const report: ScenarioReport = {
    title: 'Order-to-invoice results',
    summary,
    metrics: [
      { label: 'Orders saved', value: String(snapshot.orders.length) },
      { label: 'Delivery attempts', value: String(deliveries) },
      { label: 'Invoices created', value: String(snapshot.invoices.length) },
      { label: 'Invoiced total', value: `$${(total / 100).toFixed(2)}` },
    ],
    steps,
  }
  return { ...snapshot, deliveries, duplicates, report }
}
