<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  applyCharacterToBuffGearBuilder,
  buffGearCompatibilityAxes,
  buffGearCompatibilityOptionByAxis,
  clearCharacterFromBuffGearBuilder,
  createBuffGearBuilderState,
  getBuffGearMode,
  isBuffGearCompatibilityLocked,
  resetUnlockedTransformationRows,
  setManualBuffGearCompatibility,
} from '../../data/buffGear/builder.js'
import { buffGearSlots } from '../../data/buffGear/slots.js'
import { buffGearProgression, buffGearStructure } from '../../data/buffGear/progression.js'
import { buffGearTermById } from '../../data/buffGear/terminology.js'
import { buffGearWorkbenchLocale } from '../../data/buffGear/workbenchLocale.js'
import {
  buffGearMaterialVisuals,
  getBuffGearCompatibilityVisual,
} from '../../data/buffGear/visuals.js'
import {
  BUFF_GEAR_MAX_STARS,
  buffGearGoldStarCosts,
  buffGearPurpleStarCosts,
  getBuffGearLoadoutCost,
  getBuffGearMainStatValue,
  getBuffGearMechanicCost,
  setBuffGearGoldStars,
  setBuffGearPurpleStars,
} from '../../data/buffGear/simulator.js'

const emit = defineEmits(['open-skills'])
const { locale, t, mergeLocaleMessage } = useI18n()
for (const [language, messages] of Object.entries(buffGearWorkbenchLocale)) {
  mergeLocaleMessage(language, { buffGear: { workbench: messages } })
}

const state = reactive(createBuffGearBuilderState())
const selectedCharacter = ref(null)
const characterOptions = ref([])
const characterSearch = ref('')
const characterPickerOpen = ref(false)
const characterLoading = ref(false)
const characterLoadError = ref(false)

const mode = computed(() => getBuffGearMode(state))
const characterMode = computed(() => mode.value === 'character')
const compatibilityLocked = computed(() => isBuffGearCompatibilityLocked(state))
const selectedSlot = computed(() => state.slots[state.selectedSlotId])
const selectedSlotData = computed(() => buffGearSlots.find(slot => slot.id === state.selectedSlotId))
const selectedMechanic = computed(() => selectedSlot.value.mechanic)
const advanceStage = buffGearProgression.find(stage => stage.id === 'advance')
const purificationStage = buffGearProgression.find(stage => stage.id === 'purification')
const refineStage = buffGearProgression.find(stage => stage.id === 'refine')
const mechanicIds = ['main', 'transformation', 'ascension', 'advance', 'purification', 'transfer', 'refine', 'clarify']
const goldMechanicIds = ['main', 'transformation', 'ascension', 'advance']
const redMechanicIds = ['purification', 'transfer', 'refine', 'clarify']

const activeRarityTab = computed(() => {
  return selectedMechanic.value.rarity === 'red' ? 'red' : 'gold'
})

const currentMechanicTabs = computed(() => {
  return activeRarityTab.value === 'red' ? redMechanicIds : goldMechanicIds
})

const selectRarityTab = (rarity) => {
  previewRarity(rarity)
  if (rarity === 'gold') {
    if (!goldMechanicIds.includes(selectedMechanic.value.activeMechanic)) {
      setSelectedMechanic('main')
    }
  } else {
    if (!redMechanicIds.includes(selectedMechanic.value.activeMechanic)) {
      setSelectedMechanic('purification')
    }
  }
}

const mainStatOptions = [
  { id: 'ATK_BONUS', labelVi: '% Tấn công (ATK %)', labelEn: 'ATK %', shortVi: 'Tấn công %', shortEn: 'ATK %' },
  { id: 'HP_BONUS', labelVi: '% Máu (HP %)', labelEn: 'HP %', shortVi: 'Máu %', shortEn: 'HP %' },
  { id: 'DEF_BONUS', labelVi: '% Phòng thủ (DEF %)', labelEn: 'DEF %', shortVi: 'Phòng thủ %', shortEn: 'DEF %' },
]

const normalizeMainStatId = id => {
  if (['ATK', 'ATK_BONUS'].includes(id)) return 'ATK_BONUS'
  if (['DEF', 'DEF_BONUS'].includes(id)) return 'DEF_BONUS'
  return 'HP_BONUS'
}

const defaultMainStat = axisId => {
  if (axisId === 'faction') return 'HP_BONUS'
  if (axisId === 'type') return 'ATK_BONUS'
  return 'DEF_BONUS'
}

const currentMainStatId = computed({
  get: () => normalizeMainStatId(selectedMechanic.value.mainStatId || defaultMainStat(state.selectedSlotId)),
  set: (val) => {
    selectedMechanic.value.mainStatId = val
  },
})

const getSlotMainStat = axisId => {
  const mech = state.slots[axisId]?.mechanic
  if (!mech) return '+0%'
  const val = getBuffGearMainStatValue(mech)
  const statId = normalizeMainStatId(mech.mainStatId || defaultMainStat(axisId))
  const option = mainStatOptions.find(item => item.id === statId)
  const name = locale.value === 'vi' ? option?.shortVi : option?.shortEn
  return `${name} +${val}%`
}

const slotVisual = axisId => getBuffGearCompatibilityVisual(axisId, state.slots[axisId].compatibility)
const selectedSlotVisual = computed(() => slotVisual(state.selectedSlotId))
const mainStatValue = computed(() => getBuffGearMainStatValue(selectedMechanic.value))

const calculateSlotCost = (mechanic, slotId = 'faction') => {
  if (!mechanic) return {}
  let gold = 0
  let ascensionCards = 0
  let crystalS = 0
  let crystalCore = 0
  let refinementCards = 0
  let transformComponents = 0
  let transformCards = 0
  let transformDiamonds = 0
  let advanceCards = 0
  let componentBoxes = 0
  let purifyPrisms = 0
  let purifyBlues = 0

  // 1. Ascension (Gold Stars)
  const stars = mechanic.goldStars || 0
  for (let s = 1; s <= stars; s++) {
    const cost = buffGearGoldStarCosts[s]
    if (cost) {
      gold += cost.gold || 0
      ascensionCards += cost.ascensionCards || 0
      crystalS += cost.crystalS || 0
      crystalCore += cost.crystalCore || 0
    }
  }

  // 2. Refine (Purple Stars / Tinh Luyện)
  const purple = mechanic.purpleStars || 0
  for (let p = 1; p <= purple; p++) {
    const cost = buffGearPurpleStarCosts[p]
    if (cost) {
      gold += cost.gold || 0
      refinementCards += cost.refinementCards || 0
    }
  }

  // 3. Transformation (Chuyển Hóa)
  let clicks = mechanic.transformClicks ?? 0
  if (clicks === 0 && mechanic.transformationRows) {
    const activeLevels = (mechanic.transformationLevels || []).slice(0, 5)
    const levelSum = activeLevels.reduce((acc, lvl, idx) => acc + (mechanic.transformationRows[idx] ? (lvl || 0) : 0), 0)
    if (levelSum > 0) {
      clicks = levelSum
    }
  }

  if (clicks > 0) {
    for (let c = 0; c < clicks; c++) {
      transformComponents += 32 + c * 16
      transformCards += 8 + c * 4
      gold += 25000
    }
  }

  // Transform Diamond Resets
  const resetCount = mechanic.transformResetCount || 0
  for (let r = 0; r < resetCount; r++) {
    if (r === 0) transformDiamonds += 54
    else if (r === 1) transformDiamonds += 120
    else if (r === 2) transformDiamonds += 240
    else transformDiamonds += 540
  }

  // 4. Advance to Red
  if (mechanic.rarity === 'red') {
    advanceCards += 35
    componentBoxes += 80
    gold += 100000
  }

  // 5. Purification (Thanh Tẩy)
  const pClicks = mechanic.purifyClicks ?? 0
  if (pClicks > 0 && mechanic.rarity === 'red') {
    purifyPrisms += pClicks * 7
    purifyBlues += pClicks * 10
    gold += pClicks * 10000
  }

  return {
    gold,
    ascensionCards,
    crystalS,
    crystalCore,
    refinementCards,
    transformComponents,
    transformCards,
    transformDiamonds,
    advanceCards,
    componentBoxes,
    purifyPrisms,
    purifyBlues,
  }
}

const slotCost = computed(() => calculateSlotCost(selectedMechanic.value, state.selectedSlotId))

const slotGoldStarCost = computed(() => {
  let gold = 0, ascensionCards = 0, crystalS = 0, crystalCore = 0
  const stars = selectedMechanic.value.goldStars || 0
  for (let s = 1; s <= stars; s++) {
    const cost = buffGearGoldStarCosts[s]
    if (cost) {
      gold += cost.gold || 0
      ascensionCards += cost.ascensionCards || 0
      crystalS += cost.crystalS || 0
      crystalCore += cost.crystalCore || 0
    }
  }
  return { gold, ascensionCards, crystalS, crystalCore }
})

const loadoutCost = computed(() => {
  const total = {
    gold: 0,
    ascensionCards: 0,
    crystalS: 0,
    crystalCore: 0,
    refinementCards: 0,
    transformComponents: 0,
    transformCards: 0,
    transformDiamonds: 0,
    advanceCards: 0,
    componentBoxes: 0,
    purifyPrisms: 0,
    purifyBlues: 0,
  }
  for (const [axisId, slot] of Object.entries(state.slots)) {
    const cost = calculateSlotCost(slot.mechanic, axisId)
    for (const [key, val] of Object.entries(cost)) {
      total[key] = (total[key] || 0) + (val || 0)
    }
  }
  return total
})

const statLabel = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'vi' : 'en'] || id
const statHelp = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'explanationVi' : 'explanationEn'] || ''

const normalizeSearch = value => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')

const filteredCharacters = computed(() => {
  const query = normalizeSearch(characterSearch.value.trim())
  if (!query) return characterOptions.value
  return characterOptions.value.filter(character => normalizeSearch([
    character.nameVi,
    character.nameEn,
    character.id,
    character.tier,
  ].join(' ')).includes(query))
})

const compatibilityLabel = (axisId, compatibility) => {
  const item = buffGearCompatibilityOptionByAxis[axisId]?.[compatibility]
  return item?.labels?.[locale.value] || item?.labels?.en || compatibility
}

