import { useState } from 'react'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { TopicLink } from './TopicLink'
import { learningTopics } from '../utils/learningTopics'
import { practiceQuestions } from '../utils/gamification'
import type { QuestionId } from '../utils/gamification'

export function KnowledgeCheck({
  question,
  mastered,
  practicedToday,
  onAnswer,
  onResult,
  allowRetry = true,
}: {
  question: (typeof practiceQuestions)[number]
  mastered: boolean
  practicedToday: boolean
  onAnswer: (id: QuestionId, choice: number) => void
  onResult?: (correct: boolean) => void
  allowRetry?: boolean
}) {
  const [choice, setChoice] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [earnedXp, setEarnedXp] = useState(false)
  const topic = learningTopics.find((item) => item.id === question.topic)!
  return (
    <form
      className="demo-panel space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (choice === null || result !== null) return
        const correct = choice === question.answer
        setEarnedXp(correct && !mastered)
        setResult(correct ? 'correct' : 'incorrect')
        onAnswer(question.id, choice)
        onResult?.(correct)
      }}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <span className="island-kicker">
          Knowledge check · {mastered ? 'Mastered' : '50 XP to unlock'}
        </span>
        {practicedToday && (
          <span className="text-sm inline-flex items-center gap-1">
            <CheckCircle2 className="size-4" />
            Practiced today
          </span>
        )}
      </div>
      <fieldset disabled={result !== null} className="space-y-3">
        <legend className="text-xl font-bold mb-4">{question.prompt}</legend>
        {question.options.map((option, index) => (
          <label key={option} className="quest-answer">
            <input
              type="radio"
              name={question.id}
              value={index}
              checked={choice === index}
              onChange={() => setChoice(index)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <div role="status" aria-atomic="true">
        {result !== null && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-2">
            <p className="font-bold">
              {result === 'correct'
                ? earnedXp
                  ? 'Correct! +50 XP unlocked.'
                  : 'Correct! Practice recorded. XP already earned.'
                : allowRetry
                  ? 'Not quite. Read the explanation and try again.'
                  : 'Not quite. Take this explanation into your next round.'}
            </p>
            <p className="demo-muted text-sm leading-relaxed">
              {question.explanation}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {result === null ? (
          <button
            type="submit"
            className="demo-button"
            disabled={choice === null}
          >
            Check answer
          </button>
        ) : allowRetry ? (
          <button
            type="button"
            className="demo-button demo-button-secondary"
            onClick={() => {
              setChoice(null)
              setResult(null)
            }}
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
        ) : null}
        <TopicLink topic={topic} className="text-sm font-semibold">
          Review lesson: {topic.title}
        </TopicLink>
      </div>
    </form>
  )
}
