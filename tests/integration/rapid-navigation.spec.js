import { expect, test } from '@playwright/test'

test.describe('Client-side Navigation Race Condition Regression Tests', () => {
  test('rapid navigation between routes settles correctly without blank page or uncaught errors', async ({ page }) => {
    const uncaughtErrors = []
    page.on('pageerror', (error) => {
      uncaughtErrors.push(error.message)
    })

    // 1. Initial load
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.site-header')).toBeVisible()

    // Expose router reference for rapid navigation testing if needed
    await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      if (app) {
        window.__router = app.config.globalProperties.$router
      }
    })

    // 2. Rapid navigation by rapidly clicking header navigation links without waiting for transitions
    const navLinks = [
      page.locator('.site-nav-link[href="/characters"]').first(),
      page.locator('.site-nav-link[href="/tier-ranking"]').first(),
      page.locator('.site-nav-link[href="/events"]').first(),
      page.locator('.site-nav-link[href="/top-up"]').first(),
      page.locator('.site-nav-link[href="/characters"]').first(),
      page.locator('.site-nav-link[href="/events"]').first(),
    ]

    for (let cycle = 0; cycle < 3; cycle++) {
      for (const link of navLinks) {
        if (await link.isVisible()) {
          await link.click({ force: true }).catch(() => {})
        }
      }
    }

    // Direct rapid router pushes in single event loop tick
    await page.evaluate(async () => {
      const router = window.__router
      if (router) {
        router.push('/characters').catch(() => {})
        router.push('/tier-ranking').catch(() => {})
        router.push('/events').catch(() => {})
      }
    })

    // 3. Final navigation to settled target (/events)
    await page.evaluate(async () => {
      const router = window.__router
      if (router) {
        await router.push('/events').catch(() => {})
      } else {
        window.location.pathname = '/events'
      }
    })

    // Wait for the final navigation to settle
    await page.waitForURL('**/events**')
    await page.waitForTimeout(300)

    // Assert header and footer visible
    await expect(page.locator('.site-header')).toBeVisible()
    await expect(page.locator('.site-footer')).toBeVisible()

    // Assert main content container exists, is visible, and contains visible text (NOT blank)
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    const mainText = await mainContent.textContent()
    expect(mainText.trim().length).toBeGreaterThan(0)

    // Assert expected page heading is visible
    await expect(page.locator('h1')).toBeVisible()

    // Assert no uncaught JavaScript runtime errors occurred
    expect(uncaughtErrors).toEqual([])
  })

  test('repeated normal navigation across major pages remains stable', async ({ page }) => {
    const uncaughtErrors = []
    page.on('pageerror', (error) => {
      uncaughtErrors.push(error.message)
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const targetPaths = ['/characters', '/tier-ranking', '/events', '/equipment', '/']

    for (let i = 0; i < 2; i++) {
      for (const path of targetPaths) {
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('.site-header')).toBeVisible()
        await expect(page.locator('.site-footer')).toBeVisible()

        const mainContent = page.locator('main')
        await expect(mainContent).toBeVisible()
        const text = await mainContent.textContent()
        expect(text.trim().length).toBeGreaterThan(0)
      }
    }

    expect(uncaughtErrors).toEqual([])
  })
})
