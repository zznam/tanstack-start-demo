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
    id: 'discovery',
    date: '2026-10-22',
    title: 'Pick up where you left off',
    summary: 'Share a filtered catalog, refresh without losing your search, and explore recent improvements here. Completion progress still stays in your browser.',
    topics: [],
  },
  {
    id: 'advanced-labs',
    date: '2026-10-22',
    title: 'Three advanced full-stack labs',
    summary: 'Investigate stale route caches, recover optimistic writes after conflicts, and compare sequential loading with resilient parallel requests.',
    topics: ['caching', 'optimistic', 'parallel'],
    source: 'https://github.com/zznam/tanstack-start-demo/pull/1',
  },
  {
    id: 'runtime',
    date: '2026-10-19',
    title: 'Real execution modes and stronger demo foundations',
    summary: 'Compare server rendering with data-only and browser-only routes. The showcase also gained bounded post storage, validated inputs, keyboard navigation, theme recovery, and production browser coverage.',
    topics: ['execution-modes', 'server-functions'],
    source: 'https://github.com/zznam/tanstack-start-demo/commit/f10a2b5',
  },
]
