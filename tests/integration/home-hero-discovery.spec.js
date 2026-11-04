import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) for (const [month, id, imagePattern] of [
  ['2026-09', 'homeless-emperor-urplus', /homeless-emperor-urplus-\d+\.webp/],
  ['2026-10', '100320-urplus', /100320-urplus-(?:360|600)\.webp/],
  ['2026-11', 'homeless-emperor-urplus', /homeless-emperor-urplus-\d+\.webp/],
]) {
  test(`discovers only the selected hero before app entry: ${month} ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 })
    const requests = []
    page.on('request', request => {
      if (request.resourceType() === 'image') requests.push(request.url())
    })
    let releaseEntry
    let earlyImage
    const entryGate = new Promise(resolve => { releaseEntry = resolve })
    await page.route('**/src/main.js*', async route => { await entryGate; await route.continue() })
    try {
      await page.goto(`/?month=${month}`, { waitUntil: 'commit' })
      const hint = page.locator(`img[data-home-hero-preload="${month}"]`)
      await expect(hint).toHaveCount(1)
      await expect(page.locator('.featured-card')).toHaveCount(0)
      await expect.poll(() => requests.filter(url => imagePattern.test(url)).length).toBe(1)
      earlyImage = await hint.evaluate(image => ({ srcset: image.srcset, sizes: image.sizes }))
      // Discovery is proven before the entry module, not inferred from H1/H2 LCP.
    } finally { releaseEntry() }
    const hero = page.locator(`.featured-card[data-character="${id}"] img`).first()
    await expect(hero).toBeVisible()
    await expect.poll(() => hero.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
    const image = await hero.evaluate(image => ({ url: image.currentSrc, srcset: image.srcset, sizes: image.sizes }))
    expect(earlyImage.srcset).toBe(image.srcset)
    expect(earlyImage.sizes).toBe(image.sizes)
    expect(image.url).toMatch(imagePattern)
    expect(requests.filter(url => url === image.url)).toHaveLength(1)
    await expect(page.locator('.month-switcher strong')).toHaveText(`${month.slice(5)} / ${month.slice(0, 4)}`)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: testInfo.outputPath('home-selected-hero.png'), fullPage: true })
  })
}

test('empty month and non-Home direct reload never hint stale artwork', async ({ page }) => {
  await page.goto('/?month=2030-01')
  await expect(page.locator('.month-switcher strong')).toHaveText('01 / 2030')
  await expect(page.locator('[data-home-hero-preload]')).toHaveCount(0)
  await expect(page.locator('.featured-card')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('[data-home-hero-preload]')).toHaveCount(0)
  await page.goto('/character/100320-urplus')
  await expect(page.locator('.character-hero')).toBeVisible()
  await expect(page.locator('[data-home-hero-preload]')).toHaveCount(0)
})

test('hint follows Vietnam default on new document; selected month survives navigation and reload', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2026-09-30T17:00:00Z') })
  await page.clock.setFixedTime(new Date('2026-09-30T17:00:00Z'))
  await page.goto('/')
  await expect(page.locator('.featured-card').first()).toHaveAttribute('data-character', '100320-urplus')
  await expect(page.locator('.month-switcher strong')).toHaveText('10 / 2026')
  await page.getByRole('button', { name: /Tháng trước/i }).click()
  await expect(page.locator('.month-switcher strong')).toHaveText('09 / 2026')
  await expect(page.locator('.featured-card').first()).toHaveAttribute('data-character', 'homeless-emperor-urplus')
  await page.reload()
  await expect(page.locator('.featured-card').first()).toHaveAttribute('data-character', 'homeless-emperor-urplus')
  const newTab = await context.newPage()
  try {
    await newTab.goto('/?month=2026-09')
    await expect(newTab.locator('.featured-card').first()).toHaveAttribute('data-character', 'homeless-emperor-urplus')
    await expect(newTab.locator('.month-switcher strong')).toHaveText('09 / 2026')
  } finally { await newTab.close() }
  await page.goto('/?month=2026-12')
  await page.getByRole('button', { name: /Tháng sau/i }).click()
  await expect(page.locator('.month-switcher strong')).toHaveText('01 / 2027')
  await page.reload()
  await expect(page.locator('.featured-card').first()).toHaveAttribute('data-character', 'homeless-emperor-urplus')
})
