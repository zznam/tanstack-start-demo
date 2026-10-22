import { randomUUID } from 'node:crypto'
import { createReliabilityStore } from './reliabilityStore.server.ts'

// A complete, disposable experiment in one invocation. It illustrates the
// algorithm without claiming persistence or coordination across host instances.
export async function runReliabilityScenario(
  scenario:
    | 'concurrent'
    | 'lost-response'
    | 'payload-conflict'
    | 'insert'
    | 'delete',
) {
  const store = createReliabilityStore()
  const workspace = randomUUID()
  const request = randomUUID()
  if (scenario === 'insert' || scenario === 'delete') {
    const first = store.readFeed({ workspace, offset: 0, limit: 3 })
    if (scenario === 'insert') store.insertEvent(workspace)
    else store.deleteNewestEvent(workspace)
    const next = store.readFeed({
      workspace,
      offset: 3,
      limit: 3,
      cursor: first.nextCursor,
    })
    return {
      title:
        scenario === 'insert'
          ? 'Insertion repeats an offset row'
          : 'Deletion skips an offset row',
      steps: [
        'First page: ' + first.cursorItems.map((item) => item.id).join(', '),
        scenario === 'insert'
          ? 'Inserted event 13 ahead of the boundary.'
          : 'Deleted event 12 ahead of the boundary.',
        'Next offset page: ' +
          next.offsetItems.map((item) => item.id).join(', '),
        'Next cursor page: ' +
          next.cursorItems.map((item) => item.id).join(', '),
      ],
    }
  }
  if (scenario === 'concurrent') {
    const results = await Promise.all(
      [1, 2].map(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return store.reserve(workspace, request, 2)
      }),
    )
    return {
      title: 'One shared store commits once',
      steps: [
        'Concurrent outcomes: ' +
          results.map((result) => result.status).join(', '),
        'Committed reservations: ' +
          store.readReservations(workspace).reservations,
        'Seats remaining: ' + store.readReservations(workspace).remaining,
      ],
    }
  }
  const first = store.reserve(workspace, request, 2)
  // For response loss, discard the first receipt, then retry the same key.
  const retry = store.reserve(
    workspace,
    request,
    scenario === 'payload-conflict' ? 3 : 2,
  )
  return {
    title:
      scenario === 'lost-response'
        ? 'Retry recovers the original receipt'
        : 'Changed payload is rejected',
    steps: [
      scenario === 'lost-response'
        ? 'Committed the reservation; discarded its response.'
        : 'Created a reservation for 2 seats.',
      'Retry outcome: ' + retry.status,
      'Original receipt: reservation #' + first.receipt!.id + ', 2 seats',
      'Committed reservations: ' +
        retry.state.reservations +
        '; seats remaining: ' +
        retry.state.remaining,
    ],
  }
}
