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
test('Homeless Emperor keeps character and schedule artwork in their canonical folders', () => {
  const characterImage = path.join(root, 'public/Characters/Homeless Emperor (URplus)/URplus.png')
  const scheduleImage = path.join(root, 'public/Characters/Full_Background/Homeless_Emperor_URplus.png')
  const optimizedScheduleImage = path.join(root, 'public/Characters/Full_Background/Homeless_Emperor_URplus.webp')
  assert.ok(fs.existsSync(characterImage))
  assert.ok(fs.existsSync(scheduleImage))
  assert.ok(fs.existsSync(optimizedScheduleImage))
  assert.ok(fs.statSync(optimizedScheduleImage).size < fs.statSync(scheduleImage).size)
})
test('home boot shell defaults to the September release schedule', () => {
  const schedule = readJson('src/data/releaseSchedule.json')
  const septemberRows = schedule.filter(row => row.date.startsWith('2026-09-'))
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

  assert.equal(septemberRows.length, 4)
  assert.match(indexHtml, /RADAR RA MẮT/)
  assert.match(indexHtml, /09 \/ 2026/)
  assert.match(indexHtml, /Vua Không Nhà UR\+ ra mắt máy chủ CN/)
  assert.match(indexHtml, /Full_Background\/Homeless_Emperor_URplus\.webp/)
  const homeView = fs.readFileSync(path.join(root, 'src/views/HomeView.vue'), 'utf8')
  assert.match(homeView, /new Date\(2026, 8\)/)
  assert.doesNotMatch(homeView, /id: 'unknown'/)
})
test('tier ranking has a route-specific boot shell while its async chunk loads', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

  assert.match(indexHtml, /id="tier-ranking-boot-template"/)
  assert.ok(indexHtml.includes("else if (/^\\/tier-ranking\\/?$/.test(location.pathname))"))
  assert.match(indexHtml, /BẢNG XẾP HẠNG CỘNG ĐỒNG/)
  assert.match(indexHtml, /tier-boot__stage\{[^}]*min-height:calc\(100vh - 72px\)/)
})
test('home never loads the full character catalogs after first paint', () => {
  const homeView = fs.readFileSync(path.join(root, 'src/views/HomeView.vue'), 'utf8')

  assert.doesNotMatch(homeView, /characters(?:_en)?\.json/)
  assert.doesNotMatch(homeView, /getAllCharacters/)
  assert.match(homeView, /loadMissingScheduleCharacters/)
  assert.match(homeView, /loadLocalCharacterDetail/)
})
test('document language follows the default Vietnamese locale', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  const appView = fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8')
  const mainEntry = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8')

  assert.match(indexHtml, /<html lang="vi">/)
  assert.match(appView, /document\.documentElement\.lang/)
  assert.doesNotMatch(appView, /class="flex-grow min-h-screen"/)
  assert.match(mainEntry, /router\.isReady\(\)\.then\(mount, mount\)/)
})
