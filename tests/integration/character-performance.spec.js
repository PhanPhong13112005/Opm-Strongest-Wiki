import { expect, test } from '@playwright/test'

const target = '/character/blacksperm-urplus'

const installPerformanceObservers = async (page) => {
  await page.addInitScript(() => {
    window.__characterPerf = { fcp: 0, lcp: 0, cls: 0, longTasks: [] }
    new PerformanceObserver((list) => {
      const entry = list.getEntries().find(item => item.name === 'first-contentful-paint')
      if (entry) window.__characterPerf.fcp = entry.startTime
    }).observe({ type: 'paint', buffered: true })
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const entry = entries[entries.length - 1]
      if (entry) {
        window.__characterPerf.lcp = entry.startTime
        window.__characterPerf.lcpElement = {
          tag: entry.element?.tagName || '',
          text: entry.element?.textContent?.trim().slice(0, 100) || '',
          url: entry.url || '',
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__characterPerf.cls += entry.value
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver((list) => {
      window.__characterPerf.longTasks.push(...list.getEntries().map(entry => entry.duration))
    }).observe({ type: 'longtask', buffered: true })
  })
}

test('mobile character route meets the production performance budget and loads only current data', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installPerformanceObservers(page)
  const session = await context.newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200 * 1024,
    uploadThroughput: 100 * 1024,
    connectionType: 'cellular4g',
  })
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const consoleErrors = []
  const runtimeErrors = []
  const unexpectedResponses = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  page.on('response', response => {
    if (response.status() < 400) return
    const url = response.url()
    if (url.includes('/api/characters/') || url.includes('/_vercel/')) return
    unexpectedResponses.push({ status: response.status(), url })
  })
  page.on('console', message => {
    if (message.type() === 'error' &&
        !message.text().startsWith('Failed to load resource') &&
        !message.text().includes('/api/characters/') &&
        !message.text().includes('/_vercel/')) {
      consoleErrors.push(message.text())
    }
  })

  await page.goto(target, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1, name: 'Tinh Trùng Đen' })).toBeVisible()
  await page.waitForTimeout(750)

  const result = await page.evaluate(() => ({
    ...window.__characterPerf,
    resources: performance.getEntriesByType('resource').map(entry => entry.name),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))

  expect(result.fcp).toBeGreaterThan(0)
  expect(result.fcp).toBeLessThan(1800)
  expect(result.lcp).toBeGreaterThan(0)
  expect(result.lcp).toBeLessThan(2500)
  expect(result.cls).toBeLessThan(0.1)
  expect(result.overflow).toBeLessThanOrEqual(1)
  expect(result.resources.some(url => url.includes('/character-details/vi/blacksperm-urplus.json'))).toBe(true)
  expect(result.resources.some(url => url.includes('/Characters/optimized/blacksperm-urplus-360.webp'))).toBe(true)
  expect(result.resources.some(url => /characters(_en)?-[^/]+\.js/.test(url))).toBe(false)
  expect(result.resources.some(url => url.includes('coreLab-'))).toBe(false)
  expect(consoleErrors).toEqual([])
  expect(runtimeErrors).toEqual([])
  expect(unexpectedResponses).toEqual([])

  const skillsSection = page.getByTestId('character-skills')
  await skillsSection.scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: 'TUYỆT KĨ', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'TUYỆT KĨ', exact: true }).click()
  await expect(page.getByText('Tuyệt kĩ', { exact: true }).last()).toBeVisible()
  await expect.poll(async () => page.evaluate(() => performance.getEntriesByType('resource')
    .some(entry => entry.name.includes('coreLab-') ||
      entry.name.includes('/src/data/coreLab.json')))).toBe(true)
  await expect(page.locator('img[loading="lazy"]').first()).toHaveJSProperty('complete', true)
})

test('desktop character route preserves links, tabs, and responsive layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(target)
  await expect(page.getByRole('heading', { level: 1, name: 'Tinh Trùng Đen' })).toBeVisible()
  await expect(page.locator('img[fetchpriority="high"]')).toHaveAttribute('srcset', /blacksperm-urplus-360\.webp/)
  await expect(page.locator('a[href*="/mastery?character=blacksperm-urplus"]')).toBeVisible()

  const skillsSection = page.getByTestId('character-skills')
  await skillsSection.scrollIntoViewIfNeeded()
  for (const tab of ['ĐÁNH THƯỜNG', 'TUYỆT KĨ', 'NỘI TẠI', 'THỨC TỈNH']) {
    await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('unknown character fails safely without hydration or runtime errors', async ({ page }) => {
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/character/not-a-real-character')
  await page.waitForURL('**/')
  await expect(page.locator('body')).toBeVisible()
  expect(pageErrors).toEqual([])
})
