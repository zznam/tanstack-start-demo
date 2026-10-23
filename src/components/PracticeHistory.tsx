import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { TopicLink } from './TopicLink'
import { practiceHistory, practiceQuestions } from '../utils/gamification'
import type { GameProgress } from '../utils/gamification'
import { learningTopics } from '../utils/learningTopics'

function formatDay(day: string, long = false) {
  return new Intl.DateTimeFormat('en', {
    month: long ? 'long' : 'short',
    day: 'numeric',
    year: long ? 'numeric' : undefined,
    weekday: long ? 'long' : undefined,
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`))
}

export function PracticeHistory({
  progress,
  today,
}: {
  progress: GameProgress
  today: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const days = practiceHistory(progress, today)
  const current = days.find(({ day }) => day === selected) ?? days.at(-1)
  const activeDays = days.filter(({ questions }) => questions.length > 0).length
  const checks = days.reduce((sum, day) => sum + day.questions.length, 0)

  return (
    <section
      id="history"
      className="demo-panel scroll-mt-24 space-y-5"
      aria-labelledby="history-heading"
    >
      <div>
        <p className="island-kicker flex items-center gap-2 mb-2">
          <CalendarDays className="size-4" aria-hidden="true" /> Small steps add
          up
        </p>
        <h2 id="history-heading" className="text-2xl font-bold">
          Your practice history
        </h2>
        <p className="demo-muted text-sm mt-2">
          Last 28 days · {activeDays} active {activeDays === 1 ? 'day' : 'days'}{' '}
          · {checks} correct {checks === 1 ? 'check' : 'checks'}
        </p>
        <p className="demo-muted text-sm mt-2">
          Choose a day to revisit its lessons. Each correct check counts once
          per day; missed answers and lesson completion are not included.
        </p>
      </div>
      <div
        className="grid grid-cols-4 sm:grid-cols-7 gap-2"
        role="group"
        aria-label="Practice calendar"
      >
        {days.map(({ day, questions }) => (
          <button
            key={day}
            type="button"
            className={`quest-history-day ${questions.length ? 'quest-day-active' : ''}`}
            aria-label={`${formatDay(day, true)}: ${questions.length} correct ${questions.length === 1 ? 'check' : 'checks'}${day === today ? ', today' : ''}`}
            aria-pressed={current?.day === day}
            onClick={() => setSelected(day)}
          >
            <span className="text-xs">{formatDay(day)}</span>
            <strong>{questions.length || '—'}</strong>
            <span className="text-xs">
              {day === today
                ? 'Today'
                : questions.length === 1
                  ? 'check'
                  : 'checks'}
            </span>
          </button>
        ))}
      </div>
      {current && (
        <div
          className="rounded-xl border border-[var(--line)] p-4 space-y-3"
          aria-live="polite"
          aria-atomic="true"
        >
          <h3 className="font-bold">{formatDay(current.day, true)}</h3>
          {current.questions.length ? (
            <ul className="space-y-3">
              {current.questions.map((id) => {
                const question = practiceQuestions.find(
                  (item) => item.id === id,
                )!
                const topic = learningTopics.find(
                  (item) => item.id === question.topic,
                )!
                return (
                  <li key={id} className="space-y-1">
                    <p className="text-sm font-semibold">{question.title}</p>
                    <TopicLink topic={topic} className="text-sm">
                      Review lesson: {topic.title}
                    </TopicLink>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="demo-muted text-sm">
              No correct checks recorded for this day.
            </p>
          )}
        </div>
      )}
      <p className="demo-muted text-xs">
        Dates follow your device’s local time. History is saved only in this
        browser.
      </p>
    </section>
  )
}
