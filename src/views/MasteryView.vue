<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'
import masteryData from '../data/mastery.json'
import backgearData from '../data/backgear.json'
import { getAllCharacters } from '../services/characterApi'
import { getMasteryConfig } from '../services/masteryApi'
import {
  calculateArenaMatchup,
  calculateBackgearSpecializedRates,
  calculateSpecializedStat,
  getMasteryAdvancedBuff,
  getMasterySupportRules,
  isMasterySupportEligible,
} from '../utils/masteryCalculations'

const { t, locale } = useI18n()
const route = useRoute()
const pageTab = ref('upgrade')

const subTab = ref('phe') // 'phe', 'he', 'cap'
const masteryTransition = ref('fade')
const pageTransition = ref('slide-left')
const subTabOrder = ['phe', 'he', 'cap']
const switchPageTab = (tab) => {
  if (tab === pageTab.value) return
  pageTransition.value = tab === 'arena' ? 'slide-left' : 'slide-right'
  pageTab.value = tab
}


const switchSubTab = (tab) => {
  if (tab === subTab.value) return
  const oldIdx = subTabOrder.indexOf(subTab.value)
  const newIdx = subTabOrder.indexOf(tab)
  if (newIdx > oldIdx) {
    masteryTransition.value = 'slide-left'
  } else if (newIdx < oldIdx) {
    masteryTransition.value = 'slide-right'
  } else {
    masteryTransition.value = 'fade'
  }
  subTab.value = tab
  supportChars.value = [null, null]
}

const fromTier = ref(0)
const toTier = ref(10)

const showCharModal = ref(false)
const modalTarget = ref('main')
const searchQuery = ref('')
const characterCatalog = ref(charactersDataVi)
const masteryConfig = ref(masteryData)
const battlePower = ref(40000000)
const typeMasteryTier = ref(6)
const factionMasteryTier = ref(6)
const enemySpecAttack = ref('')
const enemySpecDefense = ref('')
const specializedBackgears = backgearData.gears.filter(gear =>
  gear.levels?.some(level => level.effects?.some(effect =>
    ['combatoa_up', 'combatda_up'].includes(effect.type)
  ))
)
const backgearLevels = ref(Object.fromEntries(specializedBackgears.map(gear => [gear.id, 0])))


const defaultChar = charactersDataVi.find(c => c.name.includes('Zombieman') && c.tier === 'UR+') || charactersDataVi[0]
const selectedChar = ref(charactersDataVi.find(c => c.id === route.query.character) || defaultChar)
const supportChars = ref([null, null])

const loadMasteryPageData = async () => {
  const [charactersResult, masteryResult] = await Promise.allSettled([
    getAllCharacters('vi', charactersDataVi),
    getMasteryConfig(),
  ])

  if (charactersResult.status === 'fulfilled' && charactersResult.value.length) {
    characterCatalog.value = charactersResult.value
    selectedChar.value = characterCatalog.value.find(c => c.id === selectedChar.value?.id) || selectedChar.value
    supportChars.value = supportChars.value.map(character =>
      character
        ? characterCatalog.value.find(c => c.id === character.id) || character
        : null
    )
  }

  if (masteryResult.status === 'fulfilled' && masteryResult.value?.categories) {
    masteryConfig.value = {
      ...masteryResult.value,
      categories: Object.fromEntries(['phe', 'he', 'cap'].map(branch => {
        const apiTiers = masteryResult.value.categories[branch] || []
        const localTiers = masteryData.categories[branch] || []
        const sourceTiers = apiTiers.length ? apiTiers : localTiers
        return [branch, sourceTiers.map((tier, index) => ({
          ...tier,
          stats: localTiers[index]?.stats || tier.stats,
        }))]
      })),
    }
  }
}

onMounted(loadMasteryPageData)

watch(() => route.query.character, (characterId) => {
  if (!characterId) return
  const character = characterCatalog.value.find(c => c.id === characterId)
  if (!character) return
  selectedChar.value = character
  supportChars.value = [null, null]
})

const getLocalizedCharacter = (character) => {
  if (!character || locale.value !== 'en') return character
  return charactersDataEn.find(c => c.id === character.id) || character
}

const getCharacterName = (character) => getLocalizedCharacter(character)?.name || ''
const getFactionName = (faction) => ({
  'Anh Hùng': t('filters.faction.hero'),
  'Quái Nhân': t('filters.faction.monster'),
  'Võ Thuật': t('filters.faction.martial_artist'),
  'Tội Phạm': t('filters.faction.outlaw'),
  'Ác Nhân': t('filters.faction.villain')
}[faction] || faction)
const getTypeName = (type) => ({
  'Vũ Trang': t('filters.type.duelist'),
  'Giác Đấu': t('filters.type.grappler'),
  'Tâm Linh': t('filters.type.esper'),
  'Công Nghệ': t('filters.type.hi_tech')
}[type] || type)

const supportRules = computed(() => getMasterySupportRules(subTab.value))

const getSupportSlotIndex = () => {
  if (!modalTarget.value.startsWith('support-')) return -1
  return Number(modalTarget.value.slice('support-'.length))
}

const filteredChars = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  let list = characterCatalog.value

  const slotIndex = getSupportSlotIndex()
  if (slotIndex >= 0) {
    list = list.filter(character => isMasterySupportEligible({
      character,
      mainCharacter: selectedChar.value,
      branch: subTab.value,
      slotIndex,
    }))
  }

  if (!query) return list
  return list.filter(character => getCharacterName(character).toLowerCase().includes(query))
})

const openModal = (target) => {
  modalTarget.value = target
  searchQuery.value = ''
  showCharModal.value = true
}

const selectCharacter = (character) => {
  if (modalTarget.value === 'main') {
    selectedChar.value = character
    supportChars.value = [null, null]
  } else {
    const slotIndex = getSupportSlotIndex()
    if (slotIndex >= 0) {
      const nextSupports = [...supportChars.value]
      nextSupports[slotIndex] = character
      supportChars.value = nextSupports
    }
  }
  showCharModal.value = false
}

const clearSupportSlot = (slotIndex) => {
  const nextSupports = [...supportChars.value]
  nextSupports[slotIndex] = null
  supportChars.value = nextSupports
}

const supportCharDisplays = computed(() => supportRules.value.map((rule, slotIndex) => {
  const character = supportChars.value[slotIndex]
  return {
    character,
    name: character ? getCharacterName(character) : t('mastery.supportCharacter', { number: slotIndex + 1 }),
    imageURL: character?.imageURL || null,
    relation: rule.relation,
    minimumTier: rule.minimumTier,
    progression: rule.progression,
    level: rule.level,
  }
}))

const getSupportRelationLabel = (support) => {
  if (support.relation === 'sameFaction') {
    return t('mastery.sameFactionRequirement', { tier: support.minimumTier })
  }
  if (support.relation === 'sameType') {
    return t('mastery.sameTypeRequirement', { tier: support.minimumTier })
  }
  return t('mastery.minimumTierRequirement', { tier: support.minimumTier })
}

