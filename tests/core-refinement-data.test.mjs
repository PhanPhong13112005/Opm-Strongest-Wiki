import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/coreRefinement.json'), 'utf8'))

const getPage = id => data.pages.find(page => page.id === id)
const calculate = (page, from, to, locks) => {
  const totalExp = page.levels
    .filter(row => row.level >= from && row.level < to)
    .reduce((sum, row) => sum + row.expToNext, 0)
  const expPerRoll = page.lockTiers.find(tier => tier.lockedCount === locks).expPerRoll
  const perRollLock = page.lockCosts.find(item => item.scope === locks)?.amount || 0
  const rolls = Math.ceil(totalExp / expPerRoll)
  return { totalExp, rolls, chips: rolls * page.rollCost, lockComponents: rolls * perRollLock }
}

test('Core Refinement contains the two independent progression branches', () => {
  assert.deepEqual(data.pages.map(page => page.id), ['TAR_1', 'TAR_2'])
  assert.deepEqual(data.pages.map(page => page.maxLevel), [15, 20])
  assert.deepEqual(data.pages.map(page => page.slotCount), [4, 5])
  assert.ok(data.pages.every(page => page.accountLevelReq === 78))
  assert.equal(getPage('TAR_1').unlocksPageId, 'TAR_2')
  assert.equal(getPage('TAR_1').unlocksAtLevel, 11)
})

test('levels, slot milestones and quality tables are internally complete', () => {
  for (const page of data.pages) {
    assert.deepEqual(page.levels.map(row => row.level), Array.from({ length: page.maxLevel }, (_, index) => index + 1))
    assert.equal(page.levels.at(-1).expToNext, 0)
    assert.equal(page.slots.length, page.slotCount)
    assert.deepEqual(page.slots.map(slot => slot.slotIndex), Array.from({ length: page.slotCount }, (_, index) => index + 1))
    assert.equal(Object.keys(page.quality.rates).length, page.maxLevel)

    for (let level = 1; level <= page.maxLevel; level += 1) {
      const rates = page.quality.rates[String(level)]
      const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0)
      assert.ok(Math.abs(total - 1) < 0.000001, `${page.id} Lv.${level} quality odds do not total 100%`)
      for (const [quality, rate] of Object.entries(rates)) {
        assert.ok(Number(rate) > 0)
        assert.ok(level >= page.quality.unlock[quality], `${page.id} quality ${quality} appears before its unlock level`)
      }
    }
  }
})

test('stat pools have unique attributes and equal appearance rates per branch', () => {
  const expectedTierCounts = {
    TAR_1: { SSR: 1, SR: 4, R: 12 },
    TAR_2: { SSR: 1, SR: 5, R: 12 },
  }

  for (const page of data.pages) {
    const stats = page.pool.flatMap(tier => tier.stats)
    assert.deepEqual(Object.fromEntries(page.pool.map(tier => [tier.tier, tier.stats.length])), expectedTierCounts[page.id])
    assert.equal(new Set(stats.map(stat => stat.attr.toLowerCase())).size, stats.length)
    for (const stat of stats) assert.ok(Math.abs(stat.appear - (1 / stats.length)) < Number.EPSILON)
  }
})

test('resource formula matches known full-progression examples', () => {
  assert.deepEqual(calculate(getPage('TAR_1'), 1, 15, 0), {
    totalExp: 15_570,
    rolls: 15_570,
    chips: 155_700,
    lockComponents: 0,
  })
  assert.deepEqual(calculate(getPage('TAR_1'), 1, 15, 4), {
    totalExp: 15_570,
    rolls: 1_947,
    chips: 19_470,
    lockComponents: 7_788,
  })
  assert.deepEqual(calculate(getPage('TAR_2'), 1, 20, 5), {
    totalExp: 38_650,
    rolls: 3_865,
    chips: 38_650,
    lockComponents: 19_325,
  })
})

test('optimized Core Refinement assets exist and are substantially smaller than source PNGs', () => {
  const publicAssetPath = url => path.join(root, 'public', decodeURIComponent(url).replace(/^\//, ''))
  const urls = [
    ...Object.values(data.assets.pageCard),
    data.assets.chip,
    data.assets.lockComponent,
  ]

  for (const url of urls) {
    const optimized = publicAssetPath(url)
    const source = optimized.replace(/\.webp$/i, '.png')
    assert.ok(fs.existsSync(optimized), `${url} is missing`)
    assert.ok(fs.statSync(optimized).size < fs.statSync(source).size * 0.25, `${url} was not effectively optimized`)
  }
})
