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
  activeTab.value = 'simulator'
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
      <button v-for="tab in tabs" :id="'gear-tab-' + tab.id" :key="tab.id" type="button" role="tab" :class="{ active: activeTab === tab.id }" :aria-selected="activeTab === tab.id" :aria-controls="'gear-panel-' + tab.id" @click="activeTab = tab.id">
        <span>{{ tab.number }}</span><div><strong>{{ tab.label }}</strong><small>{{ tab.desc }}</small></div>
      </button>
    </nav>

    <section v-show="activeTab === 'evolution'" id="gear-panel-evolution" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-evolution">
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

    <section v-show="activeTab === 'simulator'" id="gear-panel-simulator" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-simulator">
      <header class="section-heading"><div><span>LOADOUT LAB</span><h2>{{ words.simulatorTitle }}</h2></div><p>{{ words.simulatorDesc }}</p></header>
      <div class="simulator-toolbar">
        <label><span>{{ words.setToEquip }}</span><select v-model="selectedSetId" @change="equipFullSet"><optgroup :label="words.basic"><option v-for="set in baseSets" :key="set.id" :value="set.id">{{ localized(set) }}</option></optgroup><optgroup :label="words.red"><option v-for="set in redSets" :key="set.id" :value="set.id">{{ localized(set) }}</option></optgroup></select><small class="auto-equip-note">{{ words.autoEquip }}</small></label>
        <div class="toolbar-set"><img :src="setIcon(selectedSet.id)" :alt="localized(selectedSet)" width="58" height="58" /><div><small>{{ words.selected }}</small><strong>{{ localized(selectedSet) }}</strong></div></div>
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
          <div class="set-bonus" :class="{ active: activeSet }" role="status">
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
        <aside class="inspector">
          <span class="editing-label">{{ words.editing }}: {{ words.slot }} {{ activeSlot + 1 }}</span>
          <template v-if="activeBuild.setId">
            <div class="set-identity"><img :src="pieceIcon(activeBuild.setId, activeSlot + 1)" :alt="localized(equippedSets[activeSlot])" width="180" height="180" /><div><span :class="equippedSets[activeSlot]?.category === 'red' ? 'rarity-red' : 'rarity-gold'">{{ equippedSets[activeSlot]?.category === 'red' ? words.red : words.basic }}</span><h3>{{ localized(equippedSets[activeSlot]) }}</h3><small>ID {{ activeBuild.setId }}</small></div></div>
            <p class="set-effect"><b>{{ words.setEffect }}</b>{{ localized(equippedSets[activeSlot], 'effect') }}</p>
            <div class="inspector-actions"><button type="button" class="replace-piece" @click="openPiecePicker(activeSlot)">{{ words.replacePiece }}</button><button type="button" class="remove-piece" @click="clearSlot(activeSlot)">{{ words.removePiece }}</button></div>
          </template>
          <div v-else class="empty-inspector"><b aria-hidden="true">+</b><strong>{{ words.emptySlot }}</strong><p>{{ words.emptyHint }}</p><button type="button" class="replace-piece" @click="openPiecePicker(activeSlot)">{{ words.replacePiece }}</button></div>
        </aside>
      </div>

      <div v-if="activeBuild.setId" class="upgrade-block">
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

    <section v-show="activeTab === 'basic'" id="gear-panel-basic" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-basic">
      <header class="section-heading"><div><span>GOLD CATALOG</span><h2>{{ words.catalogBasicTitle }}</h2></div><p>{{ words.catalogBasicDesc }}</p></header>
      <div class="catalog-grid"><article v-for="set in baseSets" :key="set.id" class="catalog-card"><div class="catalog-image"><span>{{ words.basic }}</span><img :src="setIcon(set.id)" :alt="localized(set)" width="180" height="180" loading="lazy" /></div><div class="catalog-copy"><small>ID {{ set.id }}</small><h3>{{ localized(set) }}</h3><b>{{ words.setEffect }}</b><p>{{ localized(set, 'effect') }}</p></div><button type="button" @click="useInSimulator(set.id)">{{ words.useSimulator }} →</button></article></div>
    </section>

    <section v-show="activeTab === 'advanced'" id="gear-panel-advanced" class="gear-panel" role="tabpanel" aria-labelledby="gear-tab-advanced">
      <header class="section-heading"><div><span>RED CATALOG</span><h2>{{ words.catalogRedTitle }}</h2></div><p>{{ words.catalogRedDesc }}</p></header>
      <div class="catalog-grid red-catalog"><article v-for="set in redSets" :key="set.id" class="catalog-card"><div class="catalog-image"><span>{{ words.red }}</span><img :src="setIcon(set.id)" :alt="localized(set)" width="180" height="180" loading="lazy" /></div><div class="catalog-copy"><small>ID {{ set.id }}</small><h3>{{ localized(set) }}</h3><b>{{ words.setEffect }}</b><p>{{ localized(set, 'effect') }}</p></div><button type="button" @click="useInSimulator(set.id)">{{ words.useSimulator }} →</button></article></div>
    </section>

    <p class="source-note">{{ words.source }}</p>
    <Teleport to="body">
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
    </Teleport>
  </div>
</template>