const characterCompatibilityLabel = (axisId, character) => {
  const value = character?.[buffGearCompatibilityAxes.find(item => item.id === axisId)?.characterField]
  return compatibilityLabel(axisId, value)
}

const selectedCharacterName = computed(() => {
  if (!selectedCharacter.value) return ''
  return locale.value === 'vi' ? selectedCharacter.value.nameVi : selectedCharacter.value.nameEn
})

const loadCharacters = async () => {
  if (characterOptions.value.length || characterLoading.value) return
  characterLoading.value = true
  characterLoadError.value = false
  try {
    const [{ default: charactersVi }, { default: charactersEn }] = await Promise.all([
      import('../../data/characters.json'),
      import('../../data/characters_en.json'),
    ])
    const vietnameseById = new Map(charactersVi.map(character => [character.id, character]))
    characterOptions.value = charactersEn.map((character) => {
      const vietnamese = vietnameseById.get(character.id) || {}
      return {
        id: character.id,
        nameEn: character.name,
        nameVi: vietnamese.name || character.name,
        imageURL: vietnamese.imageURL || character.imageURL,
        tier: character.tier,
        faction: character.faction,
        type: character.type,
        classLevel: character.classLevel,
      }
    })
  } catch {
    characterLoadError.value = true
  } finally {
    characterLoading.value = false
  }
}

const openCharacterPicker = async () => {
  characterPickerOpen.value = true
  characterSearch.value = ''
  await loadCharacters()
}

const chooseCharacter = (character) => {
  applyCharacterToBuffGearBuilder(state, character)
  selectedCharacter.value = character
  characterPickerOpen.value = false
}

const clearCharacter = () => {
  clearCharacterFromBuffGearBuilder(state)
  selectedCharacter.value = null
}

const updateManualCompatibility = (axisId, value) => {
  setManualBuffGearCompatibility(state, axisId, value)
}

const setSelectedMechanic = mechanicId => {
  selectedMechanic.value.activeMechanic = mechanicId
}

const transformationCount = statId => selectedMechanic.value.transformationRows
  .filter(value => value === statId).length

const updateTransformationRow = (index, statId) => {
  const current = selectedMechanic.value.transformationRows[index]
  if (statId && statId !== current && transformationCount(statId) >= buffGearStructure.identicalBonusStatLimit) return
  selectedMechanic.value.transformationRows[index] = statId || null
  if (!statId) {
    selectedMechanic.value.transformationLocks[index] = false
    if (selectedMechanic.value.transformationLevels) {
      selectedMechanic.value.transformationLevels[index] = 0
    }
  } else {
    if (!selectedMechanic.value.transformationLevels) {
      selectedMechanic.value.transformationLevels = [0, 0, 0, 0, 0]
    }
    if ((selectedMechanic.value.transformationLevels[index] || 0) === 0) {
      selectedMechanic.value.transformationLevels[index] = 1
    }
  }
}

const toggleTransformationLock = (index) => {
  const mechanic = selectedMechanic.value
  if (!mechanic.transformationRows[index]) return
  const lockedCount = mechanic.transformationLocks.filter(Boolean).length
  if (!mechanic.transformationLocks[index] && lockedCount >= buffGearStructure.resetLockLimit) return
  mechanic.transformationLocks[index] = !mechanic.transformationLocks[index]
}

const setGoldStars = (star) => {
  setBuffGearGoldStars(selectedMechanic.value, star)
}

const setPurpleStars = (star) => {
  if ((selectedMechanic.value.goldStars || 0) < star) {
    selectedMechanic.value.goldStars = star
  }
  setBuffGearPurpleStars(selectedMechanic.value, star)
  if (!selectedMechanic.value.refineStatId && selectedSlotData.value.refineStats.length > 0) {
    selectedMechanic.value.refineStatId = selectedSlotData.value.refineStats[0]
  }
}

const levelUpGoldStar = () => {
  const current = selectedMechanic.value.goldStars || 0
  if (current < BUFF_GEAR_MAX_STARS) {
    setBuffGearGoldStars(selectedMechanic.value, current + 1)
  }
}

const maxGoldStars = () => {
  setBuffGearGoldStars(selectedMechanic.value, BUFF_GEAR_MAX_STARS)
}

const resetGoldStars = () => {
  setBuffGearGoldStars(selectedMechanic.value, 0)
}

const maxRefineLevel = () => {
  if ((selectedMechanic.value.goldStars || 0) < 6) {
    selectedMechanic.value.goldStars = 6
  }
  setBuffGearPurpleStars(selectedMechanic.value, 6)
  if (!selectedMechanic.value.refineStatId && selectedSlotData.value.refineStats.length > 0) {
    selectedMechanic.value.refineStatId = selectedSlotData.value.refineStats[0]
  }
}

const resetRefineLevel = () => {
  setBuffGearPurpleStars(selectedMechanic.value, 0)
}

const TRANSFORM_MILESTONES = [1, 3, 6, 12]

const isTransformUnlocked = (index) => {
  return (selectedMechanic.value.transformClicks ?? 12) >= (TRANSFORM_MILESTONES[index] || 1)
}

const isPurifyUnlocked = (index) => {
  return (selectedMechanic.value.purifyClicks ?? 12) >= (TRANSFORM_MILESTONES[index] || 1)
}

// Transform (Chuyển Hóa): Stat Value Formatting based on Level (1..6)
const formatTransformStatValue = (statId, level = 0) => {
  if (!statId || level <= 0) return '--'
  const lvl = Math.max(1, Math.min(6, level))
  if (statId === 'ATK') return `+${300 * lvl}`
  if (statId === 'HP') return `+${1800 * lvl}`
  if (statId === 'DEF') return `+${50 * lvl}`
  if (statId === 'RED_DEF') return `+${300 * lvl}`
  return `+${2 * lvl}%`
}

const getTransformLevel = (index) => {
  if (!selectedMechanic.value.transformationLevels) {
    selectedMechanic.value.transformationLevels = [0, 0, 0, 0, 0]
  }
  const hasStat = Boolean(selectedMechanic.value.transformationRows[index])
  if (!hasStat) return 0
  return selectedMechanic.value.transformationLevels[index] || 1
}

const setTransformLevel = (index, level) => {
  if (!selectedMechanic.value.transformationLevels) {
    selectedMechanic.value.transformationLevels = [0, 0, 0, 0, 0]
  }
  if (!selectedMechanic.value.transformationRows[index] && level > 0) {
    const pool = selectedSlotData.value.transformationStats || []
    selectedMechanic.value.transformationRows[index] = pool[index % pool.length]
  }
  selectedMechanic.value.transformationLevels[index] = Math.max(0, Math.min(6, level))
}

// Chuyển Hóa (Transform - Thẻ Vàng): Mặc định 32 (+16 mỗi nhấp), Phải: 8 (+4 mỗi nhấp)
const nextTransformLeftCost = computed(() => {
  const clicks = selectedMechanic.value.transformClicks ?? 0
  return 32 + clicks * 16
})

const nextTransformRightCost = computed(() => {
  const clicks = selectedMechanic.value.transformClicks ?? 0
  return 8 + clicks * 4
})

// Transform Reset Diamond Costs: Lần 1: 54, Lần 2: 120, Lần 3: 240, Lần 4+: 540
const transformResetDiamondCost = computed(() => {
  const count = selectedMechanic.value.transformResetCount || 0
  if (count === 0) return 54
  if (count === 1) return 120
  if (count === 2) return 240
  return 540
})

const isTransforming = ref(false)
const transformFeedbackMsg = ref('')

const doResetTransformation = () => {
  const currentCost = transformResetDiamondCost.value
  selectedMechanic.value.transformationRows = [null, null, null, null, null]
  selectedMechanic.value.transformationLevels = [0, 0, 0, 0, 0]
  selectedMechanic.value.transformationLocks = [false, false, false, false, false]
  selectedMechanic.value.transformClicks = 0
  selectedMechanic.value.transformResetCount = (selectedMechanic.value.transformResetCount || 0) + 1
  transformFeedbackMsg.value = `✓ Đã Reset Chuyển Hóa! Tiêu hao ${currentCost} 💎 Kim Cương. (Lần reset tiếp theo: ${transformResetDiamondCost.value} 💎)`
  setTimeout(() => {
    transformFeedbackMsg.value = ''
  }, 4000)
}

const rollTransformationStats = () => {
  isTransforming.value = true
  if (typeof selectedMechanic.value.transformClicks !== 'number') {
    selectedMechanic.value.transformClicks = 0
  }
  selectedMechanic.value.transformClicks++

  const pool = selectedSlotData.value.transformationStats || []
  if (pool.length === 0) {
    isTransforming.value = false
    return
  }

  if (!selectedMechanic.value.transformationLevels) {
    selectedMechanic.value.transformationLevels = [0, 0, 0, 0, 0]
  }

  setTimeout(() => {
    const rows = selectedMechanic.value.transformationRows
    const levels = selectedMechanic.value.transformationLevels

    // Find non-empty rows and empty rows
    const emptyIndices = []
    const upgradableIndices = []

    for (let i = 0; i < 5; i++) {
      if (!rows[i]) {
        emptyIndices.push(i)
      } else if ((levels[i] || 0) < 6) {
        upgradableIndices.push(i)
      }
    }

    let actionMsg = ''

    // If all 5 rows are at 6/6
    if (emptyIndices.length === 0 && upgradableIndices.length === 0) {
      transformFeedbackMsg.value = `🏆 Đã đạt cấp tối đa (6/6) cho toàn bộ 5 dòng!`
      isTransforming.value = false
      return
    }

    // Progression rule:
    // If no rows exist -> Unlock first row
    if (rows.filter(Boolean).length === 0) {
      const nextIdx = 0
      const available = pool.filter(st => transformationCount(st) < buffGearStructure.identicalBonusStatLimit)
      const picked = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[0]
      rows[nextIdx] = picked
      levels[nextIdx] = 1
      actionMsg = `✨ Nhận dòng mới: ${statLabel(picked)} (Cấp 1/6)!`
    } else {
      // Decide whether to unlock next row or upgrade existing row
      const shouldUnlockNew = emptyIndices.length > 0 && (
        upgradableIndices.length === 0 ||
        (levels[rows.filter(Boolean).length - 1] >= 2 && Math.random() < 0.45)
      )

      if (shouldUnlockNew) {
        const nextIdx = emptyIndices[0]
        const available = pool.filter(st => transformationCount(st) < buffGearStructure.identicalBonusStatLimit)
        const picked = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[0]
        rows[nextIdx] = picked
        levels[nextIdx] = 1
        actionMsg = `✨ Mở thêm dòng 0${nextIdx + 1}: ${statLabel(picked)} (Cấp 1/6)!`
      } else if (upgradableIndices.length > 0) {
        const targetIdx = upgradableIndices[upgradableIndices.length - 1]
        levels[targetIdx] = Math.min(6, (levels[targetIdx] || 0) + 1)
        actionMsg = `⭐ Nâng cấp dòng 0${targetIdx + 1} (${statLabel(rows[targetIdx])}) lên Cấp ${levels[targetIdx]}/6!`
      }
    }

    isTransforming.value = false
    transformFeedbackMsg.value = `🎉 ${actionMsg} (Nhấp lần ${selectedMechanic.value.transformClicks})`
    setTimeout(() => {
      transformFeedbackMsg.value = ''
    }, 4000)
  }, 250)
}

