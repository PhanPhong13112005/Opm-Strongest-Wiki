<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import equipmentData from '../data/equipment.json'

const { locale } = useI18n()
const firstSetId = equipmentData.sets[0].id
const activeTab = ref('evolution')
const selectedSetId = ref(firstSetId)
const activeSlot = ref(0)
const pickerSlot = ref(null)
const setPickerOpen = ref(false)
const createBuild = () => ({
  setId: firstSetId,
  level: 0,
  goldStars: 0,
  purpleStars: 0,
  mainStatId: equipmentData.statPools.main[0].id,
  secondaryStatId: equipmentData.statPools.secondary[0].id,
  evolutionBonusLines: 0,
  bonusEffects: equipmentData.bonusEffects.map(() => ({ optionId: '', level: 1 }))
})
const slotBuilds = ref(equipmentData.slots.map(createBuild))

const isEnglish = computed(() => locale.value === 'en')
const words = computed(() => isEnglish.value ? {
  summary: '20 sets · 80 pieces · 4 evolution branches',
  tabEvolution: 'Evolution map', tabEvolutionDesc: 'Gold to Red upgrade requirements',
  tabSimulator: '4-piece simulator', tabSimulatorDesc: 'Mix and upgrade every slot',
  tabBasic: 'Basic sets', tabBasicDesc: 'All 16 Gold sets',
  tabAdvanced: 'Advanced sets', tabAdvancedDesc: 'All 4 Red sets',
  evolutionTitle: 'Gold to Red evolution', evolutionDesc: 'Each branch uses its own blueprint. Requirements apply to each individual piece.',
  baseSets: 'Eligible Gold sets', targetSet: 'Resulting Red set', fourPieces: '4 resulting pieces',
  requirement: 'Requirement per piece', level85: 'Basic gear reaches Lv.85', goldCost: 'Gold',
  blueprint: 'Matching blueprint', catalyst: 'Fusion Catalyst (green material)',
  simulatorTitle: 'Build your four-piece loadout', simulatorDesc: 'Selecting a complete set equips all four slots automatically. To mix sets, select a slot and replace only that piece.',
  setToEquip: 'Complete set', equipAll: 'Equip all 4 slots', autoEquip: 'Changing this set automatically equips all four positions.',
  replacePiece: 'Replace gear', removePiece: 'Remove', emptySlot: 'Empty gear slot', emptyHint: 'Press + to equip gear',
  pickerTitle: slot => 'Choose gear for slot ' + slot, pickerDesc: 'Only this position will be replaced. Levels and stars in the other three positions stay unchanged.', close: 'Close',
  editing: 'Currently editing', clickSlot: 'Select a gear piece to edit its level and stars.',
  active: '4-piece bonus active', inactive: 'Set bonus inactive', mixed: 'Mixed loadout',
  mixedDesc: 'Equip all four positions with the same set to activate its set bonus.',
  selected: 'Selected set', basic: 'Gold set', red: 'Red set', slot: 'Slot',
  upgradeTitle: 'Upgrade selected gear piece', enhance: 'Enhance level', main: 'Main stat',
  goldStars: 'Gold stars', secondary: 'Secondary stat', purpleStars: 'Purple stars', stars: 'stars',
  purpleLocked: 'Purple stars require Red gear and cannot exceed the current Gold-star rank.',
  levelGain: level => `Enhanced to level ${level}`, goldGain: stars => `Gold-star rank ${stars}`,
  purpleGain: stars => `Purple advancement +${stars}`, materialsTitle: 'Materials for this piece',
  levelMaterial: 'Gear EXP Card', bindingMaterial: 'Energy Binding Card', enhanceGold: 'Enhancement Gold', exactLevelCost: 'Exact total from level 0',
  goldStarCard: 'Star Ascension Card', purpleStarCard: 'Refinement Card', usedTotal: 'Total used',
  currentBenefit: 'Current purple-star benefit', nextBenefit: 'Next benefit', noBenefit: 'No purple-star benefit unlocked yet.',
  purpleBenefits: ['ATK and HP boost', 'ATK and HP boost', 'Unlock additional skill line 1', 'Unlock additional skill line 2', 'Unlock additional skill line 3', 'Maximum ATK and HP boost'],
  mainValue: 'Value at current level', secondaryValue: 'Value at current Gold-star rank', purpleStats: 'Stats from Purple stars', unlockedLines: 'Unlocked bonus lines',
  currentStep: 'Current rank cost', totalAll: 'Total resources · all 4 pieces',
  evolutionSim: 'Gold to Red evolution simulation', evolutionLines: 'Gold bonus lines', redLineRule: lines => 'Red gear receives ' + lines + '–3 bonus lines',
  bonusRolls: 'Bonus effects rolled on evolution', unlockAt: star => 'Unlocks at Purple ★' + star,
  chooseEffect: 'Choose an effect', grade: 'Grade',
  redRequired: 'Equip a Red set to unlock purple-star advancement.', levelProgress: 'Level progress',
  pending: 'Value pending', catalogBasicTitle: 'All Basic Gear sets', catalogBasicDesc: 'Gold sets can evolve when each piece meets all four requirements.',
  catalogRedTitle: 'All Advanced Gear sets', catalogRedDesc: 'Red sets support purple-star refinement and stronger four-piece bonuses.',
  useSimulator: 'Use in simulator', setEffect: '4-piece effect',
  source: 'Gear identifiers, pieces, evolution branches, and set effects use the local verified catalog.'
} : {
  summary: '20 bộ · 80 món · 4 nhánh tiến hóa',
  tabEvolution: 'Sơ đồ tiến hóa', tabEvolutionDesc: 'Điều kiện nâng Trang Bị Vàng lên Đỏ',
  tabSimulator: 'Mô phỏng 4 trang bị', tabSimulatorDesc: 'Phối và nâng cấp riêng từng món',
  tabBasic: 'Bộ cơ bản', tabBasicDesc: 'Toàn bộ 16 bộ Trang Bị Vàng',
  tabAdvanced: 'Bộ nâng cao', tabAdvancedDesc: 'Toàn bộ 4 bộ Trang Bị Đỏ',
  evolutionTitle: 'Tiến hóa Trang Bị Vàng lên Đỏ', evolutionDesc: 'Mỗi nhánh dùng một loại bản vẽ riêng. Điều kiện được tính cho từng món Trang Bị.',
  baseSets: 'Các bộ Vàng có thể nâng', targetSet: 'Bộ Đỏ nhận được', fourPieces: '4 món sau khi tiến hóa',
  requirement: 'Điều kiện cho mỗi món', level85: 'Trang Bị cơ bản đạt cấp 85', goldCost: 'Vàng',
  blueprint: 'Bản vẽ đúng nhánh', catalyst: 'Chất xúc tác (cục xanh)',
  simulatorTitle: 'Lắp thử bộ 4 Trang Bị', simulatorDesc: 'Chọn một bộ hoàn chỉnh sẽ tự động lắp cả 4 vị trí. Muốn phối nhiều bộ, hãy chọn từng vị trí rồi thay riêng món đó.',
  setToEquip: 'Chọn trọn bộ', equipAll: 'Lắp lại cả 4 vị trí', autoEquip: 'Đổi bộ tại đây sẽ tự động lắp đủ cả 4 món.',
  replacePiece: 'Thay Trang Bị', removePiece: 'Bỏ', emptySlot: 'Ô Trang Bị trống', emptyHint: 'Nhấn + để lắp Trang Bị',
  pickerTitle: slot => 'Chọn Trang Bị cho vị trí ' + slot, pickerDesc: 'Chỉ vị trí này được thay đổi. Cấp và sao của ba vị trí còn lại được giữ nguyên.', close: 'Đóng',
  editing: 'Đang chỉnh sửa', clickSlot: 'Chọn một món Trang Bị để chỉnh cấp và số sao.',
  active: 'Đã kích hoạt hiệu ứng 4 món', inactive: 'Chưa kích hoạt hiệu ứng bộ', mixed: 'Đang phối nhiều bộ',
  mixedDesc: 'Trang bị đủ bốn vị trí cùng một bộ để kích hoạt hiệu ứng của bộ đó.',
  selected: 'Bộ đang chọn', basic: 'Bộ Vàng', red: 'Bộ Đỏ', slot: 'Vị trí',
  upgradeTitle: 'Nâng cấp món đang chọn', enhance: 'Cấp cường hóa', main: 'Chỉ số chính',
  goldStars: 'Sao vàng', secondary: 'Chỉ số phụ', purpleStars: 'Sao tím', stars: 'sao',
  purpleLocked: 'Sao tím cần Trang Bị Đỏ và không được vượt quá bậc sao vàng hiện tại.',
  levelGain: level => `Đã cường hóa đến cấp ${level}`, goldGain: stars => `Đạt ${stars} sao vàng`,
  purpleGain: stars => `Tăng ${stars} bậc sao tím`, materialsTitle: 'Nguyên liệu cho món này',
  levelMaterial: 'Thẻ EXP Trang Bị', bindingMaterial: 'Thẻ Tụ Năng', enhanceGold: 'Vàng cường hóa', exactLevelCost: 'Tổng chính xác từ cấp 0',
  goldStarCard: 'Thẻ Tăng Sao', purpleStarCard: 'Thẻ Tinh Luyện', usedTotal: 'Tổng đã dùng',
  currentBenefit: 'Hiệu quả sao tím hiện tại', nextBenefit: 'Mốc tiếp theo', noBenefit: 'Chưa mở hiệu quả sao tím.',
  purpleBenefits: ['Tăng ATK và HP', 'Tăng ATK và HP', 'Mở dòng kỹ năng bổ sung 1', 'Mở dòng kỹ năng bổ sung 2', 'Mở dòng kỹ năng bổ sung 3', 'Tăng ATK và HP tối đa'],
  mainValue: 'Giá trị ở cấp hiện tại', secondaryValue: 'Giá trị theo bậc sao vàng', purpleStats: 'Chỉ số từ sao tím', unlockedLines: 'Dòng bổ sung đã mở',
  currentStep: 'Chi phí bậc hiện tại', totalAll: 'Tổng tài nguyên · cả 4 món',
  evolutionSim: 'Mô phỏng tiến hóa Vàng lên Đỏ', evolutionLines: 'Số dòng bonus Vàng', redLineRule: lines => 'Trang Bị Đỏ nhận ' + lines + '–3 dòng bonus',
  bonusRolls: 'Dòng bonus nhận khi tiến hóa', unlockAt: star => 'Mở ở sao tím ★' + star,
  chooseEffect: 'Chọn hiệu ứng', grade: 'Cấp',
  redRequired: 'Hãy trang bị một Bộ Đỏ để mở nâng sao tím.', levelProgress: 'Tiến độ cấp',
  pending: 'Chờ số liệu', catalogBasicTitle: 'Tất cả Bộ Trang Bị Cơ Bản', catalogBasicDesc: 'Bộ Vàng có thể tiến hóa khi từng món đáp ứng đủ bốn điều kiện.',
  catalogRedTitle: 'Tất cả Bộ Trang Bị Nâng Cao', catalogRedDesc: 'Bộ Đỏ có thể tăng sao tím và sở hữu hiệu ứng 4 món mạnh hơn.',
  useSimulator: 'Đưa vào mô phỏng', setEffect: 'Hiệu ứng đủ 4 món',
  source: 'Mã Trang Bị, bốn vị trí, nhánh tiến hóa và hiệu ứng bộ được đọc từ danh mục dữ liệu cục bộ.'
})

