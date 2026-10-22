import { createServerFn } from '@tanstack/react-start'
import { outboxSchema } from './outboxModels'
import { runOutboxLab } from './outboxLab.server'

export const runOrderDelivery = createServerFn({ method: 'POST' })
  .validator(outboxSchema)
  .handler(({ data }) => runOutboxLab(data).report)