<style scoped>
.gear-workbench{margin-top:24px}.gear-summary{margin:0 0 12px;color:#6f8799;font-size:10px;font-weight:900;letter-spacing:.12em;text-align:right;text-transform:uppercase}.gear-panel{position:relative;overflow:hidden;margin-top:18px;border:1px solid rgba(105,185,228,.18);border-radius:24px;background:linear-gradient(140deg,rgba(10,25,39,.96),rgba(8,16,27,.96));padding:30px;box-shadow:0 24px 60px rgba(0,0,0,.2)}.gear-panel:before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(111,188,230,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(111,188,230,.04) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(#000,transparent 80%)}.gear-panel>*{position:relative}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:25px}.section-heading span{color:#67e1ff;font-size:10px;font-weight:900;letter-spacing:.15em}.section-heading h2{margin-top:6px;color:#fff;font-size:clamp(26px,4vw,40px);font-weight:950;letter-spacing:-.04em}.section-heading>p{max-width:600px;color:#8498aa;font-size:13px;line-height:1.65}.gear-groups{display:grid;gap:14px}.gear-group{overflow:hidden;border:1px solid rgba(130,170,195,.16);border-radius:18px;background:rgba(3,11,20,.6)}.group-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(130,170,195,.12);padding:12px 16px}.group-heading>div:first-child{display:grid}.group-heading strong{color:#fff;font-size:14px}.group-heading small{color:#688094;font-size:9px;text-transform:uppercase}.materials{display:flex;align-items:center;gap:8px}.materials span{display:flex;align-items:center;gap:2px;color:#d8e4ed;font-size:11px}.materials img{width:30px;height:30px;object-fit:contain}.group-flow{display:grid;grid-template-columns:minmax(0,1fr) auto 118px;align-items:center;gap:12px;padding:14px}.basic-sets{display:grid;grid-template-columns:repeat(auto-fit,minmax(86px,1fr));gap:9px}.set-card{position:relative;min-width:0;overflow:hidden;border:1px solid #1a3040;border-radius:13px;background:#09141f;padding:7px;color:#aebdca;text-align:left;transition:.2s}.set-card:hover,.set-card.selected{border-color:#55dfff;background:#0d2230;transform:translateY(-2px)}.set-card:focus-visible,.gear-piece:focus-visible{outline:2px solid #67e1ff;outline-offset:2px}.set-card img{width:100%;aspect-ratio:1;object-fit:contain}.set-card span{display:block;overflow:hidden;margin-top:4px;font-size:11px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.set-card b{position:absolute;z-index:1;top:6px;right:6px;border-radius:99px;background:#db3446;padding:3px 6px;color:#fff;font-size:8px}.red-set{border-color:rgba(255,70,87,.28);background:rgba(78,11,20,.32)}.red-set:hover,.red-set.selected{border-color:#ff586a;background:rgba(100,15,25,.42)}.flow-arrow{color:#4d6d81;font-size:23px}.workspace-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(290px,.8fr);gap:20px}.loadout-panel,.inspector,.upgrade-card{border:1px solid rgba(125,170,198,.16);border-radius:18px;background:rgba(3,10,18,.7)}.loadout-panel{padding:16px}.loadout-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.gear-piece{display:grid;min-width:0;border:1px solid #1b3040;border-radius:14px;background:#09141f;padding:9px;color:#7e93a4;text-align:left;transition:.2s}.gear-piece:hover,.gear-piece.active{border-color:#61dffd;background:#0d202d;transform:translateY(-2px)}.gear-piece>span{font-size:9px;font-weight:900;text-transform:uppercase}.gear-piece img{width:100%;aspect-ratio:1;object-fit:contain}.gear-piece strong{overflow:hidden;color:#eaf7ff;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.set-bonus{display:grid;grid-template-columns:45px 1fr auto;align-items:center;gap:12px;margin-top:14px;border:1px solid #28333c;border-radius:14px;background:#101419;padding:14px}.set-bonus.active{border-color:rgba(91,225,255,.45);background:linear-gradient(120deg,rgba(25,103,125,.28),rgba(7,22,31,.85));box-shadow:0 0 24px rgba(85,223,250,.12)}.bonus-mark{display:grid;width:41px;height:41px;place-items:center;border:1px solid currentColor;border-radius:11px;color:#60707c;font-size:18px;font-weight:950}.set-bonus.active .bonus-mark{border-color:#55dffa;background:rgba(85,223,250,.15);color:#67e1ff;box-shadow:0 0 14px rgba(85,223,250,.25)}.set-bonus span{color:#67e1ff;font-size:9px;font-weight:900;text-transform:uppercase}.set-bonus h3{margin-top:2px;color:#fff;font-size:17px;font-weight:900}.set-bonus p{margin-top:4px;color:#94a7b6;font-size:12px;line-height:1.55}.activated-badge{display:flex;align-items:center;gap:7px;margin-left:auto;padding:7px 14px;border-radius:999px;background:linear-gradient(135deg,rgba(85,223,250,.22),rgba(16,185,129,.2));border:1px solid rgba(85,223,250,.5);color:#67e1ff;font-size:11px;font-weight:900;letter-spacing:.06em;box-shadow:0 0 16px rgba(85,223,250,.25);white-space:nowrap}.activated-badge__icon{display:grid;width:20px;height:20px;place-items:center;border-radius:50%;background:#55dffa;color:#04141b;font-size:12px;font-weight:950;box-shadow:0 0 8px rgba(85,223,250,.6)}.inspector{padding:18px}.set-identity{display:grid;grid-template-columns:86px 1fr;align-items:center;gap:13px}.set-identity img{width:86px;height:86px;object-fit:contain}.set-identity span{display:inline-flex;border:1px solid currentColor;border-radius:99px;padding:3px 7px;font-size:8px;font-weight:900;text-transform:uppercase}.rarity-gold{color:#f3ca54}.rarity-red{color:#ff5d6e}.set-identity h3{margin-top:4px;color:#fff;font-size:22px;font-weight:950}.set-identity small{color:#62788a;font-size:10px}.set-effect{min-height:78px;margin-top:15px;border-top:1px solid #1b2a35;padding-top:13px;color:#aebdca;font-size:12px;line-height:1.6}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.actions button{min-height:42px;border:1px solid #27475a;border-radius:11px;background:#102432;padding:8px;color:#b9deed;font-size:10px;font-weight:900}.actions .primary{border-color:#6be2ff;background:#64ddfa;color:#03121a}.evolution-card{margin-top:14px;border:1px solid #293945;border-radius:13px;background:rgba(255,255,255,.025);padding:12px}.evolution-card>span{color:#718797;font-size:9px;font-weight:900;text-transform:uppercase}.evolution-target{display:grid;grid-template-columns:52px 1fr;align-items:center;column-gap:9px;margin-top:7px}.evolution-target img{grid-row:1/3;width:52px;height:52px;object-fit:contain}.evolution-target strong{color:#fff;font-size:13px}.evolution-target small,.evolution-card p{color:#7f94a5;font-size:10px;line-height:1.5}.evolution-card p{margin-top:7px}.upgrade-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.upgrade-card{padding:16px}.upgrade-card.disabled{opacity:.55}.upgrade-title{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:8px}.upgrade-title>span{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;background:#112a39;color:#64defb;font-size:9px;font-weight:900}.upgrade-title h3{color:#fff;font-size:14px;font-weight:900}.upgrade-title strong{color:#6bdff9;font-size:11px}.upgrade-card input[type=range]{width:100%;margin-top:23px;accent-color:#5eddf9}.control-row{display:flex;align-items:end;justify-content:space-between;gap:8px;margin-top:16px}.control-row label{display:grid;flex:1;gap:4px;color:#718596;font-size:8px;font-weight:900;text-transform:uppercase}.control-row select{width:100%;border:1px solid #294052;border-radius:8px;background:#0b1721;padding:7px;color:#dcebf4;font-size:10px}.pending{flex-shrink:0;border:1px dashed #30424f;border-radius:7px;padding:7px;color:#718595;font-size:8px}.stars{display:flex;gap:4px;margin-top:20px}.stars button{border:0;background:transparent;padding:2px;color:#2f3c45;font-size:22px;line-height:1}.stars button.on{color:#ffd15b;text-shadow:0 0 12px rgba(255,209,91,.35)}.stars.purple button.on{color:#bd78ff;text-shadow:0 0 12px rgba(189,120,255,.35)}.stars button:disabled{cursor:not-allowed;opacity:.32}.upgrade-card>p{margin-top:15px;color:#758a9a;font-size:10px;line-height:1.5}.source-note{margin:16px auto 0;max-width:900px;color:#617789;font-size:10px;line-height:1.6;text-align:center}@media(max-width:980px){.section-heading{align-items:start;flex-direction:column}.workspace-grid,.upgrade-grid{grid-template-columns:1fr}}@media(max-width:700px){.gear-panel{padding:20px 12px}.group-heading{align-items:start;flex-direction:column}.group-flow{grid-template-columns:1fr}.flow-arrow{transform:rotate(90deg);text-align:center}.red-set{width:min(125px,100%);justify-self:center}.loadout-grid{grid-template-columns:repeat(2,1fr)}.actions{grid-template-columns:1fr}.section-heading h2{font-size:27px}}@media(prefers-reduced-motion:reduce){.set-card,.gear-piece{transition:none}}
.gear-guide{position:relative;display:grid;grid-template-columns:minmax(250px,.9fr) minmax(420px,1.1fr);align-items:center;gap:28px;overflow:hidden;border:1px solid rgba(105,185,228,.18);border-radius:20px;background:linear-gradient(120deg,rgba(12,31,46,.94),rgba(7,16,27,.94));padding:22px 26px}.gear-guide:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(103,225,255,.08),transparent 45%)}.guide-copy,.guide-steps,.gear-summary{position:relative}.guide-copy>span{color:#67e1ff;font-size:9px;font-weight:900;letter-spacing:.16em}.guide-copy h2{margin-top:4px;color:#fff;font-size:22px;font-weight:950}.guide-copy p{margin-top:5px;color:#8298aa;font-size:11px;line-height:1.5}.guide-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;list-style:none}.guide-steps li{display:grid;grid-template-columns:30px 1fr;align-items:center;gap:7px;border:1px solid #203949;border-radius:11px;background:rgba(4,15,24,.75);padding:10px}.guide-steps span{display:grid;width:28px;height:28px;place-items:center;border-radius:8px;background:#123043;color:#69e1ff;font-size:9px;font-weight:950}.guide-steps strong{color:#dcebf3;font-size:10px}.gear-guide .gear-summary{position:absolute;right:15px;bottom:5px;margin:0}.branch-switcher{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.branch-switcher button{display:grid;grid-template-columns:30px 1fr;align-items:center;gap:8px;min-width:0;border:1px solid #1d3444;border-radius:12px;background:#081522;padding:10px;color:#869baa;text-align:left;transition:.2s}.branch-switcher button:hover,.branch-switcher button.active{border-color:#5fdefb;background:#0e2735;color:#fff}.branch-switcher span{display:grid;width:28px;height:28px;place-items:center;border-radius:8px;background:#102b3c;color:#65defa;font-size:9px;font-weight:950}.branch-switcher strong{overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.gear-groups{display:block}.gear-group{overflow:visible}.group-heading>div:first-child small:first-child{color:#62ddfa}.materials>b{color:#506879;font-size:12px}.selection-bar{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:14px;border-top:1px solid rgba(130,170,195,.14);background:linear-gradient(100deg,rgba(16,54,72,.62),rgba(7,18,28,.7));padding:14px 16px}.selection-bar>img{width:72px;height:72px;object-fit:contain}.selection-copy{min-width:0}.selection-copy>span{color:#67e1ff;font-size:8px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.selection-copy h3{margin-top:2px;color:#fff;font-size:17px;font-weight:950}.selection-copy p{overflow:hidden;margin-top:4px;color:#8fa4b4;font-size:11px;line-height:1.5;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}.selection-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;min-width:300px}.selection-actions button{min-height:40px;border:1px solid #2b5063;border-radius:10px;background:#102837;padding:8px 12px;color:#c2e6f2;font-size:9px;font-weight:900}.selection-actions .primary{border-color:#66ddfa;background:#63dcf8;color:#04141c}.selected-mark{position:absolute;z-index:2;top:7px;left:7px;border-radius:99px;background:#55ddfa;padding:3px 6px;color:#04141b;font-size:7px;font-style:normal;font-weight:950;text-transform:uppercase}.loadout-section{scroll-margin-top:90px}
@media(max-width:980px){.gear-guide{grid-template-columns:1fr}.selection-bar{grid-template-columns:64px minmax(0,1fr)}.selection-actions{grid-column:1/-1;min-width:0}}
@media(max-width:700px){.gear-guide{gap:16px;padding:18px 14px}.guide-copy h2{font-size:19px}.guide-steps{gap:5px}.guide-steps li{grid-template-columns:1fr;justify-items:center;padding:8px 4px;text-align:center}.guide-steps strong{font-size:8px}.gear-guide .gear-summary{display:none}.branch-switcher{grid-template-columns:repeat(2,1fr)}.branch-switcher button{padding:8px}.group-heading .materials{display:grid;grid-template-columns:auto auto auto auto;width:100%}.materials>small{grid-column:1/-1}.selection-bar{grid-template-columns:54px 1fr;padding:12px}.selection-bar>img{width:54px;height:54px}.selection-copy p{-webkit-line-clamp:3}.selection-actions{grid-template-columns:1fr}.basic-sets{grid-template-columns:repeat(2,1fr)}}
.gear-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.gear-tabs button{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:9px;min-width:0;border:1px solid rgba(105,185,228,.2);border-radius:15px;background:#091622;padding:12px;color:#8298a9;text-align:left;transition:.2s}.gear-tabs button:hover,.gear-tabs button.active{border-color:#62defb;background:linear-gradient(135deg,#102d3d,#0a1b28);color:#fff;transform:translateY(-2px)}.gear-tabs button>span{display:grid;width:36px;height:36px;place-items:center;border-radius:10px;background:#112b3b;color:#68dffb;font-size:10px;font-weight:950}.gear-tabs button div{display:grid;min-width:0}.gear-tabs strong{font-size:11px;font-weight:950}.gear-tabs small{overflow:hidden;margin-top:2px;color:#6f8798;font-size:8px;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}
.evolution-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.evolution-card{overflow:hidden;border:1px solid rgba(130,170,195,.17);border-radius:18px;background:rgba(3,11,20,.72)}.evolution-card>header{display:grid;grid-template-columns:36px 1fr 62px;align-items:center;gap:10px;border-bottom:1px solid #192b38;padding:12px 14px}.evolution-card>header>span{display:grid;width:34px;height:34px;place-items:center;border-radius:9px;background:#123043;color:#67e1ff;font-size:10px;font-weight:950}.evolution-card header small,.evolution-route small,.result-pieces>small{color:#688094;font-size:8px;font-weight:900;text-transform:uppercase}.evolution-card h3{color:#fff;font-size:18px;font-weight:950}.evolution-card>header img{width:62px;height:62px;object-fit:contain}.evolution-route{display:grid;grid-template-columns:minmax(0,1fr) auto 74px;align-items:center;gap:10px;padding:13px}.base-icon-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(48px,1fr));gap:5px;margin-top:6px}.base-icon-row span{display:grid;min-width:0;justify-items:center;border:1px solid #1b3040;border-radius:10px;background:#09151f;padding:5px}.base-icon-row img{width:44px;height:44px;object-fit:contain}.base-icon-row b{overflow:hidden;width:100%;color:#aebeca;font-size:7px;text-align:center;text-overflow:ellipsis;white-space:nowrap}.evolution-route>i{color:#4b7085;font-size:21px;font-style:normal}.target-icon{width:74px;height:74px;object-fit:contain}.result-pieces{border-top:1px solid #142632;padding:10px 13px}.result-pieces>div{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:5px}.result-pieces img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:8px;background:#09141f}.requirement-box{border-top:1px solid #1c3342;background:linear-gradient(110deg,rgba(24,71,90,.28),rgba(7,18,27,.7));padding:12px}.requirement-box>strong{color:#67e1ff;font-size:9px;text-transform:uppercase}.requirement-box ul{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px;list-style:none}.requirement-box li{display:grid;grid-template-columns:34px 1fr;align-items:center;gap:7px;border:1px solid #203642;border-radius:9px;background:#091721;padding:6px}.requirement-box li>span,.requirement-box li>img{display:grid;width:34px;height:34px;place-items:center;object-fit:contain;border-radius:8px;background:#102d3c;color:#6ce1fb;font-size:12px;font-weight:950}.requirement-box li .coin{background:#3b3011;color:#ffd55f}.requirement-box li b{color:#b7c8d3;font-size:8px;line-height:1.35}
.simulator-toolbar{display:grid;grid-template-columns:minmax(190px,1fr) minmax(160px,.7fr) auto auto;align-items:end;gap:9px;margin-bottom:13px;border:1px solid #1b3444;border-radius:15px;background:#07141e;padding:12px}.simulator-toolbar label{display:grid;gap:5px}.simulator-toolbar label>span,.toolbar-set small{color:#718899;font-size:8px;font-weight:900;text-transform:uppercase}.simulator-toolbar select{width:100%;border:1px solid #294557;border-radius:9px;background:#0b1b27;padding:10px;color:#e0edf4;font-size:11px}.toolbar-set{display:flex;align-items:center;gap:8px}.toolbar-set img{width:48px;height:48px;object-fit:contain}.toolbar-set div{display:grid}.toolbar-set strong{color:#fff;font-size:13px}.simulator-toolbar button{min-height:42px;border-radius:10px;padding:8px 12px;font-size:9px;font-weight:950}.primary-action{border:1px solid #69e0fa;background:#63dcf8;color:#04141c}.secondary-action{border:1px solid #2c5267;background:#102837;color:#c2e7f3}.slot-help{margin-bottom:8px;color:#758b9c;font-size:9px}.gear-piece>span{display:flex;align-items:center;gap:5px}.gear-piece>span b{display:grid;width:20px;height:20px;place-items:center;border-radius:6px;background:#102d3e;color:#65ddfa;font-size:7px}.gear-piece>small{margin-top:3px;color:#6f8799;font-size:8px}.editing-label{display:block;margin-bottom:10px;color:#64defa;font-size:8px;font-weight:900;text-transform:uppercase}.set-effect b{display:block;margin-bottom:4px;color:#6edff8;font-size:8px;text-transform:uppercase}.upgrade-block{margin-top:13px;border:1px solid rgba(125,170,198,.16);border-radius:18px;background:rgba(3,10,18,.72);padding:15px}.upgrade-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}.upgrade-heading span{color:#64defa;font-size:8px;font-weight:900;text-transform:uppercase}.upgrade-heading h3{margin-top:3px;color:#fff;font-size:18px;font-weight:950}.upgrade-heading img{width:52px;height:52px;object-fit:contain}
.catalog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:11px}.catalog-card{display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;border:1px solid #1a3040;border-radius:15px;background:#07141e}.catalog-image{position:relative;display:grid;min-height:150px;place-items:center;background:radial-gradient(circle,rgba(245,196,67,.1),transparent 66%)}.red-catalog .catalog-image{background:radial-gradient(circle,rgba(255,65,83,.12),transparent 66%)}.catalog-image span{position:absolute;top:9px;right:9px;border:1px solid currentColor;border-radius:99px;padding:3px 7px;color:#e8c453;font-size:7px;font-weight:950;text-transform:uppercase}.red-catalog .catalog-image span{color:#ff6171}.catalog-image img{width:135px;height:135px;object-fit:contain}.catalog-copy{border-top:1px solid #172a37;padding:12px}.catalog-copy small{color:#5e7587;font-size:8px}.catalog-copy h3{margin-top:2px;color:#fff;font-size:17px;font-weight:950}.catalog-copy b{display:block;margin-top:10px;color:#64ddfa;font-size:7px;text-transform:uppercase}.catalog-copy p{margin-top:4px;color:#8fa3b2;font-size:9px;line-height:1.55}.catalog-card>button{border:0;border-top:1px solid #1c3545;background:#0e2533;padding:11px;color:#76e1fa;font-size:8px;font-weight:950;text-align:left}.gear-tabs button:focus-visible,.catalog-card>button:focus-visible{outline:2px solid #67e1ff;outline-offset:2px}
@media(max-width:980px){.gear-tabs{grid-template-columns:repeat(2,1fr)}.evolution-grid{grid-template-columns:1fr}.simulator-toolbar{grid-template-columns:1fr 1fr}.upgrade-block .upgrade-grid{grid-template-columns:1fr}}
@media(max-width:700px){.gear-tabs{gap:6px}.gear-tabs button{grid-template-columns:30px 1fr;padding:9px 7px}.gear-tabs button>span{width:28px;height:28px}.gear-tabs strong{font-size:9px}.gear-tabs small{font-size:7px}.evolution-card>header{grid-template-columns:32px 1fr 55px}.evolution-route{grid-template-columns:minmax(0,1fr) auto 62px}.target-icon{width:62px;height:62px}.requirement-box ul{grid-template-columns:1fr}.simulator-toolbar{grid-template-columns:1fr}.catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.catalog-image{min-height:120px}.catalog-image img{width:105px;height:105px}.catalog-copy{padding:9px}.catalog-copy h3{font-size:14px}.catalog-copy p{font-size:8px}.catalog-card>button{padding:9px;font-size:7px}}
@media(max-width:390px){.catalog-grid{grid-template-columns:1fr}}

/* Readability and upgrade feedback */
.gear-workbench{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.gear-tabs strong{font-size:13px;line-height:1.35}.gear-tabs small{font-size:10px;line-height:1.45;white-space:normal}.section-heading span,.evolution-card header small,.evolution-route small,.result-pieces>small,.editing-label,.catalog-copy small,.catalog-copy b{font-size:10px}.section-heading>p{color:#b4c3cf;font-size:14px}.evolution-card>header{grid-template-columns:40px 1fr}.requirement-box>strong{font-size:11px}.requirement-box li b{color:#d7e3ea;font-size:11px;line-height:1.45}.slot-help,.gear-piece>span,.gear-piece>small,.set-identity small,.set-effect,.source-note{font-size:12px}.gear-piece strong{font-size:13px}.upgrade-block{padding:20px}.upgrade-title h3{font-size:16px}.upgrade-title strong{font-size:13px}.range-shell{margin-top:18px}.range-shell input{margin:0!important}.range-shell output{display:flex;align-items:center;justify-content:space-between;margin-top:6px;color:#7890a2;font-size:10px}.range-shell output b{color:#67e1ff;font-size:12px}.upgrade-result{display:flex;align-items:center;gap:10px;margin-top:14px;border:1px solid #254152;border-radius:11px;background:#0b1b27;padding:10px}.upgrade-result strong{color:#67e1ff;font-size:20px}.upgrade-result span{color:#d8e6ee;font-size:11px;font-weight:800}.upgrade-result.gold{border-color:rgba(255,209,91,.28);background:rgba(79,60,13,.16)}.upgrade-result.gold strong{color:#ffd15b}.control-row label{font-size:10px}.control-row select{padding:10px;font-size:12px}.stars{gap:7px}.stars button{width:34px;height:34px;border:1px solid #263947;border-radius:9px;background:#0b1821;font-size:23px;transition:.15s}.stars button:hover:not(:disabled){border-color:#ffd15b;transform:translateY(-2px)}.stars.purple button:hover:not(:disabled){border-color:#bd78ff}.purple-benefit{display:grid;gap:5px;margin-top:14px;border:1px solid rgba(189,120,255,.32);border-radius:11px;background:rgba(94,42,139,.14);padding:11px}.purple-benefit small{color:#bda2d4;font-size:9px;font-weight:900;text-transform:uppercase}.purple-benefit strong{color:#e6c8ff;font-size:13px}.purple-benefit p,.locked-note{color:#a998b8;font-size:11px;line-height:1.5}.locked-note{margin-top:14px!important;border:1px dashed #4b3a57;border-radius:10px;padding:10px}.material-summary{margin-top:14px;border:1px solid #254151;border-radius:16px;background:#07141e;padding:15px}.material-summary header span{color:#67e1ff;font-size:9px;font-weight:900;letter-spacing:.12em}.material-summary header h3{margin-top:3px;color:#fff;font-size:18px}.material-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:11px}.material-grid article{display:grid;grid-template-columns:52px 1fr;align-items:center;gap:10px;border:1px solid #203744;border-radius:12px;background:#0a1923;padding:10px}.material-grid article.muted{opacity:.55}.material-grid img{width:52px;height:52px;object-fit:contain}.material-grid div{display:grid;gap:2px}.material-grid small{color:#94a9b8;font-size:10px}.material-grid strong{color:#fff;font-size:15px}.material-grid p{color:#708697;font-size:9px;line-height:1.4}.upgrade-card.disabled{opacity:1}.upgrade-card.disabled .stars{opacity:.55}
@media(max-width:980px){.material-grid{grid-template-columns:1fr}.upgrade-grid{grid-template-columns:1fr}.upgrade-card{padding:18px}}
@media(max-width:700px){.gear-panel{padding:18px 12px}.gear-tabs strong{font-size:11px}.gear-tabs small{font-size:9px}.upgrade-block{padding:14px 10px}.stars button{width:38px;height:38px}.material-grid article{grid-template-columns:46px 1fr}.material-grid img{width:46px;height:46px}}
.simulator-toolbar{grid-template-columns:minmax(220px,1fr) minmax(160px,.7fr) auto}
.auto-equip-note{color:#8da5b5;font-size:10px;line-height:1.45}
@media(max-width:980px){.simulator-toolbar{grid-template-columns:1fr 1fr}.primary-action{grid-column:1/-1}}
@media(max-width:700px){.simulator-toolbar{grid-template-columns:1fr}.primary-action{grid-column:auto}}
.gear-piece{cursor:default}
.gear-piece-main{display:grid;width:100%;min-width:0;border:0;background:transparent;padding:0;color:inherit;text-align:left;cursor:pointer}
.gear-piece-main>span{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:900;text-transform:uppercase}
.gear-piece-main>span b{display:grid;width:20px;height:20px;place-items:center;border-radius:6px;background:#102d3e;color:#65ddfa;font-size:7px}
.gear-piece-main>small{margin-top:3px;color:#6f8799;font-size:12px}
.gear-piece-actions,.inspector-actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:10px}
.gear-piece-actions button,.inspector-actions button,.empty-inspector button{min-height:36px;border-radius:9px;padding:8px 10px;font-size:10px;font-weight:950}
.replace-piece{border:1px solid #52cbe8;background:#0e3040;color:#82e7fb}
.remove-piece{border:1px solid #743846;background:rgba(95,22,37,.28);color:#ff91a0}
.empty-piece{display:grid;width:100%;min-height:250px;place-items:center;align-content:center;gap:7px;border:1px dashed #31596d;border-radius:10px;background:rgba(9,27,38,.55);color:#86a2b2;cursor:pointer}
.empty-piece>b,.empty-inspector>b{display:grid;width:54px;height:54px;place-items:center;border-radius:50%;background:#11394a;color:#6ce3fb;font-size:36px;line-height:1}
.empty-piece strong,.empty-inspector strong{color:#e9f7fc;font-size:14px}.empty-piece small,.empty-inspector p{color:#8199a9;font-size:11px}
.empty-inspector{display:grid;min-height:270px;place-items:center;align-content:center;gap:8px;text-align:center}.empty-inspector button{margin-top:8px}
.purple-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px}
.purple-stat-grid>div{display:grid;gap:2px;border:1px solid rgba(189,120,255,.26);border-radius:9px;background:rgba(92,40,136,.12);padding:8px}
.purple-stat-grid span{color:#aa94bc;font-size:9px;font-weight:800}
.purple-stat-grid strong{color:#ead3ff;font-size:13px}
.purple-cap-note{margin-top:8px!important;color:#a998b8!important;font-size:10px!important;line-height:1.45}
.material-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}
.catalog-copy b{font-size:12px!important;line-height:1.4}
.catalog-copy p{color:#b7c6d0;font-size:13px;line-height:1.65}
.gear-picker-overlay{position:fixed;z-index:9999;inset:0;display:grid;overflow-y:auto;place-items:start center;background:rgba(0,7,13,.86);padding:5vh 18px;backdrop-filter:blur(8px)}
.gear-picker-dialog{width:min(980px,100%);overflow:hidden;border:1px solid #31546a;border-radius:22px;background:#07131d;box-shadow:0 28px 90px rgba(0,0,0,.65)}
.gear-picker-dialog>header{display:flex;align-items:start;justify-content:space-between;gap:20px;border-bottom:1px solid #1c3545;background:linear-gradient(120deg,#0d2a39,#081722);padding:20px 22px}
.gear-picker-dialog>header span{color:#68ddf8;font-size:10px;font-weight:900;text-transform:uppercase}
.gear-picker-dialog>header h2{margin-top:4px;color:#fff;font-size:25px;font-weight:950}
.gear-picker-dialog>header p{margin-top:5px;color:#9db1be;font-size:13px;line-height:1.5}
.gear-picker-dialog>header button{display:grid;flex:0 0 42px;width:42px;height:42px;place-items:center;border:1px solid #34566a;border-radius:11px;background:#102633;color:#dcebf3;font-size:25px}
.gear-picker-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;max-height:68vh;overflow-y:auto;padding:16px}
.gear-picker-grid button{display:grid;min-width:0;border:1px solid #1e3544;border-radius:14px;background:#091822;padding:10px;color:#8fa3b1;text-align:left;transition:.16s}
.gear-picker-grid button:hover,.gear-picker-grid button.selected{border-color:#64ddfa;background:#0d2735;transform:translateY(-2px)}
.gear-picker-grid img{width:100%;aspect-ratio:1;object-fit:contain}
.gear-picker-grid span{width:max-content;border:1px solid currentColor;border-radius:99px;padding:2px 6px;font-size:8px;font-weight:900;text-transform:uppercase}
.gear-picker-grid strong{overflow:hidden;margin-top:5px;color:#f0f8fc;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
.gear-picker-grid small{margin-top:2px;color:#657d8d;font-size:9px}
@media(max-width:700px){.catalog-copy b{font-size:11px!important}.catalog-copy p{font-size:11.5px}.purple-stat-grid{grid-template-columns:1fr}.gear-picker-overlay{padding:12px}.gear-picker-dialog>header{padding:15px}.gear-picker-dialog>header h2{font-size:20px}.gear-picker-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:10px}}
.loadout-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.gear-piece-stats{display:grid;gap:3px;margin-top:7px;border-top:1px solid #1d3442;padding-top:7px}
.gear-piece-stats span{display:flex!important;justify-content:space-between;gap:8px;color:#8ea3b1!important;font-size:10px!important;text-transform:none!important}
.gear-piece-stats b{overflow:hidden;color:#91a6b4;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
.gear-piece-stats em{color:#e8f5fa;font-style:normal;font-weight:900}
.upgrade-grid{grid-template-columns:1fr}
.rank-cost{display:flex;align-items:center;gap:8px;margin-top:12px;border:1px solid rgba(255,205,77,.24);border-radius:10px;background:rgba(81,61,12,.14);padding:8px 10px}
.rank-cost img{width:28px;height:28px;object-fit:contain}
.rank-cost span{color:#aebdca;font-size:11px}
.rank-cost strong{margin-left:auto;color:#ffd25b;font-size:15px}
.purple-cost{border-color:rgba(188,116,255,.3);background:rgba(91,38,139,.13)}
.purple-cost strong{color:#d69bff}
.bonus-rolls{display:grid;gap:9px;margin-top:16px;border-top:1px dashed #354153;padding-top:14px}
.bonus-rolls>h4{color:#bd78ff;font-size:12px;font-weight:950;text-transform:uppercase}
.bonus-roll{display:grid;gap:8px;border:1px solid rgba(189,120,255,.25);border-radius:11px;background:rgba(44,30,67,.26);padding:10px}
.bonus-roll.locked{opacity:.55}
.bonus-roll>header{display:flex;align-items:center;justify-content:space-between;gap:12px}
.bonus-roll>header strong{color:#e6caff;font-size:12px}
.bonus-roll>header small{color:#9f8bb0;font-size:10px}
.bonus-controls{display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:7px}
.bonus-controls select{min-width:0;border:1px solid #5c4773;border-radius:8px;background:#111827;padding:9px;color:#eef4f8;font-size:11px}
.bonus-result{display:grid;grid-template-columns:1fr auto;gap:3px;border:1px solid rgba(189,120,255,.25);border-radius:8px;background:#17162c;padding:9px}
.bonus-result strong{color:#e7d7f7;font-size:12px}.bonus-result b{color:#db9cff;font-size:13px}
.bonus-result p{grid-column:1/-1;color:#b6a9c4;font-size:10px;line-height:1.5}
.bonus-lock{color:#9a88a8;font-size:10px}
.evolution-result{display:flex;align-items:center;gap:12px;margin-top:18px;border:1px solid rgba(255,84,102,.28);border-radius:12px;background:rgba(87,18,29,.18);padding:10px}
.evolution-result img{width:72px;height:72px;object-fit:contain}.evolution-result div{display:grid;gap:3px}.evolution-result small{color:#9b8490;font-size:9px;text-transform:uppercase}.evolution-result strong{color:#ff7381;font-size:18px}
.evolution-line-picker{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px}.evolution-line-picker>span{color:#aab9c4;font-size:11px}.evolution-line-picker>div{display:flex;gap:5px}
.evolution-line-picker button{width:34px;height:34px;border:1px solid #344b5a;border-radius:8px;background:#0c1923;color:#9fb0bc;font-weight:900}.evolution-line-picker button.active{border-color:#ffd057;background:#3b300f;color:#ffe28b}
.evolution-rule{margin-top:12px!important;color:#edf5f8!important;font-size:13px!important;font-weight:900}.evolution-note{border-top:1px dashed #31414c;padding-top:10px;color:#879aa8!important;font-size:10px!important;font-style:italic}
.material-grid{grid-template-columns:repeat(auto-fit,minmax(165px,1fr))}
@media(max-width:700px){.loadout-grid{grid-template-columns:1fr 1fr}.gear-piece{padding:8px}.gear-piece-stats span{font-size:9px!important}.bonus-controls{grid-template-columns:1fr}.bonus-roll>header{align-items:start;flex-direction:column}.evolution-line-picker{align-items:start;flex-direction:column}}
@media(max-width:420px){.loadout-grid{grid-template-columns:1fr}}
.level-costs{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.level-costs span{display:flex;align-items:center;gap:5px;border:1px solid #294252;border-radius:9px;background:#0a1923;padding:7px 9px;color:#95a9b7;font-size:10px}
.level-costs img{width:28px;height:28px;object-fit:contain}.level-costs b{color:#eaf5fa;font-size:12px}
@media(max-width:700px){.level-costs{display:grid}.level-costs span{min-width:0}}

/* Cross-device readability pass */
.gear-tabs button{min-height:70px;touch-action:manipulation}
.gear-tabs button:focus-visible,.branch-switcher button:focus-visible,.gear-piece-main:focus-visible,.gear-piece-actions button:focus-visible,.inspector-actions button:focus-visible,.empty-piece:focus-visible,.stars button:focus-visible,.gear-picker-grid button:focus-visible{outline:2px solid #67e1ff;outline-offset:2px}
.guide-copy>span,.selection-copy>span,.simulator-toolbar label>span,.toolbar-set small,.editing-label,.evolution-card header small,.evolution-route small,.result-pieces>small{font-size:11px}
.guide-copy p,.auto-equip-note{font-size:12px}.guide-steps strong,.branch-switcher strong{font-size:12px}
.simulator-toolbar select{min-height:44px;font-size:13px}.simulator-toolbar button{min-height:44px;font-size:11px}.toolbar-set strong{font-size:14px}
.slot-help{font-size:12px;line-height:1.5}.set-bonus span,.set-effect b{font-size:10px}.set-bonus p,.set-effect{font-size:13px}
.requirement-box>strong{font-size:12px}.requirement-box li b{font-size:12px}.base-icon-row b{font-size:10px}
.gear-piece-main>span,.gear-piece-main>small{font-size:12px}.gear-piece-main>strong{font-size:14px}.gear-piece-main>img{width:min(100%,132px);height:132px;margin:8px auto;object-fit:contain}.gear-piece-stats span{font-size:11px!important}
.gear-piece-actions button,.inspector-actions button,.empty-inspector button{min-height:42px;font-size:11px;touch-action:manipulation}
.catalog-copy small,.catalog-copy b{font-size:11px}.catalog-copy p{font-size:13px}.catalog-card>button{min-height:44px;font-size:11px}
.source-note{font-size:11px}.bonus-result p,.bonus-lock,.evolution-note{font-size:11px!important}

@media(max-width:700px){
  .gear-workbench{margin-top:16px}
  .gear-tabs{gap:7px}.gear-tabs button{min-height:68px;grid-template-columns:32px minmax(0,1fr);gap:7px;padding:9px 8px}.gear-tabs button>span{width:32px;height:32px}.gear-tabs strong{font-size:12px}.gear-tabs small{font-size:11px;line-height:1.35}
  .gear-panel{margin-top:12px;border-radius:18px;padding:16px 10px}.section-heading{gap:10px;margin-bottom:18px}.section-heading h2{font-size:clamp(24px,8vw,30px);line-height:1.08}.section-heading>p{font-size:13px;line-height:1.6}
  .gear-guide{gap:14px;border-radius:16px;padding:16px 12px}.guide-copy h2{font-size:20px}.guide-copy p{font-size:13px}.guide-steps{gap:6px}.guide-steps li{min-height:74px;padding:8px 5px}.guide-steps strong{font-size:10px;line-height:1.35}
  .branch-switcher{gap:6px}.branch-switcher button{min-height:48px;grid-template-columns:28px 1fr;padding:8px}.branch-switcher strong{font-size:11px}
  .evolution-grid{gap:10px}.evolution-card{border-radius:15px}.evolution-card>header{grid-template-columns:34px 1fr 52px;padding:10px}.evolution-card h3{font-size:17px}.evolution-card>header img{width:52px;height:52px}.evolution-route{grid-template-columns:minmax(0,1fr) auto 58px;gap:7px;padding:10px}.target-icon{width:58px;height:58px}.base-icon-row b{font-size:11px}.requirement-box{padding:10px}.requirement-box li b{font-size:11px}
  .simulator-toolbar{gap:8px;border-radius:13px;padding:10px}.simulator-toolbar select{font-size:14px}.simulator-toolbar button{font-size:12px}.toolbar-set strong{font-size:15px}.auto-equip-note{font-size:12px}
  .workspace-grid{gap:12px}.loadout-panel{padding:10px}.loadout-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.gear-piece{padding:7px}.gear-piece-main>span,.gear-piece-main>small{font-size:11px}.gear-piece-main>strong{font-size:14px}.gear-piece-main>img{width:96px;height:96px;margin:6px auto}.gear-piece-stats span{font-size:10px!important}.gear-piece-actions{grid-template-columns:1fr auto;gap:5px}.gear-piece-actions button{min-height:44px;padding:7px 8px;font-size:10px}.empty-piece{min-height:180px}.empty-piece>b,.empty-inspector>b{width:48px;height:48px;font-size:31px}
  .set-bonus{grid-template-columns:40px 1fr;gap:9px;padding:11px}.bonus-mark{width:38px;height:38px}.set-bonus h3{font-size:16px}.set-bonus p{font-size:12px}
  .inspector{padding:14px}.set-identity{grid-template-columns:72px 1fr}.set-identity img{width:72px;height:72px}.set-identity h3{font-size:20px}.set-effect{min-height:0;font-size:13px}.inspector-actions button{min-height:44px;font-size:11px}
  .upgrade-block{border-radius:16px;padding:14px 10px}.upgrade-heading h3{font-size:20px}.upgrade-card{padding:14px 11px}.upgrade-title h3{font-size:15px}.control-row select{min-height:44px;font-size:13px}.level-costs span{font-size:11px}.material-summary{padding:12px}.material-grid article{grid-template-columns:44px 1fr;padding:9px}.material-grid img{width:44px;height:44px}.material-grid small{font-size:11px}.material-grid strong{font-size:14px}
  .catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.catalog-card{border-radius:13px}.catalog-image{min-height:112px}.catalog-image img{width:102px;height:102px}.catalog-copy{padding:10px 9px}.catalog-copy h3{font-size:15px}.catalog-copy b{font-size:11px!important}.catalog-copy p{font-size:12px;line-height:1.55}.catalog-card>button{padding:10px 9px;font-size:11px}
  .gear-picker-dialog{border-radius:16px}.gear-picker-dialog>header p{font-size:12px}.gear-picker-grid strong{font-size:12px}.gear-picker-grid small,.gear-picker-grid span{font-size:10px}
}
@media(max-width:350px){.loadout-grid,.catalog-grid{grid-template-columns:1fr}.gear-tabs{grid-template-columns:1fr}.guide-steps{grid-template-columns:1fr}.guide-steps li{min-height:52px;grid-template-columns:30px 1fr;justify-items:start;text-align:left}}
</style>
