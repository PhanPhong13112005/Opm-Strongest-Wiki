<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'
import masteryData from '../data/mastery.json'
import { getAllCharacters } from '../services/characterApi'
import { getMasteryConfig } from '../services/masteryApi'

const { t, locale } = useI18n()
const route = useRoute()

const subTab = ref('phe') // 'phe', 'he', 'cap'
const masteryTransition = ref('fade')
const subTabOrder = ['phe', 'he', 'cap']

const switchSubTab = (tab) => {
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
}

const fromTier = ref(0)
const toTier = ref(1)

const showCharModal = ref(false)
const modalTarget = ref('main')
const searchQuery = ref('')
const characterCatalog = ref(charactersDataVi)
const masteryConfig = ref(masteryData)

const defaultChar = charactersDataVi.find(c => c.name.includes('Zombieman') && c.tier === 'UR+') || charactersDataVi[0]
const selectedChar = ref(charactersDataVi.find(c => c.id === route.query.character) || defaultChar)
const supportChar = ref(null)

const loadMasteryPageData = async () => {
  const [charactersResult, masteryResult] = await Promise.allSettled([
    getAllCharacters('vi', charactersDataVi),
    getMasteryConfig(),
  ])

  if (charactersResult.status === 'fulfilled' && charactersResult.value.length) {
    characterCatalog.value = charactersResult.value
    selectedChar.value = characterCatalog.value.find(c => c.id === selectedChar.value?.id) || selectedChar.value
    if (supportChar.value) {
      supportChar.value = characterCatalog.value.find(c => c.id === supportChar.value.id) || supportChar.value
    }
  }

  if (masteryResult.status === 'fulfilled' && masteryResult.value?.categories) {
    masteryConfig.value = masteryResult.value
  }
}

onMounted(loadMasteryPageData)

watch(() => route.query.character, (characterId) => {
  if (!characterId) return
  const character = characterCatalog.value.find(c => c.id === characterId)
  if (!character) return
  selectedChar.value = character
  supportChar.value = null
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

const filteredChars = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  
  let list = characterCatalog.value
  if (modalTarget.value === 'support' && selectedChar.value) {
    list = list.filter(c => c.faction === selectedChar.value.faction && !['N', 'R'].includes(c.tier))
  }

  if (!query) return list
  return list.filter(c => getCharacterName(c).toLowerCase().includes(query))
})

const openModal = (target) => {
  modalTarget.value = target
  showCharModal.value = true
}

const selectCharacter = (char) => {
  if (modalTarget.value === 'main') {
    selectedChar.value = char
    if (supportChar.value && supportChar.value.faction !== char.faction) {
      supportChar.value = null
    }
  } else {
    supportChar.value = char
  }
  showCharModal.value = false
}

const supportCharDisplay = computed(() => {
  if (supportChar.value) {
    return {
      name: getCharacterName(supportChar.value),
      imageURL: supportChar.value.imageURL,
      tier: '≥ SR',
      awaken: 5,
      color: t('mastery.colorPurple')
    }
  }
  return {
    name: t('mastery.factionChar', { faction: getFactionName(selectedChar.value.faction || '') }),
    imageURL: null,
    tier: '≥ SR',
    awaken: 5,
    color: t('mastery.colorPurple')
  }
})

const tierDiff = computed(() => Math.max(0, toTier.value - fromTier.value))

const categories = computed(() => masteryConfig.value?.categories || masteryData.categories)

const getTierConfig = (category, tier) => {
  const tiers = categories.value?.[category] || []
  return tiers[tier] || tiers.find(item => item.tier === tier) || null
}

const currentStats = computed(() => getTierConfig(subTab.value, fromTier.value)?.stats || { atk: 0, hp: 0 })
const targetStats = computed(() => getTierConfig(subTab.value, toTier.value)?.stats || { atk: 0, hp: 0 })

