import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Split,
  Binary,
  Bot,
  ExternalLink,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { fetchDashboardStats } from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { getOrigin } from '../utils/isomorphic'

export const Route = createFileRoute('/')({
  loader: async () => {
    const stats = await fetchDashboardStats()
    const initialOrigin = getOrigin()
    return { stats, initialOrigin }
  },
  component: HomePage,
})

function HomePage() {
  const { stats, initialOrigin } = Route.useLoaderData()

  const featureCards = [
    {
      to: '/features/routing',
      title: 'Type-Safe Routing',
      badge: 'routing' as const,
      desc: 'Parameterized routes ($postId), Zod search params validation, intent preloading, error boundaries, and pathless layouts.',
      icon: Layers,
    },
    {
      to: '/features/execution-modes',
      title: 'Flexible Execution Modes',
      badge: 'ssr' as const,
      desc: 'Choose where work belongs: full SSR, client-only SPA mode, or server data loader with client-rendered component.',
      icon: Split,
    },
    {
      to: '/features/server-functions',
      title: 'Typed Server Functions',
      badge: 'server-fn' as const,
      desc: 'Call server code directly from loaders or client event handlers with GET/POST methods and Zod schema validation.',
      icon: Server,
    },
    {
      to: '/features/middleware',
      title: 'Full-Stack Middleware',
      badge: 'middleware' as const,
      desc: 'Middleware that crosses client and server boundaries with type-safe sendContext propagation and roundtrip tracing.',
      icon: Binary,
    },
    {
      to: '/features/isomorphic',
      title: 'createIsomorphicFn',
      badge: 'isomorphic' as const,
      desc: 'Side-by-side .server() and .client() implementations with automatic tree-shaking of the alternate environment bundle.',
      icon: Cpu,
    },
    {
      to: '/features/streaming',
      title: 'Streaming & defer()',
      badge: 'streaming' as const,
      desc: 'Fast shell delivery with progressive chunked streaming of deferred promises using React Suspense and TanStack Await.',
      icon: Zap,
    },
    {
      to: '/features/server-context',
      title: 'Server Context & Nitro',
      badge: 'nitro' as const,
      desc: 'Inspect real HTTP request metadata (getRequest, headers, IP) across Nitro deployment adapters (Cloudflare, Vercel, Node).',
      icon: ShieldCheck,
    },
    {
      to: '/features/agent-dx',
      title: 'Then Agents Showed Up',
      badge: 'agent-dx' as const,
      desc: 'Why strict compiler types and TanStack Intent skill guidance make Start the premier framework for human + AI pairing.',
      icon: Bot,
    },
  ] as const

  return (
    <div className="page-wrap px-4 pb-16 pt-8 sm:pt-12">
      {/* Announcement Ribbon */}
      <div className="flex justify-center mb-6">
        <a
          href="https://tanstack.com/blog/tanstack-start-1-0"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 no-underline hover:bg-emerald-500/15 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>TanStack Start 1.0 is Stable & Production Ready</span>
          <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
        </a>
      </div>

      {/* Hero Header */}
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-12 sm:py-16 text-center">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.35),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.22),transparent_66%)]" />

        <p className="island-kicker mb-3 font-mono text-xs uppercase tracking-widest text-[var(--kicker)]">
          The Full-Stack React Framework for the AI Era
        </p>

        <h1 className="display-title mb-6 mx-auto max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--sea-ink)] leading-[1.1]">
          Type-Safe, Client-First, Full-Stack React
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-[var(--sea-ink-soft)] leading-relaxed">
          &ldquo;I wanted to keep building the kinds of apps I already knew how to build—state management, client-side navigation, and data caching—but with server rendering, streaming, and typed server functions.&rdquo;
          <span className="block mt-2 font-semibold text-sm text-[var(--sea-ink)]">
            — Tanner Linsley, Creator of TanStack
          </span>
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/features/routing"
            search={{ category: 'all', query: '', sortBy: 'newest' }}
            className="demo-button no-underline px-6 py-3 text-sm shadow-md"
          >
            <span>Explore All Feature Demos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://tanstack.com/blog/tanstack-start-1-0"
            target="_blank"
            rel="noreferrer"
            className="demo-button demo-button-secondary no-underline px-6 py-3 text-sm"
          >
            <span>Read Release Announcement</span>
            <ExternalLink className="w-4 h-4 opacity-75" />
          </a>
        </div>
      </section>

      {/* Live System Status Banner */}
      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--sea-ink)]">SSR Server Function Ping</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Loaded via Loader
                </span>
              </div>
              <p className="text-xs text-[var(--sea-ink-soft)] m-0 mt-0.5 font-mono">
                Runtime: {stats.platform} ({stats.arch}) • Node {stats.nodeVersion} • Heap: {stats.memoryHeapMb} MB • Origin: {initialOrigin}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[var(--chip-bg)] border border-[var(--line)] font-mono text-[var(--sea-ink-soft)]">
              Server Uptime: <strong className="text-[var(--sea-ink)]">{stats.uptimeSeconds}s</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[var(--chip-bg)] border border-[var(--line)] font-mono text-[var(--sea-ink-soft)]">
              Posts In-Memory: <strong className="text-[var(--sea-ink)]">{stats.totalPosts}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="mt-12">
        <div className="text-center mb-8">
          <p className="island-kicker font-mono text-xs uppercase tracking-widest text-[var(--kicker)] mb-2">
            Interactive Test Suite & Demonstrations
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--sea-ink)]">
            Explore TanStack Start 1.0 Primitives
          </h2>
          <p className="text-sm text-[var(--sea-ink-soft)] max-w-xl mx-auto mt-2">
            Every feature highlighted in the 1.0 announcement is implemented as an interactive, inspectable demo.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.to}
                to={card.to}
                search={card.to === '/features/routing' ? { category: 'all', query: '', sortBy: 'newest' } : undefined}
                className="island-shell feature-card group rounded-2xl p-5 flex flex-col justify-between no-underline transition-all hover:scale-[1.02]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[rgba(79,184,178,0.12)] border border-[rgba(79,184,178,0.25)] text-[var(--lagoon-deep)] group-hover:bg-[rgba(79,184,178,0.2)] transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <FeatureBadge type={card.badge} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--sea-ink)] mb-2 group-hover:text-[var(--lagoon-deep)] transition">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed m-0">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-bold text-[var(--lagoon-deep)]">
                  <span>Launch Demo</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Philosophy Callout from Blog */}
      <section className="island-shell mt-12 rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="island-kicker mb-2 text-xs font-mono uppercase tracking-widest text-[var(--kicker)]">
            Architectural Philosophy
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--sea-ink)] mb-3">
            Why Start Is Different: Explicit Over Magical
          </h2>
          <p className="text-sm text-[var(--sea-ink-soft)] leading-relaxed mb-4">
            Instead of inverting the entire mental model and forcing an all-or-nothing React Server Components paradigm, TanStack Start provides explicit controls. Components stay components, routing stays routing, and when you need server execution, you use <code>createServerFn</code>, <code>createMiddleware</code>, and <code>createIsomorphicFn</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
              <strong className="block text-[var(--sea-ink)] mb-1">Familiar SPA Ergonomics</strong>
              <span className="text-[var(--sea-ink-soft)]">
                Client state, snappy navigation, preloading, and data caching you love.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
              <strong className="block text-[var(--sea-ink)] mb-1">Direct Server Primitives</strong>
              <span className="text-[var(--sea-ink-soft)]">
                Server functions callable anywhere with RPC, streaming, and Nitro host flexibility.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)]">
              <strong className="block text-[var(--sea-ink)] mb-1">Built for AI Agents</strong>
              <span className="text-[var(--sea-ink-soft)]">
                Compiler-backed type safety and TanStack Intent guide AI modifications accurately.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
