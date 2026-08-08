import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/characters_en.json'), 'utf8'))
const byId = new Map(catalog.map(character => [character.id, character]))

test('English skill import preserves the complete character catalog and valid Unicode', () => {
  assert.equal(catalog.length, 177)
  assert.equal(byId.size, catalog.length)

  for (const character of catalog) {
    for (const skill of character.skills) {
      assert.ok(skill.desc, `${character.id}/${skill.name} is missing its description`)
      assert.doesNotMatch(skill.desc, /[ÃÂâð]/, `${character.id}/${skill.name} contains broken UTF-8`)
    }
  }
})

test('unknown Markdown rows do not overwrite known skill descriptions', () => {
  const blackSperm = byId.get('blacksperm-urplus')
  assert.match(blackSperm.skills[0].desc, /120% ATK/)

  const garou = byId.get('100094-ur')
  assert.match(garou.skills[8].desc, /Energy Gauge/)
  assert.doesNotMatch(garou.skills[8].desc, /Hero Nemesis/)
})

test('split Core rows are merged into the matching Awakening card', () => {
  for (const id of ['100184-ur', '100045-ur']) {
    const coreDescription = byId.get(id).skills[6].desc
    assert.match(coreDescription, /^Basic Core:/)
    assert.match(coreDescription, /Advanced Core:/)
  }
})
