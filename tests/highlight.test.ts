import test from 'node:test'
import assert from 'node:assert/strict'
import { highlightParts } from '../src/utils/highlight.ts'

const marked = (text: string, query: string) =>
  highlightParts(text, query)
    .map((p) => (p.match ? `[${p.text}]` : p.text))
    .join('')

test('highlights every search word case-insensitively', () => {
  assert.equal(marked('Type-safe routing', 'ROUT'), 'Type-safe [rout]ing')
  assert.equal(marked('Cache and cache again', 'cache'), '[Cache] and [cache] again')
  assert.equal(marked('Server functions', 'server func'), '[Server] [func]tions')
})

test('merges overlapping and adjacent matches', () => {
  assert.equal(marked('abcdef', 'abc cde'), '[abcde]f')
  assert.equal(marked('abcdef', 'ab cd'), '[abcd]ef')
})

test('handles empty queries, empty text and regex characters literally', () => {
  assert.deepEqual(highlightParts('Routing', '   '), [{ text: 'Routing', match: false }])
  assert.deepEqual(highlightParts('', 'x'), [])
  assert.equal(marked('a.b (c)', '.b ('), 'a[.b] [(]c)')
  assert.equal(marked('aaaa', 'aa'), '[aaaa]')
})
