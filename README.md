# TanStack Start Learning Lab

An interactive learning project with 15 topics, from typed routing and server functions to caching, optimistic concurrency, resilient parallel loading, idempotent mutations, cursor pagination, circuit breakers, and transactional event delivery. Built with React, TanStack Start, Vite, Tailwind CSS, and Nitro's Node server preset.

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

- `/`: searchable topic catalog with difficulty filters, estimated lesson times, prerequisites, completion controls, and a suggested next topic. Search, level, and hide-completed filters live in a validated URL so refresh, sharing, and browser history preserve the selection. Progress is versioned and saved only in this browser; blocked storage falls back to memory for the current visit. Corrupt progress is ignored. The Topics menu groups every lesson by level on desktop and mobile.
- `/gamification`: Learning Quest ties existing lesson completion to XP, levels, three quest tracks, and five achievement badges. Six knowledge checks offer explanations, lesson links, and a one-time 50 XP reward per check. A rotating three-check daily challenge offers first-attempt scoring, explanations, lesson review links, and replay without duplicate XP. Its in-progress round resets on navigation, reload, or local midnight. Save checks to a personal practice list and focus on reviews due today. Correct reviews return after 1, 3, 7, then 14 days; early or repeated practice does not advance the schedule, and a missed answer resets it to today without removing earned XP. Older mastered checks start due for review. A selectable 28-day calendar shows correct checks and lesson links for each date. Focus practice on all checks, saved checks, due reviews, unmastered checks, or checks not practiced today; answer feedback stays visible as the queue updates. Configurable daily and weekly goals, local-calendar streaks, a seven-day activity view, and a personal-best streak track distinct correct checks. Weekly missions run Monday–Sunday, count days with at least one correct check, and retain your chosen 3-, 5-, or 7-day target; practice history and personal bests cover the last 366 days. Existing saved progress is preserved. Rewards remain local to this browser, tolerate corrupt storage, sync between tabs, and fall back to memory when storage is blocked. Undoing lesson completion removes its XP; repeat answers never multiply rewards. Practice does not mark lessons complete.
- `/updates`: recent app changes with links to the affected lessons and source history.
- `/features/routing`: validated URL search, categories, sorting, intent preloading, and interactive error/404 boundaries.
- `/features/routing/posts/1`: a real article detail route with server-backed likes and a back link that preserves search state. The filename's `routing_` keeps the detail page independent of the list component.
- `/features/server-functions`: create sample posts through validated POST server functions, update likes, and trigger an intentional server error.
- `/features/middleware`: client/server telemetry with an actual request ID, server processing interval, and browser round trip. The fixed identity token is an **authentication simulation**, not access control. Clock differences affect the displayed client/server timestamp delta.
- `/features/isomorphic`: compare a server function's server environment with a browser call to `createIsomorphicFn`. The browser call makes no RPC request.
- `/features/execution-modes`: compare route configurations. Open `/features/execution-modes/spa` for `ssr: false` or `/features/execution-modes/hybrid` for `ssr: 'data-only'`.
- `/features/streaming`: render the page shell while a separate 1500 ms simulated query resolves through `defer`, `Suspense`, and `Await`.
- `/features/server-context`: inspect the current request's URL and allowlisted headers. IP addresses are shown as unavailable when the adapter does not provide one; forwarded headers are not trusted automatically.
- `/features/agent-dx`: illustrative examples of type checking and the optional TanStack Intent workflow.
- `/features/caching`: real Router loader caching with project-specific `loaderDeps`, a 60-second freshness window, server mutations that deliberately leave cached snapshots unchanged, and scoped invalidation. Switch projects to observe cache reuse, then revalidate to reconcile the loader snapshot with the server.
- `/features/optimistic`: optimistic task changes with 800 ms of simulated server latency, rejected-write rollback, a real competing server edit, and atomic version checks in the in-memory store. Transport errors block further writes until a fresh read resolves the uncertain outcome.
- `/features/parallel`: compare sequential and parallel server service calls with measured timing bars. `Promise.allSettled` preserves successful results during optional failures; a required catalog failure blocks the core dashboard. Requests start only when the experiment is run.
- `/features/idempotency`: reserve sample seats with a stable request key, replay the original receipt, reject key/payload conflicts, send concurrent duplicates, and recover after an actual commit followed by a simulated response error. The URL preserves the request key and quantity through reloads. An uncertain response locks quantity changes and new keys until the same request is retried.
- `/features/pagination`: read one changing server feed through offset and composite timestamp/ID cursors. Insert or delete newest events between pages to expose repeats and skipped rows. Cursor validation binds the position to a workspace and feed generation; restart recovers from invalid or expired cursors. Page-size changes restart traversal.
- `/features/resilience`: shipping quotes with bounded retries, a total deadline, a circuit breaker, and recovery probes. Five failure scenarios run on the server with a deterministic virtual clock; controls compare policy choices and the event trace explains each decision. No carrier API is called.
- `/features/outbox`: a $49 order-to-invoice workflow with direct publishing versus an atomic order/outbox commit. Six scenarios cover healthy delivery, producer rollback, post-commit crashes, acknowledgement loss, consumer rollback, and poison events. Toggle consumer deduplication to observe duplicate invoices. The model uses fresh in-memory snapshots in one invocation, not a database or queue.
- `/about`: project and ecosystem background.

