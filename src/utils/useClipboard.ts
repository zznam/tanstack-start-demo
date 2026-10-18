import { useEffect, useRef, useState } from 'react'

export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const copy = async (text: string) => {
    clearTimeout(timer.current)
    setCopied(false)
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(text)
      if (!active.current) return
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      if (active.current) setCopyError('Clipboard unavailable. Select and copy the text manually.')
    }
  }

  return { copied, copyError, copy }
}
