import { LessonProgress } from '../components/LessonProgress'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Clock,
  Send,
  Zap,
  Globe,
  Server,
  Layers,
} from 'lucide-react'
import type { TraceContext } from '../utils/middleware'
import { executeTraceCall } from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/middleware')({
  component: MiddlewarePage,
})

type TraceResult = Awaited<ReturnType<typeof executeTraceCall>>

function MiddlewarePage() {
  const [note, setNote] = useState('Benchmark ping from client UI')
  const [isTracing, setIsTracing] = useState(false)
  const [traceError, setTraceError] = useState<string | null>(null)
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null)

  const handleRunTrace = async () => {
    setIsTracing(true)
    setTraceError(null)
    const started = performance.now()
    try {
      const response = await executeTraceCall({
        data: { payloadNote: note || 'Default payload' },
      })
      // RPC returns the handler payload, not the middleware context envelope.
      setTraceResult({ ...response, context: {
        ...response.context,
        clientEndTime: Date.now(),
        totalRoundtrip: Math.round(performance.now() - started),
      } })
    } catch (err) {
      setTraceError(err instanceof Error ? err.message : 'Trace failed. Please try again.')
    } finally {
      setIsTracing(false)
    }
  }

  const ctx: TraceContext = traceResult?.context ?? {}

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="middleware" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            @tanstack/react-start: createMiddleware
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          Full-Stack Middleware
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-2xl leading-relaxed">
          &ldquo;It&apos;s full-stack middleware that can cross the client and server, with types carrying the context through. These choices fit into the same application model that so many of us have worked with over the last decade.&rdquo;
        </p>
      </div>

      {/* Interactive Trigger Panel */}
      <div className="demo-panel mb-8">
        <h2 className="demo-section-title text-lg font-bold mb-2">
          Live Client ➔ Server ➔ Client Trace Dispatcher
        </h2>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-5">
          Send a request wrapped with <code>timingMiddleware</code> and <code>authSimulationMiddleware</code>. Observe how context propagates over the wire in both directions. The fixed token simulates an identity; it does not authenticate users. Clock deltas may include clock skew.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center mb-4">
          <input
            type="text"
            aria-label="Trace note"
            maxLength={200}
            placeholder="Trace note or label..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="demo-input text-xs"
          />
          <button
            type="button"
            onClick={handleRunTrace}
            disabled={isTracing}
            className="demo-button text-xs shrink-0 w-full sm:w-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTracing ? 'Tracing Hop...' : 'Dispatch Middleware Trace'}</span>
          </button>
        </div>

        {traceError && <p role="alert" className="demo-alert demo-alert-danger">{traceError}</p>}
        {/* Visual Lifecycle Waterfall Diagram */}
        {traceResult ? (
          <div className="mt-6 pt-6 border-t border-[var(--line)]">
            <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Live Context Boundary Traversal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Step 1: Client Pre-flight */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="demo-pill font-mono text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                    Step 1: Client Middleware
                  </span>
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-xs font-bold text-[var(--sea-ink)] mb-1">
                  Browser Outbound
                </h4>
                <div className="space-y-1 text-[11px] font-mono text-[var(--sea-ink-soft)]">
                  <div>Request ID: <strong className="text-[var(--sea-ink)]">{ctx.requestId ?? 'Unavailable'}</strong></div>
                  <div>Client Start: <strong className="text-[var(--sea-ink)]">{ctx.clientStartTime ? new Date(ctx.clientStartTime).toLocaleTimeString() : 'N/A'}</strong></div>
                  <div>Auth Token: <span className="text-emerald-600 font-semibold">Attached via sendContext</span></div>
                </div>
              </div>

              {/* Step 2: Server Phase */}
              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="demo-pill font-mono text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
                    Step 2: Server Middleware
                  </span>
                  <Server className="w-4 h-4 text-purple-600" />
                </div>
                <h4 className="text-xs font-bold text-[var(--sea-ink)] mb-1">
                  Nitro SSR Server
                </h4>
                <div className="space-y-1 text-[11px] font-mono text-[var(--sea-ink-soft)]">
                  <div>Clock delta to server: <strong className="text-purple-700 dark:text-purple-300">{ctx.durationToServer ?? 'Unavailable'} ms</strong></div>
                  <div>Server Processing: <strong className="text-purple-700 dark:text-purple-300">{ctx.serverProcessingTime ?? 'Unavailable'} ms</strong></div>
                  <div>Server Runtime: <strong className="text-[var(--sea-ink)]">{ctx.serverPlatform} (Node {ctx.serverNodeVersion})</strong></div>
                  <div>Demo Identity: <span className="text-emerald-600 font-semibold">{ctx.authenticatedUser?.role ?? 'Unauthenticated'}</span></div>
                </div>
              </div>

              {/* Step 3: Client Post-flight */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="demo-pill font-mono text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    Step 3: Client Resolution
                  </span>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-xs font-bold text-[var(--sea-ink)] mb-1">
                  Browser Inbound
                </h4>
                <div className="space-y-1 text-[11px] font-mono text-[var(--sea-ink-soft)]">
                  <div>Total Roundtrip: <strong className="text-emerald-700 dark:text-emerald-300">{ctx.totalRoundtrip ?? 'Unavailable'} ms</strong></div>
                  <div>Client Complete: <strong className="text-[var(--sea-ink)]">{ctx.clientEndTime ? new Date(ctx.clientEndTime).toLocaleTimeString() : 'Done'}</strong></div>
                  <div>User Session: <strong className="text-[var(--sea-ink)]">{ctx.authenticatedUser?.name ?? 'No demo session'}</strong></div>
                </div>
              </div>
            </div>

            {/* Raw Context JSON */}
            <div>
              <div className="text-xs font-semibold text-[var(--sea-ink)] mb-2">
                Unified Context Injected via Middleware:
              </div>
              <pre tabIndex={0} aria-label="Runtime context JSON" className="p-3 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] text-[11px] font-mono text-[var(--sea-ink)] overflow-x-auto m-0">
                {JSON.stringify(ctx, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-[var(--line)] text-center text-xs text-[var(--sea-ink-soft)]">
            Click &ldquo;Dispatch Middleware Trace&rdquo; above to run the live full-stack pipeline.
          </div>
        )}
      </div>

      {/* Chained Middleware Architecture Diagram */}
      <div className="demo-panel mb-8">
        <h3 className="text-base font-bold text-[var(--sea-ink)] mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--lagoon-deep)]" />
          How createMiddleware Works
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-4">
          Full-stack middleware in TanStack Start has distinct <code>.client()</code> and <code>.server()</code> lifecycle stages, allowing context to be enriched on both sides:
        </p>

        <CodeBlock
          code={`import { createMiddleware } from '@tanstack/react-start'

export const timingMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx) => {
    const clientStartTime = Date.now()
    
    // sendContext forwards variables to the server over the wire!
    const res = await ctx.next({
      sendContext: { clientStartTime },
    })

    const totalRoundtrip = Date.now() - clientStartTime
    return { ...res, context: { ...res.context, totalRoundtrip } }
  })
  .server(async (ctx) => {
    // Server receives clientStartTime from sendContext!
    const serverReceivedTime = Date.now()
    const durationToServer = serverReceivedTime - ctx.context.clientStartTime

    return ctx.next({
      sendContext: { serverReceivedTime, durationToServer },
    })
  })`}
        />
      </div>
      <LessonProgress id="middleware" />
    </div>
  )
}
