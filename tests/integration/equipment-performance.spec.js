import { expect, test } from '@playwright/test'

const installPerformanceObservers = async (page) => {
  await page.addInitScript(() => {
    window.__equipmentVitals = { cls: 0, shifts: [], lcp: null }

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue
        window.__equipmentVitals.cls += entry.value
        window.__equipmentVitals.shifts.push({
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
      const entry = list.getEntries().at(-1)
      if (!entry) return
      window.__equipmentVitals.lcp = {
        startTime: entry.startTime,
        element: entry.element?.tagName || null,
        className: entry.element?.className || null,
        text: entry.element?.textContent?.trim().slice(0, 80) || null,
        url: entry.url || null,
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
}

const readVitals = page => page.evaluate(() => ({
  ...window.__equipmentVitals,
  paints: Object.fromEntries(
    performance.getEntriesByType('paint').map(entry => [entry.name, entry.startTime]),
  ),
  headerHeight: document.querySelector('.site-header')?.getBoundingClientRect().height || 0,
  horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}))

const assertStableEquipmentRoute = async (page, viewport) => {
  const warnings = []
  page.on('console', (message) => {
    if (/hydration|mismatch/i.test(message.text())) warnings.push(message.text())
  })

  await page.setViewportSize(viewport)
  await installPerformanceObservers(page)
  await page.goto('/equipment', { waitUntil: 'networkidle' })
  await expect(page.locator('.equipment-hero h1')).toBeVisible()
  await expect(page.locator('.gear-tabs')).toBeVisible()
  await page.waitForTimeout(500)

  const vitals = await readVitals(page)
  console.log(`EQUIPMENT_VITALS ${viewport.width}x${viewport.height} ${JSON.stringify(vitals)}`)

  expect(vitals.cls).toBeLessThan(0.1)
  expect(vitals.headerHeight).toBeGreaterThan(0)
  expect(vitals.horizontalOverflow).toBeLessThanOrEqual(1)
  expect(warnings).toEqual([])
}

test('equipment keeps stable layout on desktop', async ({ page }) => {
  await assertStableEquipmentRoute(page, { width: 1440, height: 900 })
})

test('equipment keeps stable layout on mobile', async ({ page }) => {
  await assertStableEquipmentRoute(page, { width: 390, height: 844 })
})

test('equipment navigation does not collapse the public route stage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installPerformanceObservers(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('.release-hero h1')).toBeVisible()

  await page.evaluate(() => {
    window.__equipmentVitals.cls = 0
    window.__equipmentVitals.shifts = []
    document.querySelector('a[href="/equipment"]')?.click()
  })
  await expect(page).toHaveURL(/\/equipment$/)
  await expect(page.locator('.equipment-hero h1')).toBeVisible()
  await page.waitForTimeout(500)

  const vitals = await readVitals(page)
  console.log(`EQUIPMENT_NAVIGATION_VITALS ${JSON.stringify(vitals)}`)
  expect(vitals.cls).toBeLessThan(0.1)
})
test('equipment redesign keeps simulator, picker, and catalog actions usable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/equipment', { waitUntil: 'networkidle' })

  await expect(page.locator('.equipment-metrics article')).toHaveCount(3)
  const equipmentMotion = await page.evaluate(() => ({
    hero: getComputedStyle(document.querySelector('.equipment-hero')).animationName,
    ring: getComputedStyle(document.querySelector('.equipment-hero'), '::after').animationName,
    heroGrid: getComputedStyle(document.querySelector('.equipment-hero'), '::before').animationName,
    panelGrid: getComputedStyle(document.querySelector('.gear-panel'), '::before').animationName,
  }))
  expect(equipmentMotion.hero).toContain('equipment-hero-in')
  expect(equipmentMotion.ring).toContain('equipment-orbit-spin')
  expect(equipmentMotion.heroGrid).toContain('equipment-grid-drift')
  expect(equipmentMotion.panelGrid).toContain('gear-grid-drift')
  const desktopStructure = await page.evaluate(() => {
    const tabs = document.querySelector('.gear-tabs').getBoundingClientRect()
    const panel = document.querySelector('.gear-panel').getBoundingClientRect()
    return {
      tabRailIsLeftOfPanel: tabs.right <= panel.left,
      tabRailWidth: tabs.width,
      panelWidth: panel.width,
    }
  })
  expect(desktopStructure.tabRailIsLeftOfPanel).toBe(true)
  expect(desktopStructure.tabRailWidth).toBeLessThan(desktopStructure.panelWidth)
  await page.evaluate(() => {
    window.__gearPanelTransitions = []
    document.addEventListener('transitionstart', (event) => {
      if (event.target instanceof Element && event.target.classList.contains('gear-panel')) {
        window.__gearPanelTransitions.push(event.propertyName)
      }
    }, { capture: true })
  })
  await page.locator('#gear-tab-simulator').click()
  await expect(page.locator('#gear-panel-simulator')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__gearPanelTransitions.length)).toBeGreaterThan(0)
  await expect.poll(() => page.evaluate(() => window.__gearPanelTransitions)).toContain('opacity')
  await expect.poll(() => page.evaluate(() => window.__gearPanelTransitions)).toContain('transform')
  await expect(page.locator('.desktop-set-select')).toHaveCount(0)
  await expect(page.locator('.set-picker-trigger')).toBeVisible()
  await page.locator('.set-picker-trigger').click()
  await expect(page.locator('.set-picker-dialog')).toBeVisible()
  await expect(page.locator('.set-picker-dialog')).toHaveCSS('animation-name', /gear-dialog-in/)
  await expect(page.locator('.set-picker-grid img')).toHaveCount(20)
  const desktopPickerColumns = await page.locator('.set-picker-grid').first().evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
  expect(desktopPickerColumns).toBe(3)
  await page.locator('.set-picker-grid button').nth(1).click()
  await expect(page.locator('.set-picker-dialog')).toHaveCount(0)
  await expect(page.locator('.gear-piece')).toHaveCount(4)

  const desktopPieceSizes = await page.locator('.gear-piece-main > img').evaluateAll(images => images.map(image => ({
    width: image.getBoundingClientRect().width,
    height: image.getBoundingClientRect().height,
  })))
  expect(desktopPieceSizes.every(size => size.width <= 122 && size.height <= 122)).toBe(true)

  await page.locator('.gear-piece .remove-piece').first().click()
  await expect(page.locator('.empty-piece')).toHaveCount(1)
  await page.locator('.empty-piece').click()
  await expect(page.locator('.gear-picker-dialog')).toBeVisible()
  await expect(page.locator('.gear-picker-grid button')).toHaveCount(20)
  await page.locator('.gear-picker-grid button').nth(16).click()
  await expect(page.locator('.gear-picker-dialog')).toHaveCount(0)

  await page.locator('#gear-tab-basic').click()
  await expect(page.locator('#gear-panel-basic')).toBeVisible()
  await expect(page.locator('#gear-panel-basic .catalog-card')).toHaveCount(16)
})

test('equipment redesign keeps compact controls on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/equipment', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    window.__gearPanelTransitions = []
    document.addEventListener('transitionstart', (event) => {
      if (event.target instanceof Element && event.target.classList.contains('gear-panel')) {
        window.__gearPanelTransitions.push(event.propertyName)
      }
    }, { capture: true })
  })
  await page.locator('#gear-tab-simulator').click()
  await expect(page.locator('#gear-panel-simulator')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__gearPanelTransitions)).toContain('opacity')
  await expect.poll(() => page.evaluate(() => window.__gearPanelTransitions)).toContain('transform')

  await expect(page.locator('.set-picker-trigger')).toBeVisible()
  await page.locator('.set-picker-trigger').click()
  await expect(page.locator('.set-picker-dialog')).toBeVisible()
  await expect(page.locator('.set-picker-grid button')).toHaveCount(20)
  await expect(page.locator('.set-picker-group')).toHaveCount(2)
  await expect(page.locator('.set-picker-grid img')).toHaveCount(20)
  await expect.poll(() => page.locator('.set-picker-grid img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true)

  const pickerLayout = await page.locator('.set-picker-dialog').evaluate((dialog) => {
    const rect = dialog.getBoundingClientRect()
    return {
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight,
      columns: getComputedStyle(dialog.querySelector('.set-picker-grid')).gridTemplateColumns.split(' ').length,
    }
  })
  expect(pickerLayout.top).toBeGreaterThanOrEqual(0)
  expect(pickerLayout.bottom).toBeLessThanOrEqual(pickerLayout.viewportHeight)
  expect(pickerLayout.columns).toBe(2)

  const chosenSetName = await page.locator('.set-picker-grid button').nth(1).locator('strong').textContent()
  await page.locator('.set-picker-grid button').nth(1).click()
  await expect(page.locator('.set-picker-dialog')).toHaveCount(0)
  await expect(page.locator('.gear-piece-main > strong')).toHaveText(Array(4).fill(chosenSetName.trim()))

  const mobilePieceSizes = await page.locator('.gear-piece-main > img').evaluateAll(images => images.map(image => ({
    width: image.getBoundingClientRect().width,
    height: image.getBoundingClientRect().height,
  })))
  expect(mobilePieceSizes.every(size => size.width <= 94 && size.height <= 94)).toBe(true)

  const layout = await page.evaluate(() => {
    const tabs = document.querySelector('.gear-tabs')
    const buttons = [...tabs.querySelectorAll('button')]
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      tabsScrollable: tabs.scrollWidth > tabs.clientWidth,
      tabColumns: getComputedStyle(tabs).gridTemplateColumns.split(' ').length,
      tabRows: new Set(buttons.map(button => Math.round(button.getBoundingClientRect().top))).size,
      visibleTabs: buttons.filter(button => button.getBoundingClientRect().width > 0).length,
    }
  })
  expect(layout.overflow).toBeLessThanOrEqual(1)
  expect(layout.tabsScrollable).toBe(false)
  expect(layout.tabColumns).toBe(2)
  expect(layout.tabRows).toBe(2)
  expect(layout.visibleTabs).toBe(4)
})
