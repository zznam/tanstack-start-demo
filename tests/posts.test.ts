import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPostStore } from '../src/utils/postStore.server.ts'
import { INITIAL_POSTS } from '../src/utils/postsData.ts'
import { createPostSchema, routingSearchSchema } from '../src/utils/postSchemas.ts'

const draft = {
  title: '  A new demo article  ', category: 'routing', author: '  Explorer  ',
  excerpt: 'An example summary for validation.', content: 'A complete article body with more than twenty characters.',
}

test('invalid and absent URL values resolve to useful defaults', () => {
  const defaults = { category: 'all', query: '', sortBy: 'newest' }
  assert.deepEqual(routingSearchSchema.parse({}), defaults)
  assert.deepEqual(routingSearchSchema.parse({ category: 'bad', query: {}, sortBy: 'bad' }), defaults)
})

test('post inputs reject whitespace, excessive data and invalid categories', () => {
  for (const invalid of [{ title: '     ' }, { content: ' '.repeat(25) }, { title: 'x'.repeat(161) }, { author: 'x'.repeat(81) }, { category: 'bad' }]) {
    assert.equal(createPostSchema.safeParse({ ...draft, ...invalid }).success, false)
  }
})

test('filtering trims search, includes tags, sorts and does not mutate seeds', () => {
  const store = createPostStore()
  assert.equal(store.list({ query: '  ZOD  ' }).length, 1)
  assert.equal(store.list({ category: 'architecture' }).length, 2)
  assert.equal(store.list({ sortBy: 'likes' })[0].id, '4')
  assert.equal(store.list()[0].id, '5')
  store.like('1')
  assert.equal(INITIAL_POSTS[0].likes, 342)
  const copy = store.get('1')!
  copy.tags.push('changed')
  assert.equal(store.get('1')!.tags.includes('changed'), false)
})

test('new posts get unique IDs, normalized inputs and a bounded store', () => {
  const store = createPostStore([], 3)
  const created = Array.from({ length: 20 }, () => store.create(draft))
  assert.equal(new Set(created.map((p) => p.id)).size, 20)
  assert.equal(created[0].title, 'A new demo article')
  assert.equal(created[0].author, 'Explorer')
  assert.equal(store.list().length, 3)
  assert.equal(store.get(created[0].id), undefined)
  const last = created.at(-1)!
  assert.deepEqual(store.like(last.id), { id: last.id, likes: 2 })
  assert.equal(store.get(last.id)!.likes, 2)
  assert.equal(store.like('missing'), undefined)
})
