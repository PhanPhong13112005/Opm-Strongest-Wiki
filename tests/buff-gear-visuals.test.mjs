import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buffGearMaterialVisuals,
  getBuffGearCompatibilityVisual,
} from '../src/data/buffGear/visuals.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('verified Faction and Type identities use the matching source artwork', () => {
  assert.equal(getBuffGearCompatibilityVisual('faction', 'Hero')?.id, 'equipcard_1_1')
  assert.equal(getBuffGearCompatibilityVisual('faction', 'Monster')?.id, 'equipcard_1_2')
  assert.equal(getBuffGearCompatibilityVisual('type', 'Duelist')?.id, 'equipcard_2_1')
  assert.equal(getBuffGearCompatibilityVisual('type', 'Grappler')?.id, 'equipcard_2_2')
  assert.equal(getBuffGearCompatibilityVisual('type', 'Hi-Tech')?.id, 'equipcard_2_3')
  assert.equal(getBuffGearCompatibilityVisual('type', 'Esper')?.id, 'equipcard_2_4')
})

test('verified Level identities include the Special Buff Gear artwork', () => {
  const expected = {
    Class_S: 'equipcard_3_1',
    A: 'equipcard_3_2',
    B: 'equipcard_3_3',
    C: 'equipcard_3_4',
    Dragon: 'equipcard_3_5',
    Demon: 'equipcard_3_6',
    Tiger: 'equipcard_3_7',
    Special: 'equipcard_3_8',
  }

  for (const [compatibility, assetId] of Object.entries(expected)) {
    assert.equal(getBuffGearCompatibilityVisual('level', compatibility)?.id, assetId)
  }
})

test('visual mappings only reference optimized assets that exist in the repository', () => {
  const mappedAssets = [
    ...['Hero', 'Monster'].map(value => getBuffGearCompatibilityVisual('faction', value)),
    ...['Duelist', 'Grappler', 'Hi-Tech', 'Esper'].map(value => getBuffGearCompatibilityVisual('type', value)),
    ...['Class_S', 'A', 'B', 'C', 'Dragon', 'Demon', 'Tiger', 'Special'].map(value => getBuffGearCompatibilityVisual('level', value)),
    ...buffGearMaterialVisuals.map(material => material.asset),
  ]

  for (const asset of mappedAssets) {
    const file = path.join(root, 'public', decodeURIComponent(asset.optimized).replace(/^\/Buff Gear\//, 'Buff Gear/'))
    assert.equal(fs.existsSync(file), true, `Missing ${asset.optimized}`)
    assert.equal(asset.optimized.endsWith('.webp'), true)
  }

  assert.deepEqual(buffGearMaterialVisuals.map(material => material.id), ['crystalS', 'crystalCore'])
})
