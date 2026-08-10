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

test('Core Refinement is a lazy route in the Features menu', () => {
  const router = read('src/router/index.js')
  const app = read('src/App.vue')

  assert.match(router, /const CoreRefinementView = \(\) => import\('\.\.\/views\/CoreRefinementView\.vue'\)/)
  assert.match(router, /path: '\/core-refinement'/)
  assert.equal((app.match(/to="\/core-refinement"/g) || []).length, 2)
  assert.match(app, /const featureRoutes = \[[^\]]*'\/core-refinement'/)
  assert.match(app, /const featureRoutes = \[[^\]]*'\/mastery'/)
  assert.doesNotMatch(app, /const systemRoutes = \[[^\]]*'\/(?:mastery|core-refinement)'/)
  assert.equal(vi.mastery.featureTitle, 'T\u00cdNH N\u0102NG TINH TH\u00d4NG')
  assert.equal(en.mastery.featureTitle, 'MASTERY FEATURE')
  assert.match(vi.mastery.desc, /^T\u00ednh n\u0103ng/)
  assert.match(en.mastery.desc, /^The Arena Mastery feature/)
  assert.ok(vi.nav.coreRefinement)
  assert.ok(en.nav.coreRefinement)
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
