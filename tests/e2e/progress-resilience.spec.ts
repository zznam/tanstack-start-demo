import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const lessonKey = 'tanstack-learning-progress-v1'
const gameKey = 'tanstack-learning-game-v1'

async function loadExistingProgress(page: Page) {
  await page.goto('/')
  await page.evaluate(({ lessonKey, gameKey }) => {
    localStorage.setItem(lessonKey, JSON.stringify({ version: 1, completed: ['routing'] }))
    localStorage.setItem(gameKey, JSON.stringify({
      version: 1,
      mastered: ['url-state'],
      saved: ['safe-retry'],
      dailyGoal: 2,
      weeklyGoal: 3,
      practiceDays: {},
      reviews: {},
    }))
  }, { lessonKey, gameKey })
  await page.reload()
  await expect(page.getByRole('progressbar', { name: 'Learning progress' })).toHaveAttribute('value', '1')
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('150 XP')
}

test('existing lesson and practice progress survive storage becoming unreadable', async ({ page }) => {
  await loadExistingProgress(page)
  await page.evaluate(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage access revoked') }
    Storage.prototype.setItem = () => { throw new Error('Storage access revoked') }
  })
  await page.getByLabel('Daily goal', { exact: true }).selectOption('3')
  await expect(page.getByTestId('total-xp')).toHaveText('150 XP')
  await expect(page.getByText(/Storage is unavailable: practice is saved for this visit only/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Knowledge checks', exact: true })).toContainText('1 saved check')

  await page.getByRole('link', { name: 'All learning topics', exact: true }).click()
  await page.getByRole('button', { name: 'Mark complete: Caching & revalidation', exact: true }).click()
  await expect(page.getByRole('progressbar', { name: 'Learning progress' })).toHaveAttribute('value', '2')
  await expect(page.getByRole('button', { name: 'Mark incomplete: Type-safe routing', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('400 XP')
  await expect(page.getByLabel('Daily goal', { exact: true })).toHaveValue('3')
})

test('initial read failures recover stored progress before the first edit', async ({ page }) => {
  await page.addInitScript(({ lessonKey, gameKey }) => {
    localStorage.setItem(lessonKey, JSON.stringify({ version: 1, completed: ['routing'] }))
    localStorage.setItem(gameKey, JSON.stringify({
      version: 1,
      mastered: ['url-state'],
      saved: ['safe-retry'],
      dailyGoal: 2,
    }))
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('tanstack-learning-')) throw new Error('Temporarily unavailable')
      return getItem.call(this, key)
    }
    window.addEventListener('restore-progress-reads', () => {
      Storage.prototype.getItem = getItem
    }, { once: true })
  }, { lessonKey, gameKey })
  await page.goto('/gamification')
  await expect(page.getByText(/Storage is unavailable: practice is saved for this visit only/)).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP')
  await page.evaluate(() => window.dispatchEvent(new Event('restore-progress-reads')))
  await page.getByLabel('Daily goal', { exact: true }).selectOption('3')
  await expect(page.getByTestId('total-xp')).toHaveText('150 XP')
  await expect(page.getByRole('region', { name: 'Knowledge checks', exact: true })).toContainText('1 saved check')
  await page.getByRole('link', { name: 'All learning topics', exact: true }).click()
  await page.getByRole('button', { name: 'Mark complete: Caching & revalidation', exact: true }).click()
  await expect(page.getByRole('progressbar', { name: 'Learning progress' })).toHaveAttribute('value', '2')
  const stored = await page.evaluate(({ lessonKey, gameKey }) => ({
    lessons: JSON.parse(localStorage.getItem(lessonKey)!),
    game: JSON.parse(localStorage.getItem(gameKey)!),
  }), { lessonKey, gameKey })
  expect(stored.lessons.completed).toEqual(['routing', 'caching'])
  expect(stored.game.mastered).toEqual(['url-state'])
  expect(stored.game.saved).toEqual(['safe-retry'])
  expect(stored.game.dailyGoal).toBe(3)
})

test('cross-tab synchronization recovers after read-only storage failures', async ({ page, context }) => {
  await loadExistingProgress(page)
  await page.evaluate(() => {
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('tanstack-learning-')) throw new Error('Temporarily unavailable')
      return getItem.call(this, key)
    }
    window.addEventListener('restore-progress-reads', () => {
      Storage.prototype.getItem = getItem
    }, { once: true })
  })
  const other = await context.newPage()
  await other.goto('/')
  await other.evaluate(({ lessonKey, gameKey }) => {
    localStorage.setItem(lessonKey, JSON.stringify({ version: 1, completed: ['parallel'] }))
    localStorage.setItem(gameKey, JSON.stringify({ version: 1, mastered: ['server-boundary'], dailyGoal: 1 }))
  }, { lessonKey, gameKey })
  await expect(page.getByText(/Storage is unavailable: practice is saved for this visit only/)).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('150 XP')
  await page.evaluate(() => window.dispatchEvent(new Event('restore-progress-reads')))
  await other.evaluate(({ lessonKey, gameKey }) => {
    localStorage.setItem(lessonKey, JSON.stringify({ version: 1, completed: ['parallel', 'caching'] }))
    localStorage.setItem(gameKey, JSON.stringify({ version: 1, mastered: ['server-boundary', 'safe-retry'], dailyGoal: 3 }))
  }, { lessonKey, gameKey })
  await expect(page.getByTestId('total-xp')).toHaveText('600 XP')
  await expect(page.getByLabel('Daily goal', { exact: true })).toHaveValue('3')
  await expect(page.getByText(/Storage is unavailable: practice is saved for this visit only/)).toHaveCount(0)
  await other.close()
})

