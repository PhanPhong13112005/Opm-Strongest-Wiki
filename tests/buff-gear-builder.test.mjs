import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  applyCharacterToBuffGearBuilder,
  buffGearCompatibilityAxes,
  clearCharacterFromBuffGearBuilder,
  createBuffGearBuilderState,
  getBuffGearMode,
  isBuffGearCompatibilityLocked,
  mapCharacterCompatibility,
  setManualBuffGearCompatibility,
} from '../src/data/buffGear/builder.js'
import { buffGearWorkbenchLocale } from '../src/data/buffGear/workbenchLocale.js'

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

const flattenKeys = (value, prefix = '') => Object.entries(value).flatMap(([key, nested]) => {
  const path = prefix ? `${prefix}.${key}` : key
  return nested && typeof nested === 'object' ? flattenKeys(nested, path) : [path]
})

test('manual mode exposes the 2 Faction, 4 Type, and 8 Level Buff Gear card identities', () => {
  const factionOptions = buffGearCompatibilityAxes.find(a => a.id === 'faction').options.map(o => o.id)
  const typeOptions = buffGearCompatibilityAxes.find(a => a.id === 'type').options.map(o => o.id)
  const levelOptions = buffGearCompatibilityAxes.find(a => a.id === 'level').options.map(o => o.id)

  assert.deepEqual(factionOptions, ['Hero', 'Monster'])
  assert.deepEqual(typeOptions, ['Duelist', 'Grappler', 'Hi-Tech', 'Esper'])
  assert.deepEqual(levelOptions, ['Class_S', 'A', 'B', 'C', 'Dragon', 'Demon', 'Tiger', 'Special'])
})

test('character mapping maps Martial Artist -> Hero, Outlaw/Other -> Monster, Class SS -> Class S, and Martial Artist/Outlaw/Other -> Special', () => {
  assert.equal(mapCharacterCompatibility('faction', 'Hero'), 'Hero')
  assert.equal(mapCharacterCompatibility('faction', 'Martial Artist'), 'Hero')
  assert.equal(mapCharacterCompatibility('faction', 'Monster'), 'Monster')
  assert.equal(mapCharacterCompatibility('faction', 'Outlaw'), 'Monster')
  assert.equal(mapCharacterCompatibility('faction', 'Other'), 'Monster')

  assert.equal(mapCharacterCompatibility('level', 'Class_SS'), 'Class_S')
  assert.equal(mapCharacterCompatibility('level', 'Class_S'), 'Class_S')
  assert.equal(mapCharacterCompatibility('level', 'Dragon'), 'Dragon')
  assert.equal(mapCharacterCompatibility('level', 'Martial_Artist'), 'Special')
  assert.equal(mapCharacterCompatibility('level', 'Outlaw'), 'Special')
  assert.equal(mapCharacterCompatibility('level', 'Other'), 'Special')
  assert.equal(mapCharacterCompatibility('level', 'Special'), 'Special')
})

test('manual mode allows an arbitrary Faction + Type + Level combination', () => {
  const state = createBuffGearBuilderState()

  assert.equal(getBuffGearMode(state), 'manual')
  assert.equal(isBuffGearCompatibilityLocked(state), false)
  assert.equal(setManualBuffGearCompatibility(state, 'faction', 'Monster'), true)
  assert.equal(setManualBuffGearCompatibility(state, 'type', 'Esper'), true)
  assert.equal(setManualBuffGearCompatibility(state, 'level', 'Special'), true)
  assert.deepEqual(
    Object.fromEntries(Object.entries(state.slots).map(([axis, slot]) => [axis, slot.compatibility])),
    { faction: 'Monster', type: 'Esper', level: 'Special' },
  )
  assert.throws(() => setManualBuffGearCompatibility(state, 'level', 'UnknownLevel'), /Unsupported level compatibility/)
})