On the initial request, default SSR runs the loader and component on the server. `data-only` runs the loader there but renders the component in the browser. `ssr: false` runs both in the browser. **Later client navigations run route loaders in the browser**; `createServerFn` is the boundary that keeps server work on the server. Bot requests may wait for all deferred content instead of receiving the progressively streamed response a browser receives.

## Data and hosting limits

Post data is shared by visitors to a single server process, kept in memory, and capped at 100 posts. It resets on restart and is not synchronized between instances. Input lengths and whitespace are validated on the client and server. Use a database, authentication, and abuse controls before adapting mutations for real user data.

Caching and optimistic labs use disposable workspaces named by a UUID in the URL. The server keeps at most 200 workspaces, removes entries after 30 minutes of inactivity, and evicts the least recently used entry at capacity. Reloads preserve a workspace while its server entry exists; restarting the server resets it. The URL is a demo identifier, not an authorization boundary: anyone with it can operate on the same sample data. Workspaces contain only seeded demo values. Reloading also creates a fresh browser Router cache. Real deployments need durable, appropriately scoped storage and database-level conditional writes for concurrency control.

Each advanced lesson includes prerequisites, executable controls, a source pattern, a practice challenge with a revealable explanation, and links to official documentation. Timing estimates describe learning time; service delays are explicitly simulated.

Every topic includes inline completion controls and a link to the next lesson. Completion updates the same browser-local progress and XP used by the catalog and Learning Quest, and can be undone. The navigation menu closes when the route changes, including keyboard navigation and browser history.

If browser storage becomes unavailable after progress has loaded, the app keeps its last known progress for the current visit. Unsaved work in that tab is protected from storage changes in other tabs, and completion controls display a temporary-save notice. A later successful edit saves that tab's progress again; while saving is blocked, reloads or closing the tab can lose unsaved changes. Normal cross-tab synchronization continues when storage is available. Article creation also preserves draft edits made while an earlier submission is still pending.

The idempotency and pagination pages offer isolated server walkthroughs for serverless hosting: each sequence runs against a fresh store within one invocation. They demonstrate concurrent duplicates, response-loss recovery, payload conflicts, and insertion/deletion pagination drift without claiming cross-request persistence. The live workspaces below them are intended for a single-process server. Mutations include the generation observed when loading the workspace; a different instance or expired workspace rejects the write before its side effect, and the UI pauses live writes. Cursor reads likewise reject a different generation. Production concurrency requires durable shared storage.

The live idempotency and pagination labs share a separate store capped at 100 disposable workspaces with the same 30-minute idle expiry and least-recently-used eviction. Each holds 20 sample seats (at most 20 successful receipts) and at most 40 feed events. Idempotency records last only as long as that workspace; they do not survive process restarts or coordinate multiple instances. The demo commits synchronously in one process; a real service needs a durable transaction, unique scoped keys, authenticated access, and a retention policy. Cursor encoding is not authorization. Keyset traversal uses immutable sort keys and does not provide a database snapshot or a database performance benchmark.

The runnable configuration targets Node/Nitro. Hosting examples describe options; they do not switch adapters or prove deployment compatibility. Browser theme choice survives reloads when storage is available and remains usable when storage is blocked. Production builds omit the developer-tools UI and stack-trace control.

