import { createFileRoute, defer, Await, useRouter } from '@tanstack/react-router'
import { Suspense, useState, useEffect } from 'react'
import { Zap, RefreshCw, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { fetchSlowStreamingData } from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/streaming')({
  loader: async () => {
    const fastShellTime = new Date().toLocaleTimeString()

    // 1. Fast data resolves instantly (0ms delay)
    const fastMetadata = {
      shellTimestamp: fastShellTime,
      ttfbMs: 5,
      cachedUserSession: 'Architect Session Active',
    }

    // 2. Slow data wrapped with defer() to stream progressively over the wire
    const deferredSlowData = defer(fetchSlowStreamingData())

    return {
      fastMetadata,
      deferredSlowData,
    }
  },
  component: StreamingPage,
})

function StreamingPage() {
  const { fastMetadata, deferredSlowData } = Route.useLoaderData()
  const router = useRouter()
  const [shellMountTime, setShellMountTime] = useState<string | null>(null)
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    setShellMountTime(new Date().toLocaleTimeString())
  }, [fastMetadata.shellTimestamp])

  const handleRefresh = async () => {
    setIsReloading(true)
    await router.invalidate()
    setIsReloading(false)
  }

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FeatureBadge type="streaming" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            TanStack Router: defer() &lt;Await&gt; + Suspense
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          HTML & Data Streaming with defer()
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-2xl leading-relaxed">
          &ldquo;I wanted all the new things. I wanted server rendering, streaming, server functions, the ability to put work on the server without having to change everything about the way my app worked.&rdquo;
        </p>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]">
        <div>
          <span className="text-xs font-bold text-[var(--sea-ink)] block">
            Progressive Streaming Demonstration
          </span>
          <span className="text-[11px] text-[var(--sea-ink-soft)]">
            Initial HTML shell sent immediately; slow query streamed after 1500ms delay.
          </span>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isReloading}
          className="demo-button text-xs py-1.5 px-3"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
          <span>{isReloading ? 'Streaming...' : 'Re-run Stream'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Block A: Fast Shell Data (0ms) */}
        <div className="demo-panel border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <span className="demo-pill font-mono text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              Immediate Shell Payload (0ms Delay)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <h3 className="text-base font-bold text-[var(--sea-ink)] mb-2">
            Critical Content & Page Shell
          </h3>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-4">
            This block rendered on the server with zero artificial delay and was immediately parsed by your browser.
          </p>

          <div className="space-y-2 text-xs font-mono bg-[var(--surface-strong)] p-3 rounded-xl border border-[var(--line)]">
            <div className="flex justify-between">
              <span className="text-[var(--sea-ink-soft)]">SSR Render Time:</span>
              <strong className="text-[var(--sea-ink)]">{fastMetadata.shellTimestamp}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--sea-ink-soft)]">Browser Mount:</span>
              <strong className="text-emerald-700 dark:text-emerald-300">{shellMountTime ?? 'Mounted'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--sea-ink-soft)]">Initial TTFB:</span>
              <strong className="text-[var(--sea-ink)]">~{fastMetadata.ttfbMs} ms</strong>
            </div>
          </div>
        </div>

        {/* Block B: Deferred Streamed Data (1500ms) */}
        <div className="demo-panel border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between mb-3">
            <span className="demo-pill font-mono text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              Deferred Promise (1500ms Simulated Delay)
            </span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>

          <h3 className="text-base font-bold text-[var(--sea-ink)] mb-2">
            Heavy Backend Data Stream
          </h3>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-4">
            This chunk was wrapped in <code>defer()</code>. The server pushed this data chunk across the wire while the page was already interactive.
          </p>

          <Suspense fallback={<StreamingSkeleton />}>
            <Await promise={deferredSlowData}>
              {(data) => <DeferredDataView data={data} />}
            </Await>
          </Suspense>
        </div>
      </div>

      {/* Code Specification */}
      <div className="demo-panel">
        <h3 className="text-base font-bold text-[var(--sea-ink)] mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--lagoon-deep)]" />
          The defer() & &lt;Await&gt; Pattern
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
          TanStack Start does not require React Server Components to stream data chunks. It uses standard promises and React Suspense boundaries:
        </p>
        <CodeBlock
          code={`import { createFileRoute, defer, Await } from '@tanstack/react-router'
import { Suspense } from 'react'

export const Route = createFileRoute('/my-stream')({
  loader: async () => {
    return {
      fastShell: 'Loads immediately in initial HTML',
      deferredData: defer(slowBackendQuery()), // Streams over HTTP!
    }
  },
  component: () => {
    const { fastShell, deferredData } = Route.useLoaderData()
    return (
      <div>
        <h1>{fastShell}</h1>
        <Suspense fallback={<p>Streaming chunk from server...</p>}>
          <Await promise={deferredData}>
            {(data) => <DataWidget data={data} />}
          </Await>
        </Suspense>
      </div>
    )
  },
})`}
        />
      </div>
    </div>
  )
}

function StreamingSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-purple-500/30 bg-[var(--surface-strong)] space-y-3 animate-pulse">
      <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>HTTP Chunked Transfer in Progress (1.5s simulated lag)...</span>
      </div>
      <div className="h-4 bg-purple-500/10 rounded-md w-3/4" />
      <div className="h-4 bg-purple-500/10 rounded-md w-1/2" />
      <div className="h-16 bg-purple-500/10 rounded-md w-full" />
    </div>
  )
}

function DeferredDataView({ data }: { data: { completionTime: string; simulatedLatencyMs: number; insights: string[] } }) {
  return (
    <div className="p-4 rounded-xl border border-emerald-500/30 bg-[var(--surface-strong)] space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Stream Chunk Resolved & Hydrated!
        </span>
        <span className="font-mono text-[11px] text-[var(--sea-ink-soft)]">
          {data.completionTime}
        </span>
      </div>

      <ul className="text-xs text-[var(--sea-ink)] space-y-1.5 pl-4 m-0 list-disc">
        {data.insights.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
