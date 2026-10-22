import { z } from 'zod'

export const outboxSchema = z.object({
  strategy: z.enum(['outbox', 'direct']),
  fault: z.enum([
    'none',
    'before-commit',
    'after-commit',
    'ack-lost',
    'consumer-crash',
    'poison',
  ]),
  deduplicate: z.boolean(),
})
export type OutboxInput = z.infer<typeof outboxSchema>
