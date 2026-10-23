import { learningTopics } from './learningTopics.ts'
import type { TopicId } from './learningTopics.ts'

export const practiceQuestions = [
  {
    id: 'url-state',
    topic: 'routing',
    title: 'Share a filtered view',
    prompt:
      'Where should a catalog filter live so a shared link and browser history preserve it?',
    options: [
      'Only in component state',
      'In validated URL search parameters',
      'In a server console log',
    ],
    answer: 1,
    explanation:
      'Validated search parameters make the selected view shareable and restore it during navigation.',
  },
  {
    id: 'server-boundary',
    topic: 'server-functions',
    title: 'Keep server work on the server',
    prompt:
      'A route loader runs during client navigation. What keeps its database operation on the server?',
    options: [
      'Calling a server function',
      'Naming the loader async',
      'Rendering a loading spinner',
    ],
    answer: 0,
    explanation:
      'The server function is the RPC boundary. A route loader alone also runs in the browser during client navigation.',
  },
  {
    id: 'cache-refresh',
    topic: 'caching',
    title: 'Reconcile a stale snapshot',
    prompt:
      'A server mutation succeeds, but a cached loader snapshot still shows old data. What should happen next?',
    options: [
      'Assume the mutation failed',
      'Keep the snapshot forever',
      'Invalidate and reload the affected data',
    ],
    answer: 2,
    explanation:
      'A server write does not automatically replace a Router snapshot. Scoped invalidation lets the affected loader reconcile it.',
  },
  {
    id: 'safe-retry',
    topic: 'idempotency',
    title: 'Recover a lost response',
    prompt:
      'A reservation may have committed before its response was lost. How should the client retry?',
    options: [
      'Generate a new request key',
      'Reuse the same key and payload',
      'Change the quantity on every retry',
    ],
    answer: 1,
    explanation:
      'A stable key and matching payload let the server replay the original receipt instead of reserving twice.',
  },
  {
    id: 'partial-success',
    topic: 'parallel',
    title: 'Keep useful results',
    prompt:
      'Optional recommendations fail while required catalog data succeeds. Which approach can retain both outcomes?',
    options: [
      'Promise.allSettled with required-result checks',
      'Discard every result',
      'Treat every rejection as a successful value',
    ],
    answer: 0,
    explanation:
      'allSettled exposes each outcome. The application still checks required services and provides fallbacks for optional failures.',
  },
  {
    id: 'event-delivery',
    topic: 'outbox',
    title: 'Handle redelivery',
    prompt:
      'An outbox event is delivered again after an acknowledgement is lost. What prevents a duplicate invoice?',
    options: [
      'Never retry delivery',
      'A longer timeout alone',
      'Consumer deduplication committed with the invoice',
    ],
    answer: 2,
    explanation:
      'The consumer records the event ID and invoice atomically. Redelivery can then be acknowledged without repeating the effect.',
  },
] as const satisfies readonly {
  id: string
  topic: TopicId
  title: string
  prompt: string
  options: readonly string[]
  answer: number
  explanation: string
}[]

export type QuestionId = (typeof practiceQuestions)[number]['id']
export type GameProgress = {
  version: 1
  mastered: QuestionId[]
  practiceDays: Record<string, QuestionId[]>
  dailyGoal: 1 | 2 | 3
  weeklyGoal: 3 | 5 | 7
}

