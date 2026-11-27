import { parseGameProgress } from './gamification.ts'
import type { GameProgress } from './gamification.ts'
import { parseProgress } from './learningTopics.ts'
import type { TopicId } from './learningTopics.ts'

export const BACKUP_APP = 'tanstack-start-learning-lab'
export const BACKUP_VERSION = 1

export type ProgressBackup = {
  app: typeof BACKUP_APP
  version: typeof BACKUP_VERSION
  exportedAt: string
  learning: { version: 1; completed: TopicId[] }
  game: GameProgress
}

export type RestoredProgress = {
  /** Values ready to write back to each browser store. */
  learningRaw: string
  gameRaw: string
  summary: { topics: number; mastered: number; practiceDays: number }
}

/**
 * Bundles both browser stores into one file. Each part is re-parsed first, so corrupt
 * or unknown entries never reach the backup.
 */
export function createBackup(
  stored: { learning: string; game: string },
  now: Date,
  today: string,
): ProgressBackup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    learning: { version: 1, completed: parseProgress(stored.learning) },
    game: parseGameProgress(stored.game, today),
  }
}

export function backupFileName(today: string) {
  return `tanstack-learning-progress-${today}.json`
}

/**
 * Validates an uploaded backup. Rejects files from other apps or future versions outright;
 * inside a valid file, unknown topics, questions and out-of-range days are dropped by the
 * same parsers the app uses for its own storage.
 */
export function parseBackup(
  text: string,
  today: string,
): { ok: true; value: RestoredProgress } | { ok: false; error: string } {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { ok: false, error: 'This file is not a progress backup.' }
  const data = value as Record<string, unknown>
  if (data.app !== BACKUP_APP)
    return { ok: false, error: 'This file is not a progress backup.' }
  if (data.version !== BACKUP_VERSION)
    return {
      ok: false,
      error: 'This backup was made by a different version of the lab.',
    }
  const completed = parseProgress(JSON.stringify(data.learning ?? null))
  const game = parseGameProgress(JSON.stringify(data.game ?? null), today)
  return {
    ok: true,
    value: {
      learningRaw: JSON.stringify({ version: 1, completed }),
      gameRaw: JSON.stringify(game),
      summary: {
        topics: completed.length,
        mastered: game.mastered.length,
        practiceDays: Object.keys(game.practiceDays).length,
      },
    },
  }
}
