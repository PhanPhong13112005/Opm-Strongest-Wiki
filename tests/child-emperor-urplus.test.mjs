import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { getPassiveUpgradeTone, getSkillDescriptionForDisplay } from '../src/utils/skillPresentation.js'
import { getCharacterReleaseDates } from '../src/utils/characterReleaseDates.js'
import { mergeCharacterDetail } from '../src/services/characterApi.js'

const root = path.resolve(import.meta.dirname, '..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const charactersVi = readJson('src/data/characters.json')
const charactersEn = readJson('src/data/characters_en.json')
const coreLab = readJson('src/data/coreLab.json')
const id = '100320-urplus'

const expectedAssets = new Map([
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__basic.png', 'D39D338C6107D276586CA2B2AD32F233141562F585FFD5F83234537BD5CB43C4'],
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__ultimate.png', '118F844C411D015F5920015985D3093931B2A6F011F1FED62D445EBCC7ECF816'],
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__passive.png', 'F47F489074EDC526BACACE3482F2651799E5C608F1A366153077031815594B1D'],
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__awaken1.png', 'D6E12BFDA567C292C7E7ED093FD1B52AA63F9C01D99EE5EA58FC69317DE364E0'],
])

test('Child Emperor UR+ visuals use the approved portrait and retain responsive transparency', async () => {
  const portrait = '/Characters/Child Emperor (URplus)/URplus.png'
  const background = '/Characters/Full_Background/Child_URplus.png'
  for (const characters of [charactersVi, charactersEn]) {
    assert.equal(characters.find(character => character.id === id).imageURL, portrait)
  }
  for (const asset of [portrait, background]) {
    const bytes = fs.readFileSync(path.join(root, 'public', asset.slice(1)))
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),
      '1E160D4FB20286648EEEF62A73C736228DCC60BB3062430838FF768B08253E22')
    const metadata = await sharp(bytes).metadata()
    assert.equal(metadata.format, 'png')
    assert.equal(metadata.hasAlpha, true)
    assert.deepEqual([metadata.width, metadata.height], [1298, 1212])
  }
  for (const width of [360, 600]) {
    const image = sharp(path.join(root, 'public/Characters/optimized', `${id}-${width}.webp`))
    const metadata = await image.metadata()
    assert.equal(metadata.width, width)
    assert.equal(metadata.height, Math.round(width * 1212 / 1298))
    assert.equal(metadata.hasAlpha, true)
    assert.equal((await image.stats()).isOpaque, false)
    await image.raw().toBuffer()
  }
  for (const language of ['vi', 'en']) {
    const detail = readJson(`public/character-details/${language}/${id}.json`)
    assert.equal(detail.imageURL, `/Characters/optimized/${id}-600.webp`)
    assert.deepEqual([detail.imageWidth, detail.imageHeight], [1298, 1212])
  }
})

test('Child Emperor UR+ is a unique bilingual catalog record with sourced identity and stats', () => {
  const vietnamese = charactersVi.filter(character => character.id === id)
  const english = charactersEn.filter(character => character.id === id)
  assert.equal(vietnamese.length, 1)
  assert.equal(english.length, 1)
  assert.equal(vietnamese[0].name, 'Đồng Đế')
  assert.equal(english[0].name, 'Child Emperor')
  assert.equal(vietnamese[0].tier, 'UR+')
  assert.deepEqual(vietnamese[0].baseStats, { atk: 683, hp: 4095, def: 173, spd: 118 })
  assert.equal(vietnamese[0].faction, 'Anh Hùng')
  assert.equal(vietnamese[0].type, 'Công Nghệ')
  assert.equal(english[0].faction, 'Hero')
  assert.equal(english[0].type, 'Hi-Tech')
  assert.equal(vietnamese[0].classLevel, 'Class_SS')
  assert.equal(vietnamese[0].classIcon, '/Class/Class_SS.png')
  assert.deepEqual(vietnamese[0].roles, ['Strike Core – Ready For Battle'])
  assert.equal(vietnamese[0].mechanicsLanguage, 'vi')
  assert.equal(vietnamese[0].releaseTrung, '01/10/2026')
  assert.equal(vietnamese[0].releaseSea, '01/02/2027')
})

