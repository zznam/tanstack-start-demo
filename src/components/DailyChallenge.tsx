import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Trophy } from 'lucide-react'
import { KnowledgeCheck } from './KnowledgeCheck'
import { TopicLink } from './TopicLink'
import { dailyChallenge } from '../utils/gamification'
import type { GameProgress, QuestionId } from '../utils/gamification'
import { learningTopics } from '../utils/learningTopics'

export function DailyChallenge({
  progress,
  today,
  onAnswer,
}: {
  progress: GameProgress
  today: string
  onAnswer: (id: QuestionId, choice: number) => void
}) {
  const questions = dailyChallenge(today)
  const [step, setStep] = useState(-1)
  const [results, setResults] = useState<boolean[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const finished = step === questions.length
  const question = questions[step]
  const score = results.filter(Boolean).length

  useEffect(() => {
    if (step >= 0) heading.current?.focus()
  }, [step])

  return (
    <section
      id="challenge"
      className="scroll-mt-24 space-y-5"
      aria-labelledby="challenge-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="island-kicker mb-2">A fresh mix every day</p>
          <h2 id="challenge-heading" className="text-2xl font-bold">
            Daily challenge
          </h2>
        </div>
        <span className="text-sm demo-muted">
          3 checks · No timer · One answer per check
        </span>
      </div>
      {step === -1 ? (
        <div className="quest-level space-y-4">
          <Trophy
            className="size-7 text-[var(--lagoon-deep)]"
            aria-hidden="true"
          />
          <h3 className="text-xl font-bold">Three small wins to aim for</h3>
          <p className="demo-muted max-w-2xl">
            Take today’s three-check round, then see your score and what to
            revisit. Correct answers count toward practice and unlock the usual
            50 XP only when first mastered. There is no extra XP for replaying a
            round.
          </p>
          <p className="text-xs demo-muted">
            Your round resets when you leave, reload, or the local date changes.
            Earned progress follows your browser’s storage settings.
          </p>
          <button
            type="button"
            className="demo-button"
            disabled={!questions.length}
            onClick={() => setStep(0)}
          >
            Start daily challenge{' '}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : finished ? (
        <div className="quest-level space-y-5">
          <h3 ref={heading} tabIndex={-1} className="text-xl font-bold">
            Round complete · {score} / {questions.length} correct
          </h3>
          <p className="demo-muted">
            {score === questions.length
              ? 'A clean sweep! Come back tomorrow for a new mix.'
              : 'Every attempt points to your next step. Revisit these lessons or try another round.'}
          </p>
          <ul className="space-y-3">
            {questions.map((item, index) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--line)] p-4 space-y-2"
              >
                <p className="font-semibold">
                  {results[index] ? 'Correct' : 'To review'} · {item.title}
                </p>
                {!results[index] && (
                  <p className="text-sm demo-muted">{item.explanation}</p>
                )}
                <TopicLink
                  topic={
                    learningTopics.find((topic) => topic.id === item.topic)!
                  }
                  className="text-sm"
                >
                  Review lesson:{' '}
                  {
                    learningTopics.find((topic) => topic.id === item.topic)!
                      .title
                  }
                </TopicLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="demo-button"
            onClick={() => {
              setResults([])
              setStep(0)
            }}
          >
            Replay today’s challenge
          </button>
        </div>
      ) : question ? (
        <div className="space-y-4">
          <h3 ref={heading} tabIndex={-1} className="font-semibold">
            Challenge check {step + 1} of {questions.length} · {question.title}
          </h3>
          <progress
            className="learning-progress"
            value={results.length}
            max={questions.length}
            aria-label="Daily challenge progress"
          />
          <KnowledgeCheck
            key={`${step}:${question.id}`}
            question={question}
            mastered={progress.mastered.includes(question.id)}
            practicedToday={
              !!progress.practiceDays[today]?.includes(question.id)
            }
            onAnswer={onAnswer}
            allowRetry={false}
            onResult={(correct) =>
              setResults((current) =>
                current.length === step ? [...current, correct] : current,
              )
            }
          />
          <button
            type="button"
            className="demo-button"
            disabled={results.length <= step}
            onClick={() => setStep((current) => current + 1)}
          >
            {step === questions.length - 1
              ? 'See challenge results'
              : 'Next challenge check'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  )
}
