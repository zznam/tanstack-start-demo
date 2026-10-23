import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const key = 'tanstack-learning-game-v1'

test('catalog progress powers quests, levels and badges, with cross-tab updates and undo', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page
    .getByRole('button', {
      name: 'Mark complete: Type-safe routing',
      exact: true,
    })
    .click()
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(
    page.getByRole('heading', { name: 'Learning Quest', exact: true }),
  ).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('100 XP')
  await expect(
    page.getByRole('article', { name: 'First step', exact: true }),
  ).toContainText('Earned')
  await expect(
    page.getByRole('progressbar', { name: 'Foundations quest progress' }),
  ).toHaveAttribute('value', '1')
  await page.getByRole('button', { name: 'Earned', exact: true }).click()
  await expect(
    page.getByRole('article', { name: 'First step', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('article', { name: 'Foundations explorer', exact: true }),
  ).toHaveCount(0)
  const other = await context.newPage()
  await other.goto('/')
  await other
    .getByRole('button', {
      name: 'Mark incomplete: Type-safe routing',
      exact: true,
    })
    .click()
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP')
  await expect(
    page
      .getByRole('region', { name: 'Achievements', exact: true })
      .getByRole('status'),
  ).toContainText('Your collection starts')
  for (const title of [
    'Caching & revalidation',
    'Optimistic updates & conflicts',
  ]) {
    await other
      .getByRole('button', { name: `Mark complete: ${title}`, exact: true })
      .click()
  }
  await expect(page.getByTestId('total-xp')).toHaveText('500 XP')
  await expect(
    page.getByRole('heading', { name: 'Level 2', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('progressbar', { name: 'Experience toward next level' }),
  ).toHaveAttribute('value', '0')
  await other.close()
  await page.reload()
  await expect(page.getByTestId('total-xp')).toHaveText('500 XP')
  await page
    .getByRole('article', { name: 'Build your foundation' })
    .getByRole('link', { name: 'Continue quest' })
    .click()
  await expect(page).toHaveURL(/features\/routing/)
})

test('knowledge checks explain mistakes, persist mastery and goals, and resist repeat rewards', async ({
  page,
  context,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/gamification')
  await expect(
    page.getByRole('button', { name: 'Check answer', exact: true }),
  ).toBeDisabled()
  await page
    .getByRole('radio', { name: 'Only in component state', exact: true })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Not quite')
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('0 / 2 checks today')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await page
    .getByRole('radio', {
      name: 'In validated URL search parameters',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(
    'Correct! +50 XP unlocked.',
  )
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('1 / 2 checks today')
  await expect(page.getByTestId('practice-streak')).toHaveText(
    '1-day practice streak',
  )
  await page.getByLabel('Daily goal', { exact: true }).selectOption('1')
  await expect(page.getByText('Goal reached!', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Daily goal', { exact: true })).toHaveValue('1')
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await page
    .getByRole('radio', {
      name: 'In validated URL search parameters',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('XP already earned')
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('1 / 1 checks today')
  const other = await context.newPage()
  await other.goto('/gamification')
  await other.getByLabel('Daily goal', { exact: true }).selectOption('3')
  await expect(page.getByLabel('Daily goal', { exact: true })).toHaveValue('3')
  await other.close()
  await page.getByRole('button', { name: 'Next check', exact: true }).click()
  await page
    .getByRole('radio', { name: 'Calling a server function', exact: true })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('100 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('2 / 3 checks today')
  await expect(
    page.getByRole('link', { name: 'Review lesson: Typed server functions' }),
  ).toHaveAttribute('href', '/features/server-functions')
  expect(errors).toEqual([])
})

test('all checks unlock the collection badge and daily count remains distinct', async ({
  page,
}) => {
  await page.goto('/gamification')
  for (const [index, answer] of [1, 0, 2, 1, 0, 2].entries()) {
    await page
      .getByLabel('Choose a check', { exact: true })
      .selectOption(String(index))
    await page.getByRole('radio').nth(answer).check()
    await page
      .getByRole('button', { name: 'Check answer', exact: true })
      .click()
  }
  await expect(page.getByTestId('total-xp')).toHaveText('300 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('6 / 2 checks today')
  await expect(
    page.getByRole('article', { name: 'Knowledge collector' }),
  ).toContainText('Earned')
  await page.reload()
  await expect(
    page.getByRole('article', { name: 'Knowledge collector' }),
  ).toContainText('Earned')
})

test('corrupt and blocked storage still allow practice during client navigation', async ({
  page,
}) => {
  await page.addInitScript(
    (storageKey) => localStorage.setItem(storageKey, '{broken'),
    key,
  )
  await page.goto('/gamification')
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP')
  await page.evaluate(() => {
    Storage.prototype.getItem = () => {
      throw new Error('blocked')
    }
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
  })
  await page
    .getByRole('radio', {
      name: 'In validated URL search parameters',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await expect(
    page.getByText(
      /Storage is unavailable: practice is saved for this visit only/,
    ),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'All learning topics', exact: true })
    .click()
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
})

test('practice rolls over at local midnight and rewards mastered questions only once', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-23T23:59:00') })
  await page.goto('/gamification')
  await page
    .getByRole('radio', {
      name: 'In validated URL search parameters',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByTestId('daily-count')).toHaveText('1 / 2 checks today')
  await page.clock.fastForward(90_000)
  await expect(page.getByTestId('daily-count')).toHaveText('0 / 2 checks today')
  await expect(page.getByTestId('practice-streak')).toHaveText(
    '1-day practice streak',
  )
  await page
    .getByRole('radio', {
      name: 'In validated URL search parameters',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Check answer', exact: true }).click()
  await expect(page.getByTestId('practice-streak')).toHaveText(
    '2-day practice streak',
  )
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Learning Quest is accessible and responsive in ${colorScheme} mode`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Toggle navigation menu' }).click()
    await page
      .locator('#topic-navigation')
      .getByRole('link', { name: 'Learning Quest', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Learning Quest', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Toggle navigation menu' }),
    ).toHaveAttribute('aria-expanded', 'false')
    await page
      .getByRole('radio', {
        name: 'In validated URL search parameters',
        exact: true,
      })
      .check()
    await page
      .getByRole('button', { name: 'Check answer', exact: true })
      .click()
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
    ).toEqual([])
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur()
      window.scrollTo(0, 0)
    })
    await page.screenshot({
      path: testInfo.outputPath(`learning-quest-${colorScheme}.png`),
      fullPage: true,
    })
    for (const width of [320, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `at ${width}px`,
      ).toBe(true)
    }
  })
}

test('knowledge checks work with keyboard selection and submission', async ({
  page,
}, testInfo) => {
  await page.goto('/gamification')
  const first = page.getByRole('radio', {
    name: 'Only in component state',
    exact: true,
  })
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('radio', {
      name: 'In validated URL search parameters',
      exact: true,
    }),
  ).toBeChecked()
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: 'Check answer', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('Correct!')
  await page.screenshot({ path: testInfo.outputPath('keyboard-practice.png') })
})
