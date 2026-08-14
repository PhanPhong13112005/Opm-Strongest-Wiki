export const option = (id, vi, en = id) => Object.freeze({ id, labels: Object.freeze({ vi, en }) })

export const buffGearCompatibilityAxes = Object.freeze([
  Object.freeze({
    id: 'faction',
    characterField: 'faction',
    defaultCompatibility: 'Hero',
    options: Object.freeze([
      option('Hero', 'Anh Hùng'),
      option('Monster', 'Quái Nhân'),
    ]),
  }),
  Object.freeze({
    id: 'type',
    characterField: 'type',
    defaultCompatibility: 'Duelist',
    options: Object.freeze([
      option('Duelist', 'Vũ Trang', 'Duelist'),
      option('Grappler', 'Giác Đấu', 'Grappler'),
      option('Hi-Tech', 'Công Nghệ', 'Hi-Tech'),
      option('Esper', 'Tâm Linh', 'Esper'),
    ]),
  }),
  Object.freeze({
    id: 'level',
    characterField: 'classLevel',
    defaultCompatibility: 'Class_S',
    options: Object.freeze([
      option('Class_S', 'Hạng S', 'Class S'),
      option('A', 'Hạng A', 'Class A'),
      option('B', 'Hạng B', 'Class B'),
      option('C', 'Hạng C', 'Class C'),
      option('Dragon', 'Cấp Rồng', 'Dragon'),
      option('Demon', 'Cấp Quỷ', 'Demon'),
      option('Tiger', 'Cấp Hổ', 'Tiger'),
      option('Special', 'Đặc Biệt', 'Special'),
    ]),
  }),
])

export const buffGearCompatibilityAxisById = Object.freeze(Object.fromEntries(
  buffGearCompatibilityAxes.map(axis => [axis.id, axis]),
))

export const buffGearCompatibilityOptionByAxis = Object.freeze(Object.fromEntries(
  buffGearCompatibilityAxes.map(axis => [
    axis.id,
    Object.freeze(Object.fromEntries(axis.options.map(item => [item.id, item]))),
  ]),
))

export const mapCharacterCompatibility = (axisId, rawValue) => {
  if (axisId === 'faction') {
    if (['Hero', 'Martial Artist'].includes(rawValue)) return 'Hero'
    if (['Monster', 'Outlaw', 'Other'].includes(rawValue)) return 'Monster'
    return 'Hero'
  }
  if (axisId === 'level') {
    if (['Class_SS', 'Class_S'].includes(rawValue)) return 'Class_S'
    if (['Martial_Artist', 'Outlaw', 'Other', 'Special'].includes(rawValue)) return 'Special'
    return rawValue || 'Class_S'
  }
  return rawValue || 'Duelist'
}

export const createBuffGearMechanicState = () => ({
  cardId: null,
  rarity: 'gold',
  goldStars: 0,
  purpleStars: 0,
  activeMechanic: 'main',
  mainStatId: null,
  transformClicks: 12,
  transformationRows: Array(5).fill(null),
  transformationLocks: Array(5).fill(false),
  ascensionPreview: false,
  purifyClicks: 12,
  purificationRows: [
    { milestone: 1, statId: null, locked: false },
    { milestone: 3, statId: null, locked: false },
    { milestone: 6, statId: null, locked: false },
    { milestone: 12, statId: null, locked: false },
  ],
  transferHelpOpen: false,
  refineStatId: null,
  refineLevel: 0,
  clarifyHelpOpen: false,
})

export const createBuffGearBuilderState = () => ({
  selectedSlotId: 'faction',
  characterId: null,
  slots: Object.fromEntries(buffGearCompatibilityAxes.map(axis => [
    axis.id,
    {
      compatibility: axis.defaultCompatibility,
      mechanic: createBuffGearMechanicState(),
    },
  ])),
})

export const getBuffGearMode = state => (state?.characterId ? 'character' : 'manual')
export const isBuffGearCompatibilityLocked = state => Boolean(state?.characterId)

const assertKnownCompatibility = (axisId, compatibility) => {
  const axis = buffGearCompatibilityAxisById[axisId]
  if (!axis) throw new Error(`Unknown Buff Gear axis: ${axisId}`)
  const exists = axis.options.some(item => item.id === compatibility)
  if (!exists) throw new Error(`Unsupported ${axisId} compatibility: ${compatibility}`)
  return axis
}

export const setManualBuffGearCompatibility = (state, axisId, compatibility) => {
  assertKnownCompatibility(axisId, compatibility)
  if (isBuffGearCompatibilityLocked(state)) return false
  const slot = state.slots[axisId]
  if (slot.compatibility === compatibility) return true
  slot.compatibility = compatibility
  slot.mechanic = createBuffGearMechanicState()
  return true
}

export const applyCharacterToBuffGearBuilder = (state, character) => {
  if (!character?.id) throw new Error('A character ID is required')
  const nextCompatibility = Object.fromEntries(buffGearCompatibilityAxes.map(axis => {
    const rawValue = character[axis.characterField]
    const compatibility = mapCharacterCompatibility(axis.id, rawValue)
    assertKnownCompatibility(axis.id, compatibility)
    return [axis.id, compatibility]
  }))

  state.characterId = character.id
  for (const [axisId, compatibility] of Object.entries(nextCompatibility)) {
    state.slots[axisId].compatibility = compatibility
    state.slots[axisId].mechanic = createBuffGearMechanicState()
  }
}

export const clearCharacterFromBuffGearBuilder = (state) => {
  state.characterId = null
}

export const resetUnlockedTransformationRows = (mechanic) => {
  mechanic.transformationRows = mechanic.transformationRows.map((statId, index) => (
    mechanic.transformationLocks[index] ? statId : null
  ))
}
