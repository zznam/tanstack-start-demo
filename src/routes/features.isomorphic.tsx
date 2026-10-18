import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Monitor,
  Server,
  Zap,
  ExternalLink,
  Code2,
} from 'lucide-react'
import { getOrigin, getEnvironmentInfo, type EnvironmentInfo } from '../utils/isomorphic'
import { fetchServerEnvironment } from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/isomorphic')({
  loader: () => fetchServerEnvironment(),
  component: IsomorphicPage,
})

function IsomorphicPage() {
  const { serverOrigin, serverEnv } = Route.useLoaderData()

  // State for live client isomorphic execution
  const [clientOrigin, setClientOrigin] = useState<string | null>(null)
  const [clientEnv, setClientEnv] = useState<EnvironmentInfo | null>(null)
  const [clientExecutionTimeMs, setClientExecutionTimeMs] = useState<number | null>(null)

  const handleRunClientIsomorphic = () => {
    const start = performance.now()
    // Calling getOrigin() on the browser client!
    const origin = getOrigin()
    const env = getEnvironmentInfo()
    const elapsed = performance.now() - start

    setClientOrigin(origin)
    setClientEnv(env)
    setClientExecutionTimeMs(Number(elapsed.toFixed(3)))
  }

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="isomorphic" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            @tanstack/react-start: createIsomorphicFn
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          Choosing Where Code Runs: createIsomorphicFn
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-3xl leading-relaxed">
          &ldquo;The call stays the same, the implementation depends on where it&apos;s running, and Start removes the other environment&apos;s implementation from that bundle. Calling it in the browser doesn&apos;t make a request back to the server.&rdquo;
        </p>
      </div>

      {/* Blog Code Walkthrough Banner */}
      <div className="demo-panel mb-8 border-[var(--lagoon-deep)]/30 bg-[rgba(79,184,178,0.06)]">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <span className="demo-pill font-mono text-[11px] uppercase tracking-wider bg-[rgba(79,184,178,0.15)] text-[var(--lagoon-deep)] border-[rgba(79,184,178,0.3)]">
              Direct from Tanner Linsley&apos;s Blog Post
            </span>
            <h2 className="text-lg font-bold text-[var(--sea-ink)] mt-1.5">
              The Exact getOrigin() Implementation
            </h2>
          </div>
          <a
            href="https://tanstack.com/blog/tanstack-start-1-0#choosing-where-the-code-runs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[var(--lagoon-deep)] font-semibold hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View in Blog</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-4">
          Say you need the current origin to build an absolute URL for social cards. On the server that comes from the incoming HTTP request. In the browser it comes from <code>window.location</code>. With <code>createIsomorphicFn</code>, you put both implementations right next to each other:
        </p>
        <CodeBlock
          code={`import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const getOrigin = createIsomorphicFn()
  .server(() => new URL(getRequest().url).origin)
  .client(() => window.location.origin)

// Calling it stays identical everywhere:
const origin = getOrigin()`}
        />
      </div>

      {/* Live Interactive Comparison */}
      <div className="demo-panel mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--line)]">
          <div>
            <h3 className="text-base font-bold text-[var(--sea-ink)]">
              Live Environment Execution Comparison
            </h3>
            <p className="text-xs text-[var(--sea-ink-soft)] m-0">
              Compare the server execution during SSR with immediate client-side execution.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunClientIsomorphic}
            className="demo-button text-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Execute In Browser Now</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Server Branch */}
          <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="demo-pill font-mono text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
                SSR Server Branch (.server)
              </span>
              <Server className="w-4 h-4 text-purple-600" />
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[var(--sea-ink-soft)] block text-[11px]">Server Origin (via getRequest):</span>
                <code className="text-xs font-mono font-bold text-purple-800 dark:text-purple-200">
                  {serverOrigin}
                </code>
              </div>

              <div>
                <span className="text-[var(--sea-ink-soft)] block text-[11px]">Runtime Details:</span>
                <p className="text-[11px] text-[var(--sea-ink-soft)] m-0 font-mono">
                  {serverEnv.description}
                </p>
              </div>

              <div className="pt-2 border-t border-purple-500/15">
                <span className="text-[11px] font-semibold text-[var(--sea-ink)]">Isolated Server Context:</span>
                <pre tabIndex={0} aria-label="Runtime context JSON" className="mt-1 p-2 rounded-lg bg-[var(--surface-strong)] text-[11px] font-mono text-[var(--sea-ink)] overflow-x-auto m-0">
                  {JSON.stringify(serverEnv.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Client Branch */}
          <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center justify-between mb-3">
              <span className="demo-pill font-mono text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                Browser Client Branch (.client)
              </span>
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>

            {clientOrigin ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[var(--sea-ink-soft)] block text-[11px]">Client Origin (via window.location):</span>
                  <code className="text-xs font-mono font-bold text-blue-800 dark:text-blue-200">
                    {clientOrigin}
                  </code>
                </div>

                <div>
                  <span className="text-[var(--sea-ink-soft)] block text-[11px]">Execution Latency:</span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold m-0 font-mono">
                    ⚡ {clientExecutionTimeMs} ms (0 network hops)
                  </p>
                </div>

                <div className="pt-2 border-t border-blue-500/15">
                  <span className="text-[11px] font-semibold text-[var(--sea-ink)]">Browser DOM Context:</span>
                  <pre tabIndex={0} aria-label="Runtime context JSON" className="mt-1 p-2 rounded-lg bg-[var(--surface-strong)] text-[11px] font-mono text-[var(--sea-ink)] overflow-x-auto m-0">
                    {JSON.stringify(clientEnv?.details, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[var(--sea-ink-soft)]">
                <p className="mb-3">
                  Click &ldquo;Execute In Browser Now&rdquo; to run the client-side branch without sending an HTTP request.
                </p>
                <button
                  type="button"
                  onClick={handleRunClientIsomorphic}
                  className="demo-button text-xs py-1.5 px-3"
                >
                  Run Client Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compiler Tree Shaking Feature Breakdown */}
      <div className="demo-panel">
        <h3 className="text-base font-bold text-[var(--sea-ink)] mb-2 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[var(--lagoon-deep)]" />
          Dead-Code Elimination & Compiler Stripping
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed mb-4">
          Why does this matter? Many React frameworks either crash when referencing browser globals like <code>window</code> on the server, or accidentally bundle sensitive server logic into client JavaScript chunks. TanStack Start solves this at compile time:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
            <strong className="block text-emerald-700 dark:text-emerald-300 font-bold mb-1">
              In Client Production Bundles:
            </strong>
            <p className="text-[var(--sea-ink-soft)] m-0 leading-relaxed">
              The <code>.server()</code> handler, server imports (like <code>@tanstack/react-start/server</code>), and backend logic are stripped completely from the client JS bundle. Zero bundle bloat and zero secret leakage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
            <strong className="block text-purple-700 dark:text-purple-300 font-bold mb-1">
              In Server SSR Bundles:
            </strong>
            <p className="text-[var(--sea-ink-soft)] m-0 leading-relaxed">
              The <code>.client()</code> handler and any references to browser DOM globals are never invoked on the server, completely eliminating hydration crashes and <code>ReferenceError: window is not defined</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
