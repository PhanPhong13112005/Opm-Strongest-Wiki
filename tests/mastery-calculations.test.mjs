import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import {
  calculateArenaMatchup,
  calculateBackgearSpecializedRates,
  calculateSpecializedStat,
  clampArenaRate,
  getMasteryAdvancedBuff,
  getMasterySupportRules,
  isMasterySupportEligible,
} from '../src/utils/masteryCalculations.js'

const backgear = JSON.parse(fs.readFileSync('src/data/backgear.json', 'utf8'))

test('specialized stat follows the 30% base plus mastery formula', () => {
  assert.equal(calculateSpecializedStat(40_000_000, 6, 0), 36_000_001)
  assert.equal(calculateSpecializedStat(40_000_000, 10, 10), 56_000_001)
})

test('specialized Backgear rates stack from the selected level effects', () => {
  const specializedGears = backgear.gears.filter(gear =>
    gear.levels.some(level => level.effects.some(effect =>
      ['combatoa_up', 'combatda_up'].includes(effect.type)
    ))
  )
  const rates = calculateBackgearSpecializedRates(specializedGears, {
    BD_P1: 3,
    BD_R3: 5,
    BD_R4: 5,
  })

  assert.deepEqual(rates, { attack: 16, defense: 16 })
})

test('Arena matchup mirrors an even opponent and clamps extreme ratios', () => {
  assert.equal(clampArenaRate(100), 2.5)
  assert.equal(clampArenaRate(0.01), 0.25)

  const even = calculateArenaMatchup({
    ownAttack: 36_000_001,
    ownDefense: 36_000_001,
    enemyAttack: 36_000_001,
    enemyDefense: 36_000_001,
  })
  assert.equal(even.damageRate, 1)
  assert.equal(even.incomingRate, 1)
  assert.equal(even.damageDelta, 0)

  const extreme = calculateArenaMatchup({
    ownAttack: 1000,
    ownDefense: 1000,
    enemyAttack: 10_000,
    enemyDefense: 100,
  })
  assert.equal(extreme.damageRate, 2.5)
  assert.equal(extreme.incomingRate, 2.5)
})

test('Mastery view renders DEF from the normalized DEF field', () => {
  const source = fs.readFileSync('src/views/MasteryView.vue', 'utf8')
  assert.match(source, /formatNum\(currentStats\.def\)/)
  assert.match(source, /formatNum\(targetStats\.def\)/)
  assert.match(source, /pageTab === 'arena'/)
})



test('Mastery branches expose the verified support slot counts', () => {
  assert.deepEqual(getMasterySupportRules('phe'), [
    { relation: 'sameFaction', minimumTier: 'SR', progression: 'awakening', level: 5 },
  ])
  assert.deepEqual(getMasterySupportRules('he'), [
    { relation: 'sameType', minimumTier: 'SR', progression: 'insignia', level: 5 },
    { relation: 'any', minimumTier: 'SSR', progression: 'insignia', level: 5 },
  ])
  assert.deepEqual(getMasterySupportRules('cap'), [
    { relation: 'any', minimumTier: 'SSR', progression: 'keepsake', level: 5 },
    { relation: 'any', minimumTier: 'SSR', progression: 'keepsake', level: 5 },
  ])
})

test('support slots enforce branch relation and rarity while allowing the same support in both slots', () => {
  const mainCharacter = { id: 'main', tier: 'UR+', faction: 'hero', type: 'grappler' }
  const sameFactionSr = { id: 'faction-sr', tier: 'SR', faction: 'hero', type: 'duelist' }
  const sameTypeSr = { id: 'type-sr', tier: 'SR', faction: 'monster', type: 'grappler' }
  const anySsr = { id: 'any-ssr', tier: 'SSR', faction: 'monster', type: 'esper' }

  assert.equal(isMasterySupportEligible({
    character: sameFactionSr, mainCharacter, branch: 'phe', slotIndex: 0,
  }), true)
  assert.equal(isMasterySupportEligible({
    character: sameTypeSr, mainCharacter, branch: 'phe', slotIndex: 0,
  }), false)
  assert.equal(isMasterySupportEligible({
    character: sameTypeSr, mainCharacter, branch: 'he', slotIndex: 0,
  }), true)
  assert.equal(isMasterySupportEligible({
    character: sameFactionSr, mainCharacter, branch: 'he', slotIndex: 1,
  }), false)
  assert.equal(isMasterySupportEligible({
    character: anySsr, mainCharacter, branch: 'cap', slotIndex: 1,
  }), true)
  assert.equal(isMasterySupportEligible({
    character: mainCharacter, mainCharacter, branch: 'cap', slotIndex: 0,
  }), false)
  assert.equal(isMasterySupportEligible({
    character: anySsr, mainCharacter, branch: 'cap', slotIndex: 0, excludedIds: ['any-ssr'],
  }), true)
})

