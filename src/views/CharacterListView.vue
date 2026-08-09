<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'
import CharacterCard from '../components/CharacterCard.vue'
import { safeAssetUrl } from '../utils/assetUrl'
import { getCharacters, matchesCharacterSearch } from '../services/characterApi'

const { t, locale } = useI18n()

const localCharacters = computed(() => locale.value === 'en' ? charactersDataEn : charactersDataVi)
const searchCharacters = computed(() => locale.value === 'en' ? charactersDataVi : charactersDataEn)
const searchCharactersById = computed(() => new Map(
  searchCharacters.value.map(character => [character.id, character]),
))
const searchInputValue = ref('')
const searchQuery = ref('')
const showSuggestions = ref(false)
const searchContainerRef = ref(null)

const selectedTier = ref('')
const selectedType = ref('')
const selectedFaction = ref('')
const currentPage = ref(1)
const itemsPerPage = 12
const paginatedCharacters = ref([])
const totalItems = ref(0)
let activeRequest = 0
let refreshTimer

const TIER_ORDER = ['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R', 'N']

const TYPE_MAP_VI = { duelist: 'Vũ Trang', grappler: 'Giác Đấu', esper: 'Tâm Linh', hi_tech: 'Công Nghệ' }
const TYPE_MAP_EN = { duelist: 'Duelist', grappler: 'Grappler', esper: 'Esper', hi_tech: 'Hi-Tech' }

const FACTION_MAP_VI = { hero: 'Anh Hùng', monster: 'Quái Nhân', martial_artist: 'Võ Thuật', outlaw: 'Tội Phạm', other: 'Khác' }
const FACTION_MAP_EN = { hero: 'Hero', monster: 'Monster', martial_artist: 'Martial Artist', outlaw: 'Outlaw', other: 'Other' }

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
  { value: 'other', label: t('filters.faction.other') },
])

const tierOptions = computed(() => {
  const tiers = new Set(localCharacters.value.map(c => c.tier).filter(Boolean))
  return TIER_ORDER.filter(t => tiers.has(t))
})

const suggestions = computed(() => {
  const query = searchInputValue.value.trim().toLowerCase()
  if (!query) return []

  return localCharacters.value
    .filter(c => matchesCharacterSearch(c, query, searchCharactersById.value.get(c.id)))
    .slice(0, 8)
})

const onSearchSubmit = () => {
  searchQuery.value = searchInputValue.value.trim()
  showSuggestions.value = false
}

const clearSearch = () => {
  searchInputValue.value = ''
  searchQuery.value = ''
  showSuggestions.value = false
}

const handleDocumentClick = (e) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target)) {
    showSuggestions.value = false
  }
}

const getTierBadgeClass = (tier) => {
  switch (tier) {
    case 'UR+': return 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm font-black'
    case 'UR': return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold'
    case 'SSR+': return 'bg-amber-500 text-black font-extrabold'
    case 'SSR': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-bold'
    case 'SR': return 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
    case 'R': return 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-medium'
    default: return 'bg-gray-700 text-gray-300 font-medium'
  }
}

const parseReleaseDate = (value) => {
  if (!value) return null
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  return match ? Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null
}

const getReleaseTime = (character) => parseReleaseDate(
  character.releaseSea || character.releaseDate || character.releaseTrung,
)

const filteredLocalCharacters = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return localCharacters.value.filter(c => {
    if (query && !matchesCharacterSearch(c, query, searchCharactersById.value.get(c.id))) return false
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
  }).sort((left, right) => {
    const leftRelease = getReleaseTime(left)
    const rightRelease = getReleaseTime(right)

    if (leftRelease === null && rightRelease !== null) return 1
    if (leftRelease !== null && rightRelease === null) return -1
    if (leftRelease !== rightRelease) return rightRelease - leftRelease
    return left.name.localeCompare(right.name, locale.value)
  })
})

const transitionName = ref('fade')

const applyLocalFallback = () => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  totalItems.value = filteredLocalCharacters.value.length
  paginatedCharacters.value = filteredLocalCharacters.value.slice(start, end)
}

