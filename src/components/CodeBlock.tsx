import { useClipboard } from '../utils/useClipboard'
import { Check, Copy } from 'lucide-react'

interface Props {
  code: string
  title?: string
  language?: string
}

export function CodeBlock({ code, title, language = 'typescript' }: Props) {
  const { copied, copyError, copy } = useClipboard()

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] my-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--header-bg)] px-4 py-2 text-xs font-mono text-[var(--sea-ink-soft)]">
        <span className="font-semibold text-[var(--sea-ink)]">{title || `${language}`}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          aria-label="Copy code to clipboard"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[var(--chip-bg)] transition text-[var(--sea-ink)]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <span role="status" className="sr-only">{copied ? 'Code copied' : copyError}</span>
      {copyError && <p className="px-4 text-xs" role="alert">{copyError}</p>}
      <pre tabIndex={0} aria-label={title || `${language} code`} className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-[var(--sea-ink)] leading-relaxed m-0">
        <code>{code}</code>
      </pre>
    </div>
  )
}