const getSupportProgressionLabel = (support) => {
  if (support.progression === 'awakening') {
    return t('mastery.awakeningRequirement', { level: support.level })
  }
  if (support.progression === 'insignia') {
    return t('mastery.insigniaRequirement', { level: support.level })
  }
  return t('mastery.keepsakeRequirement', { level: support.level })
}

const tierDiff = computed(() => Math.max(0, toTier.value - fromTier.value))

const decreaseFromTier = () => {
  fromTier.value = Math.max(0, fromTier.value - 1)
}

const increaseFromTier = () => {
  fromTier.value = Math.min(10, fromTier.value + 1)
  if (toTier.value < fromTier.value) toTier.value = fromTier.value
}

const decreaseToTier = () => {
  toTier.value = Math.max(1, toTier.value - 1)
  if (fromTier.value > toTier.value) fromTier.value = toTier.value
}

const increaseToTier = () => {
  toTier.value = Math.min(10, toTier.value + 1)
}

const categories = computed(() => masteryConfig.value?.categories || masteryData.categories)

const getTierConfig = (category, tier) => {
  const tiers = categories.value?.[category] || []
  return tiers[tier] || tiers.find(item => item.tier === tier) || null
}

const normalizeStats = (stats = {}) => ({
  atk: Number(stats.atk) || 0,
  def: Number(stats.def ?? stats.atk) || 0,
  hp: Number(stats.hp) || 0,
})

const currentStats = computed(() => normalizeStats(getTierConfig(subTab.value, fromTier.value)?.stats))
const targetStats = computed(() => normalizeStats(getTierConfig(subTab.value, toTier.value)?.stats))

const currentSpecializedPercent = computed(() => subTab.value === 'cap' ? null : fromTier.value * 10)
const targetSpecializedPercent = computed(() => subTab.value === 'cap' ? null : toTier.value * 10)
const currentAdvancedBuff = computed(() => subTab.value === 'cap' ? null : getMasteryAdvancedBuff(fromTier.value))
const targetAdvancedBuff = computed(() => subTab.value === 'cap' ? null : getMasteryAdvancedBuff(toTier.value))

const localizeRequirements = (tier) => {
  const type = getTypeName(selectedChar.value?.type || '')
  const faction = getFactionName(selectedChar.value?.faction || '')

  return (tier.requirements || []).map((condition) => {
    const text = locale.value === 'en' ? condition.textEn : condition.textVi
    const highlight = locale.value === 'en' ? condition.highlightEn : condition.highlightVi
    return {
      text: (text || '').replaceAll('{TYPE}', type).replaceAll('{FACTION}', faction),
      highlight: (highlight || '').replaceAll('{TYPE}', type).replaceAll('{FACTION}', faction),
      color: condition.color,
    }
  })
}

const visibleRequirements = computed(() => {
  if (tierDiff.value === 0) return []
  const requirements = []
  for (let tier = fromTier.value + 1; tier <= toTier.value; tier++) {
    const config = getTierConfig(subTab.value, tier)
    if (config?.requirements?.length) {
      requirements.push({ tier, conditions: localizeRequirements(config) })
    }
  }
  return requirements
})

const getMaterialList = computed(() => {
  if (tierDiff.value === 0) return []
  
  const faction = selectedChar.value.faction || 'Khác'
  const type = selectedChar.value.type || 'Khác'
  const tier = selectedChar.value.tier || 'SSR'

  let pheSuffix = 'Khac'
  if (faction === 'Anh Hùng') pheSuffix = 'Ah'
  if (faction === 'Quái Nhân') pheSuffix = 'Qn'

  let heSuffix = 'VuTrang'
  if (type === 'Giác Đấu') heSuffix = 'Gdau'
  if (type === 'Tâm Linh') heSuffix = 'TamLinh'
  if (type === 'Công Nghệ') heSuffix = 'CNghe'

  const manhPrefix = faction === 'Anh Hùng' ? 'manh_ah' : 'manh_qn'
  let manhSuffix = 'sr'
  if (tier.includes('SSR')) manhSuffix = 'Ssr'
  if (tier.includes('UR')) manhSuffix = 'Ur'

  const sumPhe = { vatlieu: 0, chungchi: 0, the_plus: 0, the_plus_plus: 0, the: 0, vang: 0 }
  const sumHe = { sotay: 0, chungnhan: 0, the_he_he: 0, vatlieu: 0, the: 0, vang: 0 }
  const sumCap = { sotay: 0, manh: 0, chungchi: 0, vang: 0 }

  for (let i = fromTier.value + 1; i <= toTier.value; i++) {
    const p = getTierConfig('phe', i)?.costs
    if (p) {
      sumPhe.vatlieu += p.vatlieu; sumPhe.chungchi += p.chungchi; sumPhe.the_plus += p.the_plus; sumPhe.the_plus_plus += p.the_plus_plus; sumPhe.the += p.the; sumPhe.vang += p.vang
    }
    const h = getTierConfig('he', i)?.costs
    if (h) {
      sumHe.sotay += h.sotay; sumHe.chungnhan += h.chungnhan; sumHe.the_he_he += h.the_he_he; sumHe.vatlieu += h.vatlieu; sumHe.the += h.the; sumHe.vang += h.vang
    }
    const c = getTierConfig('cap', i)?.costs
    if (c) {
      sumCap.sotay += c.sotay; sumCap.manh += c.manh; sumCap.chungchi += c.chungchi; sumCap.vang += c.vang
    }
  }

  if (subTab.value === 'phe') {
    return [
      { name: t('mastery.materialFactionCard'), icon: `/Mastery/The-Phe-${pheSuffix}1.png`, count: sumPhe.the },
      { name: t('mastery.materialFactionCardPlus'), icon: `/Mastery/The-Phe-${pheSuffix}2.png`, count: sumPhe.the_plus },
      { name: t('mastery.materialFactionCardPlusPlus'), icon: `/Mastery/The-Phe-${pheSuffix}3.png`, count: sumPhe.the_plus_plus },
      { name: t('mastery.materialFactionCertificate'), icon: '/Mastery/Chung_nhan_phe.png', count: sumPhe.chungchi },
      { name: t('mastery.materialFactionEssence'), icon: '/Mastery/Vat_Lieu_tinh_thong_phe.png', count: sumPhe.vatlieu },
      { name: t('mastery.gold'), icon: '/Mastery/ico_large_gold.png', count: sumPhe.vang }
    ].filter(i => i.count > 0).map(i => ({ ...i, count: formatNum(i.count) }))
  } else if (subTab.value === 'he') {
    return [
      { name: t('mastery.materialTypeBook'), icon: '/Mastery/so_tay_he.png', count: sumHe.sotay },
      { name: t('mastery.materialTypeCertificate'), icon: '/Mastery/Chung_chi_he.png', count: sumHe.chungnhan },
      { name: t('mastery.materialTypeCardByType'), icon: `/Mastery/the_he_${heSuffix}3.png`, count: sumHe.the_he_he },
      { name: t('mastery.materialTypeEssence'), icon: `/Mastery/the_he_${heSuffix}2.png`, count: sumHe.vatlieu },
      { name: t('mastery.materialTypeCard'), icon: `/Mastery/the_he_${heSuffix}1.png`, count: sumHe.the },
      { name: t('mastery.gold'), icon: '/Mastery/ico_large_gold.png', count: sumHe.vang }
    ].filter(i => i.count > 0).map(i => ({ ...i, count: formatNum(i.count) }))
  } else if (subTab.value === 'cap') {
    return [
      { name: t('mastery.materialTierBook'), icon: '/Mastery/so_tay_cap.png', count: sumCap.sotay },
      { name: t('mastery.materialTierFragment', { faction: getFactionName(faction), tier }), icon: `/Mastery/${manhPrefix}_${manhSuffix}.png`, count: sumCap.manh },
      { name: t('mastery.materialTierCertificate'), icon: '/Mastery/Chung_chi_Cap.png', count: sumCap.chungchi },
      { name: t('mastery.gold'), icon: '/Mastery/ico_large_gold.png', count: sumCap.vang }
    ].filter(i => i.count > 0).map(i => ({ ...i, count: formatNum(i.count) }))
  }
  return []
})

