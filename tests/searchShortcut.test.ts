import test from 'node:test'
import assert from 'node:assert/strict'
import { isSearchShortcut } from '../src/utils/searchShortcut.ts'

const key = (overrides = {}) => ({
  key: '/',
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  defaultPrevented: false,
  ...overrides,
})

test('slash focuses search only outside editable fields and without modifiers', () => {
  assert.equal(isSearchShortcut(key(), { tagName: 'BODY' }), true)
  assert.equal(isSearchShortcut(key(), null), true)
  assert.equal(isSearchShortcut(key({ key: '?' }), null), false)
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'defaultPrevented', 'isComposing'])
    assert.equal(isSearchShortcut(key({ [modifier]: true }), null), false, modifier)
  for (const tagName of ['INPUT', 'textarea', 'SELECT'])
    assert.equal(isSearchShortcut(key(), { tagName }), false, tagName)
  assert.equal(isSearchShortcut(key(), { tagName: 'DIV', isContentEditable: true }), false)
})
