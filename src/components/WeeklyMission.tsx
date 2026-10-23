import { CalendarDays, Trophy } from 'lucide-react'
import { weeklySummary } from '../utils/gamification'
import type { GameProgress } from '../utils/gamification'

const formatDate = (day: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T12:00:00Z`))

export function WeeklyMission({
  progress,
  today,
  onSetGoal,
}: {
  progress: GameProgress
  today: string
  onSetGoal: (goal: GameProgress['weeklyGoal']) => void
}) {
  const week = weeklySummary(progress, today)
  const reached = week.activeDays >= progress.weeklyGoal
  return (
    <section aria-labelledby="weekly-heading" className="demo-panel space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="island-kicker flex items-center gap-2 mb-2">
            <CalendarDays className="size-4" aria-hidden="true" />
            Build a rhythm
          </p>
          <h2 id="weekly-heading" className="text-2xl font-bold">
            Your weekly mission
          </h2>
          <p className="text-sm demo-muted mt-2">
            Monday–Sunday
            {week.start
              ? ` · ${formatDate(week.start)} – ${formatDate(week.end)}`
              : ''}
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="weekly-goal" className="block text-sm font-semibold">
            Weekly goal
          </label>
          <select
            id="weekly-goal"
            className="demo-input"
            value={progress.weeklyGoal}
            onChange={(event) =>
              onSetGoal(
                Number(event.target.value) as GameProgress['weeklyGoal'],
              )
            }
          >
            <option value={3}>Build a habit · 3 days</option>
            <option value={5}>Find a rhythm · 5 days</option>
            <option value={7}>Every day · 7 days</option>
          </select>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold" data-testid="weekly-days">
            {week.activeDays} / {progress.weeklyGoal} active days
          </p>
          <progress
            className="learning-progress mt-3"
            value={Math.min(week.activeDays, progress.weeklyGoal)}
            max={progress.weeklyGoal}
            aria-label="Weekly practice goal"
          />
        </div>
        <div>
          <p className="text-lg font-bold">{week.checks} correct checks</p>
          <p className="text-sm demo-muted">
            This week · once per check per day
          </p>
        </div>
        <div>
          <p className="text-lg font-bold flex items-center gap-2">
            <Trophy className="size-5" aria-hidden="true" />
            {week.bestStreak}-day personal best
          </p>
          <p className="text-sm demo-muted">
            Longest streak in your saved history
          </p>
        </div>
      </div>
      <p className="text-sm demo-muted">
        {reached
          ? 'Weekly mission complete! Keep practicing at your own pace.'
          : 'One correct check makes an active day. Your daily goal can be larger.'}{' '}
        Your target carries into each new week. Weekly missions celebrate
        consistency and do not add bonus XP.
      </p>
    </section>
  )
}
