import { z } from 'zod'

export const resilienceSchema = z.object({
  scenario: z.enum([
    'transient',
    'outage',
    'probe-fails',
    'timeout',
    'invalid',
  ]),
  maxAttempts: z.number().int().min(1).max(3),
  deadlineMs: z.union([z.literal(250), z.literal(500), z.literal(1000)]),
  breaker: z.boolean(),
})
export type ResilienceInput = z.infer<typeof resilienceSchema>
