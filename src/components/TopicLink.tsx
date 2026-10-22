import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { LearningTopic } from '../utils/learningTopics'

export function TopicLink({
  topic,
  children,
  className,
  onClick,
}: {
  topic: LearningTopic
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <Link
      to={topic.to}
      search={
        topic.id === 'routing'
          ? { category: 'all', query: '', sortBy: 'newest' }
          : topic.id === 'caching'
            ? { project: 'frontend' }
            : undefined
      }
      preload={topic.level === 'Advanced' ? false : undefined}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
