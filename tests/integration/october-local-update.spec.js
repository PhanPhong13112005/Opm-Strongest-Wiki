import { expect, test } from '@playwright/test'
import fs from 'node:fs'
const id = '100320-urplus'
const layout = async page => expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)

for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  for (const language of ['vi','en']) {
    test(`October local month, artwork, Keepsake and material ranges: ${language} ${viewport.width}`, async ({page}, testInfo) => {
      await page.setViewportSize(viewport)
      await page.clock.install({time:new Date('2026-10-12T05:00:00Z')})
      const errors=[]
      page.on('pageerror',error=>errors.push(error.message))
      // Read-only missing-record fixture exercises existing hybrid local fallback.
      await page.route('**/api/characters/**',route=>route.fulfill({status:404,body:'{}'}))
      await page.goto('/')
      if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
      await expect(page.locator('.month-switcher strong')).toHaveText('10 / 2026')
      const feature=page.locator(`.featured-card[data-character="${id}"]`)
      await expect(feature).toHaveCSS('background-color','rgb(0, 0, 0)')
      await expect(feature).toHaveCSS('clip-path','none')
      const artwork=await feature.locator('.featured-card__visual img').evaluate(image=>({height:image.clientHeight,stage:image.parentElement.clientHeight,top:parseFloat(getComputedStyle(image).top)}))
      expect(artwork.height).toBeLessThanOrEqual(artwork.stage*.91)
      expect(artwork.top).toBeGreaterThan(0)
      await expect(page.locator(`.release-card[href="/character/${id}"]`)).toHaveCount(1)
      await page.screenshot({path:testInfo.outputPath('home-october.png'),fullPage:true})
      await page.getByRole('button',{name:/Tháng sau|Next Month/i}).click()
      await expect(page.locator('.month-switcher strong')).toHaveText('11 / 2026')
      await expect(page).toHaveURL(/month=2026-11/)
      await page.reload()
      await expect(page.locator('.month-switcher strong')).toHaveText('11 / 2026')
      await page.goto('/?month=2026-12')
      await page.getByRole('button',{name:/Tháng sau|Next Month/i}).click()
      await expect(page.locator('.month-switcher strong')).toHaveText('01 / 2027')
      await page.getByRole('button',{name:/Tháng trước|Previous Month/i}).click()
      await expect(page.locator('.month-switcher strong')).toHaveText('12 / 2026')

      await page.goto('/characters')
      if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
      await expect(page.getByTestId('character-count')).toHaveText('179/179')
      await page.getByPlaceholder(language==='vi'?'Nhập tên nhân vật...':'Search character name...').fill(language==='vi'?'Đồng Đế':'Child Emperor')
      await page.getByRole('button',{name:language==='vi'?'Tìm kiếm':'Search',exact:true}).click()
      const card=page.locator(`a[href="/character/${id}"]`)
      await expect(card).toHaveCount(1)
      await expect(card.locator('[data-character-artwork]')).toHaveCSS('background-color','rgb(0, 0, 0)')
      await expect(card.locator('img[alt="UR+"]')).toBeVisible()
      await layout(page)
      await page.screenshot({path:testInfo.outputPath('library.png'),fullPage:true})
      await card.click()
      const hero=page.locator('.character-hero')
      await expect(hero).toHaveCSS('background-color','rgb(0, 0, 0)')
      for(const date of ['01/10/2026','01/12/2026','01/02/2027','01/04/2027']) await expect(page.getByText(date,{exact:true})).toBeVisible()
      await page.screenshot({path:testInfo.outputPath('detail-history.png'),fullPage:true})
      const skills=page.getByTestId('character-skills')
      await skills.scrollIntoViewIfNeeded()
      await skills.getByRole('button',{name:language==='vi'?'TUYỆT KĨ':'ULTIMATE',exact:true}).click()
      const superHeading=skills.getByRole('heading',{name:language==='vi'?'Siêu tuyệt kĩ':'Super Ultimate',exact:true})
      await superHeading.click()
      const badge=skills.locator('[data-keepsake-unlock]')
      await expect(badge).toHaveCount(1)
      await expect(badge).not.toHaveAttribute('href')
      await expect.poll(()=>badge.locator('img').evaluate(image=>image.complete&&image.naturalWidth===400)).toBe(true)
      await expect(skills).toContainText('7000%')
      await layout(page)
      await skills.screenshot({path:testInfo.outputPath('super-ultimate-keepsake.png')})
      await skills.getByRole('button',{name:language==='vi'?'Cốt Lõi':'Core',exact:true}).click()
      await skills.getByRole('button',{name:/Phòng nghiên cứu|Core Lab|Research/i}).click()
      await expect(page).toHaveURL(/core-lab\?hero=he_100320/)
      const from=page.getByRole('spinbutton',{name:language==='vi'?'Từ cấp':'From Level',exact:true})
      const to=page.getByRole('spinbutton',{name:language==='vi'?'Đến cấp':'To Level',exact:true})
      // Labels are localized; avoid inferring material values from visible formatted text.
      for(const [start,end,notes,gold] of [[0,4,642,42000],[4,10,4270,217000],[0,20,34232,1799000]]) {
        await from.fill(String(start)); await to.fill(String(end))
        await expect(page.locator('[data-material-id="it_214001"]')).toHaveAttribute('data-material-amount',String(notes))
        await expect(page.locator('[data-material-id="0"]')).toHaveAttribute('data-material-amount',String(gold))
        await expect(page.locator('[data-core-part]')).toHaveCount(6)
        await expect(page.locator('[data-core-part] img')).toHaveCount(0)
        await expect(page.locator('[data-material-image-status]')).toHaveCount(6)
        await expect(page.locator('[data-core-resources]')).not.toContainText('?')
        await expect(page.locator('[data-core-provenance]')).toContainText(language==='vi'?'Chưa xác minh':'unverified')
        await layout(page)
        await page.screenshot({path:testInfo.outputPath(`core-${start}-${end}.png`),fullPage:true})
      }
      await from.fill('4'); await page.getByRole('button',{name:'Lv 10',exact:true}).click()
      await expect(from).toHaveValue('4')
      await expect(page.locator('[data-material-id="it_214001"]')).toHaveAttribute('data-material-amount','4270')
      await from.fill('10'); await to.fill('10')
      await expect(page.locator('[data-material-id]')).toHaveCount(0)
      await to.fill('21')
      await expect(page.getByRole('status')).toContainText(language==='vi'?'Chọn cấp nguyên':'Choose integer levels')
      await expect(page.locator('[data-material-id]')).toHaveCount(0)
      await page.locator('[data-core-detail-link]').click()
      await expect(page).toHaveURL(`/character/${id}`)
      expect(errors).toEqual([])
    })
  }
}

