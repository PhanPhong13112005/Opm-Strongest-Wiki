import { expect, test } from '@playwright/test'

test('Buff Gear workbench uses verified card art and source material icons', async ({ page }) => {
  await page.goto('/buff-gear')

  const factionSlot = page.getByTestId('slot-faction')
  const typeSlot = page.getByTestId('slot-type')
  const levelSlot = page.getByTestId('slot-level')

  await expect(factionSlot.locator('.slot-art img')).toHaveAttribute('src', /equipcard_1_1\.webp$/)
  await expect(typeSlot.locator('.slot-art img')).toHaveAttribute('src', /equipcard_2_1\.webp$/)
  await expect(levelSlot.locator('.slot-art img')).toHaveAttribute('src', /equipcard_3_1\.webp$/)

  await factionSlot.click()
  await page.getByTestId('compatibility-faction').selectOption('Monster')
  await typeSlot.click()
  await page.getByTestId('compatibility-type').selectOption('Grappler')
  await levelSlot.click()
  await page.getByTestId('compatibility-level').selectOption('Dragon')

  await expect(factionSlot.locator('.slot-art img')).toHaveAttribute('src', /equipcard_1_2\.webp$/)
  await expect(typeSlot.locator('.slot-art img')).toHaveAttribute('src', /equipcard_2_2\.webp$/)
  await expect(levelSlot.locator('.slot-art img')).toHaveAttribute('src', /equipcard_3_5\.webp$/)
  await factionSlot.click()
  await expect(page.locator('.inspector-thumb img')).toHaveAttribute('src', /equipcard_1_2\.webp$/)

  await expect(page.locator('.material-list img')).toHaveCount(2)
  await expect(page.locator('.material-list img').nth(0)).toHaveAttribute('src', /Item_213002\.webp$/)
  await expect(page.locator('.material-list img').nth(1)).toHaveAttribute('src', /Item_213003\.webp$/)
})

test('Special Buff Gear uses its verified source artwork', async ({ page }) => {
  await page.goto('/buff-gear')
  await page.getByTestId('slot-level').click()
  await page.getByTestId('compatibility-level').selectOption('Special')

  const levelArt = page.getByTestId('slot-level').locator('.slot-art')
  await expect(levelArt.locator('img')).toHaveAttribute('src', /equipcard_3_8\.webp$/)
})
