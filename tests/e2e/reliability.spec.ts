import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const labUrl = (topic: string) =>
  '/features/' + topic + '?workspace=' + crypto.randomUUID()

test('isolated server walkthroughs teach retries and pagination without shared request state', async ({ page }) => {
  await page.goto(labUrl('idempotency'))
  const run = page.getByRole('button', { name: 'Run isolated walkthrough', exact: true })
  const result = page.getByTestId('scenario-result')
  await run.click()
  await expect(result).toContainText('Concurrent outcomes: created, replayed')
  await page.getByLabel('Walkthrough scenario').selectOption('lost-response')
  await run.click()
  await expect(result).toContainText('Retry outcome: replayed')
  await page.getByLabel('Walkthrough scenario').selectOption('payload-conflict')
  await run.click()
  await expect(result).toContainText('Retry outcome: conflict')
  await page.goto(labUrl('pagination'))
  await run.click()
  await expect(result).toContainText('Next offset page: 10, 9, 8')
  await expect(result).toContainText('Next cursor page: 9, 8, 7')
  await page.getByLabel('Walkthrough scenario').selectOption('delete')
  await run.click()
  await expect(result).toContainText('Next offset page: 8, 7, 6')
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(violations).toEqual([])
})

test('a different server generation pauses live writes without claiming deduplication', async ({ page }) => {
  await page.goto(labUrl('idempotency'))
  // Represent a server response from a workspace whose generation changed.
  await page.route('**/_serverFn/**', async (route) => {
    const response = await route.fetch()
    let body = await response.text()
    body = body.replace('"s":"created"', '"s":"expired"').replace('"s":"replayed"', '"s":"expired"')
    await route.fulfill({ response, body })
  })
  await page.getByRole('button', { name: 'Send concurrent duplicates' }).click()
  await expect(page.getByRole('alert')).toContainText('Live writes are paused')
  await expect(page.getByRole('button', { name: 'Send / retry request', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'New request key' })).toBeDisabled()
  await expect(page.getByRole('status').filter({ hasText: 'one created, one replayed' })).toHaveCount(0)
  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Run isolated walkthrough', exact: true }).click()
  await expect(page.getByTestId('scenario-result')).toContainText('Concurrent outcomes: created, replayed')
})

test('idempotency deduplicates concurrent requests, rejects payload conflicts, and preserves receipts', async ({
  page,
}, testInfo) => {
  await page.goto(labUrl('idempotency'))
  const send = page.getByRole('button', {
    name: 'Send / retry request',
    exact: true,
  })
  await page.getByRole('button', { name: 'Send concurrent duplicates' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Concurrent requests' }),
  ).toBeVisible()
  await expect(page.getByTestId('reservation-count')).toHaveText(
    '1 reservation committed',
  )
  await expect(page.getByTestId('reservation-remaining')).toHaveText(
    '18 seats left',
  )
  await send.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Replayed:' }),
  ).toBeVisible()
  await page.getByLabel('Seats to reserve').selectOption('3')
  await send.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Key conflict:' }),
  ).toBeVisible()
  await expect(page.getByTestId('reservation-remaining')).toHaveText(
    '18 seats left',
  )
  await page.getByRole('button', { name: 'New request key' }).click()
  await send.click()
  await expect(page.getByTestId('reservation-count')).toHaveText(
    '2 reservations committed',
  )
  await expect(page.getByTestId('reservation-remaining')).toHaveText(
    '15 seats left',
  )
  const key = await page.getByTestId('request-key').innerText()
  await page.reload()
  await expect(page.getByTestId('request-key')).toHaveText(key)
  await expect(page.getByLabel('Seats to reserve')).toHaveValue('3')
  await send.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Replayed:' }),
  ).toBeVisible()
  await expect(page.getByTestId('reservation-receipt')).toContainText(
    'Reservation #2 · 3 seats',
  )
  await expect(page.getByTestId('reservation-count')).toHaveText(
    '2 reservations committed',
  )
  await page.screenshot({
    path: testInfo.outputPath('idempotency-result.png'),
    fullPage: true,
  })
})

test('a lost response after commit recovers via the same key without reserving again', async ({
  page,
}) => {
  await page.goto(labUrl('idempotency'))
  await page.getByLabel('Seats to reserve').selectOption('4')
  await page
    .getByLabel('Lose the response after a new reservation commits')
    .check()
  const key = await page.getByTestId('request-key').innerText()
  const send = page.getByRole('button', {
    name: 'Send / retry request',
    exact: true,
  })
  await send.click()
  await expect(page.getByRole('alert')).toContainText(
    'server may have committed',
  )
  await expect(
    page.getByRole('button', { name: 'New request key' }),
  ).toBeDisabled()
  await expect(page.getByLabel('Seats to reserve')).toBeDisabled()
  await send.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Replayed:' }),
  ).toBeVisible()
  await expect(page.getByTestId('reservation-count')).toHaveText(
    '1 reservation committed',
  )
  await expect(page.getByTestId('reservation-remaining')).toHaveText(
    '16 seats left',
  )
  await expect(page.getByTestId('request-key')).toHaveText(key)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'New request key' }),
  ).toBeEnabled()
})

