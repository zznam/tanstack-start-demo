import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Heart, Calendar, User, Clock, Share2, Check, Tag } from 'lucide-react'
import { fetchPostById, toggleLikeMutation } from '../utils/serverFns'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/routing/posts/$postId')({
  loader: async ({ params }) => {
    try {
      const post = await fetchPostById({ data: { id: params.postId } })
      return { post }
    } catch (err: any) {
      throw notFound()
    }
  },
  component: PostDetailPage,
})

function PostDetailPage() {
  const { post } = Route.useLoaderData()
  const params = Route.useParams()
  const [likes, setLikes] = useState(post.likes)
  const [isLiking, setIsLiking] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    try {
      const result = await toggleLikeMutation({ data: { id: post.id } })
      setLikes(result.likes)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="demo-page max-w-4xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          to="/features/routing"
          search={{ category: 'all', sortBy: 'newest', page: 1 }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--lagoon-deep)] hover:underline no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles & Search
        </Link>
      </div>

      <article className="demo-panel mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FeatureBadge type="routing" />
          <span className="demo-pill font-mono text-[11px] uppercase tracking-wider">
            Param: $postId = {params.postId}
          </span>
          <span className="demo-pill bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
            {post.category}
          </span>
        </div>

        <h1 className="demo-title text-2xl sm:text-4xl font-extrabold mb-4 text-[var(--sea-ink)]">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--sea-ink-soft)] pb-4 mb-6 border-b border-[var(--line)]">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.createdAt}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--sea-ink)] leading-relaxed mb-8">
          <p className="text-base sm:text-lg font-medium text-[var(--sea-ink-soft)] mb-4">
            {post.excerpt}
          </p>
          <p className="text-sm sm:text-base leading-relaxed">
            {post.content}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Tag className="w-3.5 h-3.5 text-[var(--sea-ink-soft)]" />
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg bg-[var(--chip-bg)] border border-[var(--line)] text-xs font-mono text-[var(--sea-ink-soft)]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Interactive Action Bar */}
        <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            className={`demo-button text-xs ${isLiking ? 'opacity-50' : ''}`}
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>{likes} Likes (Server Mutation)</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="demo-button demo-button-secondary text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>
      </article>

      {/* Code explanation */}
      <div className="demo-panel">
        <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-1">
          Type-Safe Dynamic Route Pattern
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
          The route file is named <code>posts.$postId.tsx</code>. TanStack Router automatically infers <code>params.postId</code> as string with zero manual type casting:
        </p>
        <CodeBlock
          code={`export const Route = createFileRoute('/features/routing/posts/$postId')({
  loader: async ({ params }) => {
    // params.postId is strictly typed!
    const post = await fetchPostById({ data: { id: params.postId } })
    if (!post) throw notFound()
    return { post }
  },
})`}
        />
      </div>
    </div>
  )
}