export function emptyGameProgress(): GameProgress {
  return {
    version: 1,
    mastered: [],
    practiceDays: {},
    dailyGoal: 2,
    weeklyGoal: 3,
  }
}

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Date keys are calendar days; UTC arithmetic avoids 23/25-hour DST days.
export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function validDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  const date = new Date(`${day}T12:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day
  )
}

function knownQuestions(value: unknown): QuestionId[] {
  return Array.isArray(value)
    ? practiceQuestions
        .filter((question) => value.includes(question.id))
        .map((question) => question.id)
    : []
}

export function parseGameProgress(raw: string, today: string): GameProgress {
  const empty = emptyGameProgress()
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1
    )
      return empty
    const data = value as Record<string, unknown>
    const practiceDays: GameProgress['practiceDays'] = {}
    if (
      validDay(today) &&
      data.practiceDays &&
      typeof data.practiceDays === 'object' &&
      !Array.isArray(data.practiceDays)
    ) {
      const oldest = shiftDay(today, -365)
      for (const [day, entries] of Object.entries(data.practiceDays)) {
        if (!validDay(day) || day > today || day < oldest) continue
        const ids = knownQuestions(entries)
        if (ids.length) practiceDays[day] = ids
      }
    }
    return {
      version: 1,
      mastered: knownQuestions(data.mastered),
      practiceDays,
      dailyGoal:
        data.dailyGoal === 1 || data.dailyGoal === 3 ? data.dailyGoal : 2,
      weeklyGoal:
        data.weeklyGoal === 5 || data.weeklyGoal === 7 ? data.weeklyGoal : 3,
    }
  } catch {
    return empty
  }
}

export function answerQuestion(
  progress: GameProgress,
  id: QuestionId,
  answer: number,
  today: string,
) {
  const question = practiceQuestions.find((item) => item.id === id)
  if (!question || question.answer !== answer || !validDay(today))
    return progress
  const todays = progress.practiceDays[today] ?? []
  return {
    ...progress,
    mastered: progress.mastered.includes(id)
      ? progress.mastered
      : [...progress.mastered, id],
    practiceDays: {
      ...progress.practiceDays,
      [today]: todays.includes(id) ? todays : [...todays, id],
    },
  }
}

export const xpPerTopic = {
  Foundations: 100,
  Patterns: 150,
  Advanced: 250,
} as const
export const questTracks = [
  {
    level: 'Foundations',
    title: 'Build your foundation',
    description: 'Navigate, render, and cross the server boundary.',
  },
  {
    level: 'Patterns',
    title: 'Connect the pieces',
    description: 'Explore context, streaming, and environment-aware code.',
  },
  {
    level: 'Advanced',
    title: 'Ship resilient systems',
    description: 'Recover from stale data, conflicts, and unreliable delivery.',
  },
] as const

export function getRewards(
  completed: readonly TopicId[],
  mastered: readonly QuestionId[],
) {
  const topics = learningTopics.filter((topic) => completed.includes(topic.id))
  const masteryCount = practiceQuestions.filter((question) =>
    mastered.includes(question.id),
  ).length
  const xp =
    topics.reduce((total, topic) => total + xpPerTopic[topic.level], 0) +
    masteryCount * 50
  const level = Math.floor(xp / 500) + 1
  const badges = [
    {
      id: 'first-step',
      title: 'First step',
      description: 'Complete your first lesson.',
      current: Math.min(topics.length, 1),
      target: 1,
    },
    ...questTracks.map((track) => {
      const group = learningTopics.filter(
        (topic) => topic.level === track.level,
      )
      return {
        id: track.level,
        title: `${track.level} explorer`,
        description: `Complete every ${track.level.toLowerCase()} lesson.`,
        current: group.filter((topic) => completed.includes(topic.id)).length,
        target: group.length,
      }
    }),
    {
      id: 'practice-master',
      title: 'Knowledge collector',
      description: 'Answer every knowledge check correctly.',
      current: masteryCount,
      target: practiceQuestions.length,
    },
  ]
  return { xp, level, levelXp: xp % 500, remainingXp: 500 - (xp % 500), badges }
}

export function practiceSummary(progress: GameProgress, today: string) {
  if (!validDay(today)) return { streak: 0, todayCount: 0, week: [] }
  const days = progress.practiceDays
  let cursor = days[today]?.length ? today : shiftDay(today, -1)
  let streak = 0
  while (days[cursor]?.length) {
    streak++
    cursor = shiftDay(cursor, -1)
  }
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = shiftDay(today, index - 6)
    return { day, count: days[day]?.length ?? 0 }
  })
  return { streak, todayCount: days[today]?.length ?? 0, week }
}

export type PracticeFocus = 'all' | 'unmastered' | 'today'

export function focusedQuestions(
  progress: GameProgress,
  today: string,
  focus: PracticeFocus,
) {
  return practiceQuestions.filter((question) =>
    focus === 'unmastered'
      ? !progress.mastered.includes(question.id)
      : focus === 'today'
        ? !progress.practiceDays[today]?.includes(question.id)
        : true,
  )
}

// A stable, rotating set for each local calendar day, independent of saved progress.
export function dailyChallenge(today: string) {
  if (!validDay(today)) return []
  const offset = Math.floor(Date.parse(`${today}T12:00:00Z`) / 86_400_000)
  return Array.from(
    { length: 3 },
    (_, index) =>
      practiceQuestions[
        (((offset + index) % practiceQuestions.length) +
          practiceQuestions.length) %
          practiceQuestions.length
      ],
  )
}

export function weeklySummary(progress: GameProgress, today: string) {
  if (!validDay(today))
    return { start: '', end: '', activeDays: 0, checks: 0, bestStreak: 0 }
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay()
  const start = shiftDay(today, -((weekday + 6) % 7))
  const end = shiftDay(start, 6)
  const days = Object.keys(progress.practiceDays)
    .filter(
      (day) =>
        validDay(day) &&
        day <= today &&
        day >= shiftDay(today, -365) &&
        progress.practiceDays[day].length > 0,
    )
    .sort()
  const week = days.filter((day) => day >= start && day <= end)
  let bestStreak = 0
  let run = 0
  let previous = ''
  for (const day of days) {
    run = previous && shiftDay(previous, 1) === day ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    previous = day
  }
  return {
    start,
    end,
    activeDays: week.length,
    checks: week.reduce(
      (sum, day) => sum + progress.practiceDays[day].length,
      0,
    ),
    bestStreak,
  }
}
