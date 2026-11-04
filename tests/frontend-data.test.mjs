import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import test from 'node:test'
import { decodeAssetUrlForLocalServer, safeAssetUrl } from '../src/utils/assetUrl.js'
import {
  getCoreLabHeroPortrait,
  getCoreLabItemIcon,
  getCoreLabMilestoneIcon,
} from '../src/utils/coreLabAssetPaths.js'
import { getSkillEnergyCost } from '../src/utils/skillPresentation.js'
import { resolveCharacterClassPresentation } from '../src/utils/characterClassPresentation.js'
import { mapCharacterSummary, matchesCharacterSearch, mergeCharacterDetail, reconcileCharacterPage } from '../src/services/characterApi.js'
import { mergeKeepsakeCatalog } from '../src/services/keepsakeApi.js'
import characterNameAliases from '../src/data/characterNameAliases.js'

const root = path.resolve(import.meta.dirname, '..')
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const trackedPublicPaths = new Set(
  execFileSync('git', ['ls-files', '-z', '--', 'public'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .map(filePath => filePath.replaceAll('\\', '/')),
)
const childCandidatePublicPaths = new Set([
  'public/Characters/Child Emperor (URplus)/URplus.png',
  'public/Characters/Full_Background/Child_URplus.png',
  'public/Characters/optimized/100320-urplus-360.webp',
  'public/Characters/optimized/100320-urplus-600.webp',
  'public/Characters/card-icons/100320-urplus-class.webp',
  ...['basic', 'ultimate', 'passive', 'awaken1'].map(skill =>
    `public/Skill/Child Emperor (URplus)/he_100320_ur_plus__${skill}.png`),
])
const publicGitPath = (assetUrl) => {
  const pathWithoutQuery = String(assetUrl).split(/[?#]/, 1)[0]
  return `public/${decodeURIComponent(pathWithoutQuery.replace(/^\/+/, ''))}`
}
const assertPublicAssetExists = (assetUrl, message) => {
  const gitPath = publicGitPath(assetUrl)
  assert.ok(
    trackedPublicPaths.has(gitPath) || childCandidatePublicPaths.has(gitPath),
    `${message} (missing exact-case Git path: ${gitPath})`,
  )
  assert.ok(fs.existsSync(path.join(root, ...gitPath.split('/'))), message)
}

const charactersVi = readJson('src/data/characters.json')
const charactersEn = readJson('src/data/characters_en.json')

// Frozen IDs from verified commit beb2b46ecf8fe448f49a20e46dabc8c481994dad.
// Do not derive the expected set from the catalog being tested.
const originalCharacterIds = [
  "100001-sr", "100002-ssr", "100002-ur", "100003-ssr", "100003-ssrplus",
  "100003-ur", "100004-ssr", "100005-sr", "100006-ssr", "100006-ssrplus",
  "100007-sr", "100008-sr", "100008-ssr", "100008-ur", "100009-sr",
  "100009-ssr", "100009-ur", "100010-ssr", "100010-ssrplus", "100010-ur",
  "100011-ssr", "100011-ssrplus", "100012-ssr", "100012-ssrplus", "100013-ssr",
  "100013-ssrplus", "100013-ur", "100013-urplus", "100014-sr", "100015-sr",
  "100016-sr", "100017-ssr", "100017-ssrplus", "100017-ur", "100018-sr",
  "100019-sr", "100020-r", "100021-r", "100022-n", "100023-n",
  "100024-ssr", "100024-ssrplus", "100025-ssr", "100025-ssrplus", "100027-ssr",
  "100027-ssrplus", "100028-ssr", "100028-ssrplus", "100029-sr", "100029-ssr",
  "100029-urplus", "100030-sr", "100031-r", "100032-r", "100033-r",
  "100034-sr", "100035-r", "100036-r", "100038-r", "100039-r",
  "100041-r", "100042-n", "100043-ssr", "100044-ssr", "100044-ssrplus",
  "100044-ur", "100045-ssr", "100045-ssrplus", "100045-ur", "100046-sr",
  "100047-sr", "100049-sr", "100050-r", "100051-sr", "100053-r",
  "100054-ssr", "100054-ssrplus", "100055-ssr", "100055-ssrplus", "100056-ssr",
  "100056-ssrplus", "100057-ssr", "100057-ssrplus", "100057-ur", "100059-ssr",
  "100059-ssrplus", "100060-ssr", "100061-sr", "100062-ssr", "100062-ssrplus",
  "100063-sr", "100064-r", "100065-r", "100067-n", "100068-r",
  "100069-ssr", "100069-ur", "100074-ssr", "100075-ssr", "100075-ssrplus",
  "100083-sr", "100084-sr", "100085-ssr", "100086-sr", "100089-ssr",
  "100089-ssrplus", "100089-ur", "100090-ssr", "100091-sr", "100092-sr",
  "100092-ssrplus", "100093-r", "100094-ssr", "100094-ssrplus", "100094-ur",
  "100095-sr", "100095-ssr", "100096-sr", "100097-sr", "100103-ssr",
  "100103-ssrplus", "100104-sr", "100106-r", "100108-ssr", "100109-ssr",
  "100109-ssrplus", "100109-ur", "100110-sr", "100111-sr", "100119-ssr",
  "100120-sr", "100125-ssr", "100126-ssr", "100135-sr", "100136-sr",
  "100148-sr", "100149-ssr", "100151-ssr", "100154-sr", "100156-ssrplus",
  "100157-ur", "100180-ur", "100180-urplus", "100182-ur", "100183-ur",
  "100184-ur", "100184-urplus", "100185-ur", "100186-ur", "100187-ur",
  "100188-ur", "100189-ur", "100190-ur", "100191-ur", "100192-ur",
  "100302-ur", "100308-urplus", "100312-urplus", "100313-urplus", "100314-urplus",
  "100315-urplus", "100316-urplus", "100320-urplus", "200001-n", "200007-n",
  "200008-n", "200009-n", "200010-n", "200011-n", "200013-n",
  "200017-n", "200018-n", "200026-n", "200027-n", "200030-n",
  "200031-n", "200033-n", "blacksperm-urplus", "homeless-emperor-urplus",
]
const approvedNewCharacterId = '100321-urplus'
const expectedCharacterIds = [...originalCharacterIds, approvedNewCharacterId].sort()
const assertCharacterCatalogIds = records => {
  const ids = records.map(record => record.id)
  assert.equal(originalCharacterIds.length, 179)
  assert.equal(new Set(originalCharacterIds).size, 179)
  assert.equal(new Set(ids).size, ids.length, 'duplicate character ID')
  assert.deepEqual([...ids].sort(), expectedCharacterIds, 'original IDs plus exactly the approved new ID')
  assert.equal(ids.filter(id => id === approvedNewCharacterId).length, 1)
}

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

test('effective Core Lab runtime asset paths resolve to existing public files', () => {
  const effectivePaths = new Set()

  for (const hero of coreLab.heroes) {
    effectivePaths.add(getCoreLabHeroPortrait(hero))
    for (const part of hero.parts || []) {
      effectivePaths.add(getCoreLabItemIcon(part.code, hero, coreLab.items))
    }
    for (const level of hero.levels || []) {
      for (const [itemId] of [...(level.cost || []), ...(level.comp || [])]) {
        effectivePaths.add(getCoreLabItemIcon(itemId, hero, coreLab.items))
      }
      if (level.milestoneIcon) {
        effectivePaths.add(getCoreLabMilestoneIcon(level.milestoneIcon, hero))
      }
    }
  }

  effectivePaths.delete('')
  for (const assetUrl of effectivePaths) {
    assertPublicAssetExists(assetUrl, `effective Core Lab path is missing: ${assetUrl}`)
  }

  const childEmperorV2 = coreLab.heroes.find(hero => hero.iconSuffix === '196')
  const milestonePaths = childEmperorV2.levels
    .filter(level => level.milestoneIcon)
    .map(level => getCoreLabMilestoneIcon(level.milestoneIcon, childEmperorV2))
  assert.deepEqual(milestonePaths, [
    '/Core_Skill/Child_Emperor/045_c1.png',
    '/Core_Skill/Child_Emperor/045_c2.png',
    '/Core_Skill/Child_Emperor/045_c3.png',
  ])
})

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
  assertCharacterCatalogIds(charactersVi)
  assertCharacterCatalogIds(charactersEn)
  assert.equal(charactersEn.length, charactersVi.length)
  assert.equal(new Set(charactersVi.map(character => character.id)).size, charactersVi.length)
  assert.deepEqual(
    charactersVi.map(character => character.id).sort(),
    charactersEn.map(character => character.id).sort(),
  )
})

// Read only numeric table rows from the matching level-two Markdown section.
// Later effect tables must never be interpreted as historical character records.
const parseLocalizationGuide = guide => {
  const lines = guide.split(/\r?\n/)
  const section = prefix => {
    const start = lines.findIndex(line => line.startsWith(prefix))
    if (start < 0) return []
    const next = lines.findIndex((line, index) => index > start && /^## /.test(line))
    return lines.slice(start + 1, next < 0 ? lines.length : next)
  }
  const parseRows = rows => rows.filter(line => /^\|\s*\d+\s*\|/.test(line)).map(line => {
    const cells = line.split('|').slice(1)
    if (cells.at(-1)?.trim() === '') cells.pop()
    return cells.map(cell => cell.trim().replaceAll(String.fromCharCode(96), ''))
  })
  assert.ok(lines.some(line => line.startsWith('## 1.')), 'effect section missing')
  assert.ok(lines.some(line => line.startsWith('## 2.')), 'character section missing')
  return {
    effectRows: parseRows(section('## 1.')),
    characterRows: parseRows(section('## 2.')),
    editorialEffects: parseRows(section('## Bổ sung biên tập do owner duyệt')),
  }
}

test('editorial effect rows never become characters and preserve all historical localization mappings', () => {
  const file = 'docs/VIET_HOA_HIEU_UNG_VA_TEN_NHAN_VAT_HOAN_CHINH.md'
  const guide = fs.readFileSync(path.join(root, file), 'utf8')
  const parsed = parseLocalizationGuide(guide)
  const historical = parseLocalizationGuide(execFileSync('git', ['show', 'fec0437890a88d3a37857d7a310af41b8b6ba1cd:' + file], {cwd:root, encoding:'utf8'}))
  assert.equal(parsed.effectRows.length, 329)
  assert.equal(parsed.characterRows.length, 178)
  assert.deepEqual(parsed.effectRows, historical.effectRows)
  assert.deepEqual(parsed.characterRows, historical.characterRows)
  assert.deepEqual(parsed.editorialEffects.map(cells => [cells[2], cells[3]]), [['Protection','Bảo Hộ'],['Base HP Increase','Tăng HP Cơ Bản'],['Dual Extreme Kill Formation','Song Cực Sát Trận']])
  assert.ok(parsed.editorialEffects.every(cells => /\[x\]/i.test(cells[1]) && /Owner, 03\/11\/2026/.test(cells[4])))
  assert.match(guide, /OWNER_APPROVED_EDITORIAL/)
  const withoutEditorial = parseLocalizationGuide(guide.slice(0, guide.indexOf('## Bổ sung biên tập do owner duyệt')))
  assert.deepEqual(parsed.characterRows, withoutEditorial.characterRows)
  assert.deepEqual(parsed.effectRows, withoutEditorial.effectRows)
  assert.deepEqual(withoutEditorial.editorialEffects, [])
})

test('Vietnamese character names and effects match the completed localization guide', () => {
  const guide = fs.readFileSync(
    path.join(root, 'docs/VIET_HOA_HIEU_UNG_VA_TEN_NHAN_VAT_HOAN_CHINH.md'),
    'utf8',
  )
  const { effectRows, characterRows, editorialEffects } = parseLocalizationGuide(guide)
  assert.equal(effectRows.length, 329)
  assert.equal(characterRows.length, 178)
  assert.ok(effectRows.every(cells => /\[x\]/i.test(cells[1]) && cells[2] && cells[3]))
  assert.ok(characterRows.every(cells => /\[x\]/i.test(cells[1]) && cells[2] && cells[6]))

  assert.equal(editorialEffects.length, 3)
  assert.ok(editorialEffects.every(cells => /\[x\]/i.test(cells[1]) && cells[2] && cells[3]))
  const effectMappings = new Map([...effectRows, ...editorialEffects].map(cells => [cells[2], cells[3]]))
  const localizedEffectNames = new Set(effectMappings.values())
  const characterNames = new Map(characterRows.map(cells => [cells[2], cells[6]]))
  const englishById = new Map(charactersEn.map(character => [character.id, character]))

  assert.equal(effectMappings.size, 332)
  assert.equal(effectMappings.get('Protection'), 'Bảo Hộ')
  assert.equal(effectMappings.get('Base HP Increase'), 'Tăng HP Cơ Bản')
  assert.equal(effectMappings.get('Dual Extreme Kill Formation'), 'Song Cực Sát Trận')
  assert.equal(characterNames.size, 178)
  // The unchanged guide covers the original catalog. Child has dedicated
  // translation/source tests; its unapproved effect name remains a source label.
  characterNames.set('100320-urplus', 'Đồng Đế')
  // Owner-approved temporary English name, scoped to this ID only.
  characterNames.set(approvedNewCharacterId, 'GaleWind & Hellfire Flame')
  assert.equal(englishById.get(approvedNewCharacterId)?.name, 'GaleWind & Hellfire Flame')
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
    if (character.id === '100320-urplus') {
      assert.deepEqual(character.effects.map(effect => effect.term), ['[Ready for Battle]'])
      assert.match(character.effects[0].desc, /hồi sinh/)
      continue
    }

    for (let index = 0; index < (englishCharacter.effects?.length || 0); index += 1) {
      const source = String(englishCharacter.effects[index].term || '').replace(/^\[/, '').replace(/\]$/, '')
      const target = effectMappings.get(source) || (localizedEffectNames.has(source) ? source : '')
      // The name is owner-approved editorial VI; its gameplay definition remains pending.
      // Keep both locale labels and every pending damage/source guard explicit.
      if (character.id === approvedNewCharacterId && source === 'Protection') {
        assert.equal(target, 'Bảo Hộ')
        assert.equal(character.effects.length, 1)
        assert.equal(character.effects[index].term, '[Bảo Hộ]')
        assert.equal(englishCharacter.effects[index].term, '[Protection]')
        assert.match(character.effects[index].desc, /^PENDING:/)
        assert.match(englishCharacter.effects[index].desc, /^PENDING:/)
        assert.equal(character.provenance.protectionDamageStatus,
          'PENDING_OWNER_CONFIRMED_DO_NOT_SELECT_EITHER_SOURCE')
        assert.equal(englishCharacter.provenance.protectionDamageStatus,
          character.provenance.protectionDamageStatus)
        assert.doesNotMatch(character.effects[index].desc + englishCharacter.effects[index].desc, /\d+%/)
        continue
      }
      assert.ok(target, character.id + ' is missing a localization for ' + source)
      assert.equal(character.effects[index].term, '[' + target + ']')
    }
  }

  const serializedVietnameseCatalog = JSON.stringify(charactersVi.filter(character => character.id !== '100320-urplus'))
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
test('Monster disaster levels use localized labels and an atomic class icon', () => {
  const g5Vi = charactersVi.find(character => character.id === '100314-urplus')
  const g5En = charactersEn.find(character => character.id === '100314-urplus')
  assert.ok(g5Vi)
  assert.ok(g5En)
  assert.equal(g5Vi.classLevel, 'Demon')
  assert.equal(g5Vi.classIcon, '/Class/Demon.png')

  const expected = [
    ['Tiger', 'Hổ', 'Tiger', '/Class/Tiger.png'],
    ['Demon', 'Quỷ', 'Demon', '/Class/Demon.png'],
    ['Dragon', 'Rồng', 'Dragon', '/Class/Dragon.png'],
    ['God', 'Thần', 'God', ''],
    ['Wolf', 'Sói', 'Wolf', ''],
  ]
  for (const [classLevel, viLabel, enLabel, icon] of expected) {
    const viPresentation = resolveCharacterClassPresentation({ classLevel, faction: 'Quái Nhân' }, 'vi')
    const enPresentation = resolveCharacterClassPresentation({ classLevel, faction: 'Monster' }, 'en')
    assert.equal(viPresentation.label, viLabel)
    assert.equal(enPresentation.label, enLabel)
    assert.equal(viPresentation.icon, icon)
    assert.equal(enPresentation.icon, icon)
  }

  const staleApi = {
    ...g5En,
    classLevel: 'Dragon',
    classIcon: undefined,
    cardClassIcon: undefined,
  }
  const staleSummary = mapCharacterSummary(staleApi, g5En, 'en')
  const staleDetail = mergeCharacterDetail(staleApi, g5En, 'en')
  for (const merged of [staleSummary, staleDetail]) {
    assert.equal(merged.classLevel, 'Dragon')
    assert.equal(merged.classIcon, '/Class/Dragon.png')
    assert.equal(merged.cardClassIcon, '/Class/Dragon.png')
    assert.notEqual(merged.classIcon, g5En.classIcon)
  }

  const correctedApi = { ...g5En, classLevel: 'Demon' }
  const correctedSummary = mapCharacterSummary(correctedApi, g5En, 'en')
  const correctedDetail = mergeCharacterDetail(correctedApi, g5En, 'en')
  for (const merged of [correctedSummary, correctedDetail]) {
    assert.equal(merged.classLevel, 'Demon')
    assert.equal(merged.classIcon, '/Class/Demon.png')
    assert.equal(merged.cardClassIcon, '/Class/Demon.png')
  }

  assert.equal(resolveCharacterClassPresentation(g5Vi, 'vi').label, 'Quỷ')
  assert.equal(resolveCharacterClassPresentation(g5En, 'en').label, 'Demon')

  const nonMonster = resolveCharacterClassPresentation({
    classLevel: 'Class_SS',
    faction: 'Hero',
    classIcon: '/Class/Class_SS.png',
  }, 'vi')
  assert.deepEqual(nonMonster, {
    classLevel: 'Class_SS',
    label: 'SS',
    icon: '/Class/Class_SS.png',
    classIcon: '/Class/Class_SS.png',
    cardClassIcon: undefined,
  })
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
  assert.equal(reconciled.items[0].id, '100321-urplus')
  assert.equal(reconciled.items[1].id, '100320-urplus')
  assert.ok(reconciled.items.some(character => character.id === 'homeless-emperor-urplus'))
  assert.ok(reconciled.items.some(character => character.id === 'blacksperm-urplus'))
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
  const localizedCharacters = charactersVi
  const skillNames = localizedCharacters.flatMap(character => character.skills.map(skill => skill.name))
  assert.equal(skillNames.filter(name => name === 'Tuyệt kĩ').length, localizedCharacters.length)
  const originalCharacters = localizedCharacters.filter(character => character.id !== approvedNewCharacterId)
  for (const character of originalCharacters) {
    assert.equal(character.skills.filter(skill => skill.name === 'Siêu tuyệt kĩ').length, 1, character.id)
  }
  assert.equal(skillNames.filter(name => name === 'Siêu tuyệt kĩ').length, originalCharacterIds.length + 1)
  const newCharacter = localizedCharacters.find(character => character.id === approvedNewCharacterId)
  assert.ok(newCharacter)
  assert.equal(newCharacter.skills.filter(skill => skill.name === 'Tuyệt kĩ').length, 1)
  assert.equal(getSkillEnergyCost(newCharacter.skills.find(skill => skill.type === 'Ultimate'), newCharacter.skills), 2)
  assert.equal(newCharacter.skills.filter(skill => skill.name === 'Siêu tuyệt kĩ').length, 1)
  assert.equal(getSkillEnergyCost(newCharacter.skills.find(skill => skill.name === 'Siêu tuyệt kĩ'), newCharacter.skills), 2)
  assert.equal(newCharacter.skills.length, 5)
  assert.equal(newCharacter.keepsakeIcon, undefined)
  assert.equal(newCharacter.provenance.keepsakeStatus, 'PENDING_NO_UPGRADE_MAPPING')
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
test('Homeless Emperor UR+ preserves supplied stats, assets, and upgrade semantics without invented metadata', () => {
  const vietnamese = charactersVi.find(character => character.id === 'homeless-emperor-urplus')
  const english = charactersEn.find(character => character.id === 'homeless-emperor-urplus')

  assert.ok(vietnamese)
  assert.ok(english)
  assert.equal(vietnamese.name, 'Vua Không Nhà')
  assert.equal(english.name, 'Homeless Emperor')
  assert.deepEqual(vietnamese.baseStats, { atk: 683, hp: 4095, def: 173, spd: 141 })
  assert.equal(vietnamese.type, 'Tâm Linh')
  assert.equal(vietnamese.faction, 'Quái Nhân')
  assert.equal(english.type, 'Esper')
  assert.equal(english.faction, 'Monster')
  assert.deepEqual(vietnamese.roles, ['Gia Tốc Cực Hạn - Sức Mạnh Hủy Diệt'])
  assert.equal(vietnamese.duyen, 'Hyper-Sense Burst')
  assert.deepEqual(english.roles, ['Extreme Acceleration - Power Of Destruction'])
  assert.equal(english.duyen, 'Hyper-Sense Burst')
  assert.equal(vietnamese.imageURL, '/Characters/Homeless Emperor (URplus)/URplus.png')
  assert.equal(english.imageURL, '/Characters/Homeless Emperor (URplus)/URplus.png')
  assert.equal(vietnamese.keepsakeIcon, '/Skill/Homeless Emperor (URplus)/Keepsake-URplus.png')
  assert.deepEqual(
    vietnamese.skills.map(skill => skill.name),
    [
      'Cơ bản',
      'Tuyệt kĩ',
      'Siêu tuyệt kĩ',
      'Bị động — Base',
      'Bị động — 5★ vàng',
      'Bị động — 5★ tím',
      'Nội tại Thức tỉnh — A1',
      'Nội tại Thức tỉnh — A2',
      'Nội tại Thức tỉnh — A3',
    ],
  )
  assert.deepEqual(
    english.skills.slice(6).map(skill => skill.name),
    ['Awaken Passive — A1', 'Awaken Passive — A2', 'Awaken Passive — A3'],
  )
  assert.ok(vietnamese.skills.slice(6).every(skill => !skill.name.includes('★')))
  assert.equal(english.skills[0].desc, 'Deals 120% ATK DMG to a single target.')
  assert.match(english.skills[1].desc, /4500% ATK \[Specialized Direct DMG\]/)
  assert.match(english.skills[1].desc, /5-hit combo/)
  assert.match(english.skills[1].desc, /ignores 45% \[Specialized Evasion\]/)
  assert.match(english.skills[1].desc, /penetrates \[Unyielding\] and \[Specialized Unyielding\]/)
  assert.match(english.skills[1].desc, /allies outside the same row/)
  assert.match(english.skills[1].desc, /\[Specialized Acceleration\]\/\[Speed Domain\]/)
  assert.match(english.skills[1].desc, /94% of Homeless Emperor's speed/)
  assert.match(english.skills[1].desc, /all DMG received by the target is increased by 30%/)
  assert.ok(english.skills[1].desc.length > 650)
  assert.match(english.skills[2].desc, /Increase ATK of all allies by 30%/)
  assert.match(english.skills[2].desc, /6000% ATK \[Specialized Direct DMG\]/)
  assert.match(english.skills[2].desc, /ignores 60% \[Specialized Evasion\]/)
  assert.match(english.skills[2].desc, /98% of Homeless Emperor's speed/)
  assert.ok(english.skills[2].desc.length > 700)
  assert.deepEqual(english.skills.slice(3, 6).map(skill => skill.desc.match(/gains (\d+%)/)?.[1]), [
    '80%',
    '85%',
    '90%',
  ])
  assert.ok(english.skills.slice(3, 6).every(skill => skill.desc.includes('[Energy Erosion]')))
  assert.ok(english.skills.slice(3, 6).every(skill => skill.desc.includes('[Specialized Speed-Up]')))
  assert.ok(english.skills.slice(3, 6).every(skill => skill.desc.includes('[normal Speed-Up]')))
  assert.ok(english.skills.slice(3, 6).every(skill => skill.desc.includes('[Specialized Non-Crit Hit DMG Reduction]:')))
  assert.ok(english.skills.slice(3, 6).every(skill => skill.desc.includes('[Specialized Critical Hit]:')))
  assert.ok(english.skills.slice(3, 6).every(skill => skill.desc.length > 700))
  assert.match(english.skills[6].desc, /grants self 60% \[Extreme Speed-Up\]/)
  assert.match(english.skills[6].desc, /by 0\.5x/)
  assert.doesNotMatch(english.skills[6].desc, /Destructive Momentum: Defense|energy consumption is reduced by 1|68%|1\.5x/)
  assert.ok(english.skills[6].desc.length > 400)
  assert.match(english.skills[7].desc, /grants self 68% \[Extreme Speed-Up\]/)
  assert.match(english.skills[7].desc, /\[Destructive Momentum: Defense\]/)
  assert.match(english.skills[7].desc, /by 1\.5x/)
  assert.match(english.skills[7].desc, /energy consumption is reduced by 1/)
  assert.ok(english.skills[7].desc.length > 700)
  assert.equal(english.skills[8].desc, 'Restores 150 Energy Gauge when attacking.')
  const generatedEnglishDetail = readJson('public/character-details/en/homeless-emperor-urplus.json')
  assert.deepEqual(
    generatedEnglishDetail.skills.map(skill => skill.desc),
    english.skills.map(skill => skill.desc),
  )
  const detailViewSource = fs.readFileSync(path.join(root, 'src/views/DetailView.vue'), 'utf8')
  assert.match(detailViewSource, /whitespace-pre-line[^>]*v-html="formatSkillDesc\(getSkillDescriptionForDisplay\(skill\)\)"/)
  assert.match(detailViewSource, /safeUrl\(classPresentation\.icon\)/)
  assert.match(detailViewSource, /const hasPvpStats = computed/)
  assert.match(detailViewSource, /v-if="hasPvpStats"/)
  assert.doesNotMatch(detailViewSource, /pvpStats\?\.(?:atk|hp|def|spd) \|\|/)
  assert.deepEqual(english.effects.map(effect => effect.term), [
    '[Energy Erosion]',
    '[Specialized Non-Crit Hit DMG Reduction]',
    '[Specialized Critical Hit]',
    '[Destructive Momentum: Assault]',
    '[Destructive Momentum: Defense]',
  ])
  assert.equal(vietnamese.releaseTrung, '01/09/2026')
  assert.equal(vietnamese.releaseSea, '01/01/2027')
  assert.equal(english.releaseTrung, '01/09/2026')
  assert.equal(english.releaseSea, '01/01/2027')
  assert.equal(vietnamese.classLevel, 'Dragon')
  assert.equal(english.classLevel, 'Dragon')
  assert.equal(vietnamese.classIcon, '/Class/Dragon.png')
  assert.equal(english.classIcon, '/Class/Dragon.png')
  assert.ok(fs.existsSync(path.join(root, 'public', vietnamese.classIcon.replace(/^\//, ''))))
  assert.equal(matchesCharacterSearch(vietnamese, 'homeless emperor', english), true)
  const routerSource = fs.readFileSync(path.join(root, 'src/router/index.js'), 'utf8')
  assert.match(routerSource, /path: '\/character\/:id'/)
  for (const field of ['pvpStats']) {
    assert.equal(Object.hasOwn(vietnamese, field), false, field + ' must stay absent until sourced')
    assert.equal(Object.hasOwn(english, field), false, 'en/' + field + ' must stay absent until sourced')
  }
})

test('100321 candidate image bytes and mappings match the reviewed manifest (not Git provenance)', async () => {
  const { default: sharp } = await import('sharp')
  const reviewedAssets = [
  {
    "path": "public/Characters/optimized/100321-urplus-360.webp",
    "sha256": "6CE50C4D8AA8EE49F3A3BE4B7A271B3A733786B1E7DE149DA990FDF9AF2F9055",
    "bytes": 140824,
    "width": 360,
    "height": 434,
    "alpha": false
  },
  {
    "path": "public/Characters/optimized/100321-urplus-600.webp",
    "sha256": "B4D624FD28EE5B757D06AF2B64D0CC9887B76C5A73A6E6C27C9EC935F27FDDC1",
    "bytes": 341992,
    "width": 600,
    "height": 723,
    "alpha": false
  },
  {
    "path": "public/Skill/Gale Wind & Hellfire Flame (URplus)/basic.png",
    "sha256": "B127FD7A612B6E11D0E00611F07AD00FE77A91440926A970EC25ACE7900152D0",
    "bytes": 250010,
    "width": 360,
    "height": 360,
    "alpha": true,
    "format": "png"
  },
  {
    "path": "public/Skill/Gale Wind & Hellfire Flame (URplus)/ultimate.png",
    "sha256": "133E234F35D59BA8A61E794B8D451E22D21D31CF8DED4105E1F283D868F1DCEC",
    "bytes": 288679,
    "width": 360,
    "height": 360,
    "alpha": true,
    "format": "png"
  },
  {
    "path": "public/Skill/Gale Wind & Hellfire Flame (URplus)/passive.png",
    "sha256": "433A1EEBE7DAF05C03CDC237184DA0BEC0ECFBFE492096805C5533A1EFDECD57",
    "bytes": 312583,
    "width": 360,
    "height": 360,
    "alpha": true,
    "format": "png"
  },
  {
    "path": "public/Skill/Gale Wind & Hellfire Flame (URplus)/awaken1.png",
    "sha256": "A204A92240AE90DFBDF1118D317018797C77B6FAD2DD8E62E632CC3DAEBDB9C4",
    "bytes": 281407,
    "width": 360,
    "height": 360,
    "alpha": true,
    "format": "png"
  },
  {
    "path": "public/Characters/optimized/100321-urplus-artwork-600.webp",
    "sha256": "699F27E0DF16E1D88646B919982AF109E41E8C4865670833B02D64F7657BB143",
    "bytes": 181842,
    "width": 600,
    "height": 304,
    "alpha": true
  },
  {
    "path": "public/Characters/optimized/100321-urplus-artwork-1200.webp",
    "sha256": "FD98237A15E3213DBDB96D8EC98C1280BC2F39E2ECAE269CC1D2DCC37E068CC0",
    "bytes": 615704,
    "width": 1200,
    "height": 607,
    "alpha": true
  }
]
  for (const asset of reviewedAssets) {
    let exactPath = root
    for (const part of asset.path.split('/')) {
      assert.ok(fs.readdirSync(exactPath).includes(part), asset.path + ' exact case')
      exactPath = path.join(exactPath, part)
    }
    const bytes = fs.readFileSync(exactPath)
    assert.equal(bytes.length, asset.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex').toUpperCase(), asset.sha256, asset.path)
    const expectedFormat = asset.format || 'webp'
    assert.ok(['png', 'webp'].includes(expectedFormat))
    if (expectedFormat === 'png') {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    } else {
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
    }
    const metadata = await sharp(bytes).metadata()
    assert.equal(metadata.format, expectedFormat)
    assert.equal(metadata.width, asset.width)
    assert.equal(metadata.height, asset.height)
    assert.equal(metadata.hasAlpha, asset.alpha)
  }
  const expectedIcons = reviewedAssets.slice(2, 6).map(asset => asset.path.replace(/^public/, ''))
  for (const [locale, catalog] of [['vi', charactersVi], ['en', charactersEn]]) {
    const character = catalog.find(item => item.id === approvedNewCharacterId)
    assert.ok(character)
    assert.equal(character.imageURL, reviewedAssets[7].path.replace(/^public/, ''))
    assert.equal(character.avatarURL, reviewedAssets[1].path.replace(/^public/, ''))
    assert.deepEqual(character.skills.map(skill => skill.icon), [expectedIcons[0], expectedIcons[1], expectedIcons[1], expectedIcons[2], expectedIcons[3]])
    assert.deepEqual(character.skills.map(skill => skill.type), ['Basic', 'Ultimate', 'Ultimate', 'Passive', 'Awakening'])
    const summary = readJson('src/data/characterSummaries.json')[locale].find(item => item.id === approvedNewCharacterId)
    assert.equal(summary.imageURL, reviewedAssets[0].path.replace(/^public/, ''))
    assert.deepEqual(readJson(`public/character-details/${locale}/${approvedNewCharacterId}.json`), character)
    const awakening = character.skills.find(skill => skill.type === 'Awakening')
    assert.match(awakening.desc, /PENDING/)
    assert.doesNotMatch(awakening.desc + JSON.stringify(character.effects), /5000%|7000%|15000%|70000%/)
  }
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
    assertPublicAssetExists(character.imageURL, `${character.id} references missing character image`)

    if (character.keepsakeIcon) {
      assertPublicAssetExists(character.keepsakeIcon, `${character.id} references missing Keepsake image`)
    }

    for (const [index, skill] of character.skills.entries()) {
      assertPublicAssetExists(skill.icon, `${character.id}/${index} references missing skill image`)
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
      assertPublicAssetExists(assetUrl, `en/${character.id} references missing ${kind} image`)
    }

    for (const [index, skill] of character.skills.entries()) {
      assertPublicAssetExists(skill.icon, `en/${character.id}/${index} references missing skill image`)
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
  assert.equal(coreLab.heroes.length, 16)
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
    assertPublicAssetExists(event.imageUrl, `${event.id} references missing image ${event.imageUrl}`)
  }
})

test('Mirage Trial milestone illustrations are wired to existing public assets', () => {
  const medalsView = fs.readFileSync(path.join(root, 'src/views/MedalsView.vue'), 'utf8')
  for (const stage of ['5', '20', '40', '65', '90']) {
    const imageUrl = `/Feature/medals/Mirage_trial/ai_${stage}.png`
    assertPublicAssetExists(imageUrl, `Mirage Trial stage ${stage} is missing ${imageUrl}`)
    assert.ok(medalsView.includes(imageUrl), `Mirage Trial stage ${stage} is not wired to ${imageUrl}`)
  }
})

test('Ultimate Emblems keep the curated order and sourced Reviving Wind data', () => {
  const medalsView = fs.readFileSync(path.join(root, 'src/views/MedalsView.vue'), 'utf8')
  assertPublicAssetExists('/Feature/medals/inlay/3_lo.png', 'Reviving Wind inlay image is missing')
  const expectedOrder = [
    'undying_shield',
    'sharp_blade',
    'distorted_field',
    'eternal_heart',
    'reviving_wind',
    'piercing_sword',
    'wall_sanctuary',
  ]

  const orderSource = medalsView.slice(
    medalsView.indexOf('const emblemSkillOrder'),
    medalsView.indexOf('const emblemSkillsData'),
  )
  assert.deepEqual(
    [...orderSource.matchAll(/'([a-z_]+)'/g)].map(match => match[1]),
    expectedOrder,
  )

  const revivingWindSource = medalsView.slice(
    medalsView.indexOf("id: 'reviving_wind'"),
    medalsView.indexOf('].sort((left, right)'),
  )
  assert.match(revivingWindSource, /inlay: 3/)
  assert.doesNotMatch(revivingWindSource, /Đang cập nhật|TBD/)
  for (const value of [
    'All ATK +10%',
    'All Arena DMG Free +5%',
    'All HP +10%',
    'All Arena DMG +8%',
  ]) {
    assert.ok(revivingWindSource.includes(value), `Reviving Wind is missing ${value}`)
  }
  assert.equal(
    revivingWindSource.match(/All Arena DMG Free \+5%/g)?.length,
    2,
  )
})

test('Vercel Analytics is initialized exactly once outside the deferred Vue tree', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8')
  const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8')

  assert.doesNotMatch(app, /@vercel\/analytics/)
  assert.match(main, /import \{ inject \} from '@vercel\/analytics'/)
  assert.equal((main.match(/\binject\(\)/g) || []).length, 1)
})


test('release schedule fallback is bilingual and covers both servers', () => {
  assert.equal(releaseSchedule.length, 32)
  assert.equal(releaseSchedule.filter(row => row.datePrecision !== 'month').length, 32)
  assert.deepEqual(releaseSchedule.filter(row => row.characterId === '100321-urplus').map(row => [row.server,row.date,row.isReturn]), [
    ['CN','2026-11-01',false], ['SEA','2027-03-15',false],
    ['CN','2027-01-15',true], ['SEA','2027-05-15',true],
  ])
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
  assertPublicAssetExists(blackSpermRelease.bannerImage, 'Black Sperm release image is missing')
  const septemberRelease = releaseSchedule.find((entry) => (
    entry.server === 'SEA' &&
    entry.date === '2026-09-01' &&
    entry.characterId === '100315-urplus'
  ))
  assert.ok(septemberRelease)
  assert.equal(septemberRelease.isReturn, false)
  assertPublicAssetExists(septemberRelease.bannerImage, 'September release image is missing')
  const homelessEmperorRelease = releaseSchedule.find((entry) => (
    entry.server === 'CN' &&
    entry.date === '2026-09-01' &&
    entry.characterId === 'homeless-emperor-urplus'
  ))
  assert.ok(homelessEmperorRelease)
  assert.equal(homelessEmperorRelease.isReturn, false)
  assert.equal(homelessEmperorRelease.sortOrder, 1)
  assert.equal(homelessEmperorRelease.bannerImage, '/Characters/Full_Background/Homeless_Emperor_URplus.png')
  assert.equal(Object.keys(homelessEmperorRelease).some(key => key.startsWith('override')), false)
  assert.equal(releaseSchedule.some(entry => entry.characterId === 'unknown'), false)
  assertPublicAssetExists(homelessEmperorRelease.bannerImage, 'Homeless Emperor release image is missing')
  assert.deepEqual(
    releaseSchedule
      .filter(entry => entry.characterId === 'homeless-emperor-urplus')
      .map(entry => [entry.server, entry.date, entry.isReturn]),
    [
      ['CN', '2026-09-01', false],
      ['CN', '2026-11-15', true],
      ['SEA', '2027-01-01', false],
      ['SEA', '2027-03-15', true],
    ],
  )
  assert.ok(
    releaseSchedule
      .filter(entry => entry.characterId === 'homeless-emperor-urplus')
      .every(entry => entry.bannerImage === '/Characters/Full_Background/Homeless_Emperor_URplus.png'),
  )
  const releaseApiSource = fs.readFileSync(path.join(root, 'src/services/releaseScheduleApi.js'), 'utf8')
  assert.match(releaseApiSource, /localRow\?\.characterId === row\.characterId && localRow\.bannerImage/)
  const septemberReturns = releaseSchedule
    .filter((entry) => entry.date === '2026-09-15')
    .sort((left, right) => left.server.localeCompare(right.server))
  assert.deepEqual(septemberReturns.map((entry) => entry.characterId), ['100013-urplus', '100313-urplus'])
  for (const entry of septemberReturns) {
    assert.equal(entry.isReturn, true)
    assertPublicAssetExists(entry.bannerImage, `${entry.characterId} return image is missing`)
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
  assert.equal(keepsakes.length, 178)

  for (const keepsake of keepsakes) {
    assertPublicAssetExists(
      keepsake.keepsakeIcon,
      `${keepsake.id} references missing Keepsake ${keepsake.keepsakeIcon}`,
    )
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

  assertCharacterCatalogIds(merged)
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
