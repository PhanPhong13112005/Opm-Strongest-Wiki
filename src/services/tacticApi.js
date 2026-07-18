import { requestApi } from './apiClient'

const localizedField = (language, englishKey, vietnameseKey, value) => (
  language === 'en' ? { [englishKey]: value } : { [vietnameseKey]: value }
)

const mergeScaling = (scaling, language, local = {}) => ({
  ...local,
  metric: scaling.metric,
  statType: scaling.statType,
  unit: scaling.unit,
  summable: scaling.summable,
  ...localizedField(language, 'label_en', 'label_vi', scaling.label),
  rarities: (scaling.rarities || []).map((rarity, index) => ({
    ...(local.rarities?.[index] || {}),
    key: rarity.key,
    quality: rarity.quality,
    tiers: rarity.tiers || [],
    ...localizedField(language, 'name_en', 'name_vi', rarity.name),
  })),
})

const mergeCard = (card, language, local = {}) => ({
  ...local,
  id: card.id,
  icon: card.icon,
  count: card.count,
  sortOrder: card.sortOrder,
  updatedAt: card.updatedAt,
  name: {
    ...(local.name || {}),
    [language]: card.name,
  },
  eff: {
    ...(local.eff || {}),
    [language]: card.effect,
  },
  scaling: mergeScaling(card.scaling || {}, language, local.scaling),
})

const mergeFrame = (frame, local = {}) => ({
  ...local,
  id: frame.id,
  name: frame.name,
  icon: frame.icon,
  hp: frame.hp,
  def: frame.def,
  colorClass: frame.colorClass,
  borderClass: frame.borderClass,
  bgClass: frame.backgroundClass,
  sortOrder: frame.sortOrder,
  updatedAt: frame.updatedAt,
})

export const getTacticCatalog = async (language, localCatalog = { cards: [], frames: [] }) => {
  const result = await requestApi('api/tactics', { language })
  const localCards = new Map((localCatalog.cards || []).map(card => [card.id, card]))
  const localFrames = new Map((localCatalog.frames || []).map(frame => [frame.id, frame]))
  return {
    cards: (result.cards || []).map(card => mergeCard(card, language, localCards.get(card.id))),
    frames: (result.frames || []).map(frame => mergeFrame(frame, localFrames.get(frame.id))),
  }
}
