import { LessonProgress } from '../components/LessonProgress'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Bot,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { FeatureBadge } from '../components/FeatureBadge'
import { CodeBlock } from '../components/CodeBlock'

export const Route = createFileRoute('/features/agent-dx')({
  component: AgentDxPage,
})

function AgentDxPage() {
  const [selectedScenario, setSelectedScenario] = useState<'refactor-param' | 'server-fn' | 'intent-skills'>('refactor-param')

  const scenarios = [
    {
      id: 'refactor-param' as const,
      title: '1. Refactoring Route Parameters',
      desc: 'When an AI agent modifies a route parameter name or type, what prevents silent breakages?',
      untyped: `// Next.js / Untyped Framework:
// app/posts/[postId]/page.tsx
export default function Page({ params }) {
  // If agent renames [postId] to [articleId], TypeScript won't catch
  // callsites using <Link href="/posts/\${item.postId}" />.
  // Runtime crashes in production!
  return <div>{params.postId}</div>
}`,
      start: `// TanStack Start 1.0:
// routes/posts.$articleId.tsx
export const Route = createFileRoute('/posts/$articleId')({
  loader: ({ params }) => {
    // 🛡️ TypeScript compiler error immediately fires at ANY callsite
    // still attempting to pass params={{ postId: ... }}
    return fetchArticle(params.articleId)
  },
})

// Call site:
<Link to="/posts/$articleId" params={{ articleId: '123' }} />`,
    },
    {
      id: 'server-fn' as const,
      title: '2. Modifying Server Function Inputs',
      desc: 'When an agent modifies the validation schema of a backend function.',
      untyped: `// Typical API route:
export async function POST(req: Request) {
  const body = await req.json()
  // No type contract between client and server!
  // Agent forgets a field in the frontend fetch body:
  // Fails silently or returns 500 at runtime.
}`,
      start: `// TanStack Start 1.0:
export const updateUserData = createServerFn({ method: 'POST' })
  .validator((d: { email: string; teamId: string }) => d)
  .handler(async ({ data }) => { ... })

// In UI:
// 🛡️ Agent gets red squiggly in editor if teamId is missing!
updateUserData({ data: { email: 'user@test.com', teamId: 'team_1' } })`,
    },
    {
      id: 'intent-skills' as const,
      title: '3. TanStack Intent (@tanstack/intent)',
      desc: 'Teaching coding agents framework best practices directly via npm package skills.',
      untyped: `// Pre-trained LLMs hallucinate obsolete patterns from 2022:
// - getInitialProps
// - Next 12 getServerSideProps
// - Outdated beta APIs that no longer exist.`,
      start: `// TanStack Intent:
// Agents run 'pnpm dlx @tanstack/intent list' and load skills
// shipped directly inside modern @tanstack/* npm packages.
// Agents get verified examples and current best practices directly!`,
    },
  ]

  const active = scenarios.find((s) => s.id === selectedScenario) ?? scenarios[0]

  return (
    <div className="demo-page">
      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FeatureBadge type="agent-dx" />
          <span className="text-xs font-mono text-[var(--sea-ink-soft)]">
            TanStack Intent & Agentic Architecture
          </span>
        </div>
        <h1 className="demo-title text-3xl sm:text-4xl font-extrabold mb-3">
          &ldquo;Then Agents Showed Up&rdquo;
        </h1>
        <p className="text-[var(--sea-ink-soft)] text-sm sm:text-base max-w-3xl leading-relaxed">
          &ldquo;An agent needs help: you ask for almost anything, and it will go change a route parameter or the input to a server function, and then it needs help finding the places that no longer agree with that change. The types can&apos;t tell you whether you&apos;ve built the right thing, but they can keep the changes sane.&rdquo;
          <span className="block mt-2 font-semibold text-[var(--sea-ink)]">
            — Tanner Linsley on Agentic Development with TanStack Start
          </span>
        </p>
      </div>

      {/* TanStack Intent Banner */}
      <div className="demo-panel mb-8 border-indigo-500/25 bg-indigo-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3 pb-3 border-b border-indigo-500/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--sea-ink)] m-0">
                TanStack Intent: Skills in npm Packages
              </h2>
              <span className="text-xs text-[var(--sea-ink-soft)]">
                Built by Sarah Gerrard, Kyle Mathews, and the TanStack Team
              </span>
            </div>
          </div>
          <a
            href="https://tanstack.com/intent"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Learn About Intent</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed mb-4">
          Knowing an API exists and knowing the best practices around it are very different things. TanStack ships skills right inside its npm packages. TanStack Intent can wire up discovery files so coding agents can query package skills. This page illustrates that optional workflow; this checkout does not contain generated agent discovery files. Consult the Intent documentation for the installed CLI version.
        </p>

        <div className="p-3 rounded-xl bg-[var(--surface-strong)] border border-[var(--line)] text-xs font-mono space-y-2">
          <div className="text-[var(--sea-ink-soft)] font-bold text-[10px] uppercase">
            Agent Terminal Commands:
          </div>
          <div className="text-emerald-700 dark:text-emerald-300">
            $ pnpm dlx @tanstack/intent list
          </div>
          <div className="text-emerald-700 dark:text-emerald-300">
            $ pnpm dlx @tanstack/intent load @tanstack/react-start#server-functions
          </div>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedScenario(s.id)}
            aria-pressed={selectedScenario === s.id}
            className={`flex-1 min-w-[220px] p-4 rounded-xl border text-left transition ${
              selectedScenario === s.id
                ? 'border-indigo-500 bg-[var(--surface-strong)] shadow-md ring-1 ring-indigo-500 text-[var(--sea-ink)] font-bold'
                : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--sea-ink-soft)]'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono mb-1">
              {s.id}
            </span>
            <h3 className="text-sm font-bold m-0">{s.title}</h3>
          </button>
        ))}
      </div>

      {/* Scenario Comparison View */}
      <div className="demo-panel mb-8">
        <h3 className="text-base font-bold text-[var(--sea-ink)] mb-1">{active.title}</h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mb-5">{active.desc}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loose / Untyped */}
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-red-700 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Without Compiler Guardrails</span>
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
              AI agents hallucinate strings or forget updated parameters, leading to silent production runtime crashes.
            </p>
            <CodeBlock code={active.untyped} title="Untyped Pattern" />
          </div>

          {/* TanStack Start 1.0 */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>With TanStack Start 1.0 Guardrails</span>
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
              TypeScript immediately forces the agent to fix every affected loader, component, and link before compile succeeds.
            </p>
            <CodeBlock code={active.start} title="TanStack Start 1.0" />
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="demo-panel">
        <h3 className="text-sm font-bold text-[var(--sea-ink)] mb-2">
          Why Humans & AI Agents Love TanStack Start 1.0
        </h3>
        <ul className="text-xs text-[var(--sea-ink-soft)] space-y-2 pl-4 m-0 list-disc">
          <li>
            <strong className="text-[var(--sea-ink)]">Zero Magic Exports:</strong> No hidden file-naming spells; functions like <code>createServerFn</code> and <code>createMiddleware</code> are standard, explicit TypeScript calls.
          </li>
          <li>
            <strong className="text-[var(--sea-ink)]">End-to-End Type Propagation:</strong> A single change in a server function validator propagates through middleware context, loaders, and React JSX props.
          </li>
          <li>
            <strong className="text-[var(--sea-ink)]">Ecosystem Freedom:</strong> Works identically whether deploying to Cloudflare Workers, Vercel, Netlify, Railway, or standard Docker containers with Nitro.
          </li>
        </ul>
      </div>
      <LessonProgress id="agent-dx" />
    </div>
  )
}
