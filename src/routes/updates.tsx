import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, History } from 'lucide-react'
import { TopicLink } from '../components/TopicLink'
import { learningTopics } from '../utils/learningTopics'
import { recentChanges } from '../utils/recentChanges'

export const Route = createFileRoute('/updates')({
  head: () => ({ meta: [{ title: 'What’s new | TanStack Learning Lab' }] }),
  component: UpdatesPage,
})

function UpdatesPage() {
  return (
    <div className="demo-page space-y-8">
      <header>
        <Link to="/" hash="topics" className="inline-flex items-center gap-2 text-sm mb-6">
          <ArrowLeft className="size-4" />All learning topics
        </Link>
        <p className="island-kicker flex items-center gap-2 mb-4"><History className="size-4" />Recent changes</p>
        <h1 className="demo-title">What’s new in the lab</h1>
        <p className="demo-muted max-w-2xl leading-relaxed">New experiments and improvements, with a direct path into the topics they teach.</p>
      </header>
      <ol className="space-y-5" aria-label="Recent app updates">
        {recentChanges.map((update) => (
          <li key={update.id} className="demo-panel space-y-4">
            <time dateTime={update.date} className="island-kicker">{update.date}</time>
            <h2 className="text-xl font-bold">{update.title}</h2>
            <p className="demo-muted leading-relaxed">{update.summary}</p>
            <div className="flex flex-wrap gap-3">
              {update.topics.map((id) => {
                const topic = learningTopics.find((item) => item.id === id)!
                return <TopicLink key={id} topic={topic} className="demo-button demo-button-secondary no-underline">{topic.title}<ArrowRight className="size-4 shrink-0" /></TopicLink>
              })}
              {update.id === 'discovery' && <Link to="/" hash="topics" className="demo-button no-underline">Explore the catalog<ArrowRight className="size-4" /></Link>}
            </div>
            {update.source && <a href={update.source} target="_blank" rel="noreferrer" className="inline-block text-sm">View source history ↗</a>}
          </li>
        ))}
      </ol>
    </div>
  )
}