const targetRequirement = computed(() => {
  if (tierDiff.value === 0) return null

  const tier = getTierConfig(subTab.value, toTier.value)
  if (!tier?.requirements?.length) return null

  const type = getTypeName(selectedChar.value?.type || '')
  const faction = getFactionName(selectedChar.value?.faction || '')

  return tier.requirements.map((condition) => {
    const text = locale.value === 'en' ? condition.textEn : condition.textVi
    const highlight = locale.value === 'en' ? condition.highlightEn : condition.highlightVi

    return {
      text: (text || '').replaceAll('{TYPE}', type).replaceAll('{FACTION}', faction),
      highlight: (highlight || '').replaceAll('{TYPE}', type).replaceAll('{FACTION}', faction),
      color: condition.color,
    }
  })
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
  if (filename.startsWith('/')) return filename
  return new URL(`../assets/characters/${filename}`, import.meta.url).href
}

</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
    <div class="text-center mb-12">
      <h3 class="text-gray-400 uppercase tracking-widest text-xs mb-2">{{ t('mastery.featureTitle') }}</h3>
      <h1 class="text-4xl font-black text-white mb-2">{{ t('mastery.title') }}</h1>
      <p class="text-gray-400">{{ t('mastery.desc') }}</p>
    </div>
    
    <!-- Tài nguyên nâng cấp -->
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
        
        <div @click="openModal('support')" class="w-full md:w-auto flex items-center space-x-3 bg-[#0b0c10] border border-gray-800 rounded-xl p-4 border-dashed border-[#f97316]/50 cursor-pointer hover:bg-[#12131a] transition-colors">
          <div v-if="!supportCharDisplay.imageURL" class="w-8 h-8 rounded bg-[#1f2937] flex items-center justify-center border border-gray-700 shrink-0">
            <span class="text-[#ef4444] font-bold">+</span>
          </div>
          <div v-else class="w-8 h-8 rounded bg-[#1f2937] overflow-hidden border border-gray-700 flex items-center justify-center">
            <img :src="getCharacterImage(supportCharDisplay.imageURL)" class="w-full h-full object-cover object-top" onerror="this.style.display='none'"/>
          </div>
          <div>
            <div class="text-white font-bold text-sm">{{ supportCharDisplay.name }}</div>
            <div class="text-gray-400 text-xs">{{ t('mastery.sameFaction') }} · {{ supportCharDisplay.tier }}</div>
            <div class="text-[#eab308] text-xs">→ {{ t('mastery.awaken') }} {{ supportCharDisplay.awaken }}★ ({{ supportCharDisplay.color }})</div>
          </div>
        </div>
      </div>

      <!-- Sub Tabs -->
      <div class="grid grid-cols-3 gap-2 pb-2">
        <button 
          @click="switchSubTab('phe')"
          class="py-2 sm:py-3 rounded-lg font-bold transition-colors flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'phe' ? 'bg-[#12131a] border-[#f97316] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getFactionIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabFaction') }}</span>
        </button>
        <button 
          @click="switchSubTab('he')"
          class="py-2 sm:py-3 rounded-lg font-bold transition-colors flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'he' ? 'bg-[#12131a] border-[#00d8b6] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getTypeIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabType') }}</span>
        </button>
        <button 
          @click="switchSubTab('cap')"
          class="py-2 sm:py-3 rounded-lg font-bold transition-colors flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'cap' ? 'bg-[#12131a] border-gray-500 text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getTierIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabTier') }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <transition :name="masteryTransition" mode="out-in">
        <div :key="subTab" class="bg-[#12131a] border border-gray-800 rounded-lg p-6">
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
              <button @click="fromTier = Math.max(0, fromTier - 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <span class="text-white font-bold text-sm">{{ fromTier === 0 ? t('mastery.notOpened') : 'Tier ' + fromTier }}</span>
              <button @click="fromTier = Math.min(toTier - 1, fromTier + 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-xs mb-2">{{ t('mastery.toTier') }}</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="toTier = Math.max(fromTier + 1, toTier - 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <span class="text-white font-bold text-sm">Tier {{ toTier }}</span>
              <button @click="toTier = Math.min(10, toTier + 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
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
                <span class="text-gray-500">{{ formatNum(currentStats.atk) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.atk) }}</span>
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
          </div>
        </div>

        <!-- Materials -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.materials') }}</h4>
          <div v-if="tierDiff === 0" class="text-gray-500 text-sm">{{ t('mastery.materialsHint') }}</div>
          <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="mat in getMaterialList" :key="mat.name" class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center items-center text-center hover:border-gray-600 transition-colors">
              <img :src="mat.icon" :alt="mat.name" class="w-14 h-14 object-contain mb-2 drop-shadow-lg" onerror="this.src='/placeholder.png'"/>
              <div class="text-gray-400 text-[10px] leading-tight min-h-[24px] flex items-center">{{ mat.name }}</div>
              <div class="text-white font-bold text-sm mt-1" :class="mat.name === t('mastery.gold') ? 'text-[#eab308]' : ''">×{{ mat.count }}</div>
            </div>
          </div>
        </div>

        <!-- Requirements -->
        <div>
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.requirements') }}</h4>
          <div v-if="!targetRequirement" class="text-gray-500 text-sm">{{ t('mastery.requirementsHint') }}</div>
          <div v-else class="bg-gradient-to-r from-[#1a1c23] to-[#0b0c10] border border-[#f97316]/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-[#f97316]"></div>
            <div class="flex items-center justify-between mb-4 border-b border-gray-800/50 pb-3">
              <div class="flex items-center space-x-2">
                <div class="w-6 h-6 rounded-full bg-[#f97316]/20 flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
                </div>
                <h3 class="text-white font-black text-lg">{{ t('mastery.targetTier') }} {{ toTier }}</h3>
              </div>
              <span class="text-[10px] uppercase tracking-wider text-gray-500 bg-black/40 px-2 py-1 rounded border border-gray-800 hidden sm:block">{{ t('mastery.mergedConditions') }}</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="(cond, index) in targetRequirement" :key="index" class="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-gray-800/50 hover:border-gray-600 transition-colors">
                <div class="text-[#f97316] mt-0.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="text-sm text-gray-300 leading-tight">
                  {{ cond.text }}<strong :class="cond.color">{{ cond.highlight }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </transition>
    </div>

    <!-- Character Selection Modal -->
    <div v-if="showCharModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="showCharModal = false">
      <div class="bg-[#12131a] border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0b0c10] rounded-t-xl">
          <h3 class="text-xl font-bold text-white">{{ t('mastery.selectChar') }}</h3>
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

  </main>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
