import test from 'node:test'
import assert from 'node:assert/strict'
import {
  backupFileName,
  createBackup,
  parseBackup,
} from '../src/utils/progressBackup.ts'
import { practiceQuestions } from '../src/utils/gamification.ts'
import { learningTopics } from '../src/utils/learningTopics.ts'

const today = '2026-11-27'
const [first, second] = learningTopics
const question = practiceQuestions[0].id

test('backup round-trips learning and game progress', () => {
  const backup = createBackup(
    {
      learning: JSON.stringify({ version: 1, completed: [first.id, 'unknown'] }),
      game: JSON.stringify({
        version: 1,
        mastered: [question],
        saved: [],
        reviews: {},
        practiceDays: { [today]: [question] },
        dailyGoal: 3,
        weeklyGoal: 5,
      }),
    },
    new Date('2026-11-27T09:00:00Z'),
    today,
  )
  assert.deepEqual(backup.learning.completed, [first.id])
  assert.equal(backup.exportedAt, '2026-11-27T09:00:00.000Z')

  const restored = parseBackup(JSON.stringify(backup), today)
  assert.ok(restored.ok)
  assert.deepEqual(restored.value.summary, {
    topics: 1,
    mastered: 1,
    practiceDays: 1,
  })
  assert.deepEqual(JSON.parse(restored.value.learningRaw), {
    version: 1,
    completed: [first.id],
  })
  assert.equal(JSON.parse(restored.value.gameRaw).dailyGoal, 3)
})

test('empty or corrupt stores still export a valid backup', () => {
  const backup = createBackup({ learning: '', game: '{oops' }, new Date(0), today)
  assert.deepEqual(backup.learning.completed, [])
  assert.deepEqual(backup.game.mastered, [])
  assert.ok(parseBackup(JSON.stringify(backup), today).ok)
})

test('rejects files that are not backups from this app version', () => {
  assert.equal(parseBackup('not json', today).ok, false)
  assert.equal(parseBackup('[]', today).ok, false)
  assert.equal(parseBackup('{"app":"other","version":1}', today).ok, false)
  const future = parseBackup(
    JSON.stringify({ app: 'tanstack-start-learning-lab', version: 2 }),
    today,
  )
  assert.equal(future.ok, false)
  assert.match(future.ok ? '' : future.error, /different version/)
})

test('drops unknown topics and future practice days from a hand-edited file', () => {
  const restored = parseBackup(
    JSON.stringify({
      app: 'tanstack-start-learning-lab',
      version: 1,
      learning: { version: 1, completed: [second.id, 'made-up'] },
      game: { version: 1, practiceDays: { '2099-01-01': [question] } },
    }),
    today,
  )
  assert.ok(restored.ok)
  assert.deepEqual(restored.value.summary, {
    topics: 1,
    mastered: 0,
    practiceDays: 0,
  })
})

test('file name carries the local day', () => {
  assert.equal(backupFileName(today), 'tanstack-learning-progress-2026-11-27.json')
})
