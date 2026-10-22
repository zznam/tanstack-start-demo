import { z } from 'zod'

export const labSearchSchema = z.object({
  workspace: z.uuid().optional().catch(undefined),
})
export const cacheSearchSchema = labSearchSchema.extend({
  project: z.enum(['frontend', 'backend']).catch('frontend'),
})
export const workspaceSchema = z.object({ workspace: z.uuid() })
export const cacheInputSchema = workspaceSchema.extend({
  project: z.enum(['frontend', 'backend']),
})
export const updateTaskSchema = workspaceSchema.extend({
  expectedVersion: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  done: z.boolean(),
  reject: z.boolean(),
})
export const parallelInputSchema = z.object({
  strategy: z.enum(['parallel', 'sequential']),
  failure: z.enum(['none', 'catalog', 'recommendations']),
})

export type TaskSnapshot = { title: string; done: boolean; version: number }
export type TaskResult = {
  status: 'saved' | 'conflict' | 'rejected'
  current: TaskSnapshot
}
export const serviceDefinitions = [
  {
    id: 'catalog',
    label: 'Product catalog',
    delayMs: 160,
    required: true,
    value: '12 products ready to browse',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    delayMs: 340,
    required: false,
    value: '9 products in stock',
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    delayMs: 520,
    required: false,
    value: '3 suggested products',
  },
] as const

export type ServiceResult = {
  id: string
  label: string
  required: boolean
  startedMs: number
  durationMs: number
  status: 'fulfilled' | 'rejected'
  value: string
}
