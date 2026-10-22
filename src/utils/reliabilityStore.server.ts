import { randomUUID } from 'node:crypto'
import { feedCursorSchema } from './reliabilityModels.ts'
import type {
  FeedEvent,
  Receipt,
  ReservationResult,
} from './reliabilityModels.ts'

type Workspace = {
  touchedAt: number
  generation: string
  remaining: number
  receipts: Map<string, Receipt>
  sequence: number
  events: FeedEvent[]
}

// Single-process teaching store: every check and write below is synchronous.
// A real service needs a database transaction and a unique scoped request key.
export function createReliabilityStore({
  maxWorkspaces = 100,
  ttlMs = 30 * 60 * 1000,
  now = Date.now,
} = {}) {
  const workspaces = new Map<string, Workspace>()
  function get(workspace: string) {
    const time = now()
    for (const [id, value] of workspaces) {
      if (time - value.touchedAt >= ttlMs) workspaces.delete(id)
    }
    let item = workspaces.get(workspace)
    if (!item) {
      if (workspaces.size >= maxWorkspaces)
        workspaces.delete(workspaces.keys().next().value!)
      item = {
        touchedAt: time,
        generation: randomUUID(),
        remaining: 20,
        receipts: new Map(),
        sequence: 12,
        events: Array.from({ length: 12 }, (_, index) => ({
          id: index + 1,
          // Adjacent rows deliberately share timestamps to exercise tie breaking.
          createdAt: 1_792_670_400_000 + Math.floor(index / 2) * 1000,
          title: 'Event ' + (index + 1),
        })).reverse(),
      }
    }
    item.touchedAt = time
    workspaces.delete(workspace)
    workspaces.set(workspace, item)
    return item
  }
  const snapshot = (item: Workspace) => ({
    remaining: item.remaining,
    reservations: item.receipts.size,
  })

  return {
    readReservations(workspace: string) {
      return snapshot(get(workspace))
    },
    reserve(
      workspace: string,
      request: string,
      quantity: number,
    ): ReservationResult {
      const item = get(workspace)
      const previous = item.receipts.get(request)
      if (previous) {
        return {
          status: previous.quantity === quantity ? 'replayed' : 'conflict',
          receipt: { ...previous },
          state: snapshot(item),
        }
      }
      if (quantity > item.remaining)
        return { status: 'sold-out', receipt: null, state: snapshot(item) }
      item.remaining -= quantity
      const receipt = {
        id: item.receipts.size + 1,
        quantity,
        remaining: item.remaining,
      }
      // No await between lookup, side effect, and storing the result.
      item.receipts.set(request, receipt)
      return {
        status: 'created',
        receipt: { ...receipt },
        state: snapshot(item),
      }
    },
    readFeed({
      workspace,
      offset,
      cursor,
      limit,
    }: {
      workspace: string
      offset: number
      cursor?: string
      limit: number
    }) {
      const item = get(workspace)
      let anchor: { id: number; createdAt: number } | undefined
      if (cursor) {
        try {
          if (!/^[A-Za-z0-9_-]+$/.test(cursor))
            throw new Error('Invalid encoding')
          const parsed = feedCursorSchema.parse(
            JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
          )
          if (
            parsed.workspace !== workspace ||
            parsed.generation !== item.generation
          )
            throw new Error('Different feed')
          anchor = parsed
        } catch {
          throw new Error('Cursor expired or invalid. Restart pagination.')
        }
      }
      const eligible = anchor
        ? item.events.filter(
            (event) =>
              event.createdAt < anchor.createdAt ||
              (event.createdAt === anchor.createdAt && event.id < anchor.id),
          )
        : item.events
      const cursorItems = eligible
        .slice(0, limit)
        .map((event) => ({ ...event }))
      const last = cursorItems.at(-1)
      const nextCursor = last
        ? Buffer.from(
            JSON.stringify({
              version: 1,
              workspace,
              generation: item.generation,
              id: last.id,
              createdAt: last.createdAt,
            }),
          ).toString('base64url')
        : cursor
      return {
        cursorItems,
        offsetItems: item.events
          .slice(offset, offset + limit)
          .map((event) => ({ ...event })),
        nextCursor,
        nextOffset: offset + limit,
        cursorHasMore: eligible.length > limit,
        offsetHasMore: item.events.length > offset + limit,
        total: item.events.length,
      }
    },
    insertEvent(workspace: string) {
      const item = get(workspace)
      const event = {
        id: ++item.sequence,
        createdAt: Math.max(now(), item.events[0]?.createdAt ?? 0),
        title: 'Event ' + item.sequence,
      }
      item.events.unshift(event)
      item.events = item.events.slice(0, 40)
      return { ...event }
    },
    deleteNewestEvent(workspace: string) {
      const item = get(workspace)
      return item.events.shift()?.id ?? null
    },
  }
}

export const reliabilityStore = createReliabilityStore()
