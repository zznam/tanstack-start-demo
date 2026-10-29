import type { TopicId } from './learningTopics'

export type LearningUpdate = {
  id: string
  date: string
  title: string
  summary: string
  topics: TopicId[]
  source?: string
}

export const recentChanges: LearningUpdate[] = [
  {
    id: 'continuous-learning',
    date: '2026-10-30',
    title: 'Finish each lesson without losing your place',
    summary: 'Mark any topic complete and continue directly to the next lesson. Storage failures keep your progress for this visit, navigation menus close as you move, and article submissions preserve newer draft edits.',
    topics: ['routing', 'execution-modes', 'server-functions'],
  },
  {
    id: 'outbox-delivery',
    date: '2026-10-23',
    title: 'Follow an order from commit to invoice',
    summary: 'Compare direct publishing with a transactional outbox. Explore six delivery scenarios, roll back failed transactions, and see how consumer deduplication prevents duplicate invoices.',
    topics: ['outbox'],
  },
  {
    id: 'resilience-budget',
    date: '2026-10-23',
    title: 'Protect checkout when a dependency fails',
    summary: 'Run five shipping-carrier failure scenarios, compare retry budgets and circuit breakers, and inspect each attempt in a server-generated event trace.',
    topics: ['resilience'],
  },
  {
    id: 'reliability-labs',
    date: '2026-10-22',
    title: 'Go deeper on retries and changing data',
    summary:
      'Recover a committed reservation after a lost response, deduplicate concurrent requests, and compare cursor pagination with shifting offsets in a live sample feed.',
    topics: ['idempotency', 'pagination'],
  },
  {
    id: 'discovery',
    date: '2026-10-22',
    title: 'Pick up where you left off',
    summary:
      'Share a filtered catalog, refresh without losing your search, and explore recent improvements here. Completion progress still stays in your browser.',
    topics: [],
    source: 'https://github.com/zznam/tanstack-start-demo/pull/2',
  },
  {
    id: 'advanced-labs',
    date: '2026-10-22',
    title: 'Three advanced full-stack labs',
    summary:
      'Investigate stale route caches, recover optimistic writes after conflicts, and compare sequential loading with resilient parallel requests.',
    topics: ['caching', 'optimistic', 'parallel'],
    source: 'https://github.com/zznam/tanstack-start-demo/pull/1',
  },
  {
    id: 'runtime',
    date: '2026-10-19',
    title: 'Real execution modes and stronger demo foundations',
    summary:
      'Compare server rendering with data-only and browser-only routes. The showcase also gained bounded post storage, validated inputs, keyboard navigation, theme recovery, and production browser coverage.',
    topics: ['execution-modes', 'server-functions'],
    source: 'https://github.com/zznam/tanstack-start-demo/commit/f10a2b5',
  },
]
