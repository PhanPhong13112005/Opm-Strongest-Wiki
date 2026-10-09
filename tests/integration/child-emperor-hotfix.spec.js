import { expect, test } from '@playwright/test'

const id = '100320-urplus'
const assets = [
  '/Characters/Child Emperor (URplus)/URplus.png',
  '/Characters/Full_Background/Child_URplus.png',
  ...[360, 600].map(width => `/Characters/optimized/${id}-${width}.webp`),
  ...['basic', 'ultimate', 'passive', 'awaken1'].map(skill => `/Skill/Child Emperor (URplus)/he_100320_ur_plus__${skill}.png`),
]

const checkLayout = async page => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  const broken = await page.locator('main img').evaluateAll(images => images
    .filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src))
  expect(broken).toEqual([])
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const language of ['vi', 'en']) {
    test(`Child catalog/search/detail remains complete with missing API record: ${language} ${viewport.width}`, async ({ page, baseURL }, testInfo) => {
      await page.setViewportSize(viewport)
      const live = new URL(baseURL).port === '5173'
      const errors = [], apiResponses = [], writes = [], consoleMessages = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => {
        if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push({ type: message.type(), text: message.text(), location: message.location().url })
      })
      page.on('response', response => {
        if (response.url().includes(`/api/characters/${id}`)) apiResponses.push({ url: response.url(), status: response.status() })
      })
      page.on('request', request => {
        if (request.url().includes('api.opmwiki.app') && request.method() !== 'GET') writes.push(request.method())
      })
      if (!live) {
        await page.route(`**/api/characters/${id}?*`, route => route.fulfill({ status: 404, body: '{}' }))
      } else {
        await page.route('https://api.opmwiki.app/**', route => route.request().method() === 'GET' ? route.continue() : route.abort())
      }
      await page.goto('/characters')
      await expect(page.getByTestId('character-count')).toHaveText('179/179')
      if (language === 'en') await page.getByRole('button', { name: 'Language VI', exact: true }).click()
      const name = language === 'vi' ? 'Đồng Đế' : 'Child Emperor'
      await page.getByPlaceholder(language === 'vi' ? 'Nhập tên nhân vật...' : 'Search character name...').fill(name)
      await page.getByRole('button', { name: language === 'vi' ? 'Tìm kiếm' : 'Search', exact: true }).click()
      const card = page.locator(`a[href="/character/${id}"]`)
      await expect(card).toHaveCount(1)
      await expect(card).toBeVisible()
      await expect(card.locator('img[src*="100320-urplus-360.webp"]')).toHaveJSProperty('naturalWidth', 360)
      await expect(card.locator('img[alt="UR+"]')).toBeVisible()
      await checkLayout(page)
      await page.screenshot({ path: testInfo.outputPath('catalog.png'), fullPage: true })
      await card.click()
      await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()
      await expect(page.locator('img[fetchpriority="high"]')).toHaveAttribute('src', /100320-urplus-600\.webp/)
      await expect.poll(() => page.locator('img[fetchpriority="high"]').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
      expect(await page.locator('img[fetchpriority="high"]').evaluate(image => image.currentSrc)).toMatch(/100320-urplus-(360|600)\.webp/)
      for (const stat of ['683', /4[,.]095/, '173', '118']) await expect(page.getByText(stat, { exact: true }).first()).toBeVisible()
      await expect(page.getByText('SS', { exact: true })).toBeVisible()
      await expect.poll(() => page.locator('img[src^="/Class/Class_SS.png"]').evaluate(image=>image.complete && image.naturalWidth>0)).toBe(true)
      await expect(page.getByText('Strike Core – Ready For Battle', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('01/10/2026', { exact: true })).toBeVisible()
      await expect(page.getByText('01/12/2026', { exact: true })).toBeVisible()
      await expect(page.getByText('01/02/2027', { exact: true })).toBeVisible()
      await expect(page.getByText('01/04/2027', { exact: true })).toBeVisible()
      await expect(page.getByTestId('history-evidence')).toContainText(language==='vi'?'dự kiến':'planned')
      await expect(page.getByText('15/12/2026', { exact: true })).toHaveCount(0)
      await page.screenshot({path:testInfo.outputPath('detail-info-history.png'),fullPage:true})
      const skills = page.getByTestId('character-skills')
      await skills.scrollIntoViewIfNeeded()
      const unsupportedSkill = /Awaken [123]|Thức tỉnh [123]/
      const expectedTabs = language === 'vi'
        ? ['ĐÁNH THƯỜNG', 'TUYỆT KĨ', 'NỘI TẠI', 'THỨC TỈNH', 'CỐT LÕI']
        : ['BASIC ATTACK', 'ULTIMATE', 'PASSIVE', 'AWAKENING', 'CORE']
      await expect.poll(async () => (await skills.locator('button').allTextContents()).slice(0, 5).map(text => text.trim().toUpperCase())).toEqual(expectedTabs)
      await expect(page.locator('main')).not.toContainText(unsupportedSkill)
      const basicName = language === 'vi' ? 'Cơ bản' : 'Basic'
      await expect(skills.getByRole('heading', { name: basicName, exact: true })).toBeVisible()
      await skills.getByRole('heading', { name: basicName, exact: true }).click()
      await expect(skills.getByText(language === 'vi' ? 'Đang cập nhật mô tả.' : 'Updating.', { exact: true })).toBeVisible()
      for (const [tab, skill] of language === 'vi'
        ? [['TUYỆT KĨ', 'Tuyệt kĩ'], ['NỘI TẠI', 'Bị động'], ['THỨC TỈNH', 'Nội tại Thức tỉnh']]
        : [['ULTIMATE', 'Ultimate'], ['PASSIVE', 'Passive'], ['AWAKENING', 'Awakened Passive']]) {
        await skills.getByRole('button', { name: tab, exact: true }).click()
        await expect(skills.getByRole('heading', { name: skill, exact: true })).toBeVisible()
        await expect(page.locator('main')).not.toContainText(unsupportedSkill)
        await expect(skills.locator('img[src*="he_100320_ur_plus__"]').first()).toHaveJSProperty('naturalWidth', 512)
        if (tab === 'TUYỆT KĨ' || tab === 'ULTIMATE') {
          await expect(skills.getByRole('heading', {level: 3})).toHaveCount(2)
          await expect(skills.locator('img[src*="he_100320_ur_plus__ultimate.png"]')).toHaveCount(2)
          await expect(skills.getByRole('heading',{name:language==='vi'?'Siêu tuyệt kĩ':'Super Ultimate',exact:true})).toBeVisible()
          await expect(skills).toContainText('5000%')
          await expect(skills).toContainText('7000%')
          const ultimateCard=skills.getByRole('heading',{name:skill,exact:true}).locator('xpath=ancestor::div[@class and contains(@class,"flex-shrink-0")][1]')
          await expect(ultimateCard.locator('p').first()).toBeVisible()
          await expect(ultimateCard.locator('p').first()).toContainText(language==='vi'
            ? 'giảm 3 lần sử dụng [Tái Chiến] của toàn bộ kẻ địch'
            : '[Re-Battle] uses for all enemies by 3 when')
          await expect(ultimateCard.locator('p').first()).not.toContainText('7000%')
          await expect(skills).not.toContainText('3 [4]')
          const superHeading=skills.getByRole('heading',{name:language==='vi'?'Siêu tuyệt kĩ':'Super Ultimate',exact:true})
          await superHeading.click()
          const superCard=superHeading.locator('xpath=ancestor::div[@class and contains(@class,"flex-shrink-0")][1]')
          await expect(superCard.locator('p').first()).toBeVisible()
          await expect(superCard.locator('p').first()).toContainText('7000%')
          await expect(superCard.locator('p').first()).not.toContainText('5000%')
          await expect(superCard.locator('p').first()).toContainText(language==='vi'
            ? 'giảm 4 lần sử dụng [Tái Chiến] của toàn bộ kẻ địch'
            : '[Re-Battle] uses for all enemies by 4 when')
          await superCard.screenshot({path:testInfo.outputPath('super-ultimate-state.png')})
          await expect(skills.locator('img[src*="__awaken1.png"]')).toHaveCount(0)
          await skills.getByTestId('character-skills-content').screenshot({path: testInfo.outputPath('ultimate-states.png')})
        }
        if (tab === 'NỘI TẠI' || tab === 'PASSIVE') {
          const headings = skills.getByRole('heading', {level:3})
          await expect(headings).toHaveCount(3)
          const names = language === 'vi' ? ['Bị động','Bị động — 5★ vàng','Bị động — 5★ tím'] : ['Passive','Passive — 5★ gold','Passive — 5★ purple']
          for (const [index,value] of ['80%','85%','90%'].entries()) {
            const heading = headings.nth(index)
            await heading.scrollIntoViewIfNeeded()
            await expect(heading).toHaveText(names[index])
            const card = heading.locator('xpath=ancestor::div[@class and contains(@class,"flex-shrink-0")][1]')
            await expect(card.locator('img[src*="__passive.png"]')).toHaveCount(1)
            await expect(card).toContainText(index===0?'★★':'★★★★★')
            if(index>0) await heading.click()
            await expect(card.locator('p').first()).toBeVisible()
            await expect(card.locator('p').first()).toContainText(value)
            await card.screenshot({path:testInfo.outputPath(`passive-state-${index+1}.png`)})
          }
          await skills.getByTestId('character-skills-content').screenshot({path:testInfo.outputPath('passive-states.png')})
          await page.screenshot({path:testInfo.outputPath('detail-passive.png'),fullPage:true})
        }
        if (tab === 'THỨC TỈNH' || tab === 'AWAKENING') {
          await expect(skills.getByRole('heading', {level:3})).toHaveCount(1)
          const awakeningDescription = skills.getByTestId('character-skills-content').locator('p').first()
          await expect(awakeningDescription).toContainText('92% → 95% → 98%')
          await expect(awakeningDescription).toContainText(language==='vi'
            ? 'Mỗi lượt nhận 3 → 4 điểm Năng Lượng.'
            : 'Gain 3 → 4 energy points per turn.')
          await expect(awakeningDescription).not.toContainText('92% [95%] [98%]')
          await expect(awakeningDescription).not.toContainText('3 [4]')
          await expect(skills).not.toContainText(/Awaken [123]|Thức tỉnh [123]|A[123]/)
          await expect(skills).not.toContainText(language==='vi'?'Thức tỉnh 1':'Awaken 1')
          await expect(skills.getByTestId('character-skills-content')).not.toContainText(language==='vi'?'Đang cập nhật':'Updating')
          await expect(skills.locator('img[src*="__awaken1.png"]')).toHaveCount(1)
          await expect(skills.locator('img[src*="__ultimate.png"]')).toHaveCount(0)
          await expect(skills.locator('[data-testid^="child-"]')).toHaveCount(0)
          const heading = skills.getByRole('heading', {name: skill, exact: true})
          const description = skills.getByTestId('character-skills-content').locator('p').first().locator('xpath=../..')
          await heading.click()
          await expect(description).toHaveCSS('max-height', '0px')
          await expect(description).toHaveCSS('opacity', '0')
          await heading.click()
          await expect(description).toHaveCSS('max-height', '1000px')
          await expect(description).toHaveCSS('opacity', '1')
          await skills.getByTestId('character-skills-content').screenshot({path:testInfo.outputPath('awakened-source.png')})
          await page.screenshot({path:testInfo.outputPath('detail-awakening.png'),fullPage:true})
        }
      }
      await skills.getByRole('button', { name: language === 'vi' ? 'Cốt Lõi' : 'Core', exact: true }).click()
      await expect(skills.getByText('LV 0', { exact: true })).toBeVisible()
      for (const milestone of ['Giant Soldier Power', 'Giant Soldier Power II', 'Giant Soldier Power III', 'Eccentric Power IV']) {
        await expect(skills.getByRole('heading', { name: milestone, exact: true })).toBeAttached()
      }
      await checkLayout(page)
      await page.screenshot({ path: testInfo.outputPath('detail-core.png'), fullPage: true })
      await expect.poll(() => apiResponses.length).toBeGreaterThan(0)
      expect(apiResponses.every(response => response.status === 404)).toBe(true)
      expect(errors).toEqual([])
      expect(consoleMessages.filter(message => message.type === 'warning')).toEqual([])
      expect(writes).toEqual([])
      console.log(JSON.stringify({ live, language, viewport, apiResponses, pageErrors: errors, consoleMessages, productionWrites: writes }))
      await page.reload()
      if (language === 'en') await page.getByRole('button', { name: 'Language VI', exact: true }).click()
      await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()
      await checkLayout(page)
      await page.screenshot({ path: testInfo.outputPath('detail-reloaded.png'), fullPage: true })
    })

    test(`actual Character Library first page and UR+ Hi-Tech Hero filters: ${language} ${viewport.width}`, async ({page},testInfo)=>{
      await page.setViewportSize(viewport)
      await page.route('https://api.opmwiki.app/**', route=>route.request().method()==='GET'?route.continue():route.abort())
      await page.goto('/characters')
      if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
      await expect(page.getByRole('heading',{name:language==='vi'?'Thư viện nhân vật':'Character Library',exact:true})).toBeVisible()
      const card=page.locator(`a[href="/character/${id}"]`)
      await expect(card).toHaveCount(1)
      await expect(card).toBeVisible()
      await page.locator('select').nth(0).selectOption('UR+')
      await page.locator('select').nth(1).selectOption('hi_tech')
      await page.locator('select').nth(2).selectOption('hero')
      await expect(card).toHaveCount(1)
      await expect(card.locator('img[alt="UR+"]')).toBeVisible()
      await expect(card.locator('img[src*="100320-urplus-class.webp"]')).toBeVisible()
      await checkLayout(page)
      await page.screenshot({path:testInfo.outputPath('library-filtered.png'),fullPage:true})
      await card.click()
      await expect(page.getByRole('heading',{level:1,name:language==='vi'?'Đồng Đế':'Child Emperor',exact:true})).toBeVisible()
      await page.goBack()
      await expect(page.getByRole('heading',{name:language==='vi'?'Thư viện nhân vật':'Character Library',exact:true})).toBeVisible()
    })
  }

  test(`Child Core Lab exposes level zero without changing other heroes: ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/core-lab?hero=he_100320')
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Child Emperor')
    await expect(page.getByText('Chỉ số cộng thêm', { exact: true })).toBeVisible()
    await expect(page.getByText('Giant Soldier Power', { exact: true }).last()).toBeVisible()
    await expect(page.locator('img[alt="Child Emperor"]').last()).toHaveAttribute('src', /Child Emperor \(URplus\)\/URplus\.png/)
    await checkLayout(page)
    await page.screenshot({ path: testInfo.outputPath('core-lab.png'), fullPage: true })
  })

  for(const language of ['vi','en']) {
    test(`October Home contains exactly one Child CN schedule entry: ${language} ${viewport.width}`, async ({ page,baseURL }, testInfo) => {
      await page.setViewportSize(viewport)
      const schedules=[]
      page.on('response',async response=>{
        if(response.url().includes('/api/release-schedule?') && response.ok()) schedules.push(await response.json())
      })
      await page.route('https://api.opmwiki.app/**',route=>route.request().method()==='GET'?route.continue():route.abort())
      await page.goto('/')
      if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
      await expect(page.locator('.featured-overview strong')).toHaveText('09 / 2026')
      await page.getByRole('button',{name:/Tháng sau|Next Month/i}).click()
      await expect(page.locator('.featured-overview strong')).toHaveText('10 / 2026')
      const feature=page.locator(`.featured-card[data-character="${id}"]`)
      await expect(feature).toHaveCount(1)
      await expect(feature).toHaveAttribute('data-server','CN')
      await expect(feature).toContainText(language==='vi'?'Đồng Đế':'Child Emperor')
      await expect(feature).toContainText('01 / 10 / 2026')
      await expect(feature.locator('img')).toHaveAttribute('src',/100320-urplus-600.webp/)
      await expect.poll(()=>feature.locator('img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true)
      const release=page.locator(`.release-card[href="/character/${id}"]`)
      await expect(release).toHaveCount(1)
      await checkLayout(page)
      if(new URL(baseURL).port==='5173') {
        await expect.poll(()=>schedules.length).toBeGreaterThan(0)
        for(const rows of schedules) {
          expect(rows).toHaveLength(22)
          expect(rows.filter(row=>row.characterId===id)).toHaveLength(0)
        }
        console.log(JSON.stringify({language,productionScheduleRows:22,bundledChildRows:4,octoberChildRows:1,productionApiUnchanged:true}))
      }
      await page.screenshot({ path: testInfo.outputPath('home-october.png'), fullPage: true })
      // The diagonal desktop CN/SEA cards overlap at their bounding-box centers.
      // Click the visible CN title, not the shared geometric center (no force).
      await feature.locator('h2').click()
      await expect(page.getByRole('heading',{level:1,name:language==='vi'?'Đồng Đế':'Child Emperor',exact:true})).toBeVisible()
    })
  }
}

for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  for (const language of ['vi','en']) {
    test(`four planned Child history events use Home release/return pattern: ${language} ${viewport.width}`, async ({page},testInfo) => {
      await page.setViewportSize(viewport)
      const errors=[]
      page.on('pageerror',error=>errors.push(error.message))
      await page.goto('/')
      if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
      let currentMonth=9
      for (const event of [
        {month:10,date:'01 / 10 / 2026',server:'CN',returning:false},
        {month:12,date:'01 / 12 / 2026',server:'CN',returning:true},
        {month:14,date:'01 / 02 / 2027',server:'SEA',returning:false},
        {month:16,date:'01 / 04 / 2027',server:'SEA',returning:true},
      ]) {
        while(currentMonth<event.month) {
          await page.getByRole('button',{name:/Tháng sau|Next Month/i}).click()
          currentMonth++
          await expect(page.locator('.featured-overview strong')).toHaveText(`${String((currentMonth-1)%12+1).padStart(2,'0')} / ${currentMonth>12?'2027':'2026'}`)
        }
        const card=page.locator(`.release-card[href="/character/${id}"]`)
        await expect(card).toHaveCount(1)
        await expect(card).toContainText(event.date)
        await expect(card).toContainText(language==='vi'?'Dự kiến':'Planned')
        await expect(card.locator('xpath=ancestor::section[contains(@class,"server-section")]')).toHaveAttribute('data-server',event.server)
        if(event.returning) await expect(card).toHaveClass(/is-return/)
        else await expect(card).not.toHaveClass(/is-return/)
        await card.scrollIntoViewIfNeeded()
        await expect.poll(()=>card.locator('img').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true)
        await checkLayout(page)
        await page.screenshot({path:testInfo.outputPath(`history-month-${event.month}.png`),fullPage:true})
      }
      expect(errors).toEqual([])
    })
  }
}

test('all eight approved Child image assets return real image content', async ({ request }) => {
  for (const asset of assets) {
    const response = await request.get(asset)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/image\/(png|webp)/)
    console.log(`${response.status()} ${response.headers()['content-type']} ${asset}`)
  }
})

for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  for (const language of ['vi','en']) {
    for (const reference of ['100045-ur','100045-ssrplus','homeless-emperor-urplus','100314-urplus','blacksperm-urplus']) {
      test(`generic reference cards ${reference} ${language} ${viewport.width}`, async ({page},testInfo) => {
        await page.setViewportSize(viewport)
        // Local payloads make reference rendering deterministic; no production mutation.
        await page.route('**/api/characters/**', route => route.fulfill({status:404,body:'{}'}))
        await page.goto(`/character/${reference}`)
        if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
        if(reference==='100045-ur') await expect(page.getByText('SS',{exact:true})).toBeVisible()
        const skills=page.getByTestId('character-skills')
        await skills.scrollIntoViewIfNeeded()
        await skills.getByRole('button',{name:language==='vi'?'TUYỆT KĨ':'ULTIMATE',exact:true}).click()
        await expect(skills.getByRole('heading',{level:3})).toHaveCount(2)
        await expect(skills.getByRole('heading',{name:language==='vi'?'Siêu tuyệt kĩ':(/Super Ultimate|Ultra-Ultimate/),exact:true})).toBeVisible()
        await skills.getByRole('button',{name:language==='vi'?'NỘI TẠI':'PASSIVE',exact:true}).click()
        const headings=skills.getByRole('heading',{level:3})
        await expect(headings).toHaveCount(3)
        for(const index of [0,1,2]) {
          const heading=headings.nth(index)
          await heading.scrollIntoViewIfNeeded()
          const card=heading.locator('xpath=ancestor::div[@class and contains(@class,"flex-shrink-0")][1]')
          await expect(card).toContainText(index===0?'★★':'★★★★★')
          await expect(heading).toHaveCSS('font-size','18px')
          await expect(card).toHaveCSS('border-radius','8px')
          await expect(card.locator('img').first()).toHaveAttribute('width','56')
        }
        await skills.getByTestId('character-skills-content').screenshot({path:testInfo.outputPath('reference-passive.png')})
        await skills.getByRole('button',{name:language==='vi'?'THỨC TỈNH':'AWAKENING',exact:true}).click()
        await expect(skills.getByRole('heading',{level:3}).first()).toContainText(language==='vi'?'Nội tại Thức tỉnh':/Awaken|Awakened/)
        await expect(skills.getByRole('heading',{level:3})).toHaveCount(3)
        await expect(skills.locator('[data-testid^="child-"]')).toHaveCount(0)
        await skills.getByTestId('character-skills-content').screenshot({path:testInfo.outputPath('reference-awakening.png')})
        await checkLayout(page)
      })
    }
  }
}