const tabs = computed(() => [
  { id: 'evolution', number: '01', label: words.value.tabEvolution, desc: words.value.tabEvolutionDesc },
  { id: 'simulator', number: '02', label: words.value.tabSimulator, desc: words.value.tabSimulatorDesc },
  { id: 'basic', number: '03', label: words.value.tabBasic, desc: words.value.tabBasicDesc },
  { id: 'advanced', number: '04', label: words.value.tabAdvanced, desc: words.value.tabAdvancedDesc }
])
const gearTransitionName = ref('gear-panel-next')
const switchTab = tabId => {
  if (tabId === activeTab.value) return
  const currentIndex = tabs.value.findIndex(tab => tab.id === activeTab.value)
  const nextIndex = tabs.value.findIndex(tab => tab.id === tabId)
  gearTransitionName.value = nextIndex > currentIndex ? 'gear-panel-next' : 'gear-panel-previous'
  activeTab.value = tabId
}
const setsById = new Map(equipmentData.sets.map(item => [item.id, item]))
const selectedSet = computed(() => setsById.get(selectedSetId.value))
const baseSets = computed(() => equipmentData.sets.filter(item => item.category === 'basic'))
const redSets = computed(() => equipmentData.sets.filter(item => item.category === 'red'))
const equippedSets = computed(() => slotBuilds.value.map(build => setsById.get(build.setId)))
const activeBuild = computed(() => slotBuilds.value[activeSlot.value])
const activeSetId = computed(() => {
  const first = slotBuilds.value[0]?.setId
  return first && slotBuilds.value.every(build => build.setId === first) ? first : null
})
const activeSet = computed(() => setsById.get(activeSetId.value))
const activeIsRed = computed(() => equippedSets.value[activeSlot.value]?.category === 'red')
const sumStarCosts = (costs, stars) => costs.slice(0, stars).reduce((sum, value) => sum + value, 0)
const localized = (item, key = 'name') => item?.[key + (isEnglish.value ? 'En' : 'Vi')] || ''
const setIcon = setId => '/Gear/gear_' + setId + '.png'
const formatNumber = value => new Intl.NumberFormat(isEnglish.value ? 'en-US' : 'vi-VN').format(value)
const formatStatValue = (value, isRate = false) => isRate ? (value * 100).toFixed(0) + '%' : formatNumber(Math.round(value))
const isRedBuild = build => setsById.get(build.setId)?.category === 'red'
const mainStatForBuild = build => equipmentData.statPools.main.find(stat => stat.id === build.mainStatId)
const secondaryStatForBuild = build => equipmentData.statPools.secondary.find(stat => stat.id === build.secondaryStatId)
const mainValueForBuild = build => {
  const tier = isRedBuild(build) ? 'red' : 'basic'
  const [base, perLevel] = equipmentData.statProgression.main[tier][build.mainStatId]
  return formatStatValue(base + perLevel * build.level)
}
const secondaryValueForBuild = build => {
  const [base, perStar, isRate] = equipmentData.statProgression.secondary[build.secondaryStatId]
  return formatStatValue(base + perStar * build.goldStars, isRate)
}
const activeMainStat = computed(() => mainStatForBuild(activeBuild.value))
const activeSecondaryStat = computed(() => secondaryStatForBuild(activeBuild.value))
const mainStatValue = computed(() => mainValueForBuild(activeBuild.value))
const secondaryStatValue = computed(() => secondaryValueForBuild(activeBuild.value))
const currentGoldStarCost = computed(() => equipmentData.upgradeCosts.goldStarCards[activeBuild.value.goldStars - 1] || 0)
const currentPurpleStarCost = computed(() => equipmentData.upgradeCosts.purpleStarCards[activeBuild.value.purpleStars - 1] || 0)
const currentPurpleBenefit = computed(() => activeBuild.value.purpleStars > 0 ? words.value.purpleBenefits[activeBuild.value.purpleStars - 1] : words.value.noBenefit)
const nextPurpleBenefit = computed(() => activeBuild.value.purpleStars < equipmentData.maxPurpleStars ? words.value.purpleBenefits[activeBuild.value.purpleStars] : null)
const purpleAttack = computed(() => equipmentData.statProgression.purple.attackPerStar * activeBuild.value.purpleStars)
const purpleHp = computed(() => equipmentData.statProgression.purple.hpPerStar * activeBuild.value.purpleStars)
const unlockedPurpleLines = computed(() => equipmentData.statProgression.purple.bonusLineStars.filter(star => star <= activeBuild.value.purpleStars).length)
const curveForBuild = (build, index) => {
  if (!isRedBuild(build)) return equipmentData.enhanceCurves.basic
  return index === 3 ? equipmentData.enhanceCurves.redAccessory : equipmentData.enhanceCurves.red
}
const enhanceCostsForBuild = (build, index) => curveForBuild(build, index).reduce((totals, [from, to, gold, exp, binding]) => {
  const levelsInRange = Math.max(0, Math.min(build.level, to) - from + 1)
  totals.gold += levelsInRange * gold
  totals.exp += levelsInRange * exp
  totals.binding += levelsInRange * binding
  return totals
}, { gold: 0, exp: 0, binding: 0 })
const enhanceCosts = computed(() => enhanceCostsForBuild(activeBuild.value, activeSlot.value))
const totalResourceCosts = computed(() => slotBuilds.value.reduce((totals, build, index) => {
  const levelCosts = enhanceCostsForBuild(build, index)
  totals.gold += levelCosts.gold
  totals.exp += levelCosts.exp
  totals.binding += levelCosts.binding
  totals.goldCards += sumStarCosts(equipmentData.upgradeCosts.goldStarCards, build.goldStars)
  totals.purpleCards += isRedBuild(build) ? sumStarCosts(equipmentData.upgradeCosts.purpleStarCards, build.purpleStars) : 0
  return totals
}, { gold: 0, exp: 0, binding: 0, goldCards: 0, purpleCards: 0 }))
const activeEvolutionGroup = computed(() => equipmentData.groups.find(group => group.baseSetIds.includes(activeBuild.value.setId)))
const activeEvolutionTarget = computed(() => setsById.get(activeEvolutionGroup.value?.redSetId))
const bonusEffectOption = lineIndex => {
  const selection = activeBuild.value.bonusEffects[lineIndex]
  return equipmentData.bonusEffects[lineIndex].options.find(option => option.id === selection.optionId)
}
const bonusEffectValue = lineIndex => {
  const selection = activeBuild.value.bonusEffects[lineIndex]
  return bonusEffectOption(lineIndex)?.values[selection.level - 1] || ''
}
const bonusEffectDescription = lineIndex => {
  const option = bonusEffectOption(lineIndex)
  const description = localized(option, 'description')
  return description ? description.replace('{value}', bonusEffectValue(lineIndex).replace(/^\+/, '')) : ''
}
const updateBonusEffect = (lineIndex, key, value) => {
  const next = activeBuild.value.bonusEffects.map((selection, index) => index === lineIndex ? { ...selection, [key]: value } : selection)
  updateSlot(activeSlot.value, { bonusEffects: next })
}
const pieceIcon = (setId, slot) => '/Gear/equip_' + setId + '_' + slot + '_icon.png'
const updateSlot = (index, values) => {
  slotBuilds.value = slotBuilds.value.map((build, position) => position === index ? { ...build, ...values } : build)
}
const equipFullSet = () => {
  const allowPurple = selectedSet.value?.category === 'red'
  slotBuilds.value = slotBuilds.value.map(build => ({ ...build, setId: selectedSetId.value, purpleStars: allowPurple ? build.purpleStars : 0 }))
}
const chooseFullSet = setId => {
  selectedSetId.value = setId
  equipFullSet()
  setPickerOpen.value = false
}
const equipSetInSlot = (index, setId) => {
  const isRed = setsById.get(setId)?.category === 'red'
  updateSlot(index, {
    setId,
    purpleStars: isRed ? slotBuilds.value[index].purpleStars : 0
  })
}
const clearSlot = index => {
  updateSlot(index, { ...createBuild(), setId: null })
  activeSlot.value = index
}
const openPiecePicker = index => {
  activeSlot.value = index
  pickerSlot.value = index
}
const closePiecePicker = () => {
  pickerSlot.value = null
}
const pickSetForSlot = setId => {
  if (pickerSlot.value === null) return
  equipSetInSlot(pickerSlot.value, setId)
  closePiecePicker()
}
const useInSimulator = setId => {
  selectedSetId.value = setId
  const allowPurple = setsById.get(setId)?.category === 'red'
  slotBuilds.value = slotBuilds.value.map(build => ({ ...build, setId, purpleStars: allowPurple ? build.purpleStars : 0 }))
  switchTab('simulator')
}
const updateActiveBuild = (key, value) => updateSlot(activeSlot.value, { [key]: value })
const setGoldStars = stars => {
  const next = activeBuild.value.goldStars === stars ? stars - 1 : stars
  updateSlot(activeSlot.value, {
    goldStars: next,
    purpleStars: Math.min(activeBuild.value.purpleStars, next)
  })
}
const setPurpleStars = stars => {
  if (!activeIsRed.value || stars > activeBuild.value.goldStars) return
  updateSlot(activeSlot.value, { purpleStars: activeBuild.value.purpleStars === stars ? stars - 1 : stars })
}
</script>

