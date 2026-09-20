import { expect, test } from '@playwright/test'

test('Buff Gear keeps the inspector and visual loadout side by side above its 900px breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 760 })
  await page.goto('/buff-gear')

  const controls = await page.locator('.wb-col-left').boundingBox()
  const preview = await page.locator('.wb-col-right').boundingBox()
  const visibleSelectors = await page.locator('.compat-strip select:visible').all()

  expect(controls).not.toBeNull()
  expect(preview).not.toBeNull()
  expect(preview.x).toBeGreaterThan(controls.x + controls.width - 2)
  expect(Math.abs(preview.y - controls.y)).toBeLessThan(3)
  expect(visibleSelectors).toHaveLength(3)

  const inspectorFits = await page.getByTestId('mechanic-inspector').evaluate(
    element => element.scrollWidth <= element.clientWidth,
  )
  expect(inspectorFits).toBe(true)

  for (const selector of visibleSelectors) {
    const box = await selector.boundingBox()
    expect(box.height).toBeLessThan(90)
  }

  const slots = await Promise.all([
    page.getByTestId('slot-faction').boundingBox(),
    page.getByTestId('slot-type').boundingBox(),
    page.getByTestId('slot-level').boundingBox(),
  ])
  expect(Math.abs(slots[0].y - slots[1].y)).toBeLessThan(5)
  expect(Math.abs(slots[0].y - slots[2].y)).toBeLessThan(5)
  for (const slot of slots) {
    expect(slot.height).toBeLessThan(205)
  }
})

test('Buff Gear mobile layout shows all three cards without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/buff-gear')

  await expect(page.getByTestId('slot-faction')).toBeVisible()
  await expect(page.getByTestId('slot-type')).toBeVisible()
  await expect(page.getByTestId('slot-level')).toBeVisible()
  const slots = await Promise.all([
    page.getByTestId('slot-faction').boundingBox(),
    page.getByTestId('slot-type').boundingBox(),
    page.getByTestId('slot-level').boundingBox(),
  ])
  expect(Math.abs(slots[0].y - slots[1].y)).toBeLessThan(5)
  expect(Math.abs(slots[0].y - slots[2].y)).toBeLessThan(5)
  expect(slots[2].width).toBeLessThan(slots[0].width + 4)

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})
