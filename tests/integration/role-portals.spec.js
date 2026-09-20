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
    localStorage.setItem('opmwiki.auth.token', token)
    localStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
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

test('Public mobile menu exposes every wiki feature and the passive top-up maintenance route', async ({ page }) => {
  let topUpHistoryReads = 0

  await page.route('**/api/top-ups/mine', route => {
    topUpHistoryReads += 1
    return route.fulfill({ json: [] })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Mở menu' }).click()
  const mobileMenu = page.locator('.mobile-command-menu')
  const mobileSections = mobileMenu.locator('.mobile-command-menu__toggle')
  await expect(mobileSections).toHaveCount(2)
  await mobileSections.nth(0).click()
  await mobileSections.nth(1).click()
  const expectedFeaturePaths = [
    '/characters',
    '/tier-ranking',
    '/mastery',
    '/core-lab',
    '/core-refinement',
    '/medals',
    '/tactics',
    '/talents',
    '/backgear',
    '/equipment',
    '/buff-gear',
    '/stats',
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
  await expect(page.getByRole('heading', { name: 'Nạp thẻ đang bảo trì' })).toBeVisible()
  await expect(page.getByText(/Tạm thời không tạo đơn hoặc chuyển khoản/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/')
  await expect(page.getByRole('link', { name: 'Xem thư viện nhân vật' })).toHaveAttribute('href', '/characters')
  expect(topUpHistoryReads).toBe(0)
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

test('User session is cleared when the backend rejects an inactive or stale account token', async ({ page }) => {
  await installSession(page, 'User', { displayName: 'Tài khoản bị khóa' })
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 401,
    json: { message: 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.' },
  }))

  await page.goto('/account')

  await expect.poll(() => page.evaluate(() => localStorage.getItem('opmwiki.auth.session'))).toBeNull()
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible()
})

test.describe.skip('retired public top-up UI contract', () => {
// Kept as executable history for a possible service reopening. The active
// contract is the passive maintenance page above; backend payment contracts
// remain covered by the Node/PGlite suites without making real transactions.
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

test('User can review Coupon outcomes and Admin feedback on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'User', { displayName: 'Coupon History Test' })
  const createdAt = '2026-07-28T03:00:00.000Z'
  const reviewedAt = '2026-07-28T04:00:00.000Z'

  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [
    {
      id: 51,
      provider: 'Coupon Order',
      referenceCode: 'UID:15253771|SID:310765|CP:6|QTY:2|APPROVED',
      amount: 26000,
      status: 'Approved',
      staffNote: 'Đã nạp đủ Coupon.',
      createdAt,
      reviewedAt,
    },
    {
      id: 52,
      provider: 'Coupon Order',
      referenceCode: 'UID:3107453|SID:310170|CP:6|QTY:1|REJECTED',
      amount: 13000,
      status: 'Rejected',
      staffNote: 'Server không tồn tại.',
      createdAt,
      reviewedAt,
    },
  ] }))

  await page.goto('/top-up')

  const approved = page.locator('.coupon-history__list article').filter({ hasText: '15253771' })
  await expect(approved).toContainText('Server 310765')
  await expect(approved).toContainText('12 Coupon')
  await expect(approved).toContainText('Đã hoàn tất')
  await expect(approved).toContainText('Đã nạp đủ Coupon.')
  await expect(approved).toContainText('Xử lý lúc')

  const rejected = page.locator('.coupon-history__list article').filter({ hasText: '3107453' })
  await expect(rejected).toContainText('Từ chối')
  await expect(rejected).toContainText('Server không tồn tại.')
  await assertNoHorizontalOverflow(page)
})

test('User can cancel a pending Coupon order on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'User', { displayName: 'Coupon Cancellation Test' })
  const order = {
    id: 53,
    provider: 'Coupon Order',
    referenceCode: 'UID:15253771|SID:310765|CP:6|QTY:1|CANCEL53',
    amount: 13000,
    status: 'Pending',
    staffNote: '',
    createdAt: '2026-07-28T03:00:00.000Z',
    reviewedAt: null,
  }
  let submitted

  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [order] }))
  await page.route(/\/api\/top-ups\/53\/coupon-order$/, async route => {
    submitted = route.request().postDataJSON()
    order.status = 'Cancelled'
    await route.fulfill({ json: order })
  })

  await page.goto('/top-up')
  await expect(page.getByRole('button', { name: 'Hủy đơn #53' })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Hủy đơn #53' }).click()

  await expect(page.getByText('Đã hủy đơn Coupon #53.')).toBeVisible()
  await expect(page.locator('.coupon-history__list article')).toContainText('Đã hủy')
  await expect(page.getByRole('button', { name: 'Hủy đơn #53' })).toHaveCount(0)
  expect(submitted).toEqual({ action: 'cancel' })
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

test('Coupon retry reuses the same reference after a timed-out response', async ({ page }) => {
  const session = await installSession(page, 'User', {
    displayName: 'Coupon Retry Test',
    balance: 150000,
  })
  const submissions = []
  let recordedOrder

  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
  await page.route('**/api/top-ups/mine', route => route.fulfill({ json: [] }))
  await page.route(/\/api\/top-ups$/, async route => {
    if (route.request().method() !== 'POST') return route.fallback()

    const submitted = route.request().postDataJSON()
    submissions.push(submitted)
    if (submissions.length === 1) {
      recordedOrder = {
        id: 61,
        ...submitted,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      }
      return route.abort('timedout')
    }

    return route.fulfill({ status: 200, json: recordedOrder })
  })

  await page.goto('/top-up')
  await page.getByLabel('UID (User ID)').fill('15253771_310765')
  await page.getByLabel('UID (User ID)').blur()
  await page.getByRole('button', { name: /Đặt hàng · 13\.000đ/ }).click()

  await expect(page.locator('.coupon-alert--error')).toBeVisible()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('opmwiki.coupon.pending-request'))).not.toBeNull()

  await page.getByRole('button', { name: /Đặt hàng · 13\.000đ/ }).click()

  await expect(page.locator('.coupon-alert--success')).toBeVisible()
  expect(submissions).toHaveLength(2)
  expect(submissions[1].referenceCode).toBe(submissions[0].referenceCode)
  expect(submissions[0].referenceCode).toMatch(/\|[A-F0-9]{32}$/)
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('opmwiki.coupon.pending-request'))).toBeNull()
})
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
  await expect(page.getByRole('button', { name: /Bình Luận Sự Kiện/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Hàng Đợi Báo Cáo/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Kiểm Duyệt Diễn Đàn/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Yêu cầu nạp & Coupon' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Duyệt đơn|Đã nạp/ })).toHaveCount(0)
  await expect(page.getByText('Bình luận cần kiểm tra.')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Admin portal groups live metrics, tools, and account access management', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'Admin', { displayName: 'Quản trị thử nghiệm' })
  let statusPayload
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
  const visualUser = {
    id: 'visual-user',
    username: 'visual-user',
    displayName: 'Thành viên trực quan',
    balance: 50000,
    role: 'User',
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  await page.route(/\/api\/admin\/users(?:\/.*)?$/, route => {
    if (route.request().method() === 'PUT') {
      statusPayload = route.request().postDataJSON()
      return route.fulfill({ json: { ...visualUser, ...statusPayload } })
    }
    return route.fulfill({ json: [visualUser] })
  })

  await page.goto('/admin/dashboard')

  await expect(page.getByRole('heading', { name: 'Tổng quan hệ thống' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tình hình hiện tại' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quản lý người dùng' })).toBeVisible()
  await expect(page.getByText('Thành viên trực quan')).toBeVisible()
  await expect(page.getByRole('table').getByText('Đang hoạt động', { exact: true })).toBeVisible()
  await page.evaluate(() => { window.confirm = () => true })
  await page.getByRole('button', { name: 'Vô hiệu hóa tài khoản Thành viên trực quan' }).click()
  await expect.poll(() => statusPayload).toEqual({ isActive: false })
  await expect(page.getByRole('table').getByText('Đã vô hiệu hóa', { exact: true })).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Admin can review a Coupon order from the role portal on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'Admin', { displayName: 'Quản trị Coupon' })
  let reviewedPayload
  let reviewedOrder
  let reviewed = false
  let confirmationMessage = ''
  const order = {
    id: 41,
    userId: 'coupon-user',
    username: 'coupon-user',
    displayName: 'Người chơi Coupon',
    provider: 'Coupon Order',
    referenceCode: 'UID:15253771|SID:310765|CP:6|QTY:2|ORDER41',
    amount: 26000,
    status: 'Pending',
    staffNote: '',
    createdAt: new Date().toISOString(),
  }
  const cancelledOrder = {
    ...order,
    id: 42,
    referenceCode: 'UID:3107453|SID:310170|CP:6|QTY:1|CANCELLED42',
    amount: 13000,
    status: 'Cancelled',
    reviewedBySubject: '',
    reviewedAt: null,
  }

  await page.route(/\/api\/admin\/top-ups\/\d+\/review$/, async route => {
    reviewedPayload = route.request().postDataJSON()
    reviewed = true
    reviewedOrder = {
      ...order,
      ...reviewedPayload,
      reviewedBySubject: 'admin:integration-admin',
      reviewedAt: new Date().toISOString(),
    }
    return route.fulfill({ json: reviewedOrder })
  })
  await page.route(/\/api\/admin\/top-ups(?:\?.*)?$/, route => {
    const status = new URL(route.request().url()).searchParams.get('status')
    if (status === 'Cancelled') return route.fulfill({ json: [cancelledOrder] })
    return route.fulfill({ json: status === 'Approved' && reviewedOrder
      ? [reviewedOrder]
      : reviewed ? [] : [order] })
  })

  await page.goto('/admin/top-ups')

  await expect(page.getByRole('heading', { name: 'Xử lý đơn Coupon' })).toBeVisible()
  await expect(page.getByText('15253771')).toBeVisible()
  await expect(page.getByText('310765')).toBeVisible()
  await expect(page.getByText('12', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Từ chối đơn #41' }).click()
  await expect(page.getByText('Vui lòng nhập lý do từ chối để người dùng biết cách xử lý.')).toBeVisible()
  expect(reviewedPayload).toBeUndefined()
  await page.getByLabel('Ghi chú xử lý').fill('Đã nạp đủ Coupon vào UID.')
  page.once('dialog', async dialog => {
    confirmationMessage = dialog.message()
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Duyệt đơn #41' }).click()

  await expect(page.getByText('Đã xác nhận đơn #41 được nạp thành công.')).toBeVisible()
  expect(confirmationMessage).toContain('Người nhận: @coupon-user')
  expect(confirmationMessage).toContain('UID: 15253771')
  expect(confirmationMessage).toContain('Server: 310765')
  expect(confirmationMessage).toContain('12 Coupon · 26.000đ')
  expect(confirmationMessage).toContain('Hành động này không thể hoàn tác.')
  expect(reviewedPayload).toEqual({ status: 'Approved', staffNote: 'Đã nạp đủ Coupon vào UID.' })
  await expect(page.getByText('Không có đơn Coupon ở trạng thái này.')).toBeVisible()
  await page.getByRole('button', { name: 'Đã duyệt' }).click()
  await expect(page.getByText('@integration-admin')).toBeVisible()

  await page.getByRole('button', { name: 'Đã hủy' }).click()
  await expect(page.getByText('Người dùng đã hủy trước khi xử lý.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Duyệt đơn|Từ chối đơn/ })).toHaveCount(0)
  await assertNoHorizontalOverflow(page)
})

test('Admin refreshes a stale Coupon queue after another Admin wins the review race', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'Admin', { displayName: 'Quản trị đồng thời' })
  let queueLoads = 0
  const order = {
    id: 52,
    userId: 'race-user',
    username: 'race-user',
    displayName: 'Người chơi đồng thời',
    provider: 'Coupon Order',
    referenceCode: 'UID:15253771|SID:310765|CP:6|QTY:1|RACE52',
    amount: 13000,
    status: 'Pending',
    staffNote: '',
    reviewedBySubject: '',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  }

  await page.route(/\/api\/admin\/top-ups\/52\/review$/, route => route.fulfill({
    status: 409,
    json: { message: 'Yêu cầu không tồn tại hoặc đã được xử lý.' },
  }))
  await page.route(/\/api\/admin\/top-ups(?:\?.*)?$/, route => {
    queueLoads += 1
    return route.fulfill({ json: queueLoads === 1 ? [order] : [] })
  })

  await page.goto('/admin/top-ups')
  await expect(page.getByText('Người chơi đồng thời')).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Duyệt đơn #52' }).click()

  await expect(page.getByText('Yêu cầu không tồn tại hoặc đã được xử lý. Danh sách đã được làm mới.')).toBeVisible()
  await expect(page.getByText('Không có đơn Coupon ở trạng thái này.')).toBeVisible()
  expect(queueLoads).toBe(2)
  await assertNoHorizontalOverflow(page)
})

test('Admin can only reject a malformed legacy Coupon order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installSession(page, 'Admin', { displayName: 'Quản trị legacy Coupon' })
  let reviewedPayload
  let rejected = false
  let rejectionConfirmation = ''
  const order = {
    id: 57,
    userId: 'legacy-user',
    username: 'legacy-user',
    displayName: 'Người chơi legacy',
    provider: 'Coupon Order',
    referenceCode: 'UID:3107453|SID:310170|CP:6|QTY:2|LEGACYPRICE',
    amount: 13000,
    status: 'Pending',
    staffNote: '',
    reviewedBySubject: '',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  }

  await page.route(/\/api\/admin\/top-ups\/57\/review$/, route => {
    reviewedPayload = route.request().postDataJSON()
    rejected = true
    return route.fulfill({ json: { ...order, ...reviewedPayload, status: 'Rejected' } })
  })
  await page.route(/\/api\/admin\/top-ups(?:\?.*)?$/, route =>
    route.fulfill({ json: rejected ? [] : [order] }))

  await page.goto('/admin/top-ups')

  await expect(page.getByText('Dữ liệu UID/SID/số lượng hoặc giá trị không hợp lệ. Chỉ được từ chối đơn này.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Duyệt đơn #57' })).toBeDisabled()
  await page.getByLabel('Ghi chú xử lý').fill('Giá trị không khớp số lượng Coupon.')
  page.once('dialog', async dialog => {
    rejectionConfirmation = dialog.message()
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Từ chối đơn #57' }).click()

  expect(rejectionConfirmation).toContain('Người nhận: @legacy-user · UID 3107453 · Server 310170')
  expect(rejectionConfirmation).toContain('Lý do: Giá trị không khớp số lượng Coupon.')
  await expect.poll(() => reviewedPayload).toEqual({
    status: 'Rejected',
    staffNote: 'Giá trị không khớp số lượng Coupon.',
  })
  await expect(page.getByText('Đã từ chối đơn #57.')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})

test('Admin cannot review a Coupon order owned by the same account', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const session = await installSession(page, 'Admin', { displayName: 'Admin Own Coupon' })
  const ownOrder = {
    id: 54,
    userId: session.userId,
    username: session.username,
    displayName: session.displayName,
    provider: 'Coupon Order',
    referenceCode: 'UID:15253771|SID:310765|CP:6|QTY:1|OWN54',
    amount: 13000,
    status: 'Pending',
    staffNote: '',
    reviewedBySubject: '',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  }
  let reviewCalls = 0

  await page.route(/\/api\/admin\/top-ups\/\d+\/review$/, route => {
    reviewCalls += 1
    return route.fulfill({ status: 409, json: { message: 'Conflict' } })
  })
  await page.route(/\/api\/admin\/top-ups(?:\?.*)?$/, route => route.fulfill({ json: [ownOrder] }))

  await page.goto('/admin/top-ups')

  await expect(page.getByText('Cần quản trị viên khác xử lý đơn của bạn.')).toBeVisible()
  await expect(page.getByLabel('Ghi chú xử lý')).toBeDisabled()
  await expect(page.getByRole('button', { name: /Duyệt đơn #54|Từ chối đơn #54/ })).toHaveCount(0)
  expect(reviewCalls).toBe(0)
  await assertNoHorizontalOverflow(page)
})

for (const account of [
  { role: 'User', label: 'Vào Diễn đàn', path: '/forum' },
  { role: 'Staff', label: 'Vào trang Nhân viên', hint: 'Kiểm duyệt nội dung cộng đồng', path: '/staff' },
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
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('opmwiki.auth.session') || 'null')?.role || null)).toBe(account.role)
    await page.locator('.account-control--signed-in').click()
    await expect(page.getByRole('menuitem', { name: new RegExp(account.label) })).toHaveAttribute('href', account.path)
    if (account.hint) await expect(page.getByText(account.hint, { exact: true })).toBeVisible()
  })
}
