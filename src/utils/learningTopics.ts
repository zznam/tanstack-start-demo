export const learningTopics = [
  {
    id: 'routing',
    to: '/features/routing',
    title: 'Type-safe routing',
    level: 'Foundations',
    minutes: 12,
    summary: 'Validate URL state, preload routes, and recover from errors.',
    tags: ['search', 'Zod', 'navigation'],
    prerequisites: [],
  },
  {
    id: 'execution-modes',
    to: '/features/execution-modes',
    title: 'SSR & execution modes',
    level: 'Foundations',
    minutes: 10,
    summary:
      'Compare server rendering, data-only SSR, and browser-only routes.',
    tags: ['hydration', 'SSR', 'SPA'],
    prerequisites: [],
  },
  {
    id: 'server-functions',
    to: '/features/server-functions',
    title: 'Typed server functions',
    level: 'Foundations',
    minutes: 12,
    summary: 'Send validated mutations across a real client/server boundary.',
    tags: ['RPC', 'validation', 'mutations'],
    prerequisites: ['routing'],
  },
  {
    id: 'middleware',
    to: '/features/middleware',
    title: 'Full-stack middleware',
    level: 'Patterns',
    minutes: 12,
    summary:
      'Follow request IDs, context, and timing through a middleware chain.',
    tags: ['telemetry', 'context', 'requests'],
    prerequisites: ['server-functions'],
  },
  {
    id: 'isomorphic',
    to: '/features/isomorphic',
    title: 'Isomorphic functions',
    level: 'Patterns',
    minutes: 8,
    summary:
      'Choose an implementation for the server and another for the browser.',
    tags: ['environment', 'bundling'],
    prerequisites: ['execution-modes'],
  },
  {
    id: 'streaming',
    to: '/features/streaming',
    title: 'Streaming & Suspense',
    level: 'Patterns',
    minutes: 10,
    summary:
      'Deliver a useful page shell before deferred data finishes loading.',
    tags: ['defer', 'Await', 'performance'],
    prerequisites: ['execution-modes', 'server-functions'],
  },
  {
    id: 'server-context',
    to: '/features/server-context',
    title: 'Request context & Nitro',
    level: 'Patterns',
    minutes: 8,
    summary: 'Inspect request metadata and understand adapter boundaries.',
    tags: ['headers', 'HTTP', 'hosting'],
    prerequisites: ['server-functions'],
  },
  {
    id: 'agent-dx',
    to: '/features/agent-dx',
    title: 'Type safety & agent workflows',
    level: 'Patterns',
    minutes: 8,
    summary:
      'Explore compiler feedback and framework guidance for coding agents.',
    tags: ['TypeScript', 'Intent', 'AI'],
    prerequisites: ['routing'],
  },
  {
    id: 'caching',
    to: '/features/caching',
    title: 'Caching & revalidation',
    level: 'Advanced',
    minutes: 18,
    summary:
      'Separate server state from loader snapshots. Invalidate the right cache after a write.',
    tags: ['staleTime', 'loaderDeps', 'SWR', 'invalidation'],
    prerequisites: ['routing', 'server-functions'],
  },
  {
    id: 'optimistic',
    to: '/features/optimistic',
    title: 'Optimistic updates & conflicts',
    level: 'Advanced',
    minutes: 20,
    summary:
      'Update immediately, roll back rejected writes, and reconcile competing versions.',
    tags: ['concurrency', 'rollback', 'mutations', 'versioning'],
    prerequisites: ['server-functions', 'caching'],
  },
  {
    id: 'parallel',
    to: '/features/parallel',
    title: 'Parallel loading & resilience',
    level: 'Advanced',
    minutes: 18,
    summary:
      'Remove request waterfalls and isolate optional failures without losing the whole screen.',
    tags: ['Promise.allSettled', 'waterfalls', 'performance', 'errors'],
    prerequisites: ['streaming', 'server-functions'],
  },
  {
    id: 'idempotency',
    to: '/features/idempotency',
    title: 'Idempotent mutations & safe retries',
    level: 'Advanced',
    minutes: 22,
    summary:
      'Recover lost responses, replay receipts, and deduplicate concurrent writes with stable request keys.',
    tags: ['idempotency', 'retries', 'transactions', 'deduplication'],
    prerequisites: ['server-functions', 'optimistic'],
  },
  {
    id: 'pagination',
    to: '/features/pagination',
    title: 'Cursor pagination & changing data',
    level: 'Advanced',
    minutes: 22,
    summary:
      'Compare offset and keyset boundaries as a live feed changes. Handle ties, deletions, and expired cursors.',
    tags: ['pagination', 'keyset', 'cursors', 'consistency'],
    prerequisites: ['routing', 'server-functions', 'caching'],
  },
] as const

export type LearningTopic = (typeof learningTopics)[number]
export type TopicId = LearningTopic['id']
export const learningLevels = [
  'All topics',
  'Foundations',
  'Patterns',
  'Advanced',
] as const
export type LearningLevel = (typeof learningLevels)[number]

export function filterTopics(
  query: string,
  level: LearningLevel,
  incompleteOnly: boolean,
  completed: readonly string[],
) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return learningTopics.filter(
    (topic) =>
      (level === 'All topics' || topic.level === level) &&
      (!incompleteOnly || !completed.includes(topic.id)) &&
      words.every((word) =>
        `${topic.title} ${topic.summary} ${topic.tags.join(' ')}`
          .toLowerCase()
          .includes(word),
      ),
  )
}

export function parseProgress(raw: string): TopicId[] {
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('completed' in value) ||
      !Array.isArray(value.completed)
    )
      return []
    const completed = value.completed
    return learningTopics
      .filter((topic) => completed.includes(topic.id))
      .map((topic) => topic.id)
  } catch {
    return []
  }
}
