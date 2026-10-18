import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { timingMiddleware, authSimulationMiddleware } from './middleware'
import { postsStore, type Post } from './postsData'

/**
 * 1. fetchDashboardStats:
 * Basic GET server function called during SSR or client navigation
 */
export const fetchDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const memory = process.memoryUsage()
  return {
    serverTimestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryRssMb: Math.round(memory.rss / 1024 / 1024),
    memoryHeapMb: Math.round(memory.heapUsed / 1024 / 1024),
    totalPosts: postsStore.length,
    featuresSupported: [
      'Type-Safe Routing',
      'Server Functions (GET & POST)',
      'Full-Stack Middleware',
      'createIsomorphicFn',
      'HTML & Data Streaming (defer)',
      'Zod Search Validation',
      'SSR / Client / Hybrid Modes',
      'AI Agent Guardrails (Intent)',
    ],
  }
})

/**
 * 2. fetchPosts:
 * GET server function with Zod validation for filtering, search, and sorting
 */
const fetchPostsSchema = z.object({
  category: z.enum(['all', 'architecture', 'fullstack', 'routing', 'agents']).default('all'),
  query: z.string().optional().default(''),
  sortBy: z.enum(['newest', 'likes']).default('newest'),
})

export const fetchPosts = createServerFn({ method: 'GET' })
  .validator((input: unknown) => fetchPostsSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    let result = [...postsStore]

    if (data.category && data.category !== 'all') {
      result = result.filter((p) => p.category === data.category)
    }

    if (data.query && data.query.trim()) {
      const q = data.query.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    if (data.sortBy === 'likes') {
      result.sort((a, b) => b.likes - a.likes)
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  })

/**
 * 3. fetchPostById:
 * Server function that throws notFound() if the item does not exist
 */
const postByIdSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
})

export const fetchPostById = createServerFn({ method: 'GET' })
  .validator((input: unknown) => postByIdSchema.parse(input))
  .handler(async ({ data }) => {
    const post = postsStore.find((p) => p.id === data.id)
    if (!post) {
      throw notFound()
    }
    return post
  })

/**
 * 4. createPostMutation:
 * POST server function called from client form with full validation
 */
const createPostSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  category: z.enum(['architecture', 'fullstack', 'routing', 'agents']),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  author: z.string().min(2, 'Author name is required'),
})

export const createPostMutation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => createPostSchema.parse(input))
  .handler(async ({ data }) => {
    const newPost: Post = {
      id: String(Date.now()),
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: data.category,
      excerpt: data.excerpt,
      content: data.content,
      author: data.author,
      readTime: `${Math.max(2, Math.round(data.content.length / 250))} min`,
      createdAt: new Date().toISOString().split('T')[0],
      tags: [data.category.toUpperCase(), 'Community'],
      likes: 1,
    }

    postsStore.unshift(newPost)
    return { success: true, post: newPost }
  })

/**
 * 5. toggleLikeMutation:
 * In-memory like counter mutation
 */
export const toggleLikeMutation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const post = postsStore.find((p) => p.id === data.id)
    if (!post) {
      throw notFound()
    }
    post.likes += 1
    return { id: post.id, likes: post.likes }
  })

/**
 * 6. executeTraceCall:
 * Server function wrapped in full-stack middleware to demonstrate
 * client-to-server and server-to-client context passing.
 */
export const executeTraceCall = createServerFn({ method: 'POST' })
  .middleware([timingMiddleware, authSimulationMiddleware])
  .validator((input: unknown) => z.object({ payloadNote: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    // Context contains data injected by middleware (both client and server phases!)
    return {
      message: 'Full-stack middleware successfully traversed client and server boundaries!',
      payloadNote: data.payloadNote,
      context,
      serverExecutionTimestamp: Date.now(),
    }
  })

/**
 * 7. fetchSlowStreamingData:
 * Simulates a heavy or slow backend operation (1500ms) to show defer() and <Suspense> streaming
 */
export const fetchSlowStreamingData = createServerFn({ method: 'GET' }).handler(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return {
    completionTime: new Date().toLocaleTimeString(),
    simulatedLatencyMs: 1500,
    insights: [
      'Fast initial HTML delivered with 0ms delay while this block was still computing on the server.',
      'Server streamed the resolved promise chunk using HTTP chunked transfer encoding.',
      'Hydration seamlessly attached without freezing the client UI thread.',
      'No React Server Components required to achieve streaming data boundaries.',
    ],
  }
})

/**
 * 8. triggerServerError:
 * Demonstrates CatchBoundary & error handling
 */
export const triggerServerError = createServerFn({ method: 'POST' }).handler(async () => {
  throw new Error('Intentional Demo Exception: TanStack Start safely caught this server crash!')
})
