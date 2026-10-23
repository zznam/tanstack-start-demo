import { useState } from 'react'
import { ArrowRight, Bookmark } from 'lucide-react'
import { KnowledgeCheck } from './KnowledgeCheck'
import {
  dueQuestions,
  focusedQuestions,
  practiceQuestions,
} from '../utils/gamification'
import type {
  GameProgress,
  PracticeFocus,
  QuestionId,
} from '../utils/gamification'

export function PracticeWorkshop({
  progress,
  today,
  onAnswer,
  onToggleSaved,
}: {
  progress: GameProgress
  today: string
  onAnswer: (id: QuestionId, choice: number) => void
  onToggleSaved: (id: QuestionId) => void
}) {
  const [focus, setFocus] = useState<PracticeFocus>('all')
  const [selected, setSelected] = useState<QuestionId | null>(null)
  const candidates = focusedQuestions(progress, today, focus)
  const due = dueQuestions(progress, today)
  // Keep a submitted check visible so changing progress never removes its feedback.
  const question =
    practiceQuestions.find((item) => item.id === selected) ?? candidates[0]
  const review = question ? progress.reviews[question.id] : undefined
  const choices = practiceQuestions.filter(
    (item) => candidates.includes(item) || item.id === question?.id,
  )
  const next =
    question &&
    [
      ...practiceQuestions.slice(practiceQuestions.indexOf(question) + 1),
      ...practiceQuestions.slice(0, practiceQuestions.indexOf(question)),
    ].find((item) => candidates.includes(item))

  return (
    <section
      id="practice"
      className="scroll-mt-24 space-y-5"
      aria-labelledby="practice-heading"
    >
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <p className="island-kicker mb-2">Learn by recalling</p>
          <h2 id="practice-heading" className="text-2xl font-bold">
            Knowledge checks
          </h2>
        </div>
        <p className="text-sm demo-muted">
          {progress.mastered.length} / {practiceQuestions.length} mastered · 50
          XP each, once
        </p>
      </div>
      <div className="demo-panel space-y-4">
        <h3 className="text-xl font-bold">Make recall a habit</h3>
        <p className="demo-muted text-sm">
          {due.length} due for review · {progress.saved.length} saved{' '}
          {progress.saved.length === 1 ? 'check' : 'checks'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="demo-button demo-button-secondary"
            onClick={() => {
              setFocus('due')
              setSelected(null)
            }}
          >
            Review due checks
          </button>
          <button
            type="button"
            className="demo-button demo-button-secondary"
            onClick={() => {
              setFocus('saved')
              setSelected(null)
            }}
          >
            Practice saved checks
          </button>
        </div>
        <p className="demo-muted text-sm">
          Correct reviews return in 1, 3, 7, then 14 days. Early practice keeps
          your review date; a missed answer brings the check back today.
          Previously mastered checks start due. Saved checks stay in your own
          practice list until you remove them. Neither adds bonus XP.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.5fr] items-start">
        <div className="demo-panel space-y-3">
          <label htmlFor="practice-focus" className="block font-semibold">
            Practice focus
          </label>
          <select
            id="practice-focus"
            className="demo-input"
            value={focus}
            onChange={(event) => {
              setFocus(event.target.value as PracticeFocus)
              setSelected(null)
            }}
          >
            <option value="all">All checks</option>
            <option value="unmastered">Not yet mastered</option>
            <option value="today">Not practiced today</option>
            <option value="due">Due for review</option>
            <option value="saved">Saved checks</option>
          </select>
          <p className="text-sm demo-muted">
            {candidates.length}{' '}
            {focus === 'all'
              ? 'checks to explore'
              : 'checks remaining in this focus'}
          </p>
          {question && (
            <>
              <label
                htmlFor="practice-question"
                className="block font-semibold"
              >
                Choose a check
              </label>
              <select
                id="practice-question"
                className="demo-input"
                value={practiceQuestions.indexOf(question)}
                onChange={(event) =>
                  setSelected(practiceQuestions[Number(event.target.value)].id)
                }
              >
                {choices.map((item) => (
                  <option key={item.id} value={practiceQuestions.indexOf(item)}>
                    {practiceQuestions.indexOf(item) + 1}. {item.title}
                    {progress.mastered.includes(item.id) ? ' ✓' : ''}
                  </option>
                ))}
              </select>
              <p className="demo-muted text-sm">
                Try an answer, read the explanation, and visit the lesson for a
                hands-on experiment. A missed answer never removes XP.
              </p>
              <button
                type="button"
                className="demo-button demo-button-secondary"
                disabled={!next}
                onClick={() => {
                  if (next) setSelected(next.id)
                }}
              >
                Next check <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </>
          )}
          {candidates.length === 0 && (
            <p className="text-sm font-semibold">
              {focus === 'saved'
                ? 'No saved checks yet. Save a check from All checks to build your list.'
                : 'You’re all caught up! Choose All checks to keep practicing.'}
            </p>
          )}
        </div>
        {question ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm demo-muted" aria-live="polite">
                {review
                  ? review.due <= today
                    ? 'Review due today'
                    : `Next review: ${review.due}`
                  : progress.mastered.includes(question.id)
                    ? 'Review due today'
                    : 'Answer this check to start its review schedule.'}
              </p>
              <button
                type="button"
                className="demo-button demo-button-secondary"
                aria-pressed={progress.saved.includes(question.id)}
                onClick={() => {
                  setSelected(question.id)
                  onToggleSaved(question.id)
                }}
              >
                <Bookmark className="size-4" aria-hidden="true" />
                {progress.saved.includes(question.id)
                  ? 'Remove saved check'
                  : 'Save check'}
              </button>
            </div>
            <KnowledgeCheck
              key={`${focus}:${question.id}:${today}`}
              question={question}
              mastered={progress.mastered.includes(question.id)}
              practicedToday={
                !!progress.practiceDays[today]?.includes(question.id)
              }
              onAnswer={(id, choice) => {
                setSelected(id)
                onAnswer(id, choice)
              }}
            />
          </div>
        ) : (
          <div className="demo-panel space-y-3">
            <h3 className="text-xl font-bold">Nothing left in this focus</h3>
            <p className="demo-muted">
              {focus === 'due'
                ? 'No reviews are due. Practice a new check or return on its next review date.'
                : focus === 'saved'
                  ? 'Save checks you want to revisit. Your list stays in this browser.'
                  : focus === 'unmastered'
                    ? 'You have mastered every check. Revisit them to strengthen recall.'
                    : 'You have practiced every check today. Come back tomorrow for a fresh start.'}
            </p>
            <button
              type="button"
              className="demo-button"
              onClick={() => {
                setFocus('all')
                setSelected(null)
              }}
            >
              Practice all checks
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
