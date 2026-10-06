import fs from 'node:fs'
import { expect, test } from '@playwright/test'

const days = JSON.parse(fs.readFileSync(new URL(
  '../../mobile/test/fixtures/api/release_schedule_api_vi.json', import.meta.url), 'utf8'))
const child = {
  id: 23, server: 'CN', date: '2026-10', datePrecision: 'month', characterId: '100320-urplus',
  bannerImage: '/Characters/Child Emperor (UR)/UR.png', isReturn: false, sortOrder: 1,
  overrideName: 'Đồng Đế', overrideNameVi: 'Đồng Đế', overrideNameEn: 'Child Emperor', overrideTier: 'UR+',
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const scenario of ['month-aware', 'legacy', 'failure']) {
    test(`${viewport.width}px Home ${scenario} response preserves date precision and fallback policy`, async ({ page }) => {
      await page.setViewportSize(viewport)
      const queries = []
      const pageErrors = []
      page.on('pageerror', error => pageErrors.push(error.message))
      await page.route('**/api/**', async route => {
        const request = route.request()
        expect(request.method()).toBe('GET')
        const url = new URL(request.url())
        if (url.pathname !== '/api/release-schedule') {
          return route.fulfill({ status: 200, json: [] })
        }
        queries.push(url)
        if (scenario === 'failure') return route.fulfill({ status: 400, json: { message: 'synthetic local failure' } })
        const rows = scenario === 'legacy' ? days : [...days, child]
        return route.fulfill({ status: 200, json: rows })
      })

      await page.goto('/')
      await expect.poll(() => queries.length).toBeGreaterThan(0)
      expect(queries[0].searchParams.get('includeMonthPrecision')).toBe('true')
      await page.getByRole('button', { name: /Tháng sau/ }).click()
      await expect(page.locator('.month-switcher strong')).toHaveText('10 / 2026')
      const card = page.locator('a.release-card[href="/character/100320-urplus"]')
      if (scenario === 'legacy') {
        await expect(page.locator('.release-content .release-card')).toHaveCount(3)
        await expect(card).toHaveCount(0)
      } else {
        await expect(page.locator('.release-content .release-card')).toHaveCount(4)
        await expect(card).toHaveCount(1)
        await expect(card).toContainText('Đồng Đế')
        await expect(card.locator('.card-meta')).toContainText('ĐANG CẬP NHẬT NGÀY · 10 / 2026')
        await expect(card).not.toContainText('01 / 10 / 2026')
        const image = card.locator('img').first()
        await expect(image).toHaveAttribute('src', /^\/Characters\/Full_Background\/Child_URplus\.png(?:\?|$)/)
        await card.scrollIntoViewIfNeeded()
        await expect.poll(() => image.evaluate(img => img.naturalWidth)).toBeGreaterThan(0)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      expect(pageErrors).toEqual([])
    })
  }
}
