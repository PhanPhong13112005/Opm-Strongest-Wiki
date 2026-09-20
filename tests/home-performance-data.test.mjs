import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

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
  assert.match(indexHtml, /Full_Background\/optimized\/homeless-emperor-urplus-960\.webp\?v=20260801-1/)
  const homeView = fs.readFileSync(path.join(root, 'src/views/HomeView.vue'), 'utf8')
  assert.match(homeView, /new Date\(2026, 8\)/)
  assert.doesNotMatch(homeView, /id: 'unknown'/)
})

test('Home responsive generator produces only the approved 20 transparent WebP variants', async () => {
  const outputDir = path.join(root, 'public/Characters/Full_Background/optimized')
  const widths = [320, 640, 960, 1600, 2400]
  const variants = [
    { slug: 'homeless-emperor-urplus', source: 'Homeless_Emperor_URplus.png', heights: [196, 393, 589, 982, 1473] },
    { slug: 'zombieman-urplus', source: 'ZombIeMan_URplus.png', heights: [211, 422, 634, 1056, 1584] },
    { slug: 'bang-bomb-urplus', source: 'Bang&Bomb_Urplus.png', heights: [136, 273, 409, 682, 1023] },
    { slug: 'atomic-samurai-urplus', source: 'Atomic Samurai_URplus.png', heights: [136, 273, 409, 682, 1023] },
  ]
  const expectedFiles = variants.flatMap(variant => widths.map(width => `${variant.slug}-${width}.webp`)).sort()
  const actualFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.webp')).sort()

  assert.deepEqual(actualFiles, expectedFiles)
  for (const variant of variants) {
    const masterSize = fs.statSync(path.join(root, 'public/Characters/Full_Background', variant.source)).size
    for (const [index, width] of widths.entries()) {
      const outputFile = path.join(outputDir, `${variant.slug}-${width}.webp`)
      const metadata = await sharp(outputFile).metadata()
      assert.equal(metadata.format, 'webp')
      assert.equal(metadata.width, width)
      assert.equal(metadata.height, variant.heights[index])
      assert.equal(metadata.hasAlpha, true)
      assert.ok(fs.statSync(outputFile).size < masterSize)
      assert.ok(fs.statSync(outputFile).size < 500_000)
    }
  }

  const generator = fs.readFileSync(path.join(root, 'scripts/generate-home-responsive-assets.mjs'), 'utf8')
  assert.match(generator, /const widths = \[320, 640, 960, 1600, 2400\]/)
  assert.match(generator, /quality: 90/)
  assert.match(generator, /alphaQuality: 100/)
  assert.match(generator, /smartSubsample: true/)
  assert.doesNotMatch(generator, /\b(?:rm|unlink|rmdir)\b/)
})

test('Home boot shell and Vue use the same versioned responsive Homeless Emperor candidates', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  const homeView = fs.readFileSync(path.join(root, 'src/views/HomeView.vue'), 'utf8')
  const radar = fs.readFileSync(path.join(root, 'src/components/HomeRadar.vue'), 'utf8')

  for (const width of [320, 640, 960, 1600, 2400]) {
    assert.match(indexHtml, new RegExp(`homeless-emperor-urplus-${width}\\.webp\\?v=20260801-1`))
  }
  assert.match(homeView, /responsiveHomeWidths = \[320, 640, 960, 1600, 2400\]/)
  assert.match(homeView, /getCharacterImageSet/)
  assert.match(radar, /:srcset="feature\.image\.srcset \|\| undefined"/)
  assert.match(radar, /:fetchpriority="featureIndex === 0 \? 'high' : 'low'"/)
  assert.match(radar, /class="card-float-img"[^>]*loading="lazy" fetchpriority="low"/)
})

test('home hero renders CN and SEA spotlights across one responsive diagonal split', () => {
  const radar = fs.readFileSync(path.join(root, 'src/components/HomeRadar.vue'), 'utf8')

  assert.match(radar, /const featuredItems = computed\(\(\) => \['CN', 'SEA'\]/)
  assert.match(radar, /serverGroup\.items\.find\(candidate => candidate\.tag !== t\('home\.return'\)\) \|\| serverGroup\.items\[0\]/)
  assert.match(radar, /class="featured-grid"/)
  assert.match(radar, /v-for="\(feature, featureIndex\) in featuredItems"/)
  assert.match(radar, /:data-character="feature\.item\.id"/)
  assert.match(radar, /class="featured-meta"/)
  assert.match(radar, /feature\.character\.tier/)
  assert.match(radar, /feature\.character\.type/)
  assert.match(radar, /feature\.character\.faction/)
  assert.match(radar, /'--hero-accent': getTypeAccent\(feature\.item\)/)
  assert.match(radar, /class="featured-type"/)
  assert.match(radar, /featured-type\{[^}]*var\(--hero-accent\)/)
  assert.match(radar, /data-server="CN"\]\{--server-accent:var\(--hero-accent,#ffb300\);--server-label-accent:#ff4d64/)
  assert.match(radar, /data-server="SEA"\]\{--server-accent:var\(--hero-accent,#ffb300\);--server-label-accent:#4ed8ff/)
  assert.doesNotMatch(radar, /featured-divider-mark/)
  assert.match(radar, /\.featured-grid\{[^}]*display:block;height:560px/)
  assert.match(radar, /\.featured-grid::after\{[^}]*clip-path:polygon\(99\.68% 0,100% 0,\.32% 100%,0 100%\)/)
  assert.match(radar, /\.featured-card\{position:absolute;inset:0[^}]*min-height:560px/)
  assert.match(radar, /data-server="CN"\][^{]*\{[^}]*clip-path:polygon\(0 0,100% 0,0 100%\)/)
  assert.match(radar, /data-server="SEA"\][^{]*\{[^}]*clip-path:polygon\(100% 0,100% 100%,0 100%\)/)
  assert.match(radar, /data-server="CN"\] \.featured-card__copy\{inset:28px auto 43% 28px;align-items:flex-start;text-align:left/)
  assert.match(radar, /data-server="SEA"\] \.featured-card__copy\{inset:49% 28px 28px auto;align-items:flex-end;text-align:right/)
  assert.match(radar, /data-server="CN"\] \.featured-card__visual img\{[^}]*object-fit:contain;object-position:center top/)
  assert.match(radar, /data-server="SEA"\] \.featured-card__visual img\{[^}]*object-fit:contain;object-position:left bottom/)
  assert.match(radar, /data-server="CN"\]\[data-character="blacksperm-urplus"\] \.featured-card__visual img\{inset:-18% 18% auto auto;height:80%;width:50%;object-position:center top/)
  assert.match(radar, /@keyframes diagonalCharge/)
  assert.match(radar, /@keyframes featuredSweep/)
  assert.match(radar, /@keyframes featuredCopyLeft/)
  assert.match(radar, /@keyframes featuredCopyRight/)
  assert.match(radar, /@keyframes featuredFigureReveal/)
  assert.match(radar, /prefers-reduced-motion:reduce[^}]*featured-grid::after[^}]*featured-card__copy[^}]*featured-card__visual::after[^}]*featured-card \.hero-float-img\{animation:none!important/)
  assert.match(radar, /@media\(max-width:700px\)[\s\S]*?display:grid;height:auto;grid-template-columns:1fr;grid-template-rows:repeat\(2,minmax\(350px,auto\)\)/)
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
