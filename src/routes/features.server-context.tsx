import { LessonProgress } from '../components/LessonProgress'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Cloud,
  Terminal,
  Radio,
} from 'lucide-react'
import { getServerRequestInfo } from '../utils/serverContext'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/server-context')({
  loader: async () => {
    const requestInfo = await getServerRequestInfo()
    return { requestInfo }
  },
  component: ServerContextPage,
})

function ServerContextPage() {
  const { requestInfo } = Route.useLoaderData()
  const [selectedAdapter, setSelectedAdapter] = useState<'nitro' | 'cloudflare' | 'vercel' | 'netlify' | 'railway' | 'render'>('nitro')

  const adapters = [
    {
      id: 'nitro' as const,
      name: 'Generic Nitro (Node / Docker)',
      tagline: 'Default deployable Node.js server container',
      command: 'npx vite build && node .output/server/index.mjs',
      highlights: 'Zero vendor lock-in. Runs anywhere that supports Node.js, Bun, or Docker.',
    },
    {
      id: 'cloudflare' as const,
      name: 'Cloudflare Workers (Gold Partner)',
      tagline: 'Serverless Edge Runtime with V8 isolates',
      command: 'tanstack create --deployment cloudflare',
      highlights: 'Instant global edge distribution, zero cold starts, KV/D1/R2 storage integration.',
    },
    {
      id: 'vercel' as const,
      name: 'Vercel (Gold Partner)',
      tagline: 'Vercel Functions, AI Gateway & Preview deploys',
      command: 'tanstack create --deployment vercel',
      highlights: 'Native support across eve, AI Gateway, Vercel Sandbox, and Chat SDK.',
    },
    {
      id: 'netlify' as const,
      name: 'Netlify (Gold Partner)',
      tagline: 'Netlify Edge Functions & AI App Builder',
      command: 'tanstack create --deployment netlify',
      highlights: 'Default framework for Netlify AI app builder used by >1,000,000 developers.',
    },
    {
      id: 'railway' as const,
      name: 'Railway (Gold Partner)',
      tagline: 'Full-stack PaaS with Zero-Config deployment',
      command: 'tanstack create --deployment railway',
      highlights: 'Zero-config deploys, Railway Sandboxes as TanStack AI provider, automated DBs.',
    },
    {
      id: 'render' as const,
      name: 'Render (Gold Partner)',
      tagline: 'Automated SSR hosting with health checks',
      command: 'tanstack create --deployment render',
      highlights: 'Dedicated deployment template with server rendering, server functions, and health probes.',
    },
  ]

  const activeAdapter = adapters.find((a) => a.id === selectedAdapter) ?? adapters[0]

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="nitro" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            @tanstack/react-start/server: getRequest & Nitro
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          Server Request Context & Hosting Adapters
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-3xl leading-relaxed">
          &ldquo;Ryan Carniato&apos;s advice was basically to use Vite and Nitro, and that helped us change direction early on. I wanted people to be able to choose where to run it without having that choice take over how they build their application.&rdquo;
        </p>
      </div>

      {/* Real HTTP Request Inspector */}
      <div className="demo-panel mb-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            <h2 className="text-base font-bold text-[var(--sea-ink)] m-0">
              Live HTTP Request Metadata (@tanstack/react-start/server)
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            Preset: {requestInfo.nitroPreset}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)] space-y-1.5">
            <div className="text-[var(--sea-ink-soft)] text-[10px] uppercase font-bold">Request Route Details</div>
            <div>URL: <strong className="text-[var(--sea-ink)]">{requestInfo.url}</strong></div>
            <div>Method: <strong className="text-emerald-700 dark:text-emerald-300">{requestInfo.method}</strong></div>
            <div>Host: <strong className="text-[var(--sea-ink)]">{requestInfo.host}</strong></div>
            <div>Protocol: <strong className="text-[var(--sea-ink)]">{requestInfo.protocol}</strong></div>
            <div>Client IP: <strong className="text-[var(--sea-ink)]">{requestInfo.ip}</strong></div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)] space-y-1.5">
            <div className="text-[var(--sea-ink-soft)] text-[10px] uppercase font-bold">Server Runtime & Nitro</div>
            <div>Platform: <strong className="text-[var(--sea-ink)]">{requestInfo.runtimePlatform}</strong></div>
            <div>Language: <strong className="text-[var(--sea-ink)]">{requestInfo.acceptLanguage}</strong></div>
            <div>Nitro Adapter: <strong className="text-purple-700 dark:text-purple-300">{requestInfo.nitroPreset}</strong></div>
            <div>User Agent: <span className="text-[var(--sea-ink-soft)] text-[11px] truncate block">{requestInfo.userAgent}</span></div>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-[var(--sea-ink)] mb-2 block">
            Inspectable HTTP Headers Captured:
          </span>
          <pre tabIndex={0} aria-label="Runtime context JSON" className="p-3 rounded-lg bg-[var(--surface-strong)] border border-[var(--line)] text-[11px] font-mono text-[var(--sea-ink)] overflow-x-auto m-0">
            {JSON.stringify(requestInfo.headersSubset, null, 2)}
          </pre>
        </div>
      </div>

      {/* Deployment Adapters Explorer */}
      <div className="demo-panel mb-8">
        <h3 className="text-base font-bold text-[var(--sea-ink)] mb-1 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-[var(--lagoon-deep)]" />
          Choose Where Your Code Runs (Zero Vendor Lock-In)
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-5">
          This project runs on Node with Nitro. Other providers require adapter configuration and runtime compatibility checks; these cards describe hosting options.
        </p>

        {/* Adapter buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {adapters.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAdapter(a.id)}
              aria-pressed={selectedAdapter === a.id}
              className={`p-3 rounded-xl border text-center transition ${
                selectedAdapter === a.id
                  ? 'border-[var(--lagoon-deep)] bg-[var(--surface-strong)] shadow-xs ring-1 ring-[var(--lagoon-deep)] font-bold text-[var(--sea-ink)]'
                  : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--sea-ink-soft)]'
              }`}
            >
              <span className="block text-xs truncate">{a.name.split(' (')[0]}</span>
            </button>
          ))}
        </div>

        {/* Active Adapter Card */}
        <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-bold text-[var(--sea-ink)] m-0">{activeAdapter.name}</h4>
            <span className="demo-pill font-mono text-[10px]">{activeAdapter.tagline}</span>
          </div>

          <p className="text-xs text-[var(--sea-ink-soft)] mb-4 leading-relaxed">
            {activeAdapter.highlights}
          </p>

          <div>
            <span className="text-[11px] font-semibold text-[var(--sea-ink)] block mb-1">
              Scaffold or build command:
            </span>
            <code className="text-xs font-mono block p-2 rounded-lg bg-[var(--surface-strong)] border border-[var(--line)] text-emerald-700 dark:text-emerald-300">
              {activeAdapter.command}
            </code>
          </div>
        </div>
      </div>

      {/* Code Specification */}
      <div className="demo-panel">
        <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-2 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-emerald-600" />
          Server Request Utility APIs
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
          Access request cookies and headers, and set status codes inside server functions. Hosting examples below require provider-specific setup and are not active deployment configurations:
        </p>
        <CodeBlock
          code={`import { createServerFn } from '@tanstack/react-start'
import {
  getRequest,
  getRequestHeaders,
  getCookie,
  setCookie,
  setResponseStatus,
} from '@tanstack/react-start/server'

export const handleUserSession = createServerFn({ method: 'POST' }).handler(async () => {
  const req = getRequest()
  const sessionCookie = getCookie('auth_session')

  if (!sessionCookie) {
    setResponseStatus(401)
    return { error: 'Unauthorized' }
  }

  setCookie('session_activity', Date.now().toString(), { httpOnly: true, secure: true })
  return { authenticated: true, userAgent: req.headers.get('user-agent') }
})`}
        />
      </div>
      <LessonProgress id="server-context" />
    </div>
  )
}
