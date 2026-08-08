import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
const catalogs = {
  vi: readJson('src/data/characters.json'),
  en: readJson('src/data/characters_en.json'),
}

test('generated character detail files preserve both localized catalogs one character at a time', () => {
  for (const [locale, characters] of Object.entries(catalogs)) {
    for (const source of characters) {
      const relativePath = path.join('public', 'character-details', locale, source.id + '.json')
      assert.ok(fs.existsSync(path.join(root, relativePath)), relativePath)
      const generated = readJson(relativePath)
      assert.equal(generated.id, source.id)
      assert.equal(generated.name, source.name)
      assert.equal(generated.tier, source.tier)
      assert.equal(generated.type, source.type)
      assert.equal(generated.faction, source.faction)
      assert.deepEqual(generated.skills, source.skills)
      assert.deepEqual(generated.effects, source.effects)
      assert.equal(generated.imageURL, '/Characters/optimized/' + source.id + '-600.webp')
      assert.match(generated.imageSrcset, new RegExp(source.id + '-360\\.webp 360w'))
      assert.ok(generated.imageWidth > 0)
      assert.ok(generated.imageHeight > 0)
    }
  }
})

test('optimized character and detail icon assets exist and use WebP payloads', () => {
  for (const character of catalogs.vi) {
    const sourcePath = path.join(root, 'public', decodeURIComponent(character.imageURL.replace(/^\//, '')))
    for (const width of [360, 600]) {
      const optimizedPath = path.join(root, 'public', 'Characters', 'optimized', character.id + '-' + width + '.webp')
      assert.ok(fs.existsSync(optimizedPath), optimizedPath)
      const signature = fs.readFileSync(optimizedPath).subarray(8, 12).toString('ascii')
      assert.equal(signature, 'WEBP', optimizedPath)
      assert.ok(fs.statSync(optimizedPath).size < fs.statSync(sourcePath).size, optimizedPath)
    }
  }

  const detailIcons = fs.readdirSync(path.join(root, 'public', 'DetailIcons'))
  assert.equal(detailIcons.length, 16)
  assert.ok(detailIcons.every(file => file.endsWith('.webp')))
})

test('character route defers catalogs, Core Lab, and below-fold media', () => {
  const view = fs.readFileSync(path.join(root, 'src', 'views', 'DetailView.vue'), 'utf8')
  const loader = fs.readFileSync(path.join(root, 'src', 'data', 'loadCharacterDetail.js'), 'utf8')
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

  assert.doesNotMatch(view, /import .*characters(_en)?\.json/)
  assert.doesNotMatch(view, /import .*coreLab\.json/)
  assert.match(view, /import\('\.\.\/data\/coreLab\.json'\)/)
  assert.match(view, /\{ trackLoading: false \}/)
  assert.match(view, /loading="lazy" fetchpriority="low"/)
  assert.doesNotMatch(loader, /import\.meta\.glob/)
  assert.match(loader, /\/character-details\/\$\{locale\}\//)
  assert.match(loader, /cache: 'force-cache'/)
  assert.match(html, /data-app-boot/)
  assert.ok(html.includes("const characterMatch = /^\\/character\\/([a-zA-Z0-9_-]+)\\/?$/.exec(location.pathname)"))
  assert.match(html, /character-boot-names:start/)
  assert.match(html, /"blacksperm-urplus":"Tinh Trùng Đen"/)
})