// Purification (Thanh Tẩy - Thẻ Đỏ): Mặc định Trái 7, Phải 10, Vàng 10000
const purifyFeedbackMsg = ref('')
const isPurifying = ref(false)

const rollPurificationStats = () => {
  isPurifying.value = true
  if (typeof selectedMechanic.value.purifyClicks !== 'number') {
    selectedMechanic.value.purifyClicks = 0
  }
  selectedMechanic.value.purifyClicks++

  const pool = selectedSlotData.value.purificationStats || []
  if (pool.length === 0) {
    isPurifying.value = false
    return
  }

  setTimeout(() => {
    selectedMechanic.value.purificationRows.forEach((row, idx) => {
      const milestone = row.milestone || TRANSFORM_MILESTONES[idx]
      if ((selectedMechanic.value.purifyClicks || 0) >= milestone) {
        if (!row.locked) {
          const picked = pool[Math.floor(Math.random() * pool.length)]
          row.statId = picked.id
          if (picked.unit === 'percent') {
            const val = (Math.random() * (picked.max - picked.min) + picked.min).toFixed(2)
            row.rolledValue = `+${val}%`
          } else {
            const val = Math.floor(Math.random() * (picked.max - picked.min) + picked.min)
            row.rolledValue = `+${val}`
          }
        }
      }
    })
    isPurifying.value = false
    purifyFeedbackMsg.value = `🎉 Thanh Tẩy thành công! (Lần nhấp thứ ${selectedMechanic.value.purifyClicks})`
    setTimeout(() => {
      purifyFeedbackMsg.value = ''
    }, 3500)
  }, 300)
}

const setPurifyClicks = (count) => {
  selectedMechanic.value.purifyClicks = count
  const pool = selectedSlotData.value.purificationStats || []
  selectedMechanic.value.purificationRows.forEach((row, idx) => {
    const milestone = row.milestone || TRANSFORM_MILESTONES[idx]
    if (count >= milestone && !row.statId && pool.length > 0) {
      const picked = pool[idx % pool.length]
      row.statId = picked.id
      if (picked.unit === 'percent') {
        const val = ((picked.max + picked.min) / 2).toFixed(2)
        row.rolledValue = `+${val}%`
      } else {
        const val = Math.floor((picked.max + picked.min) / 2)
        row.rolledValue = `+${val}`
      }
    }
  })
}

const quickMaxTransformation = () => {
  const pool = selectedSlotData.value.transformationStats || []
  if (pool.length === 0) return
  if (!selectedMechanic.value.transformationLevels) {
    selectedMechanic.value.transformationLevels = [0, 0, 0, 0, 0]
  }
  const pickedList = []
  for (let i = 0; i < 5; i++) {
    if (!selectedMechanic.value.transformationLocks[i] || !selectedMechanic.value.transformationRows[i]) {
      const available = pool.filter(st => {
        const count = pickedList.filter(s => s === st).length
        return count < buffGearStructure.identicalBonusStatLimit
      })
      const chosen = available.length > 0 ? available[i % available.length] : pool[0]
      selectedMechanic.value.transformationRows[i] = chosen
      pickedList.push(chosen)
    } else {
      pickedList.push(selectedMechanic.value.transformationRows[i])
    }
    selectedMechanic.value.transformationLevels[i] = 6
  }
  selectedMechanic.value.transformClicks = Math.max(selectedMechanic.value.transformClicks ?? 0, 30)
  transformFeedbackMsg.value = '⚡ Đã Nâng Cấp Nhanh: 5 Dòng Đạt Cấp 6/6 Tối Đa!'
  setTimeout(() => { transformFeedbackMsg.value = '' }, 3500)
}

const quickMaxPurification = () => {
  selectedMechanic.value.purifyClicks = 12
  const pool = selectedSlotData.value.purificationStats || []
  if (pool.length === 0) return
  selectedMechanic.value.purificationRows.forEach((row, index) => {
    if (!row.locked || !row.statId) {
      const item = pool[index % pool.length]
      row.statId = item.id
      row.rolledValue = item.unit === 'percent'
        ? `+${item.max.toFixed(2)}%`
        : `+${item.max.toLocaleString('vi-VN')}`
    }
  })
  purifyFeedbackMsg.value = '⚡ Đã mở Full 4 Ô Thanh Tẩy & Đặt Chỉ Số Cực Phẩm!'
  setTimeout(() => { purifyFeedbackMsg.value = '' }, 3500)
}

const quickMaxEntireCard = () => {
  setBuffGearGoldStars(selectedMechanic.value, BUFF_GEAR_MAX_STARS)
  quickMaxTransformation()
  if (selectedMechanic.value.rarity === 'red') {
    setBuffGearPurpleStars(selectedMechanic.value, 6)
    if (!selectedMechanic.value.refineStatId && selectedSlotData.value.refineStats.length > 0) {
      selectedMechanic.value.refineStatId = selectedSlotData.value.refineStats[0]
    }
    quickMaxPurification()
  }
}

const previewRarity = rarity => {
  selectedMechanic.value.rarity = rarity
  if (rarity === 'gold') {
    selectedMechanic.value.purificationRows.forEach((row) => {
      row.statId = null
      row.locked = false
    })
    selectedMechanic.value.refineStatId = null
    selectedMechanic.value.refineLevel = 0
  }
}

const updatePurificationRow = (index, statId) => {
  selectedMechanic.value.purificationRows[index].statId = statId || null
  if (!statId) selectedMechanic.value.purificationRows[index].locked = false
}

const togglePurificationLock = index => {
  const row = selectedMechanic.value.purificationRows[index]
  if (row.statId) row.locked = !row.locked
}

// Transfer (Chuyển 1 chỉ số) interactive state
const selectedLeftTransferRow = ref(null) // 0: skill, 1..3: stats
const selectedRightTransferRow = ref(null) // 0: skill, 1..3: stats
const sourcePurificationSkill = ref('Low HP Ignition')
const targetPurificationSkill = ref('Chưa có kỹ năng')
const targetPurificationRows = ref([
  { milestone: 1, statId: null },
  { milestone: 3, statId: null },
  { milestone: 6, statId: null },
  { milestone: 12, statId: null },
])
const transferSuccessMsg = ref('')

const selectLeftTransferRow = idx => {
  selectedLeftTransferRow.value = selectedLeftTransferRow.value === idx ? null : idx
  transferSuccessMsg.value = ''
}

const selectRightTransferRow = idx => {
  selectedRightTransferRow.value = selectedRightTransferRow.value === idx ? null : idx
  transferSuccessMsg.value = ''
}

const doTransferStats = () => {
  let leftIdx = selectedLeftTransferRow.value
  let rightIdx = selectedRightTransferRow.value

  // If none selected, default to Row 1 on both sides
  if (leftIdx === null && rightIdx === null) {
    leftIdx = 1
    rightIdx = 1
  } else if (leftIdx === null) {
    leftIdx = rightIdx
  } else if (rightIdx === null) {
    rightIdx = leftIdx
  }

  // Ensure source has stat if empty
  if (leftIdx > 0) {
    const srcRow = selectedMechanic.value.purificationRows[leftIdx - 1]
    if (!srcRow.statId) {
      const statsList = selectedSlotData.value.purificationStats || []
      srcRow.statId = statsList[leftIdx - 1]?.id || 'ATK'
    }
  }

  if (leftIdx === 0 && rightIdx === 0) {
    const temp = sourcePurificationSkill.value
    sourcePurificationSkill.value = targetPurificationSkill.value || 'Chưa có kỹ năng'
    targetPurificationSkill.value = temp
    transferSuccessMsg.value = `✓ Đã chuyển đổi Kỹ Năng đặc biệt giữa 2 thẻ!`
  } else if (leftIdx > 0 && rightIdx > 0) {
    const srcRow = selectedMechanic.value.purificationRows[leftIdx - 1]
    const tgtRow = targetPurificationRows.value[rightIdx - 1]
    const temp = srcRow.statId
    srcRow.statId = tgtRow.statId
    tgtRow.statId = temp
    transferSuccessMsg.value = `✓ Đã chuyển dòng ${leftIdx} (bên trái) ⇆ dòng ${rightIdx} (bên phải)!`
  } else {
    transferSuccessMsg.value = `⚠️ Hãy chọn cùng loại (Kỹ năng với Kỹ năng, hoặc Dòng chỉ số với Dòng chỉ số)!`
    return
  }

  selectedLeftTransferRow.value = null
  selectedRightTransferRow.value = null
  setTimeout(() => {
    transferSuccessMsg.value = ''
  }, 4000)
}

// Refine (Tinh Luyện) level up state
const refineUpgradeSuccessMsg = ref('')

const nextRefineCost = computed(() => {
  const curLvl = selectedMechanic.value.refineLevel || 0
  if (curLvl >= 6) return null
  return buffGearPurpleStarCosts[curLvl + 1] || null
})

const canLevelUpRefine = computed(() => {
  const curLvl = selectedMechanic.value.refineLevel || 0
  return curLvl < 6
})

