import { createServerFn } from '@tanstack/react-start'
import {
  getRequest,
  getRequestHeaders,
  getRequestIP,
  getRequestHost,
  getRequestProtocol,
} from '@tanstack/react-start/server'

export interface ServerRequestInfo {
  url: string
  method: string
  protocol: string
  host: string
  ip: string
  userAgent: string
  acceptLanguage: string
  nitroPreset: string
  runtimePlatform: string
  headersSubset: Record<string, string>
}

export const getServerRequestInfo = createServerFn({ method: 'GET' }).handler(async (): Promise<ServerRequestInfo> => {
  try {
    const req = getRequest()
    const rawHeaders = (getRequestHeaders() as unknown) as Record<string, string | undefined>
    const ip = getRequestIP() ?? '127.0.0.1'
    const host = getRequestHost() ?? 'localhost:3000'
    const protocol = getRequestProtocol() ?? 'http'

    // Pick notable headers to display safely
    const interestingKeys = [
      'user-agent',
      'accept',
      'accept-encoding',
      'accept-language',
      'sec-ch-ua',
      'sec-ch-ua-platform',
      'sec-fetch-mode',
      'sec-fetch-dest',
    ]

    const headersSubset: Record<string, string> = {}
    for (const key of interestingKeys) {
      const val = rawHeaders[key]
      if (val) {
        headersSubset[key] = String(val)
      }
    }

    return {
      url: req.url,
      method: req.method,
      protocol,
      host,
      ip,
      userAgent: rawHeaders['user-agent'] ?? 'Unknown',
      acceptLanguage: rawHeaders['accept-language'] ?? 'en',
      nitroPreset: process.env.NITRO_PRESET ?? 'nitro-dev / local',
      runtimePlatform: `${process.platform} (${process.arch}) Node ${process.version}`,
      headersSubset,
    }
  } catch (err: any) {
    return {
      url: 'http://localhost:3000',
      method: 'GET',
      protocol: 'http',
      host: 'localhost:3000',
      ip: '127.0.0.1',
      userAgent: 'Internal Server Function',
      acceptLanguage: 'en',
      nitroPreset: 'nitro-dev',
      runtimePlatform: `${process.platform} Node ${process.version}`,
      headersSubset: { status: 'Direct SSR invocation' },
    }
  }
})
