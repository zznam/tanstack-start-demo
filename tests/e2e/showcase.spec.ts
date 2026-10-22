import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { learningTopics } from '../../src/utils/learningTopics'

const routes = [
  '/', '/about', '/updates', ...learningTopics.map(topic => topic.to),
  '/features/routing/posts/1', '/features/execution-modes/spa', '/features/execution-modes/hybrid',
]

for (const route of routes) {
  test(`page ${route} renders without browser errors, overflow or accessibility violations`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(200)
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `Overflow on ${route}` }).toBe(true)
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(n => n.target) })), route).toEqual([])
    if (route === '/features/routing') {
      await page.screenshot({ path: testInfo.outputPath('routing.png'), fullPage: true })
    }
    expect(errors).toEqual([])
  })
}

test('search, filters, article navigation and back link preserve URL state', async ({ page }) => {
  await page.goto('/features/routing?category=invalid&sortBy=wrong&query=%7B%7D')
  await expect(page.getByRole('button', { name: 'All Categories', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('searchbox', { name: 'Search articles' }).fill('  Zod  ')
  await expect(page.locator('article')).toHaveCount(1)
  await page.getByRole('link', { name: 'Read Post' }).click()
  await expect(page.locator('main h1')).toContainText('Type-Safe Search Params')
  const like = page.getByRole('button', { name: /Likes \(Server Mutation\)/ })
  const before = Number((await like.innerText()).match(/\d+/)![0])
  await like.click()
  await expect(like).toContainText(`${before + 1} Likes`)
  await page.getByRole('link', { name: 'Back to Articles & Search' }).click()
  await expect(page.getByRole('searchbox')).toHaveValue('  Zod  ')
  await expect(page.locator('article')).toHaveCount(1)
  await page.getByRole('searchbox').fill('no-matching-article-xyz')
  await expect(page.getByText('No posts matched', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Reset Filters' }).click()
  await expect(page.locator('article')).not.toHaveCount(0)
})

test('a new article persists through server RPC, reload and detail route', async ({ page }, testInfo) => {
  const title = `Validated article ${testInfo.project.name} ${Date.now()}`
  await page.goto('/features/server-functions')
  await page.getByLabel('Post Title').fill('    ')
  await page.getByLabel('Excerpt').fill('A sufficiently detailed summary.')
  await page.getByLabel('Full Content').fill('A sufficiently long body for the demonstration article.')
  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  await expect(page.getByRole('alert')).toContainText('Title must be at least 4 characters')
  await page.getByLabel('Post Title').fill(title)
  await page.getByLabel('Author Name').fill('Test Explorer')
  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'created via typed RPC' })).toContainText(title)
  await page.goto(`/features/routing?query=${encodeURIComponent(title)}`)
  await expect(page.locator('article')).toHaveCount(1)
  await page.getByRole('link', { name: 'Read Post' }).click()
  await expect(page.locator('main h1')).toHaveText(title)
  await page.reload()
  await expect(page.locator('main h1')).toHaveText(title)
  await expect(page.locator('main')).toContainText('Test Explorer')
})

test('middleware displays actual client and server telemetry without the token', async ({ page }) => {
  await page.goto('/features/middleware')
  await page.getByRole('button', { name: 'Dispatch Middleware Trace' }).click()
  const context = page.locator('main pre').first()
  await expect(context).toContainText('serverProcessingTime')
  const trace = JSON.parse(await context.innerText())
  expect(trace.requestId).toMatch(/^[\da-f-]{36}$/)
  expect(trace.serverProcessingTime).toBeGreaterThanOrEqual(15)
  expect(trace.totalRoundtrip).toBeGreaterThanOrEqual(trace.serverProcessingTime)
  expect(trace.clientEndTime).toBeGreaterThanOrEqual(trace.clientStartTime)
  expect(trace.authenticatedUser.name).toBe('TanStack Explorer')
  expect(trace.serverNodeVersion).toMatch(/^v\d+/)
  expect(trace.clientAuthToken).toBeUndefined()
})

test('server comparison stays on the server after client navigation', async ({ page }) => {
  await page.goto('/')
  await page.locator('main a[href="/features/isomorphic"]').click()
  await expect(page.locator('main')).toContainText('nodeVersion')
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.getByRole('button', { name: 'Execute In Browser Now' }).click()
  await expect(page.locator('main')).toContainText('screenWidth')
  expect(requests.filter((url) => url.includes('/_serverFn/'))).toEqual([])
})

test('request inspector reads real headers and 404s return a 404 status', async ({ page, request }) => {
  const inspected = await request.get('/features/server-context', { headers: { 'Accept-Language': 'en-XA' } })
  expect(await inspected.text()).toContain('en-XA')
  await page.goto('/features/server-context')
  await expect(page.locator('main')).toContainText('Mozilla')
  for (const path of ['/nonexistent', '/features/routing/posts/missing']) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Page or Resource Not Found' })).toBeVisible()
  }
})

test('theme works with blocked storage and navigation supports keyboard dismissal', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage blocked') }
    Storage.prototype.setItem = () => { throw new Error('Storage blocked') }
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Theme mode/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: /Theme mode/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const menu = page.getByRole('button', { name: 'Toggle navigation menu' })
  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeFocused()
  expect(errors).toEqual([])
})

