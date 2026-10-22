import { createFileRoute, redirect } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { KeyRound, Repeat2 } from 'lucide-react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { IsolatedScenario } from '../components/IsolatedScenario'
import { CodeBlock } from '../components/CodeBlock'
import { reservationSearchSchema } from '../utils/reliabilityModels'
import type {
  ReservationResult,
  ReservationState,
} from '../utils/reliabilityModels'
import { readReservations, reserveSeats } from '../utils/reliabilityServerFns'

export const Route = createFileRoute('/features/idempotency')({
  validateSearch: reservationSearchSchema,
  beforeLoad: ({ search }) => {
    if (!search.workspace || !search.request)
      throw redirect({
        to: '/features/idempotency',
        search: {
          ...search,
          workspace: search.workspace ?? crypto.randomUUID(),
          request: search.request ?? crypto.randomUUID(),
        },
        replace: true,
      })
  },
  loaderDeps: ({ search }) => ({
    workspace: search.workspace!,
    request: search.request!,
  }),
  loader: ({ deps }) =>
    readReservations({ data: { workspace: deps.workspace } }),
  head: () => ({
    meta: [{ title: 'Idempotent mutations | TanStack Learning Lab' }],
  }),
  component: IdempotencyPage,
})

function IdempotencyPage() {
  const search = Route.useSearch()
  const initial = Route.useLoaderData()
  return (
    <ReservationExperiment
      key={search.workspace! + search.request!}
      initial={initial}
    />
  )
}

