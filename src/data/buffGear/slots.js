export const BUFF_GEAR_CONFIDENCE = Object.freeze(['confirmed', 'partial', 'analysis'])

export const BUFF_GEAR_STAT_IDS = Object.freeze([
  'ATK', 'HP', 'DEF', 'RED_DEF', 'ATK_BONUS', 'HP_BONUS', 'DEF_BONUS', 'SPD_BONUS',
  'CRIT', 'BLOCK', 'EFFECT_HIT', 'EFFECT_RESIST', 'SKILL_DMG', 'DMG_FREE',
  'BONUS_DMG', 'BONUS_DMG_FREE', 'HIT', 'RES', 'FACTION_DMG_PLUS',
  'FACTION_DMG_FREE', 'ARENA_DMG_PLUS', 'ARENA_DMG_FREE', 'BLOCK_RATE', 'CRIT_DMG',
  'SPD', 'CRIT_RES_RATE', 'DMG_REFLECT', 'DMG_RATE', 'HP_BUFF',
])

const range = (id, min, max, unit) => ({ id, min, max, unit, confidence: 'confirmed' })

export const buffGearSlots = Object.freeze([
  {
    id: 'faction',
    code: 'F',
    compatibilityExample: 'Hero',
    focusStats: ['SPD', 'CRIT', 'CRIT_DMG'],
    transformationStats: ['ATK', 'HP', 'DEF', 'RED_DEF', 'ATK_BONUS', 'HP_BONUS', 'DEF_BONUS', 'SPD_BONUS'],
    purificationStats: [
      range('ATK', 600, 2000, 'flat'), range('DEF', 150, 500, 'flat'), range('HP', 2400, 12000, 'flat'),
      range('ATK_BONUS', 1, 10, 'percent'), range('DEF_BONUS', 1, 10, 'percent'),
      range('HP_BONUS', 1, 10, 'percent'), range('HIT', 1, 10, 'percent'), range('RES', 1, 10, 'percent'),
    ],
    refineStats: ['ATK_BONUS', 'DEF_BONUS', 'HP_BONUS', 'CRIT', 'BLOCK_RATE', 'CRIT_DMG', 'SPD'],
    confidence: 'confirmed',
  },
  {
    id: 'type',
    code: 'T',
    compatibilityExample: 'Hi-Tech',
    focusStats: ['BLOCK', 'EFFECT_HIT', 'EFFECT_RESIST', 'DMG_REFLECT'],
    transformationStats: ['ATK', 'HP', 'DEF', 'RED_DEF', 'CRIT', 'BLOCK', 'EFFECT_HIT', 'EFFECT_RESIST'],
    purificationStats: [
      range('ATK', 600, 2000, 'flat'), range('DEF', 150, 500, 'flat'), range('HP', 2400, 12000, 'flat'),
      range('ATK_BONUS', 1, 10, 'percent'), range('DEF_BONUS', 1, 10, 'percent'),
      range('HP_BONUS', 1, 10, 'percent'), range('FACTION_DMG_PLUS', 1, 10, 'percent'),
      range('FACTION_DMG_FREE', 1, 10, 'percent'),
    ],
    refineStats: ['ATK_BONUS', 'DEF_BONUS', 'HP_BONUS', 'CRIT_RES_RATE', 'BLOCK', 'DMG_REFLECT'],
    confidence: 'confirmed',
  },
  {
    id: 'level',
    code: 'L',
    compatibilityExample: 'S-Class',
    focusStats: ['SKILL_DMG', 'BONUS_DMG', 'DMG_RATE', 'DMG_FREE'],
    transformationStats: ['ATK', 'HP', 'DEF', 'RED_DEF', 'SKILL_DMG', 'DMG_FREE', 'BONUS_DMG', 'BONUS_DMG_FREE'],
    purificationStats: [
      range('ATK', 600, 2000, 'flat'), range('DEF', 150, 500, 'flat'), range('HP', 2400, 12000, 'flat'),
      range('ATK_BONUS', 1, 10, 'percent'), range('DEF_BONUS', 1, 10, 'percent'),
      range('HP_BONUS', 1, 10, 'percent'), range('ARENA_DMG_PLUS', 1, 10, 'percent'),
      range('ARENA_DMG_FREE', 1, 10, 'percent'),
    ],
    refineStats: ['ATK_BONUS', 'DEF_BONUS', 'HP_BONUS', 'DMG_RATE', 'DMG_FREE'],
    confidence: 'confirmed',
  },
])

export const buffGearSourceAssets = Object.freeze([
  ...['equipcard_1_1', 'equipcard_1_2'].map(id => ({ id, group: 'group1' })),
  ...['equipcard_2_1', 'equipcard_2_2', 'equipcard_2_3', 'equipcard_2_4'].map(id => ({ id, group: 'group2' })),
  ...['equipcard_3_1', 'equipcard_3_2', 'equipcard_3_3', 'equipcard_3_4', 'equipcard_3_5', 'equipcard_3_6', 'equipcard_3_7', 'equipcard_3_8'].map(id => ({ id, group: 'group3' })),
  ...['Item_213002', 'Item_213003'].map(id => ({ id, group: 'items' })),
].map(asset => Object.freeze({
  ...asset,
  optimized: `/Buff Gear/optimized/${asset.id}.webp`,
  semanticAssignment: null,
  confidence: 'partial',
})))
