<script setup>
import { ref, computed, watch } from 'vue'
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

const currentPage = ref(1)
const itemsPerPage = 12

const transitionName = ref('fade')

watch([searchQuery, selectedTier, selectedType, selectedFaction], () => {
  transitionName.value = 'fade'
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredCharacters.value.length / itemsPerPage))

const paginatedCharacters = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCharacters.value.slice(start, end)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    transitionName.value = page > currentPage.value ? 'slide-left' : 'slide-right'
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const safeUrl = (url) => {
  if (!url) return ''
  return encodeURI(url).replace(/\+/g, '%2B').replace(/#/g, '%23')
}

const preloadedDetails = new Set()

watch(paginatedCharacters, (newChars) => {
  setTimeout(() => {
    newChars.forEach(char => {
      if (!preloadedDetails.has(char.id)) {
        preloadedDetails.add(char.id);
        const url = char.imageURL;
        if (url) {
          let finalUrl = url;
          const match = url.match(/\/Characters\/(.+?)\//);
          if (match) {
            const folderName = match[1];
            const baseName = folderName.replace(' (URplus)', '_URplus').replace(' (UR+)', '_URplus').replace(' (UR)', '_Ur').replace(' (SSR+)', '_SSR+').replace(' (SSR)', '').replace(' (SR)', '');
            finalUrl = `/Characters/Full_Background/${baseName}.png`;
          }
          const img = new Image();
          img.src = safeUrl(finalUrl);
        }
      }
    })
  }, 500)
}, { immediate: true })
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
    <transition :name="transitionName" mode="out-in">
      <div :key="currentPage" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 min-h-[600px] content-start">
        <router-link 
          v-for="char in paginatedCharacters" 
          :key="char.id" 
          :to="'/character/' + char.id"
        >
          <CharacterCard :character="char" />
        </router-link>
      </div>
    </transition>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 mt-12 mb-4">
      <button 
        @click="goToPage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-[#1a1c23] border border-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        &laquo;
      </button>
      
      <div class="flex space-x-1">
        <template v-for="page in totalPages" :key="page">
          <button 
            v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1"
            @click="goToPage(page)"
            class="w-10 h-10 rounded-md flex items-center justify-center font-bold transition-colors border border-gray-700"
            :class="currentPage === page ? 'bg-opm-gold text-black border-opm-gold' : 'bg-[#1a1c23] text-white hover:bg-gray-800'"
          >
            {{ page }}
          </button>
          <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="w-10 h-10 flex items-center justify-center text-gray-500">
            ...
          </span>
        </template>
      </div>

      <button 
        @click="goToPage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-[#1a1c23] border border-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        &raquo;
      </button>
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