const loadCharacters = async () => {
  const requestId = ++activeRequest
  const typeMap = locale.value === 'en' ? TYPE_MAP_EN : TYPE_MAP_VI
  const factionMap = locale.value === 'en' ? FACTION_MAP_EN : FACTION_MAP_VI

  try {
    const result = await getCharacters({
      language: locale.value,
      search: searchQuery.value.trim(),
      tier: selectedTier.value,
      type: selectedType.value ? typeMap[selectedType.value] : '',
      faction: selectedFaction.value ? factionMap[selectedFaction.value] : '',
      page: currentPage.value,
      pageSize: itemsPerPage,
      sort: 'release_desc',
      localCharacters: localCharacters.value,
      searchCharacters: searchCharacters.value,
    })

    if (requestId !== activeRequest) return
    paginatedCharacters.value = result.items
    totalItems.value = result.totalCount
  } catch {
    if (requestId !== activeRequest) return
    applyLocalFallback()
  }
}

const scheduleLoad = (delay = 0) => {
  activeRequest += 1
  window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(loadCharacters, delay)
}

watch([locale, searchQuery, selectedTier, selectedType, selectedFaction], () => {
  transitionName.value = 'fade'
  if (currentPage.value !== 1) currentPage.value = 1
  scheduleLoad(0)
})

watch(currentPage, () => scheduleLoad())

const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    transitionName.value = page > currentPage.value ? 'slide-left' : 'slide-right'
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const safeUrl = safeAssetUrl

const preloadedDetails = new Set()

watch(paginatedCharacters, (newChars) => {
  setTimeout(() => {
    newChars.forEach(char => {
      if (!preloadedDetails.has(char.id)) {
        preloadedDetails.add(char.id);
        const url = char.imageURL;
        if (url) {
          const img = new Image();
          img.src = safeUrl(url);
        }
      }
    })
  }, 500)
}, { immediate: true })

onMounted(() => {
  loadCharacters()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-6 tracking-wider uppercase">{{ t('list.title') }}</h2>
      
      <!-- Filters -->
      <div class="flex flex-col md:flex-row gap-4 mb-2">
        <div class="relative flex-1" ref="searchContainerRef">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input 
                type="text" 
                v-model="searchInputValue"
                @focus="showSuggestions = true"
                @keydown.enter="onSearchSubmit"
                @keydown.esc="showSuggestions = false"
                :placeholder="t('list.search')" 
                class="w-full bg-[#1a1c23] text-white border border-gray-700 rounded-md py-2 pl-4 pr-10 focus:outline-none focus:border-opm-gold transition-colors text-sm sm:text-base"
              />
              <button 
                v-if="searchInputValue"
                @click="clearSearch"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                title="Xóa"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <button
              @click="onSearchSubmit"
              type="button"
              class="bg-opm-gold text-black font-bold px-5 py-2 rounded-md hover:bg-yellow-400 transition-colors flex items-center gap-2 whitespace-nowrap shadow-md cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <span>{{ t('list.search_btn') }}</span>
            </button>
          </div>

          <!-- Dropdown Suggestions -->
          <div 
            v-if="showSuggestions && suggestions.length > 0"
            class="absolute left-0 right-0 top-full mt-1.5 bg-[#14161d]/95 border border-opm-gold/40 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-md max-h-[380px] overflow-y-auto divide-y divide-gray-800/80"
          >
            <div class="px-3.5 py-1.5 bg-black/50 text-[11px] font-semibold text-opm-gold uppercase tracking-wider flex justify-between items-center border-b border-gray-800">
              <span>{{ t('list.suggestions') }} ({{ suggestions.length }})</span>
              <span class="text-gray-400 font-normal normal-case text-[11px]">{{ t('list.press_enter') }}</span>
            </div>
            <router-link
              v-for="sugg in suggestions"
              :key="sugg.id"
              :to="'/character/' + sugg.id"
              @click="showSuggestions = false"
              class="flex items-center gap-3.5 px-3.5 py-2.5 hover:bg-opm-gold/10 transition-colors group"
            >
              <img 
                :src="safeUrl(sugg.imageURL)" 
                :alt="sugg.name"
                class="w-10 h-10 rounded-md object-cover bg-black/60 border border-gray-700 group-hover:border-opm-gold transition-colors flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-white group-hover:text-opm-gold transition-colors truncate">
                  {{ sugg.name }}
                </div>
                <div class="text-xs text-gray-400 flex items-center gap-2 truncate">
                  <span>{{ sugg.type }}</span>
                  <span class="text-gray-600">•</span>
                  <span>{{ sugg.faction }}</span>
                </div>
              </div>
              <span 
                class="text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0"
                :class="getTierBadgeClass(sugg.tier)"
              >
                {{ sugg.tier }}
              </span>
            </router-link>
          </div>
        </div>

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
      <div class="text-gray-500 text-sm mb-6">{{ totalItems }}/{{ localCharacters.length }}</div>
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
