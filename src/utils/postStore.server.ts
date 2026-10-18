import { randomUUID } from 'node:crypto'
import { INITIAL_POSTS, type Post } from './postsData.ts'
import { createPostSchema, fetchPostsSchema } from './postSchemas.ts'

// Deliberately ephemeral, shared demo data. Bound memory use for public demos.
export function createPostStore(seed: Post[] = INITIAL_POSTS, capacity = 100) {
  const posts = structuredClone(seed)
  return {
    list(input: unknown = {}) {
      const { category, query, sortBy } = fetchPostsSchema.parse(input)
      const q = query.toLowerCase()
      return structuredClone(posts.filter((post) =>
        (category === 'all' || post.category === category) &&
        (!q || [post.title, post.excerpt, ...post.tags].some((text) => text.toLowerCase().includes(q))),
      ).sort((a, b) => sortBy === 'likes'
        ? b.likes - a.likes
        : Date.parse(b.createdAt) - Date.parse(a.createdAt)))
    },
    get(id: string) {
      const post = posts.find((post) => post.id === id)
      return post ? structuredClone(post) : undefined
    },
    create(input: unknown) {
      const data = createPostSchema.parse(input)
      const post: Post = {
        ...data,
        id: randomUUID(),
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        readTime: `${Math.max(1, Math.ceil(data.content.split(/\s+/).length / 200))} min`,
        createdAt: new Date().toISOString(),
        tags: [data.category.toUpperCase(), 'Community'],
        likes: 1,
      }
      posts.unshift(post)
      posts.splice(capacity)
      return structuredClone(post)
    },
    like(id: string) {
      const post = posts.find((post) => post.id === id)
      if (!post) return undefined
      post.likes += 1
      return { id, likes: post.likes }
    },
  }
}

export const postStore = createPostStore()
