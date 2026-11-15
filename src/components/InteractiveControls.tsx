import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

const subscribe = () => () => {}

// Native disabled semantics apply even before the entry script downloads. The
// server snapshot also matches the first hydration render; React enables the
// controls only after their event handlers have been attached.
export function InteractiveControls({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)

  return (
    <fieldset
      disabled={!hydrated}
      aria-busy={!hydrated}
      aria-label="Interactive learning lab"
      className="contents"
    >
      {!hydrated && (
        <p role="status" className="page-wrap text-sm demo-muted">
          Getting interactive controls ready…
        </p>
      )}
      <noscript>
        <p className="page-wrap">
          Enable JavaScript to use interactive controls. You can still read
          lessons and follow links.
        </p>
      </noscript>
      {children}
    </fieldset>
  )
}