test('clipboard and mutation failures show recoverable feedback', async ({ page }) => {
  await page.goto('/features/routing/posts/1')
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error('Permission denied') }
  })
  await page.getByRole('button', { name: 'Copy URL', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Clipboard unavailable')
  await page.route('**/_serverFn/**', (route) => route.abort())
  const like = page.getByRole('button', { name: /Likes \(Server Mutation\)/ })
  await like.click()
  await expect(page.getByRole('alert')).toContainText('Could not like')
  await expect(like).toBeEnabled()
})

test('SSR modes and progressive streaming are visible in the HTTP response', async ({ request }) => {
  const client = await (await request.get('/features/execution-modes/spa')).text()
  expect(client).not.toContain('<h1 class="demo-title">Live client-only route')
  expect(client).not.toContain('Browser loader')
  const hybrid = await (await request.get('/features/execution-modes/hybrid')).text()
  expect(hybrid).toContain('Server loader (initial request)')
  expect(hybrid).not.toContain('<h1 class="demo-title">Live data-only SSR route')
  const response = await fetch('http://127.0.0.1:3100/features/streaming', { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' } })
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let html = ''
  let shellAt = 0
  let dataAt = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
    if (!shellAt && html.includes('Critical Content &amp; Page Shell')) shellAt = Date.now()
    if (!dataAt && html.includes('No React Server Components required')) dataAt = Date.now()
  }
  expect(shellAt).toBeGreaterThan(0)
  expect(dataAt - shellAt).toBeGreaterThan(500)
})


test('error demos recover and responsive layouts fit representative widths', async ({ page }) => {
  await page.goto('/features/routing')
  await page.getByRole('button', { name: 'Trigger Route Crash' }).click()
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry Action' }).click()
  await expect(page.getByRole('heading', { name: 'Type-Safe Routing & URL Search State' })).toBeVisible()
  await page.getByRole('button', { name: 'Trigger 404' }).click()
  await expect(page.getByRole('heading', { name: 'Page or Resource Not Found' })).toBeVisible()
  await page.getByRole('link', { name: 'Return Home' }).click()
  for (const width of [320, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/features/server-functions')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `width ${width}`).toBe(true)
    const button = page.getByRole('button', { name: 'Execute Typed Server Mutation' })
    const box = await button.boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
  }
})


test('system theme, stored preference and dark accessibility remain consistent', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/features/server-functions')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: /Theme mode: auto/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: /Theme mode: light/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((n) => n.target) }))).toEqual([])
  await page.getByRole('button', { name: /Theme mode: dark/ }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveClass(/light/)
  expect(errors).toEqual([])
})


test('search keeps every typed character while server responses are slow', async ({ page }) => {
  await page.goto('/features/routing')
  await page.route('**/_serverFn/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150))
    await route.continue()
  })
  const search = page.getByRole('searchbox', { name: 'Search articles' })
  await search.pressSequentially('Zod', { delay: 20 })
  await expect(search).toHaveValue('Zod')
  await expect(page.locator('article')).toHaveCount(1)
})
