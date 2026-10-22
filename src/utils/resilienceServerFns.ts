import { createServerFn } from '@tanstack/react-start'
import { resilienceSchema } from './resilienceModels'
import { runResilienceLab } from './resilienceLab.server'

export const runShippingScenario = createServerFn({ method: 'POST' })
  .validator(resilienceSchema)
  .handler(({ data }) => runResilienceLab(data).report)
