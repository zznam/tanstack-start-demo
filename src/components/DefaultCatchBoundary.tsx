import { useRouter } from '@tanstack/react-router'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export interface ErrorComponentProps {
  error: any
  reset?: () => void
}

export function DefaultCatchBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const [showStack, setShowStack] = useState(false)
  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown application error')
  const errorStack = error instanceof Error ? error.stack : undefined

  return (
    <div className="demo-page">
      <div className="demo-panel border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <span className="demo-pill border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Error Boundary Caught
            </span>
            <h1 className="demo-title mt-1 text-2xl font-bold">Something went wrong</h1>
          </div>
        </div>

        <p className="mt-4 text-[var(--sea-ink-soft)]">
          TanStack Router and Start caught an exception. The root shell is intact, and you can safely retry or navigate.
        </p>

        <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5 font-mono text-sm text-red-600 dark:text-red-400 overflow-x-auto">
          {errorMessage}
        </div>

        {errorStack && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowStack(!showStack)}
              className="text-xs font-semibold text-[var(--lagoon-deep)] hover:underline"
            >
              {showStack ? 'Hide stack trace ▲' : 'Show stack trace ▼'}
            </button>
            {showStack && (
              <pre className="mt-2 p-3 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] overflow-x-auto max-h-64">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (reset) {
                reset()
              } else {
                router.invalidate()
              }
            }}
            className="demo-button"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Action
          </button>
          <Link to="/" className="demo-button demo-button-secondary no-underline">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
