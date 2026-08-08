import { expect, test } from '@playwright/test'

const installPerformanceObservers = async (page) => {
  await page.addInitScript(() => {
    window.__homeVitals = { cls: 0, lcp: null, longTasks: [] }

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__homeVitals.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })

    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1)
      if (!entry) return
      window.__homeVitals.lcp = {
        startTime: entry.startTime,
        element: entry.element?.tagName || null,
        className: entry.element?.className || null,
        url: entry.url || null,
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__homeVitals.longTasks.push({ startTime: entry.startTime, duration: entry.duration })
      }
    }).observe({ type: 'longtask', buffered: true })
  })
}

const emulateMobile = async (page) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200_000,
    uploadThroughput: 93_750,
    connectionType: 'cellular4g',
  })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}

const readVitals = page => page.evaluate(() => {
  const paints = Object.fromEntries(
    performance.getEntriesByType('paint').map(entry => [entry.name, entry.startTime]),
  )
  const resources = performance.getEntriesByType('resource').map(entry => ({
    name: new URL(entry.name).pathname,
    transferSize: entry.transferSize,
  }))
  return {
    ...window.__homeVitals,
    fcp: paints['first-contentful-paint'] || null,
    blockingTime: window.__homeVitals.longTasks.reduce(
      (total, entry) => total + Math.max(0, entry.duration - 50),
      0,
    ),
    resources,
    loaderVisible: Boolean(document.querySelector('.data-loader')),
  }
})

test('home keeps throttled Mobile first paint and interaction within budget', async ({ page }, testInfo) => {
  const warnings = []
  page.on('console', (message) => {
    if (/hydration|mismatch/i.test(message.text())) warnings.push(message.text())
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await emulateMobile(page)
  await installPerformanceObservers(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.release-hero h1')).toBeVisible()
  await page.waitForFunction(() => document.querySelector('.release-hero img')?.complete)
  await page.waitForTimeout(300)

  const vitals = await readVitals(page)
  console.log(`HOME_VITALS ${JSON.stringify(vitals)}`)

  expect(vitals.cls).toBeLessThan(0.1)
  expect(vitals.loaderVisible).toBe(false)
  expect(vitals.lcp?.url).toContain('Black_Sperm_Ur_plus.webp')
  expect(vitals.resources.some(resource => /characters(?:_en)?-/.test(resource.name))).toBe(false)
  expect(vitals.resources.some(resource => resource.name.startsWith('/_vercel/'))).toBe(false)
  expect(warnings).toEqual([])

  const interactionMs = await page.locator('.month-switcher button').first().evaluate(button => (
    new Promise((resolve) => {
      const start = performance.now()
      button.click()
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - start)))
    })
  ))
  console.log(`HOME_INTERACTION_MS ${interactionMs}`)
  expect(interactionMs).toBeLessThan(200)

  if (testInfo.config.metadata?.homeProduction) {
    expect(vitals.fcp ?? Infinity).toBeLessThan(1_800)
  }
})

test('home LCP stays below 2.5 seconds on production preview', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installPerformanceObservers(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.release-hero h1')).toBeVisible()
  await page.waitForFunction(() => document.querySelector('.release-hero img')?.complete)
  await page.waitForTimeout(300)

  const vitals = await readVitals(page)
  console.log(`HOME_PRODUCTION_LCP ${JSON.stringify(vitals.lcp)}`)
  expect(vitals.lcp?.element).toBe('IMG')
  expect(vitals.lcp?.url).toContain('Black_Sperm_Ur_plus.webp')
  if (testInfo.config.metadata?.homeProduction) {
    expect(vitals.lcp?.startTime ?? Infinity).toBeLessThan(2_500)
  }
})
test('home defers but does not disable Vercel telemetry', async ({ page }, testInfo) => {
  test.skip(!testInfo.config.metadata?.homeProduction, 'Vercel telemetry only injects scripts in production mode.')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.release-hero h1')).toBeVisible()
  await page.waitForTimeout(5_500)

  const resources = await page.evaluate(() => (
    performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
  ))
  const telemetryResources = resources.filter(pathname => pathname.startsWith('/_vercel/'))
  expect(telemetryResources).toContain('/_vercel/insights/script.js')
  expect(telemetryResources).toContain('/_vercel/speed-insights/script.js')
  expect(resources.some(pathname => /characters(?:_en)?-[^/]+\.js$/.test(pathname))).toBe(false)
})
for (const width of [360, 390, 430]) {
  test(`home remains usable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.release-hero h1')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('.month-switcher')).toBeVisible()
  })
}

test('home desktop keeps the hero and navigation visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.locator('.release-hero h1')).toBeVisible()
  await expect(page.locator('.month-switcher')).toBeVisible()
})
