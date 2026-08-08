import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))

test('home character summaries cover the release schedule and match both catalogs', () => {
  const schedule = readJson('src/data/releaseSchedule.json')
  const summaries = readJson('src/data/homeCharacterSummaries.json')
  const scheduleIds = new Set(schedule.map(row => row.characterId).filter(id => id !== 'unknown'))

  for (const [language, catalogFile] of [['vi', 'characters.json'], ['en', 'characters_en.json']]) {
    const catalog = readJson(`src/data/${catalogFile}`)
    const charactersById = new Map(catalog.map(character => [character.id, character]))

    for (const id of scheduleIds) {
      const character = charactersById.get(id)
      const summary = summaries[language]?.[id]
      assert.ok(summary, `${language} home summary is missing ${id}`)
      assert.ok(character, `${language} catalog is missing ${id}`)
      assert.deepEqual(summary, {
        id,
        name: character.name,
        tier: character.tier,
        type: character.type,
        faction: character.faction,
        roles: character.roles,
      })
    }
  }
})
test('home LCP uses the optimized Black Sperm image', () => {
  const optimizedImage = path.join(
    root,
    'public/Characters/Full_Background/Black_Sperm_Ur_plus.webp',
  )
  assert.ok(fs.existsSync(optimizedImage))
  assert.ok(fs.statSync(optimizedImage).size < 25_000)
})
test('home boot shell matches the default August featured release', () => {
  const schedule = readJson('src/data/releaseSchedule.json')
  const summaries = readJson('src/data/homeCharacterSummaries.json')
  const featured = schedule.find(row => row.server === 'CN' && row.date === '2026-08-01')
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

  assert.ok(featured)
  assert.match(indexHtml, new RegExp(summaries.vi[featured.characterId].name.toUpperCase()))
  assert.match(indexHtml, /Black_Sperm_Ur_plus\.webp/)
  assert.match(indexHtml, /08 \/ 2026/)
})