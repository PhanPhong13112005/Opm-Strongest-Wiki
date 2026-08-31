import { expect, test } from '@playwright/test'

const futureToken = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return encode({ alg: 'HS256', typ: 'JWT' }) + '.' +
    encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 }) + '.test'
}

const installSession = async (page, role, overrides = {}) => {
  const session = {
    userId: role.toLowerCase() + '-phase2-browser',
    username: role.toLowerCase() + '-phase2',
    displayName: role + ' Phase 2',
    role,
    balance: 0,
    emailVerified: false,
    phoneVerified: false,
    hasVerifiedContact: false,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    ...overrides,
  }
  await page.addInitScript(({ token, storedSession }) => {
    localStorage.setItem('opmwiki.auth.token', token)
    localStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
  }, { token: futureToken(role), storedSession: session })
  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
  return session
}

test('Tier Ranking keeps the bundled catalog visible when the ASP.NET schema is ready', async ({ page }) => {
  let requests = 0
  await page.route(/\/api\/tier-rankings(?:\?.*)?$/, route => {
    requests += 1
    return route.fulfill({
      json: {
        voteMonth: '2026-08',
        resetsAt: '2026-08-31T17:00:00Z',
        totalVotes: 0,
        totalVoters: 0,
        votes: [],
      },
    })
  })

  await page.goto('/tier-ranking')

  await expect(page.getByRole('heading', { name: 'Bảng Xếp Hạng Cộng Đồng' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Tier Ranking schema is not ready.' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: /UR\+/ })).toBeVisible()
  expect(requests).toBe(1)
})

test('Admin Tier workspace uses the frozen ASP.NET query and optimistic version payload', async ({ page }) => {
  await installSession(page, 'Admin')
  const getUrls = []
  let updateRequest
  const character = {
    characterId: 'phase2-hero',
    nameVi: 'Anh hùng Phase 2',
    nameEn: 'Phase 2 Hero',
    rarity: 'UR',
    tier: 'SS',
    baseVotes: 10,
    communityVotes: 5,
    totalScore: 15,
    version: 's1.AAAAAAAAAAE',
  }

  await page.route(/\/api\/admin\/tier-ranking\/stats(?:\?.*)?$/, route => {
    getUrls.push(route.request().url())
    return route.fulfill({
      json: {
        voteMonth: '2026-08',
        resetsAt: '2026-08-31T17:00:00Z',
        page: 1,
        pageSize: 25,
        totalItems: 1,
        totalVotes: 5,
        totalVoters: 2,
        characters: [character],
      },
    })
  })
  await page.route('**/api/admin/tier-ranking/phase2-hero/base-votes', async route => {
    updateRequest = {
      method: route.request().method(),
      authorization: route.request().headers().authorization,
      body: route.request().postDataJSON(),
    }
    return route.fulfill({
      json: {
        ...character,
        baseVotes: 42,
        totalScore: 47,
        version: 's1.AAAAAAAAAAI',
      },
    })
  })

  await page.goto('/admin/tier-ranking')
  await expect(page.getByText('Anh hùng Phase 2')).toBeVisible()
  await page.getByRole('button', { name: 'Sửa Vote cơ bản' }).click()
  await page.locator('.modal-input').fill('42')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()

  await expect(page.getByRole('status')).toContainText('Đã cập nhật Vote cơ bản')
  expect(getUrls.length).toBe(2)
  for (const rawUrl of getUrls) {
    const url = new URL(rawUrl)
    expect(Object.fromEntries(url.searchParams)).toEqual({ page: '1', pageSize: '25' })
  }
  expect(updateRequest).toEqual({
    method: 'PUT',
    authorization: expect.stringMatching(/^Bearer /),
    body: { baseVotes: 42, expectedVersion: 's1.AAAAAAAAAAE' },
  })
})

test('Admin Community uses exact kind paging, expectedVersion, and If-Match contracts', async ({ page }) => {
  await installSession(page, 'Admin')
  const feedUrls = []
  let lockRequest
  const deleteRequests = []
  const topic = {
    id: 7,
    title: 'Chủ đề Phase 2',
    author: 'community-user',
    postCount: 3,
    isLocked: false,
    createdAt: '2026-08-20T10:00:00Z',
    contentSnippet: 'Nội dung kiểm thử.',
    version: 't1.topic-original',
  }
  const comment = {
    id: 9,
    author: 'community-user',
    content: 'Bình luận Phase 2',
    eventId: 'event-phase2',
    createdAt: '2026-08-21T10:00:00Z',
    version: 't1.comment-original',
  }

  await page.route(/\/api\/admin\/community\/feed(?:\?.*)?$/, route => {
    const url = new URL(route.request().url())
    const query = Object.fromEntries(url.searchParams)
    feedUrls.push(query)
    const topics = query.kind === 'topics' ? [topic] : []
    const comments = query.kind === 'comments' ? [comment] : []
    return route.fulfill({
      json: {
        kind: query.kind,
        page: Number(query.page),
        pageSize: Number(query.pageSize),
        totalItems: 1,
        topics,
        comments,
      },
    })
  })
  await page.route('**/api/admin/community/topics/7/lock', async route => {
    lockRequest = route.request().postDataJSON()
    return route.fulfill({
      json: { ...topic, isLocked: true, version: 't1.topic-locked' },
    })
  })
  await page.route(/\/api\/admin\/community\/(topics\/7|comments\/9)$/, route => {
    deleteRequests.push({
      url: route.request().url(),
      method: route.request().method(),
      ifMatch: route.request().headers()['if-match'],
    })
    return route.fulfill({ status: 204 })
  })
  page.on('dialog', dialog => dialog.accept())

  await page.goto('/admin/community')
  await expect(page.getByText('Chủ đề Phase 2')).toBeVisible()
  await page.getByRole('button', { name: 'Khóa' }).click()
  await expect(page.getByRole('status')).toContainText('Đã khóa chủ đề')
  expect(lockRequest).toEqual({ isLocked: true, expectedVersion: 't1.topic-original' })
  await page.getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByRole('status')).toContainText('Đã xóa chủ đề')

  await page.getByRole('button', { name: /Bình luận Sự kiện/ }).click()
  await expect(page.getByText('Bình luận Phase 2')).toBeVisible()
  await page.getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByRole('status')).toContainText('Đã xóa bình luận sự kiện')

  expect(feedUrls).toEqual([
    { kind: 'topics', page: '1', pageSize: '25' },
    { kind: 'comments', page: '1', pageSize: '25' },
  ])
  expect(deleteRequests).toEqual([
    {
      url: expect.stringMatching(/\/api\/admin\/community\/topics\/7$/),
      method: 'DELETE',
      ifMatch: '"t1.topic-locked"',
    },
    {
      url: expect.stringMatching(/\/api\/admin\/community\/comments\/9$/),
      method: 'DELETE',
      ifMatch: '"t1.comment-original"',
    },
  ])
})

test('Email verification request and confirm use canonical ASP.NET routes without a real provider', async ({ page }) => {
  const session = await installSession(page, 'User')
  let requestMethod
  let confirmRequest
  await page.route('**/api/auth/email-verification/request', route => {
    requestMethod = route.request().method()
    return route.fulfill({
      json: {
        message: 'Đã gửi liên kết xác minh Gmail.',
        verified: false,
        verificationUrl: 'http://127.0.0.1:4173/verify-email?token=phase2-test-token',
      },
    })
  })

  await page.goto('/account')
  await page.getByRole('button', { name: 'Gửi email xác minh' }).click()
  await expect(page.getByRole('status')).toContainText('Đã gửi liên kết xác minh Gmail.')
  await expect(page.getByRole('link', { name: 'Mở liên kết xác minh trong môi trường phát triển' }))
    .toHaveAttribute('href', /phase2-test-token/)
  expect(requestMethod).toBe('POST')

  await page.unroute('**/api/auth/me')
  await page.route('**/api/auth/me', route => route.fulfill({
    json: { ...session, emailVerified: true, hasVerifiedContact: true },
  }))
  await page.route('**/api/auth/email-verification/confirm', route => {
    confirmRequest = {
      method: route.request().method(),
      body: route.request().postDataJSON(),
    }
    return route.fulfill({
      json: { message: 'Gmail đã được xác minh thành công.', verified: true },
    })
  })

  await page.goto('/verify-email?token=phase2-test-token')
  await expect(page.getByRole('status')).toContainText('Gmail đã được xác minh thành công.')
  expect(confirmRequest).toEqual({
    method: 'POST',
    body: { token: 'phase2-test-token' },
  })
})

test('Email verification confirm exposes an invalid or expired token response', async ({ page }) => {
  await page.route('**/api/auth/email-verification/confirm', route => route.fulfill({
    status: 400,
    json: { message: 'Liên kết xác minh Gmail không hợp lệ hoặc đã hết hạn.' },
  }))

  await page.goto('/verify-email?token=wrong-phase2-token')

  await expect(page.getByRole('alert')).toContainText('không hợp lệ hoặc đã hết hạn')
})
