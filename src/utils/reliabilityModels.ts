import { z } from 'zod'

const quantitySchema = z.number().int().min(1).max(5)
export const reservationSearchSchema = z.object({
  workspace: z.uuid().optional().catch(undefined),
  request: z.uuid().optional().catch(undefined),
  quantity: quantitySchema.optional().catch(undefined),
})
export const reservationInputSchema = z.object({
  workspace: z.uuid(),
  expectedGeneration: z.uuid(),
  request: z.uuid(),
  quantity: quantitySchema,
  dropResponse: z.boolean(),
})
export const feedMutationSchema = z.object({
  workspace: z.uuid(),
  expectedGeneration: z.uuid(),
})
export const scenarioSchema = z.object({
  scenario: z.enum([
    'concurrent',
    'lost-response',
    'payload-conflict',
    'insert',
    'delete',
  ]),
})
export const feedInputSchema = z.object({
  workspace: z.uuid(),
  offset: z.number().int().min(0).max(1000),
  cursor: z.string().min(1).max(512).optional(),
  limit: z.union([z.literal(3), z.literal(5), z.literal(8)]),
})
export const feedCursorSchema = z.object({
  version: z.literal(1),
  workspace: z.uuid(),
  generation: z.uuid(),
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  createdAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
})

export type FeedEvent = { id: number; createdAt: number; title: string }
export type Receipt = { id: number; quantity: number; remaining: number }
export type ReservationState = {
  remaining: number
  reservations: number
  generation: string
}
export type ReservationResult = {
  status: 'created' | 'replayed' | 'conflict' | 'sold-out' | 'expired'
  receipt: Receipt | null
  state: ReservationState
}
