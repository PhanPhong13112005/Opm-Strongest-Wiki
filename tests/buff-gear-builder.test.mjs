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
  setManualBuffGearCompatibility,
} from '../src/data/buffGear/builder.js'
import { buffGearWorkbenchLocale } from '../src/data/buffGear/workbenchLocale.js'

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

const flattenKeys = (value, prefix = '') => Object.entries(value).flatMap(([key, nested]) => {
  const path = prefix ? `${prefix}.${key}` : key
  return nested && typeof nested === 'object' ? flattenKeys(nested, path) : [path]
})

test('manual mode only exposes compatibility values sourced by the character catalog', async () => {
  const characters = await readJson('../src/data/characters_en.json')
  const sourceByField = Object.fromEntries(buffGearCompatibilityAxes.map(axis => [
    axis.characterField,
    new Set(characters.map(character => character[axis.characterField])),
  ]))

  for (const axis of buffGearCompatibilityAxes) {
    assert.deepEqual(
      new Set(axis.options.map(option => option.id)),
      sourceByField[axis.characterField],
      `${axis.id} must match the repository catalog exactly`,
    )
  }
  assert.equal(buffGearCompatibilityAxes.some(axis => axis.options.some(option => option.id === 'Special')), false)
})

test('manual mode allows an arbitrary source-backed Faction + Type + Level combination', () => {
  const state = createBuffGearBuilderState()

  assert.equal(getBuffGearMode(state), 'manual')
  assert.equal(isBuffGearCompatibilityLocked(state), false)
  assert.equal(setManualBuffGearCompatibility(state, 'faction', 'Monster'), true)
  assert.equal(setManualBuffGearCompatibility(state, 'type', 'Esper'), true)
  assert.equal(setManualBuffGearCompatibility(state, 'level', 'Dragon'), true)
  assert.deepEqual(
    Object.fromEntries(Object.entries(state.slots).map(([axis, slot]) => [axis, slot.compatibility])),
    { faction: 'Monster', type: 'Esper', level: 'Dragon' },
  )
  assert.throws(() => setManualBuffGearCompatibility(state, 'level', 'Special'), /Unsupported level compatibility/)
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
    { faction: 'Hero', type: 'Duelist', level: 'Class_SS' },
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
    id: '100013-urplus',
    faction: 'Hero',
    type: 'Duelist',
    classLevel: 'Class_SS',
  })
  state.slots.type.mechanic.activeMechanic = 'refine'

  clearCharacterFromBuffGearBuilder(state)

  assert.equal(getBuffGearMode(state), 'manual')
  assert.equal(isBuffGearCompatibilityLocked(state), false)
  assert.deepEqual(
    Object.fromEntries(Object.entries(state.slots).map(([axis, slot]) => [axis, slot.compatibility])),
    { faction: 'Hero', type: 'Duelist', level: 'Class_SS' },
  )
  assert.equal(state.slots.type.mechanic.activeMechanic, 'refine')
  assert.equal(setManualBuffGearCompatibility(state, 'type', 'Hi-Tech'), true)
})

test('Buff Gear workbench Vietnamese and English messages stay structurally aligned', () => {
  assert.deepEqual(flattenKeys(buffGearWorkbenchLocale.vi).sort(), flattenKeys(buffGearWorkbenchLocale.en).sort())
})
