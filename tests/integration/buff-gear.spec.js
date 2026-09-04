import { expect, test } from '@playwright/test'

const assertNoHorizontalOverflow = async page => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
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
    await expect(page.getByRole('tab')).toHaveCount(3)
    await expect(page.getByTestId('buff-gear-workbench')).toBeVisible()
    await expect(page.locator('.plate-slot-item')).toHaveCount(3)
    await expect(page.locator('.slot-overview-card')).toHaveCount(3)
    const heroBox = await page.locator('.hero').boundingBox()
    expect(heroBox.height).toBeLessThan(viewport.height / 2)
    await assertNoHorizontalOverflow(page)

    await page.getByRole('tab').nth(1).click()
    await expect(page.locator('.stat-glossary-card')).toHaveCount(10)
    await expect(page.locator('.pagination-bar')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    await page.getByRole('tab').nth(2).click()
    await expect(page.locator('.upgrade-rule-grid .rule-card')).toHaveCount(3)
    await expect(page.locator('.advance-mat-card')).toHaveCount(3)
    await expect(page.locator('.material-tables-wrap .mat-table-card')).toHaveCount(2)
    await assertNoHorizontalOverflow(page)

    if (viewport.name === 'mobile') {
      const smallTargets = await page.locator('.tabs button').evaluateAll(nodes =>
        nodes.filter(node => node.getBoundingClientRect().height < 42).length)
      expect(smallTargets).toBe(0)
    }

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await assertNoHorizontalOverflow(page)
    expect(consoleErrors).toEqual([])
  })
}

test('Buff Gear workbench and guide load their optimized source images', async ({ page }) => {
  await page.goto('/buff-gear')
  const images = page.locator('[data-testid="buff-gear-workbench"] img, .slot-overview-card img')
  expect(await images.count()).toBeGreaterThanOrEqual(10)
  await expect.poll(async () => images.evaluateAll(nodes =>
    nodes.filter(image => image.complete && image.naturalWidth > 0).length,
  )).toBe(await images.count())
})

test('Buff Gear switches navigation, examples, and glossary copy to English', async ({ page }) => {
  await page.goto('/buff-gear')
  await page.getByRole('button', { name: 'Language VI' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Buff Gear' })).toBeVisible()
  await expect(page.getByRole('tab').nth(0)).toContainText('Overview')
  await expect(page.getByRole('tab').nth(1)).toContainText('Current In-Game Stats')
  await expect(page.getByTestId('compatibility-faction').locator('option[value="Hero"]')).toContainText('Hero')
  await page.getByRole('tab').nth(1).click()
  await expect(page.locator('.stat-glossary-card')).toHaveCount(10)
  await expect(page.locator('.stat-glossary-card').first()).toContainText(/Tenacity Boost|ATK/)
})

test('Buff Gear remains usable with reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/buff-gear')
  await expect(page.getByTestId('buff-gear-workbench')).toBeVisible()
  await expect(page.locator('.slot-overview-card')).toHaveCount(3)
  await assertNoHorizontalOverflow(page)
})
