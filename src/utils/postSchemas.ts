import { z } from 'zod'

export const categorySchema = z.enum(['architecture', 'fullstack', 'routing', 'agents'])

export const routingSearchSchema = z.object({
  category: z.enum(['all', 'architecture', 'fullstack', 'routing', 'agents']).catch('all'),
  query: z.string().max(200).catch(''),
  sortBy: z.enum(['newest', 'likes']).catch('newest'),
})

export type RoutingSearch = z.infer<typeof routingSearchSchema>

export const fetchPostsSchema = z.object({
  category: routingSearchSchema.shape.category.default('all'),
  query: z.string().trim().max(200).default(''),
  sortBy: routingSearchSchema.shape.sortBy.default('newest'),
})

export const createPostSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters').max(160),
  category: categorySchema,
  excerpt: z.string().trim().min(10, 'Excerpt must be at least 10 characters').max(500),
  content: z.string().trim().min(20, 'Content must be at least 20 characters').max(10000),
  author: z.string().trim().min(2, 'Author name must be at least 2 characters').max(80),
})

export const postByIdSchema = z.object({ id: z.string().trim().min(1).max(100) })
