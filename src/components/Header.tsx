import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, ExternalLink, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { learningTopics } from '../utils/learningTopics'
import { TopicLink } from './TopicLink'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const menuPanel = useRef<HTMLDivElement>(null)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        !menuPanel.current?.contains(event.target as Node) &&
        !menuButton.current?.contains(event.target as Node)
      )
        setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav
        aria-label="Main navigation"
        className="page-wrap !w-full flex items-center justify-between py-3 gap-3"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 no-underline text-[var(--sea-ink)] font-bold text-sm"
        >
          <span className="brand-symbol">
            <BookOpen className="size-4" />
          </span>
          <span>
            TanStack{' '}
            <span className="demo-muted font-medium">Learning Lab</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            to="/"
            hash="topics"
            className="hidden md:inline-flex text-sm font-semibold no-underline"
          >
            All topics
          </Link>
          <Link to="/gamification" className="hidden md:inline-flex text-sm font-semibold no-underline">
            Learning Quest
          </Link>
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/overview"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex items-center gap-1 text-xs demo-muted no-underline"
          >
            Docs
            <ExternalLink className="size-3" />
          </a>
          <ThemeToggle />
          <button
            type="button"
            ref={menuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="demo-button demo-button-secondary !p-2.5 !text-xs"
            aria-controls="topic-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
            <span className="hidden sm:inline">Topics</span>
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div
          id="topic-navigation"
          ref={menuPanel}
          className="page-wrap !w-full max-h-[75vh] overflow-y-auto border-t border-[var(--line)] py-5"
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {(['Foundations', 'Patterns', 'Advanced'] as const).map((level) => (
              <div key={level}>
                <p className="island-kicker px-3 mb-2">{level}</p>
                <div className="space-y-1">
                  {learningTopics
                    .filter((topic) => topic.level === level)
                    .map((topic) => (
                      <TopicLink
                        key={topic.id}
                        topic={topic}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`topic-nav-link ${pathname === topic.to ? 'topic-nav-active' : ''}`}
                      >
                        {topic.title}
                      </TopicLink>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-5 border-t border-[var(--line)] mt-4 pt-4 px-3 text-sm">
            <Link to="/" hash="topics" onClick={() => setMobileMenuOpen(false)}>
              All topics
            </Link>
            <Link to="/gamification" onClick={() => setMobileMenuOpen(false)}>
              Learning Quest
            </Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
              About the project
            </Link>
            <Link to="/updates" onClick={() => setMobileMenuOpen(false)}>
              What’s new
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
