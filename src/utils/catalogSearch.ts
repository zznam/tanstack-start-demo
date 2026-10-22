import { z } from 'zod'

// Optional values keep links to the catalog useful without supplying filters.
export const catalogSearchSchema = z.object({
  q: z.string().max(120).optional().catch(undefined),
  level: z.enum(['Foundations', 'Patterns', 'Advanced']).optional().catch(undefined),
  incomplete: z.boolean().optional().catch(undefined),
})
