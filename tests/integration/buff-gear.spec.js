import { expect, test } from '@playwright/test'

const assertNoHorizontalOverflow = async page => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

const viewports = [
  { name: 'desktop', width: 1440, height: 900, heroMax: 300 },
  { name: 'tablet', width: 820, height: 1180, heroMax: 300 },
  { name: 'mobile', width: 390, height: 844, heroMax: 275 },
]

for (const viewport of viewports) {
  test('Buff Gear follows the beginner learning flow on ' + viewport.name, async ({ page }) => {
    const consoleErrors = []
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await page.setViewportSize(viewport)
    await page.goto('/buff-gear')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Thẻ Bổ Trợ|Buff Gear/)
    await expect(page.getByRole('tab')).toHaveCount(4)
    await expect(page.locator('.character-map')).toBeVisible()
    await expect(page.locator('.slot-card')).toHaveCount(3)
    await expect(page.locator('.hp-lines article')).toHaveCount(3)
    await expect(page.locator('.anatomy-composition')).toBeVisible()
    const heroBox = await page.locator('.hero').boundingBox()
    expect(heroBox.height).toBeLessThan(viewport.heroMax)
    await assertNoHorizontalOverflow(page)

    await page.getByRole('tab').nth(1).click()
    await expect(page.locator('.comparison-card')).toHaveCount(3)
    await expect(page.locator('.stat-matrix')).toBeVisible()
    await page.locator('.stat-matrix summary').click()
    await expect(page.locator('.matrix-system')).toHaveCount(3)
    await assertNoHorizontalOverflow(page)

    await page.getByRole('tab').nth(2).click()
    await expect(page.locator('.phase-orange')).toBeVisible()
    await expect(page.locator('.advance-gate')).toBeVisible()
    await expect(page.locator('.phase-red')).toBeVisible()
    await expect(page.locator('.red-branches button')).toHaveCount(2)
    await page.locator('.red-branches button').last().click()
    await expect(page.locator('#stage-refine')).toHaveClass(/open/)
    await assertNoHorizontalOverflow(page)

    await page.getByRole('tab').nth(3).click()
    await expect(page.locator('.skill-card')).toHaveCount(22)
    await expect(page.locator('.confidence-badge')).toHaveCount(1)
    await page.getByRole('button', { name: /Tấn công|Offense/ }).click()
    const offenseCount = await page.locator('.skill-card').count()
    expect(offenseCount).toBeGreaterThan(0)
    expect(offenseCount).toBeLessThan(22)
    await assertNoHorizontalOverflow(page)

    if (viewport.name === 'mobile') {
      const smallTargets = await page.locator('.tabs button, .category-filter button').evaluateAll(nodes =>
        nodes.filter(node => node.getBoundingClientRect().height < 44).length)
      expect(smallTargets).toBe(0)
    }

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    expect(consoleErrors).toEqual([])
  })
}

test('Buff Gear source images are deferred and all optimized assets load', async ({ page }) => {
  await page.goto('/buff-gear')
  await expect(page.locator('.asset-grid img')).toHaveCount(0)
  await page.locator('.asset-audit button').click()
  await expect(page.locator('.asset-grid img')).toHaveCount(16)
  await expect.poll(async () => page.locator('.asset-grid img').evaluateAll(images =>
    images.filter(image => image.complete && image.naturalWidth > 0).length,
  )).toBe(16)
})

test('Buff Gear switches navigation, examples, and glossary copy to English', async ({ page }) => {
  await page.goto('/buff-gear')
  await page.getByRole('button', { name: 'Language VI' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Buff Gear' })).toBeVisible()
  await expect(page.getByRole('tab').nth(0)).toContainText('Overview')
  await expect(page.getByRole('tab').nth(1)).toContainText('3 gear types')
  await expect(page.locator('.slot-card').first()).toContainText('Hero')
  await page.getByRole('tab').nth(3).click()
  await expect(page.getByRole('heading', { name: '22 Skill Stat glossary' })).toBeVisible()
  await expect(page.locator('.skill-card')).toHaveCount(22)
  await expect(page.locator('.skill-card').first()).toContainText('Tenacity Boost')
})

test('Buff Gear honors reduced motion without losing content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/buff-gear')
  const motion = await page.evaluate(() => ({
    hero: getComputedStyle(document.querySelector('.hero'), '::before').animationName,
    panel: getComputedStyle(document.querySelector('.panel')).animationName,
  }))
  expect(motion).toEqual({ hero: 'none', panel: 'none' })
  await expect(page.locator('.character-map')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})