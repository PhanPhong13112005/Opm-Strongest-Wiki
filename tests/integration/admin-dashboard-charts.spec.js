import { expect, test } from '@playwright/test'

const futureToken = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`
}

const installAdminSession = async page => {
  const session = {
    userId: 'admin-chart-test',
    username: 'admin-chart',
    displayName: 'Quản trị biểu đồ',
    role: 'Admin',
    balance: 0,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  }
  await page.addInitScript(({ token, storedSession }) => {
    sessionStorage.setItem('opmwiki.auth.token', token)
    sessionStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
  }, { token: futureToken('Admin'), storedSession: session })
  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
}

const assertNoHorizontalOverflow = async page => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

test('Admin overview turns live metrics into readable responsive charts', async ({ page }) => {
  await installAdminSession(page)
  await page.route('**/api/admin/dashboard*', route => route.fulfill({ json: {
    users: 18,
    staff: 2,
    admins: 1,
    eventComments: 24,
    forumTopics: 7,
    forumPosts: 31,
    pendingTopUps: 3,
    characters: 126,
    events: 12,
    releaseEntries: 8,
  } }))
  await page.route('**/api/admin/users', route => route.fulfill({ json: [] }))

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/admin/dashboard')

  await expect(page.getByRole('heading', { name: 'Tình hình hiện tại' })).toBeVisible()
  const summary = page.getByLabel('Chỉ số tổng quan')
  await expect(summary.getByText('21', { exact: true })).toBeVisible()
  await expect(summary.getByText('146', { exact: true })).toBeVisible()
  await expect(summary.getByText('62', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: /Biểu đồ nội dung: Nhân vật 126/ })).toBeVisible()
  await expect(page.getByRole('img', { name: /Biểu đồ cộng đồng: Bình luận sự kiện 24/ })).toBeVisible()
  await expect(page.getByRole('img', { name: /Biểu đồ vai trò: Người dùng 18, Nhân viên 2, Quản trị viên 1/ })).toBeVisible()

  const desktopTypography = await page.evaluate(() => ({
    navigation: parseFloat(getComputedStyle(document.querySelector('.role-portal__nav-copy strong')).fontSize),
    moduleDescription: parseFloat(getComputedStyle(document.querySelector('.admin-module p')).fontSize),
    chartLabel: parseFloat(getComputedStyle(document.querySelector('.bar-row__label span')).fontSize),
  }))
  expect(desktopTypography.navigation).toBeGreaterThanOrEqual(13)
  expect(desktopTypography.moduleDescription).toBeGreaterThanOrEqual(13)
  expect(desktopTypography.chartLabel).toBeGreaterThanOrEqual(13)
  await assertNoHorizontalOverflow(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Phân bố vai trò' })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})
