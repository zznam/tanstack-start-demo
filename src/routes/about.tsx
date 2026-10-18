import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { FeatureBadge } from '../components/FeatureBadge'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  const partners = [
    { name: 'Cloudflare', tier: 'Gold', role: 'Workers & Vite integration' },
    { name: 'Render', tier: 'Gold', role: 'Server rendering & health checks' },
    { name: 'Netlify', tier: 'Gold', role: 'AI app builder default framework' },
    { name: 'CodeRabbit', tier: 'Gold', role: 'Continuous code review & security' },
    { name: 'Lovable', tier: 'Gold', role: 'Powers newly generated full-stack apps' },
    { name: 'Vercel', tier: 'Gold', role: 'AI Gateway & eve agent integration' },
    { name: 'Railway', tier: 'Gold', role: 'Zero-config sandboxed agents' },
    { name: 'Clerk', tier: 'Silver', role: 'Dedicated TanStack Start SDK & Auth' },
    { name: 'WorkOS', tier: 'Silver', role: 'AuthKit for TanStack Start' },
    { name: 'Sentry', tier: 'Bronze', role: 'TanStack Start monitoring & tracing' },
    { name: 'Prisma', tier: 'Bronze', role: 'Server functions & database guides' },
  ]

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-10 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FeatureBadge type="routing" />
          <FeatureBadge type="nitro" />
        </div>

        <h1 className="display-title mb-4 text-3xl sm:text-5xl font-extrabold text-[var(--sea-ink)]">
          About the TanStack Start 1.0 Demo Project
        </h1>

        <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-[var(--sea-ink-soft)] mb-6">
          This project was created to provide a complete, working reference implementation of every concept introduced in Tanner Linsley&apos;s milestone release post,{' '}
          <a
            href="https://tanstack.com/blog/tanstack-start-1-0"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            &ldquo;TanStack Start 1.0 is Stable&rdquo;
          </a>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono mb-8">
          <div className="p-4 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)] space-y-1.5">
            <div className="font-bold text-[var(--sea-ink)] text-sm mb-1 font-sans">
              Core Framework Stack
            </div>
            <div>• @tanstack/react-start: 1.169.3</div>
            <div>• @tanstack/react-router: 1.170.45</div>
            <div>• React: 19.2.0</div>
            <div>• Nitro Server Engine: 3.0</div>
            <div>• Vite Bundler: 8.0</div>
            <div>• Tailwind CSS: 4.1</div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)] space-y-1.5">
            <div className="font-bold text-[var(--sea-ink)] text-sm mb-1 font-sans">
              Demonstrated Features
            </div>
            <div>• Type-safe dynamic routing & search params</div>
            <div>• Typed server functions (createServerFn)</div>
            <div>• Full-stack bidirectional middleware</div>
            <div>• Explicit environment functions (createIsomorphicFn)</div>
            <div>• HTML & data streaming with defer() & Suspense</div>
            <div>• Agent guardrails & TanStack Intent skills</div>
          </div>
        </div>

        {/* Partners Showcase from Blog */}
        <div>
          <h2 className="text-base font-bold text-[var(--sea-ink)] mb-3">
            Ecosystem Partners Betting on TanStack Start 1.0
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {partners.map((p) => (
              <div
                key={p.name}
                className="p-3 rounded-xl bg-[var(--chip-bg)] border border-[var(--line)] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-[var(--sea-ink)]">{p.name}</div>
                  <div className="text-[11px] text-[var(--sea-ink-soft)]">{p.role}</div>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    p.tier === 'Gold'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {p.tier}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--line)] flex flex-wrap gap-3">
          <Link to="/" className="demo-button no-underline text-xs">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Return to Overview</span>
          </Link>
          <a
            href="https://tanstack.com/start"
            target="_blank"
            rel="noreferrer"
            className="demo-button demo-button-secondary no-underline text-xs"
          >
            <span>TanStack Start Official Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </main>
  )
}
