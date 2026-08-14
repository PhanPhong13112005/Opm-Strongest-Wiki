export const buffGearStructure = Object.freeze({
  initialMainStats: 1,
  initialBonusStats: [0, 1],
  transformedBonusStatLimit: 5,
  identicalBonusStatLimit: 3,
  resetLockLimit: 2,
  rareExcellentSkillChance: true,
  confidence: 'confirmed',
})

export const buffGearProgression = Object.freeze([
  {
    id: 'transformation', order: 1, target: 'bonusStats', confidence: 'confirmed',
    rules: ['changeBonusValue', 'grantNewBonusType', 'resetToInitial', 'retainLockedBonus', 'lockMaximumTwo'],
  },
  {
    id: 'ascension', order: 2, target: 'mainStat', confidence: 'confirmed',
    rules: ['increaseMainStat'],
  },
  {
    id: 'advance', order: 3, target: 'orangeToRed', confidence: 'confirmed',
    playerLevel: 90,
    rules: ['inheritTransformation', 'inheritAscension', 'gainRandomRefinementAttribute', 'unlockPurification', 'unlockRefine'],
  },
  {
    id: 'purification', order: 4, target: 'effectsAndSkill', confidence: 'confirmed',
    milestones: [1, 3, 6, 12],
    skillLimit: 1,
    numericLimit: null,
    rules: ['rerollUnlockedEffect', 'rerollUnlockedBonus', 'lockedEffectRetainsEffect', 'lockedSkillRetainsSkill', 'sameKindTransfer'],
  },
  {
    id: 'refine', order: 5, target: 'refinementStats', confidence: 'confirmed',
    requiresAscension: true,
    limit: 6,
    rules: ['randomSecondaryEffect', 'retainOriginalMagnitude'],
  },
])

export const buffGearConfirmedExample = Object.freeze({
  slots: [
    { slot: 'faction', compatibility: 'Hero', stat: 'HP_BUFF', value: 5, unit: 'percent' },
    { slot: 'type', compatibility: 'Hi-Tech', stat: 'HP_BUFF', value: 5, unit: 'percent' },
    { slot: 'level', compatibility: 'S-Class', stat: 'HP_BUFF', value: 5, unit: 'percent' },
  ],
  combinedFormula: null,
  confidence: 'confirmed',
})