const formatNum = (num) => new Intl.NumberFormat('en-US').format(num)

const getFactionIcon = computed(() => {
  const map = {
    'Anh Hùng': 'Hero',
    'Quái Nhân': 'Monster',
    'Võ Thuật': 'Martial_Artist',
    'Tội Phạm': 'Outlaw'
  }
  const f = map[selectedChar.value.faction] || 'Other'
  return `/Faction/${f}.png`
})

const getTypeIcon = computed(() => {
  const map = {
    'Vũ Trang': 'Duelist',
    'Giác Đấu': 'Grappler',
    'Tâm Linh': 'Esper',
    'Công Nghệ': 'Hi-Tech'
  }
  const t = map[selectedChar.value.type] || 'Duelist'
  return `/Series/${t}.png`
})

const getTierIcon = computed(() => {
  return `/Class/${selectedChar.value.classLevel || 'Class_S'}.png`
})

const getCharacterImage = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/') || /^https?:\/\//.test(filename)) return filename
  return new URL(`../assets/characters/${filename}`, import.meta.url).href
}
const backgearRates = computed(() =>
  calculateBackgearSpecializedRates(specializedBackgears, backgearLevels.value)
)
const ownSpecAttack = computed(() =>
  calculateSpecializedStat(battlePower.value, typeMasteryTier.value, backgearRates.value.attack)
)
const ownSpecDefense = computed(() =>
  calculateSpecializedStat(battlePower.value, factionMasteryTier.value, backgearRates.value.defense)
)
const resolvedEnemyAttack = computed(() =>
  Number(enemySpecAttack.value) > 0 ? Number(enemySpecAttack.value) : ownSpecAttack.value
)
const resolvedEnemyDefense = computed(() =>
  Number(enemySpecDefense.value) > 0 ? Number(enemySpecDefense.value) : ownSpecDefense.value
)
const arenaMatchup = computed(() => calculateArenaMatchup({
  ownAttack: ownSpecAttack.value,
  ownDefense: ownSpecDefense.value,
  enemyAttack: resolvedEnemyAttack.value,
  enemyDefense: resolvedEnemyDefense.value,
}))

const getBackgearName = (gear) => locale.value === 'en' ? gear.nameEn : gear.nameVi
const getBackgearEffect = (gear, level, type) => {
  if (!level) return '0%'
  return gear.levels
    ?.find(item => item.level === Number(level))
    ?.effects?.find(effect => effect.type === type)?.text || '0%'
}
const formatRate = (number) => `${Number(number).toFixed(2).replace(/\.00$/, '')}\u00d7`
const formatDelta = (number) => `${number > 0 ? '+' : ''}${Number(number).toFixed(1).replace(/\.0$/, '')}%`

const resetArenaCalculator = () => {
  battlePower.value = 40000000
  typeMasteryTier.value = 6
  factionMasteryTier.value = 6
  enemySpecAttack.value = ''
  enemySpecDefense.value = ''
  backgearLevels.value = Object.fromEntries(specializedBackgears.map(gear => [gear.id, 0]))
}


</script>

