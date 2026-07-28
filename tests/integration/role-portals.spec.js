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

test('Public mobile menu exposes every wiki feature and requires login only when ordering', async ({ page }) => {
  const session = {
    userId: 'public-top-up-test',
    username: 'public-top-up',
    displayName: 'Public Top-up Test',
    role: 'User',
    balance: 0,
    accessToken: futureToken('User'),
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  }
  let topUpHistoryReads = 0

  await page.route('**/api/auth/login', route => route.fulfill({ json: session }))
  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
  await page.route('**/api/top-ups/mine', route => {
    topUpHistoryReads += 1
    return route.fulfill({ json: [] })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Mở menu' }).click()
  const mobileMenu = page.locator('.mobile-command-menu')
  const expectedFeaturePaths = [
    '/characters',
    '/mastery',
    '/core-lab',
    '/medals',
    '/tactics',
    '/backgear',
    '/keepsakes',
    '/insignias',
    '/events',
    '/top-up',
  ]
  await expect(mobileMenu.getByRole('link')).toHaveCount(expectedFeaturePaths.length)
  for (const featurePath of expectedFeaturePaths) {
    await expect(mobileMenu.locator(`a[href="${featurePath}"]`)).toBeVisible()
  }

  const topUpLink = page.locator('.mobile-command-menu').getByRole('link', { name: 'Nạp thẻ', exact: true })
  await expect(topUpLink).toBeVisible()
  await topUpLink.click()

  await expect(page).toHaveURL('/top-up')
  await expect(page.getByRole('heading', { name: 'Nạp One Punch Man: The Strongest' })).toBeVisible()
  await expect(page.getByText('Gói 6 Coupon')).toBeVisible()
  expect(topUpHistoryReads).toBe(0)
  await page.getByRole('button', { name: /Đăng nhập để đặt hàng · 13\.000đ/ }).click()

  await expect(page).toHaveURL(/\/login\?redirect=\/top-up$/)
  await page.getByLabel('Tên đăng nhập').fill(session.username)
  await page.locator('input[autocomplete="current-password"]').fill('password-test')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()

  await expect(page).toHaveURL('/top-up')
  await assertNoHorizontalOverflow(page)
})

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

  await page.goto('/top-up')

  await expect(page.getByRole('heading', { name: 'Nạp One Punch Man: The Strongest' })).toBeVisible()
  await page.getByLabel('UID (User ID)').fill('3107453')
  await page.getByLabel('Server (SID)').fill('310170')
  await page.getByRole('button', { name: 'Tăng số lượng' }).click()
  await expect(page.getByText('12 Coupon')).toBeVisible()
  await expect(page.getByRole('button', { name: /Đặt hàng · 26\.000đ/ })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('User can pay 13.000đ on mobile and return to Coupon after automatic bank confirmation', async ({ page }) => {
  const session = await installSession(page, 'User', {
    displayName: 'Bank Top-up Test',
    balance: 150000,
  })
  let submitted
  let paymentFetches = 0
  const paymentPayload = status => ({
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    topUp: {
      id: 22,
      amount: 13000,
      provider: 'Bank transfer',
      referenceCode: 'OPM123456789ABC',
      status,
      createdAt: new Date().toISOString(),
    },
    bank: {
      bankId: '970436',
      accountNumber: '1234567890',
      accountName: 'OPM WIKI TEST',
    },
    qrUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
  })

  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [] }))
  await page.route('**/api/top-ups/bank-qr', async route => {
    submitted = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      json: paymentPayload('Pending'),
    })
  })
  await page.route('**/api/top-ups/22/bank-qr', async route => {
    paymentFetches += 1
    await route.fulfill({ json: paymentPayload(paymentFetches >= 2 ? 'Paid' : 'Pending') })
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/top-up?tab=bank')

  await expect(page.getByRole('tab', { name: /Nạp bằng ngân hàng/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('heading', { name: 'Nạp bằng ngân hàng' })).toBeVisible()
  await page.getByRole('button', { name: '13.000đ', exact: true }).click()
  await page.getByRole('button', { name: 'Tạo mã QR', exact: true }).click()

  await expect(page).toHaveURL('/top-up/payment/22')
  await expect(page.getByRole('heading', { name: 'Quét mã để thanh toán' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Mã QR thanh toán 13.000đ' })).toBeVisible()
  await expect(page.getByText('OPM123456789ABC')).toBeVisible()
  await expect(page.getByText('1234567890')).toBeVisible()
  await expect(page.getByText(/Còn 0[45]:\d{2}/)).toBeVisible()
  expect(submitted).toEqual({ amount: 13000 })
  await expect(page.getByRole('button', { name: 'Xác nhận đã thanh toán' })).toHaveCount(0)
  await assertNoHorizontalOverflow(page)

  await expect(page.getByRole('heading', { name: 'Nạp thành công' })).toBeVisible({ timeout: 6000 })
  await expect(page).toHaveURL('/top-up', { timeout: 6000 })
  await expect(page.getByRole('heading', { name: 'Nạp One Punch Man: The Strongest' })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('User can open a cancelled bank payment from history and create a replacement QR', async ({ page }) => {
  const session = await installSession(page, 'User', {
    displayName: 'Bank History Test',
    balance: 150000,
  })
  const createdAt = new Date().toISOString()
  const topUp = (id, status) => ({
    id,
    amount: 13000,
    provider: 'Bank transfer',
    referenceCode: `OPM${id}HISTORY`,
    status,
    createdAt,
  })
  const paymentPayload = (id, status) => ({
    topUp: topUp(id, status),
    bank: {
      bankId: '970436',
      accountNumber: '1234567890',
      accountName: 'OPM WIKI TEST',
    },
    qrUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  })

  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [topUp(33, 'Cancelled')] }))
  await page.route(/\/api\/top-ups\/\d+\/bank-qr$/, route => {
    const id = Number(/\/(\d+)\/bank-qr$/.exec(route.request().url())[1])
    return route.fulfill({ json: paymentPayload(id, id === 33 ? 'Cancelled' : 'Pending') })
  })
  await page.route('**/api/top-ups/bank-qr', route => route.fulfill({
    status: 201,
    json: paymentPayload(34, 'Pending'),
  }))

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/top-up?tab=bank')
  await page.getByRole('link', { name: 'Xem chi tiết' }).click()

  await expect(page).toHaveURL('/top-up/payment/33')
  await expect(page.getByRole('heading', { name: 'Bạn đã hủy thanh toán' })).toBeVisible()
  await page.getByRole('button', { name: 'Thanh toán lại' }).click()

  await expect(page).toHaveURL('/top-up/payment/34')
  await expect(page.getByRole('heading', { name: 'Quét mã để thanh toán' })).toBeVisible()
  await expect(page.getByText('OPM34HISTORY')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('User can submit a validated Coupon order', async ({ page }) => {
  const session = await installSession(page, 'User', {
    displayName: 'Top-up Test',
    balance: 150000,
  })
  let submitted

  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [] }))
  await page.route('**/api/top-ups', async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    submitted = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      json: {
        id: 21,
        ...submitted,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      },
    })
  })

  await page.goto('/top-up')

  await expect(page.getByRole('heading', { name: 'Nạp One Punch Man: The Strongest' })).toBeVisible()
  await page.getByLabel('UID (User ID)').fill('15253771_310765')
  await page.getByLabel('UID (User ID)').blur()
  await expect(page.getByLabel('Server (SID)')).toHaveValue('310765')
  await page.getByRole('button', { name: /Đặt hàng · 13\.000đ/ }).click()

  await expect(page.getByText(/Đã gửi yêu cầu nạp 6 Coupon/)).toBeVisible()
  expect(submitted.provider).toBe('Coupon Order')
  expect(submitted.referenceCode).toMatch(/^UID:15253771\|SID:310765\|CP:6\|QTY:1\|/)
  expect(submitted.amount).toBe(13000)
  await assertNoHorizontalOverflow(page)
})

test('Staff portal makes moderation queues easy to scan on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'Staff', { displayName: 'Nhân viên thử nghiệm' })
  await page.route('**/api/moderation/comments', route => route.fulfill({ json: [{
    id: 9,
    eventId: 'event-test',
    displayName: 'Người chơi B',
    content: 'Bình luận cần kiểm tra.',
    createdAt: new Date().toISOString(),
  }] }))

  await page.goto('/staff')

  await expect(page.getByRole('heading', { name: 'Trung tâm kiểm duyệt' })).toBeVisible()
  await expect(page.getByText(/Thanh toán được hệ thống đối soát tự động/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Yêu cầu nạp & Coupon' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Duyệt|Đã nạp/ })).toHaveCount(0)
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
