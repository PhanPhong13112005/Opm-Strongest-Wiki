import { expect, test } from '@playwright/test'

const responsiveHomeImagePattern = /\/Characters\/Full_Background\/optimized\/(?:homeless-emperor|zombieman|bang-bomb|atomic-samurai)-urplus-\d+\.webp/

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
  expect(vitals.lcp?.url).toContain('/optimized/homeless-emperor-urplus-')
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
  expect(vitals.lcp?.url).toContain('/optimized/homeless-emperor-urplus-')
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
        await cdp.send('Network.enable')
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
          if (/\/Characters\/Full_Background\//.test(event.request.url)) {
            requestPriorities.push({ url: event.request.url, priority: event.request.initialPriority })
          }
        })
        await installPerformanceObservers(page)
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 })
        await page.waitForFunction(() => {
          const images = [...document.querySelectorAll('.featured-card img')]
          return images.length === 2 && images.every(image => image.complete && image.naturalWidth > 0)
        }, null, { timeout: 90_000 })
        await page.waitForTimeout(700)

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
            images,
          }
        })
        samples.push({ run: run + 1, ...metrics, requestPriorities })
        await context.close()
      }
      console.log(`HOME_COLD_PROFILE ${JSON.stringify({ label, profile: profile.name, samples })}`)
    }
  })
}
