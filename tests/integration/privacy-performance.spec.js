import { expect, test } from '@playwright/test'

const installWebVitalsObserver = async (page) => {
  await page.addInitScript(() => {
    window.__privacyVitals = { cls: 0, shifts: [], lcp: null }

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue
        window.__privacyVitals.cls += entry.value
        window.__privacyVitals.shifts.push({
          value: entry.value,
          startTime: entry.startTime,
          sources: entry.sources.map(source => ({
            node: source.node?.className || source.node?.tagName || null,
            previousRect: source.previousRect,
            currentRect: source.currentRect,
          })),
        })
      }
    }).observe({ type: 'layout-shift', buffered: true })

    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const entry = entries[entries.length - 1]
      if (!entry) return
      window.__privacyVitals.lcp = {
        startTime: entry.startTime,
        element: entry.element?.tagName || null,
        text: entry.element?.textContent?.trim().slice(0, 80) || null,
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
}

const assertPrivacyVitals = async (page, viewport, testInfo) => {
  const hydrationWarnings = []
  page.on('console', (message) => {
    if (/hydration|mismatch/i.test(message.text())) hydrationWarnings.push(message.text())
  })
  await page.setViewportSize(viewport)
  await installWebVitalsObserver(page)
  await page.goto('/privacy', { waitUntil: 'networkidle' })
  await expect(page.locator('.privacy-hero h1')).toBeVisible()
  await page.waitForTimeout(500)

  const result = await page.evaluate(() => ({
    ...window.__privacyVitals,
    headerHeight: document.querySelector('.site-header')?.getBoundingClientRect().height || 0,
  }))
  result.hydrationWarnings = hydrationWarnings

  console.log(`PRIVACY_VITALS ${viewport.width}x${viewport.height} ${JSON.stringify(result)}`)
  expect(result.cls).toBeLessThan(0.1)
  if (testInfo.config.metadata?.privacyProduction) {
    expect(result.lcp?.startTime ?? Infinity).toBeLessThan(2500)
  }
  expect(result.hydrationWarnings).toEqual([])
  expect(result.headerHeight).toBeGreaterThan(0)
}

test('Privacy keeps stable layout on desktop', async ({ page }, testInfo) => {
  await assertPrivacyVitals(page, { width: 1440, height: 900 }, testInfo)
})

test('Privacy keeps stable layout on mobile', async ({ page }, testInfo) => {
  await assertPrivacyVitals(page, { width: 390, height: 844 }, testInfo)
})

test('shared header keeps its desktop height between dossier routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/history', { waitUntil: 'networkidle' })
  const historyHeaderHeight = await page.locator('.site-header').evaluate(
    element => element.getBoundingClientRect().height,
  )

  await page.locator('a[href="/privacy"]').first().click()
  await expect(page).toHaveURL(/\/privacy$/)
  await expect(page.locator('.privacy-hero h1')).toBeVisible()
  const privacyHeaderHeight = await page.locator('.site-header').evaluate(
    element => element.getBoundingClientRect().height,
  )

  expect(privacyHeaderHeight).toBe(historyHeaderHeight)
})