<template>
  <main class="mastery-page mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <header class="mastery-hero">
      <div>
        <p class="mastery-eyebrow">{{ t('mastery.featureTitle') }}</p>
        <h1>{{ t('mastery.title') }}</h1>
        <p>{{ t('mastery.desc') }}</p>
      </div>
      <div class="mastery-facts">
        <span><strong>3</strong>{{ t('mastery.branchCount') }}</span>
        <span><strong>10</strong>{{ t('mastery.tierCount') }}</span>
        <span><strong>PVP</strong>{{ t('mastery.arenaOnly') }}</span>
      </div>
    </header>

    <nav class="mastery-page-tabs" :aria-label="t('mastery.pageSections')">
      <button :class="{ active: pageTab === 'upgrade' }" @click="switchPageTab('upgrade')">
        <b>01</b><span><strong>{{ t('mastery.upgradeTab') }}</strong><small>{{ t('mastery.upgradeTabHint') }}</small></span>
      </button>
      <button :class="{ active: pageTab === 'arena' }" @click="switchPageTab('arena')">
        <b>02</b><span><strong>{{ t('mastery.arenaTab') }}</strong><small>{{ t('mastery.arenaTabHint') }}</small></span>
      </button>
    </nav>
    
    <!-- Tài nguyên nâng cấp -->
    <transition :name="pageTransition" mode="out-in">
    <section v-if="pageTab === 'upgrade'" key="upgrade" class="mastery-upgrade mastery-page-panel">
    <div class="space-y-6">
      <!-- Character Select Box -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div class="flex items-center space-x-4 sm:space-x-6">
          <div @click="openModal('main')" class="w-24 h-32 rounded-lg border border-[#ef4444] overflow-hidden relative cursor-pointer hover:scale-105 transition-transform bg-[#0b0c10]">
            <img :src="getCharacterImage(selectedChar.imageURL)" class="w-full h-full object-cover object-top" onerror="this.style.display='none'"/>
            <div class="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[10px] font-bold text-center py-1 border-t border-[#ef4444]">
              <span class="text-gray-400 mr-1">🔄</span>{{ t('mastery.changeChar') }}
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-black text-white mb-2">{{ getCharacterName(selectedChar) }}</h2>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ selectedChar.tier }}</span>
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ getFactionName(selectedChar.faction) }}</span>
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ getTypeName(selectedChar.type) }}</span>
            </div>
          </div>
        </div>
        
        <transition-group name="mastery-list" tag="div" class="mastery-support-slots">
          <button
            v-for="(support, slotIndex) in supportCharDisplays"
            :key="slotIndex"
            type="button"
            class="mastery-support-card"
            :class="{ selected: support.character }"
            @click="openModal(`support-${slotIndex}`)"
          >
            <span class="mastery-support-avatar">
              <img
                v-if="support.imageURL"
                :src="getCharacterImage(support.imageURL)"
                :alt="support.name"
                @error="$event.currentTarget.style.display = 'none'"
              />
              <b v-else>+</b>
            </span>
            <span class="mastery-support-copy">
              <strong>{{ support.name }}</strong>
              <small>{{ getSupportRelationLabel(support) }}</small>
              <em>&rarr; {{ getSupportProgressionLabel(support) }}</em>
            </span>
            <span
              v-if="support.character"
              class="mastery-support-clear"
              role="button"
              :aria-label="t('mastery.clearSupport', { number: slotIndex + 1 })"
              @click.stop="clearSupportSlot(slotIndex)"
            >&times;</span>
          </button>
        </transition-group>
      </div>

      <!-- Sub Tabs -->
      <div class="grid grid-cols-3 gap-2 pb-2">
        <button 
          @click="switchSubTab('phe')"
          :data-active="subTab === 'phe'"
          class="mastery-branch-tab py-2 sm:py-3 rounded-lg font-bold flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'phe' ? 'bg-[#12131a] border-[#f97316] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getFactionIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabFaction') }}</span>
        </button>
        <button 
          @click="switchSubTab('he')"
          :data-active="subTab === 'he'"
          class="mastery-branch-tab py-2 sm:py-3 rounded-lg font-bold flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'he' ? 'bg-[#12131a] border-[#00d8b6] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getTypeIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabType') }}</span>
        </button>
        <button 
          @click="switchSubTab('cap')"
          :data-active="subTab === 'cap'"
          class="mastery-branch-tab py-2 sm:py-3 rounded-lg font-bold flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'cap' ? 'bg-[#12131a] border-gray-500 text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getTierIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabTier') }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <transition :name="masteryTransition" mode="out-in">
        <div :key="subTab" class="mastery-branch-panel bg-[#12131a] border border-gray-800 rounded-lg p-6">
        <div class="flex items-center space-x-3 mb-8 pb-4 border-b border-gray-800">
          <img :src="subTab === 'phe' ? getFactionIcon : subTab === 'he' ? getTypeIcon : getTierIcon" class="w-12 h-12 object-contain drop-shadow-lg" />
          <div>
            <h3 class="text-white font-bold text-lg">
              {{ subTab === 'phe' ? t('mastery.tabFaction') : subTab === 'he' ? t('mastery.tabType') : t('mastery.tabTier') }}
            </h3>
            <div class="text-[#ef4444] text-xs font-bold">
              {{ subTab === 'phe' ? getFactionName(selectedChar.faction) : subTab === 'he' ? getTypeName(selectedChar.type) : selectedChar.tier }}
            </div>
          </div>
        </div>

        <!-- Tier Selectors -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div class="text-gray-500 text-xs mb-2">{{ t('mastery.fromTier') }}</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="decreaseFromTier" :aria-label="t('mastery.decreaseTier')" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <transition name="tier-pop" mode="out-in">
                <span :key="`from-${fromTier}`" class="text-white font-bold text-sm">{{ fromTier === 0 ? t('mastery.notOpened') : 'Tier ' + fromTier }}</span>
              </transition>
              <button @click="increaseFromTier" :aria-label="t('mastery.increaseTier')" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-xs mb-2">{{ t('mastery.toTier') }}</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="decreaseToTier" :aria-label="t('mastery.decreaseTier')" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <transition name="tier-pop" mode="out-in">
                <span :key="`to-${toTier}`" class="text-white font-bold text-sm">Tier {{ toTier }}</span>
              </transition>
              <button @click="increaseToTier" :aria-label="t('mastery.increaseTier')" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
        </div>

        <!-- Stats Gained -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.statsGained') }}</h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">ATK</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ formatNum(currentStats.atk) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.atk) }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">DEF</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ formatNum(currentStats.def) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.def) }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">HP</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ formatNum(currentStats.hp) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.hp) }}</span>
              </div>
            </div>
            <div v-if="subTab !== 'cap'" class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#a78bfa] font-bold text-sm">
                {{ subTab === 'phe' ? t('mastery.specDef') : t('mastery.specAtk') }}
              </span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ currentSpecializedPercent }}%</span>
                <span class="text-[#a78bfa]">&rarr;</span>
                <span class="text-white font-bold">{{ targetSpecializedPercent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="subTab !== 'cap'" class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.advancedBuff') }}</h4>
          <div class="flex items-center justify-between bg-[#0b0c10] border border-[#a78bfa]/30 rounded-lg px-4 py-3">
            <span class="text-[#a78bfa] font-bold text-sm">
              {{ subTab === 'phe' ? t('mastery.nonCritDmgFree') : t('mastery.instantDmgEvasion') }}
            </span>
            <div class="flex items-center space-x-2 text-sm font-mono">
              <span class="text-gray-500">{{ currentAdvancedBuff }}%</span>
              <span class="text-[#a78bfa]">&rarr;</span>
              <span class="text-white font-bold">{{ targetAdvancedBuff }}%</span>
            </div>
          </div>
        </div>

        <!-- Materials -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.materials') }}</h4>
          <div v-if="tierDiff === 0" class="text-gray-500 text-sm">{{ t('mastery.materialsHint') }}</div>
          <transition-group v-else name="mastery-list" tag="div" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="mat in getMaterialList" :key="mat.name" class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center items-center text-center hover:border-gray-600 transition-colors">
              <img :src="mat.icon" :alt="mat.name" class="w-14 h-14 object-contain mb-2 drop-shadow-lg" onerror="this.src='/placeholder.png'"/>
              <div class="text-gray-400 text-[10px] leading-tight min-h-[24px] flex items-center">{{ mat.name }}</div>
              <div class="text-white font-bold text-sm mt-1" :class="mat.name === t('mastery.gold') ? 'text-[#eab308]' : ''">×{{ mat.count }}</div>
            </div>
          </transition-group>
        </div>

        <!-- Requirements -->
        <div>
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.requirements') }}</h4>
          <div v-if="visibleRequirements.length === 0" class="text-gray-500 text-sm">{{ t('mastery.requirementsHint') }}</div>
          <transition-group v-else name="mastery-list" tag="div" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article
              v-for="requirement in visibleRequirements"
              :key="requirement.tier"
              class="bg-gradient-to-r from-[#1a1c23] to-[#0b0c10] border border-[#f97316]/30 rounded-xl p-5 shadow-lg relative overflow-hidden"
            >
              <div class="absolute top-0 left-0 w-1 h-full bg-[#f97316]"></div>
              <div class="flex items-center space-x-2 mb-4 border-b border-gray-800/50 pb-3">
                <div class="w-6 h-6 rounded-full bg-[#f97316]/20 flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
                </div>
                <h3 class="text-white font-black text-lg">{{ t('mastery.targetTier') }} {{ requirement.tier }}</h3>
              </div>
              <div class="space-y-3">
                <div
                  v-for="(condition, index) in requirement.conditions"
                  :key="index"
                  class="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-gray-800/50"
                >
                  <span class="text-[#f97316] font-bold">&rsaquo;</span>
                  <div class="text-sm text-gray-300 leading-tight">
                    {{ condition.text }}<strong :class="condition.color">{{ condition.highlight }}</strong>
                  </div>
                </div>
              </div>
            </article>
          </transition-group>
        </div>
      </div>
      </transition>
    </div>
    </section>
    <section v-else key="arena" class="arena-lab mastery-page-panel">
      <div class="arena-intro">
        <div>
          <p class="mastery-eyebrow">ARENA LAB</p>
          <h2>{{ t('mastery.specGuideTitle') }}</h2>
          <p>{{ t('mastery.specGuideDesc') }}</p>
        </div>
        <div class="formula-grid">
          <article>
            <span>{{ t('mastery.specAtk') }}</span>
            <code>(30% + {{ t('mastery.typeMasteryShort') }} + Backgear) &times; BP + 1</code>
          </article>
          <article>
            <span>{{ t('mastery.specDef') }}</span>
            <code>(30% + {{ t('mastery.factionMasteryShort') }} + Backgear) &times; BP + 1</code>
          </article>
        </div>
      </div>

      <div class="arena-calculator-grid">
        <section class="arena-card">
          <div class="arena-heading">
            <div><small>01 // INPUT</small><h2>{{ t('mastery.teamInputs') }}</h2></div>
            <button @click="resetArenaCalculator">{{ t('mastery.reset') }}</button>
          </div>
          <label class="arena-number-field">
            <span><strong>BP</strong><small>{{ t('mastery.battlePowerHint') }}</small></span>
            <input v-model.number="battlePower" type="number" min="0" step="100000" inputmode="numeric" />
          </label>
          <label class="arena-range">
            <span><strong>{{ t('mastery.tabType') }}</strong><output>Tier {{ typeMasteryTier }} &rarr; +{{ typeMasteryTier * 10 }}%</output></span>
            <input v-model.number="typeMasteryTier" type="range" min="0" max="10" />
          </label>
          <label class="arena-range">
            <span><strong>{{ t('mastery.tabFaction') }}</strong><output>Tier {{ factionMasteryTier }} &rarr; +{{ factionMasteryTier * 10 }}%</output></span>
            <input v-model.number="factionMasteryTier" type="range" min="0" max="10" />
          </label>
        </section>

        <section class="arena-card arena-results-card">
          <div class="arena-heading"><div><small>02 // RESULT</small><h2>{{ t('mastery.yourSpecializedStats') }}</h2></div></div>
          <div class="specialized-results">
            <article>
              <small>{{ t('mastery.specAtk') }}</small>
              <strong>{{ formatNum(ownSpecAttack) }}</strong>
              <span>{{ t('mastery.fromTypeAndBackgear', { mastery: typeMasteryTier * 10, backgear: backgearRates.attack }) }}</span>
            </article>
            <article>
              <small>{{ t('mastery.specDef') }}</small>
              <strong>{{ formatNum(ownSpecDefense) }}</strong>
              <span>{{ t('mastery.fromFactionAndBackgear', { mastery: factionMasteryTier * 10, backgear: backgearRates.defense }) }}</span>
            </article>
          </div>
          <p class="arena-note">{{ t('mastery.formulaNote') }}</p>
        </section>
      </div>

      <section class="arena-card backgear-calculator">
        <div class="arena-heading">
          <div><small>03 // BACKGEAR</small><h2>{{ t('mastery.backgearTitle') }}</h2></div>
          <p>{{ t('mastery.backgearHint') }}</p>
        </div>
        <div class="mastery-backgear-grid">
          <article v-for="gear in specializedBackgears" :key="gear.id" :class="{ active: backgearLevels[gear.id] > 0 }">
            <img :src="gear.thumbnail" :alt="getBackgearName(gear)" />
            <div>
              <strong>{{ getBackgearName(gear) }}</strong>
              <small>{{ t('mastery.specAtk') }} {{ getBackgearEffect(gear, backgearLevels[gear.id], 'combatoa_up') }}</small>
              <small>{{ t('mastery.specDef') }} {{ getBackgearEffect(gear, backgearLevels[gear.id], 'combatda_up') }}</small>
            </div>
            <select v-model.number="backgearLevels[gear.id]" :aria-label="t('mastery.backgearLevel')">
              <option :value="0">{{ t('mastery.notOwned') }}</option>
              <option v-for="level in gear.levels" :key="level.level" :value="level.level">Lv.{{ level.level }}</option>
            </select>
          </article>
        </div>
        <div class="backgear-total">
          <span>{{ t('mastery.backgearTotal') }}</span>
          <strong>{{ t('mastery.specAtk') }} +{{ backgearRates.attack }}%</strong>
          <strong>{{ t('mastery.specDef') }} +{{ backgearRates.defense }}%</strong>
        </div>
      </section>

      <section class="arena-card matchup-calculator">
        <div class="arena-heading">
          <div><small>04 // MATCHUP</small><h2>{{ t('mastery.matchupTitle') }}</h2></div>
          <p>{{ t('mastery.matchupHint') }}</p>
        </div>
        <div class="enemy-inputs">
          <label><span>{{ t('mastery.enemySpecDef') }}</span><input v-model="enemySpecDefense" type="number" min="0" :placeholder="formatNum(ownSpecDefense)" /></label>
          <label><span>{{ t('mastery.enemySpecAtk') }}</span><input v-model="enemySpecAttack" type="number" min="0" :placeholder="formatNum(ownSpecAttack)" /></label>
        </div>
        <div class="matchup-results">
          <article :class="arenaMatchup.damageDelta >= 0 ? 'positive' : 'negative'">
            <small>{{ t('mastery.damageDealt') }}</small>
            <strong>{{ formatRate(arenaMatchup.damageRate) }}</strong>
            <span>{{ formatDelta(arenaMatchup.damageDelta) }}</span>
            <p>{{ t('mastery.damageFormula') }}</p>
          </article>
          <article :class="arenaMatchup.incomingDelta <= 0 ? 'positive' : 'negative'">
            <small>{{ t('mastery.damageTaken') }}</small>
            <strong>{{ formatRate(arenaMatchup.incomingRate) }}</strong>
            <span>{{ formatDelta(arenaMatchup.incomingDelta) }}</span>
            <p>{{ t('mastery.incomingFormula') }}</p>
          </article>
        </div>
        <div class="rate-scale">
          <span><b>&le; 0.25&times;</b><small>&minus;75%</small></span>
          <span><b>0.5&times;</b><small>&minus;50%</small></span>
          <span class="neutral"><b>1&times;</b><small>0%</small></span>
          <span><b>2&times;</b><small>+100%</small></span>
          <span><b>&ge; 2.5&times;</b><small>+150%</small></span>
        </div>
      </section>

      <aside class="arena-warning">
        <b>!</b>
        <div><strong>{{ t('mastery.arenaWarningTitle') }}</strong><p>{{ t('mastery.arenaWarningText') }}</p></div>
      </aside>
    </section>
    </transition>

    <!-- Character Selection Modal -->
    <transition name="modal-pop">
    <div v-if="showCharModal" class="mastery-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="showCharModal = false">
      <div class="mastery-modal-panel bg-[#12131a] border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0b0c10] rounded-t-xl">
          <h3 class="text-xl font-bold text-white">
            {{ modalTarget === 'main'
              ? t('mastery.selectChar')
              : t('mastery.selectSupportChar', { number: getSupportSlotIndex() + 1 }) }}
          </h3>
          <button @click="showCharModal = false" class="text-gray-400 hover:text-white transition-colors p-2 text-2xl leading-none">&times;</button>
        </div>
        <div class="p-4 bg-[#0b0c10]">
          <input type="text" v-model="searchQuery" :placeholder="t('mastery.searchChar')" class="w-full bg-[#12131a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-opm-gold focus:outline-none transition-colors" />
        </div>
        <div class="flex-1 overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
          <div 
            v-for="char in filteredChars" 
            :key="char.id"
            @click="selectCharacter(char)"
            class="cursor-pointer border border-transparent hover:border-opm-gold rounded-lg bg-[#0b0c10] p-2 flex flex-col items-center transition-all hover:scale-105"
          >
            <div class="w-14 h-14 rounded-full border-2 overflow-hidden mb-2" :class="char.tier.includes('UR') ? 'border-red-500' : char.tier.includes('SSR') ? 'border-yellow-500' : 'border-gray-500'">
              <img :src="getCharacterImage(char.imageURL)" class="w-full h-full object-cover object-top" onerror="this.style.display='none'"/>
            </div>
            <span class="text-[11px] text-center text-white font-bold leading-tight line-clamp-2 w-full">{{ getCharacterName(char) }}</span>
            <span class="text-[10px] text-gray-500 mt-1 font-mono">{{ char.tier }}</span>
          </div>
          
          <div v-if="filteredChars.length === 0" class="col-span-full py-10 text-center text-gray-500">
            {{ t('mastery.noCharFound') }}
          </div>
        </div>
      </div>
    </div>
    </transition>

  </main>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  will-change: opacity, transform, filter;
  transition:
    opacity .46s ease,
    transform .46s cubic-bezier(.2, .82, .2, 1),
    filter .46s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(14px) scale(.99);
}

.slide-left-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: translate3d(52px, 0, 0) scale(.985);
}
.slide-left-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translate3d(-38px, 0, 0) scale(.99);
}

