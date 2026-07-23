import { expect, test } from '@playwright/test'

const futureToken = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`
}

const installSession = async (page, role, overrides = {}) => {
  const session = {
    userId: `${role.toLowerCase()}-visual-test`,
    username: role.toLowerCase(),
    displayName: `${role} Visual Test`,
    role,
    balance: 125000,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    ...overrides,
  }

  await page.addInitScript(({ token, storedSession }) => {
    sessionStorage.setItem('opmwiki.auth.token', token)
    sessionStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
  }, { token: futureToken(role), storedSession: session })

  return session
}

const assertNoHorizontalOverflow = async page => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

test('User portal presents clear actions without horizontal overflow', async ({ page }) => {
  const session = await installSession(page, 'User', { displayName: 'Người chơi thử nghiệm' })
  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))

  await page.goto('/account')

  await expect(page.getByRole('heading', { name: 'Trang cá nhân' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bạn muốn làm gì hôm nay?' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tham gia diễn đàn/ })).toBeVisible()
  await expect(page.getByText('125.000')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('User can prepare a Coupon order with UID, server, quantity, and total price', async ({ page }) => {
  await installSession(page, 'User', { displayName: 'Coupon Test' })
  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [] }))

  await page.goto('/coupon-top-up')

  await expect(page.getByRole('heading', { name: 'Nạp Coupon', exact: true })).toBeVisible()
  await page.getByLabel('UID (User ID)').fill('3107453')
  await page.getByLabel('Server (SID)').fill('310170')
  await page.getByRole('button', { name: 'Tăng số lượng' }).click()
  await expect(page.getByText('12 Coupon')).toBeVisible()
  await expect(page.getByRole('button', { name: /Gửi yêu cầu · 25\.780đ/ })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Staff portal makes moderation queues easy to scan on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'Staff', { displayName: 'Nhân viên thử nghiệm' })
  await page.route('**/api/staff/top-ups?status=Pending', route => route.fulfill({ json: [{
    id: 17,
    displayName: 'Người chơi A',
    amount: 200000,
    provider: 'Viettel',
    referenceCode: 'TEST-17',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  }] }))
  await page.route('**/api/moderation/comments', route => route.fulfill({ json: [{
    id: 9,
    eventId: 'event-test',
    displayName: 'Người chơi B',
    content: 'Bình luận cần kiểm tra.',
    createdAt: new Date().toISOString(),
  }] }))

  await page.goto('/staff')

  await expect(page.getByRole('heading', { name: 'Trung tâm kiểm duyệt' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Yêu cầu nạp & Coupon' })).toBeVisible()
  await expect(page.getByText('200.000đ')).toBeVisible()
  await expect(page.getByText('Bình luận cần kiểm tra.')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Admin portal groups live metrics, tools, and role management', async ({ page }) => {
  await installSession(page, 'Admin', { displayName: 'Quản trị thử nghiệm' })
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
  await page.route('**/api/admin/users*', route => route.fulfill({ json: [{
    id: 'visual-user',
    username: 'visual-user',
    displayName: 'Thành viên trực quan',
    balance: 50000,
    role: 'User',
    createdAt: new Date().toISOString(),
  }] }))

  await page.goto('/admin/dashboard')

  await expect(page.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tình hình hiện tại' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible()
  await expect(page.getByText('Thành viên trực quan')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

for (const account of [
  { role: 'User', label: 'Vào Diễn đàn', path: '/forum' },
  { role: 'Staff', label: 'Vào trang Nhân viên', path: '/staff' },
  { role: 'Admin', label: 'Vào trang Quản trị', path: '/admin/dashboard' },
]) {
  test(`${account.role} returns home after login and opens the correct role menu`, async ({ page }) => {
    const session = {
      userId: `${account.role.toLowerCase()}-login-test`,
      username: account.role.toLowerCase(),
      displayName: `${account.role} Test`,
      role: account.role,
      balance: 0,
      accessToken: futureToken(account.role),
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    }

    await page.route('**/api/auth/login', route => route.fulfill({ json: session }))
    await page.goto('/login')
    await page.getByLabel('Tên đăng nhập').fill(account.role.toLowerCase())
    await page.locator('input[autocomplete="current-password"]').fill('password-test')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()

    await expect(page).toHaveURL('/')
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('opmwiki.auth.session') || 'null')?.role || null)).toBe(account.role)
    await page.locator('.account-control--signed-in').click()
    await expect(page.getByRole('menuitem', { name: new RegExp(account.label) })).toHaveAttribute('href', account.path)
  })
}
