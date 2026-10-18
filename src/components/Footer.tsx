import { Link } from '@tanstack/react-router'
import { Heart, Globe, Terminal, Code2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="site-footer mt-16 py-12 px-4">
      <div className="page-wrap">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base text-[var(--sea-ink)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
              TanStack Start 1.0 Demo Showcase
            </div>
            <p className="text-[var(--sea-ink-soft)] text-xs leading-relaxed max-w-md">
              A comprehensive live demonstration showcasing every core capability from Tanner Linsley's{' '}
              <a
                href="https://tanstack.com/blog/tanstack-start-1-0"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold"
              >
                TanStack Start 1.0 is Stable
              </a>{' '}
              announcement: type-safe routing, server functions, full-stack middleware, isomorphic environment functions, streaming defer, and AI agent guardrails.
            </p>
            <div className="flex items-center gap-3 text-xs text-[var(--sea-ink-soft)] pt-1">
              <span className="inline-flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" />
                Vite + Nitro
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                React 19
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Zero-Magic SSR
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--sea-ink)] mb-3">
              Feature Demos
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--sea-ink-soft)] list-none p-0 m-0">
              <li>
                <Link
                  to="/features/routing"
                  search={{ category: 'all', sortBy: 'newest', page: 1 }}
                  className="hover:text-[var(--sea-ink)]"
                >
                  Type-Safe Routing
                </Link>
              </li>
              <li>
                <Link to="/features/execution-modes" className="hover:text-[var(--sea-ink)]">
                  SSR & Execution Modes
                </Link>
              </li>
              <li>
                <Link to="/features/server-functions" className="hover:text-[var(--sea-ink)]">
                  Typed Server Functions
                </Link>
              </li>
              <li>
                <Link to="/features/middleware" className="hover:text-[var(--sea-ink)]">
                  Full-Stack Middleware
                </Link>
              </li>
              <li>
                <Link to="/features/isomorphic" className="hover:text-[var(--sea-ink)]">
                  createIsomorphicFn
                </Link>
              </li>
              <li>
                <Link to="/features/streaming" className="hover:text-[var(--sea-ink)]">
                  Streaming & defer()
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--sea-ink)] mb-3">
              Official Links
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--sea-ink-soft)] list-none p-0 m-0">
              <li>
                <a
                  href="https://tanstack.com/blog/tanstack-start-1-0"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--sea-ink)]"
                >
                  1.0 Announcement Blog
                </a>
              </li>
              <li>
                <a
                  href="https://tanstack.com/start"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--sea-ink)]"
                >
                  Start Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/TanStack/router"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--sea-ink)]"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://tanstack.com/intent"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--sea-ink)]"
                >
                  TanStack Intent (Agents)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--line)] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--sea-ink-soft)] gap-2">
          <p className="m-0">
            Built for pair programming exploration of TanStack Start 1.0.
          </p>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <span className="font-semibold text-[var(--sea-ink)]">@tanstack/react-start</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" />
          </div>
        </div>
      </div>
    </footer>
  )
}
