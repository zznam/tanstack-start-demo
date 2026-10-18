import { createFileRoute } from '@tanstack/react-router'
import { ExecutionModeDemo } from '../components/ExecutionModeDemo'

export const Route = createFileRoute('/features/execution-modes_/spa')({
  ssr: false,
  loader: () => ({ loaderEnvironment: 'Browser loader', loadedAt: new Date().toISOString() }),
  component: ClientDemo,
})

function ClientDemo() {
  const data = Route.useLoaderData()
  return <ExecutionModeDemo mode="client" loaderEnvironment={data.loaderEnvironment} loadedAt={data.loadedAt} />
}
