import { expect, test } from '@playwright/test'

const responsiveHomeImagePattern = /\/Characters\/Full_Background\/optimized\/(?:homeless-emperor|zombieman|bang-bomb|atomic-samurai)-urplus-\d+\.webp/
const currentMonthSpotlightImagePattern = /\/Characters\/Full_Background\/optimized\/(?:homeless-emperor|bang-bomb)-urplus-\d+\.webp/

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
  expect(vitals.lcp?.url).toMatch(currentMonthSpotlightImagePattern)
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
  expect(vitals.lcp?.url).toMatch(currentMonthSpotlightImagePattern)
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
for (const width of [360, 390, 430, 1024, 1440, 1920]) {
  test(`home remains usable without horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.release-hero h1')).toBeVisible()
    await page.waitForFunction(() => [...document.querySelectorAll('.featured-card img')].every(image => image.complete && image.naturalWidth > 0))
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

test('home declares Be Vietnam Pro directly without an intermediate Inter swap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.release-hero h1')).toBeVisible()

  const fontAudit = await page.evaluate(() => {
    const resourceUrls = performance.getEntriesByType('resource').map(entry => entry.name)
    return {
      bodyFamily: getComputedStyle(document.body).fontFamily,
      titleFamily: getComputedStyle(document.querySelector('.featured-card h2')).fontFamily,
      fontStylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')]
        .map(link => link.href)
        .filter(url => url.includes('fonts.googleapis.com')),
      interRequests: resourceUrls.filter(url => /\/s\/inter\//.test(url)),
    }
  })

  expect(fontAudit.bodyFamily).toMatch(/^"?Be Vietnam Pro"?, ui-sans-serif/)
  expect(fontAudit.titleFamily).toMatch(/^"?Be Vietnam Pro"?, ui-sans-serif/)
  expect(fontAudit.fontStylesheets).toHaveLength(1)
  expect(fontAudit.fontStylesheets[0]).toContain('family=Be+Vietnam+Pro:')
  expect(fontAudit.interRequests).toEqual([])
})

test('home uses sharp responsive artwork without duplicate boot-shell transfer', async ({ browser }) => {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, minimumDensity: 1 },
    { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 3, minimumDensity: 2.5 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    const homeImageRequests = []
    await cdp.send('Network.enable')
    cdp.on('Network.requestWillBeSent', (event) => {
      if (/\/optimized\/homeless-emperor-urplus-\d+\.webp/.test(event.request.url)) {
        homeImageRequests.push({ url: event.request.url, priority: event.request.initialPriority })
      }
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.featured-card')).toHaveCount(2)
    await page.waitForFunction(() => [...document.querySelectorAll('.featured-card img')].every(image => image.complete && image.naturalWidth > 0))

    const spotlights = await page.locator('.featured-card img').evaluateAll(images => images.map(image => ({
      currentSrc: image.currentSrc,
      naturalWidth: image.naturalWidth,
      renderedWidth: image.getBoundingClientRect().width,
      loading: image.loading,
      fetchPriority: image.fetchPriority,
    })))
    expect(spotlights[0].currentSrc).toMatch(/\/optimized\/homeless-emperor-urplus-\d+\.webp/)
    expect(spotlights[0].fetchPriority).toBe('high')
    expect(spotlights[1].fetchPriority).toBe('low')
    for (const spotlight of spotlights) {
      expect(spotlight.loading).toBe('eager')
      const selectedWidth = Number(/-(\d+)\.webp/.exec(new URL(spotlight.currentSrc).pathname)?.[1] || spotlight.naturalWidth)
      expect(selectedWidth / spotlight.renderedWidth).toBeGreaterThanOrEqual(viewport.minimumDensity)
    }

    const uniqueHomelessEmperorRequests = new Set(homeImageRequests.map(request => request.url))
    expect(uniqueHomelessEmperorRequests.size, `${viewport.name} requested multiple boot/runtime candidates`).toBe(1)
    expect(homeImageRequests, `${viewport.name} downloaded the boot/runtime candidate twice`).toHaveLength(1)

    await page.locator('.release-content').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => [...document.querySelectorAll('.release-card img')]
      .filter(image => image.getBoundingClientRect().top < innerHeight * 2)
      .every(image => image.complete && image.naturalWidth > 0))
    const releaseImages = await page.locator('.release-card img').evaluateAll(images => images.map(image => ({
      currentSrc: image.currentSrc,
      loading: image.loading,
      fetchPriority: image.fetchPriority,
      naturalWidth: image.naturalWidth,
    })))
    expect(releaseImages.filter(image => responsiveHomeImagePattern.test(new URL(image.currentSrc).pathname))).toHaveLength(4)
    expect(releaseImages.every(image => image.loading === 'lazy' && image.fetchPriority === 'low')).toBe(true)
    expect(releaseImages.every(image => image.naturalWidth > 0)).toBe(true)

    await context.close()
  }
})

test('home keeps VI, EN and direct routes healthy with responsive artwork', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/Xem chi tiết/i).first()).toBeVisible()
  await page.getByRole('button', { name: /Language VI/ }).click()
  await expect(page.getByText(/View details/i).first()).toBeVisible()

  for (const route of ['/', '/characters', '/character/homeless-emperor-urplus']) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).not.toBeEmpty()
    const brokenImages = await page.locator('img').evaluateAll(images => images
      .filter(image => image.complete && image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src))
    expect(brokenImages, `broken images on ${route}`).toEqual([])
  }
})

const profileRuns = Number(process.env.HOME_PERF_PROFILE_RUNS || 0)
if (profileRuns > 0) {
  test('collects repeatable cold Home profiles', async ({ browser }) => {
    test.setTimeout(600_000)
    const targetUrl = process.env.HOME_PERF_TARGET_URL || '/'
    const label = process.env.HOME_PERF_LABEL || 'local'

    for (const profile of [
      { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, throttled: false },
      { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 3, throttled: true },
    ]) {
      const samples = []
      for (let run = 0; run < profileRuns; run += 1) {
        const context = await browser.newContext({
          viewport: { width: profile.width, height: profile.height },
          deviceScaleFactor: profile.deviceScaleFactor,
        })
        const page = await context.newPage()
        const cdp = await context.newCDPSession(page)
        const requestPriorities = []
        const networkRequests = new Map()
        const completedResources = []
        await cdp.send('Network.enable')
        await cdp.send('Performance.enable')
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
        if (profile.throttled) {
          await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 150,
            downloadThroughput: 200_000,
            uploadThroughput: 93_750,
            connectionType: 'cellular4g',
          })
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
        }
        cdp.on('Network.requestWillBeSent', (event) => {
          networkRequests.set(event.requestId, { url: event.request.url, type: event.type })
          if (/\/Characters\/Full_Background\//.test(event.request.url)) {
            requestPriorities.push({ url: event.request.url, priority: event.request.initialPriority })
          }
        })
        cdp.on('Network.responseReceived', (event) => {
          const request = networkRequests.get(event.requestId)
          if (request) request.type = event.type
        })
        cdp.on('Network.loadingFinished', (event) => {
          const request = networkRequests.get(event.requestId)
          if (request) completedResources.push({ ...request, transferSize: event.encodedDataLength })
        })
        await installPerformanceObservers(page)
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 })
        await page.waitForFunction(() => {
          const images = [...document.querySelectorAll('.featured-card img')]
          return images.length === 2 && images.every(image => image.complete && image.naturalWidth > 0)
        }, null, { timeout: 90_000 })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(300)

        const performanceMetrics = Object.fromEntries(
          (await cdp.send('Performance.getMetrics')).metrics.map(metric => [metric.name, metric.value]),
        )

        const metrics = await page.evaluate(async () => {
          const decodeStart = performance.now()
          await Promise.all([...document.images].filter(image => image.complete).map(image => image.decode().catch(() => {})))
          const decodeWait = performance.now() - decodeStart
          const resources = performance.getEntriesByType('resource')
          const paints = Object.fromEntries(performance.getEntriesByType('paint').map(entry => [entry.name, entry.startTime]))
          const images = [...document.querySelectorAll('.featured-card img')].map(image => ({
            currentSrc: image.currentSrc,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: image.getBoundingClientRect().width,
            renderedHeight: image.getBoundingClientRect().height,
            fetchPriority: image.fetchPriority,
            loading: image.loading,
          }))
          return {
            fcp: paints['first-contentful-paint'] || null,
            lcp: window.__homeVitals.lcp?.startTime || null,
            cls: window.__homeVitals.cls,
            tbt: window.__homeVitals.longTasks.reduce((total, entry) => total + Math.max(0, entry.duration - 50), 0),
            imageTransfer: resources.filter(entry => /\.(?:avif|gif|jpe?g|png|webp)(?:\?|$)/i.test(entry.name)).reduce((total, entry) => total + entry.transferSize, 0),
            totalTransfer: resources.reduce((total, entry) => total + entry.transferSize, 0),
            decodeWait,
            fontFamilies: [...new Set([...document.fonts]
              .filter(face => face.status === 'loaded')
              .map(face => face.family))],
            longTaskCount: window.__homeVitals.longTasks.length,
            maxLongTask: Math.max(0, ...window.__homeVitals.longTasks.map(entry => entry.duration)),
            images,
          }
        })
        const fontResources = completedResources.filter(resource => resource.type === 'Font')
        samples.push({
          run: run + 1,
          ...metrics,
          fontRequestCount: fontResources.length,
          fontTransfer: fontResources.reduce((total, resource) => total + resource.transferSize, 0),
          layoutDuration: performanceMetrics.LayoutDuration * 1_000,
          recalcStyleDuration: performanceMetrics.RecalcStyleDuration * 1_000,
          scriptDuration: performanceMetrics.ScriptDuration * 1_000,
          requestPriorities,
        })
        await context.close()
      }
      console.log(`HOME_COLD_PROFILE ${JSON.stringify({ label, profile: profile.name, samples })}`)
    }
  })
}

const fontScenarioTarget = process.env.HOME_FONT_SCENARIO_TARGET
const expectOptimizedFontChain = process.env.HOME_FONT_EXPECT_OPTIMIZED !== '0'
if (fontScenarioTarget) {
  test('validates slow, blocked, warm-cache, VI and EN font scenarios', async ({ browser }) => {
    test.setTimeout(180_000)
    const results = []

    for (const scenario of ['slow-font', 'blocked-font', 'warm-cache', 'warm-cache-desktop', 'vi', 'en']) {
      const desktop = scenario === 'warm-cache-desktop'
      const context = await browser.newContext({
        viewport: desktop ? { width: 1440, height: 900 } : { width: 390, height: 844 },
        deviceScaleFactor: desktop ? 1 : 3,
      })
      const page = await context.newPage()
      const cdp = await context.newCDPSession(page)
      await cdp.send('Performance.enable')
      await installPerformanceObservers(page)

      if (scenario === 'slow-font') {
        await page.route(/fonts\.(?:googleapis|gstatic)\.com/, async (route) => {
          await new Promise(resolve => setTimeout(resolve, 2_500))
          await route.continue()
        })
      } else if (scenario === 'blocked-font') {
        await page.route(/fonts\.(?:googleapis|gstatic)\.com/, route => route.abort())
      }

      await page.goto(fontScenarioTarget, { waitUntil: 'domcontentloaded', timeout: 90_000 })
      await expect(page.locator('.release-hero h1')).toBeVisible()
      if (scenario === 'en') {
        await page.getByRole('button', { name: /Language VI/ }).click()
        await expect(page.getByText(/View details/i).first()).toBeVisible()
      }
      if (scenario !== 'blocked-font') await page.evaluate(() => document.fonts.ready)
      if (scenario.startsWith('warm-cache')) {
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(page.locator('.release-hero h1')).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
      }
      await page.waitForTimeout(300)

      const audit = await page.evaluate(() => {
        const viSample = 'Đ đ ă â ê ô ơ ư ấ ầ ậ ể ễ ộ ở ữ ự'
        const enSample = 'Bang & Bomb — Extreme Acceleration'
        const paints = Object.fromEntries(performance.getEntriesByType('paint')
          .map(entry => [entry.name, entry.startTime]))
        return {
          cls: window.__homeVitals.cls,
          fcp: paints['first-contentful-paint'] || null,
          lcp: window.__homeVitals.lcp?.startTime || null,
          tbt: window.__homeVitals.longTasks
            .reduce((total, entry) => total + Math.max(0, entry.duration - 50), 0),
          locale: document.documentElement.lang,
          bodyFamily: getComputedStyle(document.body).fontFamily,
          vi: document.fonts.check('900 35px "Be Vietnam Pro"', viSample),
          en: document.fonts.check('900 35px "Be Vietnam Pro"', enSample),
          loadedFamilies: [...new Set([...document.fonts]
            .filter(face => face.status === 'loaded')
            .map(face => face.family))],
          interRequests: performance.getEntriesByType('resource')
            .filter(entry => /\/s\/inter\//.test(entry.name)).length,
        }
      })
      const performanceMetrics = Object.fromEntries(
        (await cdp.send('Performance.getMetrics')).metrics.map(metric => [metric.name, metric.value]),
      )
      results.push({ scenario, ...audit, layoutDuration: performanceMetrics.LayoutDuration * 1_000 })

      if (expectOptimizedFontChain) {
        expect(audit.bodyFamily).toMatch(/^"?Be Vietnam Pro"?, ui-sans-serif/)
      } else {
        expect(audit.bodyFamily).toMatch(/^"?Be Vietnam Pro"?, Inter, ui-sans-serif/)
      }
      expect(audit.cls).toBeLessThan(0.01)
      if (expectOptimizedFontChain) expect(audit.interRequests).toBe(0)
      if (scenario !== 'blocked-font') {
        expect(audit.vi).toBe(true)
        expect(audit.en).toBe(true)
        expect(audit.loadedFamilies).toContain('Be Vietnam Pro')
      }
      if (scenario === 'en') expect(audit.locale).toBe('en')
      if (scenario === 'vi') expect(audit.locale).toBe('vi')
      await context.close()
    }

    console.log(`HOME_FONT_SCENARIOS ${JSON.stringify(results)}`)
  })
}

const visualBaselineUrl = process.env.HOME_FONT_VISUAL_BASELINE_URL
const visualOptimizedUrl = process.env.HOME_FONT_VISUAL_OPTIMIZED_URL
if (visualBaselineUrl && visualOptimizedUrl) {
  for (const viewport of [
    { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 3 },
    { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  ]) {
    test(`font-only final render matches baseline at ${viewport.name}`, async ({ browser }) => {
      const screenshots = []
      for (const target of [visualBaselineUrl, visualOptimizedUrl]) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.deviceScaleFactor,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        await page.goto(target, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('.release-hero h1')).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        await page.waitForFunction(() => [...document.querySelectorAll('.featured-card img')]
          .every(image => image.complete && image.naturalWidth > 0))
        await page.waitForTimeout(200)
        screenshots.push(await page.screenshot({ fullPage: true, animations: 'disabled' }))
        await context.close()
      }
      expect(screenshots[1]).toEqual(screenshots[0])
    })
  }
}
