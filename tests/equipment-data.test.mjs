import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const equipment = JSON.parse(fs.readFileSync(path.join(root, 'src/data/equipment.json'), 'utf8'))
const workbench = fs.readFileSync(path.join(root, 'src/components/GearCatalogWorkbench.vue'), 'utf8')

test('Gear catalog contains 20 unique sets and four complete slots per set', () => {
  assert.equal(equipment.sets.length, 20)
  assert.equal(new Set(equipment.sets.map(item => item.id)).size, equipment.sets.length)
  assert.deepEqual(equipment.slots.map(slot => slot.id), [1, 2, 3, 4])
  assert.deepEqual(equipment.slots.map(slot => slot.nameVi), ['Áo', 'Quần', 'Giày', 'Mũ'])
  assert.deepEqual(equipment.slots.map(slot => slot.nameEn), ['Shirt', 'Pants', 'Shoes', 'Hat'])

  for (const set of equipment.sets) {
    assert.ok(set.nameVi && set.nameEn, `${set.id} is missing a localized name`)
    assert.ok(set.effectVi && set.effectEn, `${set.id} is missing a localized 4-piece effect`)
    assert.ok(fs.existsSync(path.join(root, 'public/Gear', `gear_${set.id}.png`)), `${set.id} is missing its set icon`)
    for (const slot of equipment.slots) {
      assert.ok(
        fs.existsSync(path.join(root, 'public/Gear', `equip_${set.id}_${slot.id}_icon.png`)),
        `${set.id} is missing slot ${slot.id}`,
      )
    }
  }
})

