const option = (id, vi, en = id) => Object.freeze({ id, labels: Object.freeze({ vi, en }) })

export const buffGearCompatibilityAxes = Object.freeze([
  Object.freeze({
    id: 'faction',
    characterField: 'faction',
    defaultCompatibility: 'Hero',
    options: Object.freeze([
      option('Hero', 'Anh Hùng'),
      option('Monster', 'Quái Nhân'),
      option('Martial Artist', 'Võ Thuật'),
      option('Outlaw', 'Tội Phạm'),
      option('Other', 'Khác'),
    ]),
  }),
  Object.freeze({
    id: 'type',
    characterField: 'type',
    defaultCompatibility: 'Duelist',
    options: Object.freeze([
      option('Duelist', 'Vũ Trang'),
      option('Grappler', 'Giác Đấu'),
      option('Esper', 'Tâm Linh'),
      option('Hi-Tech', 'Công Nghệ'),
    ]),
  }),
  Object.freeze({
    id: 'level',
    characterField: 'classLevel',
    defaultCompatibility: 'Class_S',
    options: Object.freeze([
      option('Class_SS', 'Hạng SS', 'Class SS'),
      option('Class_S', 'Hạng S', 'Class S'),
      option('A', 'Hạng A', 'Class A'),
      option('B', 'Hạng B', 'Class B'),
      option('C', 'Hạng C', 'Class C'),
      option('Dragon', 'Cấp Rồng', 'Dragon'),
      option('Demon', 'Cấp Quỷ', 'Demon'),
      option('Tiger', 'Cấp Hổ', 'Tiger'),
      option('Martial_Artist', 'Võ Thuật', 'Martial Artist'),
      option('Outlaw', 'Tội Phạm', 'Outlaw'),
      option('Other', 'Khác', 'Other'),
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

export const createBuffGearMechanicState = () => ({
  cardId: null,
  rarity: 'gold',
  activeMechanic: 'main',
  mainStatId: null,
  transformationRows: Array(5).fill(null),
  transformationLocks: Array(5).fill(false),
  ascensionPreview: false,
  purificationRows: [1, 3, 6, 12].map(milestone => ({ milestone, statId: null, locked: false })),
  transferHelpOpen: false,
  refineStatId: null,
  refineLevel: 0,
  clarifyHelpOpen: false,
})

const createSlotState = axis => ({
  compatibility: axis.defaultCompatibility,
  mechanic: createBuffGearMechanicState(),
})

export const createBuffGearBuilderState = () => ({
  selectedCharacterId: null,
  slots: Object.fromEntries(buffGearCompatibilityAxes.map(axis => [axis.id, createSlotState(axis)])),
  selectedSlotId: 'faction',
})

export const getBuffGearMode = state => state.selectedCharacterId ? 'character' : 'manual'
export const isBuffGearCompatibilityLocked = state => getBuffGearMode(state) === 'character'

const assertKnownCompatibility = (axisId, compatibility) => {
  const axis = buffGearCompatibilityAxisById[axisId]
  if (!axis) throw new Error(`Unknown Buff Gear axis: ${axisId}`)
  if (!buffGearCompatibilityOptionByAxis[axisId][compatibility]) {
    throw new Error(`Unsupported ${axisId} compatibility: ${compatibility}`)
  }
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
    const compatibility = character[axis.characterField]
    assertKnownCompatibility(axis.id, compatibility)
    return [axis.id, compatibility]
  }))

  state.selectedCharacterId = character.id
  for (const axis of buffGearCompatibilityAxes) {
    state.slots[axis.id].compatibility = nextCompatibility[axis.id]
    state.slots[axis.id].mechanic = createBuffGearMechanicState()
  }
  if (!buffGearCompatibilityAxisById[state.selectedSlotId]) state.selectedSlotId = 'faction'
  return state
}

export const clearCharacterFromBuffGearBuilder = (state) => {
  state.selectedCharacterId = null
  return state
}

export const resetUnlockedTransformationRows = (mechanic) => {
  mechanic.transformationRows = mechanic.transformationRows.map((value, index) =>
    mechanic.transformationLocks[index] ? value : null)
  return mechanic
}
