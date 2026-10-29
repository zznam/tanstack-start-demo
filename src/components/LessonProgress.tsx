import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { learningTopics } from '../utils/learningTopics'
import type { TopicId } from '../utils/learningTopics'
import { useLearningProgress } from '../utils/useLearningProgress'
import { TopicLink } from './TopicLink'

export function LessonProgress({ id }: { id: TopicId }) {
  const topic = learningTopics.find((item) => item.id === id)!
  const { completed, toggle, temporary } = useLearningProgress()
  const done = completed.includes(id)
  const next = learningTopics[learningTopics.indexOf(topic) + 1]

  return (
    <section
      aria-label="Lesson progress"
      className="demo-panel mt-8 flex flex-wrap items-center justify-between gap-5"
    >
      <div>
        <h2 className="font-bold mb-1">Keep your learning moving</h2>
        <p className="demo-muted text-sm" role={temporary ? 'status' : undefined}>
          {temporary
            ? 'Progress is saved for this visit only. Browser storage is unavailable; reloading or closing this tab may lose your changes.'
            : 'Progress stays in this browser. Mark this topic complete when you are ready; you can undo it anytime.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="demo-button"
          aria-pressed={done}
          onClick={() => toggle(id)}
        >
          {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
          {done ? 'Completed' : 'Mark as complete'}
        </button>
        {next ? (
          <TopicLink
            topic={next}
            className="demo-button demo-button-secondary no-underline"
          >
            {topic.level === 'Advanced' ? 'Next lab' : 'Next topic'}
            <ArrowRight className="size-4" />
          </TopicLink>
        ) : (
          <Link to="/" hash="topics" className="demo-button demo-button-secondary no-underline">
            Back to topics
            <ArrowRight className="size-4" />
          </Link>
        )}
        {topic.level !== 'Advanced' && (
          <Link to="/" hash="topics" className="demo-button demo-button-secondary no-underline">
            All learning topics
          </Link>
        )}
      </div>
    </section>
  )
}
