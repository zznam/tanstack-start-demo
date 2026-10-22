import { useSyncExternalStore } from 'react'
import { parseProgress } from './learningTopics'
import type { TopicId } from './learningTopics'

const STORAGE_KEY = 'tanstack-learning-progress-v1'
const CHANGE_EVENT = 'learning-progress-change'
let memorySnapshot: string | undefined

function getSnapshot() {
  if (memorySnapshot !== undefined) return memorySnapshot
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      memorySnapshot = undefined
      onChange()
    }
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

export function useLearningProgress() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '')
  const completed = parseProgress(raw)
  const toggle = (id: TopicId) => {
    const current = parseProgress(getSnapshot())
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]
    const serialized = JSON.stringify({ version: 1, completed: next })
    try {
      localStorage.setItem(STORAGE_KEY, serialized)
      memorySnapshot = undefined
    } catch {
      memorySnapshot = serialized
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
  return { completed, toggle }
}
