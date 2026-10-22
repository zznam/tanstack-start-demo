import test from 'node:test'
import assert from 'node:assert/strict'
import { resilienceSchema } from '../src/utils/resilienceModels.ts'
import type { ResilienceInput } from '../src/utils/resilienceModels.ts'
import { runResilienceLab } from '../src/utils/resilienceLab.server.ts'

const defaults: ResilienceInput = {
  scenario: 'outage',
  maxAttempts: 3,
  deadlineMs: 500,
  breaker: true,
}

test('outages trip the circuit across calls and successful probes restore service', () => {
  const protectedRun = runResilienceLab(defaults)
  assert.deepEqual(
    protectedRun.calls.map((c) => c.outcome),
    ['unavailable', 'unavailable', 'circuit-open', 'quote', 'quote'],
  )
  assert.deepEqual(
    protectedRun.calls.map((c) => c.attempts),
    [3, 3, 0, 1, 1],
  )
  assert.equal(protectedRun.attempts, 8)
  assert.equal(runResilienceLab({ ...defaults, breaker: false }).attempts, 11)
  assert.deepEqual(
    runResilienceLab(defaults),
    protectedRun,
    'each run is independent',
  )
})

test('failed recovery probes do not retry or admit the next customer', () => {
  const result = runResilienceLab({ ...defaults, scenario: 'probe-fails' })
  assert.deepEqual(
    result.calls.map((c) => c.attempts),
    [3, 3, 0, 1, 0],
  )
  assert.equal(result.blocked, 2)
})

test('validation errors never retry; transient failures recover within the budget', () => {
  const invalid = runResilienceLab({ ...defaults, scenario: 'invalid' })
  assert.equal(invalid.attempts, 5)
  assert.equal(invalid.blocked, 0)
  assert.ok(invalid.calls.every((c) => c.outcome === 'invalid'))
  const transient = runResilienceLab({ ...defaults, scenario: 'transient' })
  assert.ok(
    transient.calls.every(
      (c) => c.outcome === 'quote' && c.elapsedMs === 210 && c.attempts === 2,
    ),
  )
})

test('all settings obey total deadlines and attempt caps, including slow and half-open calls', () => {
  for (const scenario of resilienceSchema.shape.scenario.options) {
    for (const deadlineMs of [250, 500, 1000] as const) {
      for (const maxAttempts of [1, 2, 3]) {
        for (const breaker of [false, true]) {
          const result = runResilienceLab({
            scenario,
            deadlineMs,
            maxAttempts,
            breaker,
          })
          assert.equal(result.calls.length, 5)
          assert.ok(
            result.calls.every(
              (c) => c.elapsedMs <= deadlineMs && c.attempts <= maxAttempts,
            ),
          )
          assert.ok(result.report.steps.length < 70)
        }
      }
    }
  }
  const slow = runResilienceLab({
    ...defaults,
    scenario: 'timeout',
    deadlineMs: 250,
  })
  assert.equal(slow.calls[0].elapsedMs, 250)
  assert.equal(slow.calls[0].attempts, 2)
})

test('server policy inputs reject unbounded, malformed and unsupported values', () => {
  for (const patch of [
    { maxAttempts: 0 },
    { maxAttempts: 4 },
    { maxAttempts: 1.5 },
    { deadlineMs: 100000 },
    { breaker: 'false' },
    { scenario: 'unknown' },
  ]) {
    assert.equal(
      resilienceSchema.safeParse({ ...defaults, ...patch }).success,
      false,
    )
  }
})
