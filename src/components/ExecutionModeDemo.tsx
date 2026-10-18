import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export function ExecutionModeDemo({ mode, loaderEnvironment, loadedAt }: {
  mode: 'client' | 'hybrid'
  loaderEnvironment: string
  loadedAt: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <div className="demo-page">
      <div className="demo-panel space-y-4">
        <h1 className="demo-title">{mode === 'client' ? 'Live client-only route' : 'Live data-only SSR route'}</h1>
        <p>This route uses <code>ssr: {mode === 'client' ? 'false' : "'data-only'"}</code>. Reload it to inspect the initial response.</p>
        <dl className="space-y-2">
          <div><dt className="font-bold">Loader environment</dt><dd data-testid="loader-environment">{loaderEnvironment}</dd></div>
          <div><dt className="font-bold">Loaded at</dt><dd>{loadedAt}</dd></div>
          <div><dt className="font-bold">Component mounted in browser</dt><dd>{mounted ? 'Yes' : 'Waiting'}</dd></div>
        </dl>
        <p>{mode === 'client'
          ? 'The initial response contains the shared shell. The loader and this component run in the browser.'
          : 'The initial response includes serialized loader data, but this component renders only in the browser. Later navigations execute the loader in the browser.'}</p>
        <Link to="/features/execution-modes" className="demo-button">Back to execution modes</Link>
      </div>
    </div>
  )
}
