import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterTopics,
  learningTopics,
  parseProgress,
} from '../src/utils/learningTopics.ts'
import { cacheSearchSchema, updateTaskSchema } from '../src/utils/labModels.ts'
import { createLabStore } from '../src/utils/labStore.server.ts'
import { runParallelLab } from '../src/utils/parallelLab.ts'

const workspace = '78c771b0-f524-4c62-abdd-8f1cfb181323'

test('catalog search combines words, level and completion filters', () => {
  assert.equal(learningTopics.length, 14)
  assert.equal(
    new Set(learningTopics.map((topic) => topic.id)).size,
    learningTopics.length,
  )
  assert.equal(
    filterTopics('  server INVALIDATION ', 'Advanced', false, []).at(0)?.id,
    'caching',
  )
  assert.equal(filterTopics('', 'Advanced', true, ['caching']).length, 5)
  assert.equal(
    filterTopics('no-such-concept', 'All topics', false, []).length,
    0,
  )
  for (const topic of learningTopics) {
    for (const prerequisite of topic.prerequisites) {
      assert.ok(
        learningTopics.findIndex((item) => item.id === prerequisite) <
          learningTopics.indexOf(topic),
      )
      assert.ok(learningTopics.some((item) => item.id === prerequisite))
    }
  }
})

test('stored progress ignores corrupt, obsolete, duplicate and unknown entries', () => {
  for (const raw of [
    '',
    'null',
    '{broken',
    '[]',
    '{"version":2,"completed":["caching"]}',
    '{"version":1,"completed":{}}',
  ])
    assert.deepEqual(parseProgress(raw), [])
  assert.deepEqual(
    parseProgress(
      '{"version":1,"completed":["caching","caching",4,"unknown","routing"]}',
    ),
    ['routing', 'caching'],
  )
})

test('lab search and writes validate untrusted inputs', () => {
  assert.deepEqual(
    cacheSearchSchema.parse({ workspace: 'invalid', project: 'other' }),
    { workspace: undefined, project: 'frontend' },
  )
  assert.throws(() =>
    updateTaskSchema.parse({
      workspace,
      expectedVersion: 0,
      done: true,
      reject: false,
    }),
  )
  assert.throws(() =>
    updateTaskSchema.parse({
      workspace,
      expectedVersion: 1,
      done: 'true',
      reject: false,
    }),
  )
  assert.throws(() =>
    updateTaskSchema.parse({
      workspace: 'any',
      expectedVersion: 1,
      done: true,
      reject: false,
    }),
  )
})

test('cache keys isolate projects and workspaces; writes do not change prior snapshots', () => {
  const store = createLabStore()
  const snapshot = store.readProject(workspace, 'frontend')
  assert.deepEqual(store.publishBuild(workspace, 'frontend'), {
    revision: 2,
    builds: 13,
  })
  assert.equal(snapshot.revision, 1)
  assert.equal(snapshot.builds, 12)
  const refreshed = store.readProject(workspace, 'frontend')
  assert.equal(refreshed.revision, 2)
  assert.equal(refreshed.reads, 2)
  assert.equal(store.readProject(workspace, 'backend').revision, 1)
  assert.equal(store.readProject('another-workspace', 'frontend').revision, 1)
})

test('optimistic server commits reject stale versions without losing the winning write', () => {
  const store = createLabStore()
  const old = store.readTask(workspace)
  assert.equal(
    store.updateTask(workspace, old.version, true, false).status,
    'saved',
  )
  const conflict = store.updateTask(workspace, old.version, false, false)
  assert.equal(conflict.status, 'conflict')
  assert.deepEqual(conflict.current, {
    title: old.title,
    done: true,
    version: 2,
  })
  const rejected = store.updateTask(workspace, 2, false, true)
  assert.equal(rejected.status, 'rejected')
  assert.equal(store.readTask(workspace).version, 2)
  rejected.current.done = false
  assert.equal(store.readTask(workspace).done, true)
  assert.equal(store.competingEdit(workspace).version, 3)
  assert.equal(store.updateTask(workspace, 2, false, false).status, 'conflict')
})

test('demo storage expires idle workspaces and evicts least recently used workspaces', () => {
  let time = 0
  const store = createLabStore({
    maxWorkspaces: 2,
    ttlMs: 100,
    now: () => time,
  })
  store.publishBuild('first', 'frontend')
  store.publishBuild('second', 'frontend')
  store.readProject('first', 'frontend')
  store.publishBuild('third', 'frontend')
  assert.equal(store.readProject('first', 'frontend').revision, 2)
  assert.equal(store.readProject('second', 'frontend').revision, 1)
  time = 100
  assert.equal(store.readProject('first', 'frontend').revision, 1)
})

async function measuredRun(
  strategy: 'parallel' | 'sequential',
  failure: 'none' | 'catalog' | 'recommendations',
) {
  let time = 0
  const timers: { at: number; resolve: () => void }[] = []
  const promise = runParallelLab(
    { strategy, failure },
    {
      now: () => time,
      sleep: (ms) =>
        new Promise<void>((resolve) => {
          timers.push({ at: time + ms, resolve })
        }),
    },
  )
  while (timers.length) {
    timers.sort((a, b) => a.at - b.at)
    const timer = timers.shift()!
    time = timer.at
    timer.resolve()
    await new Promise<void>((resolve) => setImmediate(resolve))
  }
  return promise
}

test('parallel loading removes the waterfall and preserves partial failure results', async () => {
  const parallel = await measuredRun('parallel', 'recommendations')
  assert.equal(parallel.elapsedMs, 520)
  assert.deepEqual(
    parallel.services.map((item) => item.startedMs),
    [0, 0, 0],
  )
  assert.deepEqual(
    parallel.services.map((item) => item.status),
    ['fulfilled', 'fulfilled', 'rejected'],
  )
  const sequential = await measuredRun('sequential', 'none')
  assert.equal(sequential.elapsedMs, 1020)
  assert.deepEqual(
    sequential.services.map((item) => item.startedMs),
    [0, 160, 500],
  )
  const criticalFailure = await measuredRun('parallel', 'catalog')
  assert.ok(
    criticalFailure.services.some(
      (item) => item.required && item.status === 'rejected',
    ),
  )
  assert.equal(
    criticalFailure.services.filter((item) => item.status === 'fulfilled')
      .length,
    2,
  )
})
