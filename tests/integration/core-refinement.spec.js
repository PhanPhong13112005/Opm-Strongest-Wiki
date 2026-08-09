import { expect, test } from '@playwright/test'
const trackRefinementTransitions = async (page) => {
  await page.evaluate(() => {
    window.__refinementTransitions = []
    if (window.__refinementTransitionListenerInstalled) return
    window.__refinementTransitionListenerInstalled = true
    document.addEventListener('transitionstart', (event) => {
      if (event.target instanceof Element && event.target.matches('.result-summary, .calculation-grid, .lock-ladder, .quality-bars')) {
        window.__refinementTransitions.push(event.propertyName)
      }
    }, { capture: true })
  })
}

test('Core Refinement single-page calculator follows branch and lock rules', async ({ page }) => {
  await page.goto('/core-refinement', { waitUntil: 'networkidle' })

  await expect(page.locator('.refinement-hero h1')).toBeVisible()
  const entryMotion = await page.evaluate(() => ({
    hero: getComputedStyle(document.querySelector('.refinement-hero')).animationName,
    guide: getComputedStyle(document.querySelector('.beginner-guide')).animationName,
    orbit: getComputedStyle(document.querySelector('.refinement-page'), '::before').animationName,
    scan: getComputedStyle(document.querySelector('.refinement-hero'), '::before').animationName,
  }))
  expect(entryMotion.hero).toContain('refinement-rise-in')
  expect(entryMotion.guide).toContain('refinement-rise-in')
  expect(entryMotion.orbit).toContain('refinement-orbit')
  expect(entryMotion.scan).toContain('refinement-scan')
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.locator('#refinement-overview')).toBeVisible()
  await expect(page.locator('#refinement-calculator')).toBeVisible()
  await expect(page.locator('#refinement-quality')).toBeVisible()
  await expect(page.locator('#refinement-stats')).toBeVisible()
  await expect(page.locator('.beginner-guide li')).toHaveCount(4)
  await expect(page.locator('.branch-card')).toHaveCount(2)

  await expect(page.getByTestId('refinement-to')).toHaveValue('2')
  await expect(page.getByTestId('total-exp')).toHaveText('20')
  await expect(page.getByTestId('roll-count')).toHaveText('20')
  await expect(page.getByTestId('chip-count')).toHaveText('200')

  await trackRefinementTransitions(page)
  await page.getByTestId('refinement-locks').selectOption('4')
  await expect(page.getByTestId('roll-count')).toHaveText('3')
  await expect(page.getByTestId('lock-component-count')).toHaveText('12')
  await expect.poll(() => page.evaluate(() => window.__refinementTransitions)).toContain('opacity')
  await expect.poll(() => page.evaluate(() => window.__refinementTransitions)).toContain('transform')

  await trackRefinementTransitions(page)
  await page.locator('.branch-card').nth(1).click()
  await expect.poll(() => page.evaluate(() => window.__refinementTransitions)).toContain('opacity')
  await expect.poll(() => page.evaluate(() => window.__refinementTransitions)).toContain('transform')
  await expect(page.getByTestId('refinement-to')).toHaveValue('2')
  await expect(page.getByTestId('refinement-locks').locator('option')).toHaveCount(6)
  await page.locator('.quick-targets button').last().click()
  await expect(page.getByTestId('refinement-to')).toHaveValue('20')
})

test('quality comparison follows current level unlock and pity rules', async ({ page }) => {
  await page.goto('/core-refinement', { waitUntil: 'networkidle' })

  await expect(page.locator('.quality-bar')).toHaveCount(6)
  await trackRefinementTransitions(page)
  await page.getByTestId('quality-level').selectOption('5')
  await expect.poll(() => page.evaluate(() => window.__refinementTransitions)).toContain('opacity')
  await expect.poll(() => page.evaluate(() => window.__refinementTransitions)).toContain('transform')

  const orangeRow = page.locator('.quality-bar').nth(4)
  const redRow = page.locator('.quality-bar').nth(5)
  await expect(orangeRow).not.toHaveClass(/is-locked/)
  await expect(orangeRow.locator('.quality-bar__values')).toContainText('1')
  await expect(redRow).toHaveClass(/is-locked/)
  await expect(redRow.locator('.quality-bar__locked')).toContainText('6')
  await expect(page.locator('.pity-list span')).toHaveCount(2)

  await page.getByTestId('quality-level').selectOption('6')
  await expect(redRow).not.toHaveClass(/is-locked/)
  await expect(redRow.locator('.quality-bar__values')).toContainText('0')
  await expect(redRow.locator('.quality-bar__delta')).toBeVisible()
})

test('collapsed stat details expand and language toggle updates the page', async ({ page }) => {
  await page.goto('/core-refinement', { waitUntil: 'networkidle' })

  const statSection = page.locator('.stat-section')
  await expect(statSection).not.toHaveAttribute('open', '')
  await statSection.locator('summary').click()
  await expect(statSection).toHaveAttribute('open', '')

  const firstStat = page.locator('.stat-item').first()
  await expect(firstStat).toHaveAttribute('aria-expanded', 'false')
  await firstStat.click()
  await expect(firstStat).toHaveAttribute('aria-expanded', 'true')
  await expect(firstStat.locator('.stat-item__detail')).toBeVisible()
  await expect(firstStat.locator('.stat-item__detail')).toHaveCSS('animation-name', /refinement-detail-in/)

  await page.getByRole('button', { name: /Language VI/i }).click()
  await expect(page.locator('.refinement-hero h1')).toHaveText('Core Refinement')
  await expect(page.locator('.refinement-hero')).toContainText('Account Lv. 78+')
})

test('Core Refinement single page remains readable without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/core-refinement', { waitUntil: 'networkidle' })

  await expect(page.locator('.refinement-hero h1')).toBeVisible()
  const entryMotion = await page.evaluate(() => ({
    hero: getComputedStyle(document.querySelector('.refinement-hero')).animationName,
    guide: getComputedStyle(document.querySelector('.beginner-guide')).animationName,
    orbit: getComputedStyle(document.querySelector('.refinement-page'), '::before').animationName,
    scan: getComputedStyle(document.querySelector('.refinement-hero'), '::before').animationName,
  }))
  expect(entryMotion.hero).toContain('refinement-rise-in')
  expect(entryMotion.guide).toContain('refinement-rise-in')
  expect(entryMotion.orbit).toContain('refinement-orbit')
  expect(entryMotion.scan).toContain('refinement-scan')
  await expect(page.locator('.refinement-tabs')).toHaveCount(0)
  await expect(page.locator('.calculator-controls')).toBeVisible()
  await expect(page.locator('#refinement-quality')).toBeVisible()
  await expect(page.locator('.slot-section')).not.toHaveAttribute('open', '')
  await expect(page.locator('.stat-section')).not.toHaveAttribute('open', '')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})