## Validation

```sh
pnpm check       # regenerate routes, strict TypeScript, data regression tests
pnpm build       # production client and SSR bundles
pnpm exec playwright install chromium  # once, for browser tests
pnpm test:e2e    # production server on 127.0.0.1:3100; desktop and touch mobile
pnpm audit
```

`pnpm verify` runs the checks, build, and browser tests in sequence. Port 3100 must be free. Browser tests exercise page rendering, accessibility scans, search/detail navigation, create/like RPCs, middleware telemetry, request metadata, error states, themes with blocked storage, selective SSR response contents, progressive streaming, topic discovery and progress persistence, gamification rewards and undo, quiz feedback and one-time XP, daily goals and midnight rollover, challenge scoring/replays and keyboard flow, focused-practice queues and empty states, spaced-review scheduling and miss recovery, saved-check lists and cross-tab sync, 28-day history selection and lesson navigation, weekly goals and Monday rollover, saved-progress migration, cross-tab practice sync and blocked storage, cache reuse/invalidation, optimistic rollback and conflict recovery, uncertain transport failures, parallel service degradation, idempotent retries after lost responses, concurrent deduplication, cursor/offset drift during mutations, pagination recovery, shipping retry budgets, circuit transitions, scenario transport recovery, atomic outbox writes, acknowledgement-loss redelivery, consumer deduplication, and retained failed events. The all-pages check derives lesson routes from the catalog. Advanced pages are checked in dark mode and at 320, 768, 1280, and 1920 pixels. Failures retain screenshots and traces under `test-results/`; the HTML report is in `playwright-report/`.

Additional regressions cover lesson completion without returning to the catalog, keyboard/history menu dismissal, edits made during a pending article submission, and preserving existing progress when storage reads or writes fail mid-visit and another tab changes its saved data.

The targeted `postcss-selector-parser` override patches the parser used by Tailwind Typography. Keep it until Typography adopts a patched parser, then remove it and rerun the build and accessibility/browser checks.

## Source layout

- `src/routes/`: file-based routes; `src/routeTree.gen.ts` is generated.
- `src/utils/serverFns.ts`: server RPC entry points.
- `src/utils/postSchemas.ts`: shared form and URL validation.
- `src/utils/postStore.server.ts`: bounded demo store with independent snapshots.
- `src/utils/learningTopics.ts` and `useLearningProgress.ts`: shared curriculum, search, and local completion state.
- `src/components/LessonProgress.tsx` and `src/utils/browserProgressStore.ts`: shared lesson completion controls and resilient browser-local storage snapshots.
- `src/utils/gamification.ts` and `useGameProgress.ts`: knowledge checks, deterministic rewards, validated local practice history, daily challenges, focused practice, weekly missions, saved checks, spaced-review schedules, activity history, and browser subscriptions.
- `src/utils/labServerFns.ts` and `labStore.server.ts`: validated advanced RPCs and bounded workspace state.
- `src/utils/parallelLab.ts`: measured service orchestration, with an injectable clock for deterministic regression tests.
- `src/utils/reliabilityModels.ts`, `reliabilityServerFns.ts`, and `reliabilityStore.server.ts`: validated idempotency and pagination contracts, real server mutations, and bounded disposable storage.
- `src/utils/resilienceLab.server.ts` and `resilienceServerFns.ts`: bounded shipping-policy simulation and its validated server entry point. `ScenarioRunner` displays metrics and an expandable event trace.
- `src/utils/outboxLab.server.ts` and `outboxServerFns.ts`: atomic producer/consumer model, bounded relay attempts, and validated delivery scenarios. Production examples show the SQL transaction and unique-key requirements.
- `src/utils/catalogSearch.ts` and `recentChanges.ts`: shareable catalog filters and curated app updates.
- `src/utils/middleware.ts`: timing and simulated identity middleware.
- `src/components/`: shared shell, clipboard feedback, themes, and error views.
- `tests/`: data tests and production browser regressions.

TanStack Intent is optional. The Agent DX page illustrates its workflow; this checkout does not include generated `AGENTS.md` or `CLAUDE.md` integration files. Check the [Intent documentation](https://tanstack.com/intent) before configuring it for your agent.
