import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const charactersVi = readJson('src/data/characters.json')
const charactersEn = readJson('src/data/characters_en.json')
const coreLab = readJson('src/data/coreLab.json')
const releaseSchedule = readJson('src/data/releaseSchedule.json')
const tierRankingCatalog = readJson('src/data/tierRankingCatalog.json')
const id = '100320-urplus'

const expectedAssets = new Map([
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__basic.png', 'D39D338C6107D276586CA2B2AD32F233141562F585FFD5F83234537BD5CB43C4'],
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__ultimate.png', '118F844C411D015F5920015985D3093931B2A6F011F1FED62D445EBCC7ECF816'],
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__passive.png', 'F47F489074EDC526BACACE3482F2651799E5C608F1A366153077031815594B1D'],
  ['/Skill/Child Emperor (URplus)/he_100320_ur_plus__awaken1.png', 'D6E12BFDA567C292C7E7ED093FD1B52AA63F9C01D99EE5EA58FC69317DE364E0'],
])

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
  assert.equal(vietnamese[0].classLevel, 'Mecha Overlord')
  assert.deepEqual(vietnamese[0].roles, ['Strike Core – Ready For Battle'])
  assert.equal(vietnamese[0].mechanicsLanguage, 'en')
  assert.equal(vietnamese[0].releaseTrung, '10 / 2026')
})

test('Child Emperor UR+ keeps the four supplied skills and byte-verified source assets', async () => {
  const character = charactersEn.find(item => item.id === id)
  assert.deepEqual(character.skills.map(skill => skill.icon), [...expectedAssets.keys()])
  assert.equal(character.skills[0].desc, 'Updating.')
  assert.match(character.skills[1].desc, /5000% \[7000%\] \[Specialized Direct DMG\]/)
  assert.match(character.skills[1].desc, /\[Re-Battle\].*3 \[4\]/s)
  assert.match(character.skills[2].desc, /80% \[85%\] \[90%\]/)
  assert.match(character.skills[2].desc, /\[Energy Reduction\].*\[Energy Lock\]/s)
  assert.match(character.skills[3].desc, /3 \[4\] energy points/)
  assert.match(character.skills[3].desc, /92% \[95%\] \[98%\] \[True DMG Reduction\]/)
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

test('Child Emperor UR+ has one month-precision CN schedule entry and no fabricated ranking', () => {
  const entries = releaseSchedule.filter(row => row.characterId === id)
  assert.deepEqual(entries, [{
    server: 'CN',
    date: '2026-10',
    datePrecision: 'month',
    characterId: id,
    bannerImage: '/Characters/Child Emperor (UR)/UR.png',
    isReturn: false,
    sortOrder: 1,
  }])
  assert.equal(tierRankingCatalog.some(character => character.id === id), false)
})
