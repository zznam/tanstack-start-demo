import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  PlusCircle,
  Send,
  AlertCircle,
  CheckCircle2,
  Heart,
  Terminal,
  Zap,
} from 'lucide-react'
import {
  fetchPosts,
  createPostMutation,
  toggleLikeMutation,
  triggerServerError,
} from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'
import { LessonProgress } from '../components/LessonProgress'
import { createPostSchema } from '../utils/postSchemas'
import type { Post } from '../utils/postsData'

export const Route = createFileRoute('/features/server-functions')({
  loader: async () => {
    const initialPosts = await fetchPosts({ data: { category: 'all', query: '', sortBy: 'newest' } })
    return { initialPosts }
  },
  component: ServerFunctionsPage,
})

function ServerFunctionsPage() {
  const { initialPosts } = Route.useLoaderData()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const router = useRouter()
  const [likingIds, setLikingIds] = useState<string[]>([])
  useEffect(() => setPosts(initialPosts), [initialPosts])

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'architecture' | 'fullstack' | 'routing' | 'agents'>('fullstack')
  const [author, setAuthor] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  // Keep edits made while an earlier submission is awaiting its response.
  const draftRevision = useRef(0)

  // Status & Telemetry
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [lastRpcLatency, setLastRpcLatency] = useState<number | null>(null)
  const [serverErrorCaught, setServerErrorCaught] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setFormError(null)
    setFormSuccess(null)
    const validated = createPostSchema.safeParse({ title, category, author: author.trim() || 'Anonymous Developer', excerpt, content })
    if (!validated.success) {
      setFormError(validated.error.issues.map((issue) => issue.message).join('. '))
      return
    }
    setIsSubmitting(true)
    const submittedRevision = draftRevision.current
    const startTime = performance.now()

    try {
      // Calling createServerFn directly from client event handler!
      const response = await createPostMutation({
        data: {
          title,
          category,
          author: author.trim() || 'Anonymous Developer',
          excerpt,
          content,
        },
      })

      const elapsed = Math.round(performance.now() - startTime)
      setLastRpcLatency(elapsed)

      if (response.success && response.post) {
        setPosts((prev) => [response.post, ...prev])
        await router.invalidate()
        const hasNewEdits = draftRevision.current !== submittedRevision
        setFormSuccess(`Post "${response.post.title}" created via typed RPC in ${elapsed}ms!${hasNewEdits ? ' Your newer draft edits were kept.' : ''}`)
        if (!hasNewEdits) {
          setTitle('')
          setExcerpt('')
          setContent('')
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Validation or Server RPC error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (likingIds.includes(postId)) return
    setLikingIds((ids) => [...ids, postId])
    setFormError(null)
    const startTime = performance.now()
    try {
      const result = await toggleLikeMutation({ data: { id: postId } })
      setLastRpcLatency(Math.round(performance.now() - startTime))
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: result.likes } : p)),
      )
      await router.invalidate()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not like the post.')
    } finally {
      setLikingIds((ids) => ids.filter((id) => id !== postId))
    }
  }

  const handleSimulateServerError = async () => {
    setServerErrorCaught(null)
    const startTime = performance.now()
    try {
      await triggerServerError()
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime)
      setLastRpcLatency(elapsed)
      setServerErrorCaught(`Caught typed error from createServerFn in ${elapsed}ms: "${err instanceof Error ? err.message : 'Server error'}"`)
    }
  }

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="server-fn" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            @tanstack/react-start: createServerFn
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          Typed Server Functions
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-2xl leading-relaxed">
          &ldquo;You can call a typed server function from a loader or an event handler and compose middleware around those calls... without creating API boilerplate.&rdquo;
        </p>
      </div>

      {/* Latency & Telemetry Strip */}
      {lastRpcLatency !== null && (
        <div className="mb-6 p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] flex items-center justify-between text-xs font-mono text-[var(--sea-ink-soft)]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Latest RPC Roundtrip Time:</span>
            <strong className="text-[var(--sea-ink)]">{lastRpcLatency} ms</strong>
          </div>
          <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-semibold">
            Zero REST / Express endpoints required
          </span>
        </div>
      )}

      <p className="demo-alert mb-6 text-sm">Demo data is shared in this server process, resets on restart, and keeps at most 100 posts. Avoid entering personal information.</p>
      {/* Main Grid: Interactive Mutation on left, Live Posts on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Left Column: Client Mutation Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="demo-panel">
            <div className="flex items-center gap-2 mb-3">
              <PlusCircle className="w-5 h-5 text-[var(--lagoon-deep)]" />
              <h2 className="demo-section-title text-lg font-bold">Call Server Function from UI</h2>
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] mb-5">
              Submitting this form calls <code>createPostMutation()</code> directly in the browser. Input is validated with Zod, executed on the server, and returns typed results.
            </p>

            {formError && (
              <div role="alert" className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div role="status" className="mb-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              onChangeCapture={() => { draftRevision.current += 1 }}
              aria-busy={isSubmitting}
              className="space-y-4"
            >
              <div>
                <label htmlFor="post-title" className="block text-xs font-semibold text-[var(--sea-ink)] mb-1">
                  Post Title (min 4 chars)
                </label>
                <input id="post-title" minLength={4} maxLength={160}
                  type="text"
                  placeholder="e.g. Exploring Server Boundaries in TanStack Start"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="demo-input text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="post-category" className="block text-xs font-semibold text-[var(--sea-ink)] mb-1">
                    Category
                  </label>
                  <select id="post-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Post['category'])}
                    className="demo-select text-xs"
                  >
                    <option value="architecture">Architecture</option>
                    <option value="fullstack">Full-Stack</option>
                    <option value="routing">Routing</option>
                    <option value="agents">AI Agents</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="post-author" className="block text-xs font-semibold text-[var(--sea-ink)] mb-1">
                    Author Name
                  </label>
                  <input id="post-author" minLength={2} maxLength={80}
                    type="text"
                    placeholder="Your Name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="demo-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="post-excerpt" className="block text-xs font-semibold text-[var(--sea-ink)] mb-1">
                  Excerpt (min 10 chars)
                </label>
                <input id="post-excerpt" minLength={10} maxLength={500}
                  type="text"
                  placeholder="Brief summary of the article..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                  className="demo-input text-xs"
                />
              </div>

              <div>
                <label htmlFor="post-content" className="block text-xs font-semibold text-[var(--sea-ink)] mb-1">
                  Full Content (min 20 chars)
                </label>
                <textarea id="post-content" minLength={20} maxLength={10000}
                  placeholder="Detailed markdown or body text for the server to persist..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="demo-textarea text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="demo-button w-full text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Calling Server RPC...' : 'Execute Typed Server Mutation'}</span>
              </button>
            </form>
          </div>

          {/* Error handling test */}
          <div className="demo-panel">
            <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-500" />
              Typed Server Error Propagation Test
            </h3>
            <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
              Trigger a server function that throws an unhandled exception to test RPC error serialization:
            </p>
            <button
              type="button"
              onClick={handleSimulateServerError}
              className="demo-button demo-button-danger text-xs"
            >
              Trigger Server Function Error
            </button>
            {serverErrorCaught && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-700 dark:text-red-400">
                {serverErrorCaught}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Data List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--sea-ink)]">
              Posts in Server In-Memory Store ({posts.length})
            </h2>
            <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
              Updated via RPC
            </span>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] transition hover:border-[var(--lagoon-deep)]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="demo-pill font-mono text-[10px] uppercase">
                    {post.category}
                  </span>
                  <span className="text-[11px] text-[var(--sea-ink-soft)]">{post.createdAt.split('T')[0]}</span>
                </div>

                <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-1">
                  <Link to="/features/routing/posts/$postId" params={{ postId: post.id }} search={{ category: 'all', query: '', sortBy: 'newest' }}>{post.title}</Link>
                </h3>
                <p className="text-xs text-[var(--sea-ink-soft)] line-clamp-2 mb-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs">
                  <span className="text-[var(--sea-ink-soft)]">By {post.author}</span>
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    disabled={likingIds.includes(post.id)}
                    aria-label={`Like ${post.title}: ${post.likes} likes`}
                    className="demo-button text-[11px] py-1 px-2.5"
                  >
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{post.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pattern Breakdown */}
      <div className="demo-panel">
        <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-2">
          createServerFn Specification
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
          Notice how the same server function can be invoked in loaders during SSR, or directly in browser event handlers:
        </p>
        <CodeBlock
          code={`import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const createPostMutation = createServerFn({ method: 'POST' })
  .validator((input) => postSchema.parse(input))
  .handler(async ({ data }) => {
    // Runs ONLY on the server (Node/Nitro)
    const post = await db.insert(data)
    return { success: true, post }
  })

// In your client React component:
const result = await createPostMutation({ data: { title, content } })`}
        />
      </div>
      <LessonProgress id="server-functions" />
    </div>
  )
}
