import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Menu, X, Sparkles, ExternalLink } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/features/routing', label: 'Routing' },
    { to: '/features/execution-modes', label: 'SSR & Modes' },
    { to: '/features/server-functions', label: 'Server Functions' },
    { to: '/features/middleware', label: 'Middleware' },
    { to: '/features/isomorphic', label: 'Isomorphic' },
    { to: '/features/streaming', label: 'Streaming' },
    { to: '/features/server-context', label: 'Server Context' },
    { to: '/features/agent-dx', label: 'Agent DX' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center justify-between py-2.5 sm:py-3 gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-bold text-[var(--sea-ink)] no-underline shadow-sm hover:scale-[1.02] transition"
          >
            <span className="flex h-2.5 w-2.5 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)] animate-pulse" />
            <span className="tracking-tight">TanStack Start 1.0</span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
              STABLE
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center gap-1 text-xs font-semibold">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to as any}
              search={item.to === '/features/routing' ? ({ category: 'all', sortBy: 'newest', page: 1 } as any) : undefined}
              className="px-2.5 py-1.5 rounded-lg text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] transition no-underline"
              activeProps={{
                className: 'px-2.5 py-1.5 rounded-lg font-bold text-[var(--sea-ink)] bg-[var(--surface-strong)] shadow-xs border border-[var(--line)]',
              }}
              activeOptions={{ exact: item.to === '/' }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Medium Screen Dropdown or Quick Nav */}
        <div className="hidden lg:flex xl:hidden items-center gap-1 text-xs font-semibold">
          <Link
            to="/"
            className="px-2 py-1 rounded text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            activeProps={{ className: 'font-bold text-[var(--sea-ink)] underline' }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/features/routing"
            search={{ category: 'all', sortBy: 'newest', page: 1 }}
            className="px-2 py-1 rounded text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            activeProps={{ className: 'font-bold text-[var(--sea-ink)] underline' }}
          >
            Routing
          </Link>
          <Link
            to="/features/server-functions"
            className="px-2 py-1 rounded text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            activeProps={{ className: 'font-bold text-[var(--sea-ink)] underline' }}
          >
            ServerFn
          </Link>
          <Link
            to="/features/middleware"
            className="px-2 py-1 rounded text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            activeProps={{ className: 'font-bold text-[var(--sea-ink)] underline' }}
          >
            Middleware
          </Link>
          <Link
            to="/features/isomorphic"
            className="px-2 py-1 rounded text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            activeProps={{ className: 'font-bold text-[var(--sea-ink)] underline' }}
          >
            Isomorphic
          </Link>
          <Link
            to="/features/streaming"
            className="px-2 py-1 rounded text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            activeProps={{ className: 'font-bold text-[var(--sea-ink)] underline' }}
          >
            Streaming
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <a
            href="https://tanstack.com/blog/tanstack-start-1-0"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.12)] border border-[rgba(79,184,178,0.25)] hover:bg-[rgba(79,184,178,0.2)] transition no-underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1.0 Blog Post</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <ThemeToggle />

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[var(--line)] py-3 px-2 space-y-1">
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to as any}
                search={item.to === '/features/routing' ? ({ category: 'all', sortBy: 'newest', page: 1 } as any) : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] transition no-underline"
                activeProps={{
                  className: 'px-3 py-2 rounded-lg text-xs font-bold text-[var(--sea-ink)] bg-[var(--surface-strong)] border border-[var(--line)]',
                }}
                activeOptions={{ exact: item.to === '/' }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-[var(--line)] mt-2">
            <a
              href="https://tanstack.com/blog/tanstack-start-1-0"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.12)] no-underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Read Announcement on TanStack Blog
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
