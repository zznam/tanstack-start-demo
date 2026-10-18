import { createFileRoute, Link, useNavigate, useLocation, notFound } from '@tanstack/react-router'
import { routingSearchSchema, type RoutingSearch } from '../utils/postSchemas'
import { useEffect, useState, useTransition } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  FileQuestion,
  Eye,
  CheckCircle,
} from 'lucide-react'
import { fetchPosts } from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { NotFound } from '../components/NotFound'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/routing')({
  validateSearch: (search: Record<string, unknown>): RoutingSearch => {
    return routingSearchSchema.parse(search)
  },
  loaderDeps: ({ search: { category, query, sortBy } }) => ({
    category: category ?? 'all',
    query: query ?? '',
    sortBy: sortBy ?? 'newest',
  }),
  loader: async ({ deps }) => {
    const posts = await fetchPosts({
      data: {
        category: deps.category,
        query: deps.query,
        sortBy: deps.sortBy,
      },
    })
    return { posts }
  },
  notFoundComponent: () => <NotFound />,
  component: RoutingFeaturePage,
})

function RoutingFeaturePage() {
  const { posts } = Route.useLoaderData()
  const search = Route.useSearch()
  // Location updates when navigation starts; loader data may arrive later.
  // Keep keystrokes urgent and sync Back/Forward from the current URL.
  const urlQuery = useLocation({ select: (location) => routingSearchSchema.parse(location.search).query })
  const [query, setQuery] = useState(urlQuery)
  useEffect(() => setQuery(urlQuery), [urlQuery])
  const navigate = useNavigate({ from: Route.fullPath })
  const [, startTransition] = useTransition()

  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)
  const [triggerCrash, setTriggerCrash] = useState(false)
  const [triggerNotFoundState, setTriggerNotFoundState] = useState(false)

  if (triggerCrash) {
    throw new Error('Interactive Error Demo: Caught gracefully by DefaultCatchBoundary!')
  }

  if (triggerNotFoundState) {
    throw notFound()
  }

  const updateSearch = (updater: Partial<RoutingSearch>) => {
    startTransition(() => {
      navigate({
        replace: 'query' in updater,
        search: (old: RoutingSearch) => ({
          ...old,
          ...updater,
        }),
      })
    })
  }

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'fullstack', label: 'Full-Stack' },
    { id: 'routing', label: 'Routing' },
    { id: 'agents', label: 'AI Agents' },
  ] as const

  return (
    <div className="demo-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="routing" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            URL: /features/routing?category={search.category}&sortBy={search.sortBy}
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          Type-Safe Routing & URL Search State
        </h1>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-3">Sample articles for exploring routing; content and author attributions are illustrative.</p>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-2xl leading-relaxed">
          &ldquo;Start started with a router... All the work we did to make it type-safe and strict, and to make the APIs explicit, was about giving you freedom while still telling you when something doesn&apos;t fit.&rdquo;
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="demo-card">
          <div className="flex items-center gap-2 font-bold text-sm mb-1 text-[var(--sea-ink)]">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            Zod Search Validation
          </div>
          <p className="text-xs text-[var(--sea-ink-soft)] m-0">
            URL search parameters are parsed, validated, and typed on every navigation using Zod.
          </p>
        </div>
        <div className="demo-card">
          <div className="flex items-center gap-2 font-bold text-sm mb-1 text-[var(--sea-ink)]">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            Intent Preloading
          </div>
          <p className="text-xs text-[var(--sea-ink-soft)] m-0">
            Hovering over links triggers automatic preloading of route chunks and server loaders.
          </p>
        </div>
        <div className="demo-card">
          <div className="flex items-center gap-2 font-bold text-sm mb-1 text-[var(--sea-ink)]">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            Error & 404 Boundaries
          </div>
          <p className="text-xs text-[var(--sea-ink-soft)] m-0">
            Granular boundaries ensure route failures never tear down the entire application shell.
          </p>
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <div className="demo-panel mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 pb-4 border-b border-[var(--line)]">
          <div>
            <h2 className="demo-section-title text-lg font-bold">Interactive Search & Filter Controls</h2>
            <p className="text-xs text-[var(--sea-ink-soft)] m-0">
              Notice how modifying these controls synchronizes with the browser URL and re-runs the loader with full type safety.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTriggerNotFoundState(true)}
              className="demo-button demo-button-secondary text-xs px-3 py-1.5"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              Trigger 404
            </button>
            <button
              type="button"
              onClick={() => setTriggerCrash(true)}
              className="demo-button demo-button-danger text-xs px-3 py-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Trigger Route Crash
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--sea-ink-soft)]" />
              <input
                type="search"
                aria-label="Search articles"
                maxLength={200}
                placeholder="Search articles by title, excerpt, or tag..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  updateSearch({ query: e.target.value })
                }}
                className="demo-input pl-9 text-sm"
              />
            </div>

            {/* Sort Select */}
            <div className="w-full sm:w-48 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[var(--sea-ink-soft)] shrink-0" />
              <select
                aria-label="Sort articles"
                value={search.sortBy}
                onChange={(e) => updateSearch({ sortBy: e.target.value as 'newest' | 'likes' })}
                className="demo-select text-sm"
              >
                <option value="newest">Sort by Newest</option>
                <option value="likes">Sort by Likes</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-[var(--sea-ink-soft)] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateSearch({ category: cat.id })}
                aria-pressed={search.category === cat.id}
                className={`px-3 py-1 text-xs rounded-full border transition font-medium ${
                  search.category === cat.id
                    ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon)] text-[var(--sea-ink)] shadow-xs font-bold'
                    : 'border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:border-[var(--line)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List & Preload Demonstration */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--sea-ink)]">
            Articles Matching Search Criteria ({posts.length})
          </h2>
          {hoveredPostId && (
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-1 animate-pulse">
              <Eye className="w-3.5 h-3.5" />
              Preloading route /posts/{hoveredPostId}...
            </span>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[var(--line)] rounded-2xl bg-[var(--surface)]">
            <p className="text-sm text-[var(--sea-ink-soft)] m-0">
              No posts matched your current search filters. Try clearing the query or switching categories!
            </p>
            <button
              type="button"
              onClick={() => updateSearch({ category: 'all', query: '', sortBy: 'newest' })}
              className="demo-button text-xs mt-3"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <article
                key={post.id}
                onMouseEnter={() => setHoveredPostId(post.id)}
                onMouseLeave={() => setHoveredPostId(null)}
                className="demo-panel group hover:border-[var(--lagoon-deep)] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="demo-pill text-[10px] uppercase tracking-wider font-mono">
                        {post.category}
                      </span>
                      <span className="text-xs text-[var(--sea-ink-soft)]">• {post.readTime}</span>
                      <span className="text-xs text-[var(--sea-ink-soft)]">• {post.createdAt.split('T')[0]}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[var(--sea-ink)] mb-1 group-hover:text-[var(--lagoon-deep)] transition">
                      <Link
                        to="/features/routing/posts/$postId"
                        params={{ postId: post.id }}
                        search={search}
                        preload="intent"
                        className="no-underline text-inherit"
                      >
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-[var(--sea-ink-soft)] leading-relaxed mb-3">
                      {post.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[var(--chip-bg)] border border-[var(--line)] text-[11px] font-mono text-[var(--sea-ink-soft)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                    <span className="text-xs font-semibold text-[var(--sea-ink-soft)]">
                      ❤️ {post.likes} likes
                    </span>
                    <Link
                      to="/features/routing/posts/$postId"
                      params={{ postId: post.id }}
                      search={search}
                      preload="intent"
                      className="demo-button text-xs py-1.5 px-3 no-underline inline-flex items-center gap-1"
                    >
                      <span>Read Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Code Snippet */}
      <div className="demo-panel">
        <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-1">
          Code Pattern: Type-Safe Search Params with Zod
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
          TanStack Router makes search parameters first-class, strictly typed state:
        </p>
        <CodeBlock
          code={`const routingSearchSchema = z.object({
  category: z.enum(['all', 'architecture', 'fullstack', 'routing', 'agents']).catch('all'),
  query: z.string().optional().catch(''),
  sortBy: z.enum(['newest', 'likes']).catch('newest'),
})

export const Route = createFileRoute('/features/routing')({
  validateSearch: (search) => routingSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return { posts: await fetchPosts({ data: deps }) }
  },
})`}
        />
      </div>
    </div>
  )
}
