import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { KnowledgeCheck } from './KnowledgeCheck'
import { focusedQuestions, practiceQuestions } from '../utils/gamification'
import type {
  GameProgress,
  PracticeFocus,
  QuestionId,
} from '../utils/gamification'

export function PracticeWorkshop({
  progress,
  today,
  onAnswer,
}: {
  progress: GameProgress
  today: string
  onAnswer: (id: QuestionId, choice: number) => void
}) {
  const [focus, setFocus] = useState<PracticeFocus>('all')
  const [selected, setSelected] = useState<QuestionId | null>(null)
  const candidates = focusedQuestions(progress, today, focus)
  // Keep a submitted check visible so changing progress never removes its feedback.
  const question =
    practiceQuestions.find((item) => item.id === selected) ?? candidates[0]
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
              You’re all caught up! Choose All checks to keep practicing.
            </p>
          )}
        </div>
        {question ? (
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
        ) : (
          <div className="demo-panel space-y-3">
            <h3 className="text-xl font-bold">Nothing left in this focus</h3>
            <p className="demo-muted">
              {focus === 'unmastered'
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
