import { test, expect } from '@playwright/test'

test('a delayed article response preserves the newer draft and saves the submitted values', async ({ page }, testInfo) => {
  const title = `Submitted draft ${testInfo.project.name} ${Date.now()}`
  const excerpt = 'The original summary submitted to the server.'
  const content = 'The original article body submitted before editing the next draft.'
  await page.goto('/features/server-functions')
  await page.getByLabel('Post Title').fill(title)
  await page.getByLabel('Author Name').fill('Original Author')
  await page.getByLabel('Excerpt').fill(excerpt)
  await page.getByLabel('Full Content').fill(content)

  let releaseResponse!: () => void
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve })
  let committed = false
  await page.route('**/_serverFn/**', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    // Commit a real mutation, then hold only its response while the user edits.
    const response = await route.fetch()
    committed = true
    await responseGate
    await route.fulfill({ response })
  })

  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  try {
    await expect.poll(() => committed).toBe(true)
    await expect(page.getByRole('button', { name: 'Calling Server RPC...' })).toBeDisabled()
    await page.getByLabel('Post Title').fill('My next draft')
    await page.getByLabel('Author Name').fill('Next Author')
    await page.getByLabel('Category', { exact: true }).selectOption('routing')
    await page.getByLabel('Excerpt').fill('The next summary should remain editable.')
    await page.getByLabel('Full Content').fill('The next article body must survive the previous response.')
  } finally {
    releaseResponse()
  }

  await expect(page.getByRole('status').filter({ hasText: 'created via typed RPC' })).toContainText('Your newer draft edits were kept.')
  await expect(page.getByLabel('Post Title')).toHaveValue('My next draft')
  await expect(page.getByLabel('Author Name')).toHaveValue('Next Author')
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('routing')
  await expect(page.getByLabel('Excerpt')).toHaveValue('The next summary should remain editable.')
  await expect(page.getByLabel('Full Content')).toHaveValue('The next article body must survive the previous response.')
  await expect(page.getByRole('button', { name: 'Execute Typed Server Mutation' })).toBeEnabled()

  await page.getByRole('link', { name: title, exact: true }).click()
  await expect(page.locator('main h1')).toHaveText(title)
  await expect(page.locator('main')).toContainText(content)
  await expect(page.locator('main')).toContainText('Original Author')
})

test('failed article requests retain the draft for retry and unchanged successful drafts clear', async ({ page }, testInfo) => {
  const title = `Retry draft ${testInfo.project.name} ${Date.now()}`
  const excerpt = 'A draft summary retained through a connection failure.'
  const content = 'A complete draft article body retained until submission succeeds.'
  await page.goto('/features/server-functions')
  await page.getByLabel('Post Title').fill(title)
  await page.getByLabel('Excerpt').fill(excerpt)
  await page.getByLabel('Full Content').fill(content)
  await page.route('**/_serverFn/**', (route) => route.request().method() === 'POST' ? route.abort() : route.continue())
  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByLabel('Post Title')).toHaveValue(title)
  await expect(page.getByLabel('Excerpt')).toHaveValue(excerpt)
  await expect(page.getByLabel('Full Content')).toHaveValue(content)
  await expect(page.getByRole('button', { name: 'Execute Typed Server Mutation' })).toBeEnabled()

  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'created via typed RPC' })).toContainText(title)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByLabel('Post Title')).toHaveValue('')
  await expect(page.getByLabel('Excerpt')).toHaveValue('')
  await expect(page.getByLabel('Full Content')).toHaveValue('')
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible()
})
