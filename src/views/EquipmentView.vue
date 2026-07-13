<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import charactersVi from '../data/characters.json'
import charactersEn from '../data/characters_en.json'

const props = defineProps({
  kind: { type: String, required: true },
  id: { type: String, default: '' }
})

const { t, locale } = useI18n()
const search = ref('')
const tierFilter = ref('')
const factionFilter = ref('')
const typeFilter = ref('')
const currentPage = ref(1)
const pageSize = 12
const isKeepsake = computed(() => props.kind === 'keepsake')
const title = computed(() => t(isKeepsake.value ? 'equipment.keepsakeTitle' : 'equipment.insigniaTitle'))
const description = computed(() => t(isKeepsake.value ? 'equipment.keepsakeDesc' : 'equipment.insigniaDesc'))
const insigniaClasses = ['A', 'B', 'C', 'Class_S', 'Class_SS', 'Demon', 'Dragon', 'Martial_Artist', 'Outlaw', 'Tiger']
const insigniaItems = insigniaClasses.map(classLevel => ({
  id: `insignia-${classLevel}`,
  classLevel,
  name: classLevel,
  tier: '',
  faction: '',
  type: ''
}))

const localized = (character) => {
  if (locale.value !== 'en') return character
  return charactersEn.find(item => item.id === character.id) || character
}

const displayFaction = (faction) => ({
  'Anh Hùng': t('filters.faction.hero'),
  'Quái Nhân': t('filters.faction.monster'),
  'Võ Thuật': t('filters.faction.martial_artist'),
  'Tội Phạm': t('filters.faction.outlaw'),
  'Ác Nhân': t('filters.faction.villain')
}[faction] || faction)

const displayType = (type) => ({
  'Vũ Trang': t('filters.type.duelist'),
  'Giác Đấu': t('filters.type.grappler'),
  'Tâm Linh': t('filters.type.esper'),
  'Công Nghệ': t('filters.type.hi_tech')
}[type] || type)

const displayName = (item) => {
  if (isKeepsake.value) return localized(item).name
  const names = {
    A: ['Huy Hiệu A', 'A Insignia'],
    B: ['Huy Hiệu B', 'B Insignia'],
    C: ['Huy Hiệu C', 'C Insignia'],
    Class_S: ['Huy Hiệu S', 'S Insignia'],
    Class_SS: ['Huy Hiệu SS', 'SS Insignia'],
    Demon: ['Huy Hiệu Quỷ', 'Demon Insignia'],
    Dragon: ['Huy Hiệu Rồng', 'Dragon Insignia'],
    Martial_Artist: ['Huy Hiệu Võ Thuật', 'Martial Artist Insignia'],
    Outlaw: ['Huy Hiệu Tội Phạm', 'Outlaw Insignia'],
    Tiger: ['Huy Hiệu Hổ', 'Tiger Insignia']
  }
  return names[item.classLevel]?.[locale.value === 'en' ? 1 : 0] || item.name
}

const getImage = (character) => {
  if (isKeepsake.value && character.keepsakeIcon) return character.keepsakeIcon
  if (!isKeepsake.value) return `/Class/${character.classLevel || 'Other'}.png`
  if (!character.imageURL) return ''
  return character.imageURL.startsWith('/')
    ? character.imageURL
    : new URL(`../assets/characters/${character.imageURL}`, import.meta.url).href
}

const sourceFor = (character) => {
  const isUr = character.tier?.includes('UR')
  if (isKeepsake.value) return isUr ? t('equipment.keepsakeSourceUr') : t('equipment.keepsakeSource')
  return isUr ? t('equipment.insigniaSourceUr') : t('equipment.insigniaSource')
}

const baseItems = computed(() => {
  const base = isKeepsake.value
    ? charactersVi.filter(character => character.keepsakeIcon)
    : insigniaItems
  return base
})

const tierOptions = computed(() => [...new Set(baseItems.value.map(character => character.tier))].sort())
const factionOptions = computed(() => [...new Set(baseItems.value.map(character => character.faction))].sort())
const typeOptions = computed(() => [...new Set(baseItems.value.map(character => character.type))].sort())

const items = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return baseItems.value.filter(character =>
    displayName(character).toLowerCase().includes(keyword) &&
    (!tierFilter.value || character.tier === tierFilter.value) &&
    (!factionFilter.value || character.faction === factionFilter.value) &&
    (!typeFilter.value || character.type === typeFilter.value)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))