test('quota fallback survives external writes and clears, then resumes durable saves', async ({ page, context }) => {
  await loadExistingProgress(page)
  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem
    window.addEventListener('restore-progress-writes', () => {
      Storage.prototype.setItem = setItem
    }, { once: true })
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('tanstack-learning-')) throw new DOMException('Quota reached', 'QuotaExceededError')
      setItem.call(this, key, value)
    }
  })
  await page.getByLabel('Daily goal', { exact: true }).selectOption('3')
  await page.getByRole('link', { name: 'All learning topics', exact: true }).click()
  await page.getByRole('button', { name: 'Mark complete: Caching & revalidation', exact: true }).click()
  await expect(page.getByRole('progressbar', { name: 'Learning progress' })).toHaveAttribute('value', '2')

  const other = await context.newPage()
  await other.goto('/')
  // Wait for real events before checking that this tab retained unsaved work.
  await page.evaluate(() => {
    document.body.dataset.progressStorageEvents = '0'
    window.addEventListener('storage', () => {
      document.body.dataset.progressStorageEvents = String(Number(document.body.dataset.progressStorageEvents) + 1)
    })
  })
  await other.evaluate(({ lessonKey, gameKey }) => {
    localStorage.setItem(lessonKey, JSON.stringify({ version: 1, completed: ['parallel'] }))
    localStorage.setItem(gameKey, JSON.stringify({ version: 1, mastered: [], dailyGoal: 1 }))
  }, { lessonKey, gameKey })
  await expect(page.locator('body')).toHaveAttribute('data-progress-storage-events', '2')
  await expect(page.getByRole('progressbar', { name: 'Learning progress' })).toHaveAttribute('value', '2')
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('400 XP')
  await expect(page.getByLabel('Daily goal', { exact: true })).toHaveValue('3')
  await expect(page.getByRole('region', { name: 'Knowledge checks', exact: true })).toContainText('1 saved check')

  await other.evaluate(() => localStorage.clear())
  await expect(page.locator('body')).toHaveAttribute('data-progress-storage-events', '3')
  await expect(page.getByTestId('total-xp')).toHaveText('400 XP')

  await page.evaluate(() => window.dispatchEvent(new Event('restore-progress-writes')))
  await page.getByLabel('Daily goal', { exact: true }).selectOption('2')
  await expect(page.getByText(/Storage is unavailable: practice is saved for this visit only/)).toHaveCount(0)
  await page.getByRole('link', { name: 'All learning topics', exact: true }).click()
  await page.getByRole('button', { name: 'Mark complete: Optimistic updates & conflicts', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('progressbar', { name: 'Learning progress' })).toHaveAttribute('value', '3')
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('650 XP')
  await expect(page.getByRole('region', { name: 'Knowledge checks', exact: true })).toContainText('1 saved check')
  await other.close()
})

test('an unchanged answer still reports a failed save', async ({ page }) => {
  await page.goto('/gamification')
  const practice = page.getByRole('region', { name: 'Knowledge checks', exact: true })
  await practice.getByRole('radio', { name: 'In validated URL search parameters', exact: true }).check()
  await practice.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await practice.getByRole('button', { name: 'Try again', exact: true }).click()
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Quota reached', 'QuotaExceededError') }
  })
  await practice.getByRole('radio', { name: 'In validated URL search parameters', exact: true }).check()
  await practice.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await expect(page.getByText(/Storage is unavailable: practice is saved for this visit only/)).toBeVisible()
})
