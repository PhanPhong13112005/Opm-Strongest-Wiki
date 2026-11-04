import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { homeHeroPreloadManifest, homeHeroPreloadScript, getResponsiveHomeImage, featuredImageSizes, entryStylesheetPreloads } from '../src/utils/homeHeroImage.js'

const rows = JSON.parse(fs.readFileSync(new URL('../src/data/releaseSchedule.json', import.meta.url)))
const manifest = homeHeroPreloadManifest(rows)

test('entry CSS hints preserve the built stylesheet URL and request attributes', () => {
  const style = '<link rel="stylesheet" crossorigin href="/assets/index-hash.css">'
  const html = `<head><!-- home-hero-preload -->${style}</head>`
  const hints = entryStylesheetPreloads(html)
  assert.equal(hints, '<link rel="preload" as="style" fetchpriority="high" crossorigin href="/assets/index-hash.css">\n')
  const built = html.replace('<!-- home-hero-preload -->', `${hints}<script>monthAwareHero()</script>`)
  assert.ok(built.indexOf('as="style"') < built.indexOf('monthAwareHero()'))
  assert.ok(built.indexOf('monthAwareHero()') < built.indexOf(style))
})

test('entry CSS hints do not preload fonts, external styles or duplicate URLs', () => {
  const local = '<link href="./assets/entry.css?v=1" rel="stylesheet" media="screen">'
  const html = `${local}${local}<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><link rel="stylesheet" href="//example.test/style.css">`
  assert.equal(entryStylesheetPreloads(html), '<link href="./assets/entry.css?v=1" rel="preload" as="style" fetchpriority="high" media="screen">\n')
  assert.equal(entryStylesheetPreloads('<head><!-- home-hero-preload --></head>'), '')
})

const runHint = (url, time = '2026-10-15T05:00:00Z') => {
  const links = []
  const RealDate = Date
  class FixedDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [time])) }
  }
  vm.runInNewContext(homeHeroPreloadScript(rows), {
    location: new URL(url, 'https://example.test'), URLSearchParams, Intl, Date: FixedDate, window: {},
    Image: class {
      attrs = {}
      setAttribute(key, value) { this.attrs[key] = value }
      set src(value) { this.source = value; links.push(this) }
      get src() { return this.source }
    },
  })
  return links
}

test('early hero selection shares September image/srcset/sizes with Vue, not row arrival order', () => {
  assert.equal(manifest['2026-09'].characterId, 'homeless-emperor-urplus')
  assert.equal(manifest['2026-09'].server, 'CN')
  assert.equal(manifest['2026-09'].sizes, featuredImageSizes.CN)
  const image = getResponsiveHomeImage('/Characters/Full_Background/Homeless_Emperor_URplus.png')
  assert.equal(manifest['2026-09'].src, image.src)
  assert.equal(manifest['2026-09'].srcset, image.srcset)
  assert.equal(image.width, 2400)
  assert.equal(image.height, 1473)
  assert.deepEqual(homeHeroPreloadManifest([...rows].reverse())['2026-09'], manifest['2026-09'])
})

test('October and November use verified initial/return spotlights without invented events', () => {
  assert.equal(manifest['2026-10'].characterId, '100320-urplus')
  assert.match(manifest['2026-10'].src, /100320-urplus-600\.webp\?v=/)
  assert.match(manifest['2026-10'].srcset, /360\.webp\?v=[^ ]+ 360w, .*600\.webp\?v=[^ ]+ 600w/)
  assert.equal(manifest['2026-11'].characterId, '100321-urplus')
  assert.equal(manifest['2026-11'].src, getResponsiveHomeImage('/Characters/optimized/100321-urplus-artwork-1200.webp').src)
  assert.equal(manifest['2027-02'].server, 'SEA')
  assert.equal(manifest['2027-02'].sizes, featuredImageSizes.SEA)
  assert.equal(manifest['2030-01'], undefined)
})

test('head script starts only the selected boot Image with matching responsive attributes', () => {
  for (const month of ['2026-09', '2026-10', '2026-11', '2027-02']) {
    const [hint, ...extra] = runHint(`/?month=${month}`)
    assert.equal(extra.length, 0)
    assert.equal(hint.loading, 'eager')
    assert.equal(hint.src, manifest[month].src)
    assert.equal(hint.srcset, manifest[month].srcset)
    assert.equal(hint.sizes, manifest[month].sizes)
    assert.equal(hint.attrs.fetchpriority, 'high')
    assert.equal(hint.attrs['data-home-hero-preload'], month)
  }
  assert.deepEqual(runHint('/?month=2030-01'), [])
  assert.deepEqual(runHint('/characters'), [])
  assert.deepEqual(runHint('/character/100320-urplus'), [])
})

test('hint defaults to Vietnam calendar month at midnight and respects explicit URL choice', () => {
  assert.equal(runHint('/', '2026-09-30T17:00:00Z')[0].attrs['data-home-hero-preload'], '2026-10')
  assert.equal(runHint('/', '2026-10-31T17:00:00Z')[0].attrs['data-home-hero-preload'], '2026-11')
  assert.equal(runHint('/?month=2026-09', '2026-12-31T17:00:00Z')[0].attrs['data-home-hero-preload'], '2026-09')
  assert.equal(runHint('/?month=invalid')[0].attrs['data-home-hero-preload'], '2026-10')
  assert.equal(runHint('/?month=2026-99')[0].attrs['data-home-hero-preload'], '2026-10')
})

test('unknown or unoptimized primary spotlights do not preload another character or huge raw art', () => {
  assert.equal(getResponsiveHomeImage('/Characters/Full_Background/Homeless_Emperor_URplus.webp'), null)
  assert.equal(manifest['2026-06'], undefined)
  const unknown = rows.map(row => row.server === 'CN' && row.date === '2026-09-01'
    ? { ...row, characterId: 'unknown', bannerImage: null } : row)
  assert.equal(homeHeroPreloadManifest(unknown)['2026-09'], undefined)
  const original = JSON.stringify(rows)
  homeHeroPreloadManifest(rows)
  assert.equal(JSON.stringify(rows), original)
})

test('all hinted image candidates are existing optimized WebP files below the unchanged size ceiling', () => {
  for (const hero of Object.values(manifest)) {
    for (const part of hero.srcset.split(', ')) {
      const url = new URL(part.split(' ')[0], 'https://example.test')
      assert.match(url.pathname, /\/optimized\/[^/]+\.webp$/)
      const bytes = fs.statSync(new URL(`../public${url.pathname}`, import.meta.url)).size
      assert.ok(bytes > 0 && bytes < 500_000, `${url.pathname}: ${bytes}`)
    }
  }
})

test('build hook injects early discovery without adding an image to the neutral boot template', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const config = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8')
  assert.ok(html.indexOf('<!-- home-hero-preload -->') < html.indexOf('src="/src/main.js"'))
  assert.match(config, /transformIndexHtml/)
  assert.match(config, /homeHeroPreloadScript\(rows\)/)
  const boot = html.match(/<template id="home-boot-template">([\s\S]*?)<\/template>/)[1]
  assert.doesNotMatch(boot, /<img\b/)
})
