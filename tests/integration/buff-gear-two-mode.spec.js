import { expect, test } from '@playwright/test'

const compatibility = (page, axis) => page.getByTestId(`compatibility-${axis}`)

const chooseCharacter = async (page, query) => {
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('searchbox').fill(query)
  await expect(dialog.locator('.character-picker-grid > button')).toHaveCount(1)
  await dialog.locator('.character-picker-grid > button').click()
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
  await expect(compatibility(page, 'level').locator('option[value="Special"]')).toHaveCount(0)
})

test('character mode locks identities, keeps mechanics usable, resets on change, and unlocks on clear', async ({ page }) => {
  await page.goto('/buff-gear')

  await page.getByRole('button', { name: 'Chọn nhân vật' }).click()
  await chooseCharacter(page, 'blacksperm-urplus')

  await expect(page.getByRole('heading', { name: 'Đang xem theo nhân vật' })).toBeVisible()
  await expect(compatibility(page, 'faction')).toHaveValue('Monster')
  await expect(compatibility(page, 'type')).toHaveValue('Grappler')
  await expect(compatibility(page, 'level')).toHaveValue('Dragon')
  await expect(compatibility(page, 'faction')).toBeDisabled()
  await expect(compatibility(page, 'type')).toBeDisabled()
  await expect(compatibility(page, 'level')).toBeDisabled()

  await page.getByTestId('mechanic-transformation').click()
  const firstTransformation = page.locator('.transform-row select').first()
  await firstTransformation.selectOption('ATK')
  await expect(firstTransformation).toHaveValue('ATK')

  await page.getByTestId('mechanic-advance').click()
  await page.getByRole('button', { name: 'Buff Gear Đỏ' }).click()
  await page.getByTestId('mechanic-purification').click()
  await expect(page.locator('.purification-editor')).toBeVisible()
  await page.locator('.purification-row select').first().selectOption('HP')

  await page.getByRole('button', { name: 'Đổi nhân vật' }).click()
  await chooseCharacter(page, '100013-urplus')

  await expect(compatibility(page, 'faction')).toHaveValue('Hero')
  await expect(compatibility(page, 'type')).toHaveValue('Duelist')
  await expect(compatibility(page, 'level')).toHaveValue('Class_SS')
  await expect(page.locator('.rarity-state')).toContainText('Buff Gear Vàng')
  await page.getByTestId('mechanic-transformation').click()
  await expect(page.locator('.transform-row select').first()).toHaveValue('')

  await page.getByRole('button', { name: 'Bỏ chọn nhân vật' }).click()
  await expect(page.getByRole('heading', { name: 'Chế độ khám phá' })).toBeVisible()
  await expect(compatibility(page, 'faction')).toBeEnabled()
  await expect(compatibility(page, 'type')).toBeEnabled()
  await expect(compatibility(page, 'level')).toBeEnabled()
  await expect(compatibility(page, 'faction')).toHaveValue('Hero')
  await expect(compatibility(page, 'type')).toHaveValue('Duelist')
  await expect(compatibility(page, 'level')).toHaveValue('Class_SS')

  await compatibility(page, 'faction').selectOption('Outlaw')
  await compatibility(page, 'type').selectOption('Hi-Tech')
  await compatibility(page, 'level').selectOption('Tiger')
  await expect(compatibility(page, 'faction')).toHaveValue('Outlaw')
  await expect(compatibility(page, 'type')).toHaveValue('Hi-Tech')
  await expect(compatibility(page, 'level')).toHaveValue('Tiger')
})
