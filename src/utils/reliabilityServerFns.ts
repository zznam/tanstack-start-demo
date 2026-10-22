import { createServerFn } from '@tanstack/react-start'
import { workspaceSchema } from './labModels'
import { feedInputSchema, reservationInputSchema } from './reliabilityModels'
import { reliabilityStore } from './reliabilityStore.server'

export const readReservations = createServerFn({ method: 'GET' })
  .validator(workspaceSchema)
  .handler(({ data }) => reliabilityStore.readReservations(data.workspace))

export const reserveSeats = createServerFn({ method: 'POST' })
  .validator(reservationInputSchema)
  .handler(async ({ data }) => {
    await new Promise((resolve) => setTimeout(resolve, 350))
    const result = reliabilityStore.reserve(
      data.workspace,
      data.request,
      data.quantity,
    )
    // The write really commits; only its response is replaced with an error.
    if (data.dropResponse && result.status === 'created')
      throw new Error('Simulated response loss after commit')
    return result
  })

export const readFeed = createServerFn({ method: 'GET' })
  .validator(feedInputSchema)
  .handler(({ data }) => reliabilityStore.readFeed(data))

export const insertFeedEvent = createServerFn({ method: 'POST' })
  .validator(workspaceSchema)
  .handler(({ data }) => reliabilityStore.insertEvent(data.workspace))

export const deleteNewestFeedEvent = createServerFn({ method: 'POST' })
  .validator(workspaceSchema)
  .handler(({ data }) => reliabilityStore.deleteNewestEvent(data.workspace))
