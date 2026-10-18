import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, Sparkles, ExternalLink } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

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
    { to: '/about', label: 'About' },
  ] as const

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav aria-label="Main navigation" className="page-wrap !max-w-[1600px] !w-full flex items-center justify-between py-2.5 sm:py-3 gap-2">
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
        <div className="hidden 2xl:flex items-center gap-1 text-xs font-semibold">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={item.to === '/features/routing' ? { category: 'all', query: '', sortBy: 'newest' } : undefined}
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
            className="2xl:hidden p-2 rounded-lg text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)] transition"
            ref={menuButton}
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="2xl:hidden max-h-[70vh] overflow-y-auto border-t border-[var(--line)] py-3 px-2 space-y-1">
          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={item.to === '/features/routing' ? { category: 'all', query: '', sortBy: 'newest' } : undefined}
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
