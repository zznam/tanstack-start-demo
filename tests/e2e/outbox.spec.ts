import { test, expect } from '@playwright/test'

test('order delivery demonstrates lost events, duplicate invoices and atomic recovery', async ({
  page,
}) => {
  await page.goto('/features/outbox')
  const run = page.getByRole('button', { name: 'Run scenario', exact: true })
  await run.click()
  await expect(page.getByTestId('metric-invoices-created')).toHaveText('1')
  await expect(page.getByTestId('experiment-result')).toContainText(
    'Relay restarts',
  )
  await page.getByLabel('Publishing strategy').selectOption('direct')
  await run.click()
  await expect(page.getByTestId('metric-orders-saved')).toHaveText('1')
  await expect(page.getByTestId('metric-invoices-created')).toHaveText('0')
  await page.getByLabel('Publishing strategy').selectOption('outbox')
  await page.getByLabel('Failure point').selectOption('ack-lost')
  await run.click()
  await expect(page.getByTestId('metric-delivery-attempts')).toHaveText('2')
  await expect(page.getByTestId('metric-invoiced-total')).toHaveText('$49.00')
  await expect(page.getByTestId('experiment-result')).toContainText(
    'Duplicate suppressed',
  )
  await page.getByLabel('Deduplicate billing events').uncheck()
  await run.click()
  await expect(page.getByTestId('metric-invoices-created')).toHaveText('2')
  await expect(page.getByTestId('metric-invoiced-total')).toHaveText('$98.00')
  await page.getByLabel('Deduplicate billing events').check()
  for (const [fault, orders, invoices, attempts] of [
    ['none', '1', '1', '1'],
    ['before-commit', '0', '0', '0'],
    ['consumer-crash', '1', '1', '2'],
    ['poison', '1', '0', '3'],
  ]) {
    await page.getByLabel('Failure point').selectOption(fault)
    await run.click()
    await expect(page.getByTestId('metric-orders-saved')).toHaveText(orders)
    await expect(page.getByTestId('metric-invoices-created')).toHaveText(
      invoices,
    )
    await expect(page.getByTestId('metric-delivery-attempts')).toHaveText(
      attempts,
    )
  }
  await expect(page.getByTestId('experiment-result')).toContainText(
    'Moved to dead-letter state',
  )
})

test('outbox lesson is searchable, completes the lesson sequence and saves progress', async ({
  page,
}) => {
  await page.goto('/?q=billing&level=Advanced')
  await expect(page.locator('#topics article')).toHaveCount(1)
  await page.locator('#topics article a').click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Transactional outbox & event delivery',
  )
  await page
    .getByRole('button', { name: 'Mark as complete', exact: true })
    .click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Completed', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: 'Back to topics', exact: true }).click()
  await expect(
    page.getByRole('progressbar', { name: 'Learning progress' }),
  ).toHaveAttribute('value', '1')
  await page.goto('/features/resilience')
  await page.getByRole('link', { name: 'Next lab', exact: true }).click()
  await expect(page).toHaveURL(/\/features\/outbox$/)
})
