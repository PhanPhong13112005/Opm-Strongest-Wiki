import { expect, test } from '@playwright/test'

const futureToken = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`
}

const installAdminSession = async page => {
  const session = {
    userId: 'admin-workspace-test',
    username: 'admin-workspace',
    displayName: 'Quản trị nội dung',
    role: 'Admin',
    balance: 0,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  }
  await page.addInitScript(({ token, storedSession }) => {
    localStorage.setItem('opmwiki.auth.token', token)
    localStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
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

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installAdminSession(page)
  await page.route(/\/api\/admin\/characters(?:\?.*)?$/, route => route.fulfill({ json: {
    items: [{
      id: 'qa-hero',
      nameVi: 'Anh hùng kiểm thử',
      nameEn: 'QA Hero',
      tier: 'UR',
      factionVi: 'Anh hùng',
      typeVi: 'Vũ trang',
      imageUrl: '/placeholder-character.svg',
      keepsakeIcon: '',
      baseStats: {},
      pvpStats: {},
    }],
    totalPages: 1,
    totalCount: 1,
  } }))
  await page.route('**/api/admin/events', route => route.fulfill({ json: [{
    id: 'qa-event',
    titleVi: 'Sự kiện kiểm thử',
    titleEn: 'QA Event',
    descriptionVi: '',
    descriptionEn: '',
    category: 'main',
    imageUrl: '/placeholder-event.svg',
    detailImages: [],
    sectionsJson: '[]',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
  }] }))
  await page.route('**/api/admin/releases', route => route.fulfill({ json: [{
    id: 1,
    server: 'SEA',
    date: '2026-07-29',
    characterId: 'qa-hero',
    bannerImage: '/placeholder-character.svg',
    isReturn: false,
    sortOrder: 1,
  }] }))
})

test('Admin character workspace keeps navigation and editor usable on mobile', async ({ page }) => {
  await page.goto('/admin/characters')

  await expect(page.getByRole('heading', { name: 'Nhân vật & Kỷ vật' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Nhân vật/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('Anh hùng kiểm thử')).toBeVisible()
  await page.getByRole('button', { name: '+ Thêm nhân vật' }).click()
  await expect(page.getByRole('heading', { name: 'Thêm nhân vật' })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Admin event workspace exposes its responsive editor and active navigation', async ({ page }) => {
  await page.goto('/admin/events')

  await expect(page.getByRole('heading', { name: 'Quản lý sự kiện' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Sự kiện/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('Sự kiện kiểm thử')).toBeVisible()
  await page.getByRole('button', { name: '+ Thêm sự kiện' }).click()
  await expect(page.getByRole('heading', { name: 'Tạo sự kiện mới' })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Admin release workspace presents timeline metrics and editor without overflow', async ({ page }) => {
  await page.goto('/admin/releases')

  await expect(page.getByRole('heading', { name: 'Lịch ra mắt nhân vật' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Lịch ra mắt/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('qa-hero', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '+ Thêm mốc' }).click()
  await expect(page.getByRole('heading', { name: 'Tạo mốc ra mắt mới' })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})