const paginatedItems = computed(() => items.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const transitionName = ref('fade')
const goToPage = (page) => {
  if (page === currentPage.value) return
  transitionName.value = page > currentPage.value ? 'slide-left' : 'slide-right'
  currentPage.value = page
}
watch([search, tierFilter, factionFilter, typeFilter, isKeepsake], () => { currentPage.value = 1 })
watch(totalPages, (total) => { if (currentPage.value > total) currentPage.value = total })

const item = computed(() => isKeepsake.value
  ? charactersVi.find(character => character.id === props.id)
  : insigniaItems.find(insignia => insignia.id === props.id)
)
const itemName = computed(() => {
  if (!item.value) return ''
  return isKeepsake.value ? `${displayName(item.value)} ${t('detail.keepsake')}` : displayName(item.value)
})
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <template v-if="id && item">
      <RouterLink :to="isKeepsake ? '/keepsakes' : '/insignias'" class="mb-6 inline-flex text-sm font-bold text-gray-400 hover:text-white">← {{ t('equipment.backToList') }}</RouterLink>
      <section class="grid gap-8 rounded-2xl border border-gray-800 bg-[#12131a] p-6 md:grid-cols-[280px_1fr] md:p-10">
        <div class="flex min-h-64 items-center justify-center rounded-xl bg-[#0b0c10] p-6">
          <img :src="getImage(item)" :alt="itemName" class="max-h-56 max-w-full object-contain" />
        </div>
        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-opm-gold">{{ title }}</p>
          <h1 class="mb-3 text-3xl font-black text-white">{{ itemName }}</h1>
          <div class="mb-8 flex flex-wrap gap-2 text-xs font-bold">
            <span v-if="isKeepsake" class="rounded-full border border-gray-700 bg-[#0b0c10] px-3 py-1 text-gray-300">{{ localized(item).tier }}</span>
            <span v-if="isKeepsake" class="rounded-full border border-gray-700 bg-[#0b0c10] px-3 py-1 text-gray-300">{{ displayFaction(item.faction) }}</span>
          </div>
          <div class="rounded-xl border border-opm-gold/30 bg-opm-gold/5 p-5">
            <h2 class="mb-2 text-sm font-black uppercase tracking-wider text-opm-gold">{{ t('equipment.whereToGet') }}</h2>
            <p class="text-gray-200">{{ sourceFor(item) }}</p>
          </div>
        </div>
      </section>
    </template>

    <template v-else>
      <header class="mb-8 max-w-3xl">
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-opm-gold">OPM Database</p>
        <h1 class="text-4xl font-black text-white">{{ title }}</h1>
        <p class="mt-3 text-gray-400">{{ description }}</p>
      </header>
      <div v-if="isKeepsake" class="mb-6 grid gap-3 md:grid-cols-4">
        <input v-model="search" :placeholder="t('equipment.search')" class="rounded-xl border border-gray-800 bg-[#12131a] px-4 py-3 text-white outline-none transition-colors focus:border-opm-gold" />
        <select v-model="tierFilter" class="rounded-xl border border-gray-800 bg-[#12131a] px-4 py-3 text-gray-200 outline-none focus:border-opm-gold"><option value="">{{ t('equipment.allTiers') }}</option><option v-for="tier in tierOptions" :key="tier" :value="tier">{{ tier }}</option></select>
        <select v-model="factionFilter" class="rounded-xl border border-gray-800 bg-[#12131a] px-4 py-3 text-gray-200 outline-none focus:border-opm-gold"><option value="">{{ t('equipment.allFactions') }}</option><option v-for="faction in factionOptions" :key="faction" :value="faction">{{ displayFaction(faction) }}</option></select>
        <select v-model="typeFilter" class="rounded-xl border border-gray-800 bg-[#12131a] px-4 py-3 text-gray-200 outline-none focus:border-opm-gold"><option value="">{{ t('equipment.allTypes') }}</option><option v-for="type in typeOptions" :key="type" :value="type">{{ displayType(type) }}</option></select>
      </div>
      <transition :name="transitionName" mode="out-in">
        <div :key="currentPage" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 content-start min-h-[500px]">
          <RouterLink v-for="character in paginatedItems" :key="character.id" :to="`/${isKeepsake ? 'keepsake' : 'insignia'}/${character.id}`" class="group rounded-xl border border-gray-800 bg-[#12131a] p-3 transition hover:-translate-y-1 hover:border-opm-gold/60">
            <div class="mb-3 flex aspect-square items-center justify-center rounded-lg bg-[#0b0c10] p-3 relative overflow-hidden">
              <img :src="getImage(character)" :alt="displayName(character)" class="h-full w-full object-contain transition-transform group-hover:scale-110" />
              <div class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span class="rounded-full border border-opm-gold bg-opm-gold/20 px-3 py-1 text-xs font-bold text-white">{{ t('home.viewDetails') }}</span>
              </div>
            </div>
            <h2 class="line-clamp-2 text-sm font-black text-white group-hover:text-opm-gold">{{ displayName(character) }}</h2>
            <p v-if="isKeepsake" class="mt-1 text-xs text-gray-500">{{ localized(character).tier }}</p>
          </RouterLink>
        </div>
      </transition>
      
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
    </template>
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
