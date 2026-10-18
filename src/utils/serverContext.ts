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
  const req = getRequest()
  const rawHeaders = getRequestHeaders()
  const ip = getRequestIP() ?? 'Unavailable (proxy headers are not trusted)'
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
    const val = rawHeaders.get(key)
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
    userAgent: rawHeaders.get('user-agent') ?? 'Unknown',
    acceptLanguage: rawHeaders.get('accept-language') ?? 'en',
    nitroPreset: process.env.NITRO_PRESET ?? (process.env.NODE_ENV === 'production' ? 'Nitro / Node server' : 'Nitro development server'),
    runtimePlatform: `${process.platform} (${process.arch}) Node ${process.version}`,
    headersSubset,
  }
})
