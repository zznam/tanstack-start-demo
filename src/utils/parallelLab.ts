import { serviceDefinitions } from './labModels.ts'
import type { ServiceResult } from './labModels.ts'

type Options = {
  strategy: 'parallel' | 'sequential'
  failure: 'none' | 'catalog' | 'recommendations'
}
type Clock = { now: () => number; sleep: (ms: number) => Promise<void> }

export async function runParallelLab(
  options: Options,
  clock: Clock = {
    now: () => performance.now(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  },
) {
  const start = clock.now()
  const traces = new Map<string, { startedMs: number; durationMs: number }>()
  async function run(service: (typeof serviceDefinitions)[number]) {
    const startedAt = clock.now()
    const trace = { startedMs: Math.round(startedAt - start), durationMs: 0 }
    traces.set(service.id, trace)
    try {
      await clock.sleep(service.delayMs)
      if (options.failure === service.id)
        throw new Error(`${service.label} is temporarily unavailable`)
      return service.value
    } finally {
      trace.durationMs = Math.round(clock.now() - startedAt)
    }
  }
  const settled: PromiseSettledResult<string>[] = []
  if (options.strategy === 'parallel') {
    settled.push(...(await Promise.allSettled(serviceDefinitions.map(run))))
  } else {
    for (const service of serviceDefinitions) {
      settled.push(...(await Promise.allSettled([run(service)])))
    }
  }
  const services: ServiceResult[] = serviceDefinitions.map((service, index) => {
    const result = settled[index]
    return {
      id: service.id,
      label: service.label,
      required: service.required,
      ...traces.get(service.id)!,
      status: result.status,
      value:
        result.status === 'fulfilled'
          ? result.value
          : `${service.label} is temporarily unavailable`,
    }
  })
  return {
    strategy: options.strategy,
    elapsedMs: Math.round(clock.now() - start),
    services,
  }
}
