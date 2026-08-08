import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const vi = JSON.parse(read('src/locales/vi.json'))
const en = JSON.parse(read('src/locales/en.json'))

test('Stats and Talents are lazy routes in the Systems and Features menus', () => {
  const router = read('src/router/index.js')
  const app = read('src/App.vue')

  assert.match(router, /const StatsView = \(\) => import\('\.\.\/views\/StatsView\.vue'\)/)
  assert.match(router, /const TalentsView = \(\) => import\('\.\.\/views\/TalentsView\.vue'\)/)
  assert.match(router, /path: '\/stats'/)
  assert.match(router, /path: '\/talents'/)
  assert.equal((app.match(/to="\/stats"/g) || []).length, 2)
  assert.equal((app.match(/to="\/talents"/g) || []).length, 2)
  assert.match(app, /const featureRoutes = \[[^\]]*'\/talents'/)
  assert.doesNotMatch(app, /const featureRoutes = \[[^\]]*'\/stats'/)
  assert.match(app, /const systemRoutes = \[[^\]]*'\/stats'/)
})

test('new page and recommendation translation keys remain bilingual', () => {
  for (const locale of [vi, en]) {
    assert.ok(locale.nav.stats)
    assert.ok(locale.nav.talents)
    assert.ok(locale.statsPage.title)
    assert.ok(locale.talentsPage.tabs.basic)
    assert.ok(locale.talentsPage.tabs.intermediate)
    assert.ok(locale.talentsPage.tabs.advanced)
    assert.ok(locale.talentsPage.tabs.sigils)
    assert.ok(locale.detail.requiredInsignia)
    assert.ok(locale.detail.recommendedGear)
    const serialized = JSON.stringify({ nav: locale.nav, detail: locale.detail, statsPage: locale.statsPage, talentsPage: locale.talentsPage })
    assert.doesNotMatch(serialized, /\?/, 'new localized UI copy contains replacement question marks')
  }
})

test('character details expose honest pending recommendation cards', () => {
  const detail = read('src/views/DetailView.vue')
  assert.match(detail, /detail\.requiredInsignia/)
  assert.match(detail, /detail\.recommendedGear/)
  assert.match(detail, /detail\.recommendationPending/)
  assert.match(detail, /to="\/insignias"/)
  assert.match(detail, /to="\/equipment"/)
})
