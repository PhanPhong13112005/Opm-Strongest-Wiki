import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { buffGearSlots, buffGearSourceAssets, BUFF_GEAR_CONFIDENCE } from '../src/data/buffGear/slots.js'
import { buffGearStructure, buffGearProgression, buffGearConfirmedExample } from '../src/data/buffGear/progression.js'
import { buffGearSkills, buffGearSkillCategoryIds, getBuffGearSkillCategories } from '../src/data/buffGear/skills.js'
import { buffGearTermById } from '../src/data/buffGear/terminology.js'

const root = path.resolve(import.meta.dirname, '..')

test('Buff Gear exposes the three exact slot pools', () => {
  assert.deepEqual(buffGearSlots.map(slot => slot.id), ['faction', 'type', 'level'])
  assert.deepEqual(buffGearSlots.map(slot => slot.code), ['F', 'T', 'L'])
  assert.deepEqual(buffGearSlots[0].transformationStats, ['ATK', 'HP', 'DEF', 'RED_DEF', 'ATK_BONUS', 'HP_BONUS', 'DEF_BONUS', 'SPD_BONUS'])
  assert.deepEqual(buffGearSlots[1].transformationStats, ['ATK', 'HP', 'DEF', 'RED_DEF', 'CRIT', 'BLOCK', 'EFFECT_HIT', 'EFFECT_RESIST'])
  assert.deepEqual(buffGearSlots[2].transformationStats, ['ATK', 'HP', 'DEF', 'RED_DEF', 'SKILL_DMG', 'DMG_FREE', 'BONUS_DMG', 'BONUS_DMG_FREE'])
  assert.equal(buffGearSlots.every(slot => slot.purificationStats.length === 8), true)
  assert.deepEqual(buffGearSlots.map(slot => slot.refineStats.length), [7, 6, 5])
  for (const slot of buffGearSlots) {
    const completePool = new Set([
      ...slot.transformationStats,
      ...slot.purificationStats.map(item => item.id),
      ...slot.refineStats,
    ])
    assert.equal(slot.focusStats.every(id => completePool.has(id)), true)
  }
  assert.equal(buffGearSlots.flatMap(slot => [
    ...slot.transformationStats,
    ...slot.purificationStats.map(item => item.id),
    ...slot.refineStats,
  ]).every(id => buffGearTermById[id]), true)
})

test('Purification ranges retain the confirmed min and max values', () => {
  for (const slot of buffGearSlots) {
    const ranges = Object.fromEntries(slot.purificationStats.map(item => [item.id, item]))
    assert.deepEqual([ranges.ATK.min, ranges.ATK.max, ranges.ATK.unit], [600, 2000, 'flat'])
    assert.deepEqual([ranges.DEF.min, ranges.DEF.max, ranges.DEF.unit], [150, 500, 'flat'])
    assert.deepEqual([ranges.HP.min, ranges.HP.max, ranges.HP.unit], [2400, 12000, 'flat'])
    for (const item of slot.purificationStats.filter(entry => !['ATK', 'DEF', 'HP'].includes(entry.id))) {
      assert.deepEqual([item.min, item.max, item.unit], [1, 10, 'percent'])
    }
  }
})

test('Progression keeps all five systems separate and preserves limits', () => {
  assert.deepEqual(buffGearProgression.map(stage => stage.id), ['transformation', 'ascension', 'advance', 'purification', 'refine'])
  assert.equal(buffGearStructure.transformedBonusStatLimit, 5)
  assert.equal(buffGearStructure.identicalBonusStatLimit, 3)
  assert.equal(buffGearStructure.resetLockLimit, 2)
  const advance = buffGearProgression.find(stage => stage.id === 'advance')
  assert.equal(advance.playerLevel, 90)
  assert.ok(advance.rules.includes('inheritTransformation'))
  assert.ok(advance.rules.includes('inheritAscension'))
  assert.deepEqual(buffGearProgression.find(stage => stage.id === 'purification').milestones, [1, 3, 6, 12])
  assert.equal(buffGearProgression.find(stage => stage.id === 'purification').skillLimit, 1)
  assert.equal(buffGearProgression.find(stage => stage.id === 'purification').numericLimit, null)
  assert.equal(buffGearProgression.find(stage => stage.id === 'refine').limit, 6)
})

test('The confirmed HP Buff example does not invent a stacking formula', () => {
  assert.equal(buffGearConfirmedExample.slots.length, 3)
  assert.equal(buffGearConfirmedExample.slots.every(item => item.stat === 'HP_BUFF' && item.value === 5), true)
  assert.equal(buffGearConfirmedExample.combinedFormula, null)
})

test('Skill glossary contains all 22 unique entries and marks Burning Boost partial', () => {
  assert.equal(buffGearSkills.length, 22)
  assert.equal(new Set(buffGearSkills.map(skill => skill.id)).size, 22)
  assert.equal(buffGearSkills.every(skill => BUFF_GEAR_CONFIDENCE.includes(skill.confidence)), true)
  assert.equal(buffGearSkills.every(skill => skill.name.en && skill.name.vi && skill.sourceText && skill.summaryVi), true)
  const burning = buffGearSkills.find(skill => skill.id === 'burning_boost')
  assert.equal(burning.confidence, 'partial')
  assert.match(burning.summaryVi, /chưa xác minh đầy đủ/i)
  assert.doesNotMatch(burning.sourceText, /\d+%/)
})

test('All 16 optimized WebP assets are committed without semantic guesses', () => {
  assert.equal(buffGearSourceAssets.length, 16)
  for (const asset of buffGearSourceAssets) {
    const optimized = path.join(root, 'public', decodeURIComponent(asset.optimized).replace(/^\/Buff Gear\//, 'Buff Gear/'))
    assert.equal(fs.existsSync(optimized), true, `Missing ${asset.optimized}`)
    assert.match(asset.optimized, new RegExp(`^/Buff Gear/optimized/${asset.id}\\.webp$`))
    assert.ok(fs.statSync(optimized).size < 64 * 1024, `${asset.id} is unexpectedly large`)
    assert.equal(asset.semanticAssignment, null)
    assert.equal(asset.confidence, 'partial')
  }
})
test('Beginner skill categories cover every Skill Stat without changing source tags', () => {
  assert.deepEqual(buffGearSkillCategoryIds, ['offense', 'defense', 'sustain', 'status', 'spd', 'utility'])
  for (const skill of buffGearSkills) {
    const categories = getBuffGearSkillCategories(skill)
    assert.ok(categories.length > 0, 'Missing beginner category for ' + skill.id)
    assert.equal(categories.every(category => buffGearSkillCategoryIds.includes(category)), true)
  }
})
