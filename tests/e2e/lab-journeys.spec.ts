import { test, expect } from '@playwright/test'

const workspaceUrl = (topic: string) =>
  `/features/${topic}?workspace=${crypto.randomUUID()}`

test('a committed build with a lost response is recovered by revalidation', async ({ page }) => {
  await page.goto(workspaceUrl('caching'))
  const snapshot = page.getByTestId('cache-loader')
  await expect(snapshot).toContainText('Revision 1')
  await page.route('**/_serverFn/**', async (route) => {
    // Let the real server commit, then lose only its response.
    await route.fetch()
    await route.abort()
  })
  await page.getByRole('button', { name: 'Publish build without invalidation' }).click()
  await expect(page.getByRole('alert')).toContainText('Try revalidating')
  await expect(snapshot).toContainText('Revision 1')
  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Revalidate loader' }).click()
  await expect(snapshot).toContainText('Revision 2')
  await expect(snapshot).toContainText('13 builds')
  await expect(page.getByTestId('cache-server')).toContainText('Snapshots agree')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('optimistic response loss reconciles the committed server state before another write', async ({ page }) => {
  await page.goto(workspaceUrl('optimistic'))
  const toggle = page.getByRole('button', { name: 'Toggle task', exact: true })
  await page.route('**/_serverFn/**', async (route) => {
    await route.fetch()
    await route.abort()
  })
  await toggle.click()
  await expect(page.getByRole('alert')).toContainText('server may have received the write')
  await expect(page.getByTestId('optimistic-visible')).toHaveText('Incomplete')
  await expect(toggle).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Simulate another client edit' })).toBeDisabled()
  // A failed reconciliation must not accidentally unlock writes.
  await page.unroute('**/_serverFn/**')
  await page.route('**/_serverFn/**', (route) => route.abort())
  await page.getByRole('button', { name: 'Load latest version' }).click()
  await expect(page.getByRole('alert')).toContainText('Could not reach the server')
  await expect(toggle).toBeDisabled()
  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Load latest version' }).click()
  await expect(page.getByTestId('optimistic-confirmed')).toHaveText('Complete (v2)')
  await expect(page.getByTestId('optimistic-visible')).toHaveText('Complete')
  await expect(toggle).toBeEnabled()
  await toggle.click()
  await expect(page.getByTestId('optimistic-confirmed')).toHaveText('Incomplete (v3)')
})

test('two actual editors reject a stale write without overwriting the first editor', async ({ page, context }) => {
  const url = workspaceUrl('optimistic')
  await page.goto(url)
  const second = await context.newPage()
  try {
    await second.goto(url)
    await page.getByRole('button', { name: 'Toggle task', exact: true }).click()
    await expect(page.getByTestId('optimistic-confirmed')).toHaveText('Complete (v2)')
    await expect(second.getByTestId('optimistic-confirmed')).toHaveText('Incomplete (v1)')
    await second.getByRole('button', { name: 'Toggle task', exact: true }).click()
    await expect(second.getByRole('status').filter({ hasText: 'Version conflict' })).toBeVisible()
    await expect(second.getByTestId('optimistic-confirmed')).toHaveText('Complete (v2)')
    await page.reload()
    await expect(page.getByTestId('optimistic-confirmed')).toHaveText('Complete (v2)')
    await second.getByRole('button', { name: 'Toggle task', exact: true }).click()
    await expect(second.getByTestId('optimistic-confirmed')).toHaveText('Incomplete (v3)')
  } finally {
    await second.close()
  }
})

test('parallel experiments preserve results on transport errors and allow a successful retry', async ({ page }) => {
  await page.goto('/features/parallel')
  const run = page.getByRole('button', { name: 'Run loading experiment', exact: true })
  await run.click()
  const dashboard = page.getByRole('region', { name: 'Dashboard result' })
  await expect(dashboard).toContainText('12 products ready to browse')
  const priorDuration = await page.getByTestId('parallel-duration').innerText()
  await page.getByLabel('Loading strategy').selectOption('sequential')
  let release = () => {}
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/_serverFn/**', async (route) => {
    await gate
    await route.abort()
  })
  try {
    await run.click()
    await expect(page.getByLabel('Loading strategy')).toBeDisabled()
    await expect(page.getByLabel('Service failure')).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Running experiment…' })).toBeDisabled()
    release()
    await expect(page.getByRole('alert')).toContainText('previous results are preserved')
    await expect(page.getByTestId('parallel-duration')).toHaveText(priorDuration)
    await expect(dashboard).toContainText('12 products ready to browse')
  } finally {
    release()
    await page.unroute('**/_serverFn/**')
  }
  await run.click()
  await expect(page.getByRole('status').filter({ hasText: 'Sequential run finished' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText(/Previous parallel run:/)).toBeVisible()
})

test('sold-out reservations do not overbook and original receipts still replay', async ({ page }) => {
  await page.goto(workspaceUrl('idempotency'))
  await page.getByLabel('Seats to reserve').selectOption('5')
  await expect(page.getByLabel('Seats to reserve')).toHaveValue('5')
  await expect(page).toHaveURL(/quantity=5/)
  const originalUrl = page.url()
  const send = page.getByRole('button', { name: 'Send / retry request', exact: true })
  const newRequest = async () => {
    const previousKey = await page.getByTestId('request-key').innerText()
    await page.getByRole('button', { name: 'New request key' }).click()
    await expect(page.getByTestId('request-key')).not.toHaveText(previousKey)
  }
  for (let count = 1; count <= 4; count++) {
    if (count > 1) await newRequest()
    await send.click()
    await expect(page.getByTestId('reservation-remaining')).toHaveText(`${20 - count * 5} seats left`)
  }
  await newRequest()
  await send.click()
  await expect(page.getByRole('status').filter({ hasText: 'Not enough seats remain' })).toBeVisible()
  await expect(page.getByTestId('reservation-count')).toHaveText('4 reservations committed')
  await expect(page.getByTestId('reservation-receipt')).toHaveText('No receipt confirmed yet.')
  await page.goto(originalUrl)
  await send.click()
  await expect(page.getByRole('status').filter({ hasText: 'Replayed:' })).toBeVisible()
  await expect(page.getByTestId('reservation-receipt')).toHaveText('Reservation #1 · 5 seats · 15 seats remained at commit')
  await expect(page.getByTestId('reservation-remaining')).toHaveText('0 seats left')
  await expect(page.getByTestId('reservation-count')).toHaveText('4 reservations committed')
})

test('pagination explains how to see new events after reaching the end', async ({ page }) => {
  await page.goto(workspaceUrl('pagination'))
  await page.getByLabel('Rows per page').selectOption('8')
  const next = page.getByRole('button', { name: 'Load next page', exact: true })
  await next.click()
  const cursor = page.getByRole('region', { name: 'Cursor traversal' })
  await expect(cursor.locator('li')).toHaveCount(12)
  await expect(next).toBeDisabled()
  await page.getByRole('button', { name: 'Insert newest event' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Event 13 inserted' })).toContainText('Restart pagination')
  await expect(cursor.locator('li')).toHaveCount(12)
  await page.getByRole('button', { name: 'Restart pagination' }).click()
  await expect(cursor.locator('li strong').first()).toHaveText('Event 13')
  await expect(cursor.locator('li')).toHaveCount(8)
  await expect(next).toBeEnabled()
})

test('an empty feed has a clear state and recovers after an insertion and restart', async ({ page }) => {
  await page.goto(workspaceUrl('pagination'))
  for (let id = 12; id >= 1; id--) {
    await page.getByRole('button', { name: 'Delete newest event' }).click()
    await expect(page.getByRole('status').filter({ hasText: `Event ${id} deleted` })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Restart pagination' }).click()
  for (const name of ['Offset traversal', 'Cursor traversal']) {
    const traversal = page.getByRole('region', { name })
    await expect(traversal.locator('li')).toHaveCount(0)
    await expect(traversal).toContainText('No events to display')
  }
  await expect(page.getByRole('button', { name: 'Load next page' })).toBeDisabled()
  await page.getByRole('button', { name: 'Insert newest event' }).click()
  await page.getByRole('button', { name: 'Restart pagination' }).click()
  await expect(page.getByRole('region', { name: 'Cursor traversal' }).locator('li strong')).toHaveText(['Event 13'])
})
