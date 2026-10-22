import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogSearchSchema } from '../src/utils/catalogSearch.ts'

test('catalog URLs reject malformed filters without breaking discovery', () => {
  assert.deepEqual(catalogSearchSchema.parse({}), {})
  assert.deepEqual(catalogSearchSchema.parse({ q: ['cache'], level: 'expert', incomplete: 'false' }), {
    q: undefined, level: undefined, incomplete: undefined,
  })
  assert.equal(catalogSearchSchema.parse({ q: 'x'.repeat(121) }).q, undefined)
  assert.deepEqual(catalogSearchSchema.parse({ q: 'cache', level: 'Advanced', incomplete: true }), {
    q: 'cache', level: 'Advanced', incomplete: true,
  })
})
