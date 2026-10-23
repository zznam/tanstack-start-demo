import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  LockKeyhole,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { DailyChallenge } from '../components/DailyChallenge'
import { PracticeWorkshop } from '../components/PracticeWorkshop'
import { PracticeHistory } from '../components/PracticeHistory'
import { WeeklyMission } from '../components/WeeklyMission'
import { TopicLink } from '../components/TopicLink'
import { learningTopics } from '../utils/learningTopics'
import {
  getRewards,
  practiceSummary,
  questTracks,
  xpPerTopic,
} from '../utils/gamification'
import { useGameProgress } from '../utils/useGameProgress'
import { useLearningProgress } from '../utils/useLearningProgress'

export const Route = createFileRoute('/gamification')({
  head: () => ({
    meta: [
      { title: 'Learning Quest | TanStack Learning Lab' },
      {
        name: 'description',
        content:
          'Build your learning habit with lesson quests, knowledge checks, XP, and achievement badges.',
      },
    ],
  }),
  component: GamificationPage,
})

function GamificationPage() {
  const { completed } = useLearningProgress()
  const {
    progress,
    today,
    temporary,
    answer,
    setDailyGoal,
    setWeeklyGoal,
    toggleSaved,
  } = useGameProgress()
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'earned' | 'locked'>(
    'all',
  )
  const rewards = getRewards(completed, progress.mastered)
  const activity = practiceSummary(progress, today)
  const badgeCount = rewards.badges.filter(
    (badge) => badge.current >= badge.target,
  ).length
  const visibleBadges = rewards.badges.filter(
    (badge) =>
      badgeFilter === 'all' ||
      (badgeFilter === 'earned'
        ? badge.current >= badge.target
        : badge.current < badge.target),
  )

  return (
    <div className="page-wrap pb-16 pt-8 space-y-10">
      <header className="island-shell rounded-[2rem] p-6 sm:p-10">
        <Link
          to="/"
          hash="topics"
          className="inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="size-4" />
          All learning topics
        </Link>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <p className="island-kicker flex items-center gap-2 mb-4">
              <Trophy className="size-4" />A little progress, every day
            </p>
            <h1 className="demo-title">Learning Quest</h1>
            <p className="demo-muted max-w-xl leading-relaxed">
              Turn small experiments into lasting skills. Finish lessons, test
              what you know, and watch your collection grow.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a className="demo-button no-underline" href="#practice">
                <Sparkles className="size-4" />
                Practice now
              </a>
              <a
                className="demo-button demo-button-secondary no-underline"
                href="#history"
              >
                Practice history
              </a>
              <a
                className="demo-button demo-button-secondary no-underline"
                href="#challenge"
              >
                Daily challenge
              </a>
              <a
                className="demo-button demo-button-secondary no-underline"
                href="#quests"
              >
                Explore quests
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
          <section className="quest-level" aria-label="Your level">
            <div className="flex items-center gap-4 mb-4">
              <span className="quest-emblem">
                <Trophy className="size-8" />
              </span>
              <div>
                <p className="island-kicker">Keep exploring</p>
                <h2 className="text-3xl font-bold">Level {rewards.level}</h2>
              </div>
            </div>
            <p className="text-xl font-bold mb-3" data-testid="total-xp">
              {rewards.xp} XP
            </p>
            <progress
              className="learning-progress"
              value={rewards.levelXp}
              max={500}
              aria-label="Experience toward next level"
            />
            <p className="text-sm demo-muted mt-2">
              {rewards.remainingXp} XP to level {rewards.level + 1} · 500 XP per
              level
            </p>
          </section>
        </div>
        <p className="text-xs demo-muted mt-6">
          Your progress stays in this browser. No account or leaderboard.{' '}
          {temporary
            ? 'Storage is unavailable: practice is saved for this visit only.'
            : 'If storage is blocked, new progress lasts for this visit.'}
        </p>
      </header>

      <section
        aria-labelledby="habit-heading"
        className="grid gap-5 lg:grid-cols-[1fr_1.3fr]"
      >
        <div className="demo-panel space-y-4">
          <p className="island-kicker flex items-center gap-2">
            <Target className="size-4" />
            Make a little time
          </p>
          <h2 id="habit-heading" className="text-2xl font-bold">
            Your daily practice
          </h2>
          <label htmlFor="daily-goal" className="block text-sm font-semibold">
            Daily goal
          </label>
          <select
            id="daily-goal"
            className="demo-input"
            value={progress.dailyGoal}
            onChange={(event) =>
              setDailyGoal(Number(event.target.value) as 1 | 2 | 3)
            }
          >
            <option value={1}>Gentle · 1 knowledge check</option>
            <option value={2}>Steady · 2 knowledge checks</option>
            <option value={3}>Focused · 3 knowledge checks</option>
          </select>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <strong data-testid="daily-count">
              {activity.todayCount} / {progress.dailyGoal} checks today
            </strong>
            <span>
              {activity.todayCount >= progress.dailyGoal
                ? 'Goal reached!'
                : 'One answer at a time'}
            </span>
          </div>
          <progress
            className="learning-progress"
            value={Math.min(activity.todayCount, progress.dailyGoal)}
            max={progress.dailyGoal}
            aria-label="Daily practice goal"
          />
          <p className="demo-muted text-sm">
            Each distinct correct check counts once per local calendar day.
            Revisiting mastered checks counts toward your goal, with no extra
            XP.
          </p>
        </div>
        <div className="demo-panel space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="size-6" />
            <span data-testid="practice-streak">
              {activity.streak}-day practice streak
            </span>
          </h2>
          <p className="demo-muted text-sm">
            Keep a streak with at least one correct check each day. Yesterday’s
            streak stays active while you work on today.
          </p>
          <ol
            className="quest-week"
            aria-label="Practice over the last seven days"
          >
            {activity.week.map(({ day, count }) => (
              <li
                key={day}
                className={
                  count > 0 ? 'quest-day quest-day-active' : 'quest-day'
                }
                aria-label={`${day}: ${count} correct checks${day === today ? ', today' : ''}`}
              >
                <span className="text-xs">
                  {new Intl.DateTimeFormat('en', {
                    weekday: 'short',
                    timeZone: 'UTC',
                  }).format(new Date(`${day}T12:00:00Z`))}
                </span>
                <strong className="text-lg">{day.slice(-2)}</strong>
                <span className="text-xs">
                  {count > 0 ? `${count} ✓` : '—'}
                </span>
                {day === today && (
                  <span className="quest-today" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          <p className="demo-muted text-xs">
            Last 7 days · Dates follow your device’s local time. Up to 366 days
            of practice history are kept.
          </p>
        </div>
      </section>

      <WeeklyMission
        progress={progress}
        today={today}
        onSetGoal={setWeeklyGoal}
      />
      <DailyChallenge
        key={today}
        progress={progress}
        today={today}
        onAnswer={answer}
      />
      <PracticeWorkshop
        progress={progress}
        today={today}
        onAnswer={answer}
        onToggleSaved={toggleSaved}
      />
      <PracticeHistory progress={progress} today={today} />

      <section
        id="quests"
        className="scroll-mt-24 space-y-5"
        aria-labelledby="quests-heading"
      >
        <div>
          <p className="island-kicker mb-2">Choose your adventure</p>
          <h2 id="quests-heading" className="text-2xl font-bold">
            Lesson quests
          </h2>
          <p className="demo-muted text-sm mt-2">
            Mark lessons complete in the catalog or advanced lab footer. Your
            existing progress already counts.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {questTracks.map((track, index) => {
            const topics = learningTopics.filter(
              (topic) => topic.level === track.level,
            )
            const done = topics.filter((topic) =>
              completed.includes(topic.id),
            ).length
            const next = topics.find((topic) => !completed.includes(topic.id))
            return (
              <article
                key={track.level}
                className="demo-panel flex flex-col gap-4"
                aria-label={track.title}
              >
                <p className="island-kicker">
                  Quest 0{index + 1} · {track.level}
                </p>
                <h3 className="text-xl font-bold">{track.title}</h3>
                <p className="demo-muted text-sm">{track.description}</p>
                <p className="text-sm font-semibold">
                  {done} / {topics.length} complete · {xpPerTopic[track.level]}{' '}
                  XP per lesson
                </p>
                <progress
                  className="learning-progress"
                  value={done}
                  max={topics.length}
                  aria-label={`${track.level} quest progress`}
                />
                <ul className="space-y-3 text-sm flex-1">
                  {topics.map((topic) => (
                    <li key={topic.id} className="flex gap-2 items-start">
                      {completed.includes(topic.id) ? (
                        <CheckCircle2
                          className="size-4 mt-0.5 shrink-0"
                          aria-label="Completed"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="size-4 mt-0.5 shrink-0 rounded-full border border-[var(--line)]"
                        />
                      )}
                      <TopicLink topic={topic}>{topic.title}</TopicLink>
                    </li>
                  ))}
                </ul>
                {next ? (
                  <TopicLink
                    topic={next}
                    className="demo-button demo-button-secondary no-underline"
                  >
                    Continue quest
                    <ArrowRight className="size-4 shrink-0" />
                  </TopicLink>
                ) : (
                  <p className="font-bold inline-flex items-center gap-2">
                    <Award className="size-5" />
                    Quest complete!
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="space-y-5" aria-labelledby="badges-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="island-kicker mb-2">Your collection</p>
            <h2 id="badges-heading" className="text-2xl font-bold">
              Achievements
            </h2>
            <p className="text-sm demo-muted mt-2">
              {badgeCount} / {rewards.badges.length} earned
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter achievements"
          >
            {(['all', 'earned', 'locked'] as const).map((filter) => (
              <button
                type="button"
                key={filter}
                className={`demo-button ${badgeFilter === filter ? '' : 'demo-button-secondary'}`}
                aria-pressed={badgeFilter === filter}
                onClick={() => setBadgeFilter(filter)}
              >
                {filter === 'all'
                  ? 'All badges'
                  : filter === 'earned'
                    ? 'Earned'
                    : 'Locked'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBadges.map((badge) => {
            const earned = badge.current >= badge.target
            return (
              <article
                key={badge.id}
                className="demo-panel space-y-3"
                aria-label={badge.title}
              >
                <div className="flex items-center gap-3">
                  {earned ? (
                    <Award className="size-7 text-[var(--lagoon-deep)]" />
                  ) : (
                    <LockKeyhole className="size-6 demo-muted" />
                  )}
                  <span className="island-kicker">
                    {earned ? 'Earned' : 'Locked'}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{badge.title}</h3>
                <p className="demo-muted text-sm">{badge.description}</p>
                <progress
                  className="learning-progress"
                  value={badge.current}
                  max={badge.target}
                  aria-label={`${badge.title} progress`}
                />
                <p className="text-xs demo-muted">
                  {badge.current} / {badge.target}
                </p>
              </article>
            )
          })}
        </div>
        {visibleBadges.length === 0 && (
          <p role="status" className="demo-panel demo-muted">
            {badgeFilter === 'earned'
              ? 'Your collection starts with one completed lesson or all six knowledge checks.'
              : 'You have earned every badge. Keep practicing!'}
          </p>
        )}
      </section>
      <details className="lesson-details">
        <summary>How XP and achievements work</summary>
        <p>
          Completed foundation lessons earn 100 XP each, patterns earn 150, and
          advanced labs earn 250. Each mastered knowledge check adds 50 XP once.
          Every 500 XP unlocks a level. Unmarking a lesson removes its XP and
          any achievement that depends on it; completing it again restores the
          same reward. Practice never marks a lesson complete. Achievements
          reflect current progress and do not add bonus XP. These are personal
          learning milestones, not certifications.
        </p>
      </details>
    </div>
  )
}