<template>
  <div class="gear-workbench">
    <nav class="gear-tabs" role="tablist" :aria-label="words.summary">
      <button v-for="tab in tabs" :id="'gear-tab-' + tab.id" :key="tab.id" type="button" role="tab" :class="{ active: activeTab === tab.id }" :aria-selected="activeTab === tab.id" :aria-controls="'gear-panel-' + tab.id" @click="switchTab(tab.id)">
        <span>{{ tab.number }}</span><div><strong>{{ tab.label }}</strong><small>{{ tab.desc }}</small></div>
      </button>
    </nav>

    <Transition :name="gearTransitionName" mode="out-in" appear>
    <section v-if="activeTab === 'evolution'" id="gear-panel-evolution" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-evolution">
      <header class="section-heading"><div><span>EVOLUTION</span><h2>{{ words.evolutionTitle }}</h2></div><p>{{ words.evolutionDesc }}</p></header>
      <div class="evolution-grid">
        <article v-for="(group, groupIndex) in equipmentData.groups" :key="group.id" class="evolution-card">
          <header><span>0{{ groupIndex + 1 }}</span><div><small>{{ words.targetSet }}</small><h3>{{ localized(setsById.get(group.redSetId)) }}</h3></div></header>
          <div class="evolution-route">
            <div><small>{{ words.baseSets }}</small><div class="base-icon-row"><span v-for="setId in group.baseSetIds" :key="setId"><img :src="setIcon(setId)" :alt="localized(setsById.get(setId))" width="54" height="54" loading="lazy" /><b>{{ localized(setsById.get(setId)) }}</b></span></div></div>
            <i aria-hidden="true">→</i><img class="target-icon" :src="setIcon(group.redSetId)" :alt="localized(setsById.get(group.redSetId))" width="90" height="90" />
          </div>
          <div class="result-pieces"><small>{{ words.fourPieces }}</small><div><img v-for="slot in equipmentData.slots" :key="slot.id" :src="pieceIcon(group.redSetId, slot.id)" :alt="localized(slot)" width="72" height="72" loading="lazy" /></div></div>
          <div class="requirement-box">
            <strong>{{ words.requirement }}</strong>
            <ul>
              <li><span>{{ equipmentData.evolutionRequirement.baseLevel }}</span><b>{{ words.level85 }}</b></li>
              <li><img :src="equipmentData.upgradeCosts.goldIcon" :alt="words.goldCost" width="42" height="42" loading="lazy" /><b>{{ formatNumber(equipmentData.evolutionRequirement.goldCostPerPiece) }} {{ words.goldCost }}</b></li>
              <li><img :src="group.blueprint" :alt="localized(group, 'blueprintName')" width="42" height="42" loading="lazy" /><b>{{ localized(group, 'blueprintName') }} ×{{ equipmentData.evolutionRequirement.blueprintPerPiece }}</b></li>
              <li><img src="/Gear/Item_212006.png" alt="" width="42" height="42" loading="lazy" /><b>{{ words.catalyst }} ×{{ equipmentData.evolutionRequirement.catalystPerPiece }}</b></li>
            </ul>
          </div>
        </article>
      </div>
    </section>
    <section v-else-if="activeTab === 'simulator'" id="gear-panel-simulator" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-simulator">
      <header class="section-heading"><div><span>LOADOUT LAB</span><h2>{{ words.simulatorTitle }}</h2></div><p>{{ words.simulatorDesc }}</p></header>
      <div class="simulator-toolbar">
        <div class="set-selector">
          <span>{{ words.setToEquip }}</span>
          <button type="button" class="set-picker-trigger" :class="{ red: selectedSet.category === 'red' }" :aria-label="words.setToEquip + ': ' + localized(selectedSet)" @click="setPickerOpen = true">
            <img :src="setIcon(selectedSet.id)" alt="" width="44" height="44" />
            <span><small>{{ selectedSet.category === 'red' ? words.red : words.basic }}</small><strong>{{ localized(selectedSet) }}</strong></span>
            <i aria-hidden="true">›</i>
          </button>
          <small class="auto-equip-note">{{ words.autoEquip }}</small>
        </div>
        <button type="button" class="primary-action" @click="equipFullSet">{{ words.equipAll }}</button>
      </div>

      <div class="workspace-grid">
        <div class="loadout-panel">
          <p class="slot-help">{{ words.clickSlot }}</p>
          <div class="loadout-grid">
            <article v-for="(slot, index) in equipmentData.slots" :key="slot.id" class="gear-piece" :class="{ active: activeSlot === index, empty: !slotBuilds[index].setId }">
              <template v-if="slotBuilds[index].setId">
                <button type="button" class="gear-piece-main" :aria-pressed="activeSlot === index" @click="activeSlot = index">
                  <span><b>0{{ index + 1 }}</b>{{ localized(slot) }}</span>
                  <img :src="pieceIcon(slotBuilds[index].setId, slot.id)" :alt="localized(equippedSets[index]) + ' — ' + localized(slot)" width="360" height="360" :loading="index === 0 ? 'eager' : 'lazy'" decoding="async" />
                  <strong>{{ localized(equippedSets[index]) }}</strong>
                  <small>Lv.{{ slotBuilds[index].level }} · ★{{ slotBuilds[index].goldStars }}<template v-if="equippedSets[index]?.category === 'red'"> · ✦{{ slotBuilds[index].purpleStars }}</template></small>
                  <div class="gear-piece-stats"><span><b>{{ localized(mainStatForBuild(slotBuilds[index])) }}</b><em>{{ mainValueForBuild(slotBuilds[index]) }}</em></span><span><b>{{ localized(secondaryStatForBuild(slotBuilds[index])) }}</b><em>{{ secondaryValueForBuild(slotBuilds[index]) }}</em></span></div>
                </button>
                <div class="gear-piece-actions"><button type="button" class="replace-piece" @click="openPiecePicker(index)">{{ words.replacePiece }}</button><button type="button" class="remove-piece" @click="clearSlot(index)">{{ words.removePiece }}</button></div>
              </template>
              <button v-else type="button" class="empty-piece" @click="openPiecePicker(index)"><b aria-hidden="true">+</b><strong>{{ words.emptySlot }}</strong><small>{{ words.emptyHint }}</small></button>
            </article>
          </div>
          <div :key="activeSet?.id || 'mixed'" class="set-bonus" :class="{ active: activeSet }" role="status">
            <div class="bonus-mark">
              <template v-if="activeSet">✓</template>
              <template v-else>4</template>
            </div>
            <div v-if="activeSet">
              <span>{{ words.active }}</span>
              <h3>{{ localized(activeSet) }}</h3>
              <p>{{ localized(activeSet, 'effect') }}</p>
            </div>
            <div v-else>
              <span>{{ words.inactive }}</span>
              <h3>{{ words.mixed }}</h3>
              <p>{{ words.mixedDesc }}</p>
            </div>
            <div v-if="activeSet" class="activated-badge" title="Đã kích hoạt 4 món">
              <span class="activated-badge__icon">✓</span>
              <span class="activated-badge__text">{{ isEnglish ? 'ACTIVATED' : 'ĐÃ KÍCH HOẠT' }}</span>
            </div>
          </div>
        </div>
        <aside :key="'inspector-' + activeSlot + '-' + activeBuild.setId" class="inspector">
          <span class="editing-label">{{ words.editing }}: {{ words.slot }} {{ activeSlot + 1 }}</span>
          <template v-if="activeBuild.setId">
            <div class="set-identity"><img :src="pieceIcon(activeBuild.setId, activeSlot + 1)" :alt="localized(equippedSets[activeSlot])" width="180" height="180" /><div><span :class="equippedSets[activeSlot]?.category === 'red' ? 'rarity-red' : 'rarity-gold'">{{ equippedSets[activeSlot]?.category === 'red' ? words.red : words.basic }}</span><h3>{{ localized(equippedSets[activeSlot]) }}</h3><small>ID {{ activeBuild.setId }}</small></div></div>
            <p class="set-effect"><b>{{ words.setEffect }}</b>{{ localized(equippedSets[activeSlot], 'effect') }}</p>
            <div class="inspector-actions"><button type="button" class="replace-piece" @click="openPiecePicker(activeSlot)">{{ words.replacePiece }}</button><button type="button" class="remove-piece" @click="clearSlot(activeSlot)">{{ words.removePiece }}</button></div>
          </template>
          <div v-else class="empty-inspector"><b aria-hidden="true">+</b><strong>{{ words.emptySlot }}</strong><p>{{ words.emptyHint }}</p><button type="button" class="replace-piece" @click="openPiecePicker(activeSlot)">{{ words.replacePiece }}</button></div>
        </aside>
      </div>

      <div v-if="activeBuild.setId" :key="'upgrade-' + activeSlot + '-' + activeBuild.setId" class="upgrade-block">
        <div class="upgrade-heading"><div><span>{{ words.editing }}: {{ words.slot }} {{ activeSlot + 1 }}</span><h3>{{ words.upgradeTitle }}</h3></div><img :src="pieceIcon(activeBuild.setId, activeSlot + 1)" :alt="localized(equippedSets[activeSlot])" width="64" height="64" /></div>
        <div class="upgrade-grid">
          <article class="upgrade-card">
            <div class="upgrade-title"><span>01</span><h3>{{ words.enhance }}</h3><strong>Lv.{{ activeBuild.level }}</strong></div>
            <div class="range-shell"><input :value="activeBuild.level" type="range" min="0" :max="equipmentData.maxLevel" :aria-label="words.enhance" @input="updateActiveBuild('level', Number($event.target.value))" /><output>0 <b>Lv.{{ activeBuild.level }}</b> {{ equipmentData.maxLevel }}</output></div>
            <div class="upgrade-result"><strong>+{{ mainStatValue }}</strong><span>{{ localized(activeMainStat) }} · {{ words.mainValue }}</span></div>
            <div class="level-costs"><span><img :src="equipmentData.upgradeCosts.goldIcon" alt="" width="28" height="28" /><b>×{{ formatNumber(enhanceCosts.gold) }}</b> {{ words.enhanceGold }}</span><span><img :src="equipmentData.upgradeCosts.levelCardIcon" alt="" width="28" height="28" /><b>×{{ formatNumber(enhanceCosts.exp) }}</b> {{ words.levelMaterial }}</span><span v-if="enhanceCosts.binding"><img :src="equipmentData.upgradeCosts.bindingCardIcon" alt="" width="28" height="28" /><b>×{{ formatNumber(enhanceCosts.binding) }}</b> {{ words.bindingMaterial }}</span></div>
            <div class="control-row"><label><span>{{ words.main }}</span><select :value="activeBuild.mainStatId" @change="updateActiveBuild('mainStatId', $event.target.value)"><option v-for="stat in equipmentData.statPools.main" :key="stat.id" :value="stat.id">{{ localized(stat) }}</option></select></label></div>
          </article>
          <article class="upgrade-card">
            <div class="upgrade-title"><span>02</span><h3>{{ words.goldStars }}</h3><strong>{{ activeBuild.goldStars }}/{{ equipmentData.maxGoldStars }}</strong></div>
            <div class="stars" :aria-label="words.goldStars"><button v-for="star in equipmentData.maxGoldStars" :key="star" type="button" :class="{ on: star <= activeBuild.goldStars }" :aria-label="star + ' ' + words.stars" @click="setGoldStars(star)">★</button></div>
            <div class="upgrade-result gold"><strong>{{ secondaryStatValue }}</strong><span>{{ localized(activeSecondaryStat) }} · {{ words.secondaryValue }}</span></div>
            <div class="rank-cost"><img :src="equipmentData.upgradeCosts.goldStarCardIcon" alt="" width="28" height="28" /><span>{{ words.currentStep }} ★{{ activeBuild.goldStars }}</span><strong>×{{ currentGoldStarCost }}</strong></div>
            <div class="control-row"><label><span>{{ words.secondary }}</span><select :value="activeBuild.secondaryStatId" @change="updateActiveBuild('secondaryStatId', $event.target.value)"><option v-for="stat in equipmentData.statPools.secondary" :key="stat.id" :value="stat.id">{{ localized(stat) }}</option></select></label></div>
          </article>
          <article v-if="activeIsRed" class="upgrade-card refine-card">
            <div class="upgrade-title"><span>03</span><h3>{{ words.purpleStars }}</h3><strong>{{ activeBuild.purpleStars }}/{{ equipmentData.maxPurpleStars }}</strong></div>
            <div class="stars purple" :aria-label="words.purpleStars"><button v-for="star in equipmentData.maxPurpleStars" :key="star" type="button" :disabled="star > activeBuild.goldStars" :class="{ on: star <= activeBuild.purpleStars }" :title="star > activeBuild.goldStars ? words.purpleLocked : ''" :aria-label="star + ' ' + words.stars" @click="setPurpleStars(star)">★</button></div>
            <div class="purple-stat-grid"><div><span>ATK</span><strong>+{{ formatNumber(purpleAttack) }}</strong></div><div><span>HP</span><strong>+{{ formatNumber(purpleHp) }}</strong></div><div><span>{{ words.unlockedLines }}</span><strong>{{ unlockedPurpleLines }}/3</strong></div></div>
            <div class="rank-cost purple-cost"><img :src="equipmentData.upgradeCosts.purpleStarCardIcon" alt="" width="28" height="28" /><span>{{ words.currentStep }} ★{{ activeBuild.purpleStars }}</span><strong>×{{ currentPurpleStarCost }}</strong></div>
            <div class="purple-benefit" role="status"><small>{{ words.currentBenefit }}</small><strong>{{ currentPurpleBenefit }}</strong><p v-if="nextPurpleBenefit">{{ words.nextBenefit }} → ★{{ activeBuild.purpleStars + 1 }}: {{ nextPurpleBenefit }}</p></div>
            <p class="purple-cap-note">{{ words.purpleLocked }} (★{{ activeBuild.goldStars }})</p>
            <section class="bonus-rolls">
              <h4>{{ words.bonusRolls }}</h4>
              <article v-for="(line, lineIndex) in equipmentData.bonusEffects" :key="line.line" class="bonus-roll" :class="{ locked: activeBuild.purpleStars < line.unlockStar }">
                <header><strong>{{ isEnglish ? 'Line' : 'Dòng' }} {{ line.line }} · {{ line.unlockStar }}★</strong><small>{{ localized(line, 'kind') }}</small></header>
                <div class="bonus-controls"><select :value="activeBuild.bonusEffects[lineIndex].optionId" :disabled="activeBuild.purpleStars < line.unlockStar" @change="updateBonusEffect(lineIndex, 'optionId', $event.target.value)"><option value="">{{ words.chooseEffect }}</option><option v-for="option in line.options" :key="option.id" :value="option.id">{{ localized(option) }}</option></select><select :value="activeBuild.bonusEffects[lineIndex].level" :disabled="activeBuild.purpleStars < line.unlockStar" @change="updateBonusEffect(lineIndex, 'level', Number($event.target.value))"><option :value="1">{{ words.grade }} I</option><option :value="2">{{ words.grade }} II</option></select></div>
                <div v-if="bonusEffectOption(lineIndex)" class="bonus-result"><strong>{{ localized(bonusEffectOption(lineIndex)) }} · {{ words.grade }} {{ activeBuild.bonusEffects[lineIndex].level === 1 ? 'I' : 'II' }}</strong><b>{{ bonusEffectValue(lineIndex) }}</b><p v-if="bonusEffectDescription(lineIndex)">{{ bonusEffectDescription(lineIndex) }}</p></div>
                <p v-else-if="activeBuild.purpleStars < line.unlockStar" class="bonus-lock">{{ words.unlockAt(line.unlockStar) }}</p>
              </article>
            </section>
          </article>
          <article v-else class="upgrade-card evolution-simulator">
            <div class="upgrade-title"><span>03</span><h3>{{ words.evolutionSim }}</h3><strong>{{ localized(activeEvolutionTarget) }}</strong></div>
            <div class="evolution-result"><img :src="setIcon(activeEvolutionTarget?.id)" :alt="localized(activeEvolutionTarget)" width="72" height="72" /><div><small>{{ words.targetSet }}</small><strong>{{ localized(activeEvolutionTarget) }}</strong></div></div>
            <div class="evolution-line-picker"><span>{{ words.evolutionLines }}</span><div><button v-for="line in 4" :key="line - 1" type="button" :class="{ active: activeBuild.evolutionBonusLines === line - 1 }" @click="updateActiveBuild('evolutionBonusLines', line - 1)">{{ line - 1 }}</button></div></div>
            <p class="evolution-rule">→ {{ words.redLineRule(activeBuild.evolutionBonusLines) }}</p>
            <p class="evolution-note">{{ words.level85 }} · {{ words.blueprint }} ×1 · {{ words.catalyst }} ×100</p>
          </article>
        </div>
        <section class="material-summary" aria-live="polite">
          <header><span>RESOURCE CHECK</span><h3>{{ words.totalAll }}</h3></header>
          <div class="material-grid">
            <article><img :src="equipmentData.upgradeCosts.goldIcon" :alt="words.enhanceGold" width="52" height="52" /><div><small>{{ words.enhanceGold }}</small><strong>×{{ formatNumber(totalResourceCosts.gold) }}</strong></div></article>
            <article><img :src="equipmentData.upgradeCosts.levelCardIcon" :alt="words.levelMaterial" width="52" height="52" /><div><small>{{ words.levelMaterial }}</small><strong>×{{ formatNumber(totalResourceCosts.exp) }}</strong></div></article>
            <article :class="{ muted: totalResourceCosts.binding === 0 }"><img :src="equipmentData.upgradeCosts.bindingCardIcon" :alt="words.bindingMaterial" width="52" height="52" /><div><small>{{ words.bindingMaterial }}</small><strong>×{{ formatNumber(totalResourceCosts.binding) }}</strong></div></article>
            <article><img :src="equipmentData.upgradeCosts.goldStarCardIcon" :alt="words.goldStarCard" width="52" height="52" /><div><small>{{ words.goldStarCard }}</small><strong>×{{ totalResourceCosts.goldCards }}</strong></div></article>
            <article :class="{ muted: totalResourceCosts.purpleCards === 0 }"><img :src="equipmentData.upgradeCosts.purpleStarCardIcon" :alt="words.purpleStarCard" width="52" height="52" /><div><small>{{ words.purpleStarCard }}</small><strong>×{{ totalResourceCosts.purpleCards }}</strong></div></article>
          </div>
        </section>
      </div>
    </section>
    <section v-else-if="activeTab === 'basic'" id="gear-panel-basic" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-basic">
      <header class="section-heading"><div><span>GOLD CATALOG</span><h2>{{ words.catalogBasicTitle }}</h2></div><p>{{ words.catalogBasicDesc }}</p></header>
      <div class="catalog-grid"><article v-for="set in baseSets" :key="set.id" class="catalog-card"><div class="catalog-image"><span>{{ words.basic }}</span><img :src="setIcon(set.id)" :alt="localized(set)" width="180" height="180" loading="lazy" /></div><div class="catalog-copy"><small>ID {{ set.id }}</small><h3>{{ localized(set) }}</h3><b>{{ words.setEffect }}</b><p>{{ localized(set, 'effect') }}</p></div><button type="button" @click="useInSimulator(set.id)">{{ words.useSimulator }} →</button></article></div>
    </section>
    <section v-else id="gear-panel-advanced" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-advanced">
      <header class="section-heading"><div><span>RED CATALOG</span><h2>{{ words.catalogRedTitle }}</h2></div><p>{{ words.catalogRedDesc }}</p></header>
      <div class="catalog-grid red-catalog"><article v-for="set in redSets" :key="set.id" class="catalog-card"><div class="catalog-image"><span>{{ words.red }}</span><img :src="setIcon(set.id)" :alt="localized(set)" width="180" height="180" loading="lazy" /></div><div class="catalog-copy"><small>ID {{ set.id }}</small><h3>{{ localized(set) }}</h3><b>{{ words.setEffect }}</b><p>{{ localized(set, 'effect') }}</p></div><button type="button" @click="useInSimulator(set.id)">{{ words.useSimulator }} →</button></article></div>
    </section>

    </Transition>

    <p class="source-note">{{ words.source }}</p>
    <Teleport to="body">
      <Transition name="gear-modal">
      <div v-if="setPickerOpen" class="gear-picker-overlay set-picker-overlay" @click.self="setPickerOpen = false">
        <section class="gear-picker-dialog set-picker-dialog" role="dialog" aria-modal="true" :aria-label="words.setToEquip">
          <header><div><span>LOADOUT SELECTOR</span><h2>{{ words.setToEquip }}</h2><p>{{ words.autoEquip }}</p></div><button type="button" :aria-label="words.close" @click="setPickerOpen = false">×</button></header>
          <div class="set-picker-content">
            <section class="set-picker-group gold-group">
              <header><span><i aria-hidden="true" />{{ words.basic }}</span><small>{{ baseSets.length }} {{ isEnglish ? 'sets' : 'bộ' }}</small></header>
              <div class="set-picker-grid">
                <button v-for="set in baseSets" :key="set.id" type="button" :class="{ selected: selectedSetId === set.id }" @click="chooseFullSet(set.id)">
                  <img :src="setIcon(set.id)" :alt="localized(set)" width="72" height="72" loading="lazy" />
                  <span><small>{{ words.basic }}</small><strong>{{ localized(set) }}</strong></span>
                  <i aria-hidden="true">✓</i>
                </button>
              </div>
            </section>
            <section class="set-picker-group red-group">
              <header><span><i aria-hidden="true" />{{ words.red }}</span><small>{{ redSets.length }} {{ isEnglish ? 'sets' : 'bộ' }}</small></header>
              <div class="set-picker-grid">
                <button v-for="set in redSets" :key="set.id" type="button" class="red" :class="{ selected: selectedSetId === set.id }" @click="chooseFullSet(set.id)">
                  <img :src="setIcon(set.id)" :alt="localized(set)" width="72" height="72" loading="lazy" />
                  <span><small>{{ words.red }}</small><strong>{{ localized(set) }}</strong></span>
                  <i aria-hidden="true">✓</i>
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="gear-modal">
      <div v-if="pickerSlot !== null" class="gear-picker-overlay" @click.self="closePiecePicker">
        <section class="gear-picker-dialog" role="dialog" aria-modal="true" :aria-label="words.pickerTitle(pickerSlot + 1)">
          <header><div><span>{{ words.editing }} · {{ words.slot }} {{ pickerSlot + 1 }}</span><h2>{{ words.pickerTitle(pickerSlot + 1) }}</h2><p>{{ words.pickerDesc }}</p></div><button type="button" :aria-label="words.close" @click="closePiecePicker">×</button></header>
          <div class="gear-picker-grid">
            <button v-for="set in equipmentData.sets" :key="set.id" type="button" :class="{ selected: activeBuild.setId === set.id }" @click="pickSetForSlot(set.id)">
              <img :src="pieceIcon(set.id, pickerSlot + 1)" :alt="localized(set)" width="128" height="128" loading="lazy" />
              <span :class="set.category === 'red' ? 'rarity-red' : 'rarity-gold'">{{ set.category === 'red' ? words.red : words.basic }}</span>
              <strong>{{ localized(set) }}</strong><small>ID {{ set.id }}</small>
            </button>
          </div>
        </section>
      </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped src="./GearCatalogWorkbench.css"></style>
