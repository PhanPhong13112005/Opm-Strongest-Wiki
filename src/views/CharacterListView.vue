<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'
import CharacterCard from '../components/CharacterCard.vue'

const { t, locale } = useI18n()

const characters = computed(() => locale.value === 'en' ? charactersDataEn : charactersDataVi)
const searchQuery = ref('')
const selectedTier = ref('')
const selectedType = ref('')
const selectedFaction = ref('')

const TIER_ORDER = ['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R', 'N']

const TYPE_MAP_VI = { duelist: 'Vũ Trang', grappler: 'Giác Đấu', esper: 'Tâm Linh', hi_tech: 'Công Nghệ' }
const TYPE_MAP_EN = { duelist: 'Duelist', grappler: 'Grappler', esper: 'Esper', hi_tech: 'Hi-Tech' }

const FACTION_MAP_VI = { hero: 'Anh Hùng', monster: 'Quái Nhân', martial_artist: 'Võ Thuật', outlaw: 'Tội Phạm' }
const FACTION_MAP_EN = { hero: 'Hero', monster: 'Monster', martial_artist: 'Martial Artist', outlaw: 'Outlaw' }

const TYPE_OPTIONS = computed(() => [
  { value: 'duelist', label: t('filters.type.duelist') },
  { value: 'grappler', label: t('filters.type.grappler') },
  { value: 'esper', label: t('filters.type.esper') },
  { value: 'hi_tech', label: t('filters.type.hi_tech') },
])

const FACTION_OPTIONS = computed(() => [
  { value: 'hero', label: t('filters.faction.hero') },
  { value: 'monster', label: t('filters.faction.monster') },
  { value: 'martial_artist', label: t('filters.faction.martial_artist') },
  { value: 'outlaw', label: t('filters.faction.outlaw') },
])

const tierOptions = computed(() => {
  const tiers = new Set(characters.value.map(c => c.tier).filter(Boolean))
  return TIER_ORDER.filter(t => tiers.has(t))
})

const filteredCharacters = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return characters.value.filter(c => {
    if (query && !c.name.toLowerCase().includes(query)) return false
    if (selectedTier.value && c.tier !== selectedTier.value) return false
    
    if (selectedType.value) {
      const expectedType = locale.value === 'en' ? TYPE_MAP_EN[selectedType.value] : TYPE_MAP_VI[selectedType.value]
      if (c.type !== expectedType) return false
    }
    
    if (selectedFaction.value) {
      const expectedFaction = locale.value === 'en' ? FACTION_MAP_EN[selectedFaction.value] : FACTION_MAP_VI[selectedFaction.value]
      if (c.faction !== expectedFaction) return false
    }
    
    return true
  })
})
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-6 tracking-wider uppercase">{{ t('list.title') }}</h2>
      
      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-2">
        <input 
          type="text" 
          v-model="searchQuery"
          :placeholder="t('list.search')" 
          class="flex-1 bg-[#1a1c23] text-white border border-gray-700 rounded-md py-2 px-4 focus:outline-none focus:border-opm-gold transition-colors"
        />
        <div class="flex gap-2">
          <select
            v-model="selectedTier"
            class="bg-[#1a1c23] text-white border border-gray-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-opm-gold transition-colors"
          >
            <option value="">{{ t('list.tier_all') }}</option>
            <option v-for="tier in tierOptions" :key="tier" :value="tier">{{ t('list.tier') }}: {{ tier }}</option>
          </select>
          <select
            v-model="selectedType"
            class="bg-[#1a1c23] text-white border border-gray-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-opm-gold transition-colors"
          >
            <option value="">{{ t('list.type_all') }}</option>
            <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ t('list.type') }}: {{ opt.label }}</option>
          </select>
          <select
            v-model="selectedFaction"
            class="bg-[#1a1c23] text-white border border-gray-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-opm-gold transition-colors"
          >
            <option value="">{{ t('list.faction_all') }}</option>
            <option v-for="opt in FACTION_OPTIONS" :key="opt.value" :value="opt.value">{{ t('list.faction') }}: {{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div class="text-gray-500 text-sm mb-6">{{ filteredCharacters.length }}/{{ characters.length }}</div>
    </div>

    <!-- Character Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <router-link 
        v-for="char in filteredCharacters" 
        :key="char.id" 
        :to="'/character/' + char.id"
      >
        <CharacterCard :character="char" />
      </router-link>
    </div>
  </main>
</template>
