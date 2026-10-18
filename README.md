# TanStack Start Feature Showcase

An interactive learning project for typed routing, server functions, middleware, isomorphic functions, selective SSR, and streamed data. Built with React, TanStack Start, Vite, Tailwind CSS, and Nitro's Node server preset.

Inspired by the [TanStack Start announcement](https://tanstack.com/blog/tanstack-start-1-0). The articles are sample data, and this demo is not a production content platform.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzznam%2Ftanstack-start-demo)

## Run locally

Use Node.js **22.18 or newer** and **pnpm 10.28.2**. Install dependencies from the lockfile before starting:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. For the production Node server:

```sh
pnpm build
pnpm start
```

The server defaults to port 3000; use `PORT=3001 pnpm start` to change it. `pnpm preview` also previews the generated Nitro bundle.

## Explore the demos

- `/features/routing`: validated URL search, categories, sorting, intent preloading, and interactive error/404 boundaries.
- `/features/routing/posts/1`: a real article detail route with server-backed likes and a back link that preserves search state. The filename's `routing_` keeps the detail page independent of the list component.
- `/features/server-functions`: create sample posts through validated POST server functions, update likes, and trigger an intentional server error.
- `/features/middleware`: client/server telemetry with an actual request ID, server processing interval, and browser round trip. The fixed identity token is an **authentication simulation**, not access control. Clock differences affect the displayed client/server timestamp delta.
- `/features/isomorphic`: compare a server function's server environment with a browser call to `createIsomorphicFn`. The browser call makes no RPC request.
- `/features/execution-modes`: compare route configurations. Open `/features/execution-modes/spa` for `ssr: false` or `/features/execution-modes/hybrid` for `ssr: 'data-only'`.
- `/features/streaming`: render the page shell while a separate 1500 ms simulated query resolves through `defer`, `Suspense`, and `Await`.
- `/features/server-context`: inspect the current request's URL and allowlisted headers. IP addresses are shown as unavailable when the adapter does not provide one; forwarded headers are not trusted automatically.
- `/features/agent-dx`: illustrative examples of type checking and the optional TanStack Intent workflow.
- `/about`: project and ecosystem background.

On the initial request, default SSR runs the loader and component on the server. `data-only` runs the loader there but renders the component in the browser. `ssr: false` runs both in the browser. **Later client navigations run route loaders in the browser**; `createServerFn` is the boundary that keeps server work on the server. Bot requests may wait for all deferred content instead of receiving the progressively streamed response a browser receives.

## Data and hosting limits

Post data is shared by visitors to a single server process, kept in memory, and capped at 100 posts. It resets on restart and is not synchronized between instances. Input lengths and whitespace are validated on the client and server. Use a database, authentication, and abuse controls before adapting mutations for real user data.

The runnable configuration targets Node/Nitro. Hosting examples describe options; they do not switch adapters or prove deployment compatibility. Browser theme choice survives reloads when storage is available and remains usable when storage is blocked. Production builds omit the developer-tools UI and stack-trace control.

## Validation

```sh
pnpm check       # regenerate routes, strict TypeScript, data regression tests
pnpm build       # production client and SSR bundles
pnpm exec playwright install chromium  # once, for browser tests
pnpm test:e2e    # production server on 127.0.0.1:3100; desktop and touch mobile
pnpm audit
```

`pnpm verify` runs the checks, build, and browser tests in sequence. Port 3100 must be free. Browser tests exercise page rendering, accessibility scans, search/detail navigation, create/like RPCs, middleware telemetry, request metadata, error states, themes with blocked storage, selective SSR response contents, and progressive streaming. Failures retain screenshots and traces under `test-results/`; the HTML report is in `playwright-report/`.

The targeted `postcss-selector-parser` override patches the parser used by Tailwind Typography. Keep it until Typography adopts a patched parser, then remove it and rerun the build and accessibility/browser checks.

## Source layout

- `src/routes/`: file-based routes; `src/routeTree.gen.ts` is generated.
- `src/utils/serverFns.ts`: server RPC entry points.
- `src/utils/postSchemas.ts`: shared form and URL validation.
- `src/utils/postStore.server.ts`: bounded demo store with independent snapshots.
- `src/utils/middleware.ts`: timing and simulated identity middleware.
- `src/components/`: shared shell, clipboard feedback, themes, and error views.
- `tests/`: data tests and production browser regressions.

TanStack Intent is optional. The Agent DX page illustrates its workflow; this checkout does not include generated `AGENTS.md` or `CLAUDE.md` integration files. Check the [Intent documentation](https://tanstack.com/intent) before configuring it for your agent.
