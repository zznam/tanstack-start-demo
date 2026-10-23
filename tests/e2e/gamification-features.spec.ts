import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { dailyChallenge, practiceQuestions } from '../../src/utils/gamification'

const storageKey = 'tanstack-learning-game-v1'
const day = '2026-10-23'

test('daily challenge scores first attempts, explains misses, and replays without duplicate rewards', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.clock.install({ time: new Date(`${day}T12:00:00`) })
  await page.goto('/gamification')
  const challenge = page.getByRole('region', {
    name: 'Daily challenge',
    exact: true,
  })
  await challenge.getByRole('button', { name: 'Start daily challenge' }).click()
  const questions = dailyChallenge(day)
  for (const [index, question] of questions.entries()) {
    await expect(
      challenge.getByRole('heading', {
        name: `Challenge check ${index + 1} of 3 · ${question.title}`,
      }),
    ).toBeFocused()
    const next = challenge.getByRole('button', {
      name: index === 2 ? 'See challenge results' : 'Next challenge check',
    })
    await expect(next).toBeDisabled()
    await challenge
      .getByRole('radio')
      .nth(index === 0 ? (question.answer + 1) % 3 : question.answer)
      .check()
    await challenge
      .getByRole('button', { name: 'Check answer', exact: true })
      .click()
    await expect(challenge.getByRole('radio').first()).toBeDisabled()
    await expect(
      challenge.getByRole('button', { name: 'Try again' }),
    ).toHaveCount(0)
    await next.click()
  }
  await expect(
    challenge.getByRole('heading', { name: 'Round complete · 2 / 3 correct' }),
  ).toBeFocused()
  await expect(
    challenge.getByText(`To review · ${questions[0].title}`, { exact: true }),
  ).toBeVisible()
  await expect(challenge.getByRole('link').first()).toHaveAttribute(
    'href',
    `/features/${questions[0].topic}`,
  )
  await expect(page.getByTestId('total-xp')).toHaveText('100 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('2 / 2 checks today')
  await challenge
    .getByRole('button', { name: 'Replay today’s challenge' })
    .click()
  for (const [index, question] of questions.entries()) {
    await challenge.getByRole('radio').nth(question.answer).check()
    await challenge
      .getByRole('button', { name: 'Check answer', exact: true })
      .click()
    await challenge
      .getByRole('button', {
        name: index === 2 ? 'See challenge results' : 'Next challenge check',
      })
      .click()
  }
  await expect(
    challenge.getByRole('heading', { name: 'Round complete · 3 / 3 correct' }),
  ).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('150 XP')
  await expect(page.getByTestId('daily-count')).toHaveText('3 / 2 checks today')
  await page.reload()
  await expect(
    challenge.getByRole('button', { name: 'Start daily challenge' }),
  ).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('150 XP')
  await expect(page.getByTestId('weekly-days')).toHaveText('1 / 3 active days')
  expect(errors).toEqual([])
})

test('focused practice keeps feedback visible, advances through remaining checks and handles empty queues', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(`${day}T12:00:00`) })
  await page.goto('/gamification')
  const practice = page.getByRole('region', {
    name: 'Knowledge checks',
    exact: true,
  })
  await practice
    .getByLabel('Practice focus', { exact: true })
    .selectOption('unmastered')
  for (const [index, question] of practiceQuestions.entries()) {
    await expect(
      practice.getByRole('group', { name: question.prompt }),
    ).toBeVisible()
    await practice.getByRole('radio').nth(question.answer).check()
    await practice
      .getByRole('button', { name: 'Check answer', exact: true })
      .click()
    await expect(practice.getByRole('status')).toContainText('Correct!')
    await expect(
      practice.getByText(`${5 - index} checks remaining in this focus`, {
        exact: true,
      }),
    ).toBeVisible()
    if (index < 5)
      await practice.getByRole('button', { name: 'Next check' }).click()
  }
  await expect(
    practice.getByRole('button', { name: 'Next check' }),
  ).toBeDisabled()
  await expect(page.getByTestId('total-xp')).toHaveText('300 XP')
  await practice
    .getByLabel('Practice focus', { exact: true })
    .selectOption('today')
  await expect(
    practice.getByRole('heading', { name: 'Nothing left in this focus' }),
  ).toBeVisible()
  await expect(practice.getByRole('radio')).toHaveCount(0)
  await page.clock.fastForward(24 * 60 * 60 * 1000)
  await expect(
    practice.getByText('6 checks remaining in this focus', { exact: true }),
  ).toBeVisible()
  await expect(practice.getByRole('radio')).toHaveCount(3)
  await practice
    .getByLabel('Practice focus', { exact: true })
    .selectOption('unmastered')
  await expect(
    practice.getByRole('heading', { name: 'Nothing left in this focus' }),
  ).toBeVisible()
  await practice.getByRole('button', { name: 'Practice all checks' }).click()
  await expect(
    practice.getByLabel('Practice focus', { exact: true }),
  ).toHaveValue('all')
  await expect(practice.getByRole('radio')).toHaveCount(3)
})

