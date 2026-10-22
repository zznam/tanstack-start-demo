import type { ResilienceInput } from './resilienceModels.ts'
import type { ScenarioReport } from './scenarioReport.ts'

type CircuitState = 'closed' | 'open' | 'half-open'
type Outcome = 'quote' | 'invalid' | 'unavailable' | 'deadline' | 'circuit-open'

// A deterministic, sequential model. Time advances without sleeping or making
// external requests; the exact same policy runs for every scenario.
export function runResilienceLab(input: ResilienceInput) {
  let clock = 0
  const circuit: { state: CircuitState } = { state: 'closed' }
  let consecutiveFailures = 0
  let retryAt = 0
  let attempts = 0
  const steps: ScenarioReport['steps'] = []
  const calls: { outcome: Outcome; attempts: number; elapsedMs: number }[] = []
  const record = (label: string, detail: string) =>
    steps.push({ label: `${clock} ms · ${label}`, detail })

  function succeed() {
    consecutiveFailures = 0
    if (circuit.state !== 'closed')
      record('Circuit closed', 'The recovery probe reached a healthy service.')
    circuit.state = 'closed'
  }
  function fail() {
    consecutiveFailures++
    if (
      input.breaker &&
      (circuit.state === 'half-open' || consecutiveFailures >= 2)
    ) {
      circuit.state = 'open'
      retryAt = clock + 500
      record(
        'Circuit opened',
        `Skip calls until ${retryAt} ms, then allow a single recovery probe.`,
      )
    }
  }

  for (let request = 0; request < 5; request++) {
    // After the third customer, let the carrier's cooldown expire.
    if (request > 0) clock += request === 3 ? 600 : 50
    const started = clock
    const beforeAttempts = attempts
    let outcome: Outcome = 'unavailable'
    record(
      `Checkout ${request + 1}`,
      `New read-only quote request; total budget ${input.deadlineMs} ms.`,
    )
    if (input.breaker && circuit.state === 'open' && clock < retryAt) {
      record(
        'Fast fallback',
        'Circuit is open. No carrier request was sent; shipping price stays unconfirmed.',
      )
      calls.push({ outcome: 'circuit-open', attempts: 0, elapsedMs: 0 })
      continue
    }
    if (input.breaker && circuit.state === 'open') {
      circuit.state = 'half-open'
      record(
        'Half-open probe',
        'Allow one attempt, without retries, before admitting more traffic.',
      )
    }
    const limit = circuit.state === 'half-open' ? 1 : input.maxAttempts
    for (let attempt = 0; attempt < limit; attempt++) {
      const remaining = input.deadlineMs - (clock - started)
      if (remaining <= 0) {
        outcome = 'deadline'
        break
      }
      const response =
        input.scenario === 'invalid'
          ? 'invalid'
          : input.scenario === 'timeout'
            ? 'slow'
            : input.scenario === 'transient'
              ? attempt === 0
                ? 'unavailable'
                : 'ok'
              : request >= 3 &&
                  !(input.scenario === 'probe-fails' && request === 3)
                ? 'ok'
                : 'unavailable'
      const duration = response === 'slow' ? 400 : 80
      const timeout = Math.min(150, remaining)
      attempts++
      clock += Math.min(duration, timeout)
      if (duration > timeout) {
        outcome = 'deadline'
        record(
          `Attempt ${attempt + 1} timed out`,
          `Stopped waiting after ${timeout} ms; the total deadline still includes earlier attempts and backoff.`,
        )
      } else if (response === 'ok') {
        outcome = 'quote'
        record(
          `Attempt ${attempt + 1} succeeded`,
          'Carrier returned a confirmed sample shipping quote of $8.50.',
        )
        succeed()
        break
      } else if (response === 'invalid') {
        outcome = 'invalid'
        record(
          'Address rejected · 422',
          'Ask the customer to fix the postcode. No retry and no dependency-failure count.',
        )
        succeed()
        break
      } else {
        outcome = 'unavailable'
        record(
          `Attempt ${attempt + 1} failed · 503`,
          'Temporary carrier failure. Retry only if both budgets allow it.',
        )
      }
      if (attempt + 1 < limit) {
        const backoff = 50 * 2 ** attempt
        if (clock + backoff >= started + input.deadlineMs) {
          record(
            'Deadline stops retry',
            'The next backoff would consume the remaining request budget.',
          )
          outcome = 'deadline'
          break
        }
        clock += backoff
        record(
          'Bounded backoff',
          `Waited ${backoff} ms in the model. Production callers should add jitter.`,
        )
      }
    }
    if (outcome !== 'quote' && outcome !== 'invalid') {
      fail()
      record(
        'Checkout fallback',
        'Keep the cart, but show shipping as unavailable. No order or payment is submitted.',
      )
    }
    calls.push({
      outcome,
      attempts: attempts - beforeAttempts,
      elapsedMs: clock - started,
    })
  }
  const quotes = calls.filter((call) => call.outcome === 'quote').length
  const blocked = calls.filter((call) => call.outcome === 'circuit-open').length
  const report: ScenarioReport = {
    title: 'Shipping quote results',
    summary: `${quotes} of 5 checkouts received a confirmed quote. ${blocked} calls were blocked before reaching the carrier. Times use a simulated clock, not a network benchmark.`,
    metrics: [
      { label: 'Carrier attempts', value: String(attempts) },
      { label: 'Confirmed quotes', value: `${quotes} / 5` },
      { label: 'Fast fallbacks', value: String(blocked) },
      {
        label: 'Longest checkout',
        value: `${Math.max(...calls.map((call) => call.elapsedMs))} ms`,
      },
    ],
    steps,
  }
  return { calls, attempts, blocked, report }
}
