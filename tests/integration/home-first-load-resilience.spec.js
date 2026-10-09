import fs from 'node:fs'
import { expect, test } from '@playwright/test'

const id = '100320-urplus'
const read = file => JSON.parse(fs.readFileSync(new URL('../../' + file, import.meta.url)))
const schedule = read('src/data/releaseSchedule.json')
const summaries = read('src/data/characterSummaries.json')
const next = page => page.getByRole('button', { name: /Tháng sau|Next Month/i })
const child = page => page.locator(`.featured-card[data-character="${id}"]`)
const heading = page => page.getByRole('heading', { level: 1, name: /^(Đồng Đế|Child Emperor)$/ })
const faults = async (page, mode) => {
  await page.addInitScript(({ mode }) => {
    const fetch = window.fetch.bind(window)
    window.__stalledGets = []
    window.fetch = (input, options = {}) => {
      const url = String(input?.url || input)
      if (!/\/api\//.test(url) || !url.startsWith('http://127.0.0.1:5181')) return fetch(input, options)
      const record = { url, start: performance.now() }; window.__stalledGets.push(record)
      if (mode === 'unavailable') { record.end = performance.now(); return Promise.resolve(new Response('{}', { status: 500 })) }
      return new Promise((_, reject) => {
        const abort = () => { record.end = performance.now(); record.error = 'AbortError'; reject(new DOMException('Locally simulated stalled GET', 'AbortError')) }
        if (options.signal?.aborted) abort()
        else options.signal?.addEventListener('abort', abort, { once: true })
      })
    }
  }, { mode })
}
const library = async page => {
  const menu = page.getByRole('button', { name: 'Mở menu', exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.locator('nav:visible a[href="/characters"]').click()
  await expect(page.getByTestId('character-count')).toHaveText('179/179')
  await expect(page.getByTestId('character-grid').locator('a')).toHaveCount(12)
}
const searchChild = async page => {
  await page.getByPlaceholder(/Nhập tên nhân vật|Search character name/).fill('Child Emperor')
  await page.getByRole('button', { name: /^(Tìm kiếm|Search)$/, exact: true }).click()
  const card = page.locator(`a[href="/character/${id}"]`)
  await expect(card).toHaveCount(1)
  await expect(card).toBeVisible()
  return card
}
const audit = async (page, info, errors, extra = {}) => {
  await page.screenshot({ path: info.outputPath('final.png'), fullPage: true })
  await info.attach('evidence', { body: JSON.stringify({ ...extra, errors, faults: await page.evaluate(() => window.__stalledGets || []) }, null, 2), contentType: 'application/json' })
  expect(errors).toEqual([])
}

for (const [catalog, search, label] of [
  [true, true, 'A both succeed'], [true, false, 'B catalog succeeds search fails'],
  [false, true, 'C catalog fails search succeeds'], [false, false, 'D both fail'],
]) test(label, async ({ page }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  const calls = []
  await page.route('http://127.0.0.1:5181/api/**', async route => {
    const url = new URL(route.request().url()); calls.push(url.pathname + url.search)
    if (url.pathname === '/api/release-schedule') return route.fulfill({ json: schedule.filter(r => r.characterId !== id) })
    if (url.pathname !== '/api/characters') return route.fulfill({ status: 404, json: {} })
    const searched = Boolean(url.searchParams.get('search'))
    if (!(searched ? search : catalog)) return route.fulfill({ status: 500, json: {} })
    const language = url.searchParams.get('language') || 'vi'
    const data = Object.values(summaries[language])
    const filtered = searched ? data.filter(r => /100320|child emperor|đồng đế/i.test(r.id + ' ' + r.name)) : data
    return route.fulfill({ json: { items: filtered.slice(0, 12).map(r => ({ ...r, imageUrl: r.imageURL })), totalCount: filtered.length, totalPages: Math.ceil(filtered.length / 12), page: 1, pageSize: 12 } })
  })
  await page.goto('/')
  await expect(next(page)).toBeEnabled()
  await next(page).click(); await expect(child(page)).toHaveCount(1)
  await library(page)
  await expect(page.getByTestId('character-sync-status')).toHaveCount(0)
  const card = await searchChild(page)
  await expect(page.getByTestId('character-sync-status')).toHaveCount(0)
  await card.click(); await expect(heading(page)).toBeVisible()
  expect(calls.filter(c => c.startsWith('/api/characters?') && !new URL('http://local' + c).searchParams.get('search'))).toHaveLength(1)
  expect(calls.filter(c => c.startsWith('/api/characters?') && new URL('http://local' + c).searchParams.get('search'))).toHaveLength(1)
  await audit(page, info, errors, { catalog, search, calls })
})

test('E catalog/search and schedule remain stalled through the original 30s retry cycle', async ({ page }, info) => {
  test.setTimeout(60000)
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await faults(page, 'pending')
  const start = Date.now(); await page.goto('/')
  await expect(next(page)).toBeEnabled(); const usableMs = Date.now() - start
  await next(page).click(); await expect(child(page)).toHaveCount(1); const octoberMs = Date.now() - start
  await library(page); const card = await searchChild(page)
  // Both catalog/search fetches remain outstanding independently. The client still uses its unchanged 15s + one retry policy.
  await expect.poll(() => page.evaluate(() => window.__stalledGets.filter(r => /\/api\/characters\?/.test(r.url)).length)).toBeGreaterThanOrEqual(2)
  await expect.poll(() => Date.now() - start, { timeout: 40000, intervals: [1000] }).toBeGreaterThan(32000)
  await expect(page.getByTestId('character-sync-status')).toHaveCount(0)
  await expect(card).toHaveCount(1); await card.click(); await expect(heading(page)).toBeVisible()
  await audit(page, info, errors, { usableMs, octoberMs, elapsedMs: Date.now() - start })
})

for (const language of ['vi', 'en']) test(`F/G/H late schedule success preserves month, local Child and locale: ${language}`, async ({ page }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  let release; const gate = new Promise(resolve => { release = resolve })
  let started = false, completed = false
  await page.route('http://127.0.0.1:5181/api/**', async route => {
    if (!route.request().url().includes('/api/release-schedule')) return route.fulfill({ status: 404, json: {} })
    started = true; await gate
    await route.fulfill({ json: schedule.filter(r => r.characterId !== id) }); completed = true
  })
  await page.goto('/'); await expect(next(page)).toBeEnabled()
  await next(page).click(); await expect(child(page)).toHaveCount(1)
  await expect.poll(() => started).toBe(true)
  if (language === 'en') await page.getByRole('button', { name: 'Language VI', exact: true }).click()
  release(); await expect.poll(() => completed).toBe(true)
  await expect(page.locator('.featured-overview strong')).toHaveText('10 / 2026')
  await expect(child(page)).toHaveCount(1)
  await expect(child(page).locator('h2')).toHaveText(language === 'vi' ? 'Đồng Đế' : 'Child Emperor')
  await audit(page, info, errors)
})

test('stale VI schedule response cannot replace a newer EN response', async ({ page }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  let release; const gate = new Promise(resolve => { release = resolve })
  let viStarted = false, viDone = false, enDone = false
  await page.route('http://127.0.0.1:5181/api/release-schedule?*', async route => {
    const vi = new URL(route.request().url()).searchParams.get('language') === 'vi'
    if (vi) { viStarted = true; await gate }
    const rows = schedule.map(r => ({ ...r, overrideName: vi ? 'STALE_VI_RESPONSE' : r.overrideNameEn }))
    await route.fulfill({ json: rows }); if (vi) viDone = true; else enDone = true
  })
  await page.route('http://127.0.0.1:5181/api/characters/**', route => route.fulfill({ status: 404, json: {} }))
  await page.goto('/'); await expect(next(page)).toBeEnabled(); await next(page).click()
  await expect.poll(() => viStarted).toBe(true)
  await page.getByRole('button', { name: 'Language VI', exact: true }).click()
  await expect.poll(() => enDone).toBe(true)
  await expect(child(page).locator('h2')).toHaveText('Child Emperor')
  release(); await expect.poll(() => viDone).toBe(true)
  await expect(page.locator('main')).not.toContainText('STALE_VI_RESPONSE')
  await expect(child(page).locator('h2')).toHaveText('Child Emperor')
  await audit(page, info, errors)
})

test('I direct Child detail is usable while remote GET remains pending and Object.hasOwn is absent', async ({ page }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await faults(page, 'pending'); await page.addInitScript(() => { Object.hasOwn = undefined })
  await page.goto(`/character/${id}`); await expect(heading(page)).toBeVisible()
  for (const date of ['01/10/2026', '01/12/2026', '01/02/2027', '01/04/2027']) await expect(page.getByText(date, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__stalledGets.some(r => !r.end))).toBe(true)
  await audit(page, info, errors)
})

test('J Home to Library to Detail remains usable with all remote APIs unavailable', async ({ page }, info) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  await faults(page, 'unavailable'); await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/'); await expect(next(page)).toBeEnabled(); await next(page).click(); await expect(child(page)).toHaveCount(1)
  await library(page); const card = await searchChild(page); await card.click(); await expect(heading(page)).toBeVisible()
  await audit(page, info, errors)
})