test('failed transport retains the request key for a safe retry', async ({
  page,
}) => {
  await page.goto(labUrl('idempotency'))
  const key = await page.getByTestId('request-key').innerText()
  await page.route('**/_serverFn/**', (route) => route.abort())
  const send = page.getByRole('button', {
    name: 'Send / retry request',
    exact: true,
  })
  await send.click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'New request key' }),
  ).toBeDisabled()
  await page.unroute('**/_serverFn/**')
  await send.click()
  await expect(page.getByTestId('reservation-count')).toHaveText(
    '1 reservation committed',
  )
  await expect(page.getByTestId('request-key')).toHaveText(key)
})

test('inserting between pages repeats offset rows without repeating cursor rows', async ({
  page,
}, testInfo) => {
  await page.goto(labUrl('pagination'))
  const offset = page.getByRole('region', { name: 'Offset traversal' })
  const cursor = page.getByRole('region', { name: 'Cursor traversal' })
  await expect(cursor.locator('li strong')).toHaveText([
    'Event 12',
    'Event 11',
    'Event 10',
  ])
  await page.getByRole('button', { name: 'Insert newest event' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Event 13 inserted' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Load next page' }).click()
  await expect(offset).toContainText('1 repeated ID')
  await expect(cursor).toContainText('0 repeated IDs')
  await expect(cursor.locator('li strong')).toHaveText([
    'Event 12',
    'Event 11',
    'Event 10',
    'Event 9',
    'Event 8',
    'Event 7',
  ])
  await expect(offset.locator('li strong')).toHaveText([
    'Event 12',
    'Event 11',
    'Event 10',
    'Event 10',
    'Event 9',
    'Event 8',
  ])
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath('pagination-comparison.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Restart pagination' }).click()
  await expect(cursor.locator('li strong')).toHaveText([
    'Event 13',
    'Event 12',
    'Event 11',
  ])
})

test('deleting ahead skips an offset row and page-size changes restart traversal', async ({
  page,
}) => {
  await page.goto(labUrl('pagination'))
  const offset = page.getByRole('region', { name: 'Offset traversal' })
  const cursor = page.getByRole('region', { name: 'Cursor traversal' })
  await page.getByRole('button', { name: 'Delete newest event' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Event 12 deleted' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Load next page' }).click()
  await expect(cursor.locator('li strong')).toHaveText([
    'Event 12',
    'Event 11',
    'Event 10',
    'Event 9',
    'Event 8',
    'Event 7',
  ])
  await expect(offset.locator('li strong')).toHaveText([
    'Event 12',
    'Event 11',
    'Event 10',
    'Event 8',
    'Event 7',
    'Event 6',
  ])
  await page.getByLabel('Rows per page').selectOption('5')
  await expect(cursor.locator('li strong')).toHaveText([
    'Event 11',
    'Event 10',
    'Event 9',
    'Event 8',
    'Event 7',
  ])
  await page.getByRole('button', { name: 'Load next page' }).click()
  await expect(cursor.locator('li')).toHaveCount(10)
  await page.getByRole('button', { name: 'Load next page' }).click()
  await expect(cursor.locator('li')).toHaveCount(11)
  await expect(
    page.getByRole('button', { name: 'Load next page' }),
  ).toBeDisabled()
})

test('pagination failures keep the current rows and recover by restarting', async ({
  page,
}) => {
  await page.goto(labUrl('pagination'))
  const cursor = page.getByRole('region', { name: 'Cursor traversal' })
  await page.route('**/_serverFn/**', (route) => route.abort())
  await page.getByRole('button', { name: 'Load next page' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Restart pagination to recover',
  )
  await expect(cursor.locator('li')).toHaveCount(3)
  await expect(
    page.getByRole('button', { name: 'Load next page' }),
  ).toBeDisabled()
  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Restart pagination' }).click()
  await expect(
    page.getByRole('button', { name: 'Load next page' }),
  ).toBeEnabled()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Load next page' }).click()
  await expect(cursor.locator('li')).toHaveCount(6)
})

test('new labs are discoverable, linked in sequence, and track completion', async ({
  page,
}) => {
  await page.goto('/?q=idempotency&level=Advanced')
  await expect(page.locator('#topics article')).toHaveCount(1)
  await page.locator('#topics article a').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Idempotent mutations & safe retries',
  )
  await page
    .getByRole('button', { name: 'Mark as complete', exact: true })
    .click()
  await page.getByRole('link', { name: 'Next lab', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Cursor pagination & changing data',
  )
  await page
    .getByRole('button', { name: 'Mark as complete', exact: true })
    .click()
  await page.getByRole('link', { name: 'Next lab', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Circuit breakers & retry budgets')
  await page.getByRole('link', { name: 'All learning topics', exact: true }).click()
  await expect(
    page.getByRole('progressbar', { name: 'Learning progress' }),
  ).toHaveAttribute('value', '2')
})