test('Gear evolution branches cover every set exactly once', () => {
  const coveredIds = equipment.groups.flatMap(group => [...group.baseSetIds, group.redSetId])
  assert.equal(coveredIds.length, equipment.sets.length)
  assert.equal(new Set(coveredIds).size, equipment.sets.length)
  assert.deepEqual(new Set(coveredIds), new Set(equipment.sets.map(item => item.id)))

  for (const group of equipment.groups) {
    const redSet = equipment.sets.find(item => item.id === group.redSetId)
    assert.equal(redSet?.category, 'red', `${group.id} must evolve into a Red set`)
    assert.ok(fs.existsSync(path.join(root, 'public', group.blueprint.replace(/^\//, ''))), `${group.id} is missing its blueprint`)
  }
  assert.ok(fs.existsSync(path.join(root, 'public/Gear/Item_212006.png')))
})

test('Gear evolution requirement matches the verified per-piece cost', () => {
  assert.deepEqual(equipment.evolutionRequirement, {
    baseLevel: 85,
    goldCostPerPiece: 2_000_000,
    blueprintPerPiece: 1,
    catalystPerPiece: 100,
  })
})

test('Gear upgrade limits match the simulator constraints', () => {
  assert.equal(equipment.maxLevel, 120)
  assert.equal(equipment.maxGoldStars, 6)
  assert.equal(equipment.maxPurpleStars, 6)
  assert.ok(equipment.statPools.main.length > 0)
  assert.ok(equipment.statPools.secondary.length > 0)
})


test('Gear upgrade materials and Red refinement milestones are complete', () => {
  assert.deepEqual(equipment.upgradeCosts.goldStarCards, [4, 8, 16, 24, 32, 64])
  assert.deepEqual(equipment.upgradeCosts.purpleStarCards, [6, 12, 18, 24, 30, 36])
  for (const icon of [
    equipment.upgradeCosts.goldIcon,
    equipment.upgradeCosts.levelCardIcon,
    equipment.upgradeCosts.goldStarCardIcon,
    equipment.upgradeCosts.bindingCardIcon,
    equipment.upgradeCosts.purpleStarCardIcon,
  ]) {
    assert.ok(fs.existsSync(path.join(root, 'public', icon.replace(/^\//, ''))), `missing upgrade material icon ${icon}`)
  }
  for (const group of equipment.groups) {
    assert.match(group.blueprintNameVi, /^B\u1ea3n v\u00e9 /)
    assert.match(group.blueprintNameEn, /Blueprint$/)
  }
})

test('Gear simulator supports automatic full-set equip and explicit per-slot actions', () => {
  assert.match(workbench, /class="set-picker-trigger"[^>]*@click="setPickerOpen = true"/)
  assert.match(workbench, /const chooseFullSet = setId =>/)
  assert.match(workbench, /selectedSetId\.value = setId[\s\S]*equipFullSet\(\)/)
  assert.doesNotMatch(workbench, /class="desktop-set-select"/)
  assert.match(workbench, /const equipSetInSlot = \(index, setId\)/)
  assert.match(workbench, /const clearSlot = index =>/)
  assert.match(workbench, /class="gear-piece-main"[^>]*@click="activeSlot = index"/)
  assert.match(workbench, /class="gear-piece-actions"/)
  assert.match(workbench, /@click="clearSlot\(index\)"/)
  assert.match(workbench, /v-else type="button" class="empty-piece"/)
  assert.match(workbench, /@click="openPiecePicker\(index\)"/)
  assert.match(workbench, /v-if="pickerSlot !== null"/)
  assert.doesNotMatch(workbench, /class="piece-mixer"/)
  assert.doesNotMatch(workbench, />\?<\/button>|\?\{\{ equipmentData\.evolutionRequirement/)
  assert.match(workbench, /slotBuilds\.value\.every\(build => build\.setId === first\)/)
})

test('Gear evolution and refinement bonus lines match the verified reference rules', () => {
  assert.deepEqual(equipment.bonusEffects.map(line => line.unlockStar), [3, 4, 5])
  assert.deepEqual(equipment.bonusEffects[0].options.map(option => option.id), [
    'arenaDmgFree', 'sAtkBoost', 'rAtkBoost', 'cAtkBoost', 'gAtkBoost',
  ])
  assert.deepEqual(equipment.bonusEffects[0].options[0].values, ['+10%', '+20%'])
  assert.deepEqual(equipment.bonusEffects[1].options.map(option => option.id), [
    'energyGauge', 'lowHpIgnition', 'actionHealing',
  ])
  assert.deepEqual(equipment.bonusEffects[1].options[0].values, ['+250', '+500'])
  assert.deepEqual(equipment.bonusEffects[2].options.map(option => option.id), [
    'arenaDmg', 'attack', 'defense', 'hp',
  ])
  assert.match(workbench, /evolutionBonusLines: 0/)
  assert.match(workbench, /const totalResourceCosts = computed/)
  assert.match(workbench, /currentGoldStarCost/)
  assert.match(workbench, /class="level-costs"/)
  assert.match(workbench, /v-for="\(line, lineIndex\) in equipmentData\.bonusEffects"/)
})

test('Gear stats and enhancement curves match the decoded reference model', () => {
  assert.deepEqual(equipment.statProgression.main.basic.attack, [3750, 32])
  assert.deepEqual(equipment.statProgression.main.red.hp, [45000, 192])
  assert.deepEqual(equipment.statProgression.secondary.attackRate, [0.06, 0.04, true])
  assert.equal(equipment.statProgression.purple.attackPerStar, 2500)
  assert.equal(equipment.statProgression.purple.hpPerStar, 15000)
  assert.deepEqual(equipment.statProgression.purple.bonusLineStars, [3, 4, 5])

  const totalAt120 = segments => segments.reduce((total, [from, to, gold, exp, binding]) => {
    const count = to - from + 1
    total.gold += count * gold
    total.exp += count * exp
    total.binding += count * binding
    return total
  }, { gold: 0, exp: 0, binding: 0 })
  assert.deepEqual(totalAt120(equipment.enhanceCurves.basic), { gold: 5_732_640, exp: 39_539, binding: 0 })
  assert.deepEqual(totalAt120(equipment.enhanceCurves.red), { gold: 6_696_000, exp: 47_110, binding: 6_275 })
  assert.deepEqual(totalAt120(equipment.enhanceCurves.redAccessory), { gold: 10_686_500, exp: 47_110, binding: 6_275 })
})