for(const [iso,month] of [
  ['2026-09-30T17:00:00Z','10 / 2026'], ['2026-10-31T17:00:00Z','11 / 2026'],
  ['2026-12-31T16:59:59Z','12 / 2026'], ['2026-12-31T17:00:00Z','01 / 2027'],
]) test(`Vietnam current Home month on new tab and reload ${iso}`,async ({browser})=>{
  const context=await browser.newContext({timezoneId:'America/Los_Angeles'})
  const page=await context.newPage()
  try {
    await page.clock.install({time:new Date(iso)})
    await page.clock.setFixedTime(new Date(iso))
    await page.goto('http://127.0.0.1:4173/')
    await expect(page.locator('.month-switcher strong')).toHaveText(month)
    await page.reload()
    await expect(page.locator('.month-switcher strong')).toHaveText(month)
    const tab=await context.newPage()
    await tab.clock.install({time:new Date(iso)})
    await tab.clock.setFixedTime(new Date(iso))
    await tab.goto('http://127.0.0.1:4173/')
    await expect(tab.locator('.month-switcher strong')).toHaveText(month)
  } finally { await context.close() }
})

for(const width of [1440,390]) for(const language of ['vi','en']) {
  test(`Home month stays selected until reload: ${language} ${width}`,async ({page},testInfo)=>{
    await page.setViewportSize({width,height:width===1440?900:844})
    await page.route('**/api/release-schedule?*',route=>route.fulfill({status:200,json:[]}))
    await page.clock.install({time:new Date('2026-10-31T16:59:00Z')})
    await page.goto('/')
    if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
    const month=page.locator('.month-switcher strong')
    const matchesHero=async (expected)=>{
      const hero=page.locator('.featured-card').first()
      await expect(hero).toHaveAttribute('data-character',expected)
      await expect.poll(()=>hero.locator('img').evaluate(image=>image.currentSrc)).toMatch(expected===id
        ? /\/Characters\/optimized\/100320-urplus-(?:360|600)\.webp/
        : /\/Characters\/Full_Background\/optimized\/homeless-emperor-urplus-\d+\.webp/)
    }
    await expect(month).toHaveText('10 / 2026');await matchesHero(id)
    // Fast-forward fires an installed interval; a wall-clock-only replacement
    // would not catch the old60s timer. Focus also exercises the former handler.
    await page.clock.fastForward(120_000)
    await expect(month).toHaveText('10 / 2026')
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
    await expect(month).toHaveText('10 / 2026');await matchesHero(id)
    await page.screenshot({path:testInfo.outputPath('home-no-live-rollover.png'),fullPage:true})
    await page.reload();await expect(month).toHaveText('11 / 2026')
    await page.clock.setSystemTime(new Date('2026-12-31T17:00:00Z'))
    await page.reload();await expect(month).toHaveText('01 / 2027')
    for(const expected of ['12 / 2026','11 / 2026','10 / 2026','09 / 2026']) {
      await page.getByRole('button',{name:/Tháng trước|Previous Month/i}).click()
      await expect(month).toHaveText(expected)
    }
    await expect(page).toHaveURL(/month=2026-09/);await matchesHero('homeless-emperor-urplus')
    await page.clock.setSystemTime(new Date('2027-02-01T05:00:00Z'))
    await page.clock.fastForward(120_000)
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')))
    await expect(month).toHaveText('09 / 2026');await matchesHero('homeless-emperor-urplus')
    await page.goto('/?month=2026-12');await expect(month).toHaveText('12 / 2026');await matchesHero(id)
    await page.reload();await expect(month).toHaveText('12 / 2026')
    await layout(page)
  })

  test(`Core disputed effects stay hidden and costs remain intact: ${language} ${width}`,async ({page},testInfo)=>{
    await page.setViewportSize({width,height:width===1440?900:844})
    await page.route('**/api/characters/**',route=>route.fulfill({status:404,json:{}}))
    const source=JSON.parse(fs.readFileSync(new URL('../../src/data/coreLab.json',import.meta.url)))
    const child=source.heroes.find(hero=>hero.coreHeId==='he_100320')
    const pending=language==='vi'?'Thông tin hiệu ứng cấp này đang được xác minh.':"This level's effect information is being verified."
    const localized=async()=>{if(language==='en')await page.getByRole('button',{name:'Language VI',exact:true}).click()}
    await page.goto('/core-lab?hero=he_100320');await localized()
    const from=page.getByRole('spinbutton',{name:language==='vi'?'Từ cấp':'From Level',exact:true})
    const to=page.getByRole('spinbutton',{name:language==='vi'?'Đến cấp':'To Level',exact:true})
    await expect(to).toHaveAttribute('max','20');await to.fill('20')
    await expect(page.locator('[data-core-level]')).toHaveCount(21)
    await expect(page.locator('[data-core-effect-pending]')).toHaveCount(2)
    for(const level of [1,17]) {
      const row=page.locator(`[data-core-level="${level}"]`)
      await expect(row).toContainText(pending)
      await expect(row).not.toContainText(level===17?'Eccentric Power IV':'80')
      const accessibleText=await row.evaluate(el=>[...el.querySelectorAll('[title],[alt]')].map(node=>node.getAttribute('title')||node.getAttribute('alt')).join(' '))
      expect(accessibleText).not.toMatch(/Eccentric Power IV|80/)
    }
    for(const level of child.levels.filter(level=>![1,17].includes(level.lv))) {
      const row=page.locator(`[data-core-level="${level.lv}"]`)
      await expect(row.locator('[data-core-effect-pending]')).toHaveCount(0)
      const reward=level[`reward_${language}`]||level.reward_vi
      if(reward) await expect(row).toContainText(reward)
    }
    for(const [end,notes,gold] of [[1,65,7000],[17,22061,1169000],[20,34232,1799000]]) {
      await to.fill(String(end))
      await expect(page.locator('[data-material-id="it_214001"]')).toHaveAttribute('data-material-amount',String(notes))
      await expect(page.locator('[data-material-id="0"]')).toHaveAttribute('data-material-amount',String(gold))
    }
    await expect(page.locator('[data-core-part]')).toHaveCount(6)
    await expect(page.locator('[data-core-part] img')).toHaveCount(0)
    await expect(page.locator('[data-core-steps]')).toContainText('19 → 20')
    await page.locator('[data-core-level="17"]').scrollIntoViewIfNeeded()
    await page.screenshot({path:testInfo.outputPath('core-hidden-lv17.png'),fullPage:true})
    await page.goto('/character/100320-urplus');await localized()
    const skills=page.getByTestId('character-skills')
    await skills.scrollIntoViewIfNeeded()
    await skills.getByRole('button',{name:language==='vi'?'Cốt Lõi':'Core',exact:true}).click()
    await expect(skills.locator('[data-core-level="17"]')).toContainText(pending)
    await expect(skills).not.toContainText('Eccentric Power IV')
    await expect(skills.locator('[data-core-level="0"]')).not.toContainText(pending)
    // The same level numbers on another character retain their original data.
    const reference=source.heroes.find(hero=>hero.characterId==='100045-ur')
    await page.goto('/core-lab?hero='+reference.coreHeId);await localized()
    await page.getByRole('spinbutton',{name:language==='vi'?'Đến cấp':'To Level',exact:true}).fill('20')
    await expect(page.locator('[data-core-effect-pending]')).toHaveCount(0)
    for(const level of [1,17]) {
      const original=reference.levels.find(row=>row.lv===level)
      await expect(page.locator(`[data-core-level="${level}"]`)).toContainText(original[`reward_${language}`]||original.reward_vi)
    }
    await layout(page)
    await expect(from).toHaveValue('0')
  })
}
