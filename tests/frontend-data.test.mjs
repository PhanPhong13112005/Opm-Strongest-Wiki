import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { decodeAssetUrlForLocalServer, safeAssetUrl } from '../src/utils/assetUrl.js'
import { getSkillEnergyCost } from '../src/utils/skillPresentation.js'
import { mapCharacterSummary, mergeCharacterDetail, reconcileCharacterPage } from '../src/services/characterApi.js'
import { mergeKeepsakeCatalog } from '../src/services/keepsakeApi.js'
import characterNameAliases from '../src/data/characterNameAliases.js'

const root = path.resolve(import.meta.dirname, '..')
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))

const charactersVi = readJson('src/data/characters.json')
const charactersEn = readJson('src/data/characters_en.json')

const coreLab = readJson('src/data/coreLab.json')
const events = readJson('src/data/events.json')
const releaseSchedule = readJson('src/data/releaseSchedule.json')
const backgear = readJson('src/data/backgear.json')
const equipment = readJson('src/data/equipment.json')
const tactics = readJson('src/data/tactics.json')
const vi = readJson('src/locales/vi.json')
const en = readJson('src/locales/en.json')

const leafKeys = (value, prefix = '', output = []) => {
  for (const [key, child] of Object.entries(value || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      leafKeys(child, fullKey, output)
    } else {
      output.push(fullKey)
    }
  }
  return output
}

test('Vietnamese and English locale files expose the same keys', () => {
  assert.deepEqual(leafKeys(vi).sort(), leafKeys(en).sort())
})