test('Mastery UI renders branch-specific support cards and readable localized copy', () => {
  const view = fs.readFileSync('src/views/MasteryView.vue', 'utf8')
  const vi = JSON.parse(fs.readFileSync('src/locales/vi.json', 'utf8'))
  const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'))
  const mastery = JSON.parse(fs.readFileSync('src/data/mastery.json', 'utf8'))
  const strings = []

  const collectStrings = value => {
    if (typeof value === 'string') strings.push(value)
    else if (Array.isArray(value)) value.forEach(collectStrings)
    else if (value && typeof value === 'object') Object.values(value).forEach(collectStrings)
  }

  collectStrings(vi.mastery)
  collectStrings(en.mastery)
  collectStrings(mastery)

  assert.ok(view.includes('v-for="(support, slotIndex) in supportCharDisplays"'))
  assert.ok(view.includes('@click="openModal(`support-${slotIndex}`)"'))
  assert.ok(view.includes('if (tab === subTab.value) return'))
  assert.ok(view.includes('supportChars.value = [null, null]'))
  assert.ok(view.includes('<transition name="modal-pop">'))
  assert.ok(view.includes('name="mastery-list"'))
  assert.ok(view.includes('@keyframes mastery-grid-drift'))
  assert.ok(view.includes('@keyframes mastery-tab-activate'))
  assert.equal(getMasterySupportRules('phe').length, 1)
  const brokenText = /\uFFFD|\u00C3[\u00A1-\u00BF]|\u00E1[\u00BA\u00BB]|\u00E2[\u2020\u20AC\u201D\u2122]/
  assert.ok(strings.every(value => !brokenText.test(value)))
})

test('Mastery progression matches the verified reference values at every tier', () => {
  const mastery = JSON.parse(fs.readFileSync('src/data/mastery.json', 'utf8'))
  const factionAndTypeAttack = [0, 0, 840, 1680, 3360, 5040, 6720, 9240, 11760, 14280, 17220]
  const factionAndTypeHp = [0, 0, 5040, 10080, 20160, 30240, 40320, 55440, 70560, 85680, 103320]
  const levelAttack = [0, 0, 600, 1200, 2000, 2800, 3600, 4800, 6000, 7200, 8600]
  const levelHp = [0, 0, 3600, 7200, 12000, 16800, 21600, 28800, 36000, 43200, 51600]

  for (const branch of ['phe', 'he']) {
    assert.deepEqual(mastery.categories[branch].map(tier => tier.stats.atk), factionAndTypeAttack)
    assert.deepEqual(mastery.categories[branch].map(tier => tier.stats.def ?? tier.stats.atk), factionAndTypeAttack)
    assert.deepEqual(mastery.categories[branch].map(tier => tier.stats.hp), factionAndTypeHp)
  }
  assert.deepEqual(mastery.categories.cap.map(tier => tier.stats.atk), levelAttack)
  assert.deepEqual(mastery.categories.cap.map(tier => tier.stats.def ?? tier.stats.atk), levelAttack)
  assert.deepEqual(mastery.categories.cap.map(tier => tier.stats.hp), levelHp)
  assert.deepEqual(Array.from({ length: 11 }, (_, tier) => getMasteryAdvancedBuff(tier)), [0, 0, 6, 6, 9, 9, 12, 12, 15, 15, 15])
})
