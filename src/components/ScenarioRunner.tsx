import { useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { ScenarioReport } from '../utils/scenarioReport'

const subscribe = () => () => {}

export function ScenarioRunner({
  title,
  run,
  children,
}: {
  title: string
  run: () => Promise<ScenarioReport>
  children: ReactNode
}) {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ScenarioReport | null>(null)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  async function execute() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setResult(null)
    try {
      setResult(await run())
    } catch {
      setError(
        'The server could not finish this run. Try again; every run starts with fresh sample data.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <section
      className="demo-panel space-y-5"
      aria-label={title}
      aria-busy={pending}
    >
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm demo-muted leading-relaxed">
        Every run executes the algorithm in one server request with fresh sample
        data. Faults and time are simulated; no external service is contacted
        and no data survives the run.
      </p>
      <fieldset
        disabled={pending || !hydrated}
        onChange={() => {
          setResult(null)
          setError('')
        }}
      >
        <legend className="sr-only">Experiment settings</legend>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
      </fieldset>
      <button
        className="demo-button"
        type="button"
        disabled={pending || !hydrated}
        onClick={() => void execute()}
      >
        {pending ? 'Running scenario…' : 'Run scenario'}
      </button>
      <p role="status" className="text-sm demo-muted">
        {pending
          ? 'Running the experiment on the server…'
          : result
            ? 'Scenario complete. Explore the results and event trace below.'
            : 'Choose settings, then run the scenario.'}
      </p>
      {error && (
        <p role="alert" className="demo-alert demo-alert-danger">
          {error}
        </p>
      )}
      {result && (
        <div data-testid="experiment-result" className="space-y-5">
          <div className="lab-snapshot">
            <h3 className="font-bold text-lg mb-2">{result.title}</h3>
            <p className="text-sm demo-muted leading-relaxed">
              {result.summary}
            </p>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {result.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs demo-muted">{metric.label}</dt>
                  <dd
                    className="font-bold text-2xl mt-1"
                    data-testid={`metric-${metric.label.toLowerCase().replaceAll(' ', '-')}`}
                  >
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <details className="lesson-details" open>
            <summary>
              Inspect the event trace ({result.steps.length} steps)
            </summary>
            <ol className="lesson-steps mt-4">
              {result.steps.map((step, index) => (
                <li key={index}>
                  <strong>{step.label}</strong>
                  <p className="mt-1">{step.detail}</p>
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}
    </section>
  )
}
