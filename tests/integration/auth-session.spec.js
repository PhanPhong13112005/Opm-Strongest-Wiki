import { expect, test } from '@playwright/test'

const tokenFor = (role, expiresInSeconds = 3600) => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.test`
}

const sessionFor = (role, overrides = {}) => ({
  userId: `${role.toLowerCase()}-auth-session-test`,
  username: role.toLowerCase(),
  displayName: `${role} Session Test`,
  role,
  balance: 125000,
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  ...overrides,
})

const installStoredSession = async (page, role, { legacy = false, expiresInSeconds = 3600 } = {}) => {
  const session = sessionFor(role)
  await page.addInitScript(({ token, storedSession, useLegacyStorage }) => {
    const target = useLegacyStorage ? sessionStorage : localStorage
    target.setItem('opmwiki.auth.token', token)
    target.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
  }, { token: tokenFor(role, expiresInSeconds), storedSession: session, useLegacyStorage: legacy })
  return session
}

test('login persists to localStorage and refreshSession merges /auth/me without ReferenceError', async ({ page }) => {
  const loginResult = {
    ...sessionFor('User'),
    accessToken: tokenFor('User'),
  }
  const refreshedAccount = {
    id: loginResult.userId,
    username: loginResult.username,
    displayName: 'User Refreshed',
    role: 'User',
    balance: 130000,
    isActive: true,
  }
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.route('**/api/auth/login', route => route.fulfill({ json: loginResult }))
  await page.route('**/api/auth/me', route => route.fulfill({ json: refreshedAccount }))

  await page.goto('/login')
  await page.getByLabel('Tên đăng nhập').fill(loginResult.username)
  await page.locator('input[autocomplete="current-password"]').fill('password-test')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()

  await expect(page).toHaveURL('/')
  const storedAfterLogin = await page.evaluate(() => ({
    localToken: localStorage.getItem('opmwiki.auth.token'),
    localSession: JSON.parse(localStorage.getItem('opmwiki.auth.session') || 'null'),
    legacyToken: sessionStorage.getItem('opmwiki.auth.token'),
    legacySession: sessionStorage.getItem('opmwiki.auth.session'),
  }))
  expect(storedAfterLogin.localToken).toBe(loginResult.accessToken)
  expect(storedAfterLogin.localSession.role).toBe('User')
  expect(storedAfterLogin.legacyToken).toBeNull()
  expect(storedAfterLogin.legacySession).toBeNull()

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Trang cá nhân' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('opmwiki.auth.session') || 'null')?.displayName)).toBe('User Refreshed')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Trang cá nhân' })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('/auth/me unauthorized clears a non-mock session from both storage locations', async ({ page }) => {
  await installStoredSession(page, 'User')
  await page.addInitScript(({ token, storedSession }) => {
    sessionStorage.setItem('opmwiki.auth.token', token)
    sessionStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
  }, { token: tokenFor('User'), storedSession: sessionFor('User') })
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 401,
    json: { message: 'Session is no longer valid.' },
  }))

  await page.goto('/account')

  await expect.poll(() => page.evaluate(() => ({
    localToken: localStorage.getItem('opmwiki.auth.token'),
    localSession: localStorage.getItem('opmwiki.auth.session'),
    legacyToken: sessionStorage.getItem('opmwiki.auth.token'),
    legacySession: sessionStorage.getItem('opmwiki.auth.session'),
  }))).toEqual({ localToken: null, localSession: null, legacyToken: null, legacySession: null })
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible()
})

test('expired session is removed before a protected router navigation', async ({ page }) => {
  await installStoredSession(page, 'User', { expiresInSeconds: -60 })

  await page.goto('/account')

  await expect(page).toHaveURL(/\/login\?redirect=\/account$/)
  await expect.poll(() => page.evaluate(() => ({
    token: localStorage.getItem('opmwiki.auth.token'),
    session: localStorage.getItem('opmwiki.auth.session'),
  }))).toEqual({ token: null, session: null })
})

test('legacy sessionStorage remains readable while logout and role guards honor current metadata', async ({ page }) => {
  const session = await installStoredSession(page, 'User', { legacy: true })
  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))

  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL('/account')
  await expect(page.getByRole('heading', { name: 'Trang cá nhân' })).toBeVisible()

  await page.locator('.account-control--signed-in').click()
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click()
  await expect(page).toHaveURL('/')
  await expect.poll(() => page.evaluate(() => ({
    localToken: localStorage.getItem('opmwiki.auth.token'),
    localSession: localStorage.getItem('opmwiki.auth.session'),
    legacyToken: sessionStorage.getItem('opmwiki.auth.token'),
    legacySession: sessionStorage.getItem('opmwiki.auth.session'),
  }))).toEqual({ localToken: null, localSession: null, legacyToken: null, legacySession: null })
})
