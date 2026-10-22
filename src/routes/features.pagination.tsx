import { createFileRoute, redirect } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { ListOrdered } from 'lucide-react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { IsolatedScenario } from '../components/IsolatedScenario'
import { CodeBlock } from '../components/CodeBlock'
import { labSearchSchema } from '../utils/labModels'
import type { FeedEvent } from '../utils/reliabilityModels'
import {
  deleteNewestFeedEvent,
  insertFeedEvent,
  readFeed,
} from '../utils/reliabilityServerFns'

export const Route = createFileRoute('/features/pagination')({
  validateSearch: labSearchSchema,
  beforeLoad: ({ search }) => {
    if (!search.workspace)
      throw redirect({
        to: '/features/pagination',
        search: { workspace: crypto.randomUUID() },
        replace: true,
      })
  },
  loaderDeps: ({ search }) => ({ workspace: search.workspace! }),
  loader: ({ deps }) => readFeed({ data: { ...deps, offset: 0, limit: 3 } }),
  head: () => ({
    meta: [{ title: 'Cursor pagination | TanStack Learning Lab' }],
  }),
  component: PaginationPage,
})

function PaginationPage() {
  const initial = Route.useLoaderData()
  const { workspace } = Route.useSearch()
  return (
    <PaginationExperiment
      key={workspace}
      workspace={workspace!}
      initial={initial}
    />
  )
}

type FeedPage = Awaited<ReturnType<typeof readFeed>>

