import type { Page } from '@playwright/test'

// Keep browser scheduling real: full timer emulation can stall hydration in
// Linux WebKit. Date changes still exercise the app's focus-based day refresh.
export async function advanceCalendar(page: Page, milliseconds: number) {
  const now = await page.evaluate(() => Date.now())
  await page.clock.setFixedTime(new Date(now + milliseconds))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
}
