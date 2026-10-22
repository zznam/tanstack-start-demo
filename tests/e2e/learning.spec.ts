import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const workspace = () => crypto.randomUUID()

test('catalog URLs preserve filters through reload, sharing and browser history', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Search learning topics' }).fill('versioning')
  await page.getByRole('button', { name: /^Advanced/ }).click()
  await page.getByLabel('Hide completed').check()
  await expect(page).toHaveURL(/incomplete=true/)
  const sharedUrl = page.url()
  await page.reload()
  await expect(page.getByRole('searchbox')).toHaveValue('versioning')
  await expect(page.getByLabel('Hide completed')).toBeChecked()
  await expect(page.locator('#topics article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Reset topic filters' }).click()
  await expect(page.locator('#topics article')).toHaveCount(14)
  await page.goBack()
  await expect(page.getByRole('searchbox')).toHaveValue('versioning')
  await expect(page.getByLabel('Hide completed')).toBeChecked()
  const shared = await context.newPage()
  await shared.goto(sharedUrl)
  await expect(shared.locator('#topics article')).toHaveCount(1)
  await shared.close()
  await page.goto('/?q=%5B1%5D&level=Expert&incomplete=invalid')
  await expect(page.locator('#topics article')).toHaveCount(14)
})

test('recent changes connect to working lessons from the navigation menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click()
  await page.locator('#topic-navigation').getByRole('link', { name: 'What’s new' }).click()
  await expect(page.getByRole('heading', { name: 'What’s new in the lab' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Recent app updates' }).locator(':scope > li')).toHaveCount(5)
  await page.getByRole('link', { name: 'Caching & revalidation', exact: true }).click()
  await expect(page.getByTestId('cache-loader')).toContainText('Revision 1')
})

test('catalog filters, progress and next step survive reload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('#topics article')).toHaveCount(14)
  await page.getByRole('button', { name: /^Advanced/ }).click()
  await expect(page.locator('#topics article')).toHaveCount(6)
  await page
    .getByRole('searchbox', { name: 'Search learning topics' })
    .fill('versioning')
  await expect(page.locator('#topics article')).toHaveCount(1)
  await page
    .getByRole('button', {
      name: 'Mark complete: Optimistic updates & conflicts',
      exact: true,
    })
    .click()
  await page.getByLabel('Hide completed').check()
  await expect(
    page.getByText('No matching topics', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Reset topic filters' }).click()
  await expect(page.locator('#topics article')).toHaveCount(14)
  await page.reload()
  await expect(
    page.getByRole('button', {
      name: 'Mark incomplete: Optimistic updates & conflicts',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('progressbar', { name: 'Learning progress' }),
  ).toHaveAttribute('value', '1')
  await page.getByRole('button', { name: 'Jump to advanced labs' }).click()
  await expect(page.locator('#topics article')).toHaveCount(6)
  await page.locator('#topics a[href="/features/parallel"]').click()
  await page
    .getByRole('button', { name: 'Mark as complete', exact: true })
    .click()
  await page.getByRole('link', { name: 'All learning topics' }).click()
  await expect(
    page.getByRole('progressbar', { name: 'Learning progress' }),
  ).toHaveAttribute('value', '2')
})

test('progress tolerates malformed and blocked storage', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() =>
    localStorage.setItem(
      'tanstack-learning-progress-v1',
      '{"version":1,"completed":{}}',
    ),
  )
  await page.goto('/')
  await expect(
    page.getByRole('progressbar', { name: 'Learning progress' }),
  ).toHaveAttribute('value', '0')
  await page.evaluate(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage blocked')
    }
    Storage.prototype.setItem = () => {
      throw new Error('Storage blocked')
    }
  })
  await page
    .getByRole('button', {
      name: 'Mark complete: Type-safe routing',
      exact: true,
    })
    .click()
  await expect(
    page.getByRole('progressbar', { name: 'Learning progress' }),
  ).toHaveAttribute('value', '1')
  await page
    .getByRole('link', { name: 'Continue learning', exact: true })
    .click()
  await expect(page.locator('main h1')).toContainText(
    'Flexible Route Execution Modes',
  )
  expect(errors).toEqual([])
})

test('cache snapshots stay stale after a write until invalidated; keys are independent', async ({
  page,
}) => {
  const id = workspace()
  await page.goto(`/features/caching?workspace=${id}&project=frontend`)
  const snapshot = page.getByTestId('cache-loader')
  await expect(snapshot).toContainText('Revision 1')
  await page
    .getByRole('button', { name: 'Publish build without invalidation' })
    .click()
  await expect(page.getByTestId('cache-server')).toContainText('Revision 2')
  await expect(snapshot).toContainText('Revision 1')
  await page.getByRole('link', { name: 'Backend project', exact: true }).click()
  await expect(snapshot).toContainText('7 builds')
  await page
    .getByRole('link', { name: 'Frontend project', exact: true })
    .click()
  await expect(snapshot).toContainText('Revision 1')
  await expect(snapshot).toContainText('Server read #1')
  await page.getByRole('button', { name: 'Revalidate loader' }).click()
  await expect(snapshot).toContainText('Revision 2')
  await expect(snapshot).toContainText('13 builds')
  await expect(snapshot).toContainText('Server read #2')
  await page.reload()
  await expect(snapshot).toContainText('Revision 2')
})

test('optimistic changes confirm, roll back and reconcile conflicting server versions', async ({
  page,
}) => {
  await page.goto(`/features/optimistic?workspace=${workspace()}`)
  const toggle = page.getByRole('button', { name: 'Toggle task', exact: true })
  const visible = page.getByTestId('optimistic-visible')
  const confirmed = page.getByTestId('optimistic-confirmed')
  await toggle.click()
  await expect(visible).toHaveText('Complete')
  await expect(confirmed).toHaveText('Incomplete (v1)')
  await expect(confirmed).toHaveText('Complete (v2)')
  await page.getByLabel('Reject the next write on the server').check()
  await toggle.click()
  await expect(visible).toHaveText('Incomplete')
  await expect(
    page.getByRole('status').filter({ hasText: 'Write rejected' }),
  ).toBeVisible()
  await expect(visible).toHaveText('Complete')
  await page
    .getByRole('button', { name: 'Simulate another client edit' })
    .click()
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Another client saved version 3' }),
  ).toBeVisible()
  await toggle.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Version conflict' }),
  ).toBeVisible()
  await expect(confirmed).toHaveText('Incomplete (v3)')
  await page.reload()
  await expect(confirmed).toHaveText('Incomplete (v3)')
})