.slide-right-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: translate3d(-52px, 0, 0) scale(.985);
}
.slide-right-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translate3d(38px, 0, 0) scale(.99);
}

.mastery-page-panel,
.mastery-branch-panel {
  transform-origin: 50% 0;
}

.mastery-branch-panel > * {
  animation: mastery-section-rise .46s cubic-bezier(.2, .82, .2, 1) both;
}
.mastery-branch-panel > :nth-child(2) { animation-delay: .04s; }
.mastery-branch-panel > :nth-child(3) { animation-delay: .08s; }
.mastery-branch-panel > :nth-child(4) { animation-delay: .11s; }
.mastery-branch-panel > :nth-child(5) { animation-delay: .14s; }
.mastery-branch-panel > :nth-child(6) { animation-delay: .17s; }

.tier-pop-enter-active,
.tier-pop-leave-active,
.number-pop-enter-active,
.number-pop-leave-active {
  transition: opacity .2s ease, transform .26s cubic-bezier(.2, .9, .25, 1.35);
}
.tier-pop-enter-from,
.number-pop-enter-from {
  opacity: 0;
  transform: translateY(7px) scale(.82);
}
.tier-pop-leave-to,
.number-pop-leave-to {
  opacity: 0;
  transform: translateY(-7px) scale(.88);
}

