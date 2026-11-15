import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function holdScripts(page: Page) {
  let release = () => {}
  const ready = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/assets/*.js', async (route) => {
    await ready
    await route.continue()
  })
  return release
}

test('catalog controls wait for hydration, then retain the first input through reload and sharing', async ({ page, context }) => {
  const release = await holdScripts(page)
  try {
    await page.goto('/', { waitUntil: 'commit' })
    const search = page.getByRole('searchbox', { name: 'Search learning topics' })
    const advanced = page.getByRole('button', { name: /^Advanced/ })
    await expect(search).toBeDisabled()
    await expect(advanced).toBeDisabled()
    await expect(page.getByRole('button', { name: /Theme mode/ })).toBeDisabled()
    await expect(page.getByRole('status').filter({ hasText: 'Getting interactive controls ready' })).toBeVisible()
    // Real pointer/keyboard input cannot be accepted into an unconnected field.
    await search.scrollIntoViewIfNeeded()
    const box = await search.boundingBox()
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.keyboard.type('too early')
    await expect(search).not.toBeFocused()
    await expect(search).toHaveValue('')
    release()
    await expect(search).toBeEnabled()
    await search.fill('versioning')
    await expect(page).toHaveURL(/q=versioning/)
    await advanced.click()
    await page.getByLabel('Hide completed').check()
    await expect(page).toHaveURL(/incomplete=true/)
    const url = page.url()
    await page.reload()
    await expect(search).toHaveValue('versioning')
    await expect(page.locator('#topics article')).toHaveCount(1)
    const other = await context.newPage()
    await other.goto(url)
    await expect(other.getByRole('searchbox')).toHaveValue('versioning')
    await expect(other.locator('#topics article')).toHaveCount(1)
    await other.close()
  } finally {
    release()
  }
})

test('middleware controls wait for hydration and the first enabled click sends exactly one RPC', async ({ page }) => {
  const release = await holdScripts(page)
  const calls: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/_serverFn/')) calls.push(request.url())
  })
  try {
    await page.goto('/features/middleware', { waitUntil: 'commit' })
    const note = page.getByRole('textbox', { name: 'Trace note' })
    const dispatch = page.getByRole('button', { name: 'Dispatch Middleware Trace' })
    await expect(note).toBeDisabled()
    await expect(dispatch).toBeDisabled()
    await dispatch.evaluate((button: HTMLButtonElement) => button.click())
    expect(calls).toHaveLength(0)
    release()
    await expect(dispatch).toBeEnabled()
    await note.fill('First interactive request')
    await dispatch.click()
    const result = page.locator('main pre').first()
    await expect(result).toContainText('serverProcessingTime')
    const trace = JSON.parse(await result.innerText())
    expect(trace.requestId).toMatch(/^[\da-f-]{36}$/)
    expect(trace.authenticatedUser.name).toBe('TanStack Explorer')
    expect(calls).toHaveLength(1)
    await expect(note).toHaveValue('First interactive request')
  } finally {
    release()
  }
})

test('without JavaScript lessons and navigation remain readable while interactive controls explain their requirement', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(`${baseURL}/`)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.getByRole('searchbox')).toBeDisabled()
    // Some automation engines disable execution while retaining the parser's
    // scripting flag, so inspect the actual SSR noscript fallback directly.
    expect(await response!.text()).toContain('<noscript><p class="page-wrap">Enable JavaScript to use interactive controls.')
    await page.getByRole('link', { name: 'Start exploring', exact: true }).click()
    await expect(page.locator('main h1')).toContainText('Type-Safe Routing')
  } finally {
    await context.close()
  }
})
