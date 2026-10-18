import { Link } from '@tanstack/react-router'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="demo-page py-16">
      <div className="demo-panel max-w-xl mx-auto text-center">
        <div className="inline-flex p-4 rounded-3xl bg-[rgba(79,184,178,0.12)] border border-[rgba(79,184,178,0.25)] text-[var(--lagoon-deep)] mb-4">
          <FileQuestion className="w-12 h-12" />
        </div>
        <p className="island-kicker text-xs font-bold text-[var(--kicker)] uppercase tracking-wider mb-2">
          404 Not Found
        </p>
        <h1 className="demo-title text-3xl font-extrabold mb-3">Page or Resource Not Found</h1>
        <p className="text-[var(--sea-ink-soft)] text-sm mb-6 max-w-md mx-auto">
          {children || 'The route or data entity you requested does not exist or was removed in this TanStack Start demo.'}
        </p>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="demo-button demo-button-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link to="/" className="demo-button no-underline">
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