test('Gear and Buff Gear expose independent routes, menu links, and catalogs', () => {
  const routerSource = fs.readFileSync(path.join(root, 'src/router/index.js'), 'utf8')
  const appSource = fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8')
  const equipmentView = fs.readFileSync(path.join(root, 'src/views/GearCatalogView.vue'), 'utf8')
  const equipmentWorkbench = fs.readFileSync(path.join(root, 'src/components/GearCatalogWorkbench.vue'), 'utf8')
  const buffGearView = fs.readFileSync(path.join(root, 'src/views/BuffGearView.vue'), 'utf8')

  assert.match(routerSource, /path: '\/equipment'/)
  assert.match(routerSource, /path: '\/buff-gear'/)
  assert.doesNotMatch(routerSource, /path: '\/gear'/)
  assert.equal((appSource.match(/to="\/equipment"/g) || []).length, 2)
  assert.equal((appSource.match(/to="\/buff-gear"/g) || []).length, 2)
  assert.equal((appSource.match(/class="mobile-command-menu__toggle"/g) || []).length, 2)
  assert.ok(appSource.includes(':aria-expanded="isMobileSystemsOpen"'))
  assert.ok(appSource.includes(':aria-expanded="isMobileFeaturesOpen"'))
  assert.equal(vi.nav.systems, 'Hệ Thống')
  assert.equal(vi.nav.features, 'Tính Năng')
  assert.equal(en.nav.systems, 'Systems')
  assert.equal(en.nav.features, 'Features')
  assert.ok(appSource.includes("const featureRoutes = ['/mastery', '/core-lab', '/core-refinement', '/medals', '/tactics', '/talents']"))
  assert.ok(appSource.includes("const systemRoutes = ['/equipment', '/buff-gear', '/stats', '/backgear', '/keepsakes', '/insignias']"))
  assert.equal((appSource.match(/to="\/gear"/g) || []).length, 0)
  assert.ok(equipmentView.includes('GearCatalogWorkbench'))
  assert.ok(equipmentWorkbench.includes('equipFullSet'))
  assert.ok(equipmentWorkbench.includes('setGoldStars'))
  assert.ok(equipmentWorkbench.includes('setPurpleStars'))
  assert.equal(equipment.sets.length, 20)
  assert.equal(new Set(equipment.sets.map(item => item.id)).size, 20)
  assert.equal(equipment.groups.length, 4)
  assert.equal(equipment.slots.length, 4)
  for (const dataModule of ['slots.js', 'progression.js', 'skills.js', 'terminology.js']) {
    assert.ok(buffGearView.includes(dataModule), `Buff Gear is missing ${dataModule}`)
  }
  for (const tab of ['overview', 'stats', 'redUpgrade']) {
    assert.ok(buffGearView.includes(tab), `Buff Gear is missing ${tab}`)
  }
  assert.ok(buffGearView.includes('loading="lazy"'))
  assert.equal(en.buffGear.title, 'Buff Gear')
  assert.equal(vi.buffGear.title, 'Thẻ Bổ Trợ')
  assert.equal(vi.buffGear.tabs.overview, 'Tổng quan Buff Gear')
  assert.equal(en.buffGear.tabs.overview, 'Buff Gear Overview')
  assert.equal(vi.buffGear.slots.faction.example, 'Anh Hùng')
})
test('home month and mobile navigation transitions expose matching CSS hooks', () => {
  const appSource = fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8')
  const globalStyle = fs.readFileSync(path.join(root, 'src/assets/style.css'), 'utf8')
  const homeRadar = fs.readFileSync(path.join(root, 'src/components/HomeRadar.vue'), 'utf8')

  assert.ok(appSource.includes('<transition name="mobile-menu">'))
  assert.ok(globalStyle.includes('.mobile-menu-enter-active'))
  assert.ok(globalStyle.includes('.mobile-features-enter-from'))
  assert.ok(globalStyle.includes('max-height:0'))
  for (const transition of ['fade', 'slide-left', 'slide-right']) {
    assert.ok(
      homeRadar.includes(`.${transition}-enter-active`),
      `HomeRadar is missing ${transition} transition CSS`,
    )
  }
  assert.ok(homeRadar.includes('@media(prefers-reduced-motion:reduce)'))
  assert.equal((homeRadar.match(/<transition :name="transitionName" mode="out-in">/g) || []).length, 2)
  assert.ok(homeRadar.includes(':key="`hero-${currentMonth}`"'))
  assert.ok(homeRadar.includes('translateX(72px)'))
  assert.equal((homeRadar.match(/class="energy-ring/g) || []).length, 2)
  assert.ok(homeRadar.includes('animation:slowSpin 14s linear infinite'))
  assert.ok(homeRadar.includes('animation-duration:10s'))
  assert.ok(homeRadar.includes('.energy-ring::before,.energy-ring::after'))
  assert.doesNotMatch(homeRadar, /\.energy-ring[^}]*animation:none!important/)
})
test('localized character catalogs share stable IDs', () => {
  assert.equal(charactersVi.length, 177)
  assert.equal(charactersEn.length, charactersVi.length)
  assert.equal(new Set(charactersVi.map(character => character.id)).size, charactersVi.length)
  assert.deepEqual(
    charactersVi.map(character => character.id).sort(),
    charactersEn.map(character => character.id).sort(),
  )
})

test('Vietnamese character names and effects match the completed localization guide', () => {
  const guide = fs.readFileSync(
    path.join(root, 'docs/VIET_HOA_HIEU_UNG_VA_TEN_NHAN_VAT_HOAN_CHINH.md'),
    'utf8',
  )
  const lines = guide.split(/\r?\n/)
  const characterSection = lines.findIndex(line => line.startsWith('## 2.'))
  const tick = String.fromCharCode(96)
  const parseCells = (line) => {
    const cells = line.split('|').slice(1)
    if (cells.at(-1)?.trim() === '') cells.pop()
    return cells.map(cell => cell.trim().replaceAll(tick, ''))
  }
  const parseRows = rows => rows
    .filter(line => /^\|\s*\d+\s*\|/.test(line))
    .map(parseCells)

  assert.notEqual(characterSection, -1)
  const effectRows = parseRows(lines.slice(0, characterSection))
  const characterRows = parseRows(lines.slice(characterSection))
  assert.equal(effectRows.length, 318)
  assert.equal(characterRows.length, 177)
  assert.ok(effectRows.every(cells => /\[x\]/i.test(cells[1]) && cells[2] && cells[3]))
  assert.ok(characterRows.every(cells => /\[x\]/i.test(cells[1]) && cells[2] && cells[6]))

  const effectMappings = new Map(effectRows.map(cells => [cells[2], cells[3]]))
  const localizedEffectNames = new Set(effectMappings.values())
  const characterNames = new Map(characterRows.map(cells => [cells[2], cells[6]]))
  const englishById = new Map(charactersEn.map(character => [character.id, character]))

  assert.equal(effectMappings.size, 318)
  assert.equal(characterNames.size, 177)
  for (const [id, aliases] of Object.entries(characterNameAliases)) {
    assert.ok(characterNames.has(id), id + ' alias references an unknown character')
    assert.ok(Array.isArray(aliases) && aliases.length > 0, id + ' must expose at least one legacy name')
    assert.ok(!aliases.includes(characterNames.get(id)), id + ' alias repeats the completed Vietnamese name')
  }

  for (const character of charactersVi) {
    assert.equal(character.name, characterNames.get(character.id), character.id + ' has a stale Vietnamese name')
    const englishCharacter = englishById.get(character.id)
    assert.ok(englishCharacter, character.id + ' is missing from the English catalog')
    assert.equal(character.effects?.length || 0, englishCharacter.effects?.length || 0)

    for (let index = 0; index < (englishCharacter.effects?.length || 0); index += 1) {
      const source = String(englishCharacter.effects[index].term || '').replace(/^\[/, '').replace(/\]$/, '')
      const target = effectMappings.get(source) || (localizedEffectNames.has(source) ? source : '')
      assert.ok(target, character.id + ' is missing a localization for ' + source)
      assert.equal(character.effects[index].term, '[' + target + ']')
    }
  }

  const serializedVietnameseCatalog = JSON.stringify(charactersVi)
  for (const [source, target] of effectMappings) {
    if (source !== target && !localizedEffectNames.has(source)) {
      assert.ok(!serializedVietnameseCatalog.includes('[' + source + ']'), 'stale effect remains: ' + source)
    }
  }
})
test('stale seeded names localize while Admin custom names stay intact', () => {
  const localCharacter = charactersVi.find(character => character.id === '100313-urplus')
  const englishCharacter = charactersEn.find(character => character.id === localCharacter.id)
  assert.ok(localCharacter)
  assert.ok(englishCharacter)

  const staleSummary = mapCharacterSummary({
    id: localCharacter.id,
    name: 'Atomic Samurai',
  }, localCharacter, 'vi')
  const staleDetail = mergeCharacterDetail({
    id: localCharacter.id,
    name: 'Atomic Samurai',
  }, localCharacter, 'vi')
  const adminSummary = mapCharacterSummary({
    id: localCharacter.id,
    name: 'Samurai do Admin chỉnh sửa',
  }, localCharacter, 'vi')
  const englishSummary = mapCharacterSummary({
    id: localCharacter.id,
    name: englishCharacter.name,
  }, englishCharacter, 'en')

  assert.equal(staleSummary.name, 'Samurai Nguyên Tử')
  assert.equal(staleDetail.name, 'Samurai Nguyên Tử')
  assert.equal(adminSummary.name, 'Samurai do Admin chỉnh sửa')
  assert.equal(englishSummary.name, 'Atomic Samurai')
})
test('character pages restore local entries missing from a stale production API', () => {
  const staleApiItems = charactersVi
    .filter(character => character.id !== 'blacksperm-urplus')
    .slice(0, 12)
    .map(character => character.id === '100013-urplus'
      ? { ...character, name: 'Zombieman do Admin chỉnh sửa' }
      : character)
  const query = { page: 1, pageSize: 12, sort: 'release_desc' }
  const reconciled = reconcileCharacterPage({
    items: staleApiItems,
    page: 1,
    pageSize: 12,
    totalCount: charactersVi.length - 1,
    totalPages: 15,
    source: 'api',
  }, charactersVi, query)

  assert.equal(reconciled.source, 'hybrid')
  assert.equal(reconciled.totalCount, charactersVi.length)
  assert.equal(reconciled.items[0].id, 'blacksperm-urplus')
  assert.equal(reconciled.items.find(character => character.id === '100013-urplus').name, 'Zombieman do Admin chỉnh sửa')

  const searched = reconcileCharacterPage({
    items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1, source: 'api',
  }, charactersVi, { ...query, search: 'Tinh Trùng Đen' })
  assert.deepEqual(searched.items.map(character => character.id), ['blacksperm-urplus'])
})

test('character search matches Vietnamese, English, legacy, and accentless names in either locale', () => {
  const emptyApiPage = {
    items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1, source: 'api',
  }
  const query = { page: 1, pageSize: 12, sort: 'release_desc' }

  const vietnameseFromEnglish = reconcileCharacterPage(
    emptyApiPage,
    charactersVi,
    { ...query, search: 'Atomic Samurai' },
    charactersEn,
  )
  const localizedAtomicSamurai = vietnameseFromEnglish.items.find(
    character => character.id === '100313-urplus',
  )
  assert.ok(localizedAtomicSamurai)
  assert.equal(localizedAtomicSamurai.name, 'Samurai Nguyên Tử')

  const englishFromVietnamese = reconcileCharacterPage(
    emptyApiPage,
    charactersEn,
    { ...query, search: 'Samurai Nguyên Tử' },
    charactersVi,
  )
  const englishAtomicSamurai = englishFromVietnamese.items.find(
    character => character.id === '100313-urplus',
  )
  assert.ok(englishAtomicSamurai)
  assert.equal(englishAtomicSamurai.name, 'Atomic Samurai')

  const accentlessVietnamese = reconcileCharacterPage(
    emptyApiPage,
    charactersVi,
    { ...query, search: 'tinh trung den' },
    charactersEn,
  )
  assert.ok(accentlessVietnamese.items.some(character => character.id === 'blacksperm-urplus'))
})

test('Vietnamese ultimate labels and explicit energy costs stay accurate', () => {
  const skillNames = charactersVi.flatMap(character => character.skills.map(skill => skill.name))
  assert.equal(skillNames.filter(name => name === 'Tuyệt kĩ').length, charactersVi.length)
  assert.equal(skillNames.filter(name => name === 'Siêu tuyệt kĩ').length, charactersVi.length)
  assert.equal(skillNames.includes('Tối thượng'), false)
  assert.equal(skillNames.includes('Siêu tối thượng'), false)

  const target = charactersVi.find(character => character.id === '100075-ssrplus')
  const ultimate = target.skills.find(skill => skill.name === 'Tuyệt kĩ')
  const superUltimate = target.skills.find(skill => skill.name === 'Siêu tuyệt kĩ')

  assert.equal(getSkillEnergyCost(ultimate, target.skills), 2)
  assert.equal(getSkillEnergyCost(superUltimate, target.skills), 2)

  const freeUltimateCharacter = charactersVi.find(character => character.id === '100312-urplus')
  assert.equal(getSkillEnergyCost(freeUltimateCharacter.skills[1], freeUltimateCharacter.skills), 0)
  assert.equal(getSkillEnergyCost(freeUltimateCharacter.skills[2], freeUltimateCharacter.skills), 0)

  assert.equal(getSkillEnergyCost({ name: 'Tuyệt kĩ', type: 'Tuyệt kĩ', cost: 0 }), 0)
  assert.equal(getSkillEnergyCost({ name: 'Tuyệt kĩ', type: 'Tuyệt kĩ', cost: null }), 0)
  assert.equal(getSkillEnergyCost({ name: 'Ultimate', type: 'Ultimate' }), 0)
})
test('character, skill, and Keepsake catalogs only reference existing assets', () => {
  const blackSpermImageUrl = '/Characters/Black%20Sperm%20(UR%2B)/Black_Sperm.png?v=20260801-1'
  assert.equal(
    safeAssetUrl('/Characters/Black Sperm (UR+)/Black_Sperm.png'),
    blackSpermImageUrl,
  )
  assert.equal(safeAssetUrl('/Characters/Black%20Sperm%20(UR+)/Black_Sperm.png'), blackSpermImageUrl)
  assert.equal(safeAssetUrl(blackSpermImageUrl), blackSpermImageUrl)
  assert.equal(
    safeAssetUrl('/Characters/Zombieman (SSR+)/SSR+.png'),
    '/Characters/Zombieman%20(SSR%2B)/SSR%2B.png?v=20260801-1',
  )
  assert.equal(
    safeAssetUrl('/Characters/Card+A.png?signature=a+b'),
    '/Characters/Card%2BA.png?signature=a+b&v=20260801-1',
  )
  assert.equal(
    decodeAssetUrlForLocalServer('/Characters/Zombieman%20(SSR%2B)/SSR%2B.png?v=1'),
    '/Characters/Zombieman%20(SSR+)/SSR+.png?v=1',
  )
  assert.equal(
    safeAssetUrl('/Characters/icon#1.png?size=large'),
    '/Characters/icon%231.png?size=large&v=20260801-1',
  )
  assert.equal(
    safeAssetUrl('https://cdn.example.com/Characters/Black%20Sperm.png'),
    'https://cdn.example.com/Characters/Black%20Sperm.png',
  )

  for (const character of charactersVi) {
    const characterImage = path.join(
      root,
      'public',
      decodeURIComponent(character.imageURL.replace(/^\//, '')),
    )
    assert.ok(fs.existsSync(characterImage), `${character.id} references missing character image`)

    if (character.keepsakeIcon) {
      const keepsakeImage = path.join(root, 'public', character.keepsakeIcon.replace(/^\//, ''))
      assert.ok(fs.existsSync(keepsakeImage), `${character.id} references missing Keepsake image`)
    }

    for (const [index, skill] of character.skills.entries()) {
      const skillImage = path.join(root, 'public', decodeURIComponent(skill.icon.replace(/^\//, '')))
      assert.ok(fs.existsSync(skillImage), `${character.id}/${index} references missing skill image`)
    }
  }
})

test('English character catalog only references existing assets', () => {
  for (const character of charactersEn) {
    const assets = [
      ['character', character.imageURL],
      ['Keepsake', character.keepsakeIcon],
    ]
    for (const [kind, assetUrl] of assets) {
      if (!assetUrl) continue
      const assetPath = path.join(root, 'public', decodeURIComponent(assetUrl.replace(/^\//, '')))
      assert.ok(fs.existsSync(assetPath), `en/${character.id} references missing ${kind} image`)
    }

    for (const [index, skill] of character.skills.entries()) {
      const skillPath = path.join(root, 'public', decodeURIComponent(skill.icon.replace(/^\//, '')))
      assert.ok(fs.existsSync(skillPath), `en/${character.id}/${index} references missing skill image`)
    }
  }
})
test('local skill catalog keeps awakening levels when the API seed is stale', () => {
  const localCharacter = charactersVi.find(character => character.id === '100013-urplus')
  assert.ok(localCharacter)

  const staleApiSkills = localCharacter.skills.slice(0, 8).map((skill, sortOrder) => ({
    sortOrder,
    name: skill.name,
    description: `Stale API description ${sortOrder}`,
    type: sortOrder >= 6 ? 'N\u1ed9i t\u1ea1i' : skill.type,
    iconUrl: null,
    animationUrl: null,
    keepsakeIconUrl: null,
  }))
  const staleApiEffects = localCharacter.effects.map((effect, sortOrder) => ({
    sortOrder,
    term: '[Stale API effect ' + sortOrder + ']',
    description: 'Stale API effect description ' + sortOrder,
  }))
  const merged = mergeCharacterDetail({
    id: localCharacter.id,
    name: localCharacter.name,
    imageUrl: '/Characters/missing-api-image.png',
    keepsakeIcon: '/Keepsake/missing-api-keepsake.png',
    skills: staleApiSkills,
    effects: staleApiEffects,
  }, localCharacter)
  const summary = mapCharacterSummary({
    id: localCharacter.id,
    imageUrl: '/Characters/missing-api-image.png',
    keepsakeIcon: '/Keepsake/missing-api-keepsake.png',
  }, localCharacter)

  assert.equal(merged.skills.length, localCharacter.skills.length)
  assert.deepEqual(
    merged.skills.slice(6).map(skill => skill.type),
    [
      'Th\u1ee9c t\u1ec9nh',
      'Th\u1ee9c t\u1ec9nh',
      'Th\u1ee9c t\u1ec9nh',
    ],
  )
  assert.equal(merged.imageURL, localCharacter.imageURL)
  assert.equal(merged.keepsakeIcon, localCharacter.keepsakeIcon)
  assert.equal(summary.imageURL, localCharacter.imageURL)
  assert.equal(summary.keepsakeIcon, localCharacter.keepsakeIcon)
  assert.equal(merged.skills[0].desc, localCharacter.skills[0].desc)
  assert.equal(merged.skills[8].name, localCharacter.skills[8].name)
  assert.deepEqual(merged.effects, localCharacter.effects)
})

test('awakening skills stay hidden for SSR, SR, R, and N characters', () => {
  const tiersWithoutAwakening = new Set(['SSR', 'SR', 'R', 'N'])

  for (const character of charactersVi) {
    if (!tiersWithoutAwakening.has(character.tier)) continue
    assert.equal(
      character.skills.some(skill => skill.type === 'Th\u1ee9c t\u1ec9nh'),
      false,
      `${character.id} unexpectedly exposes awakening skills`,
    )
  }
})

test('every Core Skill uses a stable character ID in both locales', () => {
  assert.equal(coreLab.heroes.length, 15)
  const viIds = new Set(charactersVi.map(character => character.id))
  const enIds = new Set(charactersEn.map(character => character.id))

  for (const hero of coreLab.heroes) {
    assert.ok(hero.characterId, `${hero.coreHeId} is missing characterId`)
    assert.ok(viIds.has(hero.characterId), `${hero.characterId} is missing from Vietnamese characters`)
    assert.ok(enIds.has(hero.characterId), `${hero.characterId} is missing from English characters`)
  }
})

test('event images are either valid public assets or use the translated placeholder', () => {
  assert.ok(vi.events.imageUpdating)
  assert.ok(en.events.imageUpdating)

  for (const event of events) {
    if (!event.imageUrl) continue
    const assetPath = path.join(root, 'public', decodeURIComponent(event.imageUrl.replace(/^\//, '')))
    assert.ok(fs.existsSync(assetPath), `${event.id} references missing image ${event.imageUrl}`)
  }
})

test('Mirage Trial milestone illustrations are wired to existing public assets', () => {
  const medalsView = fs.readFileSync(path.join(root, 'src/views/MedalsView.vue'), 'utf8')
  for (const stage of ['5', '20', '40', '65', '90']) {
    const imageUrl = `/Feature/medals/Mirage_trial/ai_${stage}.png`
    assert.ok(
      fs.existsSync(path.join(root, 'public', imageUrl.replace(/^\//, ''))),
      `Mirage Trial stage ${stage} is missing ${imageUrl}`,
    )
    assert.ok(medalsView.includes(imageUrl), `Mirage Trial stage ${stage} is not wired to ${imageUrl}`)
  }
})

test('release schedule fallback is bilingual and covers both servers', () => {
  assert.equal(releaseSchedule.length, 16)
  assert.deepEqual(new Set(releaseSchedule.map((entry) => entry.server)), new Set(['CN', 'SEA']))
  const blackSpermRelease = releaseSchedule.find((entry) => (
    entry.server === 'CN' &&
    entry.date === '2026-08-01' &&
    entry.characterId === 'blacksperm-urplus'
  ))
  assert.ok(blackSpermRelease)
  assert.equal(blackSpermRelease.isReturn, false)
  assert.equal(
    blackSpermRelease.bannerImage,
    '/Characters/Full_Background/Black_Sperm_Ur_plus.png',
  )
  assert.ok(fs.existsSync(path.join(root, 'public', blackSpermRelease.bannerImage.replace(/^\//, ''))))
  const septemberRelease = releaseSchedule.find((entry) => (
    entry.server === 'SEA' &&
    entry.date === '2026-09-01' &&
    entry.characterId === '100315-urplus'
  ))
  assert.ok(septemberRelease)
  assert.equal(septemberRelease.isReturn, false)
  assert.ok(fs.existsSync(path.join(root, 'public', septemberRelease.bannerImage.replace(/^\//, ''))))
  const septemberMystery = releaseSchedule.find((entry) => (
    entry.server === 'CN' &&
    entry.date === '2026-09-01' &&
    entry.characterId === 'unknown'
  ))
  assert.ok(septemberMystery)
  assert.ok(septemberMystery.overrideNameVi)
  assert.ok(septemberMystery.overrideNameEn)
  assert.ok(fs.existsSync(path.join(root, 'public', septemberMystery.bannerImage.replace(/^\//, ''))))
  const septemberReturns = releaseSchedule
    .filter((entry) => entry.date === '2026-09-15')
    .sort((left, right) => left.server.localeCompare(right.server))
  assert.deepEqual(septemberReturns.map((entry) => entry.characterId), ['100013-urplus', '100313-urplus'])
  for (const entry of septemberReturns) {
    assert.equal(entry.isReturn, true)
    assert.ok(fs.existsSync(path.join(root, 'public', entry.bannerImage.replace(/^\//, ''))))
  }
})

test('Backgear catalog contains nine unique cards and one collection set', () => {
  assert.equal(backgear.gears.length, 9)
  assert.equal(backgear.sets.length, 1)
  assert.equal(new Set(backgear.gears.map(gear => gear.id)).size, backgear.gears.length)
  for (const gear of backgear.gears) {
    assert.ok(gear.nameVi && gear.nameEn)
    assert.ok(Array.isArray(gear.levels) && gear.levels.length > 0)
  }
})

test('Keepsake assets exist and reserved path characters are encoded safely', () => {
  const keepsakes = charactersVi.filter(character => character.keepsakeIcon)
  assert.equal(keepsakes.length, 177)

  for (const keepsake of keepsakes) {
    const assetPath = path.join(root, 'public', keepsake.keepsakeIcon.replace(/^\//, ''))
    assert.ok(fs.existsSync(assetPath), `${keepsake.id} references missing Keepsake ${keepsake.keepsakeIcon}`)
    assert.ok(!keepsake.keepsakeIcon.includes('+'), `${keepsake.id} uses a deploy-unsafe + in its Keepsake path`)
    const browserUrl = safeAssetUrl(keepsake.keepsakeIcon)
    assert.ok(!browserUrl.includes(' '), `${keepsake.id} contains an unescaped space in its browser URL`)
  }
})

test('local Keepsake catalog fills entries missing from a stale API', () => {
  const apiKeepsakes = charactersVi
    .filter(character => character.id !== 'blacksperm-urplus')
    .map(character => ({
      id: character.id,
      keepsakeIcon: character.keepsakeIcon,
    }))

  const merged = mergeKeepsakeCatalog(apiKeepsakes, charactersVi)
  const blackSperm = merged.find(character => character.id === 'blacksperm-urplus')

  assert.equal(merged.length, 177)
  assert.ok(blackSperm)
  assert.equal(
    blackSperm.keepsakeIcon,
    '/Keepsake/Black Sperm (URplus)/Keepsake_URplus.webp',
  )
})

test('Tactics catalog exposes complete star ranges for every rarity', () => {
  assert.equal(tactics.cards.length, 19)
  assert.equal(tactics.frames.length, 13)

  for (const card of tactics.cards) {
    assert.deepEqual(card.scaling.rarities.map(rarity => rarity.key), ['blue', 'purple', 'orange'])
    for (const rarity of card.scaling.rarities) {
      const expectedStars = Array.from({ length: rarity.quality * 2 - 2 }, (_, index) => index)
      assert.deepEqual(
        rarity.tiers.map(tier => tier.star),
        expectedStars,
        `${card.id}/${rarity.key} has an incomplete star range`,
      )
    }
  }
})

test('Tactic Frames expose valid accent colors for inline rendering', () => {
  for (const frame of tactics.frames) {
    assert.match(frame.colorClass, /#[0-9a-f]{6}/i, `${frame.id} has an invalid accent color`)
  }
})