const doLevelUpRefine = () => {
  const curLvl = selectedMechanic.value.refineLevel || 0
  if (curLvl >= 6) return

  const nextLvl = curLvl + 1
  if (selectedMechanic.value.goldStars < nextLvl) {
    selectedMechanic.value.goldStars = nextLvl
  }
  setBuffGearPurpleStars(selectedMechanic.value, nextLvl)

  if (!selectedMechanic.value.refineStatId && selectedSlotData.value.refineStats.length > 0) {
    selectedMechanic.value.refineStatId = selectedSlotData.value.refineStats[0]
  }

  refineUpgradeSuccessMsg.value = `🎉 Tinh Luyện thành công lên Cấp ${nextLvl} (★ ${nextLvl} Tím)!`
  setTimeout(() => {
    refineUpgradeSuccessMsg.value = ''
  }, 4000)
}

// Clarify (Đổi chỉ số chính) interactive state
const clarifyUsedCount = ref(0)
const clarifyFeedbackMsg = ref('')
const isClarifyRolling = ref(false)

const doClarifyRoll = () => {
  isClarifyRolling.value = true
  clarifyUsedCount.value++

  const pool = selectedSlotData.value.refineStats || []
  if (pool.length === 0) {
    isClarifyRolling.value = false
    return
  }

  const currentStat = selectedMechanic.value.refineStatId
  const candidatePool = pool.filter(s => s !== currentStat)
  const newStat = candidatePool.length > 0
    ? candidatePool[Math.floor(Math.random() * candidatePool.length)]
    : pool[Math.floor(Math.random() * pool.length)]

  setTimeout(() => {
    selectedMechanic.value.refineStatId = newStat
    if (!selectedMechanic.value.refineLevel) {
      selectedMechanic.value.refineLevel = 1
    }
    isClarifyRolling.value = false
    clarifyFeedbackMsg.value = `🎉 Đã đổi sang chỉ số mới: ${statLabel(newStat)}!`
    setTimeout(() => {
      clarifyFeedbackMsg.value = ''
    }, 4000)
  }, 350)
}

const quickClarifyMultiple = (times = 5) => {
  isClarifyRolling.value = true
  clarifyUsedCount.value += times
  const pool = selectedSlotData.value.refineStats || []
  if (pool.length === 0) {
    isClarifyRolling.value = false
    return
  }
  const currentStat = selectedMechanic.value.refineStatId
  const candidatePool = pool.filter(s => s !== currentStat)
  const newStat = candidatePool.length > 0
    ? candidatePool[Math.floor(Math.random() * candidatePool.length)]
    : pool[Math.floor(Math.random() * pool.length)]

  setTimeout(() => {
    selectedMechanic.value.refineStatId = newStat
    if (!selectedMechanic.value.refineLevel) {
      selectedMechanic.value.refineLevel = 1
    }
    isClarifyRolling.value = false
    clarifyFeedbackMsg.value = `🎉 Đã đổi nhanh ×${times} lần! Nhận dòng mới: ${statLabel(newStat)}`
    setTimeout(() => {
      clarifyFeedbackMsg.value = ''
    }, 4000)
  }, 350)
}
</script>

