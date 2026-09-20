import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..', '..')
const summaries = JSON.parse(fs.readFileSync(path.join(root, 'src/data/characterSummaries.json'), 'utf8'))
const charactersApi = /\/api\/characters(?:\?|$)/

const releaseTime = (character) => {
  const value = character.releaseSea || character.releaseDate || character.releaseTrung
  if (!value) return null
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  return match ? Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null
}

const localPage = (language = 'vi', search = '') => summaries[language]
  .filter(character => character.name.toLocaleLowerCase(language).includes(search.toLocaleLowerCase(language)))
  .sort((left, right) => {
    const leftRelease = releaseTime(left)
    const rightRelease = releaseTime(right)
    if (leftRelease === null && rightRelease !== null) return 1
    if (leftRelease !== null && rightRelease === null) return -1
    if (leftRelease !== rightRelease) return rightRelease - leftRelease
    return left.name.localeCompare(right.name, language)
  })
  .slice(0, 12)

const toApiItem = (character, name = character.name) => ({
  id: character.id,
  name,
  imageUrl: character.imageURL,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: character.roles || [],
  classLevel: character.classLevel || null,
  keepsakeIcon: character.keepsakeIcon || null,
  releaseSea: null,
  releaseChina: null,
})

const apiPage = (items, totalCount = items.length) => ({
  items,
  page: 1,
  pageSize: 12,
  totalCount,
  totalPages: Math.max(1, Math.ceil(totalCount / 12)),
})

test('renders local cards and count before an unresolved Characters API request', async ({ page }) => {
  await page.goto('/characters', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('character-grid').locator('a').first()).toBeVisible()

  let requestCount = 0
  let releaseRequest
  const pendingRequest = new Promise(resolve => { releaseRequest = resolve })

  await page.route(charactersApi, async (route) => {
    requestCount += 1
    await pendingRequest
    await route.abort('timedout')
  })

  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    const firstCard = page.getByTestId('character-grid').locator('a').first()
    await expect(firstCard).toBeVisible()
    const localFirstVisibleMs = await page.evaluate(() => performance.now())
    console.log(`LOCAL_FIRST_CARD_VISIBLE_MS=${Math.round(localFirstVisibleMs)}`)

    await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(12)
    await expect(page.getByTestId('character-count')).toHaveText(`${summaries.vi.length}/${summaries.vi.length}`)
    await expect(page.getByTestId('character-sync-status')).toHaveText('Đang đồng bộ dữ liệu máy chủ...')
    expect(requestCount).toBe(1)
  } finally {
    releaseRequest()
  }
})

for (const scenario of [
  { name: 'API failure', status: 503 },
  { name: 'timeout response', status: 408 },
]) {
  test(`keeps local cards on ${scenario.name}`, async ({ page }) => {
    let requestCount = 0
    await page.route(charactersApi, async (route) => {
      requestCount += 1
      await route.fulfill({ status: scenario.status, contentType: 'application/json', body: JSON.stringify({ message: scenario.name }) })
    })

    await page.goto('/characters', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(12)
    await expect(page.getByTestId('character-count')).toHaveText(`${summaries.vi.length}/${summaries.vi.length}`)
    await expect.poll(() => requestCount).toBe(2)
    await expect(page.getByTestId('character-sync-status')).toHaveCount(0)
    await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(12)
  })
}

test('an immediate API response reconciles with one logical initial request', async ({ page }) => {
  let requestCount = 0
  const localItems = localPage('vi')
  await page.route(charactersApi, async (route) => {
    requestCount += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiPage(localItems.map(character => toApiItem(character)), summaries.vi.length)),
    })
  })

  await page.goto('/characters', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(12)
  await expect(page.getByTestId('character-sync-status')).toHaveCount(0)
  expect(requestCount).toBe(1)
})

test('reconciles delayed authoritative API data without clearing local cards', async ({ page }) => {
  const localItems = localPage('vi')
  const authoritativeName = 'Tên Máy Chủ Đã Đồng Bộ'

  await page.route(charactersApi, async (route) => {
    await new Promise(resolve => setTimeout(resolve, 5_000))
    const items = localItems.map((character, index) => toApiItem(
      character,
      index === 0 ? authoritativeName : character.name,
    ))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(apiPage(items, summaries.vi.length)),
    })
  })

  await page.goto('/characters', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(12)
  await expect(page.getByTestId('character-sync-status')).toBeVisible()
  await expect(page.getByText(authoritativeName, { exact: true })).toBeVisible({ timeout: 8_000 })
  await expect(page.getByTestId('character-sync-status')).toHaveCount(0)
})

test('newer search and language state cannot be overwritten by an older response', async ({ page }) => {
  const heldRoutes = []
  await page.route(charactersApi, async (route) => {
    heldRoutes.push(route)
  })

  await page.goto('/characters', { waitUntil: 'domcontentloaded' })
  await expect.poll(() => heldRoutes.length).toBe(1)

  const target = summaries.vi.find(character => character.id === 'homeless-emperor-urplus') || summaries.vi[0]
  await page.getByPlaceholder('Nhập tên nhân vật...').fill(target.name)
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()
  await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(1)
  await expect.poll(() => heldRoutes.length).toBe(2)

  await heldRoutes[1].fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(apiPage([toApiItem(target, 'Kết Quả Mới')], 1)),
  })
  await expect(page.getByText('Kết Quả Mới', { exact: true })).toBeVisible()

  await heldRoutes[0].fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(apiPage([toApiItem(localPage('vi')[0], 'Phản Hồi Cũ')], summaries.vi.length)),
  })
  await page.waitForTimeout(150)
  await expect(page.getByText('Kết Quả Mới', { exact: true })).toBeVisible()
  await expect(page.getByText('Phản Hồi Cũ', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Language VI', exact: true }).click()
  await expect(page.getByTestId('character-count')).not.toHaveText('0/178')
  await expect(page.getByTestId('character-grid').locator('a').first()).toBeVisible()
  await expect(page.getByTestId('character-sync-status')).toHaveText('Syncing server data...')
})
