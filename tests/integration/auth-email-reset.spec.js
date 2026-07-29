import { expect, test } from '@playwright/test'

test('registration collects Gmail and submits it with the account profile', async ({ page }) => {
  let submitted
  let completeRegistration
  const registrationGate = new Promise(resolve => {
    completeRegistration = resolve
  })
  await page.route('**/api/auth/register', async (route) => {
    submitted = route.request().postDataJSON()
    await registrationGate
    await route.fulfill({
      json: {
        accessToken: 'header.payload.signature',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        userId: 'gmail-ui-user',
        username: submitted.username,
        displayName: submitted.username,
        role: 'User',
        balance: 0,
      },
    })
  })

  await page.goto('/login?mode=register')
  await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible()
  await page.getByLabel('Tên đăng nhập').fill('gmail-ui-user')
  await page.getByLabel('Địa chỉ Gmail').fill('gmail.ui.user@gmail.com')
  await page.locator('input[autocomplete="new-password"]').first().fill('secure-password')
  await page.getByRole('button', { name: 'Đăng ký bằng Gmail' }).click()

  await expect(page.locator('.login-spinner')).toBeVisible()
  completeRegistration()
  await expect(page.getByRole('button', { name: 'Đăng ký thành công' })).toBeVisible()
  await expect(page.locator('.login-check')).toBeVisible()
  await expect(page).toHaveURL('/')
  expect(submitted).toEqual({
    username: 'gmail-ui-user',
    email: 'gmail.ui.user@gmail.com',
    password: 'secure-password',
  })
})

test('auth tabs use visible leave and enter transitions', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => {
    window.__authTransitionClasses = []
    const card = document.querySelector('.login-card')
    new MutationObserver((records) => {
      for (const record of records) {
        const classes = record.target instanceof HTMLElement ? record.target.className : ''
        if (typeof classes === 'string' && classes.includes('login-panel')) {
          window.__authTransitionClasses.push(classes)
        }
      }
    }).observe(card, { attributes: true, subtree: true, attributeFilter: ['class'] })
  })

  await page.getByRole('button', { name: 'Đăng ký ngay' }).click()
  await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible()

  const transitionClasses = await page.evaluate(() => window.__authTransitionClasses)
  expect(transitionClasses.some(value => value.includes('login-panel-leave-active'))).toBe(true)
  expect(transitionClasses.some(value => value.includes('login-panel-enter-active'))).toBe(true)
})

test('login shows the information checking message before success', async ({ page }) => {
  let completeLogin
  const loginGate = new Promise(resolve => {
    completeLogin = resolve
  })
  await page.route('**/api/auth/login', async (route) => {
    await loginGate
    await route.fulfill({
      json: {
        accessToken: 'header.payload.signature',
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        userId: 'animated-login-user',
        username: 'animated-login-user',
        displayName: 'animated-login-user',
        role: 'User',
        balance: 0,
      },
    })
  })

  await page.goto('/login')
  await page.getByLabel('Tên đăng nhập hoặc Gmail').fill('animated-login-user')
  await page.locator('input[autocomplete="current-password"]').fill('secure-password')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page.getByText('Đang kiểm tra thông tin đăng nhập…')).toBeVisible()
  completeLogin()
  await expect(page.getByRole('button', { name: 'Đăng nhập thành công' })).toBeVisible()
  await expect(page).toHaveURL('/')
})

test('forgot and reset password forms expose the complete recovery flow', async ({ page }) => {
  const resetUrl = 'http://127.0.0.1:4173/reset-password?token=test-reset-token-with-more-than-thirty-two-characters'
  await page.route('**/api/auth/forgot-password', route => route.fulfill({
    json: {
      message: 'Nếu Gmail tồn tại, liên kết đặt lại mật khẩu đã được gửi.',
      resetUrl,
    },
  }))

  await page.goto('/login')
  await page.getByRole('button', { name: 'Quên mật khẩu?' }).click()
  await expect(page.getByRole('heading', { name: 'Quên mật khẩu' })).toBeVisible()
  await page.getByLabel('Địa chỉ Gmail').fill('recover.user@gmail.com')
  await page.getByRole('button', { name: 'Gửi liên kết' }).click()
  await expect(page.getByText('Nếu Gmail tồn tại, liên kết đặt lại mật khẩu đã được gửi.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mở liên kết đặt lại mật khẩu local' })).toHaveAttribute('href', resetUrl)

  let resetPayload
  await page.route('**/api/auth/reset-password', async (route) => {
    resetPayload = route.request().postDataJSON()
    await route.fulfill({ json: { message: 'Mật khẩu đã được cập nhật. Bạn có thể đăng nhập ngay.' } })
  })
  await page.goto('/reset-password?token=test-reset-token-with-more-than-thirty-two-characters')
  await expect(page.getByRole('heading', { name: 'Đặt mật khẩu mới' })).toBeVisible()
  await page.locator('input[autocomplete="new-password"]').first().fill('replacement-password')
  await page.locator('input[autocomplete="new-password"]').nth(1).fill('replacement-password')
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click()

  await expect(page.getByText('Mật khẩu đã được cập nhật. Bạn có thể đăng nhập ngay.')).toBeVisible()
  expect(resetPayload).toEqual({
    token: 'test-reset-token-with-more-than-thirty-two-characters',
    password: 'replacement-password',
  })
})
