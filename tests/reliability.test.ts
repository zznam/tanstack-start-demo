import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { runReliabilityScenario } from '../src/utils/reliabilityScenarios.server.ts'
import { createReliabilityStore } from '../src/utils/reliabilityStore.server.ts'
import {
  feedInputSchema,
  reservationInputSchema,
  reservationSearchSchema,
} from '../src/utils/reliabilityModels.ts'

function counts(state: { remaining: number; reservations: number }) {
  return { remaining: state.remaining, reservations: state.reservations }
}

test('reliability RPCs validate scope, quantity, page bounds and cursor size', () => {
  const base = {
    workspace: randomUUID(),
    request: randomUUID(),
    quantity: 2,
    dropResponse: false,
    expectedGeneration: randomUUID(),
  }
  assert.ok(reservationInputSchema.safeParse(base).success)
  for (const quantity of [0, -1, 1.5, 6, '2', Infinity])
    assert.equal(
      reservationInputSchema.safeParse({ ...base, quantity }).success,
      false,
    )
  assert.equal(
    reservationInputSchema.safeParse({ ...base, request: 'invalid' }).success,
    false,
  )
  assert.equal(
    reservationInputSchema.safeParse({ ...base, workspace: 'invalid' }).success,
    false,
  )
  assert.deepEqual(
    reservationSearchSchema.parse({ request: [], quantity: 99 }),
    {
      request: undefined,
      quantity: undefined,
    },
  )
  const feed = { workspace: base.workspace, offset: 0, limit: 3 }
  assert.ok(feedInputSchema.safeParse(feed).success)
  for (const patch of [
    { offset: -1 },
    { offset: 1001 },
    { limit: 100 },
    { cursor: 'x'.repeat(513) },
  ])
    assert.equal(
      feedInputSchema.safeParse({ ...feed, ...patch }).success,
      false,
    )
})

test('duplicate and competing requests commit only once and preserve the original receipt', async () => {
  const store = createReliabilityStore()
  const workspace = randomUUID()
  const request = randomUUID()
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      Promise.resolve().then(() => store.reserve(workspace, request, 2)),
    ),
  )
  assert.equal(
    results.filter((result) => result.status === 'created').length,
    1,
  )
  assert.equal(
    results.filter((result) => result.status === 'replayed').length,
    9,
  )
  assert.deepEqual(counts(store.readReservations(workspace)), {
    remaining: 18,
    reservations: 1,
  })
  store.reserve(workspace, randomUUID(), 3)
  const replay = store.reserve(workspace, request, 2)
  assert.equal(replay.receipt?.remaining, 18)
  assert.equal(replay.state.remaining, 15)
  const conflict = store.reserve(workspace, request, 4)
  assert.equal(conflict.status, 'conflict')
  assert.equal(conflict.state.remaining, 15)
  replay.receipt!.remaining = 1000
  assert.equal(store.reserve(workspace, request, 2).receipt?.remaining, 18)
  assert.equal(store.reserve(randomUUID(), request, 2).status, 'created')
})

test('sold out writes do not allocate receipts; successful keys still replay at capacity', () => {
  const store = createReliabilityStore()
  const workspace = randomUUID()
  const first = randomUUID()
  store.reserve(workspace, first, 5)
  for (let index = 0; index < 3; index++)
    store.reserve(workspace, randomUUID(), 5)
  assert.equal(store.reserve(workspace, randomUUID(), 1).status, 'sold-out')
  assert.equal(store.reserve(workspace, first, 5).status, 'replayed')
  assert.deepEqual(counts(store.readReservations(workspace)), {
    remaining: 0,
    reservations: 4,
  })
})