test('character mode auto-fills and locks all identities while mechanics stay mutable', () => {
  const state = createBuffGearBuilderState()
  applyCharacterToBuffGearBuilder(state, {
    id: 'blacksperm-urplus',
    faction: 'Monster',
    type: 'Grappler',
    classLevel: 'Dragon',
  })

  assert.equal(getBuffGearMode(state), 'character')
  assert.equal(isBuffGearCompatibilityLocked(state), true)
  assert.deepEqual(
    Object.fromEntries(Object.entries(state.slots).map(([axis, slot]) => [axis, slot.compatibility])),
    { faction: 'Monster', type: 'Grappler', level: 'Dragon' },
  )
  assert.equal(setManualBuffGearCompatibility(state, 'faction', 'Hero'), false)
  state.slots.faction.mechanic.activeMechanic = 'transformation'
  state.slots.faction.mechanic.transformationRows[0] = 'ATK'
  assert.equal(state.slots.faction.mechanic.transformationRows[0], 'ATK')
})

test('changing character resets all mechanic and card-specific state for every slot', () => {
  const state = createBuffGearBuilderState()
  applyCharacterToBuffGearBuilder(state, {
    id: 'blacksperm-urplus',
    faction: 'Monster',
    type: 'Grappler',
    classLevel: 'Dragon',
  })

  for (const slot of Object.values(state.slots)) {
    slot.mechanic.cardId = 'old-card'
    slot.mechanic.rarity = 'red'
    slot.mechanic.activeMechanic = 'purification'
    slot.mechanic.mainStatId = 'ATK'
    slot.mechanic.transformationRows[0] = 'ATK'
    slot.mechanic.transformationLocks[0] = true
    slot.mechanic.ascensionPreview = true
    slot.mechanic.purificationRows[0].statId = 'HP'
    slot.mechanic.purificationRows[0].locked = true
    slot.mechanic.transferHelpOpen = true
    slot.mechanic.refineStatId = 'CritRate'
    slot.mechanic.refineLevel = 6
    slot.mechanic.clarifyHelpOpen = true
  }

  applyCharacterToBuffGearBuilder(state, {
    id: '100013-urplus',
    faction: 'Hero',
    type: 'Duelist',
    classLevel: 'Class_SS',
  })

  assert.deepEqual(
    Object.fromEntries(Object.entries(state.slots).map(([axis, slot]) => [axis, slot.compatibility])),
    { faction: 'Hero', type: 'Duelist', level: 'Class_S' },
  )
  for (const slot of Object.values(state.slots)) {
    assert.equal(slot.mechanic.cardId, null)
    assert.equal(slot.mechanic.rarity, 'gold')
    assert.equal(slot.mechanic.activeMechanic, 'main')
    assert.equal(slot.mechanic.mainStatId, null)
    assert.deepEqual(slot.mechanic.transformationRows, [null, null, null, null, null])
    assert.deepEqual(slot.mechanic.transformationLocks, [false, false, false, false, false])
    assert.equal(slot.mechanic.ascensionPreview, false)
    assert.equal(slot.mechanic.purificationRows.every(row => row.statId === null && row.locked === false), true)
    assert.equal(slot.mechanic.transferHelpOpen, false)
    assert.equal(slot.mechanic.refineStatId, null)
    assert.equal(slot.mechanic.refineLevel, 0)
    assert.equal(slot.mechanic.clarifyHelpOpen, false)
  }
})

test('clearing a character preserves auto-filled identities and unlocks manual exploration', () => {
  const state = createBuffGearBuilderState()
  applyCharacterToBuffGearBuilder(state, {
    id: 'blacksperm-urplus',
    faction: 'Monster',
    type: 'Grappler',
    classLevel: 'Dragon',
  })

  clearCharacterFromBuffGearBuilder(state)

  assert.equal(getBuffGearMode(state), 'manual')
  assert.equal(isBuffGearCompatibilityLocked(state), false)
  assert.deepEqual(
    Object.fromEntries(Object.entries(state.slots).map(([axis, slot]) => [axis, slot.compatibility])),
    { faction: 'Monster', type: 'Grappler', level: 'Dragon' },
  )
  assert.equal(setManualBuffGearCompatibility(state, 'faction', 'Hero'), true)
  assert.equal(state.slots.faction.compatibility, 'Hero')
})

test('Buff Gear workbench Vietnamese and English messages stay structurally aligned', () => {
  const viKeys = new Set(flattenKeys(buffGearWorkbenchLocale.vi))
  const enKeys = new Set(flattenKeys(buffGearWorkbenchLocale.en))

  assert.deepEqual(viKeys, enKeys, 'Vietnamese and English message structures must stay aligned')
})
