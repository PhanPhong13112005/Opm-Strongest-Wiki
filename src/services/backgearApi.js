import { requestApi } from './apiClient'

const localizedField = (language, englishKey, vietnameseKey, value) => (
  language === 'en' ? { [englishKey]: value } : { [vietnameseKey]: value }
)

const mergeEffect = (effect, language, local = {}) => ({
  ...local,
  type: effect.type,
  text: effect.text,
  ...localizedField(language, 'en', 'vi', effect.name),
})

const mergeGear = (gear, language, local = {}) => ({
  ...local,
  id: gear.id,
  theme: gear.theme,
  levelMax: gear.levelMax,
  icon: gear.icon,
  thumbnail: gear.thumbnail,
  seniorIcon: gear.seniorIcon,
  changeLevel: gear.changeLevel,
  sortOrder: gear.sortOrder,
  updatedAt: gear.updatedAt,
  ...localizedField(language, 'nameEn', 'nameVi', gear.name),
  ...localizedField(language, 'rarity', 'rarityVi', gear.rarity),
  ...localizedField(language, 'acquireEn', 'acquireVi', gear.acquire),
  levels: (gear.levels || []).map((level, index) => ({
    ...(local.levels?.[index] || {}),
    level: level.level,
    senior: level.senior,
    ...localizedField(language, 'costEn', 'costVi', level.cost),
    effects: (level.effects || []).map((effect, effectIndex) => mergeEffect(
      effect,
      language,
      local.levels?.[index]?.effects?.[effectIndex],
    )),
  })),
})

const mergeSet = (set, language, local = {}) => ({
  ...local,
  id: set.id,
  rewardIcon: set.rewardIcon,
  sortOrder: set.sortOrder,
  updatedAt: set.updatedAt,
  ...localizedField(language, 'nameEn', 'nameVi', set.name),
  ...localizedField(language, 'rarity', 'rarityVi', set.rarity),
  ...localizedField(language, 'rewardEn', 'rewardVi', set.reward),
  needs: (set.needs || []).map((need, index) => ({
    ...(local.needs?.[index] || {}),
    id: need.id,
    icon: need.icon,
    count: need.count,
    ...localizedField(language, 'nameEn', 'nameVi', need.name),
  })),
  levels: (set.levels || []).map((level, index) => ({
    ...(local.levels?.[index] || {}),
    setLevel: level.setLevel,
    effects: (level.effects || []).map((effect, effectIndex) => mergeEffect(
      effect,
      language,
      local.levels?.[index]?.effects?.[effectIndex],
    )),
  })),
})

export const getBackgearCatalog = async (language, localCatalog = { gears: [], sets: [] }) => {
  const result = await requestApi('api/backgears', { language })
  const localGears = new Map((localCatalog.gears || []).map(gear => [gear.id, gear]))
  const localSets = new Map((localCatalog.sets || []).map(set => [set.id, set]))

  return {
    gears: (result.gears || []).map(gear => mergeGear(gear, language, localGears.get(gear.id))),
    sets: (result.sets || []).map(set => mergeSet(set, language, localSets.get(set.id))),
  }
}
