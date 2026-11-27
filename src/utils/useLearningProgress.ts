import { useSyncExternalStore } from 'react'
import { parseProgress } from './learningTopics'
import type { TopicId } from './learningTopics'
import { createBrowserProgressStore } from './browserProgressStore'

const store = createBrowserProgressStore(
  'tanstack-learning-progress-v1',
  'learning-progress-change',
)

export function useLearningProgress() {
  const { raw, temporary } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )
  const completed = parseProgress(raw)
  const toggle = (id: TopicId) => {
    store.save((raw) => {
      const current = parseProgress(raw)
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
      return JSON.stringify({ version: 1, completed: next })
    })
  }
  return { completed, toggle, temporary }
}

/** Current stored value, for backups. */
export function readLearningProgressRaw() {
  return store.getSnapshot().raw
}

/** Replaces stored progress, e.g. from a validated backup. */
export function replaceLearningProgress(raw: string) {
  store.save(() => raw)
}