function ReservationExperiment({ initial }: { initial: ReservationState }) {
  const { workspace, request, quantity = 2 } = Route.useSearch()
  const navigate = Route.useNavigate()
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [dropResponse, setDropResponse] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [scopeLost, setScopeLost] = useState(false)
  const [state, setState] = useState(initial)
  const [result, setResult] = useState<ReservationResult | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(
    'Send the same request twice. Only the first successful request reserves seats.',
  )

  async function send(copies: number) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const results = await Promise.all(
        Array.from({ length: copies }, () =>
          reserveSeats({
            data: {
              workspace: workspace!,
              request: request!,
              quantity,
              dropResponse,
              expectedGeneration: initial.generation,
            },
          }),
        ),
      )
      const last = results[results.length - 1]!
      if (results.some((item) => item.status === 'expired')) {
        const confirmed = results.find((item) => item.status !== 'expired')
        if (confirmed) {
          setState(confirmed.state)
          setResult(confirmed)
        }
        setScopeLost(true)
        setUncertain(true)
        setError(
          'The workspace expired or a request reached a different server. Live writes are paused to avoid creating a duplicate in another store. A concurrent request may have committed. Use the isolated walkthrough above; a shared durable store is required across servers.',
        )
        return
      }
      setResult(last)
      setState(last.state)
      setUncertain(false)
      const messages = {
        created: 'Created: seats reserved once.',
        replayed:
          'Replayed: the original receipt returned; no extra seats reserved.',
        conflict:
          'Key conflict: this key already belongs to a different quantity. Restore that quantity or start a new request.',
        'sold-out': 'Not enough seats remain. No reservation was created.',
        expired: 'Workspace unavailable.',
      }
      setMessage(
        copies === 2 &&
          results.filter((item) => item.status === 'created').length === 1 &&
          results.filter((item) => item.status === 'replayed').length === 1
          ? 'Concurrent requests: one created, one replayed. A single reservation was committed.'
          : messages[last.status],
      )
    } catch {
      setUncertain(true)
      setError(
        'No confirmation received. The server may have committed the reservation. Retry this same key and quantity to learn the outcome.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <AdvancedLesson
      id="idempotency"
      title="Idempotent mutations & safe retries"
      intro="A failed response does not prove a failed write. Use one stable request key per operation to recover a result without repeating its side effect."
      challenge="Enable response loss, send a reservation, then retry. Next, change the quantity while keeping the same key. Why must the server refuse that change?"
      solution="The first request commits a reservation and stores its receipt before the simulated response error. Retrying the same key and payload replays that receipt. Changing the payload with that key is a conflict, not another operation. A fresh intentional reservation needs a new key. This demo remembers successful writes only, within one disposable server workspace."
      docs={[
        {
          label: 'Idempotent request design',
          href: 'https://docs.stripe.com/api/idempotent_requests',
        },
        {
          label: 'TanStack server functions',
          href: 'https://tanstack.com/start/latest/docs/framework/react/guide/server-functions',
        },
      ]}
    >
      <IsolatedScenario topic="idempotency" />
      <section
        className="demo-panel space-y-5"
        aria-labelledby="reservation-title"
        aria-busy={pending}
      >
        <h2
          id="reservation-title"
          className="text-xl font-bold flex items-center gap-2"
        >
          <Repeat2 className="size-5" />
          Reserve workshop seats
        </h2>
        <p className="demo-muted text-sm">
          This live workspace requires one server process. A real server
          function reserves from 20 sample seats. No payment or account is
          involved. The 350 ms delay and response-loss switch are deliberate
          fault injection.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="lab-snapshot">
            <p className="island-kicker mb-3">Last server confirmation</p>
            <p
              className="text-3xl font-bold"
              data-testid="reservation-remaining"
            >
              {state.remaining} seats left
            </p>
            <p
              className="text-sm demo-muted mt-2"
              data-testid="reservation-count"
            >
              {state.reservations}{' '}
              {state.reservations === 1 ? 'reservation' : 'reservations'}{' '}
              committed
            </p>
            {uncertain && (
              <p className="text-sm mt-3">
                This snapshot may be behind the server.
              </p>
            )}
          </div>
          <div className="lab-snapshot">
            <p className="island-kicker mb-3">Original receipt</p>
            <p
              className="text-sm leading-relaxed"
              data-testid="reservation-receipt"
            >
              {result?.receipt
                ? 'Reservation #' +
                  result.receipt.id +
                  ' · ' +
                  result.receipt.quantity +
                  ' seats · ' +
                  result.receipt.remaining +
                  ' seats remained at commit'
                : 'No receipt confirmed yet.'}
            </p>
            <p className="text-xs demo-muted mt-3">
              A replay preserves the original receipt even if later reservations
              change availability.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold flex gap-2 items-center">
            <KeyRound className="size-4" />
            Current request key
          </p>
          <p className="font-mono text-xs break-all" data-testid="request-key">
            {request}
          </p>
          <p className="text-xs demo-muted">
            The key and quantity stay in the URL so a reload can retry the same
            operation.
          </p>
        </div>
        <label className="block text-sm font-semibold max-w-xs">
          Seats to reserve
          <select
            className="demo-select mt-2"
            value={quantity}
            disabled={pending || uncertain}
            onChange={(event) =>
              void navigate({
                search: (previous) => ({
                  ...previous,
                  quantity: Number(event.target.value),
                }),
                replace: true,
                resetScroll: false,
              })
            }
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} seats
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-2 items-center text-sm demo-muted">
          <input
            type="checkbox"
            className="size-4"
            checked={dropResponse}
            disabled={pending}
            onChange={(event) => setDropResponse(event.target.checked)}
          />
          Lose the response after a new reservation commits
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="demo-button"
            disabled={pending || scopeLost}
            onClick={() => void send(1)}
          >
            Send / retry request
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending || uncertain}
            onClick={() => void send(2)}
          >
            Send concurrent duplicates
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending || uncertain}
            onClick={() =>
              void navigate({
                search: (previous) => ({
                  ...previous,
                  request: crypto.randomUUID(),
                }),
                resetScroll: false,
              })
            }
          >
            New request key
          </button>
        </div>
        <p role="status" className="text-sm demo-muted">
          {pending ? 'Waiting for server…' : message}
        </p>
        {error && (
          <p role="alert" className="demo-alert demo-alert-danger text-sm">
            {error}
          </p>
        )}
        <p className="text-xs demo-muted">
          Sample data is shared by anyone with this workspace URL. It resets
          after 30 minutes idle, server restart, or capacity eviction. A key
          cannot protect a write after its record expires.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="demo-panel">
          <h2 className="text-lg font-bold mb-4">The transaction boundary</h2>
          <ol className="lesson-steps">
            <li>
              <strong>Keep the key stable.</strong> Retries reuse both the key
              and the original payload.
            </li>
            <li>
              <strong>Compare the payload.</strong> The same key must never
              silently describe a different operation.
            </li>
            <li>
              <strong>Commit atomically.</strong> Store the side effect and
              receipt together. Concurrent duplicates must not both pass the
              lookup.
            </li>
            <li>
              <strong>Keep the original result.</strong> A replay returns the
              receipt, not a second reservation.
            </li>
          </ol>
          <p className="demo-alert text-sm mt-5">
            This lab uses one process and synchronous commits. Production needs
            authenticated key scoping, durable transactions, a unique
            constraint, and a documented retention policy. It does not
            demonstrate exactly-once delivery across servers.
          </p>
        </div>
        <div className="min-w-0">
          <CodeBlock
            title="Atomic operation pattern (pseudocode)"
            code={[
              'transaction(() => {',
              '  const prior = findReceipt(actor, operation, key)',
              '  if (prior) {',
              '    assertSamePayload(prior, payload)',
              '    return prior.result',
              '  }',
              '  const result = reserveSeats(payload)',
              '  insertReceipt({ actor, operation, key, payload, result })',
              '  return result',
              '})',
              '// Unique constraint: (actor, operation, key)',
              '// Receipt and reservation commit together.',
            ].join('\n')}
          />
        </div>
      </section>
    </AdvancedLesson>
  )
}
