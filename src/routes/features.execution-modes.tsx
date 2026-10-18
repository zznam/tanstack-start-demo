import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Split, Server, Monitor, Cpu, Check, Layers } from 'lucide-react'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'
import { createServerFn } from '@tanstack/react-start'

// Server function for hybrid data loading
const fetchServerLoaderData = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    serverTimestamp: new Date().toISOString(),
    loaderEnvironment: 'Nitro / Node SSR Environment',
    databaseQuerySimulatedMs: 12,
    sampleQuery: 'Simulated server data; no secret API is configured',
  }
})

export const Route = createFileRoute('/features/execution-modes')({
  loader: async () => {
    const serverData = await fetchServerLoaderData()
    return {
      serverData,
      renderedAt: new Date().toLocaleTimeString(),
    }
  },
  component: ExecutionModesPage,
})

function ExecutionModesPage() {
  const { serverData, renderedAt } = Route.useLoaderData()
  const [selectedMode, setSelectedMode] = useState<'ssr' | 'hybrid' | 'client'>('ssr')
  const [clientHydratedTime, setClientHydratedTime] = useState<string | null>(null)
  const [clientUptime, setClientUptime] = useState<number>(0)

  useEffect(() => {
    setClientHydratedTime(new Date().toLocaleTimeString())
    const interval = setInterval(() => {
      setClientUptime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const modes = [
    {
      id: 'ssr' as const,
      title: '1. Full Server-Side Rendering (SSR)',
      badge: 'ssr' as const,
      icon: Server,
      tagline: 'Default Mode: Server renders both Data Loader & HTML markup',
      bestFor: 'Public pages, blogs, marketing, SEO-critical content, fast First Contentful Paint (FCP).',
      howItWorks:
        'The server executes route loaders, renders the React component tree into static HTML, streams the markup to the browser, and hydrates client event listeners seamlessly.',
      code: `export const Route = createFileRoute('/my-page')({
  loader: async () => fetchPageData(),
  component: PageComponent, // Renders on server & client
})`,
    },
    {
      id: 'hybrid' as const,
      title: '2. Server Loader + Client Component',
      badge: 'server-fn' as const,
      icon: Split,
      tagline: 'Server fetches data; Client renders the component tree',
      bestFor: 'Authenticated app dashboards with heavy client charts, avoiding hydration mismatch overhead.',
      howItWorks:
        "On the initial request, ssr: 'data-only' runs the loader on the server and sends its data to the browser without rendering the component. Later navigations run loaders in the browser; server functions still execute on the server.",
      code: `export const Route = createFileRoute('/dashboard')({
  ssr: 'data-only', // Load on server, render component in browser
  loader: async () => fetchSecretProtectedDbData(),
  // Component can use browser globals without SSR hydration warnings
  component: () => <HeavyDashboardComponent />,
})`,
    },
    {
      id: 'client' as const,
      title: '3. Client-Only (SPA Mode)',
      badge: 'client' as const,
      icon: Monitor,
      tagline: 'Zero Server Rendering: pure client execution',
      bestFor: 'Canvas games, WebGL / Three.js, offline-first PWAs, or internal tools.',
      howItWorks:
        'The route is configured with ssr: false. The server responds with the outer HTML shell, and the entire loader and component lifecycle execute in the user browser.',
      code: `export const Route = createFileRoute('/canvas-editor')({
  ssr: false, // Disables SSR for this route!
  loader: async () => loadLocalIndexedDbState(),
  component: CanvasEditor,
})`,
    },
  ]

  const activeMode = modes.find((m) => m.id === selectedMode) ?? modes[0]

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="ssr" />
          <FeatureBadge type="client" />
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          Flexible Route Execution Modes
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-3xl leading-relaxed">
          &ldquo;With Start, a route can render on the server, load its data there without rendering the component, or render on the client. You get to decide where work truly belongs without giving up the routing and data tools the ecosystem has grown to love.&rdquo;
        </p>
      </div>

      {/* Live Hydration Status Card */}
      <div className="demo-panel mb-8 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="demo-pill font-mono text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                Live Lifecycle Telemetry
              </span>
              <h2 className="text-base font-bold text-[var(--sea-ink)] mt-1">
                Server Loader vs Client Hydration Verification
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
              <span className="text-[var(--sea-ink-soft)] block text-[10px]">Server Loader Time:</span>
              <strong className="text-[var(--sea-ink)]">{renderedAt}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
              <span className="text-[var(--sea-ink-soft)] block text-[10px]">Client Hydrated At:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                {clientHydratedTime ?? 'Hydrating...'}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
              <span className="text-[var(--sea-ink-soft)] block text-[10px]">Client Session:</span>
              <strong className="text-[var(--sea-ink)]">{clientUptime}s active</strong>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-500/15 text-xs text-[var(--sea-ink-soft)] font-mono">
          Data loaded by server: <code>{serverData.loaderEnvironment}</code> • Demo query: <code>{serverData.sampleQuery}</code>
        </div>
      </div>

      <div className="demo-panel mb-6 flex flex-wrap gap-3">
        <p className="w-full text-sm">Open a live route to verify its execution mode. The selector below compares the configurations.</p>
        <Link to="/features/execution-modes/spa" preload={false} className="demo-button">Open client-only demo</Link>
        <Link to="/features/execution-modes/hybrid" preload={false} className="demo-button">Open data-only SSR demo</Link>
      </div>
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setSelectedMode(mode.id)}
            aria-pressed={selectedMode === mode.id}
            className={`flex-1 min-w-[200px] p-4 rounded-xl border text-left transition ${
              selectedMode === mode.id
                ? 'border-[var(--lagoon-deep)] bg-[var(--surface-strong)] shadow-md ring-1 ring-[var(--lagoon-deep)]'
                : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-strong)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <mode.icon className={`w-5 h-5 ${selectedMode === mode.id ? 'text-[var(--lagoon-deep)]' : 'text-[var(--sea-ink-soft)]'}`} />
              <FeatureBadge type={mode.badge} />
            </div>
            <h3 className="text-sm font-bold text-[var(--sea-ink)] m-0">{mode.title}</h3>
            <p className="text-xs text-[var(--sea-ink-soft)] mt-1 m-0 line-clamp-1">{mode.tagline}</p>
          </button>
        ))}
      </div>

      {/* Mode Detail Card */}
      <div className="demo-panel mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <activeMode.icon className="w-5 h-5 text-[var(--lagoon-deep)]" />
          <h2 className="text-lg font-bold text-[var(--sea-ink)]">{activeMode.title}</h2>
        </div>
        <p className="text-sm text-[var(--sea-ink-soft)] mb-4">{activeMode.tagline}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--chip-bg)] border border-[var(--line)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sea-ink)] mb-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Best Use Cases
            </h4>
            <p className="text-xs text-[var(--sea-ink-soft)] m-0 leading-relaxed">
              {activeMode.bestFor}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--chip-bg)] border border-[var(--line)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sea-ink)] mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Under the Hood
            </h4>
            <p className="text-xs text-[var(--sea-ink-soft)] m-0 leading-relaxed">
              {activeMode.howItWorks}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sea-ink)] mb-2">
            Route Configuration Pattern
          </h4>
          <CodeBlock code={activeMode.code} title={`${activeMode.id}-mode.tsx`} />
        </div>
      </div>

      {/* Tradeoff Comparison Matrix */}
      <div className="demo-panel">
        <h3 className="text-base font-bold text-[var(--sea-ink)] mb-1">
          Execution Modes Comparison Matrix
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-4">
          How TanStack Start gives you freedom of choice without forcing an application rewrite:
        </p>

        <div className="demo-table-shell">
          <table className="demo-table text-xs">
            <thead>
              <tr>
                <th>Execution Mode</th>
                <th>Where Loader Runs</th>
                <th>Where Component Renders</th>
                <th>SEO / FCP</th>
                <th>Secrets Isolation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">Full SSR (Default)</td>
                <td>Server initially; browser on navigation</td>
                <td>Server ➔ Client Hydration</td>
                <td>⭐⭐⭐⭐⭐ Instant</td>
                <td>Server functions only</td>
              </tr>
              <tr>
                <td className="font-bold">Server Loader + Client UI</td>
                <td>Server initially; browser on navigation</td>
                <td>Client Only</td>
                <td>⭐⭐⭐ Fast Shell</td>
                <td>Server functions only</td>
              </tr>
              <tr>
                <td className="font-bold">Client-Only (SPA)</td>
                <td>Client (Browser)</td>
                <td>Client Only</td>
                <td>⭐⭐ Client JS</td>
                <td>⚠️ Public client RPC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