test('keysets traverse timestamp ties once and preserve snapshots', () => {
  const store = createReliabilityStore()
  const workspace = randomUUID()
  const first = store.readFeed({ workspace, offset: 0, limit: 3 })
  assert.deepEqual(
    first.cursorItems.map((row) => row.id),
    [12, 11, 10],
  )
  first.cursorItems[0]!.title = 'Changed'
  assert.equal(
    store.readFeed({ workspace, offset: 0, limit: 3 }).cursorItems[0]?.title,
    'Event 12',
  )
  const second = store.readFeed({
    workspace,
    offset: 3,
    cursor: first.nextCursor,
    limit: 3,
  })
  assert.deepEqual(
    second.cursorItems.map((row) => row.id),
    [9, 8, 7],
  )
  let page = second
  const all = [...first.cursorItems, ...second.cursorItems].map((row) => row.id)
  while (page.cursorHasMore) {
    page = store.readFeed({
      workspace,
      offset: page.nextOffset,
      cursor: page.nextCursor,
      limit: 3,
    })
    all.push(...page.cursorItems.map((row) => row.id))
  }
  assert.equal(all.length, 12)
  assert.equal(new Set(all).size, 12)
  assert.equal(page.offsetHasMore, false)
  const end = store.readFeed({
    workspace,
    offset: page.nextOffset,
    cursor: page.nextCursor,
    limit: 3,
  })
  assert.deepEqual(end.cursorItems, [])
  assert.equal(end.nextCursor, page.nextCursor)
})

test('inserting ahead repeats offset rows but leaves the keyset boundary stable', () => {
  const store = createReliabilityStore()
  const workspace = randomUUID()
  const first = store.readFeed({ workspace, offset: 0, limit: 3 })
  store.insertEvent(workspace)
  const next = store.readFeed({
    workspace,
    offset: 3,
    cursor: first.nextCursor,
    limit: 3,
  })
  assert.deepEqual(
    next.offsetItems.map((row) => row.id),
    [10, 9, 8],
  )
  assert.deepEqual(
    next.cursorItems.map((row) => row.id),
    [9, 8, 7],
  )
})

test('deleting ahead skips offset rows; deleting the anchor still permits keyset traversal', () => {
  const store = createReliabilityStore()
  const workspace = randomUUID()
  const first = store.readFeed({ workspace, offset: 0, limit: 3 })
  store.deleteNewestEvent(workspace)
  const next = store.readFeed({
    workspace,
    offset: 3,
    cursor: first.nextCursor,
    limit: 3,
  })
  assert.deepEqual(
    next.offsetItems.map((row) => row.id),
    [8, 7, 6],
  )
  assert.deepEqual(
    next.cursorItems.map((row) => row.id),
    [9, 8, 7],
  )
  store.deleteNewestEvent(workspace)
  store.deleteNewestEvent(workspace)
  assert.deepEqual(
    store
      .readFeed({ workspace, offset: 3, cursor: first.nextCursor, limit: 3 })
      .cursorItems.map((row) => row.id),
    [9, 8, 7],
  )
})

test('cursors reject malformed, foreign and expired generations with a restart path', () => {
  let time = 0
  const store = createReliabilityStore({ ttlMs: 100, now: () => time })
  const workspace = randomUUID()
  store.reserve(workspace, randomUUID(), 2)
  const first = store.readFeed({ workspace, offset: 0, limit: 3 })
  for (const cursor of [
    'bad!',
    'null',
    Buffer.from('{}').toString('base64url'),
  ])
    assert.throws(
      () => store.readFeed({ workspace, offset: 3, cursor, limit: 3 }),
      /Cursor expired or invalid/,
    )
  assert.throws(
    () =>
      store.readFeed({
        workspace: randomUUID(),
        offset: 3,
        cursor: first.nextCursor,
        limit: 3,
      }),
    /Cursor expired or invalid/,
  )
  time = 100
  assert.throws(
    () =>
      store.readFeed({
        workspace,
        offset: 3,
        cursor: first.nextCursor,
        limit: 3,
      }),
    /Cursor expired or invalid/,
  )
  const restarted = store.readFeed({ workspace, offset: 0, limit: 3 })
  assert.equal(restarted.cursorItems.length, 3)
  assert.notEqual(restarted.nextCursor, first.nextCursor)
  assert.deepEqual(counts(store.readReservations(workspace)), {
    remaining: 20,
    reservations: 0,
  })
})

