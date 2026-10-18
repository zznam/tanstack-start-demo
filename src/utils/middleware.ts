import { createMiddleware } from '@tanstack/react-start'

export interface TraceContext {
  clientStartTime?: number
  clientEndTime?: number
  requestId?: string
  clientUserAgent?: string
  serverReceivedTime?: number
  serverCompletedTime?: number
  serverProcessingTime?: number
  durationToServer?: number
  totalRoundtrip?: number
  serverPlatform?: string
  serverNodeVersion?: string
}

export const timingMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx) => {
    const clientStartTime = Date.now()
    const requestId = 'req_' + Math.random().toString(36).slice(2, 9)
    const clientUserAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/SSR'

    const res = await ctx.next({
      context: {
        clientStartTime,
        requestId,
        clientUserAgent,
      },
      sendContext: {
        clientStartTime,
        requestId,
        clientUserAgent,
      },
    })

    const clientEndTime = Date.now()
    const totalRoundtrip = clientEndTime - clientStartTime

    return {
      ...res,
      context: {
        ...res.context,
        clientStartTime,
        clientEndTime,
        requestId,
        totalRoundtrip,
      },
    }
  })
  .server(async (ctx) => {
    const serverReceivedTime = Date.now()
    const clientStart = ctx.context.clientStartTime ?? serverReceivedTime
    const durationToServer = serverReceivedTime - clientStart

    // Simulate standard server execution window (20ms)
    await new Promise((resolve) => setTimeout(resolve, 20))

    const serverCompletedTime = Date.now()
    const serverProcessingTime = serverCompletedTime - serverReceivedTime

    return ctx.next({
      sendContext: {
        serverReceivedTime,
        serverCompletedTime,
        serverProcessingTime,
        durationToServer,
        serverPlatform: process.platform,
        serverNodeVersion: process.version,
      },
    })
  })

export const authSimulationMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx) => {
    // Client attaches a demo simulated token
    const clientAuthToken = 'bearer_demo_token_valid_2026'

    return ctx.next({
      context: { clientAuthToken },
      sendContext: { clientAuthToken },
    })
  })
  .server(async (ctx) => {
    // Server inspects token from client context
    const token = ctx.context.clientAuthToken
    const isAuthenticated = token?.startsWith('bearer_')
    const user = isAuthenticated
      ? { id: 'usr_start_10', role: 'architect', name: 'TanStack Explorer' }
      : null

    return ctx.next({
      sendContext: {
        authenticatedUser: user,
      },
    })
  })