test('Child Emperor UR+ keeps authoritative prose and maps icons without fabricated A2/A3 assets', async () => {
  const character = charactersEn.find(item => item.id === id)
  assert.deepEqual(new Set(character.skills.map(skill => skill.icon)), new Set(expectedAssets.keys()))
  assert.equal(character.skills[0].desc, 'Updating.')
  assert.match(character.skills[1].desc, /5000% \[Specialized Direct DMG\]/)
  assert.match(character.skills[1].desc, /\[Re-Battle\] uses for all enemies by 3 when/)
  assert.match(character.skills[2].desc, /\[Re-Battle\] uses for all enemies by 4 when/)
  assert.match(character.skills[3].desc, /80% \[Specialized/)
  assert.match(character.skills[3].desc, /\[Energy Reduction\].*\[Energy Lock\]/s)
  assert.match(character.skills[6].desc, /3 \[4\] energy points/)
  assert.match(character.skills[6].desc, /92% \[95%\] \[98%\] \[True DMG Reduction\]/)
  assert.equal(character.skills[6].icon, [...expectedAssets.keys()][3])
  assert.ok(character.skills.every(skill => skill.cost === 0))

  for (const [assetUrl, expectedHash] of expectedAssets) {
    const filePath = path.join(root, 'public', ...assetUrl.slice(1).split('/'))
    const buffer = fs.readFileSync(filePath)
    assert.equal(crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase(), expectedHash)
    const metadata = await sharp(buffer).metadata()
    assert.equal(metadata.format, 'png')
    assert.equal(metadata.width, 512)
    assert.equal(metadata.height, 512)
  }
})

test('Child Emperor UR+ Core Detail represents every level once and preserves sourced milestones', () => {
  const core = coreLab.heroes.find(hero => hero.characterId === id)
  assert.ok(core)
  assert.deepEqual(core.milestones, [4, 10, 17])
  assert.deepEqual(core.bonusStats_en, ['Follow-up DMG', 'Block Rate'])
  assert.equal(core.gate_basic_en, '1× Grappler + 1× Duelist + 1× Hi-Tech')
  assert.equal(core.gate_advanced_en, '1× Grappler + 1× Duelist + 1× Esper + 1× Hi-Tech')
  assert.equal(core.levels.length, 21)
  assert.deepEqual(core.levels.map(level => level.lv), Array.from({ length: 21 }, (_, index) => index))
  assert.equal(new Set(core.levels.map(level => level.lv)).size, 21)
  assert.deepEqual(
    [0, 4, 10, 17].map(level => core.levels.find(item => item.lv === level).coreName_en),
    ['Giant Soldier Power', 'Giant Soldier Power II', 'Giant Soldier Power III', 'Eccentric Power IV'],
  )
  for (const level of [0, 4, 10, 17]) {
    assert.equal(core.levels.find(item => item.lv === level).isMilestone, true)
  }
  assert.match(core.levels[0].coreEffect_en, /\[Ready for Battle\]: Only one/)
})

test('Child revision preserves every other catalog row and English source mechanics', () => {
  const gitJson = (revision, relativePath) => JSON.parse(execFileSync('git', ['show', `${revision}:${relativePath}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }))
  const base = '8506f7b7ea3cca8d934d86e071c72af327860e97'
  const approved = '3f838ff9dd5145e2257b20d51b59da604c558c4a'
  for (const relativePath of ['src/data/characters.json', 'src/data/characters_en.json']) {
    const rows = readJson(relativePath)
    assert.equal(rows.length, 179)
    assert.equal(new Set(rows.map(row => row.id)).size, 179)
    assert.deepEqual(rows.filter(row => row.id !== id), gitJson(base, relativePath))
    const child = rows.find(row => row.id === id)
    const source = gitJson(approved, relativePath).find(row => row.id === id)
    assert.deepEqual(child.baseStats, source.baseStats)
    assert.equal(child.imageURL, source.imageURL)
    assert.equal(child.tier, source.tier)
    assert.equal(child.classLevel, 'Class_SS')
    if (relativePath.endsWith('characters_en.json')) {
      for (const [sourceIndex, currentIndex] of [[0,0],[3,6]]) {
        assert.equal(child.skills[currentIndex].desc, source.skills[sourceIndex].desc)
      }
      for (const [index, value] of ['80%', '85%', '90%'].entries()) {
        assert.equal(child.skills[index + 3].desc, source.skills[2].desc.replace('80% [85%] [90%]', value))
      }
      for (const [index, damage, reduction] of [[1, '5000%', '3'], [2, '7000%', '4']]) {
        assert.equal(child.skills[index].desc, source.skills[1].desc
          .replace('5000% [7000%]', damage).replace('enemies by 3 [4]', `enemies by ${reduction}`))
      }
      assert.deepEqual(child.effects, source.effects)
    }
  }
  for (const language of ['vi', 'en']) {
    const rows = readJson('src/data/characterSummaries.json')[language]
    assert.equal(rows.length, 179)
    assert.deepEqual(rows.filter(row => row.id !== id), gitJson(base, 'src/data/characterSummaries.json')[language])
    const summary = rows.find(row => row.id === id)
    assert.equal(summary.classLevel, 'Class_SS')
    assert.equal(summary.releaseTrung, '01/10/2026')
    assert.equal(summary.releaseSea, '01/02/2027')
    const detailPath = `public/character-details/${language}/${id}.json`
    const detail = readJson(detailPath)
    const catalog = (language === 'vi' ? charactersVi : charactersEn).find(row => row.id === id)
    assert.deepEqual(detail.skills, catalog.skills)
    assert.deepEqual(detail.effects, catalog.effects)
    assert.equal(detail.classLevel, summary.classLevel)
    assert.equal(detail.releaseTrung, summary.releaseTrung)
  }
  const approvedCore = gitJson(approved, 'src/data/coreLab.json').heroes.find(row => row.characterId === id)
  approvedCore.portrait = '/Characters/Child Emperor (URplus)/URplus.png'
  const withoutVi = value => JSON.parse(JSON.stringify(value, (key, child) => key.endsWith('_vi') ? undefined : child))
  assert.deepEqual(withoutVi(coreLab.heroes.find(row => row.characterId === id)), withoutVi(approvedCore))
  const oldCore = gitJson(base, 'src/data/coreLab.json')
  assert.deepEqual({ ...coreLab, heroes: coreLab.heroes.filter(row => row.characterId !== id) }, oldCore)
})

test('Child passive states use generic cards and awakening retains only supported source', () => {
  for (const character of [charactersVi.find(row => row.id === id), charactersEn.find(row => row.id === id)]) {
    assert.equal(character.skills.length, 7)
    const states = character.skills.filter(skill => skill.type === 'Passive')
    assert.equal(states.length, 3)
    assert.deepEqual(states.map(skill => skill.desc.match(/\d+%/)[0]), ['80%', '85%', '90%'])
    assert.deepEqual(states.map(getPassiveUpgradeTone), ['base-stars', 'gold', 'purple'])
    assert.equal(new Set(states.map(skill => skill.icon)).size, 1)
    const awaken = character.skills.filter(skill => skill.type === 'Awakening')
    assert.equal(awaken.length, 1)
    assert.match(awaken[0].desc, /92% \[95%\] \[98%\]/)
    assert.match(awaken[0].desc, /3 \[4\]/)
    const displayed = getSkillDescriptionForDisplay(awaken[0])
    assert.match(displayed, /92% → 95% → 98%/)
    assert.match(displayed, /3 → 4/)
    assert.doesNotMatch(displayed, /92% \[95%\]|3 \[4\]/)
    for (const skill of character.skills.filter(skill => skill.type !== 'Awakening')) {
      assert.equal(getSkillDescriptionForDisplay(skill), skill.desc)
    }
    assert.doesNotMatch(awaken[0].desc, /Thức tỉnh [123]|Awaken [123]|Đang cập nhật|Updating/)
    for (const skill of character.skills) {
      for (const key of ['progression', 'progressionNote', 'effectProgressions']) assert.equal(Object.hasOwn(skill, key), false)
    }
    assert.doesNotMatch(JSON.stringify(character.skills), /(?:lose|consume|remove|cost|start with)[^.!\n]{0,25}(?:2|two)\s+Energy|(?:mất|tiêu hao|tiêu thụ|trừ)\s*2\s*(?:nộ|Năng Lượng)|[-−]2\s*(?:Energy|nộ|Năng Lượng)/i)
  }
  const detail = fs.readFileSync(path.join(root, 'src/views/DetailView.vue'), 'utf8')
  assert.doesNotMatch(detail, /100320-urplus|child-passive-progression|effectProgressions|skill\.progression/)
  assert.match(detail, /getPassiveUpgradeTone.*from '\.\.\/utils\/skillPresentation'/)
  assert.match(detail, /formatSkillDesc\(getSkillDescriptionForDisplay\(skill\)\)/)
  const vi = charactersVi.find(row => row.id === id)
  assert.doesNotMatch(JSON.stringify(vi.skills), /Deals|Grants|Upon entering|At battle start|Gain \d|Updating\./)
})

test('Child uses two owner-approved offensive states and one source-only awakening through generic cards', () => {
  for (const language of ['vi','en']) {
    const character = (language === 'vi' ? charactersVi : charactersEn).find(row=>row.id===id)
    const detail = readJson(`public/character-details/${language}/${id}.json`)
    for (const value of [character,detail]) {
      assert.deepEqual(value.skills.map(skill=>skill.type),['Basic','Ultimate','Ultimate','Passive','Passive','Passive','Awakening'])
      const offensive = value.skills.filter(skill=>skill.type==='Ultimate')
      assert.deepEqual(offensive.map(skill=>skill.name),language==='vi'?['Tuyệt kĩ','Siêu tuyệt kĩ']:['Ultimate','Super Ultimate'])
      assert.deepEqual(offensive.map(skill=>skill.desc.match(/\d+%/)[0]),['5000%','7000%'])
      assert.ok(offensive.every(skill=>skill.icon===[...expectedAssets.keys()][1] && skill.cost===0))
      // Owner confirms 3/4 Re-Battle reductions for Ultimate/Super, not Energy.
      const reductionPattern = language === 'vi'
        ? /giảm (\d+) lần sử dụng \[Tái Chiến\] của toàn bộ kẻ địch/
        : /\[Re-Battle\] uses for all enemies by (\d+) when/
      assert.deepEqual(offensive.map(skill => skill.desc.match(reductionPattern)?.[1]), ['3', '4'])
      assert.ok(offensive.every(skill => !/3 \[4\]|Năng Lượng|energy/i.test(skill.desc)))
      assert.equal(offensive[0].desc.replace('5000%', 'DAMAGE').replace(reductionPattern, 'REBATTLE'),
        offensive[1].desc.replace('7000%', 'DAMAGE').replace(reductionPattern, 'REBATTLE'))
      assert.equal(new Set(value.skills.map(skill=>skill.name)).size,7)
      const awakening=value.skills.filter(skill=>skill.type==='Awakening')
      assert.equal(awakening.length,1)
      assert.match(awakening[0].desc,/92% \[95%\] \[98%\]/)
      assert.match(awakening[0].desc,/3 \[4\]/)
    }
    const api={id,skills:[character.skills[0],character.skills[1],character.skills[3],character.skills[6]].map((skill,sortOrder)=>({name:skill.name,type:skill.type,description:skill.desc,iconUrl:skill.icon,sortOrder}))}
    assert.deepEqual(JSON.parse(JSON.stringify(mergeCharacterDetail(api,detail,language).skills)),detail.skills)
  }
})

test('Child detail retains the production hybrid local fallback instead of requiring an API record', () => {
  const detail = fs.readFileSync(path.join(root, 'src/views/DetailView.vue'), 'utf8')
  const api = fs.readFileSync(path.join(root, 'src/services/characterApi.js'), 'utf8')
  assert.match(detail, /apiCharacter\.value \|\| localCharacter\.value/)
  assert.match(detail, /loadLocalCharacterDetail\(id, language\)/)
  assert.match(detail, /getCharacterReleaseDates/)
  assert.deepEqual(getCharacterReleaseDates(charactersVi.find(row => row.id === id), [], 'pending'), {trungRelease:'01/10/2026',trungReturn:'01/12/2026',seaRelease:'01/02/2027',seaReturn:'01/04/2027'})
  assert.match(api, /if \(resolvedLocalCharacter\) return resolvedLocalCharacter/)
})

test('revised Child detail bypasses the old payload cache without changing other character URLs', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    const language = url.includes('/en/') ? 'en' : 'vi'
    const oldChild = { id, classLevel: 'Mecha Overlord', releaseTrung: '10/2026' }
    const payload = url.includes(id)
      ? (url.includes('?v=child-skill-rules-20261008') ? readJson(`public/character-details/${language}/${id}.json`) : oldChild)
      : { id: '100045-ur' }
    return { ok: true, json: async () => payload }
  }
  try {
    const { loadLocalCharacterDetail } = await import('../src/data/loadCharacterDetail.js')
    for (const language of ['vi', 'en']) {
      const detail = await loadLocalCharacterDetail(id, language)
      assert.equal(detail.classLevel, 'Class_SS')
      assert.equal(detail.releaseTrung, '01/10/2026')
      assert.equal(detail.skills.length, 7)
    }
    await loadLocalCharacterDetail('100045-ur', 'vi')
    assert.deepEqual(requests.map(request => request.url), [
      `/character-details/vi/${id}.json?v=child-skill-rules-20261008`,
      `/character-details/en/${id}.json?v=child-skill-rules-20261008`,
      '/character-details/vi/100045-ur.json',
    ])
    assert.ok(requests.every(request => request.options.cache === 'force-cache'))
    await loadLocalCharacterDetail(id, 'vi')
    assert.equal(requests.length, 3)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('Child four canonical history events preserve every other bundled record unchanged', () => {
  const schedule=readJson('src/data/releaseSchedule.json')
  const base=JSON.parse(execFileSync('git',['show','8506f7b7ea3cca8d934d86e071c72af327860e97:src/data/releaseSchedule.json'],{cwd:root,encoding:'utf8'}))
  assert.deepEqual(schedule.filter(row=>row.characterId!==id),base)
  assert.deepEqual(schedule.filter(row=>row.characterId===id).map(row=>[row.server,row.date,row.isReturn]),[['CN','2026-10-01',false],['CN','2026-12-01',true],['SEA','2027-02-01',false],['SEA','2027-04-01',true]])
  assert.equal(schedule.length,23)
  assert.equal(new Set(schedule.map(row=>`${row.server}|${row.date}|${row.sortOrder}`)).size,23)
})

test('production-base schedule merge appends Child once and deduplicates an API-provided Child key', () => {
  const source=fs.readFileSync(path.join(root,'src/services/releaseScheduleApi.js'),'utf8')
  const implementation=source.replace(/^import .*$/gm,'').split('export const getReleaseSchedule')[0]
  const schedule=readJson('src/data/releaseSchedule.json')
  const merge=new Function('fallbackSchedule',implementation+'\nreturn mergeReleaseSchedule')(schedule)
  // Synthetic API rows exercise the real merge; not a production snapshot.
  const api=schedule.filter(row=>row.characterId!==id).concat([1,2,3].map(n=>({server:'CN',date:`2028-0${n}-01`,sortOrder:1,characterId:'synthetic-api-only',isReturn:false})))
  assert.equal(api.length,22)
  const merged=merge(api,'vi')
  assert.equal(merged.length,26)
  assert.equal(merged.filter(row=>row.characterId===id).length,4)
  const alreadyPresent=merge([...api,schedule.find(row=>row.characterId===id)],'en')
  assert.equal(alreadyPresent.length,26)
  assert.equal(alreadyPresent.filter(row=>row.characterId===id).length,4)
})
