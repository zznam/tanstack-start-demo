import { createFileRoute } from '@tanstack/react-router'
import { ExecutionModeDemo } from '../components/ExecutionModeDemo'

export const Route = createFileRoute('/features/execution-modes_/hybrid')({
  ssr: 'data-only',
  loader: () => ({
    loaderEnvironment: typeof window === 'undefined' ? 'Server loader (initial request)' : 'Browser loader (client navigation)',
    loadedAt: new Date().toISOString(),
  }),
  component: HybridDemo,
})

function HybridDemo() {
  const data = Route.useLoaderData()
  return <ExecutionModeDemo mode="hybrid" loaderEnvironment={data.loaderEnvironment} loadedAt={data.loadedAt} />
}
