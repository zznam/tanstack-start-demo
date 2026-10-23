import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  Search,
  Server,
  Sparkles,
} from 'lucide-react'
import { fetchDashboardStats } from '../utils/serverFns'
import {
  learningLevels,
  learningTopics,
  filterTopics,
} from '../utils/learningTopics'
import { catalogSearchSchema } from '../utils/catalogSearch'
import { useLearningProgress } from '../utils/useLearningProgress'
import { TopicLink } from '../components/TopicLink'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loader: () => fetchDashboardStats(),
  head: () => ({
    meta: [
      { title: 'TanStack Start Learning Lab' },
      {
        name: 'description',
        content:
          'Explore hands-on TanStack Start topics, from typed routing to cache invalidation, optimistic concurrency, and resilient parallel loading.',
      },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const stats = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = search.q ?? ''
  const level = search.level ?? 'All topics'
  const incompleteOnly = search.incomplete ?? false
  const updateFilters = (patch: Partial<typeof search>, replace = false) =>
    navigate({ search: (previous) => ({ ...previous, ...patch }), replace, resetScroll: false })
  const { completed, toggle } = useLearningProgress()
  const topics = filterTopics(query, level, incompleteOnly, completed)
  const next = learningTopics.find((topic) => !completed.includes(topic.id))
  const reset = () => navigate({ search: {}, resetScroll: false })

  return (
    <div className="page-wrap pb-16 pt-8 sm:pt-12">
      <section className="island-shell learning-hero rounded-[2rem] p-6 sm:p-10 lg:p-12">
        <div className="relative">
          <p className="island-kicker flex items-center gap-2 mb-5">
            <Sparkles className="size-4" />
            The TanStack Start learning lab
          </p>
          <h1 className="display-title text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight mb-5">
            Small experiments.
            <br />
            Deeper understanding.
          </h1>
          <p className="demo-muted text-base sm:text-lg leading-relaxed max-w-xl">
            Go from typed routes to the hard parts of full-stack React. Change
            real data, break things safely, and see how the system recovers.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <a href="#topics" className="demo-button no-underline">
              Explore {learningTopics.length} topics
              <ArrowRight className="size-4" />
            </a>
            <button
              type="button"
              className="demo-button demo-button-secondary"
              onClick={() => {
                void updateFilters({ level: 'Advanced', q: undefined, incomplete: undefined })
                document
                  .getElementById('topics')
                  ?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
              }}
            >
              <GraduationCap className="size-4" />
              Jump to advanced labs
            </button>
          </div>
          <p className="text-xs demo-muted mt-5">
            Interactive demos · Inspectable source · No account needed
          </p>
        </div>
        <aside className="learning-path" aria-label="Your learning path">
          <p className="island-kicker mb-4">Your next step</p>
          <div className="flex justify-between items-end mb-3">
            <strong className="text-3xl">
              {completed.length}
              <span className="text-base font-medium demo-muted">
                {' '}
                / {learningTopics.length}
              </span>
            </strong>
            <span className="text-xs demo-muted">topics completed</span>
          </div>
          <progress
            className="learning-progress"
            value={completed.length}
            max={learningTopics.length}
            aria-label="Learning progress"
          />
          <p className="demo-muted text-xs mt-3 mb-6">
            Saved in this browser when storage is available.
          </p>
          {next ? (
            <>
              <p className="text-xs font-semibold demo-muted mb-2">
                {completed.length
                  ? 'Continue with'
                  : 'Suggested starting point'}
              </p>
              <h2 className="font-bold text-lg mb-2">{next.title}</h2>
              <p className="text-sm demo-muted leading-relaxed mb-4">
                {next.summary}
              </p>
              <TopicLink
                topic={next}
                className="inline-flex items-center gap-2 font-bold text-sm"
              >
                {completed.length ? 'Continue learning' : 'Start exploring'}
                <ArrowRight className="size-4" />
              </TopicLink>
            </>
          ) : (
            <p className="font-bold flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              All topics complete. Revisit a lab below.
            </p>
          )}
          <Link to="/gamification" className="demo-button demo-button-secondary no-underline mt-5">
            <Sparkles className="size-4" />View XP & achievements
          </Link>
        </aside>
      </section>

      <section
        id="topics"
        className="mt-12 scroll-mt-24"
        aria-labelledby="topics-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="island-kicker mb-2">
              A path from primitives to patterns
            </p>
            <h2
              id="topics-heading"
              className="text-2xl sm:text-3xl font-extrabold"
            >
              Choose your next experiment
            </h2>
          </div>
          <Link to="/updates" className="demo-pill no-underline">
            <BookOpen className="size-4" />What’s new
          </Link>
        </div>
        <div className="topic-controls mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 demo-muted pointer-events-none" />
            <input
              type="search"
              aria-label="Search learning topics"
              className="demo-input text-sm"
              placeholder="Search topics, concepts, or APIs…"
              value={query}
              maxLength={120}
              onChange={(event) => void updateFilters({ q: event.target.value || undefined }, true)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm demo-muted">
            <input
              type="checkbox"
              checked={incompleteOnly}
              onChange={(event) => void updateFilters({ incomplete: event.target.checked || undefined })}
              className="size-4 accent-[var(--palm)]"
            />
            Hide completed
          </label>
        </div>
        <div
          className="flex flex-wrap gap-2 mb-4"
          role="group"
          aria-label="Filter topics by level"
        >
          {learningLevels.map((item) => (
            <button
              key={item}
              type="button"
              className={`topic-filter ${level === item ? 'is-selected' : ''}`}
              aria-pressed={level === item}
              onClick={() => void updateFilters({ level: item === 'All topics' ? undefined : item })}
            >
              {item}
              <span>
                {item === 'All topics'
                  ? learningTopics.length
                  : learningTopics.filter((topic) => topic.level === item)
                      .length}
              </span>
            </button>
          ))}
        </div>
        {(query || level !== 'All topics' || incompleteOnly) && topics.length > 0 && (
          <button type="button" className="text-sm underline mb-4" onClick={reset}>Reset topic filters</button>
        )}
        <p role="status" className="text-xs demo-muted mb-5">
          {topics.length} {topics.length === 1 ? 'topic' : 'topics'} shown
          {query.trim() ? ` for “${query.trim()}”` : ''}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const done = completed.includes(topic.id)
            return (
              <article
                key={topic.id}
                className={`island-shell topic-card rounded-2xl ${topic.level === 'Advanced' ? 'topic-card-advanced' : ''}`}
              >
                <TopicLink
                  topic={topic}
                  className="topic-card-link no-underline"
                >
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span
                      className={`topic-level ${topic.level === 'Advanced' ? 'topic-level-advanced' : ''}`}
                    >
                      {topic.level}
                    </span>
                    <span className="flex items-center gap-1 text-xs demo-muted">
                      <Clock className="size-3.5" />
                      {topic.minutes} min
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{topic.title}</h3>
                  <p className="demo-muted text-sm leading-relaxed mb-4">
                    {topic.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {topic.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="topic-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-2 text-sm font-bold mt-5">
                    Open {topic.level === 'Advanced' ? 'lab' : 'demo'}
                    <ArrowRight className="size-4" />
                  </span>
                </TopicLink>
                <button
                  type="button"
                  className="topic-complete"
                  aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${topic.title}`}
                  aria-pressed={done}
                  onClick={() => toggle(topic.id)}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                  {done ? 'Completed' : 'Mark complete'}
                </button>
              </article>
            )
          })}
        </div>
        {topics.length === 0 && (
          <div className="demo-panel text-center py-12">
            <Search className="size-7 mx-auto mb-4 demo-muted" />
            <h3 className="font-bold text-xl mb-2">No matching topics</h3>
            <p className="demo-muted mb-5">
              Try a broader term or change your filters.
            </p>
            <button className="demo-button" type="button" onClick={reset}>
              Reset topic filters
            </button>
          </div>
        )}
      </section>
      <section
        className="demo-panel mt-10 flex flex-wrap gap-5 items-center justify-between"
        aria-label="Live server status"
      >
        <div className="flex items-center gap-3">
          <Server className="size-5 text-[var(--palm)]" />
          <div>
            <h2 className="font-bold text-sm">A real full-stack playground</h2>
            <p className="demo-muted text-xs mt-1">
              Server functions run on Node {stats.nodeVersion}. Demo data lives
              in memory and resets on restart.
            </p>
          </div>
        </div>
        <Link
          to="/about"
          className="inline-flex items-center gap-2 text-sm font-bold"
        >
          About this project
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  )
}