<template>
  <section class="buff-workbench" data-testid="buff-gear-workbench">
    <!-- Top Header -->
    <header class="wb-header">
      <div class="wb-header-left">
        <div class="wb-header-badge">{{ characterMode ? '⚔' : '⛭' }}</div>
        <div class="wb-header-titles">
          <span>{{ t(`buffGear.workbench.mode.${mode}.badge`) }}</span>
          <h2>{{ t(`buffGear.workbench.mode.${mode}.title`) }}</h2>
        </div>
      </div>
      <div class="wb-header-actions">
        <button type="button" class="btn-hero-action" @click="openCharacterPicker">
          <span>{{ characterMode ? '✎' : '+' }}</span>
          {{ t(characterMode ? 'buffGear.workbench.character.change' : 'buffGear.workbench.character.choose') }}
        </button>
        <button v-if="characterMode" type="button" class="btn-clear-action" @click="clearCharacter">
          {{ t('buffGear.workbench.character.clear') }}
        </button>
      </div>
    </header>

    <!-- Main Two-Column Layout -->
    <div class="wb-grid">
      <!-- LEFT COLUMN: Profile + Compat Strip + Inspector -->
      <div class="wb-col-left">
        <!-- Hero Compact Profile Card -->
        <div v-if="selectedCharacter" class="hero-compact-box" role="button" tabindex="0" @click="openCharacterPicker">
          <img v-if="selectedCharacter.imageURL" :src="selectedCharacter.imageURL" :alt="selectedCharacterName" class="hero-compact-avatar">
          <div class="hero-compact-details">
            <strong>{{ selectedCharacterName }}</strong>
            <span>{{ selectedCharacter.tier }} · {{ selectedCharacter.faction }} · {{ selectedCharacter.type }}</span>
          </div>
        </div>
        <div v-else class="hero-compact-box" role="button" tabindex="0" @click="openCharacterPicker">
          <div class="hero-compact-empty">+</div>
          <div class="hero-compact-details">
            <strong>{{ t('buffGear.workbench.character.none') }}</strong>
            <span>{{ t('buffGear.workbench.character.noneHint') }}</span>
          </div>
        </div>

        <!-- 3 Compatibility Selectors (Compact Strip) -->
        <div class="compat-strip">
          <div v-for="axis in buffGearCompatibilityAxes" :key="axis.id" class="compat-strip-item">
            <div class="compat-strip-header">
              <b>{{ t(`buffGear.slots.${axis.id}.name`) }}</b>
              <em v-if="compatibilityLocked">⌑ Khóa</em>
            </div>
            <div class="compat-strip-select-wrap">
              <div class="compat-strip-thumb">
                <img v-if="slotVisual(axis.id)" :src="slotVisual(axis.id).optimized" :alt="compatibilityLabel(axis.id, state.slots[axis.id].compatibility)">
                <span v-else>{{ axis.id.charAt(0).toUpperCase() }}</span>
              </div>
              <select
                class="compat-strip-select"
                :data-testid="`compatibility-${axis.id}`"
                :value="state.slots[axis.id].compatibility"
                :disabled="compatibilityLocked"
                @change="updateManualCompatibility(axis.id, $event.target.value)"
              >
                <option v-for="item in axis.options" :key="item.id" :value="item.id">{{ item.labels[locale] }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Inspector Box -->
        <section class="inspector-card-box" data-testid="mechanic-inspector">
          <header class="inspector-card-head">
            <div class="inspector-card-meta">
              <img v-if="selectedSlotVisual" :src="selectedSlotVisual.optimized" :alt="compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility)">
              <div>
                <h3>{{ compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility) }}</h3>
                <span>Thao tác thẻ {{ t(`buffGear.slots.${state.selectedSlotId}.name`) }}</span>
              </div>
            </div>

            <!-- Master Rarity Segmented Switch: 🟡 Thẻ Vàng vs 🔴 Thẻ Đỏ & Quick Max Card Button -->
            <div class="rarity-segmented-switch" role="tablist" aria-label="Chọn phẩm chất Buff Gear">
              <button
                type="button"
                class="rarity-switch-btn is-gold-btn"
                :class="{ 'is-active': activeRarityTab === 'gold' }"
                @click="selectRarityTab('gold')"
              >
                🟡 Thẻ Vàng
              </button>
              <button
                type="button"
                class="rarity-switch-btn is-red-btn"
                :class="{ 'is-active': activeRarityTab === 'red' }"
                @click="selectRarityTab('red')"
              >
                🔴 Thẻ Đỏ
              </button>
              <button
                type="button"
                class="btn-quick-max-card"
                @click="quickMaxEntireCard"
                title="Nâng cấp nhanh toàn bộ thuộc tính thẻ này lên tối đa"
              >
                ⚡ Max Nhanh Thẻ
              </button>
            </div>
          </header>

          <!-- Sub-Mechanic Pills: Only 4 clean buttons matching the active rarity -->
          <nav class="inspector-tab-pills" :aria-label="t('buffGear.workbench.inspector.mechanics')">
            <button
              v-for="mechanicId in currentMechanicTabs"
              :key="mechanicId"
              type="button"
              class="tab-pill-btn"
              :class="{ 'is-active': selectedMechanic.activeMechanic === mechanicId }"
              :data-testid="`mechanic-${mechanicId}`"
              @click="setSelectedMechanic(mechanicId)"
            >
              {{ t(`buffGear.workbench.mechanics.${mechanicId}`) }}
            </button>
          </nav>

          <div class="inspector-tab-body">
            <!-- Main Stat Tab (3 Exact Options: %ATK, %HP, %DEF) -->
            <template v-if="selectedMechanic.activeMechanic === 'main'">
              <div class="panel-header-desc">
                <h4>{{ t('buffGear.workbench.main.title') }}</h4>
                <p>Chỉ số chính gồm 3 loại: % Tấn công (ATK), % Máu (HP), % Phòng thủ (DEF).</p>
              </div>

              <div class="main-stat-form-group">
                <label class="main-stat-select-label">Tùy chọn thuộc tính chính của thẻ:</label>
                <select
                  v-model="currentMainStatId"
                  class="main-stat-dropdown"
                  :data-testid="`main-stat-select-${state.selectedSlotId}`"
                >
                  <option v-for="item in mainStatOptions" :key="item.id" :value="item.id">
                    {{ locale === 'vi' ? item.labelVi : item.labelEn }}
                  </option>
                </select>
              </div>

              <div class="main-stat-badge-box">
                <strong>{{ compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility) }} ({{ locale === 'vi' ? mainStatOptions.find(o => o.id === currentMainStatId)?.shortVi : mainStatOptions.find(o => o.id === currentMainStatId)?.shortEn }})</strong>
                <span>+{{ mainStatValue }}%</span>
              </div>
            </template>

            <!-- Transformation (Chuyển Hóa - 5 Dòng Chuẩn In-Game) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'transformation'">
              <div class="purify-dialog-box">
                <!-- Top Header with Quick Max & Reset Diamond Cost -->
                <div class="transform-top-header">
                  <span class="transform-top-title">⚡ Chuyển Hóa Thuộc Tính (1/6 – 6/6)</span>
                  <div class="transform-top-actions">
                    <button
                      type="button"
                      class="btn-transform-quick-max"
                      @click="quickMaxTransformation"
                      title="Nâng cấp nhanh cả 5 dòng lên cấp 6/6 tối đa"
                    >
                      ⚡ Max 5 Dòng (6/6)
                    </button>
                    <button
                      type="button"
                      class="btn-transform-reset"
                      @click="doResetTransformation"
                      :title="`Reset tất cả 5 dòng (Lần ${(selectedMechanic.transformResetCount || 0) + 1}: ${transformResetDiamondCost} Kim Cương)`"
                    >
                      ↺ Reset (💎 {{ transformResetDiamondCost }} KC)
                    </button>
                  </div>
                </div>

                <!-- 5 Transformation Rows with Green Progress Bar -->
                <div class="transform-ingame-list">
                  <div
                    v-for="(row, index) in selectedMechanic.transformationRows.slice(0, 5)"
                    :key="index"
                    class="transform-ingame-row"
                    :class="{ 'is-locked-row': selectedMechanic.transformationLocks[index], 'is-empty-row': !row }"
                  >
                    <!-- Left: Stat Selector -->
                    <div class="transform-stat-name-box">
                      <select
                        class="transform-ingame-select"
                        :value="row || ''"
                        @change="updateTransformationRow(index, $event.target.value)"
                      >
                        <option value="">-- Dòng 0{{ index + 1 }} --</option>
                        <option
                          v-for="statId in selectedSlotData.transformationStats"
                          :key="statId"
                          :value="statId"
                          :disabled="statId !== row && transformationCount(statId) >= buffGearStructure.identicalBonusStatLimit"
                        >{{ statLabel(statId) }}</option>
                      </select>
                    </div>

                    <!-- Center: Green Progress Bar with Level Stepper -->
                    <div class="transform-progress-wrapper" :title="row ? `Cấp bậc: ${getTransformLevel(index)}/6 (Bấm để đổi cấp)` : 'Chưa mở dòng này'">
                      <div
                        class="transform-progress-bar"
                        :class="{ 'is-empty': !row || getTransformLevel(index) === 0 }"
                        @click="row ? setTransformLevel(index, (getTransformLevel(index) % 6) + 1) : null"
                      >
                        <div
                          class="transform-progress-fill"
                          :style="{ width: row ? `${(getTransformLevel(index) / 6) * 100}%` : '0%' }"
                        ></div>
                        <span class="transform-progress-text">{{ row ? `${getTransformLevel(index)}/6` : '0/6' }}</span>
                      </div>
                    </div>

                    <!-- Right: Formatted Value & Lock Button -->
                    <div class="transform-right-group">
                      <strong class="transform-val-display">
                        {{ row ? formatTransformStatValue(row, getTransformLevel(index)) : '--' }}
                      </strong>
                      <button
                        type="button"
                        class="btn-purify-lock"
                        :disabled="!row"
                        :class="{ 'is-locked': selectedMechanic.transformationLocks[index] }"
                        :title="selectedMechanic.transformationLocks[index] ? 'Bấm để mở khóa' : 'Bấm để khóa (Tối đa 2 khóa)'"
                        @click="toggleTransformationLock(index)"
                      >
                        {{ selectedMechanic.transformationLocks[index] ? '🔒 Khóa' : '🔓 Mở' }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="purify-hint-text">
                  <small>💡 Nhấp lần 1 ra dòng mới, nhấp lần 2 nâng cấp dòng, tiếp tục đến khi max 6/6 tất cả 5 dòng. Bấm Reset để quay lại từ đầu (💎 tăng dần theo số lần reset: 54 ➔ 120 ➔ 240 ➔ 540 KC).</small>
                </div>

                <div v-if="transformFeedbackMsg" class="transfer-success-banner">
                  {{ transformFeedbackMsg }}
                </div>

                <!-- Bottom Material Cost & Action Button -->
                <div class="purify-action-bar">
                  <div class="purify-mats-group">
                    <div class="purify-mat-chip">
                      <img src="/Buff Gear/item_transform_component.png" alt="Linh kiện" class="cost-img" />
                      <div class="prism-info">
                        <strong>{{ nextTransformLeftCost }}</strong>
                        <small>Linh kiện chuyển hóa</small>
                      </div>
                    </div>
                    <div class="purify-mat-chip">
                      <img
                        :src="state.selectedSlotId === 'faction' ? '/Buff Gear/card_transform_faction.png' : state.selectedSlotId === 'type' ? '/Buff Gear/card_transform_type.png' : '/Buff Gear/card_transform_level.png'"
                        :alt="state.selectedSlotId === 'faction' ? 'Thẻ Phe' : state.selectedSlotId === 'type' ? 'Thẻ Hệ' : 'Thẻ Cấp'"
                        class="cost-img"
                      />
                      <div class="prism-info">
                        <strong>{{ nextTransformRightCost }}</strong>
                        <small>{{ state.selectedSlotId === 'faction' ? 'Thẻ Phe' : state.selectedSlotId === 'type' ? 'Thẻ Hệ' : 'Thẻ Cấp' }}</small>
                      </div>
                    </div>
                  </div>

                  <div class="purify-btn-group">
                    <div class="purify-gold-cost">
                      <span>🪙</span>
                      <b>20.000 – 31.000 Vàng</b>
                    </div>
                    <button
                      type="button"
                      class="btn-purify-submit"
                      :disabled="isTransforming"
                      @click="rollTransformationStats"
                    >
                      {{ isTransforming ? '🎲 Đang chuyển hóa...' : '⚡ Transform (Chuyển Hóa)' }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Stars & Ascension (Thăng sao Vàng) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'ascension'">
              <div class="ascension-card-box">
                <div class="star-steppers-compact">
                  <div class="star-row-compact">
                    <div class="star-label-group">
                      <small>{{ t('buffGear.workbench.stars.gold') }}</small>
                      <strong class="star-current-badge">★ {{ selectedMechanic.goldStars || 0 }} / 6</strong>
                    </div>
                    <div class="star-btns-compact">
                      <button
                        v-for="star in BUFF_GEAR_MAX_STARS"
                        :key="`gold-${star}`"
                        type="button"
                        class="btn-star-compact is-gold"
                        :class="{ 'is-active': (selectedMechanic.goldStars || 0) >= star }"
                        :title="`Chọn ★ ${star}`"
                        @click="setGoldStars(star)"
                      >★</button>
                    </div>
                  </div>

                  <!-- Quick Action Buttons: +1 Sao, Max Sao, Reset -->
                  <div class="star-quick-actions">
                    <button
                      type="button"
                      class="btn-star-action btn-add-star"
                      :disabled="(selectedMechanic.goldStars || 0) >= 6"
                      @click="levelUpGoldStar"
                    >
                      ⭐ +1 Sao
                    </button>
                    <button
                      type="button"
                      class="btn-star-action btn-max-star"
                      @click="maxGoldStars"
                    >
                      ⚡ ★ 6 Tối Đa
                    </button>
                    <button
                      v-if="(selectedMechanic.goldStars || 0) > 0"
                      type="button"
                      class="btn-star-action btn-reset-star"
                      @click="resetGoldStars"
                    >
                      ↺ 0 Sao
                    </button>
                  </div>
                </div>

                <!-- Live Material Preview for Gold Stars -->
                <div class="ascension-cost-preview">
                  <span class="cost-preview-title">Chi phí Thăng Sao (★ {{ selectedMechanic.goldStars || 0 }}/6):</span>
                  <div class="cost-preview-chips">
                    <div class="cost-chip-item">
                      <img src="/Buff Gear/Item_213001.png" alt="Thẻ sao" class="cost-img" />
                      <span>{{ slotGoldStarCost.ascensionCards }} Thẻ sao</span>
                    </div>
                    <div class="cost-chip-item">
                      <img :src="buffGearMaterialVisuals[0].asset.optimized" alt="Pha lê S" class="cost-img" />
                      <span>{{ slotGoldStarCost.crystalS.toLocaleString('vi-VN') }} Pha lê S</span>
                    </div>
                    <div class="cost-chip-item">
                      <img :src="buffGearMaterialVisuals[1].asset.optimized" alt="Lõi pha lê" class="cost-img" />
                      <span>{{ slotGoldStarCost.crystalCore.toLocaleString('vi-VN') }} Lõi pha lê</span>
                    </div>
                    <div class="cost-chip-item">
                      <span class="cost-chip-icon">🪙</span>
                      <span>{{ (slotGoldStarCost.gold).toLocaleString('vi-VN') }} Vàng</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Advance to Red (Tiến Cấp) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'advance'">
              <div class="advance-dialog-box">
                <div class="advance-visual-banner">
                  <div class="advance-card-display is-gold">
                    <img v-if="selectedSlotVisual" :src="selectedSlotVisual.optimized" :alt="compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility)" />
                    <span>Thẻ Vàng</span>
                  </div>
                  <div class="advance-arrow-anim">➔➔</div>
                  <div class="advance-card-display is-red">
                    <img v-if="selectedSlotVisual" :src="selectedSlotVisual.optimized" :alt="compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility)" />
                    <span>Thẻ Đỏ</span>
                  </div>
                </div>

                <div class="advance-benefits-list">
                  <div class="benefit-item">🔘 <span>Mở khóa <strong>Thanh Tẩy (Purification Training)</strong></span></div>
                  <div class="benefit-item">🔘 <span>Nhận ngẫu nhiên <strong>1 dòng Tinh Luyện (Refine Stats)</strong></span></div>
                  <p class="benefit-note">Sau khi tiến cấp, kế thừa 100% hiệu ứng Chuyển hóa & Thăng sao.</p>
                </div>

                <div class="advance-mats-row">
                  <div class="mat-cost-item">
                    <img src="/Buff Gear/card_transform_level.png" alt="Thẻ tiến cấp" class="cost-img" />
                    <div class="mat-cost-info">
                      <strong class="cost-num">35</strong>
                      <small class="cost-name">Thẻ tiến cấp</small>
                    </div>
                  </div>

                  <div class="mat-cost-item">
                    <img src="/Buff Gear/item_component_box.png" alt="Hộp linh kiện" class="cost-img" />
                    <div class="mat-cost-info">
                      <strong class="cost-num">80</strong>
                      <small class="cost-name">Hộp linh kiện</small>
                    </div>
                  </div>

                  <div class="mat-cost-item">
                    <div class="mat-gold-icon">🪙</div>
                    <div class="mat-cost-info">
                      <strong class="cost-num">100.000</strong>
                      <small class="cost-name">Vàng</small>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn-advance-action"
                  :class="{ 'is-red': selectedMechanic.rarity === 'red' }"
                  @click="previewRarity(selectedMechanic.rarity === 'red' ? 'gold' : 'red')"
                >
                  {{ selectedMechanic.rarity === 'red' ? '✓ Đang ở Thẻ Đỏ (Bấm để về Vàng)' : '⚡ Tiến Cấp Lên Đỏ (Advance)' }}
                </button>
              </div>
            </template>

            <!-- Reset (Làm Mới / Hoàn trả) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'reset'">
              <div class="reset-dialog-box">
                <div class="reset-warning-banner">
                  <span>⚠️</span>
                  <p>Làm Mới sẽ hoàn trả lại toàn bộ nguyên liệu Thăng Sao & Tinh Luyện đã đầu tư vào thẻ này.</p>
                </div>
                <button type="button" class="btn-execute-reset" @click="resetCurrentSlot">
                  ↺ Hoàn Trả & Làm Mới Thẻ Hiện Tại
                </button>
              </div>
            </template>

            <!-- Purification (Thanh Tẩy - Thẻ Đỏ) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'purification'">
              <div v-if="selectedMechanic.rarity !== 'red'" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Chỉ mở trên Buff Gear Đỏ</span>
                <button type="button" class="btn-hero-action" @click="selectRarityTab('red')">Lên Đỏ</button>
              </div>
              <div v-else class="purify-dialog-box">
                <!-- Header with Limit & Milestones -->
                <div class="purify-top-header">
                  <span class="purify-limit-badge">Purify Limit: {{ selectedMechanic.purifyClicks ?? 12 }}/50</span>
                  <div class="milestone-quick-jumps">
                    <button type="button" class="btn-jump-pill" :class="{ 'is-active': (selectedMechanic.purifyClicks ?? 12) === 1 }" @click="setPurifyClicks(1)">1 Nhấp (Ô 1)</button>
                    <button type="button" class="btn-jump-pill" :class="{ 'is-active': (selectedMechanic.purifyClicks ?? 12) === 3 }" @click="setPurifyClicks(3)">3 Nhấp (Ô 2)</button>
                    <button type="button" class="btn-jump-pill" :class="{ 'is-active': (selectedMechanic.purifyClicks ?? 12) === 6 }" @click="setPurifyClicks(6)">6 Nhấp (Ô 3)</button>
                    <button type="button" class="btn-jump-pill" :class="{ 'is-active': (selectedMechanic.purifyClicks ?? 12) >= 12 }" @click="setPurifyClicks(12)">12 Nhấp (Full 4 Ô)</button>
                    <button type="button" class="btn-jump-pill btn-quick-max-purify" @click="quickMaxPurification">⚡ Max 4 Ô (Cực Phẩm)</button>
                    <button type="button" class="btn-jump-pill is-reset" @click="setPurifyClicks(0)">↺ 0</button>
                  </div>
                  <button type="button" class="btn-skills-link" @click="emit('open-skills')">
                    📖 22 kỹ năng
                  </button>
                </div>

                <!-- 4 Purification Stat Rows with Lock Check & Milestone Requirement -->
                <div class="purify-rows-list">
                  <div
                    v-for="(row, index) in selectedMechanic.purificationRows"
                    :key="row.milestone"
                    class="purify-stat-row"
                    :class="{
                      'is-locked-row': row.locked,
                      'is-disabled-row': !isPurifyUnlocked(index),
                      'is-empty-row': !row.statId
                    }"
                  >
                    <div class="purify-stat-info">
                      <b class="milestone-badge">Mốc ×{{ row.milestone }}</b>
                      <template v-if="isPurifyUnlocked(index)">
                        <select
                          class="purify-stat-select"
                          :value="row.statId || ''"
                          @change="updatePurificationRow(index, $event.target.value)"
                        >
                          <option value="">{{ t('buffGear.workbench.purification.empty') }} (Dòng ×{{ row.milestone }})</option>
                          <option v-for="item in selectedSlotData.purificationStats" :key="item.id" :value="item.id">
                            {{ statLabel(item.id) }} ({{ item.min }}–{{ item.max }}{{ item.unit === 'percent' ? '%' : '' }})
                          </option>
                        </select>
                        <strong v-if="row.statId" class="purify-stat-val">
                          {{ row.rolledValue || (row.statId.includes('BONUS') ? `+${(Math.random() * 5 + 3).toFixed(2)}%` : `+${Math.floor(Math.random() * 3000 + 1500)}`) }}
                        </strong>
                      </template>
                      <span v-else class="row-locked-notice">
                        🔒 Mở khóa sau {{ row.milestone }} lần nhấp (hiện tại: {{ selectedMechanic.purifyClicks ?? 0 }}/{{ row.milestone }})
                      </span>
                    </div>

                    <button
                      type="button"
                      class="btn-purify-lock"
                      :disabled="!isPurifyUnlocked(index) || !row.statId"
                      :class="{ 'is-locked': row.locked }"
                      :title="row.locked ? 'Bấm để mở khóa dòng' : 'Bấm để khóa dòng khi thanh tẩy'"
                      @click="togglePurificationLock(index)"
                    >
                      {{ row.locked ? '🔒 Khóa' : '🔓 Mở' }}
                    </button>
                  </div>
                </div>

                <div class="purify-hint-text">
                  <small>💡 1 nhấp mở ô 1, 3 nhấp mở ô 2, 6 nhấp mở ô 3, 12 nhấp mở ô 4. Mỗi lần thanh tẩy thay đổi các dòng chưa khóa.</small>
                </div>

                <div v-if="purifyFeedbackMsg" class="transfer-success-banner">
                  {{ purifyFeedbackMsg }}
                </div>

                <!-- Bottom Material Cost & Big Purification Button -->
                <div class="purify-action-bar">
                  <div class="purify-mats-group">
                    <div class="purify-mat-chip">
                      <img
                        :src="state.selectedSlotId === 'faction' ? '/Buff Gear/prism_faction.png' : state.selectedSlotId === 'type' ? '/Buff Gear/prism_type.png' : '/Buff Gear/prism_level.png'"
                        :alt="state.selectedSlotId === 'faction' ? 'Đá Phe' : state.selectedSlotId === 'type' ? 'Đá Hệ' : 'Đá Cấp'"
                        class="cost-img"
                      />
                      <div class="prism-info">
                        <strong>7</strong>
                        <small>{{ state.selectedSlotId === 'faction' ? 'Đá Phe' : state.selectedSlotId === 'type' ? 'Đá Hệ' : 'Đá Cấp' }} (Trái: 7)</small>
                      </div>
                    </div>
                    <div class="purify-mat-chip">
                      <img src="/Buff Gear/prism_blue_catalyst.png" alt="Đá Lam" class="cost-img" />
                      <div class="prism-info">
                        <strong>10</strong>
                        <small>Đá Lam (Phải: 10)</small>
                      </div>
                    </div>
                  </div>

                  <div class="purify-btn-group">
                    <div class="purify-gold-cost">
                      <span>🪙</span>
                      <b>10.000 Vàng</b>
                    </div>
                    <button
                      type="button"
                      class="btn-purify-submit"
                      :disabled="isPurifying"
                      @click="rollPurificationStats"
                    >
                      {{ isPurifying ? '🎲 Đang Tẩy...' : '⚡ Thanh Tẩy (Purification)' }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Transfer (Chuyển 1 Chỉ Số) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'transfer'">
              <div v-if="selectedMechanic.rarity !== 'red'" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Chỉ mở trên Buff Gear Đỏ</span>
                <button type="button" class="btn-hero-action" @click="selectRarityTab('red')">Lên Đỏ</button>
              </div>
              <div v-else class="transfer-dialog-box">
                <div class="transfer-flow-view">
                  <!-- Left: Current Card with Purification rows -->
                  <div class="transfer-card-box is-source">
                    <div class="transfer-card-top">
                      <img v-if="selectedSlotVisual" :src="selectedSlotVisual.optimized" :alt="compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility)" />
                      <span>{{ compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility) }}</span>
                    </div>
                    <div class="transfer-lines-list">
                      <div
                        class="transfer-line-item skill-row"
                        :class="{ 'is-selected-row': selectedLeftTransferRow === 0 }"
                        @click="selectLeftTransferRow(0)"
                      >
                        <span>{{ sourcePurificationSkill }}</span>
                        <small>{{ selectedLeftTransferRow === 0 ? '✓ Đang chọn' : 'Kỹ năng' }}</small>
                      </div>
                      <div
                        v-for="(row, idx) in selectedMechanic.purificationRows.slice(0, 3)"
                        :key="row.milestone"
                        class="transfer-line-item"
                        :class="{ 'is-selected-row': selectedLeftTransferRow === idx + 1 }"
                        @click="selectLeftTransferRow(idx + 1)"
                      >
                        <span>{{ row.statId ? statLabel(row.statId) : `Dòng mốc ×${row.milestone}` }}</span>
                        <em>{{ selectedLeftTransferRow === idx + 1 ? '✓ Đang chọn' : (row.statId ? 'Đã tẩy' : 'Trống') }}</em>
                      </div>
                    </div>
                  </div>

                  <!-- Center: Exchange Arrow Button -->
                  <button
                    type="button"
                    class="transfer-exchange-btn"
                    title="Bấm để chuyển 1 chỉ số đã chọn"
                    @click="doTransferStats"
                  >
                    ⇆
                  </button>

                  <!-- Right: Target Card -->
                  <div class="transfer-card-box is-target is-selected">
                    <div class="transfer-card-top">
                      <div class="target-plus-slot has-target">🎴</div>
                      <span>Thẻ Đích (Nhận)</span>
                    </div>
                    <div class="transfer-lines-list">
                      <div
                        class="transfer-line-item skill-row"
                        :class="{ 'is-selected-row': selectedRightTransferRow === 0 }"
                        @click="selectRightTransferRow(0)"
                      >
                        <span>{{ targetPurificationSkill }}</span>
                        <small>{{ selectedRightTransferRow === 0 ? '✓ Đang chọn' : 'Kỹ năng' }}</small>
                      </div>
                      <div
                        v-for="(row, idx) in targetPurificationRows.slice(0, 3)"
                        :key="row.milestone"
                        class="transfer-line-item"
                        :class="{ 'is-selected-row': selectedRightTransferRow === idx + 1 }"
                        @click="selectRightTransferRow(idx + 1)"
                      >
                        <span>{{ row.statId ? statLabel(row.statId) : `Dòng mốc ×${row.milestone}` }}</span>
                        <em>{{ selectedRightTransferRow === idx + 1 ? '✓ Đang chọn' : (row.statId ? 'Đã nhận' : 'Trống') }}</em>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Transfer Material / Cost Info -->
                <div class="refine-cost-panel">
                  <span class="refine-cost-title">Chi phí chuyển đổi chỉ số:</span>
                  <div class="refine-cost-items">
                    <div class="cost-pill">
                      <span class="cost-gold-icon">🪙</span>
                      <span>Chi phí: <strong>Miễn phí</strong></span>
                    </div>
                    <div class="cost-pill">
                      <span>✨</span>
                      <span>Không tiêu hao Thẻ hay Nguyên liệu</span>
                    </div>
                  </div>
                </div>

                <div v-if="transferSuccessMsg" class="transfer-success-banner">
                  {{ transferSuccessMsg }}
                </div>
                <div v-else class="transfer-note-box">
                  <p>💡 Chọn <strong>1 dòng bên trái</strong> và <strong>1 dòng bên phải</strong>, sau đó bấm <strong>[ ⇆ Chuyển Chỉ Số ]</strong> để hoán đổi 1-1.</p>
                </div>

                <button type="button" class="btn-execute-transfer" @click="doTransferStats">
                  ⇆ Hoán Đổi 1 Dòng Đã Chọn (1-to-1 Transfer)
                </button>
              </div>
            </template>

            <!-- Refine (Tinh Luyện) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'refine'">
              <div v-if="selectedMechanic.rarity !== 'red'" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Chỉ mở trên Buff Gear Đỏ</span>
                <button type="button" class="btn-hero-action" @click="selectRarityTab('red')">Lên Đỏ</button>
              </div>
              <div v-else class="refine-dialog-box">
                <!-- Stat Selection -->
                <div class="refine-stat-picker">
                  <label class="refine-picker-label">Thuộc tính Tinh Luyện:</label>
                  <select v-model="selectedMechanic.refineStatId" class="refine-dropdown">
                    <option :value="null">-- Chọn dòng Tinh Luyện --</option>
                    <option v-for="statId in selectedSlotData.refineStats" :key="statId" :value="statId">
                      {{ statLabel(statId) }}
                    </option>
                  </select>
                </div>

                <!-- Current Level & Purple Star Stepper -->
                <div class="refine-level-card">
                  <div class="refine-level-header">
                    <span>Cấp Tinh Luyện hiện tại:</span>
                    <strong class="refine-lvl-badge">Cấp {{ selectedMechanic.refineLevel || 0 }} / 6</strong>
                  </div>

                  <div class="refine-stars-row">
                    <button
                      v-for="star in 6"
                      :key="`refine-star-${star}`"
                      type="button"
                      class="btn-refine-star"
                      :class="{ 'is-active': (selectedMechanic.refineLevel || 0) >= star }"
                      :title="`Chọn Cấp ${star}`"
                      @click="setPurpleStars(star)"
                    >
                      ★
                    </button>
                  </div>

                  <!-- Quick Action Buttons for Refine -->
                  <div class="star-quick-actions">
                    <button
                      type="button"
                      class="btn-star-action btn-add-star"
                      :disabled="(selectedMechanic.refineLevel || 0) >= 6"
                      @click="doLevelUpRefine"
                    >
                      ⭐ +1 Cấp
                    </button>
                    <button
                      type="button"
                      class="btn-star-action btn-max-star"
                      @click="maxRefineLevel"
                    >
                      ⚡ ★ 6 Cấp Tối Đa
                    </button>
                    <button
                      v-if="(selectedMechanic.refineLevel || 0) > 0"
                      type="button"
                      class="btn-star-action btn-reset-star"
                      @click="resetRefineLevel"
                    >
                      ↺ 0 Cấp
                    </button>
                  </div>
                </div>

                <!-- Material Cost Preview for Next Level -->
                <div v-if="nextRefineCost" class="refine-cost-panel">
                  <span class="refine-cost-title">Nguyên liệu nâng cấp lên Cấp {{ (selectedMechanic.refineLevel || 0) + 1 }}:</span>
                  <div class="refine-cost-items">
                    <div class="cost-pill">
                      <img src="/Buff Gear/Item_212008.png" alt="Thẻ tinh luyện" class="cost-img" />
                      <span>{{ nextRefineCost.refinementCards }} Thẻ tinh luyện</span>
                    </div>
                    <div class="cost-pill">
                      <span class="cost-gold-icon">🪙</span>
                      <span>{{ (nextRefineCost.gold).toLocaleString('vi-VN') }} Vàng</span>
                    </div>
                    <div class="cost-pill">
                      <span class="cost-star-icon">⭐</span>
                      <span>Yêu cầu: ≥ {{ (selectedMechanic.refineLevel || 0) + 1 }} ★ Vàng</span>
                    </div>
                  </div>
                </div>
                <div v-else class="refine-max-banner">
                  🏆 Đã đạt cấp Tinh Luyện tối đa (Cấp 6)!
                </div>

                <div v-if="refineUpgradeSuccessMsg" class="refine-success-banner">
                  {{ refineUpgradeSuccessMsg }}
                </div>

                <button
                  type="button"
                  class="btn-refine-level-up"
                  :disabled="!canLevelUpRefine"
                  @click="doLevelUpRefine"
                >
                  {{ canLevelUpRefine ? `🛡️ Nâng Cấp Tinh Luyện (Lên Cấp ${(selectedMechanic.refineLevel || 0) + 1})` : '✓ Đã Đạt Cấp Tối Đa' }}
                </button>
              </div>
            </template>

            <!-- Clarify (Đổi chỉ số chính) -->
            <template v-else-if="selectedMechanic.activeMechanic === 'clarify'">
              <div v-if="selectedMechanic.rarity !== 'red'" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Chỉ mở trên Buff Gear Đỏ</span>
                <button type="button" class="btn-hero-action" @click="selectRarityTab('red')">Lên Đỏ</button>
              </div>
              <div v-else class="clarify-dialog-box">
                <div class="clarify-card-banner">
                  <img v-if="selectedSlotVisual" :src="selectedSlotVisual.optimized" :alt="compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility)" class="clarify-card-img" />
                  <div class="clarify-card-info">
                    <strong>{{ compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility) }}</strong>
                    <span class="clarify-badge-red">BUFF GEAR ĐỎ</span>
                  </div>
                </div>

                <div class="clarify-stats-compare">
                  <div class="clarify-stat-row is-current">
                    <span class="clarify-row-tag tag-current">Hiệu ứng hiện tại</span>
                    <strong class="clarify-row-val">
                      {{ selectedMechanic.refineStatId ? `${statLabel(selectedMechanic.refineStatId)} (Cấp ${selectedMechanic.refineLevel || 1})` : 'Chưa có dòng Tinh luyện (Bấm đổi bên dưới)' }}
                    </strong>
                  </div>
                  <div class="clarify-stat-row is-random">
                    <span class="clarify-row-tag tag-random">Hiệu ứng Đổi Chỉ Số</span>
                    <strong class="clarify-row-val text-random" :class="{ 'is-spinning': isClarifyRolling }">
                      {{ isClarifyRolling ? '🎲 Đang quay chỉ số mới...' : 'Random Stats??? (Đổi dòng ngẫu nhiên)' }}
                    </strong>
                  </div>
                </div>

                <div v-if="clarifyFeedbackMsg" class="clarify-success-banner">
                  {{ clarifyFeedbackMsg }}
                </div>
                <div v-else class="clarify-note-banner">
                  <p>Làm rõ có thể thay đổi hiệu ứng của dòng Tinh luyện (Clarify can change the effects of refine).</p>
                </div>

                <div class="clarify-action-row">
                  <div class="clarify-mat-slot">
                    <img src="/Buff Gear/Item_219110.png" alt="Bút làm rõ" class="clarify-mat-icon" />
                    <span class="clarify-mat-count">{{ clarifyUsedCount > 0 ? `Đã dùng: ${clarifyUsedCount} bút` : '1 Bút / Lần' }}</span>
                  </div>
                  <div class="clarify-btns-group">
                    <button
                      type="button"
                      class="btn-clarify-submit"
                      :disabled="isClarifyRolling"
                      @click="doClarifyRoll"
                    >
                      {{ isClarifyRolling ? '🎲 Đang Đổi...' : '✨ Đổi Chỉ Số (Clarify)' }}
                    </button>
                    <button
                      type="button"
                      class="btn-clarify-multi"
                      :disabled="isClarifyRolling"
                      @click="quickClarifyMultiple(5)"
                      title="Làm rõ nhanh 5 lần liên tiếp"
                    >
                      ⚡ Đổi Nhanh ×5
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- All-Time Slot Material Cost Summary Footer -->
          <div class="inspector-slot-mats-footer">
            <div class="slot-mats-header">
              <span>📊 TỔNG NGUYÊN LIỆU THẺ NÀY:</span>
            </div>
            <div class="slot-mats-list">
              <div v-if="slotCost.gold > 0" class="slot-mat-chip">
                <span class="chip-icon">🪙</span>
                <span>{{ slotCost.gold.toLocaleString(locale) }} Vàng</span>
              </div>
              <div v-if="slotCost.transformComponents > 0" class="slot-mat-chip">
                <img src="/Buff Gear/item_transform_component.png" alt="Linh kiện chuyển hóa" class="chip-img" />
                <span>{{ slotCost.transformComponents.toLocaleString(locale) }} Linh kiện</span>
              </div>
              <div v-if="slotCost.transformCards > 0" class="slot-mat-chip">
                <img
                  :src="state.selectedSlotId === 'faction' ? '/Buff Gear/card_transform_faction.png' : state.selectedSlotId === 'type' ? '/Buff Gear/card_transform_type.png' : '/Buff Gear/card_transform_level.png'"
                  :alt="state.selectedSlotId === 'faction' ? 'Thẻ Phe' : state.selectedSlotId === 'type' ? 'Thẻ Hệ' : 'Thẻ Cấp'"
                  class="chip-img"
                />
                <span>{{ slotCost.transformCards.toLocaleString(locale) }} {{ state.selectedSlotId === 'faction' ? 'Thẻ Phe' : state.selectedSlotId === 'type' ? 'Thẻ Hệ' : 'Thẻ Cấp' }}</span>
              </div>
              <div v-if="slotCost.transformDiamonds > 0" class="slot-mat-chip is-diamond">
                <span class="chip-icon">💎</span>
                <span>{{ slotCost.transformDiamonds.toLocaleString(locale) }} KC Reset</span>
              </div>
              <div v-if="slotCost.ascensionCards > 0" class="slot-mat-chip">
                <img src="/Buff Gear/Item_213001.png" alt="Thẻ thăng sao" class="chip-img" />
                <span>{{ slotCost.ascensionCards }} Thẻ thăng sao</span>
              </div>
              <div v-if="slotCost.crystalS > 0" class="slot-mat-chip">
                <img :src="buffGearMaterialVisuals[0].asset.optimized" alt="Tinh thể S" class="chip-img" />
                <span>{{ slotCost.crystalS.toLocaleString(locale) }} Tinh thể S</span>
              </div>
              <div v-if="slotCost.crystalCore > 0" class="slot-mat-chip">
                <img :src="buffGearMaterialVisuals[1].asset.optimized" alt="Lõi tinh thể" class="chip-img" />
                <span>{{ slotCost.crystalCore.toLocaleString(locale) }} Lõi tinh thể</span>
              </div>
              <div v-if="slotCost.advanceCards > 0" class="slot-mat-chip is-advance">
                <img src="/Buff Gear/card_transform_level.png" alt="Thẻ tiến cấp" class="chip-img" />
                <span>{{ slotCost.advanceCards }} Thẻ tiến cấp</span>
              </div>
              <div v-if="slotCost.componentBoxes > 0" class="slot-mat-chip is-advance">
                <img src="/Buff Gear/item_component_box.png" alt="Hộp linh kiện" class="chip-img" />
                <span>{{ slotCost.componentBoxes }} Hộp linh kiện</span>
              </div>
              <div v-if="slotCost.purifyPrisms > 0" class="slot-mat-chip">
                <img
                  :src="state.selectedSlotId === 'faction' ? '/Buff Gear/prism_faction.png' : state.selectedSlotId === 'type' ? '/Buff Gear/prism_type.png' : '/Buff Gear/prism_level.png'"
                  :alt="state.selectedSlotId === 'faction' ? 'Đá Phe' : state.selectedSlotId === 'type' ? 'Đá Hệ' : 'Đá Cấp'"
                  class="chip-img"
                />
                <span>{{ slotCost.purifyPrisms }} {{ state.selectedSlotId === 'faction' ? 'Đá Phe' : state.selectedSlotId === 'type' ? 'Đá Hệ' : 'Đá Cấp' }}</span>
              </div>
              <div v-if="slotCost.purifyBlues > 0" class="slot-mat-chip">
                <img src="/Buff Gear/prism_blue_catalyst.png" alt="Đá Lam" class="chip-img" />
                <span>{{ slotCost.purifyBlues }} Đá Lam</span>
              </div>
              <div v-if="slotCost.refinementCards > 0" class="slot-mat-chip">
                <img src="/Buff Gear/Item_212008.png" alt="Thẻ tinh luyện" class="chip-img" />
                <span>{{ slotCost.refinementCards }} Thẻ tinh luyện</span>
              </div>
              <div v-if="!slotCost.gold && !slotCost.transformComponents && !slotCost.ascensionCards && !slotCost.advanceCards && !slotCost.purifyPrisms && !slotCost.refinementCards" class="slot-mat-chip">
                <span class="chip-icon">🪙</span>
                <span>0 Vàng</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- RIGHT COLUMN: 3-Card Board Plate & Main Stats Summary -->
      <div class="wb-col-right">
        <!-- 3-Slot Board Plate -->
        <div class="board-plate-card" :aria-label="t('buffGear.workbench.preview.title')">
          <div class="plate-slots-layout">
            <div
              v-for="(axis, index) in buffGearCompatibilityAxes"
              :key="axis.id"
              class="plate-slot-item"
              :class="{
                'is-active': state.selectedSlotId === axis.id,
                'is-red': state.slots[axis.id].mechanic.rarity === 'red'
              }"
              :data-testid="`slot-${axis.id}`"
              role="button"
              tabindex="0"
              @click="state.selectedSlotId = axis.id"
            >
              <span class="plate-slot-tag">0{{ index + 1 }} · {{ t(`buffGear.slots.${axis.id}.name`) }}</span>
              <div class="plate-slot-art">
                <img v-if="slotVisual(axis.id)" :src="slotVisual(axis.id).optimized" :alt="compatibilityLabel(axis.id, state.slots[axis.id].compatibility)">
                <span v-else>{{ axis.id.charAt(0).toUpperCase() }}</span>
              </div>
              <strong class="plate-slot-name">{{ compatibilityLabel(axis.id, state.slots[axis.id].compatibility) }}</strong>
              <span class="plate-slot-stars">★ {{ state.slots[axis.id].mechanic.goldStars || 0 }}</span>
            </div>
          </div>
          <span class="plate-boost-note">Tăng hiệu ứng Trang bị, Độc quyền & Thẻ bổ trợ</span>
        </div>

        <!-- 3-Slot Main Stats Summary List -->
        <div class="main-stats-summary-card">
          <div class="main-stats-summary-head">
            <span>Chỉ số chính (3 thẻ)</span>
          </div>
          <div
            v-for="axis in buffGearCompatibilityAxes"
            :key="axis.id"
            class="main-stat-row"
            :class="{ 'is-focus': state.selectedSlotId === axis.id }"
            role="button"
            tabindex="0"
            @click="state.selectedSlotId = axis.id"
          >
            <strong>{{ t(`buffGear.slots.${axis.id}.name`) }}: {{ compatibilityLabel(axis.id, state.slots[axis.id].compatibility) }}</strong>
            <b>{{ getSlotMainStat(axis.id) }}</b>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Resources HUD Strip (1 Row) -->
    <footer class="resource-hud-strip" data-testid="buff-gear-materials">
      <div class="hud-item">
        <div class="hud-icon">🪙</div>
        <div class="hud-data">
          <strong>{{ t('buffGear.workbench.materials.gold') }}</strong>
          <b>{{ loadoutCost.gold > 0 ? loadoutCost.gold.toLocaleString(locale) : '0' }}</b>
        </div>
      </div>

      <div v-for="material in buffGearMaterialVisuals" :key="material.id" class="hud-item">
        <div class="hud-icon">
          <img :src="material.asset.optimized" :alt="t(`buffGear.workbench.materials.${material.id}`)">
        </div>
        <div class="hud-data">
          <strong>{{ t(`buffGear.workbench.materials.${material.id}`) }}</strong>
          <b>×{{ (loadoutCost[material.id] || 0).toLocaleString(locale) }}</b>
        </div>
      </div>

      <div class="hud-item">
        <div class="hud-icon">
          <img src="/Buff Gear/Item_213001.png" :alt="t('buffGear.workbench.materials.ascensionCards')">
        </div>
        <div class="hud-data">
          <strong>{{ t('buffGear.workbench.materials.ascensionCards') }}</strong>
          <b>×{{ (loadoutCost.ascensionCards || 0).toLocaleString(locale) }}</b>
        </div>
      </div>

      <div class="hud-item">
        <div class="hud-icon">
          <img src="/Buff Gear/Item_212008.png" :alt="t('buffGear.workbench.materials.refinementCards')">
        </div>
        <div class="hud-data">
          <strong>{{ t('buffGear.workbench.materials.refinementCards') }}</strong>
          <b>×{{ (loadoutCost.refinementCards || 0).toLocaleString(locale) }}</b>
        </div>
      </div>
    </footer>

    <!-- Character Search Modal -->
    <Teleport to="body">
      <div v-if="characterPickerOpen" class="buff-character-overlay" @click.self="characterPickerOpen = false" @keydown.esc="characterPickerOpen = false">
        <section class="buff-character-dialog" role="dialog" aria-modal="true" :aria-label="t('buffGear.workbench.character.dialogTitle')">
          <header class="dialog-top-bar">
            <div>
              <span>CHỌN NHÂN VẬT</span>
              <h2>{{ t('buffGear.workbench.character.dialogTitle') }}</h2>
            </div>
            <button type="button" class="btn-dialog-close" @click="characterPickerOpen = false">✕</button>
          </header>
          <input
            v-model="characterSearch"
            type="search"
            class="character-search-input"
            autofocus
            :placeholder="t('buffGear.workbench.character.searchPlaceholder')"
          >
          <div v-if="characterLoading" class="picker-status">{{ t('buffGear.workbench.character.loading') }}</div>
          <div v-else-if="characterLoadError" class="picker-status picker-status--error">
            <span>{{ t('buffGear.workbench.character.loadError') }}</span>
            <button type="button" @click="loadCharacters">{{ t('buffGear.workbench.character.retry') }}</button>
          </div>
          <div v-else class="character-picker-grid-scroll">
            <button
              v-for="character in filteredCharacters"
              :key="character.id"
              type="button"
              class="character-option-card"
              @click="chooseCharacter(character)"
            >
              <img v-if="character.imageURL" :src="character.imageURL" :alt="locale === 'vi' ? character.nameVi : character.nameEn" loading="lazy">
              <div class="character-option-info">
                <strong>{{ locale === 'vi' ? character.nameVi : character.nameEn }}</strong>
                <span>{{ character.tier }}</span>
                <small>{{ characterCompatibilityLabel('faction', character) }} · {{ characterCompatibilityLabel('type', character) }} · {{ characterCompatibilityLabel('level', character) }}</small>
              </div>
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped src="./BuffGearWorkbenchLayout.css"></style>
