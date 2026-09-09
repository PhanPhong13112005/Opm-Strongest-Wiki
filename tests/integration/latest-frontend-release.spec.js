import { expect, test } from '@playwright/test'

const expectNoHorizontalOverflow = async page => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

test('character library uses optimized cards and bilingual search', async ({ page }) => {
  await page.goto('/characters')

  const search = page.getByRole('textbox', { name: 'Nhập tên nhân vật...' })
  await expect(search).toBeVisible()
  await search.fill('Vua Không Nhà')
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()

  const homelessCard = page.locator('a[href="/character/homeless-emperor-urplus"]')
  await expect(homelessCard).toBeVisible()
  await expect(homelessCard.locator('img[src="/DetailIcons/quality-URplus.webp"]')).toBeVisible()
  await expect(homelessCard.locator('img[src*="/Characters/card-icons/homeless-emperor-urplus-"]').first()).toBeVisible()

  await page.getByRole('button', { name: 'Language VI' }).click()
  const englishSearch = page.getByRole('textbox', { name: 'Search character name...' })
  await englishSearch.fill('Homeless Emperor')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('a[href="/character/homeless-emperor-urplus"]')).toBeVisible()

  const brokenImages = await page.locator('main img').evaluateAll(images => images
    .filter(image => image.complete && image.naturalWidth === 0)
    .map(image => image.getAttribute('src')))
  expect(brokenImages).toEqual([])
  await expectNoHorizontalOverflow(page)
})

test('Stats glossary filters verified bilingual entries', async ({ page }) => {
  await page.goto('/stats')

  await expect(page.getByRole('heading', { name: 'Chỉ Số', exact: true })).toBeVisible()
  const search = page.getByRole('searchbox')
  await search.fill('bạo kích')
  await expect(page.locator('.stat-card dt').filter({ hasText: 'Tỷ Lệ Bạo Kích' })).toBeVisible()

  await page.getByRole('button', { name: 'Language VI' }).click()
  await expect(page.getByRole('heading', { name: 'Stats', exact: true })).toBeVisible()
  await search.fill('Energy Gauge Points')
  await expect(page.locator('.stat-card dt').filter({ hasText: 'Energy Gauge Points' })).toBeVisible()
  await expect(page.locator('.stats-result-count strong')).toHaveText('1')
  await expectNoHorizontalOverflow(page)
})

test('Medals exposes curated Reviving Wind data and its exact inlay asset', async ({ page }) => {
  await page.goto('/medals')

  await page.getByRole('button', { name: 'Kỹ Năng Huy Chương', exact: true }).click()
  await page.getByRole('button', { name: 'Ngọn Gió Phục Sinh', exact: true }).click()
  await expect(page.getByText('Có 3 lỗ để khảm ngọc.', { exact: true })).toBeVisible()
  await expect(page.getByText('Tất cả tăng 10% ATK', { exact: true })).toBeVisible()
  await expect(page.getByText('Tất cả tăng 8% ST Đấu Trường', { exact: true })).toBeVisible()

  await page.getByText('Có 3 lỗ để khảm ngọc.', { exact: true }).click()
  const inlay = page.locator('img[src="/Feature/medals/inlay/3_lo.png"]')
  await expect(inlay).toBeVisible()
  await expect.poll(() => inlay.evaluate(image => image.naturalWidth)).toBeGreaterThan(0)
  await expectNoHorizontalOverflow(page)
})
