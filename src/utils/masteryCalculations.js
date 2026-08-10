const BASE_SPECIALIZED_RATE = 0.3

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const clampMasteryTier = (value) => Math.min(10, Math.max(0, Math.trunc(toFiniteNumber(value))))

export const readPercentEffect = (gear, level, effectType) => {
  if (!gear || level <= 0) return 0

  const levelConfig = gear.levels?.find(item => item.level === Number(level))
  const effect = levelConfig?.effects?.find(item => item.type === effectType)
  if (!effect?.text) return 0

  return toFiniteNumber(String(effect.text).replace(/[^\d.-]/g, ''))
}

export const calculateBackgearSpecializedRates = (gears, selectedLevels = {}) => {
  return gears.reduce((total, gear) => {
    const level = selectedLevels[gear.id] || 0
    total.attack += readPercentEffect(gear, level, 'combatoa_up')
    total.defense += readPercentEffect(gear, level, 'combatda_up')
    return total
  }, { attack: 0, defense: 0 })
}

export const calculateSpecializedStat = (battlePower, masteryTier, backgearPercent = 0) => {
  const safeBattlePower = Math.max(0, toFiniteNumber(battlePower))
  const masteryRate = clampMasteryTier(masteryTier) / 10
  const backgearRate = Math.max(0, toFiniteNumber(backgearPercent)) / 100

  return Math.round((BASE_SPECIALIZED_RATE + masteryRate + backgearRate) * safeBattlePower) + 1
}

export const clampArenaRate = (value) => Math.min(2.5, Math.max(0.25, toFiniteNumber(value, 1)))

export const calculateArenaMatchup = ({
  ownAttack,
  ownDefense,
  enemyAttack,
  enemyDefense,
}) => {
  const safeOwnAttack = Math.max(1, toFiniteNumber(ownAttack, 1))
  const safeOwnDefense = Math.max(1, toFiniteNumber(ownDefense, 1))
  const safeEnemyAttack = Math.max(1, toFiniteNumber(enemyAttack, safeOwnAttack))
  const safeEnemyDefense = Math.max(1, toFiniteNumber(enemyDefense, safeOwnDefense))
  const damageRate = clampArenaRate(safeOwnAttack / safeEnemyDefense)
  const incomingRate = clampArenaRate(safeEnemyAttack / safeOwnDefense)

  return {
    damageRate,
    incomingRate,
    damageDelta: (damageRate - 1) * 100,
    incomingDelta: (incomingRate - 1) * 100,
  }
}



const TIER_RANK = Object.freeze({
  N: 0,
  R: 1,
  SR: 2,
  SSR: 3,
  'SSR+': 4,
  UR: 5,
  'UR+': 6,
})

export const MASTERY_SUPPORT_RULES = Object.freeze({
  phe: Object.freeze([
    Object.freeze({ relation: 'sameFaction', minimumTier: 'SR', progression: 'awakening', level: 5 }),
  ]),
  he: Object.freeze([
    Object.freeze({ relation: 'sameType', minimumTier: 'SR', progression: 'insignia', level: 5 }),
    Object.freeze({ relation: 'any', minimumTier: 'SSR', progression: 'insignia', level: 5 }),
  ]),
  cap: Object.freeze([
    Object.freeze({ relation: 'any', minimumTier: 'SSR', progression: 'keepsake', level: 5 }),
    Object.freeze({ relation: 'any', minimumTier: 'SSR', progression: 'keepsake', level: 5 }),
  ]),
})

export const getMasterySupportRules = (branch) => MASTERY_SUPPORT_RULES[branch] || MASTERY_SUPPORT_RULES.phe

export const MASTERY_ADVANCED_BUFF_BY_TIER = Object.freeze([0, 0, 6, 6, 9, 9, 12, 12, 15, 15, 15])

export const getMasteryAdvancedBuff = (tier) => MASTERY_ADVANCED_BUFF_BY_TIER[clampMasteryTier(tier)]

export const isMasterySupportEligible = ({
  character,
  mainCharacter,
  branch,
  slotIndex,
}) => {
  const rule = getMasterySupportRules(branch)[slotIndex]
  if (!rule || !character || !mainCharacter) return false
  if (character.id === mainCharacter.id) return false

  const characterRank = TIER_RANK[String(character.tier || '').toUpperCase()] ?? -1
  const minimumRank = TIER_RANK[rule.minimumTier]
  if (characterRank < minimumRank) return false
  if (rule.relation === 'sameFaction' && character.faction !== mainCharacter.faction) return false
  if (rule.relation === 'sameType' && character.type !== mainCharacter.type) return false

  return true
}
