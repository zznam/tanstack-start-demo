import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Play, Workflow } from 'lucide-react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { CodeBlock } from '../components/CodeBlock'
import { loadServices } from '../utils/labServerFns'

export const Route = createFileRoute('/features/parallel')({
  head: () => ({
    meta: [{ title: 'Parallel Loading & Resilience | TanStack Learning Lab' }],
  }),
  component: ParallelPage,
})

type Run = Awaited<ReturnType<typeof loadServices>>

function ParallelPage() {
  const [strategy, setStrategy] = useState<'parallel' | 'sequential'>(
    'parallel',
  )
  const [failure, setFailure] = useState<
    'none' | 'catalog' | 'recommendations'
  >('none')
  const [result, setResult] = useState<Run | null>(null)
  const [previous, setPrevious] = useState<Run | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function run() {
    setPending(true)
    setError('')
    try {
      const next = await loadServices({ data: { strategy, failure } })
      setPrevious(result)
      setResult(next)
    } catch {
      setError(
        'The experiment request failed. Your previous results are preserved; try again.',
      )
    } finally {
      setPending(false)
    }
  }
  const criticalFailure = result?.services.some(
    (service) => service.required && service.status === 'rejected',
  )
  const optionalFailure = result?.services.some(
    (service) => !service.required && service.status === 'rejected',
  )
  const timelineMax = result
    ? Math.max(
        result.elapsedMs,
        ...result.services.map(
          (service) => service.startedMs + service.durationMs,
        ),
        1,
      )
    : 1
  return (
    <AdvancedLesson
      id="parallel"
      title="Parallel loading & resilience"
      intro="Independent requests should not wait for one another. Compare real server timings, then take an optional service offline and keep useful content on screen."
      challenge="Run sequential and parallel loading with healthy services. Then fail recommendations. What changes if the required catalog fails instead?"
      solution="Sequential loading takes roughly the sum of 160ms, 340ms, and 520ms; parallel loading takes roughly the longest delay, plus scheduling overhead. Promise.allSettled preserves every outcome so optional failures can become local fallbacks. A required failure must still prevent the core view from pretending to be complete. Promise.all rejects as soon as an input rejects, but does not cancel the other work."
      docs={[
        {
          label: 'Router parallel data loading',
          href: 'https://tanstack.com/router/latest/docs/framework/react/guide/data-loading',
        },
        {
          label: 'Deferred data loading',
          href: 'https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading',
        },
      ]}
    >
      <section
        className="demo-panel space-y-5"
        aria-labelledby="parallel-experiment-title"
        aria-busy={pending}
      >
        <h2
          id="parallel-experiment-title"
          className="text-xl font-bold flex items-center gap-2"
        >
          <Workflow className="size-5" />A resilient product dashboard
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Loading strategy
            <select
              className="demo-select mt-2"
              value={strategy}
              disabled={pending}
              onChange={(event) =>
                setStrategy(event.target.value as typeof strategy)
              }
            >
              <option value="parallel">Parallel · start together</option>
              <option value="sequential">Sequential · one at a time</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Service failure
            <select
              className="demo-select mt-2"
              value={failure}
              disabled={pending}
              onChange={(event) =>
                setFailure(event.target.value as typeof failure)
              }
            >
              <option value="none">All services healthy</option>
              <option value="recommendations">
                Recommendations unavailable (optional)
              </option>
              <option value="catalog">Catalog unavailable (required)</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          className="demo-button"
          disabled={pending}
          onClick={run}
        >
          <Play className="size-4" />
          {pending ? 'Running experiment…' : 'Run loading experiment'}
        </button>
        <p role="status" className="demo-muted text-sm">
          {pending
            ? 'Calling the server and measuring each service…'
            : result
              ? `${result.strategy === 'parallel' ? 'Parallel' : 'Sequential'} run finished in ${result.elapsedMs}ms. ${criticalFailure ? 'Required service failed.' : optionalFailure ? 'Optional failure isolated.' : 'All services healthy.'}`
              : 'Simulated service delays: catalog 160ms, inventory 340ms, recommendations 520ms. No requests run until you start.'}
        </p>
        {error && (
          <p role="alert" className="demo-alert demo-alert-danger text-sm">
            {error}
          </p>
        )}
        {result && (
          <>
            <div className="lab-snapshot">
              <div className="flex flex-wrap justify-between gap-3 mb-5">
                <div>
                  <p className="island-kicker mb-1">Measured on the server</p>
                  <p
                    className="text-3xl font-bold"
                    data-testid="parallel-duration"
                  >
                    {result.elapsedMs} ms
                  </p>
                </div>
                {previous && (
                  <p className="demo-muted text-sm self-end">
                    Previous {previous.strategy} run: {previous.elapsedMs}ms
                  </p>
                )}
              </div>
              <ol className="space-y-5" aria-label="Service timing results">
                {result.services.map((service) => (
                  <li key={service.id}>
                    <div className="flex flex-wrap justify-between gap-2 text-sm mb-2">
                      <strong>
                        {service.label}{' '}
                        <span className="font-normal demo-muted">
                          ({service.required ? 'required' : 'optional'})
                        </span>
                      </strong>
                      <span className="demo-muted">
                        Start {service.startedMs}ms · {service.durationMs}ms ·{' '}
                        {service.status === 'fulfilled' ? 'Ready' : 'Failed'}
                      </span>
                    </div>
                    <div className="service-track" aria-hidden="true">
                      <div
                        className={`service-bar ${service.status === 'rejected' ? 'service-bar-failed' : ''}`}
                        style={{
                          marginLeft: `${(service.startedMs / timelineMax) * 100}%`,
                          width: `${(service.durationMs / timelineMax) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <section
              className={`demo-alert ${criticalFailure ? 'demo-alert-danger' : ''}`}
              aria-label="Dashboard result"
            >
              <h3 className="font-bold mb-3">
                {criticalFailure
                  ? 'Core dashboard unavailable'
                  : optionalFailure
                    ? 'Dashboard ready with a fallback'
                    : 'Dashboard ready'}
              </h3>
              {criticalFailure ? (
                <p className="text-sm">
                  The product catalog is required. Keep the page shell and retry
                  controls, but do not render a complete-looking product
                  dashboard.
                </p>
              ) : (
                <ul className="text-sm space-y-2">
                  {result.services.map((service) => (
                    <li key={service.id}>
                      <strong>{service.label}:</strong>{' '}
                      {service.status === 'fulfilled'
                        ? service.value
                        : 'Suggestions are unavailable. Browse the catalog instead.'}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="demo-panel">
          <h2 className="text-lg font-bold mb-3">
            Choose the failure boundary
          </h2>
          <ol className="lesson-steps">
            <li>
              <strong>Start independent work together.</strong> Awaiting catalog
              before starting inventory creates a waterfall when no dependency
              exists.
            </li>
            <li>
              <strong>Classify dependencies.</strong> Required data gates the
              core view. Optional widgets get a fallback and can be retried
              independently in a larger app.
            </li>
            <li>
              <strong>Observe actual timings.</strong> The timeline uses
              measured start and completion times, not an animation of expected
              durations.
            </li>
            <li>
              <strong>Bound the waiting.</strong> allSettled waits for every
              promise. Real network clients still need timeouts and cancellation
              for hung services.
            </li>
          </ol>
          <p className="text-sm demo-muted mt-5">
            This lab awaits the whole batch to compare timings. The streaming
            lesson shows how to reveal independent sections as they resolve.
          </p>
        </div>
        <div className="min-w-0">
          <CodeBlock
            title="Parallel requests, explicit fallbacks"
            code={`// Start every independent service immediately.
const results = await Promise.allSettled([
  fetchCatalog(),
  fetchInventory(),
  fetchRecommendations(),
])
const [catalog, inventory, recommendations] = results

if (catalog.status === 'rejected') {
  return { kind: 'core-unavailable' }
}
return {
  kind: 'ready',
  catalog: catalog.value,
  inventory: inventory.status === 'fulfilled'
    ? inventory.value : null,
  recommendations: recommendations.status === 'fulfilled'
    ? recommendations.value : [],
}`}
          />
        </div>
      </section>
    </AdvancedLesson>
  )
}
