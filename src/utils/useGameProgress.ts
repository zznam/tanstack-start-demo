import { useSyncExternalStore } from 'react'
import { answerQuestion, localDay, parseGameProgress } from './gamification'
import type { GameProgress, QuestionId } from './gamification'

const STORAGE_KEY = 'tanstack-learning-game-v1'
const CHANGE_EVENT = 'learning-game-change'
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

function subscribeDay(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000)
  window.addEventListener('focus', onChange)
  document.addEventListener('visibilitychange', onChange)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', onChange)
    document.removeEventListener('visibilitychange', onChange)
  }
}

function save(update: (current: GameProgress, today: string) => GameProgress) {
  const today = localDay()
  const next = update(parseGameProgress(getSnapshot(), today), today)
  const serialized = JSON.stringify(next)
  try {
    localStorage.setItem(STORAGE_KEY, serialized)
    memorySnapshot = undefined
  } catch {
    memorySnapshot = serialized
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useGameProgress() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '')
  const today = useSyncExternalStore(subscribeDay, localDay, () => '')
  return {
    progress: parseGameProgress(raw, today),
    today,
    temporary: memorySnapshot !== undefined,
    answer: (id: QuestionId, choice: number) =>
      save((current, day) => answerQuestion(current, id, choice, day)),
    setDailyGoal: (dailyGoal: GameProgress['dailyGoal']) =>
      save((current) => ({ ...current, dailyGoal })),
    setWeeklyGoal: (weeklyGoal: GameProgress['weeklyGoal']) =>
      save((current) => ({ ...current, weeklyGoal })),
  }
}
