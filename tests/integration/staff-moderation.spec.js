import { expect, test } from '@playwright/test'

const futureToken = role => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`
}

const installStaffSession = async page => {
  const session = {
    userId: 'staff-moderation-test',
    username: 'staff-moderator',
    displayName: 'Nhân viên kiểm duyệt',
    role: 'Staff',
    balance: 0,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  }
  await page.addInitScript(({ token, storedSession }) => {
    sessionStorage.setItem('opmwiki.auth.token', token)
    sessionStorage.setItem('opmwiki.auth.session', JSON.stringify(storedSession))
  }, { token: futureToken('Staff'), storedSession: session })
  await page.route('**/api/auth/me', route => route.fulfill({ json: session }))
}

const assertNoHorizontalOverflow = async page => {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
}

test('Staff reviews forum context and removes posts or whole topics on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await installStaffSession(page)

  let topicDeleted = false
  let deletedPostId = null
  const topicSummary = {
    id: 17,
    title: 'Chủ đề cần kiểm tra',
    author: 'Người chơi A',
    authorRole: 'User',
    postCount: 2,
    isLocked: false,
    updatedAt: new Date().toISOString(),
  }
  const topicDetail = {
    ...topicSummary,
    content: 'Nội dung mở đầu cần được xem trong ngữ cảnh.',
    createdAt: new Date().toISOString(),
    posts: [
      {
        id: 91,
        author: 'Người chơi B',
        authorRole: 'User',
        content: 'Phản hồi vi phạm cần xóa.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 92,
        author: 'Người chơi C',
        authorRole: 'User',
        content: 'Phản hồi hợp lệ cần giữ lại.',
        createdAt: new Date().toISOString(),
      },
    ],
  }

  await page.route('**/api/moderation/comments', route => route.fulfill({ json: [] }))
  await page.route(/\/api\/forum\/topics(?:\/\d+)?$/, route => {
    const isDetail = /\/topics\/\d+$/.test(new URL(route.request().url()).pathname)
    if (isDetail) return route.fulfill({ json: topicDetail })
    return route.fulfill({ json: topicDeleted ? [] : [topicSummary] })
  })
  await page.route(/\/api\/moderation\/forum\/posts\/\d+$/, route => {
    deletedPostId = Number(new URL(route.request().url()).pathname.split('/').at(-1))
    return route.fulfill({ status: 204 })
  })
  await page.route(/\/api\/moderation\/forum\/topics\/\d+$/, route => {
    topicDeleted = true
    return route.fulfill({ status: 204 })
  })

  await page.goto('/staff')

  await expect(page.getByRole('heading', { name: 'Chủ đề và phản hồi' })).toBeVisible()
  await expect(page.getByText('Nội dung mở đầu cần được xem trong ngữ cảnh.')).toBeVisible()
  await expect(page.getByText('Phản hồi vi phạm cần xóa.')).toBeVisible()
  await page.getByPlaceholder('Tìm tiêu đề hoặc tác giả…').fill('Người chơi A')
  await expect(page.getByRole('button', { name: /Chủ đề cần kiểm tra/ })).toBeVisible()
  await assertNoHorizontalOverflow(page)

  await page.evaluate(() => { window.confirm = () => true })
  await page.getByRole('button', { name: 'Xóa phản hồi của Người chơi B' }).click()

  expect(deletedPostId).toBe(91)
  await expect(page.getByText('Phản hồi vi phạm cần xóa.')).toHaveCount(0)
  await expect(page.getByText('Đã xóa phản hồi của Người chơi B.')).toBeVisible()

  await page.getByRole('button', { name: 'Xóa chủ đề' }).click()

  expect(topicDeleted).toBe(true)
  await expect(page.getByText('Đã xóa chủ đề “Chủ đề cần kiểm tra”.')).toBeVisible()
  await expect(page.getByText('Chọn một chủ đề')).toBeVisible()
  await assertNoHorizontalOverflow(page)
})
