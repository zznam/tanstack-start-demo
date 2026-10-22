import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { Database, RefreshCw, Upload } from 'lucide-react'
import { AdvancedLesson } from '../components/AdvancedLesson'
import { CodeBlock } from '../components/CodeBlock'
import { cacheSearchSchema } from '../utils/labModels'
import { publishBuild, readCachedProject } from '../utils/labServerFns'

export const Route = createFileRoute('/features/caching')({
  validateSearch: (search) => cacheSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (!search.workspace)
      throw redirect({
        to: '/features/caching',
        search: { ...search, workspace: crypto.randomUUID() },
        replace: true,
      })
  },
  loaderDeps: ({ search }) => ({
    workspace: search.workspace!,
    project: search.project,
  }),
  loader: ({ deps }) => readCachedProject({ data: deps }),
  staleTime: 60_000,
  preloadStaleTime: 60_000,
  gcTime: 300_000,
  head: () => ({
    meta: [{ title: 'Caching & Revalidation | TanStack Learning Lab' }],
  }),
  component: CachingPage,
})

function CachingPage() {
  const snapshot = Route.useLoaderData()
  const { workspace, project } = Route.useSearch()
  return (
    <CacheExperiment
      key={`${workspace}/${project}`}
      workspace={workspace!}
      project={project}
      snapshot={snapshot}
    />
  )
}

function CacheExperiment({
  workspace,
  project,
  snapshot,
}: {
  workspace: string
  project: 'frontend' | 'backend'
  snapshot: Awaited<ReturnType<typeof readCachedProject>>
}) {
  const router = useRouter()
  const [published, setPublished] = useState<{
    revision: number
    builds: number
  } | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState(
    'Publish a build without invalidating the loader. The two snapshots will diverge.',
  )
  const [error, setError] = useState('')
  async function act(action: 'publish' | 'refresh') {
    setPending(true)
    setError('')
    try {
      if (action === 'publish') {
        const result = await publishBuild({ data: { workspace, project } })
        setPublished(result)
        setMessage(
          `Server saved revision ${result.revision}. The loader still shows revision ${snapshot.revision}; a write does not invalidate it automatically.`,
        )
      } else {
        await router.invalidate({
          filter: (match) => match.routeId === Route.id,
          sync: true,
        })
        setMessage(
          'Loader revalidated. Its snapshot now reflects the current server state.',
        )
      }
    } catch {
      setError(
        'The request failed. Try revalidating to read the latest server state.',
      )
    } finally {
      setPending(false)
    }
  }
  const differs = published !== null && published.revision > snapshot.revision
  const latestConfirmation = differs ? published : snapshot
  return (
    <AdvancedLesson
      id="caching"
      title="Caching & revalidation"
      intro="A mutation can succeed while your screen still shows old data. Learn how route cache keys, freshness windows, and explicit invalidation work together."
      challenge="Publish a build, switch projects, then return within 60 seconds. Why can the old revision still be visible? Revalidate and compare the read counter."
      solution="The route cache is keyed by pathname and loaderDeps, including the workspace and project. Each project has its own snapshot. staleTime allows reuse on navigation for 60 seconds; it does not poll, and publishing does not mark cached data stale. Invalidation marks matching entries stale and reloads active data. After the freshness window, a later navigation can show cached data while it revalidates."
      docs={[
        {
          label: 'Router data loading & caching',
          href: 'https://tanstack.com/router/latest/docs/framework/react/guide/data-loading',
        },
        {
          label: 'Data mutations',
          href: 'https://tanstack.com/router/latest/docs/framework/react/guide/data-mutations',
        },
      ]}
    >
      <section
        className="demo-panel space-y-5"
        aria-labelledby="cache-experiment-title"
        aria-busy={pending}
      >
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <h2
            id="cache-experiment-title"
            className="text-xl font-bold flex gap-2 items-center"
          >
            <Database className="size-5" />
            Two sources of truth?
          </h2>
          <span className="demo-pill">60s freshness · 5m retention</span>
        </div>
        <p className="demo-muted text-sm">
          Use the project links to navigate between distinct cache keys. A build
          increments server data without refreshing the loader.
        </p>
        <nav className="flex flex-wrap gap-2" aria-label="Cached project">
          {(['frontend', 'backend'] as const).map((item) => (
            <Link
              key={item}
              to="/features/caching"
              search={{ workspace, project: item }}
              preload={false}
              aria-current={project === item ? 'page' : undefined}
              className={`topic-filter no-underline ${project === item ? 'is-selected' : ''}`}
            >
              {item === 'frontend' ? 'Frontend project' : 'Backend project'}
            </Link>
          ))}
        </nav>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="lab-snapshot" data-testid="cache-loader">
            <p className="island-kicker mb-3">Loader snapshot</p>
            <p className="text-3xl font-bold mb-2">{snapshot.builds} builds</p>
            <p className="text-sm demo-muted">
              Revision {snapshot.revision} · Server read #{snapshot.reads}
            </p>
            <p className="text-xs demo-muted mt-3">
              Fetched: {snapshot.fetchedAt}
            </p>
          </div>
          <div className="lab-snapshot" data-testid="cache-server">
            <p className="island-kicker mb-3">Last server confirmation</p>
            <p className="text-3xl font-bold mb-2">
              {latestConfirmation.builds} builds
            </p>
            <p className="text-sm demo-muted">
              Revision {latestConfirmation.revision} ·{' '}
              {differs ? 'Loader is behind' : 'Snapshots agree'}
            </p>
            <p className="text-xs demo-muted mt-3">
              This reflects the latest response observed on this screen.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="demo-button"
            disabled={pending}
            onClick={() => act('publish')}
          >
            <Upload className="size-4" />
            Publish build without invalidation
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            disabled={pending}
            onClick={() => act('refresh')}
          >
            <RefreshCw className={`size-4 ${pending ? 'animate-spin' : ''}`} />
            Revalidate loader
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
          Disposable workspace stored in the URL. It expires after 30 minutes of
          inactivity, server restart, or capacity eviction. Sample values only;
          anyone with this URL can change them.
        </p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="demo-panel">
          <h2 className="text-lg font-bold mb-3">The cache contract</h2>
          <ol className="lesson-steps">
            <li>
              <strong>Key it correctly.</strong> Include every input that
              changes the result in loaderDeps.
            </li>
            <li>
              <strong>Choose a freshness budget.</strong> staleTime controls
              reuse on navigation. gcTime controls retention after a match
              becomes unused.
            </li>
            <li>
              <strong>Commit, then invalidate.</strong> Await the write, then
              await revalidation when the next UI step needs fresh data.
            </li>
            <li>
              <strong>Scope the refresh.</strong> This lab invalidates matching
              route entries, including inactive project snapshots, without
              reloading unrelated routes.
            </li>
          </ol>
          <p className="demo-alert text-sm mt-5">
            Router caching is a browser navigation cache, not an HTTP CDN cache
            or a durable database. A page reload creates a new router cache.
          </p>
        </div>
        <div className="min-w-0">
          <CodeBlock
            title="Route cache + mutation"
            code={`export const Route = createFileRoute('/features/caching')({
  loaderDeps: ({ search }) => ({
    workspace: search.workspace,
    project: search.project,
  }),
  loader: ({ deps }) => readCachedProject({ data: deps }),
  staleTime: 60_000,
  gcTime: 300_000,
})

await publishBuild({ data: { workspace, project } })
await router.invalidate({
  filter: (match) => match.routeId === Route.id,
  sync: true,
})`}
          />
        </div>
      </section>
    </AdvancedLesson>
  )
}
