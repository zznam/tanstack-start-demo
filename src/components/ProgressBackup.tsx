import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { localDay } from '../utils/gamification'
import {
  backupFileName,
  createBackup,
  parseBackup,
} from '../utils/progressBackup'
import {
  readGameProgressRaw,
  replaceGameProgress,
} from '../utils/useGameProgress'
import {
  readLearningProgressRaw,
  replaceLearningProgress,
} from '../utils/useLearningProgress'

/**
 * Progress lives only in this browser, so offer a file to carry it to another browser or
 * keep it safe before clearing site data.
 */
export function ProgressBackup() {
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const download = () => {
    const today = localDay()
    const backup = createBackup(
      { learning: readLearningProgressRaw(), game: readGameProgressRaw() },
      new Date(),
      today,
    )
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName(today)
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: 'Backup downloaded.' })
  }

  const restore = async (file: File | undefined) => {
    if (!file) return
    const result = parseBackup(await file.text(), localDay())
    if (input.current) input.current.value = ''
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }
    const { topics, mastered, practiceDays } = result.value.summary
    if (
      !window.confirm(
        `Replace progress in this browser with ${topics} completed topics, ${mastered} mastered checks and ${practiceDays} practice days from the backup?`,
      )
    )
      return
    replaceLearningProgress(result.value.learningRaw)
    replaceGameProgress(result.value.gameRaw)
    setMessage({
      tone: 'ok',
      text: `Restored ${topics} topics and ${mastered} mastered checks.`,
    })
  }

  return (
    <div className="mt-4 border-t border-[var(--line)] pt-4">
      <p className="text-xs font-semibold demo-muted mb-2">Back up your progress</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="demo-button demo-button-secondary text-xs"
          onClick={download}
        >
          <Download className="size-4" />
          Download
        </button>
        <button
          type="button"
          className="demo-button demo-button-secondary text-xs"
          onClick={() => input.current?.click()}
        >
          <Upload className="size-4" />
          Restore
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Restore progress from a backup file"
          onChange={(event) => void restore(event.target.files?.[0])}
        />
      </div>
      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`text-xs mt-2 ${message.tone === 'error' ? 'text-red-600' : 'demo-muted'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
