import { expect, test } from '@playwright/test'

const compatibility = (page, axis) => page.getByTestId(`compatibility-${axis}`)

const chooseCharacter = async (page, query) => {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill(query)
  await expect(dialog.locator('.character-picker-grid-scroll > button')).toHaveCount(1)
  await dialog.locator('.character-picker-grid-scroll > button').click()
}

test('Buff Gear manual mode accepts arbitrary source-backed compatibility', async ({ page }) => {
  await page.goto('/buff-gear')

  await expect(page.getByRole('heading', { name: 'Chế độ khám phá' })).toBeVisible()
  await expect(compatibility(page, 'faction')).toBeEnabled()
  await expect(compatibility(page, 'type')).toBeEnabled()
  await expect(compatibility(page, 'level')).toBeEnabled()

  await compatibility(page, 'faction').selectOption('Monster')
  await compatibility(page, 'type').selectOption('Esper')
  await compatibility(page, 'level').selectOption('Dragon')

  await expect(compatibility(page, 'faction')).toHaveValue('Monster')
  await expect(compatibility(page, 'type')).toHaveValue('Esper')
  await expect(compatibility(page, 'level')).toHaveValue('Dragon')
  await expect(compatibility(page, 'level').locator('option[value="Special"]')).toHaveCount(1)
})

test('character mode locks identities, keeps mechanics usable, resets on change, and unlocks on clear', async ({ page }) => {
  await page.goto('/buff-gear')

  await page.locator('.wb-header-actions .btn-hero-action').click()
  await chooseCharacter(page, 'blacksperm-urplus')

  await expect(page.getByRole('heading', { name: 'Đang xem theo nhân vật' })).toBeVisible()
  await expect(compatibility(page, 'faction')).toHaveValue('Monster')
  await expect(compatibility(page, 'type')).toHaveValue('Grappler')
  await expect(compatibility(page, 'level')).toHaveValue('Dragon')
  await expect(compatibility(page, 'faction')).toBeDisabled()
  await expect(compatibility(page, 'type')).toBeDisabled()
  await expect(compatibility(page, 'level')).toBeDisabled()

  await page.getByTestId('mechanic-transformation').click()
  const firstTransformation = page.locator('.transform-ingame-select').first()
  await firstTransformation.selectOption('ATK')
  await expect(firstTransformation).toHaveValue('ATK')

  await page.getByTestId('mechanic-advance').click()
  await page.locator('.rarity-switch-btn.is-red-btn').click()
  await page.getByTestId('mechanic-purification').click()
  await expect(page.locator('.purify-dialog-box')).toBeVisible()

  await page.locator('.wb-header-actions .btn-hero-action').click()
  await chooseCharacter(page, '100013-urplus')

  await expect(compatibility(page, 'faction')).toHaveValue('Hero')
  await expect(compatibility(page, 'type')).toHaveValue('Duelist')
  await expect(compatibility(page, 'level')).toHaveValue('Class_S')
  await expect(page.locator('.rarity-switch-btn.is-gold-btn')).toHaveClass(/is-active/)
  await page.getByTestId('mechanic-transformation').click()
  await expect(page.locator('.transform-ingame-select').first()).toHaveValue('')

  await page.locator('.wb-header-actions .btn-clear-action').click()
  await expect(page.getByRole('heading', { name: 'Chế độ khám phá' })).toBeVisible()
  await expect(compatibility(page, 'faction')).toBeEnabled()
  await expect(compatibility(page, 'type')).toBeEnabled()
  await expect(compatibility(page, 'level')).toBeEnabled()
  await expect(compatibility(page, 'faction')).toHaveValue('Hero')
  await expect(compatibility(page, 'type')).toHaveValue('Duelist')
  await expect(compatibility(page, 'level')).toHaveValue('Class_S')

  await compatibility(page, 'faction').selectOption('Monster')
  await compatibility(page, 'type').selectOption('Hi-Tech')
  await compatibility(page, 'level').selectOption('Tiger')
  await expect(compatibility(page, 'faction')).toHaveValue('Monster')
  await expect(compatibility(page, 'type')).toHaveValue('Hi-Tech')
  await expect(compatibility(page, 'level')).toHaveValue('Tiger')
})
