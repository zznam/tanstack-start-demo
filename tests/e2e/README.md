# End-to-end verification

These tests run the production client and Nitro server together. Start with:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm verify
```

`verify` generates routes, checks TypeScript, runs the data tests, builds production assets, then executes every browser project. Keep port 3100 free: Playwright starts and stops its own server and refuses to reuse an existing process. Rebuild after changing application code; `test:e2e` alone uses the last build.

## Coverage map

| Area | Suites and user outcomes |
| --- | --- |
| Route rendering and accessibility | `showcase`: every catalog lesson, about/updates, article detail and execution-mode routes; WCAG A/AA scans, browser exceptions, overflow, dark mode, SSR and streaming |
| Navigation and articles | `shell-journeys`, `article-draft`, `lesson-navigation`: keyboard skip/menu navigation, URL/history filters, form validation, literal text rendering, pending draft edits, clipboard recovery, loader retry, theme synchronization |
| Catalog and lessons | `learning`, `lesson-navigation`: validated filters, completion, next-topic sequence, persistence and temporary-save notices |
| Rewards and practice | `gamification`, `gamification-features`, `gamification-review`, `learning-journeys`: quests, achievements, XP/undo, challenge scoring and targeted retry, keyboard interaction, focused/saved/due checks, review scheduling, goals, date rollovers and activity history |
| Browser storage | `progress-resilience` and learning suites: corrupt/blocked/quota-limited storage, mid-visit failures, cross-tab edits, migration and recovery |
| Cache, concurrency and parallel requests | `learning`, `lab-journeys`: stale snapshots, scoped invalidation, rejected and uncertain writes, committed-response loss, actual two-tab version conflicts, partial service failures and transport recovery |
| Idempotency and pagination | `reliability`, `lab-journeys`: stable retry keys, payload conflicts, concurrent duplicates, sold-out replay, generation guards, cursor/offset drift, exhausted/empty feeds, isolated serverless walkthroughs |
| Retry policies and event delivery | `resilience`, `outbox`: bounded retries/deadlines, circuit recovery, controls locked during requests, transport recovery, atomic producer/consumer transactions, redelivery, deduplication and poison events |

All suites run in Chromium desktop (1440×900), Chromium touch mobile (375×812), Firefox desktop and WebKit desktop. Individual accessibility/layout journeys also cover 320, 768, 1280 and 1920 pixel widths. Mobile is browser emulation, not a physical-device test.

## Focused feedback and reports

```sh
pnpm build
pnpm test:e2e:chromium
pnpm test:e2e tests/e2e/lab-journeys.spec.ts --project=firefox
pnpm test:e2e --grep 'failed article loader' --project=webkit
pnpm test:e2e:report
pnpm exec playwright show-trace test-results/<failed-test>/trace.zip
```

Failures retain screenshots, traces and accessibility snapshots under `test-results/`; `test-results/results.json` is machine-readable and `playwright-report/` contains the HTML report. CI runs each browser project in a separate job/server, uploads both directories for 14 days, allows one diagnostic retry, and still fails if a test only passes on retry. `test.only` is forbidden in CI.

## Test isolation and scope

- Each test receives fresh browser storage. Multi-tab tests intentionally share one browser context.
- Stateful labs use fresh UUID workspaces. Article tests create unique titles against the process-local store. One worker avoids ordering/timing interference in shared demo data and measured service scenarios.
- Browser actions exercise real loaders and server functions. Network interception is reserved for deliberate latency/failure cases; response-loss tests let the server commit before dropping the response.
- Clock-controlled journeys use deterministic local dates. Assertions wait on visible state/URLs rather than fixed sleep delays.
- Keyboard traversal uses Option+Tab on macOS WebKit, whose default Tab navigation skips links and buttons; other browsers and platforms use Tab. Focus and activation assertions remain the same.
- Clipboard failure/success tests replace only the browser clipboard method to avoid relying on host OS permissions. They verify the submitted code/URL and user feedback, not the operating-system clipboard.
- Tests verify the local Node deployment and in-memory models. They do not establish hosted/serverless deployment health, durable multi-instance storage, physical-device compatibility or complete accessibility conformance.

## Improvements selected from the coverage audit

Implemented: reliable loader retry, actionable empty/exhausted pagination states, direct practice from challenge results, and repeatable cross-browser CI with retained failure artifacts. Each addresses a concrete recovery or verification gap and has user-facing regression coverage.

Deferred ideas: downloadable progress backups, shareable practice-filter URLs and real-device smoke tests. These need broader product/storage or hosting decisions and are separate from the current local learning flows.
