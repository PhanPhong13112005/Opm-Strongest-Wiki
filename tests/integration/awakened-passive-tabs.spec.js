import { expect, test } from '@playwright/test'

const cardFor = heading => heading.locator('xpath=ancestor::div[@class and contains(@class,"flex-shrink-0")][1]')
for (const viewport of [{width:1440,height:1000},{width:390,height:844},{width:375,height:812},{width:320,height:800}]) {
  for (const language of ['vi','en']) {
    test('Awakened Passive generic upgrade cards and Energy: '+language+' '+viewport.width, async ({page},info)=>{
      await page.setViewportSize(viewport)
      const errors=[]
      page.on('pageerror',error=>errors.push(error.message))
      await page.route('**/api/characters/**',route=>route.fulfill({status:404,body:'{}'}))
      const openAwakening=async()=>{
        await page.goto('/character/100320-urplus',{waitUntil:'domcontentloaded'})
        if(language==='en') await page.getByRole('button',{name:'Language VI',exact:true}).click()
        await expect(page.locator('.character-hero h1')).toBeVisible()
        await expect(page.getByTestId('character-skills')).toBeVisible()
        await expect.poll(()=>page.locator('.character-hero img[src*="/Characters/"]').evaluateAll(images=>
          images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true)
        await page.getByTestId('character-skills').scrollIntoViewIfNeeded()
        await expect(page.getByTestId('character-skills').getByRole('button',{name:language==='vi'?'THỨC TỈNH':'AWAKENING',exact:true})).toBeEnabled()
        await page.getByTestId('character-skills').getByRole('button',{name:language==='vi'?'THỨC TỈNH':'AWAKENING',exact:true}).click()
        const firstAwakenedCard=cardFor(page.getByTestId('character-skills').getByRole('heading',{level:3}).first())
        await expect(firstAwakenedCard.locator('p').first()).toContainText('92%')
        await expect(firstAwakenedCard.locator('p').first()).toContainText(language==='vi'?'Mỗi lượt nhận 3 điểm Năng Lượng.':'Gain 3 energy points per turn.')
        await expect.poll(()=>firstAwakenedCard.locator('img[src*="__awaken1.png"]').evaluate(image=>image.complete&&image.naturalWidth===512)).toBe(true)
      }
      await openAwakening()
      const skills=page.getByTestId('character-skills')
      const headings=skills.getByRole('heading',{level:3})
      await expect(headings).toHaveCount(3)
      await expect(skills.locator('[data-skill-numeric-progression]')).toHaveCount(0)
      await expect(skills.getByRole('tab')).toHaveCount(0)
      await expect(skills.locator('[data-stage-unlock-note]')).toContainText(language==='vi'?'wiki cộng đồng':'Community wiki')
      await expect(skills.locator('[data-stage-unlock-note]')).toContainText(language==='vi'?'chưa được xác minh':'remain unverified')
      for(const [index,value] of ['92%','95%','98%'].entries()) {
        const heading=headings.nth(index),card=cardFor(heading)
        const description=card.locator('div.overflow-hidden.transition-all')
        const paragraph=card.locator('p').first()
        await expect(heading).toHaveText((language==='vi'?'Nội tại Thức tỉnh':'Awakened Passive')+' — A'+(index+1))
        if(index>0) {await headings.nth(index-1).click();await heading.click()}
        await expect(description).toHaveCSS('max-height','1000px')
        await expect(heading).toHaveCSS('color','rgb(0, 168, 255)')
        await expect(heading).toHaveCSS('font-size','18px')
        await expect(heading).toHaveCSS('font-weight','700')
        await expect(card).toHaveCSS('border-radius','8px')
        await expect(paragraph).toHaveCSS('font-family','Inter, Roboto, sans-serif')
        await expect(paragraph).toHaveCSS('font-size','14px')
        await expect(paragraph).toHaveCSS('line-height','22.75px')
        await expect(paragraph).toHaveCSS('color','rgb(209, 213, 219)')
        await expect(paragraph).toContainText(value)
        await expect(paragraph).toContainText(language==='vi'
          ? 'Mỗi lượt nhận '+(index===2?4:3)+' điểm Năng Lượng.' : 'Gain '+(index===2?4:3)+' energy points per turn.')
        for(const other of ['92%','95%','98%'].filter(token=>token!==value)) await expect(paragraph).not.toContainText(other)
        await expect(paragraph).not.toContainText(/3 \[4\]|92% \[95%\] \[98%\]|★|publisher-confirmed/)
        await expect.poll(()=>card.locator('img[src*="__awaken1.png"]').evaluate(image=>image.complete&&image.naturalWidth===512)).toBe(true)
        await heading.click()
        await expect(description).toHaveCSS('max-height','0px')
        await expect(heading).toHaveCSS('color','rgb(209, 213, 219)')
        await heading.click()
        await expect(description).toHaveCSS('max-height','1000px')
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
        await skills.getByTestId('character-skills-content').screenshot({path:info.outputPath('awakened-'+language+'-'+viewport.width+'-state-'+(index+1)+'.png')})
      }
      await skills.getByRole('button',{name:language==='vi'?'NỘI TẠI':'PASSIVE',exact:true}).click()
      await expect(headings).toHaveCount(3)
      for(const [index,value] of ['80%','85%','90%'].entries()) await expect(cardFor(headings.nth(index))).toContainText(value)
      await skills.getByRole('button',{name:language==='vi'?'TUYỆT KĨ':'ULTIMATE',exact:true}).click()
      await expect(headings).toHaveCount(2)
      await expect(skills).toContainText('5000%')
      await expect(skills).toContainText('7000%')
      await openAwakening()
      await expect(headings).toHaveCount(3)
      await expect(cardFor(headings.first()).locator('div.overflow-hidden.transition-all')).toHaveCSS('max-height','1000px')
      expect(errors).toEqual([])
    })
  }
}