function PaginationExperiment({
  workspace,
  initial,
}: {
  workspace: string
  initial: FeedPage
}) {
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [page, setPage] = useState(initial)
  const [limit, setLimit] = useState<3 | 5 | 8>(3)
  const [cursorRows, setCursorRows] = useState(initial.cursorItems)
  const [offsetRows, setOffsetRows] = useState(initial.offsetItems)
  const [error, setError] = useState('')
  const [needsRestart, setNeedsRestart] = useState(false)
  const [message, setMessage] = useState(
    'Both methods have loaded the same first page. Insert or delete a newest event, then load the next page.',
  )
  const more = page.cursorHasMore || page.offsetHasMore

  async function act(
    action: 'next' | 'restart' | 'insert' | 'delete',
    size = limit,
  ) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      if (action === 'insert') {
        const event = await insertFeedEvent({
          data: { workspace, expectedGeneration: page.generation },
        })
        setMessage(
          event.title +
            ' inserted at the beginning. Loaded rows stay unchanged; now load the next page.',
        )
      } else if (action === 'delete') {
        const removed = await deleteNewestFeedEvent({
          data: { workspace, expectedGeneration: page.generation },
        })
        setMessage(
          removed === null
            ? 'The server feed is empty.'
            : 'Event ' +
                removed +
                ' deleted from the beginning. Load the next page to compare what each method skips.',
        )
      } else {
        const restart = action === 'restart'
        const result = await readFeed({
          data: {
            workspace,
            offset: restart ? 0 : page.nextOffset,
            cursor: restart ? undefined : page.nextCursor,
            limit: size,
          },
        })
        setPage(result)
        setLimit(size)
        setCursorRows((current) =>
          restart ? result.cursorItems : [...current, ...result.cursorItems],
        )
        setOffsetRows((current) =>
          restart ? result.offsetItems : [...current, ...result.offsetItems],
        )
        setNeedsRestart(false)
        setMessage(
          restart
            ? 'Pagination restarted from the current server feed.'
            : 'Next page appended. Compare repeated IDs and the rows after the original page boundary.',
        )
      }
    } catch {
      setNeedsRestart(true)
      setError(
        action === 'insert' || action === 'delete'
          ? 'The workspace may have moved to another server, expired, or lost its connection. Restart pagination before making another change, or use the isolated walkthrough above on serverless hosting.'
          : 'Could not read this page. The cursor may be expired or invalid, or the connection failed. Restart pagination to recover.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <AdvancedLesson
      id="pagination"
      title="Cursor pagination & changing data"
      intro="Page numbers describe positions that can move. Compare offset pagination with a stable timestamp-and-ID cursor while records are inserted or deleted between requests."
      challenge="Load three rows, insert a newest event, then load more. Restart, delete a newest event, and repeat. Which method repeats a row, and which skips an unseen row?"
      solution="Inserting before an offset pushes an already-seen row into the next page; deleting before it pulls an unseen row behind the offset. A keyset cursor asks for rows strictly older than the last timestamp-and-ID pair, so changing earlier positions does not move its boundary. The unique ID breaks timestamp ties. It is still a live traversal: newly inserted rows above the cursor require a restart, and deleted rows cannot be recovered."
      docs={[
        {
          label: 'PostgreSQL LIMIT & OFFSET',
          href: 'https://www.postgresql.org/docs/current/queries-limit.html',
        },
        {
          label: 'Row comparisons for keysets',
          href: 'https://www.postgresql.org/docs/current/functions-comparisons.html#ROW-WISE-COMPARISON',
        },
      ]}
    >
      <IsolatedScenario topic="pagination" />
      <section
        className="demo-panel space-y-5"
        aria-labelledby="pagination-title"
        aria-busy={pending}
      >
        <h2
          id="pagination-title"
          className="text-xl font-bold flex gap-2 items-center"
        >
          <ListOrdered className="size-5" />
          One feed, two boundaries
        </h2>
        <p className="demo-muted text-sm">
          This live workspace requires one server process. Each request reads
          the same server feed for both methods. Rows sort by timestamp
          descending, then ID descending. Seeded pairs share timestamps so the
          tie-breaker matters.
        </p>
        <label className="block text-sm font-semibold max-w-xs">
          Rows per page
          <select
            className="demo-select mt-2"
            value={limit}
            disabled={pending}
            onChange={(event) =>
              void act('restart', Number(event.target.value) as 3 | 5 | 8)
            }
          >
            {[3, 5, 8].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="demo-button"
            disabled={pending || !more || needsRestart}
            onClick={() => void act('next')}
          >
            Load next page
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending || needsRestart}
            onClick={() => void act('insert')}
          >
            Insert newest event
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending || needsRestart}
            onClick={() => void act('delete')}
          >
            Delete newest event
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending}
            onClick={() => void act('restart')}
          >
            Restart pagination
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
        <div className="grid gap-4 md:grid-cols-2">
          <FeedRows
            title="Offset traversal"
            rows={offsetRows}
            hasMore={page.offsetHasMore}
          />
          <FeedRows
            title="Cursor traversal"
            rows={cursorRows}
            hasMore={page.cursorHasMore}
          />
        </div>
        <details className="lesson-details">
          <summary>Inspect the next page boundaries</summary>
          <p>
            Next offset: {page.nextOffset}. The cursor encodes the last
            timestamp and ID, workspace, and feed generation. It is validated on
            every request.
          </p>
          <p className="font-mono text-xs break-all">
            {page.nextCursor ?? 'No cursor: the feed is empty.'}
          </p>
        </details>
        <p className="text-xs demo-muted">
          Disposable sample feed: at most 40 events, 30-minute idle expiry,
          reset on restart or capacity eviction. Anyone with this workspace URL
          can change it. Base64 encoding is not authorization; real feeds must
          enforce access on every request.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="demo-panel">
          <h2 className="text-lg font-bold mb-4">
            Choose the contract deliberately
          </h2>
          <ol className="lesson-steps">
            <li>
              <strong>Use a unique order.</strong> A timestamp alone can lose
              rows that share the boundary timestamp.
            </li>
            <li>
              <strong>Anchor by values.</strong> Compare with the saved key even
              if the boundary row is later deleted.
            </li>
            <li>
              <strong>Bind the cursor.</strong> Validate format, scope, and feed
              generation. Expired cursors must restart.
            </li>
            <li>
              <strong>Know the limits.</strong> Keysets suit sequential
              traversal. Random page jumps and snapshot consistency require
              different contracts.
            </li>
          </ol>
          <p className="demo-alert text-sm mt-5">
            This runs over an in-memory array, so it makes no database
            performance claim. In SQL, use a matching composite index and fetch
            one extra row to detect whether another page exists. Sort keys must
            remain stable.
          </p>
        </div>
        <div className="min-w-0">
          <CodeBlock
            title="Keyset query (illustrative SQL)"
            language="sql"
            code={[
              'SELECT id, created_at, title',
              'FROM events',
              'WHERE workspace_id = :workspace',
              '  AND (created_at, id) < (:last_time, :last_id)',
              'ORDER BY created_at DESC, id DESC',
              'LIMIT :page_size_plus_one;',
              '',
              '-- Scope access before returning rows.',
              '-- Index: (workspace_id, created_at DESC, id DESC)',
              '-- First page omits the boundary comparison.',
            ].join('\n')}
          />
        </div>
      </section>
    </AdvancedLesson>
  )
}

function FeedRows({
  title,
  rows,
  hasMore,
}: {
  title: string
  rows: FeedEvent[]
  hasMore: boolean
}) {
  const seen = new Set<number>()
  const duplicates = rows.length - new Set(rows.map((row) => row.id)).size
  return (
    <section className="lab-snapshot" aria-label={title}>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm demo-muted mt-2 mb-4">
        {duplicates} repeated {duplicates === 1 ? 'ID' : 'IDs'} · {rows.length}{' '}
        rows received
      </p>
      <ol className="space-y-2">
        {rows.map((row, index) => {
          const repeated = seen.has(row.id)
          seen.add(row.id)
          return (
            <li key={index + '-' + row.id} className="demo-list-item text-sm">
              <strong>{row.title}</strong>
              {repeated && <span className="demo-pill ml-2">Repeated</span>}
              <p className="text-xs demo-muted mt-1">
                Timestamp {row.createdAt} · ID {row.id}
              </p>
            </li>
          )
        })}
      </ol>
      <p className="text-xs demo-muted mt-4">
        {hasMore
          ? 'More rows available at the last read.'
          : 'End reached at the last read.'}
      </p>
    </section>
  )
}
