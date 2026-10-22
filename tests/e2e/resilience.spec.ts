import { test, expect } from '@playwright/test'

test('shipping policy compares outages, recovery and retry budgets through real RPCs', async ({
  page,
}) => {
  await page.goto('/features/resilience')
  const run = page.getByRole('button', { name: 'Run scenario', exact: true })
  await run.click()
  await expect(page.getByTestId('metric-carrier-attempts')).toHaveText('8')
  await expect(page.getByTestId('metric-fast-fallbacks')).toHaveText('1')
  await expect(page.getByTestId('experiment-result')).toContainText(
    'Circuit closed',
  )
  await page.getByLabel('Enable circuit breaker').uncheck()
  await expect(page.getByTestId('experiment-result')).toHaveCount(0)
  await run.click()
  await expect(page.getByTestId('metric-carrier-attempts')).toHaveText('11')
  await page.getByLabel('Enable circuit breaker').check()
  for (const [scenario, attempts, quotes] of [
    ['transient', '10', '5 / 5'],
    ['probe-fails', '7', '0 / 5'],
    ['invalid', '5', '0 / 5'],
  ]) {
    await page.getByLabel('Carrier behavior').selectOption(scenario)
    await run.click()
    await expect(page.getByTestId('metric-carrier-attempts')).toHaveText(
      attempts,
    )
    await expect(page.getByTestId('metric-confirmed-quotes')).toHaveText(quotes)
  }
  await page.getByLabel('Carrier behavior').selectOption('timeout')
  await page.getByLabel('Total checkout deadline').selectOption('250')
  await run.click()
  await expect(page.getByTestId('metric-longest-checkout')).toHaveText('250 ms')
  await page.getByLabel('Maximum attempts per checkout').selectOption('1')
  await run.click()
  await expect(page.getByTestId('metric-longest-checkout')).toHaveText('150 ms')
  await page
    .getByRole('button', { name: 'Mark as complete', exact: true })
    .click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Completed', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('scenario runner locks settings in flight and recovers from transport failures', async ({
  page,
}) => {
  await page.goto('/features/resilience')
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/_serverFn/**', async (route) => {
    await gate
    await route.abort()
  })
  const run = page.getByRole('button', { name: 'Run scenario', exact: true })
  await run.click()
  await expect(page.getByLabel('Carrier behavior')).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Running scenario…' }),
  ).toBeDisabled()
  release()
  await expect(page.getByRole('alert')).toContainText(
    'every run starts with fresh sample data',
  )
  await expect(run).toBeEnabled()
  await page.unroute('**/_serverFn/**')
  await run.click()
  await expect(page.getByTestId('metric-carrier-attempts')).toHaveText('8')
})
