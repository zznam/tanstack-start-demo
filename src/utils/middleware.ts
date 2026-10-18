import { createMiddleware } from '@tanstack/react-start'

export interface TraceContext {
  clientStartTime?: number
  clientEndTime?: number | null
  requestId?: string
  serverReceivedTime?: number
  serverCompletedTime?: number
  serverProcessingTime?: number
  durationToServer?: number | null
  totalRoundtrip?: number | null
  serverPlatform?: string
  serverNodeVersion?: string
  authenticatedUser?: { id: string; role: string; name: string } | null
}

// Teaching example only: a fixed token is never real authentication.
export const authSimulationMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => next({
    sendContext: { clientAuthToken: 'bearer_demo_token_valid_2026' },
  }))
  .server(async ({ next, context }) => {
    const authenticatedUser = context.clientAuthToken === 'bearer_demo_token_valid_2026'
      ? { id: 'usr_start_10', role: 'architect', name: 'TanStack Explorer' }
      : null
    return next({ context: { authenticatedUser }, sendContext: { authenticatedUser } })
  })

export const timingMiddleware = createMiddleware({ type: 'function' })
  .middleware([authSimulationMiddleware])
  .client(async ({ next }) => {
    const clientStartTime = Date.now()
    const started = performance.now()
    const requestId = crypto.randomUUID()
    const res = await next({ sendContext: { clientStartTime, requestId } })
    // Completed context is available to outer middleware. Callers receive only
    // the handler payload and measure their own browser completion separately.
    return {
      ...res,
      context: { ...res.context, clientEndTime: Date.now(), totalRoundtrip: Math.round(performance.now() - started) },
    }
  })
  .server(async ({ next, context }) => {
    const serverReceivedTime = Date.now()
    // Client timestamps are untrusted and clocks may differ between machines.
    const clientStartTime: unknown = context.clientStartTime
    const durationToServer = typeof clientStartTime === 'number' && Number.isFinite(clientStartTime)
      ? serverReceivedTime - clientStartTime : null
    const started = performance.now()
    await new Promise((resolve) => setTimeout(resolve, 20))
    const telemetry = {
      serverReceivedTime,
      serverCompletedTime: Date.now(),
      serverProcessingTime: Math.round(performance.now() - started),
      durationToServer,
      serverPlatform: process.platform,
      serverNodeVersion: process.version,
    }
    return next({ context: telemetry, sendContext: telemetry })
  })