.mastery-list-enter-active,
.mastery-list-leave-active,
.mastery-list-move {
  transition: opacity .34s ease, transform .38s cubic-bezier(.2, .82, .2, 1);
}
.mastery-list-enter-from,
.mastery-list-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(.96);
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: opacity .3s ease, backdrop-filter .3s ease;
}
.modal-pop-enter-active .mastery-modal-panel,
.modal-pop-leave-active .mastery-modal-panel {
  transition: opacity .3s ease, transform .38s cubic-bezier(.2, .9, .25, 1.12);
}
.modal-pop-enter-from,
.modal-pop-leave-to,
.modal-pop-enter-from .mastery-modal-panel,
.modal-pop-leave-to .mastery-modal-panel {
  opacity: 0;
}
.modal-pop-enter-from .mastery-modal-panel {
  transform: translateY(26px) scale(.94);
}
.modal-pop-leave-to .mastery-modal-panel {
  transform: translateY(12px) scale(.97);
}

@keyframes mastery-section-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes mastery-tab-activate {
  0% { transform: translateY(2px) scale(.985); }
  55% { transform: translateY(-2px) scale(1.012); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes mastery-icon-pulse {
  0%, 100% { filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
  50% { filter: drop-shadow(0 0 9px rgba(94, 226, 255, .8)); transform: scale(1.14); }
}

@keyframes mastery-support-pop {
  0% { transform: scale(.96); box-shadow: 0 0 0 rgba(0, 216, 182, 0); }
  55% { transform: scale(1.025); box-shadow: 0 0 24px rgba(0, 216, 182, .2); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 216, 182, 0); }
}

@keyframes mastery-grid-drift {
  from { background-position: 0 0, 0 0; }
  to { background-position: 42px 42px, 42px 42px; }
}

.mastery-page {
  color: #eaf4ff;
}

.mastery-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, .75fr);
  align-items: end;
  gap: 2rem;
  overflow: hidden;
  margin-bottom: 1rem;
  padding: clamp(1.5rem, 4vw, 2.7rem);
  border: 1px solid #1e4254;
  border-radius: 26px;
  background:
    radial-gradient(circle at 82% 20%, rgba(130, 92, 255, .2), transparent 34%),
    linear-gradient(135deg, #071926, #07111d 62%, #12101d);
}

.mastery-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .12;
  background-image:
    linear-gradient(rgba(80, 216, 255, .3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(80, 216, 255, .3) 1px, transparent 1px);
  background-size: 42px 42px;
  animation: mastery-grid-drift 18s linear infinite;
}

.mastery-hero::after {
  content: '';
  position: absolute;
  width: 240px;
  height: 240px;
  right: 7%;
  top: 50%;
  pointer-events: none;
  border: 1px solid rgba(94, 226, 255, .14);
  border-radius: 50%;
  box-shadow: 0 0 0 34px rgba(94, 226, 255, .025), 0 0 0 72px rgba(124, 92, 255, .025);
  animation: mastery-orbit 16s linear infinite;
}

@keyframes mastery-orbit {
  from { opacity: .45; transform: translateY(-50%) rotate(0deg) scale(.94); }
  50% { opacity: .8; transform: translateY(-50%) rotate(180deg) scale(1.04); }
  to { opacity: .45; transform: translateY(-50%) rotate(360deg) scale(.94); }
}

.mastery-hero > * {
  position: relative;
}

.mastery-eyebrow {
  margin: 0 0 .55rem;
  color: #5ee2ff;
  font-size: .7rem;
  font-weight: 900;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.mastery-hero h1 {
  margin: 0;
  color: white;
  font-size: clamp(2.4rem, 6vw, 4.8rem);
  font-weight: 950;
  line-height: .95;
  letter-spacing: -.05em;
}

.mastery-hero > div > p:last-child {
  max-width: 680px;
  margin: 1rem 0 0;
  color: #9bb2c2;
  line-height: 1.65;
}

.mastery-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .55rem;
}

.mastery-facts span {
  padding: 1rem .45rem;
  border: 1px solid rgba(94, 226, 255, .18);
  border-radius: 14px;
  background: rgba(3, 15, 25, .75);
  color: #7891a3;
  font-size: .6rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}

.mastery-facts strong {
  display: block;
  margin-bottom: .25rem;
  color: #5ee2ff;
  font-size: 1.25rem;
}

.mastery-page-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .65rem;
  margin-bottom: 1.25rem;
  padding: .5rem;
  border: 1px solid #193746;
  border-radius: 18px;
  background: #06131d;
}

