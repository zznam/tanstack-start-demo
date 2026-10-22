import { useRef, useState, useSyncExternalStore } from 'react'
import { runIsolatedScenario } from '../utils/reliabilityServerFns'

const options = {
  idempotency: [
    { value: 'concurrent', label: 'Concurrent duplicates' },
    { value: 'lost-response', label: 'Lost response, then retry' },
    { value: 'payload-conflict', label: 'Same key, different payload' },
  ],
  pagination: [
    { value: 'insert', label: 'Insert before the next page' },
    { value: 'delete', label: 'Delete before the next page' },
  ],
} as const
const subscribe = () => () => {}

export function IsolatedScenario({ topic }: { topic: keyof typeof options }) {
  const choices = options[topic]
  type Scenario = (typeof options)[keyof typeof options][number]['value']
  const [scenario, setScenario] = useState<Scenario>(choices[0].value)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof runIsolatedScenario>
  > | null>(null)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  async function run() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setResult(null)
    try {
      setResult(await runIsolatedScenario({ data: { scenario } }))
    } catch {
      setError(
        'The walkthrough could not finish. Try again; every run starts fresh.',
      )
    } finally {
      setPending(false)
      busy.current = false
    }
  }
  return (
    <section
      className="demo-panel space-y-4"
      aria-label="Isolated server walkthrough"
      aria-busy={pending}
    >
      <p className="island-kicker">Works across hosting environments</p>
      <h2 className="text-xl font-bold">Run the complete story</h2>
      <p className="text-sm demo-muted leading-relaxed">
        This walkthrough executes the whole sequence in one server request with
        fresh sample data. It demonstrates the algorithm without relying on
        memory shared between requests. Use it on serverless hosts; explore the
        live workspace below on a single-process server.
      </p>
      <label className="block text-sm font-semibold max-w-sm">
        Walkthrough scenario
        <select
          className="demo-select mt-2"
          value={scenario}
          disabled={pending || !hydrated}
          onChange={(event) => {
            setScenario(event.target.value as Scenario)
            setResult(null)
            setError('')
          }}
        >
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="demo-button"
        disabled={pending || !hydrated}
        onClick={() => void run()}
      >
        Run isolated walkthrough
      </button>
      <p role="status" className="text-sm demo-muted">
        {pending
          ? 'Running the sequence on the server…'
          : result
            ? 'Walkthrough complete.'
            : 'Choose a scenario, then run it.'}
      </p>
      {error && (
        <p role="alert" className="demo-alert demo-alert-danger text-sm">
          {error}
        </p>
      )}
      {result && (
        <div className="lab-snapshot" data-testid="scenario-result">
          <h3 className="font-bold mb-3">{result.title}</h3>
          <ol className="lesson-steps">
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
