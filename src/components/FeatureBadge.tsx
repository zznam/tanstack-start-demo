export type FeatureType =
  | 'ssr'
  | 'client'
  | 'server-fn'
  | 'middleware'
  | 'isomorphic'
  | 'streaming'
  | 'routing'
  | 'agent-dx'
  | 'nitro'

interface Props {
  type: FeatureType
  className?: string
}

const BADGE_CONFIG: Record<FeatureType, { label: string; bg: string; text: string; border: string }> = {
  ssr: {
    label: 'SSR Mode',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
  },
  client: {
    label: 'Client-Only',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
  },
  'server-fn': {
    label: 'createServerFn',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
  },
  middleware: {
    label: 'Full-Stack Middleware',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/30',
  },
  isomorphic: {
    label: 'createIsomorphicFn',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
  },
  streaming: {
    label: 'Streaming / defer()',
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/30',
  },
  routing: {
    label: 'Type-Safe Router',
    bg: 'bg-teal-500/10',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-500/30',
  },
  'agent-dx': {
    label: 'TanStack Intent / Agent DX',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
  },
  nitro: {
    label: 'Nitro Adapter',
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/30',
  },
}

export function FeatureBadge({ type, className = '' }: Props) {
  const config = BADGE_CONFIG[type] ?? BADGE_CONFIG.ssr

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {config.label}
    </span>
  )
}
