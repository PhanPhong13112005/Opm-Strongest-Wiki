import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { safeAssetUrl } from '../src/utils/assetUrl.js'

const root = path.resolve(import.meta.dirname, '..')
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))

const charactersVi = readJson('src/data/characters.json')
const charactersEn = readJson('src/data/characters_en.json')
const coreLab = readJson('src/data/coreLab.json')
const events = readJson('src/data/events.json')
const backgear = readJson('src/data/backgear.json')
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

test('localized character catalogs share stable IDs', () => {
  assert.equal(charactersVi.length, 176)
  assert.equal(charactersEn.length, charactersVi.length)
  assert.equal(new Set(charactersVi.map(character => character.id)).size, charactersVi.length)
  assert.deepEqual(
    charactersVi.map(character => character.id).sort(),
    charactersEn.map(character => character.id).sort(),
  )
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
  assert.ok(keepsakes.length > 0)

  for (const keepsake of keepsakes) {
    const assetPath = path.join(root, 'public', keepsake.keepsakeIcon.replace(/^\//, ''))
    assert.ok(fs.existsSync(assetPath), `${keepsake.id} references missing Keepsake ${keepsake.keepsakeIcon}`)
    assert.ok(!keepsake.keepsakeIcon.includes('+'), `${keepsake.id} uses a deploy-unsafe + in its Keepsake path`)
    const browserUrl = safeAssetUrl(keepsake.keepsakeIcon)
    assert.ok(!browserUrl.includes(' '), `${keepsake.id} contains an unescaped space in its browser URL`)
  }
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