test('weekly missions migrate saved practice, sync goals and reset Monday while keeping personal best', async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date('2026-10-25T23:59:00') })
  await page.goto('/gamification')
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          dailyGoal: 1,
          mastered: ['url-state'],
          practiceDays: {
            '2026-10-21': ['url-state'],
            '2026-10-22': ['url-state', 'server-boundary'],
            '2026-10-23': ['url-state'],
            '2026-10-25': ['url-state'],
          },
        }),
      ),
    storageKey,
  )
  await page.reload()
  const mission = page.getByRole('region', { name: 'Your weekly mission' })
  await expect(page.getByTestId('weekly-days')).toHaveText('4 / 3 active days')
  await expect(mission).toContainText('Weekly mission complete!')
  await expect(mission).toContainText('5 correct checks')
  await expect(mission).toContainText('3-day personal best')
  await expect(page.getByLabel('Daily goal', { exact: true })).toHaveValue('1')
  const other = await context.newPage()
  await other.clock.install({ time: new Date('2026-10-25T23:59:00') })
  await other.goto('/gamification')
  await other.getByLabel('Weekly goal', { exact: true }).selectOption('5')
  await expect(page.getByTestId('weekly-days')).toHaveText('4 / 5 active days')
  await expect(mission).not.toContainText('Weekly mission complete!')
  await other.close()
  await page.reload()
  await expect(page.getByLabel('Weekly goal', { exact: true })).toHaveValue('5')
  await page.clock.fastForward(90_000)
  await expect(page.getByTestId('weekly-days')).toHaveText('0 / 5 active days')
  await expect(mission).toContainText('Oct 26 – Nov 1')
  await expect(mission).toContainText('3-day personal best')
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
})

test('challenge and weekly targets work with blocked storage and restart the round at midnight', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(`${day}T23:59:00`) })
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('blocked')
    }
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
  })
  await page.goto('/gamification')
  await page.getByLabel('Weekly goal', { exact: true }).selectOption('7')
  const challenge = page.getByRole('region', {
    name: 'Daily challenge',
    exact: true,
  })
  await challenge.getByRole('button', { name: 'Start daily challenge' }).click()
  await challenge.getByRole('radio').nth(dailyChallenge(day)[0].answer).check()
  await challenge
    .getByRole('button', { name: 'Check answer', exact: true })
    .click()
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
  await expect(page.getByTestId('weekly-days')).toHaveText('1 / 7 active days')
  await page.clock.fastForward(90_000)
  await expect(
    challenge.getByRole('button', { name: 'Start daily challenge' }),
  ).toBeVisible()
  await challenge.getByRole('button', { name: 'Start daily challenge' }).click()
  await expect(
    challenge.getByRole('heading', {
      name: `Challenge check 1 of 3 · ${dailyChallenge('2026-10-24')[0].title}`,
    }),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'All learning topics', exact: true })
    .click()
  await page.getByRole('link', { name: 'View XP & achievements' }).click()
  await expect(page.getByLabel('Weekly goal', { exact: true })).toHaveValue('7')
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP')
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`active challenge supports keyboard, accessibility and narrow layouts in ${colorScheme} mode`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.clock.install({ time: new Date(`${day}T12:00:00`) })
    await page.goto('/gamification')
    const challenge = page.getByRole('region', {
      name: 'Daily challenge',
      exact: true,
    })
    await challenge
      .getByRole('button', { name: 'Start daily challenge' })
      .focus()
    await page.keyboard.press('Enter')
    await expect(challenge.getByRole('heading', { level: 3 })).toBeFocused()
    await challenge.getByRole('radio').first().focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('Tab')
    await expect(
      challenge.getByRole('button', { name: 'Check answer', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(challenge.getByRole('status')).toContainText(
      /Correct|Not quite/,
    )
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
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
    }
    await page.setViewportSize({
      width: testInfo.project.name === 'mobile' ? 375 : 1440,
      height: 900,
    })
    await challenge.scrollIntoViewIfNeeded()
    await challenge.screenshot({
      path: testInfo.outputPath(`daily-challenge-${colorScheme}.png`),
    })
  })
}