test('uncertain transport failures require reconciliation before another optimistic write', async ({
  page,
}) => {
  await page.goto(`/features/optimistic?workspace=${workspace()}`)
  await page.route('**/_serverFn/**', (route) => route.abort())
  const toggle = page.getByRole('button', { name: 'Toggle task', exact: true })
  await toggle.click()
  await expect(page.getByRole('alert')).toContainText(
    'server may have received the write',
  )
  await expect(page.getByTestId('optimistic-visible')).toHaveText('Incomplete')
  await expect(toggle).toBeDisabled()
  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Load latest version' }).click()
  await expect(toggle).toBeEnabled()
})

test('parallel loading measures real service timings and isolates optional failures', async ({
  page,
}) => {
  await page.goto('/features/parallel')
  const run = page.getByRole('button', {
    name: 'Run loading experiment',
    exact: true,
  })
  await page.getByLabel('Loading strategy').selectOption('sequential')
  await run.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Sequential run finished' }),
  ).toBeVisible()
  const sequentialMs = Number(
    (await page.getByTestId('parallel-duration').innerText()).match(/\d+/)![0],
  )
  await page.getByLabel('Loading strategy').selectOption('parallel')
  await page.getByLabel('Service failure').selectOption('recommendations')
  await run.click()
  await expect(
    page.getByRole('heading', {
      name: 'Dashboard ready with a fallback',
      exact: true,
    }),
  ).toBeVisible()
  const parallelMs = Number(
    (await page.getByTestId('parallel-duration').innerText()).match(/\d+/)![0],
  )
  expect(sequentialMs).toBeGreaterThan(parallelMs + 200)
  await expect(
    page.getByRole('region', { name: 'Dashboard result' }),
  ).toContainText('12 products ready to browse')
  await expect(
    page.getByRole('region', { name: 'Dashboard result' }),
  ).toContainText('Suggestions are unavailable')
  await page.getByLabel('Service failure').selectOption('catalog')
  await run.click()
  await expect(
    page.getByRole('heading', { name: 'Core dashboard unavailable' }),
  ).toBeVisible()
  await page.getByLabel('Service failure').selectOption('none')
  await run.click()
  await expect(
    page.getByRole('heading', { name: 'Dashboard ready', exact: true }),
  ).toBeVisible()
})

for (const route of [
  '/',
  '/updates',
  '/features/caching',
  '/features/optimistic',
  '/features/parallel',
  '/features/idempotency',
  '/features/pagination',
  '/features/resilience',
]) {
  test(`${route} fits narrow layouts and passes dark accessibility checks`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await page.goto(route)
    if (route === '/features/parallel') {
      await page.getByRole('button', { name: 'Run loading experiment' }).click()
      await expect(
        page.getByRole('heading', { name: 'Dashboard ready', exact: true }),
      ).toBeVisible()
    }
    if (route === '/features/resilience') {
      await page.getByRole('button', { name: 'Run scenario', exact: true }).click()
      await expect(page.getByTestId('experiment-result')).toBeVisible()
    }
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      })),
      route,
    ).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`${route.split('/').pop() || 'home'}-dark.png`),
      fullPage: true,
    })
    for (const width of [320, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}`,
      ).toBe(true)
    }
  })
}
