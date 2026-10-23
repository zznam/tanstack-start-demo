import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const storageKey = 'tanstack-learning-game-v1'
const day = '2026-10-23'

test('due reviews survive reload, advance at midnight, and recover from a miss without extra XP', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(`${day}T23:59:00`) })
  await page.goto('/gamification')
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          mastered: ['url-state'],
          dailyGoal: 1,
        }),
      ),
    storageKey,
  )
  await page.reload()
  const practice = page.getByRole('region', {
    name: 'Knowledge checks',
    exact: true,
  })
  await expect(practice).toContainText('1 due for review')
  await practice.getByRole('button', { name: 'Review due checks' }).click()
  await practice.getByRole('radio').nth(1).check()
  await practice
    .getByRole('button', { name: 'Check answer', exact: true })
    .click()
  await expect(practice.getByRole('status')).toContainText('XP already earned')
  await expect(practice).toContainText('Next review: 2026-10-24')
  await expect(practice).toContainText('0 due for review')
  await page.reload()
  await expect(practice).toContainText('Next review: 2026-10-24')
  await practice.getByRole('button', { name: 'Review due checks' }).click()
  await expect(
    practice.getByRole('heading', { name: 'Nothing left in this focus' }),
  ).toBeVisible()
  await page.clock.fastForward(90_000)
  await expect(practice).toContainText('1 due for review')
  await expect(practice.getByRole('radio')).toHaveCount(3)
  await practice.getByRole('button', { name: 'Review due checks' }).click()
  await practice.getByRole('radio').nth(1).check()
  await practice
    .getByRole('button', { name: 'Check answer', exact: true })
    .click()
  await expect(practice).toContainText('Next review: 2026-10-27')
  await practice.getByRole('button', { name: 'Try again' }).click()
  await practice.getByRole('radio').nth(0).check()
  await practice
    .getByRole('button', { name: 'Check answer', exact: true })
    .click()
  await expect(practice).toContainText('Review due today')
  await expect(practice).toContainText('1 due for review')
  await practice.getByRole('button', { name: 'Try again' }).click()
  await practice.getByRole('radio').nth(1).check()
  await practice
    .getByRole('button', { name: 'Check answer', exact: true })
    .click()
  await expect(practice).toContainText('Next review: 2026-10-25')
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('1 / 1 checks today')
})

test('saved checks persist, sync between tabs, and handle an empty list', async ({
  page,
  context,
}) => {
  await page.goto('/gamification')
  const practice = page.getByRole('region', {
    name: 'Knowledge checks',
    exact: true,
  })
  await practice.getByRole('button', { name: 'Practice saved checks' }).click()
  await expect(
    practice.getByRole('heading', { name: 'Nothing left in this focus' }),
  ).toBeVisible()
  await practice.getByRole('button', { name: 'Practice all checks' }).click()
  await practice
    .getByRole('button', { name: 'Save check', exact: true })
    .click()
  await expect(
    practice.getByRole('button', { name: 'Remove saved check' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await practice.getByRole('button', { name: 'Practice saved checks' }).click()
  await expect(practice.getByLabel('Choose a check')).toHaveValue('0')
  await expect(
    practice.getByLabel('Choose a check').locator('option'),
  ).toHaveCount(1)
  const other = await context.newPage()
  await other.goto('/gamification')
  await other.getByRole('button', { name: 'Remove saved check' }).click()
  await expect(
    practice.getByRole('heading', { name: 'Nothing left in this focus' }),
  ).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP')
  await other.close()
})

test('saved checks and review schedules remain usable when storage is blocked', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(`${day}T12:00:00`) })
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('blocked')
    }
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
  })
  await page.goto('/gamification')
  const practice = page.getByRole('region', {
    name: 'Knowledge checks',
    exact: true,
  })
  await practice
    .getByRole('button', { name: 'Save check', exact: true })
    .click()
  await practice.getByRole('radio').nth(1).check()
  await practice
    .getByRole('button', { name: 'Check answer', exact: true })
    .click()
  await page
    .getByRole('link', { name: 'All learning topics', exact: true })
    .click()
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(practice).toContainText('1 saved check')
  await expect(practice).toContainText('Next review: 2026-10-24')
  await expect(
    page.getByRole('region', { name: 'Your practice history' }),
  ).toContainText('1 active day · 1 correct check')
  await expect(
    page.getByText(
      /Storage is unavailable: practice is saved for this visit only/,
    ),
  ).toBeVisible()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`practice calendar supports keyboard selection, lesson navigation and narrow ${colorScheme} layouts`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.clock.install({ time: new Date(`${day}T12:00:00`) })
    await page.goto('/gamification')
    await page.evaluate(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            mastered: ['url-state'],
            saved: ['url-state'],
            practiceDays: {
              '2026-10-22': ['url-state'],
              '2026-10-23': ['server-boundary', 'url-state'],
            },
          }),
        ),
      storageKey,
    )
    await page.reload()
    const history = page.getByRole('region', { name: 'Your practice history' })
    await expect(history).toContainText(
      'Last 28 days · 2 active days · 3 correct checks',
    )
    await expect(history.getByRole('button')).toHaveCount(28)
    const yesterday = history.getByRole('button', {
      name: 'Thursday, October 22, 2026: 1 correct check',
      exact: true,
    })
    await yesterday.focus()
    await page.keyboard.press('Enter')
    await expect(yesterday).toHaveAttribute('aria-pressed', 'true')
    await expect(
      history.getByRole('heading', { name: 'Thursday, October 22, 2026' }),
    ).toBeVisible()
    await expect(
      history.getByRole('link', { name: 'Review lesson: Type-safe routing' }),
    ).toHaveAttribute('href', /^\/features\/routing(?:\?|$)/)
    await history
      .getByRole('button', {
        name: 'Wednesday, October 21, 2026: 0 correct checks',
        exact: true,
      })
      .click()
    await expect(history).toContainText(
      'No correct checks recorded for this day.',
    )
    await expect(history.getByRole('link')).toHaveCount(0)
    await yesterday.click()
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      })),
    ).toEqual([])
    for (const width of [320, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `at ${width}px`,
      ).toBe(true)
      const box = await yesterday.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await page.setViewportSize({
      width: testInfo.project.name === 'mobile' ? 375 : 1440,
      height: 1000,
    })
    await history.screenshot({
      path: testInfo.outputPath(`practice-history-${colorScheme}.png`),
    })
    await history
      .getByRole('link', { name: 'Review lesson: Type-safe routing' })
      .click()
    await expect(page).toHaveURL(/features\/routing/)
    expect(errors).toEqual([])
  })
}
