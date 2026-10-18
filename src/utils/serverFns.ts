import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { timingMiddleware } from './middleware'
import { postStore } from './postStore.server'
import { createPostSchema, fetchPostsSchema, postByIdSchema } from './postSchemas'
import { getOrigin, getEnvironmentInfo } from './isomorphic'

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
    totalPosts: postStore.list().length,
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
export const fetchPosts = createServerFn({ method: 'GET' })
  .validator(fetchPostsSchema)
  .handler(async ({ data }) => postStore.list(data))

/**
 * 3. fetchPostById:
 * Server function that throws notFound() if the item does not exist
 */
export const fetchPostById = createServerFn({ method: 'GET' })
  .validator(postByIdSchema)
  .handler(async ({ data }) => {
    const post = postStore.get(data.id)
    if (!post) throw notFound()
    return post
  })

/**
 * 4. createPostMutation:
 * POST server function called from client form with full validation
 */
export const createPostMutation = createServerFn({ method: 'POST' })
  .validator(createPostSchema)
  .handler(async ({ data }) => ({ success: true, post: postStore.create(data) }))

/**
 * 5. toggleLikeMutation:
 * In-memory like counter mutation
 */
export const toggleLikeMutation = createServerFn({ method: 'POST' })
  .validator(postByIdSchema)
  .handler(async ({ data }) => {
    const result = postStore.like(data.id)
    if (!result) throw notFound()
    return result
  })

/**
 * 6. executeTraceCall:
 * Server function wrapped in full-stack middleware to demonstrate
 * client-to-server and server-to-client context passing.
 */
export const executeTraceCall = createServerFn({ method: 'POST' })
  .middleware([timingMiddleware])
  .validator(z.object({ payloadNote: z.string().trim().max(200) }))
  .handler(async ({ data, context }) => {
    // Context contains data injected by middleware (both client and server phases!)
    return {
      message: 'Full-stack middleware successfully traversed client and server boundaries!',
      payloadNote: data.payloadNote,
      context: {
        requestId: context.requestId,
        clientStartTime: context.clientStartTime,
        serverReceivedTime: context.serverReceivedTime,
        serverCompletedTime: context.serverCompletedTime,
        serverProcessingTime: context.serverProcessingTime,
        durationToServer: context.durationToServer,
        serverPlatform: context.serverPlatform,
        serverNodeVersion: context.serverNodeVersion,
        authenticatedUser: context.authenticatedUser,
        clientEndTime: null as number | null,
        totalRoundtrip: null as number | null,
      },
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

// A server function keeps the server comparison accurate after client navigation too.
export const fetchServerEnvironment = createServerFn({ method: 'GET' }).handler(async () => ({
  serverOrigin: getOrigin(),
  serverEnv: getEnvironmentInfo(),
}))
