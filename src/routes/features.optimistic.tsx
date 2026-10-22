import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, Circle, GitMerge, RefreshCw, Users } from 'lucide-react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { CodeBlock } from '../components/CodeBlock'
import { labSearchSchema } from '../utils/labModels'
import type { TaskSnapshot } from '../utils/labModels'
import { competingEdit, readTask, updateTask } from '../utils/labServerFns'

export const Route = createFileRoute('/features/optimistic')({
  validateSearch: (search) => labSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (!search.workspace)
      throw redirect({
        to: '/features/optimistic',
        search: { workspace: crypto.randomUUID() },
        replace: true,
      })
  },
  loaderDeps: ({ search }) => ({ workspace: search.workspace! }),
  loader: ({ deps }) => readTask({ data: deps }),
  head: () => ({
    meta: [{ title: 'Optimistic Updates & Conflicts | TanStack Learning Lab' }],
  }),
  component: OptimisticPage,
})

function OptimisticPage() {
  const initial = Route.useLoaderData()
  const { workspace } = Route.useSearch()
  return (
    <OptimisticExperiment
      key={workspace}
      initial={initial}
      workspace={workspace!}
    />
  )
}

function OptimisticExperiment({
  initial,
  workspace,
}: {
  initial: TaskSnapshot
  workspace: string
}) {
  const [confirmed, setConfirmed] = useState(initial)
  const [visible, setVisible] = useState(initial)
  const [reject, setReject] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState(
    'Toggle the task and watch the UI update before the 800ms server response.',
  )
  const [error, setError] = useState('')
  const [needsRefresh, setNeedsRefresh] = useState(false)
  async function mutate() {
    const next = { ...confirmed, done: !visible.done }
    setVisible(next)
    setPending(true)
    setError('')
    setMessage('Optimistic change visible. Waiting for server confirmation…')
    try {
      const result = await updateTask({
        data: {
          workspace,
          expectedVersion: confirmed.version,
          done: next.done,
          reject,
        },
      })
      setVisible(result.current)
      setConfirmed(result.current)
      setReject(false)
      setMessage(
        result.status === 'saved'
          ? `Saved version ${result.current.version}. The server confirmed the optimistic change.`
          : result.status === 'rejected'
            ? 'Write rejected. Rolled back to the server snapshot.'
            : `Version conflict. Your stale write was not applied; reconciled to server version ${result.current.version}. Review the latest state before trying again.`,
      )
    } catch {
      setVisible(confirmed)
      setNeedsRefresh(true)
      setError(
        'Request failed. The local change was rolled back, but the server may have received the write. Load the latest version before retrying.',
      )
    } finally {
      setPending(false)
    }
  }
  async function inspect(action: 'compete' | 'refresh') {
    setPending(true)
    setError('')
    try {
      if (action === 'compete') {
        const result = await competingEdit({ data: { workspace } })
        setMessage(
          `Another client saved version ${result.version}. Your local version ${confirmed.version} is deliberately unchanged. Toggle the task to discover the conflict.`,
        )
      } else {
        const result = await readTask({ data: { workspace } })
        setConfirmed(result)
        setVisible(result)
        setNeedsRefresh(false)
        setMessage(`Loaded server version ${result.version}. Ready to edit.`)
      }
    } catch {
      setError(
        'Could not reach the server. Try loading the latest version again.',
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <AdvancedLesson
      id="optimistic"
      title="Optimistic updates & conflicts"
      intro="Fast feedback needs a recovery plan. Apply an optimistic change, reject it safely, and use a server-side version check to prevent a stale client from overwriting someone else’s work."
      challenge="Simulate another client edit, then toggle the task. Which version should win? Next, reject a write and compare the pending state with the final state."
      solution="The client sends expectedVersion with the proposed change. The server compares and writes in one synchronous step in this demo. A mismatch returns the current snapshot without applying the stale update. Rejected writes also return the authoritative snapshot. A database implementation needs an atomic conditional UPDATE (WHERE version = expectedVersion), not a separate read followed by an unconditional write."
      docs={[
        {
          label: 'Router data mutations',
          href: 'https://tanstack.com/router/latest/docs/framework/react/guide/data-mutations',
        },
        {
          label: 'Typed server functions',
          href: 'https://tanstack.com/start/latest/docs/framework/react/guide/server-functions',
        },
      ]}
    >
      <section
        className="demo-panel space-y-5"
        aria-labelledby="optimistic-experiment-title"
        aria-busy={pending}
      >
        <h2
          id="optimistic-experiment-title"
          className="text-xl font-bold flex items-center gap-2"
        >
          <GitMerge className="size-5" />A task with two editors
        </h2>
        <div className="lab-snapshot flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="island-kicker mb-2">Your local view</p>
            <p
              className={`text-xl font-bold ${visible.done ? 'line-through' : ''}`}
            >
              {visible.title}
            </p>
            <p className="text-sm demo-muted mt-2" data-testid="task-state">
              {visible.done ? 'Complete' : 'Incomplete'} · Version{' '}
              {confirmed.version}
              {pending ? ' · Request pending' : ''}
            </p>
          </div>
          <button
            type="button"
            className="demo-button"
            disabled={pending || needsRefresh}
            aria-pressed={visible.done}
            onClick={mutate}
          >
            {visible.done ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Circle className="size-5" />
            )}
            Toggle task
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="demo-list-item">
            <span className="demo-muted">Visible state</span>
            <strong className="block mt-1" data-testid="optimistic-visible">
              {visible.done ? 'Complete' : 'Incomplete'}
            </strong>
          </div>
          <div className="demo-list-item">
            <span className="demo-muted">Last confirmed state</span>
            <strong className="block mt-1" data-testid="optimistic-confirmed">
              {confirmed.done ? 'Complete' : 'Incomplete'} (v{confirmed.version}
              )
            </strong>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={reject}
            disabled={pending}
            onChange={(event) => setReject(event.target.checked)}
            className="size-4 accent-[var(--palm)]"
          />
          Reject the next write on the server
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending || needsRefresh}
            onClick={() => inspect('compete')}
          >
            <Users className="size-4" />
            Simulate another client edit
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending}
            onClick={() => inspect('refresh')}
          >
            <RefreshCw className="size-4" />
            Load latest version
          </button>
        </div>
        <p role="status" className="text-sm demo-muted">
          {message}
        </p>
        {error && (
          <p role="alert" className="demo-alert demo-alert-danger text-sm">
            {error}
          </p>
        )}
        <p className="text-xs demo-muted">
          800ms of artificial server latency. One write at a time from this
          view. The competing editor makes a real server mutation in this
          disposable workspace.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="demo-panel">
          <h2 className="text-lg font-bold mb-3">
            Three outcomes, three decisions
          </h2>
          <ol className="lesson-steps">
            <li>
              <strong>Accepted.</strong> Replace the prediction with the
              authoritative response, including its new version.
            </li>
            <li>
              <strong>Rejected.</strong> Restore the server snapshot. A
              validation failure must not leave a success-looking UI behind.
            </li>
            <li>
              <strong>Conflict.</strong> Keep the newer server version and ask
              the person to review it before retrying. Silent retries can
              overwrite intent.
            </li>
          </ol>
          <p className="demo-alert text-sm mt-5">
            A transport error is ambiguous: a write may have committed before
            its response was lost. This lab requires a fresh read before another
            write. Production retryable operations may also need idempotency
            keys.
          </p>
        </div>
        <div className="min-w-0">
          <CodeBlock
            title="Compare and write on the server"
            code={`// In the server store, after simulated latency:
if (reject) return { status: 'rejected', current: task }
if (task.version !== expectedVersion) {
  return { status: 'conflict', current: task }
}
task = { ...task, done, version: task.version + 1 }
return { status: 'saved', current: task }

// In the client event handler:
setVisible({ ...confirmed, done: !confirmed.done })
const result = await updateTask({ data: {
  workspace, expectedVersion: confirmed.version,
  done: !confirmed.done, reject,
} })
setVisible(result.current)
setConfirmed(result.current)`}
          />
        </div>
      </section>
    </AdvancedLesson>
  )
}
