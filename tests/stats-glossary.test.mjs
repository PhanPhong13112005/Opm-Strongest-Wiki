import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { statsGlossary, statsGlossaryEntryCount } from '../src/data/statsGlossary.js'

const root = path.resolve(import.meta.dirname, '..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')

test('stats glossary contains all screenshot-proven categories and entries', () => {
  assert.equal(statsGlossaryEntryCount, 67)
  assert.deepEqual(
    statsGlossary.map(section => [section.id, section.entries.length]),
    [['base', 6], ['attack-ranges', 4], ['advanced', 55], ['other', 2]],
  )

  const entries = statsGlossary.flatMap(section => section.entries)
  assert.equal(new Set(entries.map(item => item.id)).size, entries.length)
  for (const item of entries) {
    assert.ok(item.term.vi && item.term.en, `${item.id} must have bilingual terms`)
    assert.ok(item.description.vi && item.description.en, `${item.id} must have bilingual descriptions`)
  }
})

test('source-critical stat descriptions remain exact', () => {
  const entries = new Map(statsGlossary.flatMap(section => section.entries).map(item => [item.id, item]))

  assert.equal(entries.get('speed').description.en, 'Decides action sequence in battle.')
  assert.equal(entries.get('single-attack').description.en, 'Attack a single target.')
  assert.equal(entries.get('energy-gauge-points').description.en, 'At the start of each round, you gain 1 Energy for each 1,000 points in your Energy Gauge.')
  assert.match(entries.get('specialized-attack-defense').description.en, /Based on BP/)
  assert.match(entries.get('specialized-attack-defense').description.vi, /Lực Chiến/)
  assert.doesNotMatch(entries.get('specialized-attack-defense').description.vi, /\bBP\b/)
  assert.doesNotMatch(entries.get('specialized-defense').description.vi, /\bBP\b/)
  assert.match(entries.get('assist-buff').description.en, /Handy Support/)
})

test('StatsView exposes bilingual search, category filters and source traceability', () => {
  const view = read('src/views/StatsView.vue')
  const vi = JSON.parse(read('src/locales/vi.json'))
  const en = JSON.parse(read('src/locales/en.json'))

  assert.match(view, /v-model="query"/)
  assert.match(view, /activeSection/)
  assert.match(view, /statsGlossaryEntryCount/)
  assert.match(view, /statsPage\.sourceText/)
  assert.doesNotMatch(vi.statsPage.description, /đang được hoàn thiện/i)
  assert.doesNotMatch(en.statsPage.description, /being developed/i)
  assert.match(vi.statsPage.sourceText, /16 ảnh chụp/)
  assert.match(en.statsPage.sourceText, /16 screenshots/)
})

test('StatsView keeps readable typography, motion controls and mobile layout', () => {
  const view = read('src/views/StatsView.vue')

  assert.match(view, /font-family: 'Be Vietnam Pro'/)
  assert.match(view, /<TransitionGroup name="stat-list"/)
  assert.match(view, /@keyframes hero-enter/)
  assert.match(view, /@keyframes card-enter/)
  assert.match(view, /@media \(max-width: 560px\)/)
  assert.match(view, /min-height: 46px/)
  assert.match(view, /font-size: 16px/)
  assert.match(view, /@media \(prefers-reduced-motion: reduce\)/)
})

