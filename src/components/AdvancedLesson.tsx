import type { ReactNode } from 'react'
import {
  ArrowLeft,
  Clock,
  GraduationCap,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { learningTopics } from '../utils/learningTopics'
import type { TopicId } from '../utils/learningTopics'
import { LessonProgress } from './LessonProgress'
import { TopicLink } from './TopicLink'

export function AdvancedLesson({
  id,
  title,
  intro,
  children,
  challenge,
  solution,
  docs,
}: {
  id: TopicId
  title: string
  intro: string
  children: ReactNode
  challenge: string
  solution: string
  docs: { label: string; href: string }[]
}) {
  const topic = learningTopics.find((item) => item.id === id)!
  return (
    <div className="demo-page space-y-8">
      <header>
        <Link
          to="/"
          hash="topics"
          className="inline-flex items-center gap-2 text-sm mb-6"
        >
          <ArrowLeft className="size-4" />
          All learning topics
        </Link>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="demo-pill">
            <GraduationCap className="size-4" />
            Advanced lab
          </span>
          <span className="demo-pill">
            <Clock className="size-3.5" />
            {topic.minutes} min
          </span>
        </div>
        <h1 className="demo-title">{title}</h1>
        <p className="demo-muted max-w-3xl leading-relaxed">{intro}</p>
        <p className="mt-4 text-sm demo-muted">
          Builds on:{' '}
          {topic.prerequisites.map((prerequisite, index) => {
            const previous = learningTopics.find(
              (item) => item.id === prerequisite,
            )!
            return (
              <span key={prerequisite}>
                {index > 0 && ' · '}
                <TopicLink topic={previous}>{previous.title}</TopicLink>
              </span>
            )
          })}
        </p>
      </header>
      {children}
      <section
        className="demo-panel space-y-4"
        aria-labelledby="challenge-title"
      >
        <p className="island-kicker">Put it into practice</p>
        <h2 id="challenge-title" className="text-xl font-bold">
          Try this challenge
        </h2>
        <p className="demo-muted leading-relaxed">{challenge}</p>
        <details className="lesson-details">
          <summary>Reveal the explanation</summary>
          <p>{solution}</p>
        </details>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm pt-2">
          {docs.map((doc) => (
            <a key={doc.href} href={doc.href} target="_blank" rel="noreferrer">
              {doc.label} ↗
            </a>
          ))}
        </div>
      </section>
      <LessonProgress id={id} />
    </div>
  )
}