.mastery-page-tabs button {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: .75rem;
  padding: .8rem 1rem;
  border: 1px solid transparent;
  border-radius: 13px;
  color: #728b9d;
  text-align: left;
  transition: color .2s, border-color .2s, background .2s, transform .2s;
}

.mastery-page-tabs button:hover {
  color: white;
  transform: translateY(-1px);
}

.mastery-page-tabs button.active {
  border-color: #2f7188;
  color: white;
  background: linear-gradient(135deg, rgba(28, 100, 125, .34), rgba(124, 92, 255, .1));
  box-shadow: inset 0 -2px #5ee2ff;
  animation: mastery-tab-activate .44s cubic-bezier(.2, .82, .2, 1);
}

.mastery-page-tabs b {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #0d3041;
  color: #5ee2ff;
  font: 900 .75rem/1 monospace;
}

.mastery-page-tabs span,
.mastery-page-tabs strong,
.mastery-page-tabs small {
  display: block;
  min-width: 0;
}

.mastery-page-tabs small {
  overflow: hidden;
  margin-top: .2rem;
  color: #6f899b;
  font-size: .7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mastery-branch-tab {
  position: relative;
  overflow: hidden;
  transition: color .24s ease, border-color .24s ease, background-color .24s ease, transform .24s ease, box-shadow .24s ease;
}
.mastery-branch-tab::after {
  content: '';
  position: absolute;
  right: 12%;
  bottom: 0;
  left: 12%;
  height: 2px;
  border-radius: 99px;
  background: linear-gradient(90deg, transparent, #5ee2ff, transparent);
  opacity: 0;
  transform: scaleX(.2);
  transition: opacity .3s ease, transform .36s cubic-bezier(.2, .82, .2, 1);
}
.mastery-branch-tab:hover {
  transform: translateY(-2px);
}
.mastery-branch-tab[data-active='true'] {
  animation: mastery-tab-activate .44s cubic-bezier(.2, .82, .2, 1);
  box-shadow: 0 10px 30px rgba(2, 18, 29, .35);
}
.mastery-branch-tab[data-active='true']::after {
  opacity: 1;
  transform: scaleX(1);
}
.mastery-branch-tab[data-active='true'] img {
  animation: mastery-icon-pulse .55s ease-out;
}

.mastery-upgrade {
  min-width: 0;
}

.arena-lab {
  display: grid;
  gap: 1rem;
}

.arena-intro,
.arena-card {
  border: 1px solid #1d3c4d;
  border-radius: 21px;
  background: #071722;
}

.arena-intro {
  display: grid;
  grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr);
  gap: 2rem;
  padding: clamp(1.25rem, 3vw, 2rem);
}

.arena-intro h2,
.arena-heading h2 {
  margin: 0;
  color: white;
}

.arena-intro h2 {
  font-size: clamp(1.65rem, 4vw, 2.5rem);
}

.arena-intro > div > p:last-child {
  color: #8da5b5;
  line-height: 1.65;
}

.formula-grid {
  display: grid;
  gap: .65rem;
}

.formula-grid article {
  padding: 1rem;
  border: 1px solid #2b4a5b;
  border-left: 3px solid #9d6cff;
  border-radius: 12px;
  background: #06131d;
}

.formula-grid span,
.formula-grid code {
  display: block;
}

.formula-grid span {
  color: #b994ff;
  font-size: .7rem;
  font-weight: 900;
  text-transform: uppercase;
}

.formula-grid code {
  margin-top: .45rem;
  color: #dceafa;
  font-size: .76rem;
  white-space: normal;
}

.arena-calculator-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.arena-card {
  min-width: 0;
  padding: clamp(1.1rem, 3vw, 1.5rem);
}

.arena-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.arena-heading small {
  display: block;
  margin-bottom: .35rem;
  color: #5ee2ff;
  font-size: .68rem;
  font-weight: 900;
  letter-spacing: .13em;
}

.arena-heading h2 {
  font-size: clamp(1.1rem, 2.4vw, 1.45rem);
}

.arena-heading > p {
  max-width: 390px;
  margin: 0;
  color: #7892a4;
  font-size: .75rem;
  line-height: 1.45;
  text-align: right;
}

.arena-heading button {
  color: #5ee2ff;
  font-size: .72rem;
  font-weight: 900;
}

.arena-number-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 190px;
  align-items: center;
  gap: 1rem;
  padding: .8rem 0;
  border-top: 1px solid #193747;
}

.arena-number-field span > strong,
.arena-number-field span > small {
  display: block;
}

.arena-number-field span > small {
  margin-top: .2rem;
  color: #7891a2;
  font-size: .68rem;
}

.arena-card input[type='number'],
.arena-card select {
  width: 100%;
  min-height: 42px;
  border: 1px solid #294b5d;
  border-radius: 10px;
  outline: none;
  background: #091f2c;
  color: white;
  padding: .6rem .7rem;
}

.arena-card input:focus,
.arena-card select:focus {
  border-color: #5ee2ff;
  box-shadow: 0 0 0 3px rgba(94, 226, 255, .1);
}

.arena-range {
  display: block;
  padding: .85rem 0;
  border-top: 1px solid #193747;
}

.arena-range > span {
  display: flex;
  justify-content: space-between;
  gap: .8rem;
  margin-bottom: .65rem;
}

.arena-range strong {
  color: white;
  font-size: .78rem;
}

.arena-range output {
  color: #5ee2ff;
  font-size: .72rem;
  font-weight: 900;
}

.arena-range input {
  width: 100%;
  accent-color: #5ee2ff;
}

.specialized-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .65rem;
}

.specialized-results article {
  min-width: 0;
  padding: 1rem;
  border: 1px solid #2b4a5b;
  border-radius: 14px;
  background: #06131d;
}

.specialized-results small,
.specialized-results strong,
.specialized-results span {
  display: block;
}

.specialized-results small {
  color: #b994ff;
  font-weight: 900;
  text-transform: uppercase;
}

.specialized-results strong {
  overflow-wrap: anywhere;
  margin: .45rem 0;
  color: white;
  font-size: clamp(1.35rem, 3vw, 2rem);
}

.specialized-results span,
.arena-note {
  color: #7f98a8;
  font-size: .68rem;
  line-height: 1.45;
}

.arena-note {
  margin: .75rem 0 0;
}

.mastery-backgear-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .6rem;
}

