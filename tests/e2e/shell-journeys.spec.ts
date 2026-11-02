import { expect, test } from '@playwright/test'

test('keyboard users can skip the shell and reach every topic in the menu', async ({ page, browserName }) => {
  await page.goto('/about')
  await page.keyboard.press(process.platform === 'darwin' && browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  const skip = page.getByRole('link', { name: 'Skip to content', exact: true })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()

  const toggle = page.getByRole('button', { name: 'Toggle navigation menu' })
  await toggle.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press(process.platform === 'darwin' && browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  const firstTopic = page.locator('#topic-navigation').getByRole('link', { name: 'Type-safe routing', exact: true })
  await expect(firstTopic).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL((url) => url.pathname === '/features/routing')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await page.locator('main h1').click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

test('theme changes synchronize across tabs and clearing the preference restores system mode', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const other = await context.newPage()
  try {
    await other.emulateMedia({ colorScheme: 'dark' })
    await other.goto('/about')
    await page.getByRole('button', { name: /Theme mode: auto/ }).click()
    await expect(other.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(other.getByRole('button', { name: /Theme mode: light/ })).toBeVisible()
    await other.getByRole('button', { name: /Theme mode: light/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.evaluate(() => localStorage.removeItem('theme'))
    await expect(other.getByRole('button', { name: /Theme mode: auto/ })).toBeVisible()
    await expect(other.locator('html')).not.toHaveAttribute('data-theme')
    await expect(other.locator('html')).toHaveClass(/dark/)
    await other.emulateMedia({ colorScheme: 'light' })
    await expect(other.locator('html')).toHaveClass(/light/)
    await other.reload()
    await expect(other.getByRole('button', { name: /Theme mode: auto/ })).toBeVisible()
  } finally {
    await other.close()
  }
})

test('article category and sorting controls restore through reload and browser history', async ({ page }) => {
  await page.goto('/features/routing')
  await page.getByRole('button', { name: 'Routing', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Routing', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Architecture', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Architecture', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('Sort articles').selectOption('likes')
  await expect(page).toHaveURL(/sortBy=likes/)
  const counts = await page.locator('article').allTextContents()
  const likes = counts.map((text) => Number(text.match(/(\d+) likes/)![1]))
  expect(likes.length).toBeGreaterThan(1)
  expect(likes).toEqual([...likes].sort((a, b) => b - a))
  await page.reload()
  await expect(page.getByLabel('Sort articles')).toHaveValue('likes')
  await expect(page.getByRole('button', { name: 'Architecture', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goBack()
  await expect(page.getByLabel('Sort articles')).toHaveValue('newest')
  await expect(page.getByRole('button', { name: 'Architecture', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Routing', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goForward()
  await expect(page.getByRole('button', { name: 'Architecture', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('copy controls recover from denied clipboard access and copy the displayed code and share URL', async ({ page }) => {
  await page.goto('/features/routing/posts/1?category=architecture&query=SSR&sortBy=likes')
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => { throw new Error('Permission denied') }
  })
  const copyCode = page.getByRole('button', { name: 'Copy code to clipboard', exact: true })
  await copyCode.click()
  await expect(page.getByRole('alert')).toContainText('Clipboard unavailable')
  await page.evaluate(() => {
    navigator.clipboard.writeText = async (value: string) => {
      document.documentElement.dataset.copiedText = value
    }
  })
  await copyCode.click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: 'Code copied' })).toBeVisible()
  expect(await page.locator('html').getAttribute('data-copied-text')).toBe(await page.locator('pre code').innerText())
  await page.getByRole('button', { name: 'Copy URL', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Link Copied', exact: true })).toBeVisible()
  expect(await page.locator('html').getAttribute('data-copied-text')).toBe(page.url())
})

test('article validation rejects blank summaries, normalizes input and renders submitted text literally', async ({ page }, testInfo) => {
  const title = `Literal article ${testInfo.project.name} ${Date.now()}`
  const content = '<img src=x onerror="window.untrustedArticleRan=true"> This is article text, not executable markup.'
  await page.goto('/features/server-functions')
  await page.getByLabel('Post Title').fill(`  ${title}  `)
  await page.getByLabel('Excerpt').fill('          ')
  await page.getByLabel('Full Content').fill(content)
  let mutationRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/_serverFn/')) mutationRequests += 1
  })
  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  await expect(page.getByRole('alert')).toContainText('Excerpt must be at least 10 characters')
  expect(mutationRequests).toBe(0)
  await page.getByLabel('Excerpt').fill('  A valid summary with trimmed whitespace.  ')
  await page.getByLabel('Author Name').fill('   ')
  await page.getByLabel('Category', { exact: true }).selectOption('architecture')
  await page.getByRole('button', { name: 'Execute Typed Server Mutation' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'created via typed RPC' })).toContainText(title)
  expect(mutationRequests).toBe(1)
  await page.getByRole('link', { name: title, exact: true }).click()
  await expect(page.locator('main h1')).toHaveText(title)
  await expect(page.locator('article')).toContainText('Anonymous Developer')
  await expect(page.locator('article')).toContainText(content)
  await expect(page.locator('article img')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('article')).toContainText(content)
  await page.getByRole('link', { name: 'Back to Articles & Search' }).click()
  await page.getByRole('searchbox', { name: 'Search articles' }).fill(title)
  await expect(page.locator('article')).toHaveCount(1)
})

test('a failed article loader can be retried after the connection recovers', async ({ page }) => {
  await page.goto('/')
  await page.route('**/_serverFn/**', (route) => route.abort())
  await page.locator('#topics').getByRole('link').filter({
    has: page.getByRole('heading', { name: 'Type-safe routing', exact: true }),
  }).click()
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Show stack trace/ })).toHaveCount(0)
  await page.unroute('**/_serverFn/**')
  await page.getByRole('button', { name: 'Retry Action', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Type-Safe Routing & URL Search State' })).toBeVisible()
  await expect(page.locator('article')).not.toHaveCount(0)
})
