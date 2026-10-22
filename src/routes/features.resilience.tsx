import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { CodeBlock } from '../components/CodeBlock'
import { ScenarioRunner } from '../components/ScenarioRunner'
import type { ResilienceInput } from '../utils/resilienceModels'
import { runShippingScenario } from '../utils/resilienceServerFns'

export const Route = createFileRoute('/features/resilience')({
  head: () => ({
    meta: [
      { title: 'Circuit Breakers & Retry Budgets | TanStack Learning Lab' },
    ],
  }),
  component: ResiliencePage,
})

function ResiliencePage() {
  const [settings, setSettings] = useState<ResilienceInput>({
    scenario: 'outage',
    maxAttempts: 3,
    deadlineMs: 500,
    breaker: true,
  })
  return (
    <AdvancedLesson
      id="resilience"
      title="Circuit breakers & retry budgets"
      intro="A busy store depends on a shipping carrier for checkout quotes. When the carrier fails, protect both services: retry transient faults within a deadline, stop sustained failures, and probe for recovery."
      challenge="Run the carrier outage with the circuit breaker enabled, then disable it. Compare upstream attempts. Next choose a slow carrier with a 250 ms deadline: why does increasing the attempt limit not guarantee more calls?"
      solution="The breaker opens after two failed checkouts, skips the next call, and admits one probe after its 500 ms cooldown. A successful probe closes it; a failed probe reopens it. Backoff and attempts share one total deadline, so the smaller remaining budget wins. Validation errors need user correction, not retries. Production budgets should come from dependency latency, an end-to-end SLO, and load tests."
      docs={[
        {
          label: 'Circuit breaker pattern',
          href: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker',
        },
        {
          label: 'Timeouts, retries, and jitter',
          href: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/',
        },
      ]}
    >
      <ScenarioRunner
        title="Real-world example: shipping quotes at checkout"
        run={() => runShippingScenario({ data: settings })}
      >
        <label className="text-sm font-semibold">
          Carrier behavior
          <select
            className="demo-select mt-2"
            value={settings.scenario}
            onChange={(e) =>
              setSettings({
                ...settings,
                scenario: e.target.value as ResilienceInput['scenario'],
              })
            }
          >
            <option value="outage">Outage, then recovery</option>
            <option value="transient">Transient failure, then success</option>
            <option value="probe-fails">Recovery probe fails</option>
            <option value="timeout">Slow carrier times out</option>
            <option value="invalid">Invalid shipping address</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Maximum attempts per checkout
          <select
            className="demo-select mt-2"
            value={settings.maxAttempts}
            onChange={(e) =>
              setSettings({ ...settings, maxAttempts: Number(e.target.value) })
            }
          >
            {[1, 2, 3].map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? 'attempt · no retry' : 'attempts'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Total checkout deadline
          <select
            className="demo-select mt-2"
            value={settings.deadlineMs}
            onChange={(e) =>
              setSettings({
                ...settings,
                deadlineMs: Number(
                  e.target.value,
                ) as ResilienceInput['deadlineMs'],
              })
            }
          >
            {[250, 500, 1000].map((value) => (
              <option key={value} value={value}>
                {value} ms
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold self-end py-3">
          <input
            type="checkbox"
            checked={settings.breaker}
            onChange={(e) =>
              setSettings({ ...settings, breaker: e.target.checked })
            }
          />
          Enable circuit breaker
        </label>
      </ScenarioRunner>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="demo-panel space-y-4">
          <h2 className="text-lg font-bold">What this policy protects</h2>
          <ol className="lesson-steps">
            <li>
              <strong>One budget for the whole request.</strong> Each attempt
              waits at most 150 ms. Exponential backoff starts at 50 ms and
              counts toward the checkout deadline.
            </li>
            <li>
              <strong>A circuit across calls.</strong> Two consecutive failed
              checkouts open the circuit for 500 ms. Address validation errors
              do not count as carrier outages.
            </li>
            <li>
              <strong>A cautious recovery probe.</strong> After cooldown, one
              attempt tests the carrier. The model runs five sequential
              customers, with a 600 ms pause before the fourth.
            </li>
            <li>
              <strong>An honest fallback.</strong> Keep the cart and let the
              customer retry later. An unavailable shipping price is never a
              confirmed free delivery.
            </li>
          </ol>
        </div>
        <CodeBlock
          title="Production pattern · illustrative pseudocode"
          code={`const deadline = monotonicNow() + checkoutBudget
const permit = breaker.acquirePermit()
if (!permit) return shippingUnavailable()

try {
  const quote = await retryReadOnlyQuote({
    deadline,                 // includes backoff
    perAttemptTimeout: 150,
    maxAttempts: permit.isProbe ? 1 : 3,
    retryIf: isTransient,
    backoff: exponentialWithJitter,
    signal: request.signal,   // propagate cancellation
  })
  permit.recordSuccess()
  return quote
} catch (error) {
  if (isValidationError(error)) {
    permit.recordSuccess() // service is reachable
    return fixAddress()
  }
  permit.recordFailure()
  return shippingUnavailable()
}`}
        />
      </section>
      <section className="demo-panel space-y-3">
        <h2 className="text-lg font-bold">
          From this model to a production service
        </h2>
        <p className="demo-muted leading-relaxed">
          This is a read-only carrier model, not a payment retry policy. Use
          stable idempotency keys before retrying side effects. Real network
          clients need abortable I/O, connection timeouts, jitter, and a retry
          budget across the fleet; nested retries can multiply load.
        </p>
        <p className="demo-muted leading-relaxed">
          Production breakers also need concurrency-safe probe permits, an
          intentional scope per dependency, and telemetry for opens, timeouts,
          and fallbacks. The synchronous model demonstrates transitions; it does
          not coordinate concurrent workers or persist a circuit across
          serverless invocations.
        </p>
      </section>
    </AdvancedLesson>
  )
}