test('workspace eviction expires receipts and cursors; feeds and empty pages stay bounded', () => {
  const store = createReliabilityStore({ maxWorkspaces: 2 })
  const a = randomUUID(),
    b = randomUUID(),
    c = randomUUID(),
    request = randomUUID()
  store.reserve(a, request, 2)
  store.reserve(b, request, 1)
  const bPage = store.readFeed({ workspace: b, offset: 0, limit: 3 })
  store.readReservations(a) // a is recently used, so b must be evicted.
  store.readReservations(c)
  assert.equal(store.reserve(a, request, 2).status, 'replayed')
  assert.equal(store.readReservations(b).reservations, 0)
  assert.throws(() =>
    store.readFeed({
      workspace: b,
      offset: 3,
      cursor: bPage.nextCursor,
      limit: 3,
    }),
  )
  for (let index = 0; index < 80; index++) store.insertEvent(c)
  assert.equal(store.readFeed({ workspace: c, offset: 0, limit: 8 }).total, 40)
  for (let index = 0; index < 40; index++) store.deleteNewestEvent(c)
  const empty = store.readFeed({ workspace: c, offset: 0, limit: 3 })
  assert.deepEqual(empty.cursorItems, [])
  assert.deepEqual(empty.offsetItems, [])
  assert.equal(empty.cursorHasMore, false)
  assert.equal(empty.nextCursor, undefined)
})

test('generation guards reject writes on another process and after expiration', () => {
  let time = 0
  const a = createReliabilityStore({ now: () => time, ttlMs: 100 })
  const b = createReliabilityStore()
  const workspace = randomUUID(),
    request = randomUUID()
  const generation = a.readReservations(workspace).generation
  assert.equal(a.reserve(workspace, request, 2, generation).status, 'created')
  assert.equal(b.reserve(workspace, request, 2, generation).status, 'expired')
  assert.deepEqual(counts(b.readReservations(workspace)), {
    remaining: 20,
    reservations: 0,
  })
  assert.throws(
    () => b.insertEvent(workspace, generation),
    /Workspace moved or expired/,
  )
  assert.throws(
    () => b.deleteNewestEvent(workspace, generation),
    /Workspace moved or expired/,
  )
  assert.equal(b.readFeed({ workspace, offset: 0, limit: 3 }).total, 12)
  time = 100
  assert.equal(a.reserve(workspace, request, 2, generation).status, 'expired')
  assert.equal(a.readReservations(workspace).reservations, 0)
})

test('isolated walkthroughs execute complete, independent server scenarios', async () => {
  for (let run = 0; run < 2; run++) {
    const concurrent = await runReliabilityScenario('concurrent')
    assert.deepEqual(concurrent.steps, [
      'Concurrent outcomes: created, replayed',
      'Committed reservations: 1',
      'Seats remaining: 18',
    ])
  }
  assert.ok(
    (await runReliabilityScenario('lost-response')).steps.includes(
      'Retry outcome: replayed',
    ),
  )
  assert.ok(
    (await runReliabilityScenario('payload-conflict')).steps.includes(
      'Retry outcome: conflict',
    ),
  )
  const inserted = await runReliabilityScenario('insert')
  assert.ok(inserted.steps.includes('Next offset page: 10, 9, 8'))
  assert.ok(inserted.steps.includes('Next cursor page: 9, 8, 7'))
  const deleted = await runReliabilityScenario('delete')
  assert.ok(deleted.steps.includes('Next offset page: 8, 7, 6'))
  assert.ok(deleted.steps.includes('Next cursor page: 9, 8, 7'))
})
