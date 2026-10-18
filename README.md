# TanStack Start 1.0 Feature Showcase

A comprehensive, production-grade demonstration project built in `~/workspace/tanstack-start-demo` showcasing every core architectural primitive and feature announced in Tanner Linsley's milestone release post:

🔗 **[TanStack Start 1.0 is Stable](https://tanstack.com/blog/tanstack-start-1-0)** (October 2026)

---

## ⚡ Quick Start

```bash
# 1. Navigate to the project directory
cd ~/workspace/tanstack-start-demo

# 2. Run the development server
pnpm dev

# 3. Or build and preview the production SSR Nitro bundle
pnpm build
pnpm preview
```

The application runs on `http://localhost:3000` (or `http://localhost:3001` in preview mode).

---

## 🧭 Feature Matrix & Architecture Map

This project provides an interactive, inspectable UI and working code for every major feature in the TanStack Start 1.0 release:

| Blog Feature Section | Source Code File | Route Path | Description |
|---|---|---|---|
| **Start started with a router** | `src/routes/features.routing.tsx` | `/features/routing` | Type-safe route params (`$postId`), Zod search schema validation (`validateSearch`), link preloading (`preload="intent"`), and error boundaries. |
| **Dynamic Routing** | `src/routes/features.routing.posts.$postId.tsx` | `/features/routing/posts/$postId` | Parameter extraction (`params.postId`), automatic type inference, `notFound()` handling, and in-memory server mutations. |
| **I wanted another option** | `src/routes/features.execution-modes.tsx` | `/features/execution-modes` | Flexible route execution choices: Full SSR, Client-Only (`ssr: false` / SPA mode), and Hybrid Server Loader + Client Component rendering. |
| **Typed Server Functions** | `src/routes/features.server-functions.tsx` | `/features/server-functions` | `createServerFn` with GET/POST methods, Zod schema validation, loader calls, client RPC calls, and error serialization. |
| **Full-Stack Middleware** | `src/routes/features.middleware.tsx` | `/features/middleware` | `createMiddleware({ type: 'function' })` crossing client and server boundaries with type-safe `sendContext` and live latency tracing. |
| **Choosing where code runs** | `src/routes/features.isomorphic.tsx` | `/features/isomorphic` | Recreates Tanner's exact `createIsomorphicFn().server(...).client(...)` snippet with compiler dead-code elimination and tree-shaking. |
| **Streaming Responses** | `src/routes/features.streaming.tsx` | `/features/streaming` | Fast initial shell delivery with progressive chunked streaming of deferred promises using `defer()`, `<Suspense>`, and `<Await>`. |
| **Freedom takes work (Nitro)** | `src/routes/features.server-context.tsx` | `/features/server-context` | Real HTTP request inspection with `@tanstack/react-start/server` (`getRequest`, headers, IP) across Nitro adapters (Cloudflare, Vercel, Node). |
| **Then agents showed up** | `src/routes/features.agent-dx.tsx` | `/features/agent-dx` | Explains why strict compiler types and TanStack Intent (`@tanstack/intent`) make Start the optimal stack for AI agent pairing. |
| **Ecosystem Partners** | `src/routes/about.tsx` | `/about` | Overview of partners betting on Start 1.0 (Cloudflare, Render, Netlify, CodeRabbit, Lovable, Vercel, Railway, Clerk, WorkOS, Prisma). |

---

## 🛠️ Technology Stack

- **Framework**: `@tanstack/react-start` (`1.169.3`)
- **Router**: `@tanstack/react-router` (`1.170.45`)
- **UI Library**: `react` & `react-dom` (`19.2.0`)
- **Server Engine**: `nitro` (`3.0`)
- **Bundler**: `vite` (`8.0`) + `@vitejs/plugin-react`
- **Validation**: `zod` (`4.x`)
- **Styling**: `tailwindcss` (`4.1`)
- **Icons**: `lucide-react`
- **Agent Skill Integration**: `@tanstack/intent`

---

## 💡 Key Architectural Concepts

### 1. Explicit Isomorphic Functions (`createIsomorphicFn`)
```ts
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const getOrigin = createIsomorphicFn()
  .server(() => new URL(getRequest().url).origin)
  .client(() => window.location.origin)
```
- On the server, `getOrigin()` reads the incoming request URL.
- In the browser, `getOrigin()` reads `window.location.origin` without making any network request.
- The compiler strips the server implementation from client bundles and the client implementation from server bundles.

### 2. Full-Stack Middleware (`createMiddleware`)
```ts
export const timingMiddleware = createMiddleware({ type: 'function' })
  .client(async (ctx) => {
    const clientStartTime = Date.now()
    // sendContext passes variables over the wire to the server!
    const res = await ctx.next({ sendContext: { clientStartTime } })
    return { ...res, context: { totalRoundtrip: Date.now() - clientStartTime } }
  })
  .server(async (ctx) => {
    // Server receives clientStartTime from context!
    const serverReceivedTime = Date.now()
    const durationToServer = serverReceivedTime - ctx.context.clientStartTime
    return ctx.next({ sendContext: { serverReceivedTime, durationToServer } })
  })
```

### 3. Progressive Streaming (`defer` & `<Await>`)
```tsx
export const Route = createFileRoute('/streaming')({
  loader: async () => ({
    fastMetadata: { status: 'instant' },
    deferredSlowData: defer(slowBackendQuery()), // Streams over HTTP!
  }),
  component: () => {
    const { fastMetadata, deferredSlowData } = Route.useLoaderData()
    return (
      <Suspense fallback={<p>Streaming chunk from server...</p>}>
        <Await promise={deferredSlowData}>
          {(data) => <ResolvedWidget data={data} />}
        </Await>
      </Suspense>
    )
  },
})
```

---

## 🤖 TanStack Intent for Coding Agents

This project has TanStack Intent configured (`AGENTS.md` / `CLAUDE.md`). Agents can query current framework best practices on-demand:
```bash
# List available skills across installed npm packages
pnpm dlx @tanstack/intent list

# Load a specific skill on-demand
pnpm dlx @tanstack/intent load @tanstack/react-start#server-functions
```

---

## 🧪 Verification & Type Checking

To verify strict TypeScript compilation across the entire project:
```bash
pnpm tsc --noEmit
```

To run a clean production build:
```bash
pnpm build
```
