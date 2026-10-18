import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

/**
 * Tanner Linsley's exact code snippet from https://tanstack.com/blog/tanstack-start-1-0:
 * "One small example of what I mean by explicit APIs is createIsomorphicFn.
 *  Say you need the current origin to build an absolute URL.
 *  On the server that comes from the incoming request, in the browser it comes from window.location,
 *  and you can put those two implementations right next to each other."
 */
export const getOrigin = createIsomorphicFn()
  .server(() => {
    try {
      const req = getRequest()
      return new URL(req.url).origin
    } catch {
      return 'http://localhost:3000'
    }
  })
  .client(() => {
    return window.location.origin
  })

export interface EnvironmentInfo {
  environment: 'server' | 'client'
  description: string
  details: Record<string, string | number | boolean>
}

export const getEnvironmentInfo = createIsomorphicFn()
  .server((): EnvironmentInfo => {
    return {
      environment: 'server',
      description: 'Executed in Nitro / Node SSR server runtime before HTML hydration.',
      details: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        isServerSide: true,
        runtime: 'Nitro Engine (Vite + SSR)',
      },
    }
  })
  .client((): EnvironmentInfo => {
    return {
      environment: 'client',
      description: 'Executed directly in the browser DOM engine without triggering a network request.',
      details: {
        screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
        screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
        pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isServerSide: false,
      },
    }
  })
