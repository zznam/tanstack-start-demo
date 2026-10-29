import { useSyncExternalStore } from 'react'
import {
  recordAnswer,
  localDay,
  parseGameProgress,
  toggleSavedQuestion,
} from './gamification'
import type { GameProgress, QuestionId } from './gamification'
import { createBrowserProgressStore } from './browserProgressStore'

const store = createBrowserProgressStore(
  'tanstack-learning-game-v1',
  'learning-game-change',
)

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
  store.save((raw) => JSON.stringify(update(parseGameProgress(raw, today), today)))
}

export function useGameProgress() {
  const { raw, temporary } = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )
  const today = useSyncExternalStore(subscribeDay, localDay, () => '')
  return {
    progress: parseGameProgress(raw, today),
    today,
    temporary,
    answer: (id: QuestionId, choice: number) =>
      save((current, day) => recordAnswer(current, id, choice, day)),
    toggleSaved: (id: QuestionId) =>
      save((current) => toggleSavedQuestion(current, id)),
    setDailyGoal: (dailyGoal: GameProgress['dailyGoal']) =>
      save((current) => ({ ...current, dailyGoal })),
    setWeeklyGoal: (weeklyGoal: GameProgress['weeklyGoal']) =>
      save((current) => ({ ...current, weeklyGoal })),
  }
}