.mastery-backgear-grid article {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: .65rem;
  min-width: 0;
  padding: .7rem;
  border: 1px solid #213f50;
  border-radius: 13px;
  background: #06131d;
  transition: border-color .2s, transform .2s;
}

.mastery-backgear-grid article.active {
  border-color: #9d6cff;
  transform: translateY(-2px);
}

.mastery-backgear-grid img {
  grid-row: 1 / 3;
  width: 52px;
  height: 52px;
  border-radius: 9px;
  object-fit: cover;
}

.mastery-backgear-grid strong,
.mastery-backgear-grid small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mastery-backgear-grid strong {
  color: white;
  font-size: .75rem;
}

.mastery-backgear-grid small {
  margin-top: .12rem;
  color: #829aa9;
  font-size: .6rem;
}

.mastery-backgear-grid select {
  grid-column: 1 / -1;
  min-height: 36px;
  padding: .35rem .5rem;
  font-size: .7rem;
}

.backgear-total {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  gap: .55rem;
  margin-top: .75rem;
}

.backgear-total span {
  color: #718a9b;
  font-size: .68rem;
  text-transform: uppercase;
}

.backgear-total strong {
  padding: .38rem .65rem;
  border: 1px solid #3a456a;
  border-radius: 999px;
  color: #c6b2ff;
  font-size: .7rem;
}

.enemy-inputs,
.matchup-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .65rem;
}

.enemy-inputs label > span {
  display: block;
  margin-bottom: .35rem;
  color: #87a1b1;
  font-size: .7rem;
  font-weight: 800;
}

.matchup-results {
  margin-top: .8rem;
}

.matchup-results article {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: .2rem .65rem;
  padding: 1rem;
  border: 1px solid #244554;
  border-radius: 14px;
  background: #06131d;
}

.matchup-results small,
.matchup-results p {
  grid-column: 1 / -1;
}

.matchup-results small {
  color: #849baa;
  font-weight: 800;
  text-transform: uppercase;
}

.matchup-results strong {
  color: white;
  font-size: 1.8rem;
}

.matchup-results span {
  align-self: center;
  font-weight: 900;
}

.matchup-results p {
  margin: .2rem 0 0;
  color: #688293;
  font-size: .65rem;
}

.matchup-results .positive span {
  color: #49db93;
}

.matchup-results .negative span {
  color: #ff7168;
}

.rate-scale {
  display: grid;
  grid-template-columns: repeat(5, minmax(72px, 1fr));
  gap: 1px;
  overflow-x: auto;
  margin-top: .8rem;
  border: 1px solid #244554;
  border-radius: 11px;
  background: #244554;
}

.rate-scale span {
  padding: .65rem;
  background: #071722;
  text-align: center;
}

.rate-scale b,
.rate-scale small {
  display: block;
}

.rate-scale b {
  color: white;
  font-size: .68rem;
}

.rate-scale small {
  margin-top: .15rem;
  color: #8299a9;
  font-size: .62rem;
}

.rate-scale .neutral {
  background: #0c2a38;
}

.arena-warning {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: 1rem 1.15rem;
  border: 1px solid #725b24;
  border-radius: 15px;
  background: rgba(122, 86, 13, .13);
}

.arena-warning > b {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 8px;
  background: #f3b839;
  color: #161006;
}

.arena-warning strong {
  color: #ffd36c;
}

.arena-warning p {
  margin: .2rem 0 0;
  color: #a89871;
  font-size: .76rem;
  line-height: 1.5;
}

.mastery-support-slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: .75rem;
  width: min(100%, 540px);
}

.mastery-support-card {
  position: relative;
  display: flex;
  min-height: 88px;
  align-items: center;
  gap: .75rem;
  padding: .75rem;
  border: 1px dashed rgba(234, 179, 8, .45);
  border-radius: 14px;
  background: #0b0c10;
  text-align: left;
  transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
}

.mastery-support-card:hover,
.mastery-support-card:focus-visible {
  border-color: #eab308;
  background: #12131a;
  transform: translateY(-2px);
  outline: none;
}

.mastery-support-card.selected {
  border-style: solid;
  border-color: rgba(0, 216, 182, .7);
  animation: mastery-support-pop .46s cubic-bezier(.2, .82, .2, 1);
}

.mastery-support-avatar {
  display: grid;
  width: 52px;
  height: 60px;
  flex: 0 0 52px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #374151;
  border-radius: 9px;
  background: #1f2937;
}

.mastery-support-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.mastery-support-avatar b {
  color: #eab308;
  font-size: 1.4rem;
}

.mastery-support-copy {
  display: grid;
  min-width: 0;
  gap: .15rem;
}

.mastery-support-copy strong,
.mastery-support-copy small,
.mastery-support-copy em {
  overflow: hidden;
  text-overflow: ellipsis;
}

.mastery-support-copy strong {
  color: #fff;
  font-size: .85rem;
  white-space: nowrap;
}

.mastery-support-copy small {
  color: #9ca3af;
  font-size: .72rem;
}

.mastery-support-copy em {
  color: #eab308;
  font-size: .72rem;
  font-style: normal;
  font-weight: 700;
}

.mastery-support-clear {
  position: absolute;
  top: .35rem;
  right: .45rem;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 50%;
  color: #9ca3af;
  font-size: 1rem;
}

.mastery-support-clear:hover {
  background: rgba(239, 68, 68, .18);
  color: #fca5a5;
}

@media (max-width: 900px) {
  .mastery-hero,
  .arena-intro,
  .arena-calculator-grid {
    grid-template-columns: 1fr;
  }

  .mastery-backgear-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mastery-support-slots {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .mastery-page {
    padding-right: .75rem;
    padding-left: .75rem;
  }

  .mastery-hero {
    padding: 1.2rem;
    border-radius: 20px;
  }

  .mastery-facts span {
    padding: .7rem .25rem;
  }

  .mastery-page-tabs {
    position: sticky;
    z-index: 20;
    top: 76px;
  }

  .mastery-page-tabs button {
    padding: .6rem;
  }

  .mastery-page-tabs b {
    width: 31px;
    height: 31px;
  }

  .mastery-page-tabs small {
    display: none;
  }

  .arena-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: .3rem;
  }

  .arena-heading > p {
    text-align: left;
  }

  .arena-number-field {
    grid-template-columns: 1fr;
    gap: .4rem;
  }

  .specialized-results,
  .mastery-backgear-grid,
  .enemy-inputs,
  .matchup-results {
    grid-template-columns: 1fr;
  }

  .backgear-total {
    justify-content: flex-start;
  }

  .mastery-support-slots {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mastery-hero::before,
  .mastery-hero::after,
  .mastery-branch-panel > *,
  .mastery-page-tabs button.active,
  .mastery-branch-tab[data-active='true'],
  .mastery-branch-tab[data-active='true'] img,
  .mastery-support-card.selected {
    animation: none !important;
  }

  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity .18s linear !important;
  }

  .slide-left-enter-from,
  .slide-left-leave-to,
  .slide-right-enter-from,
  .slide-right-leave-to,
  .fade-enter-from,
  .fade-leave-to {
    filter: none !important;
    transform: none !important;
  }
}

</style>
