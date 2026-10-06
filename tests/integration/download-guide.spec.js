import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

// These browser tests require publication, unlike the component/CTA Node tests.
const guidePublished = /^\s*path:\s*['"]\/huong-dan-tai-game['"]/m.test(
  readFileSync(new URL('../../src/router/index.js', import.meta.url), 'utf8'))
test.skip(!guidePublished, 'Download Guide public route is not registered in this source revision; component/CTA preparation is tested separately')

const apkUrl = process.env.VITE_OPMWIKI_APK_URL || ''
const apkConfigured = Boolean(apkUrl)

test('download guide renders verified regions and correct APK state on desktop', async ({ page }) => {
  await page.goto('/huong-dan-tai-game')

  // Check VN tab is active by default
  await expect(page.getByRole('tab', { name: /Việt Nam/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('SOLAPLAY.VIETNAM', { exact: true }).first()).toBeVisible()

  // Check SEA tab
  await page.getByRole('tab', { name: 'SEA', exact: true }).click()
  await expect(page.getByText('FingerFun Limited', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Tải bản SEA qua TapTap/ }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Mở App Store Singapore/ }).first()).toBeVisible()
  await expect(page.getByText(/Không thấy game trên App Store\?/)).toBeVisible()

  // Check CN tab
  await page.getByRole('tab', { name: /Trung Quốc/ }).click()
  await expect(page.getByText('Beijing TIANMASHIKONG', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /TapTap chính thức/ }).first()).toHaveAttribute('rel', 'noopener noreferrer')

  // Check Compare tab
  await page.getByRole('tab', { name: /VN vs SEA/ }).click()
  await expect(page.getByText(/CHỌN VIỆT NAM NẾU:/)).toBeVisible()
  await expect(page.getByText(/CHỌN SEA NẾU:/)).toBeVisible()

  // Check APK tab
  await page.getByRole('tab', { name: /OpmWiki App/ }).click()
  if (apkConfigured) {
    const apkLink = page.getByRole('link', { name: 'Tải OpmWiki cho Android' })
    await expect(apkLink).toHaveAttribute('href', apkUrl)
    await expect(apkLink).toHaveAttribute('target', '_blank')
    await expect(apkLink).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(page.getByText('Phiên bản: 0.1.0', { exact: true })).toBeVisible()
    await expect(page.getByText('Build: 1', { exact: true })).toBeVisible()
    await expect(page.getByText('Yêu cầu: Android 7.0 trở lên (API 24)', { exact: true })).toBeVisible()
    await expect(page.getByText('Kích thước file: 54.3 MB', { exact: true })).toBeVisible()
    await expect(page.getByText(/0133687AB842C1F0197F3C740CC6090449ADD783563A08B80DCF0462004475E5/)).toBeVisible()
  } else {
    const apkButton = page.getByRole('button', { name: /APK chưa sẵn sàng/ })
    await expect(apkButton).toBeDisabled()
    await expect(page.getByText(/Nút tải sẽ được mở khi bản phát hành chính thức sẵn sàng/)).toBeVisible()
  }
})

test('download guide is reachable from responsive mobile navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Mở menu' }).click()

  const navigation = page.getByRole('navigation', { name: 'Mobile navigation' })
  const guideLink = navigation.getByRole('link', { name: 'Hướng dẫn tải' })
  await expect(guideLink).toBeVisible()
  await guideLink.click()

  await expect(page).toHaveURL(/\/huong-dan-tai-game$/)

  // 5 tabs should be present
  const tabs = page.getByRole('tab')
  await expect(tabs).toHaveCount(5)

  // Tabs nav should scroll horizontally
  const layout = await page.evaluate(() => {
    const tabsNav = document.querySelector('.tabs-nav')
    return {
      pageFitsViewport: document.documentElement.scrollWidth <= window.innerWidth + 1,
      tabsScrollsHorizontally: tabsNav.scrollWidth > tabsNav.clientWidth,
      tabsOverflowX: getComputedStyle(tabsNav).overflowX,
      scrollbarWidth: getComputedStyle(tabsNav).scrollbarWidth,
    }
  })
  expect(layout.pageFitsViewport).toBe(true)
  expect(layout.tabsOverflowX).toBe('auto')
  expect(layout.scrollbarWidth).toBe('none') // hidden scrollbar
})
