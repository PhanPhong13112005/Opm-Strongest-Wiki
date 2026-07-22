<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAllCharacters } from '../services/characterApi'
import { getReleaseSchedule } from '../services/releaseScheduleApi'
import HomeRadar from '../components/HomeRadar.vue'

const { t, locale } = useI18n()
const localCatalogs = ref({ vi: null, en: null })
const localCharactersData = computed(() => localCatalogs.value[locale.value] || [])
const apiCharacters = ref(null)
const charactersData = computed(() => apiCharacters.value || localCharactersData.value)
let activeRequest = 0
const releaseScheduleRows = ref([])
let activeScheduleRequest = 0

const loadLocalCharacters = async (language) => {
  if (localCatalogs.value[language]) return localCatalogs.value[language]
  const module = language === 'en'
    ? await import('../data/characters_en.json')
    : await import('../data/characters.json')
  const catalog = module.default
  localCatalogs.value = { ...localCatalogs.value, [language]: catalog }
  return catalog
}

const loadCharacters = async () => {
  const requestId = ++activeRequest
  apiCharacters.value = null
  const language = locale.value
  const localCharacters = await loadLocalCharacters(language)
  if (requestId !== activeRequest) return

  try {
    const result = await getAllCharacters(language, localCharacters)
    if (requestId === activeRequest) apiCharacters.value = result
  } catch {
    // JSON local remains the visible source when the API is unavailable.
  }
}

watch(locale, loadCharacters, { immediate: true })

const loadReleaseSchedule = async () => {
  const requestId = ++activeScheduleRequest
  try {
    const rows = await getReleaseSchedule(locale.value)
    if (requestId === activeScheduleRequest) releaseScheduleRows.value = rows
  } catch {
    if (requestId === activeScheduleRequest) releaseScheduleRows.value = []
  }
}

watch(locale, loadReleaseSchedule, { immediate: true })

const safeUrl = (url) => {
  if (!url) return ''
  return encodeURI(url).replace(/\+/g, '%2B').replace(/#/g, '%23')
}

const getCharacterImage = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/')) return safeUrl(filename)
  return safeUrl(new URL(`../assets/characters/${filename}`, import.meta.url).href)
}

const getChar = (id) => charactersData.value.find(c => c.id === id) || {}

const currentDate = ref(new Date(2026, 6)) // Starts at July 2026 (0-indexed month)

const currentMonthStr = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = String(currentDate.value.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

const displayDateStr = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = String(currentDate.value.getMonth() + 1).padStart(2, '0')
  return `${m} / ${y}`
})

const nextMonthStr = computed(() => {
  const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

const prevMonthStr = computed(() => {
  const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

onMounted(() => {
  const banners = [];
  Object.values(scheduleData.value).forEach(month => {
    month.forEach(sv => {
       sv.items.forEach(item => {
          if (item.bannerImage) {
            banners.push(safeUrl(item.bannerImage));
          }
       })
    })
  })
  
  setTimeout(() => {
      banners.forEach(url => {
          const img = new window.Image();
          img.src = url;
      })
  }, 1000);
})

const fallbackScheduleData = computed(() => ({
  '2026-06': [
    {
      server: 'CN',
      serverName: t('home.serverTrungFull'),
      serverColor: '#00d8b6',
      items: [
        {
          id: '100316-urplus',
          bannerImage: '/Characters/Full_Background/Rover_URplus.png',
          tag: t('home.release'),
          tagBg: 'bg-opm-gold text-black',
          tagText: 'text-opm-gold',
          period: t('home.earlyMonth'),
          date: '01 / 06 / 2026',
          borderColor: 'border-opm-gold',
          shadowColor: 'shadow-glow-gold'
        },
        {
          id: '100314-urplus',
          bannerImage: '/Characters/Full_Background/G5_URplus.png',
          tag: t('home.return'),
          tagBg: 'bg-opm-red text-black',
          tagText: 'text-opm-red',
          period: t('home.midMonth'),
          date: '15 / 06 / 2026',
          borderColor: 'border-opm-red',
          shadowColor: 'shadow-glow-red'
        }
      ]
    },
    {
      server: 'SEA',
      serverName: t('home.serverSeaFull'),
      serverColor: '#ff4da6',
      items: [
        {
          id: '100312-urplus',
          bannerImage: '/Characters/Full_Background/Nyan_URplus.png',
          tag: t('home.release'),
          tagBg: 'bg-opm-gold text-black',
          tagText: 'text-opm-gold',
          period: t('home.earlyMonth'),
          date: '01 / 06 / 2026',
          borderColor: 'border-opm-gold',
          shadowColor: 'shadow-glow-gold'
        },
        {
          id: '100029-urplus',
          bannerImage: '/Characters/Full_Background/Amai_Mask_Urplus.png',
          tag: t('home.return'),
          tagBg: 'bg-[#b861ff] text-black',
          tagText: 'text-[#b861ff]',
          period: t('home.midMonth'),
          date: '15 / 06 / 2026',
          borderColor: 'border-[#b861ff]',
          shadowColor: 'shadow-[0_0_15px_rgba(184,97,255,0.3)]'
        }
      ]
    }
  ],
  '2026-07': [
    {
      server: 'CN',
      serverName: t('home.serverTrungFull'),
      serverColor: '#00d8b6',
      items: [
        {
          id: '100013-urplus',
          bannerImage: '/Characters/Full_Background/ZombIeMan_URplus.png',
          tag: t('home.release'),
          tagBg: 'bg-opm-gold text-black',
          tagText: 'text-opm-gold',
          period: t('home.earlyMonth'),
          date: '01 / 07 / 2026',
          borderColor: 'border-opm-gold',
          shadowColor: 'shadow-glow-gold'
        },
        {
          id: '100315-urplus',
          bannerImage: '/Characters/Full_Background/Bang&Bomb_Urplus.png',
          tag: t('home.return'),
          tagBg: 'bg-opm-red text-black',
          tagText: 'text-opm-red',
          period: t('home.midMonth'),
          date: '15 / 07 / 2026',
          borderColor: 'border-opm-red',
          shadowColor: 'shadow-glow-red'
        }
      ]
    },
    {
      server: 'SEA',
      serverName: t('home.serverSeaFull'),
      serverColor: '#ff4da6',
      items: [
        {
          id: '100313-urplus',
          bannerImage: '/Characters/Full_Background/Atomic Samurai_URplus.png',
          tag: t('home.release'),
          tagBg: 'bg-opm-gold text-black',
          tagText: 'text-opm-gold',
          period: t('home.earlyMonth'),
          date: '01 / 07 / 2026',
          borderColor: 'border-opm-gold',
          shadowColor: 'shadow-glow-gold'
        },
        {
          id: '100180-urplus',
          bannerImage: '/Characters/Full_Background/Tatsumaki_URplus.png',
          tag: t('home.return'),
          tagBg: 'bg-[#b861ff] text-black',
          tagText: 'text-[#b861ff]',
          period: t('home.midMonth'),
          date: '15 / 07 / 2026',
          borderColor: 'border-[#b861ff]',
          shadowColor: 'shadow-[0_0_15px_rgba(184,97,255,0.3)]'
        }
      ]
    }
  ],
  '2026-08': [
    {
      server: 'CN',
      serverName: t('home.serverTrungFull'),
      serverColor: '#00d8b6',
      items: [
        {
          id: 'unknown',
          overrideName: t('home.unknownCharacter'),
          overrideTier: 'UR+',
          overrideFaction: 'UNKNOWN',
          overrideType: 'UNKNOWN',
          overrideRole: t('home.hiddenPotential'),
          bannerImage: '/Characters/Full_Background/Nhan_Vat_Bi_An.jpg',
          tag: t('home.release'),
          tagBg: 'bg-opm-gold text-black',
          tagText: 'text-opm-gold',
          period: t('home.earlyMonth'),
          date: '01 / 08 / 2026',
          borderColor: 'border-opm-gold',
          shadowColor: 'shadow-glow-gold'
        },
        {
          id: '100316-urplus',
          bannerImage: '/Characters/Full_Background/Rover_URplus.png',
          tag: t('home.return'),
          tagBg: 'bg-opm-red text-black',
          tagText: 'text-opm-red',
          period: t('home.midMonth'),
          date: '15 / 08 / 2026',
          borderColor: 'border-opm-red',
          shadowColor: 'shadow-glow-red'
        }
      ]
    },
    {
      server: 'SEA',
      serverName: t('home.serverSeaFull'),
      serverColor: '#ff4da6',
      items: [
        {
          id: '100314-urplus',
          bannerImage: '/Characters/Full_Background/G5_URplus.png',
          tag: t('home.release'),
          tagBg: 'bg-opm-gold text-black',
          tagText: 'text-opm-gold',
          period: t('home.earlyMonth'),
          date: '01 / 08 / 2026',
          borderColor: 'border-opm-gold',
          shadowColor: 'shadow-glow-gold'
        },
        {
          id: '100312-urplus',
          bannerImage: '/Characters/Full_Background/Nyan_URplus.png',
          tag: t('home.return'),
          tagBg: 'bg-[#b861ff] text-black',
          tagText: 'text-[#b861ff]',
          period: t('home.midMonth'),
          date: '15 / 08 / 2026',
          borderColor: 'border-[#b861ff]',
          shadowColor: 'shadow-[0_0_15px_rgba(184,97,255,0.3)]'
        }
      ]
    }
  ]
}))

const apiScheduleData = computed(() => {
  const result = {}
  for (const row of releaseScheduleRows.value) {
    const month = String(row.date).slice(0, 7)
    if (!result[month]) result[month] = []
    let server = result[month].find(item => item.server === row.server)
    if (!server) {
      server = {
        server: row.server,
        serverName: row.server === 'CN' ? t('home.serverTrungFull') : t('home.serverSeaFull'),
        serverColor: row.server === 'CN' ? '#00d8b6' : '#ff4da6',
        items: [],
      }
      result[month].push(server)
    }
    const isPurpleReturn = row.isReturn && row.server === 'SEA'
    const [year, monthNumber, day] = String(row.date).split('-')
    server.items.push({
      id: row.characterId,
      bannerImage: row.bannerImage,
      overrideName: row.overrideName || undefined,
      overrideTier: row.overrideTier || undefined,
      overrideFaction: row.overrideFaction || undefined,
      overrideType: row.overrideType || undefined,
      overrideRole: row.overrideRole || undefined,
      tag: row.isReturn ? t('home.return') : t('home.release'),
      tagBg: row.isReturn ? (isPurpleReturn ? 'bg-[#b861ff] text-black' : 'bg-opm-red text-black') : 'bg-opm-gold text-black',
      tagText: row.isReturn ? (isPurpleReturn ? 'text-[#b861ff]' : 'text-opm-red') : 'text-opm-gold',
      period: Number(day) <= 7 ? t('home.earlyMonth') : t('home.midMonth'),
      date: `${day} / ${monthNumber} / ${year}`,
      borderColor: row.isReturn ? (isPurpleReturn ? 'border-[#b861ff]' : 'border-opm-red') : 'border-opm-gold',
      shadowColor: row.isReturn ? (isPurpleReturn ? 'shadow-[0_0_15px_rgba(184,97,255,0.3)]' : 'shadow-glow-red') : 'shadow-glow-gold',
      sortOrder: row.sortOrder,
    })
  }
  for (const month of Object.values(result)) {
    month.sort((a, b) => (a.server === 'CN' ? 0 : 1) - (b.server === 'CN' ? 0 : 1))
    month.forEach(server => server.items.sort((a, b) => a.sortOrder - b.sortOrder))
  }
  return result
})

const scheduleData = computed(() => releaseScheduleRows.value.length > 0
  ? apiScheduleData.value
  : fallbackScheduleData.value)

const hasNextMonth = computed(() => !!scheduleData.value[nextMonthStr.value])
const hasPrevMonth = computed(() => !!scheduleData.value[prevMonthStr.value])

const transitionName = ref('fade')

const nextMonth = () => {
  if (hasNextMonth.value) {
    transitionName.value = 'slide-left'
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
  }
}

const prevMonth = () => {
  if (hasPrevMonth.value) {
    transitionName.value = 'slide-right'
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
  }
}

const servers = computed(() => {
  return scheduleData.value[currentMonthStr.value] || []
})
</script>

<template>
  <div class="home-page-root">
  <HomeRadar
    :servers="servers"
    :display-date="displayDateStr"
    :current-month="currentMonthStr"
    :has-previous="hasPrevMonth"
    :has-next="hasNextMonth"
    :transition-name="transitionName"
    :get-character-image="getCharacterImage"
    :get-character="getChar"
    @previous="prevMonth"
    @next="nextMonth"
  />
  <main v-if="false" class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div class="space-y-12 pb-20">

      <!-- Month Navigation -->
      <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-xl p-3 sm:p-4">
        <button 
          @click="prevMonth" 
          :disabled="!hasPrevMonth"
          class="px-3 sm:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors flex items-center justify-center min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
        >
          <span>&larr;</span><span class="hidden sm:inline ml-2">{{ t('home.previousMonth') }}</span>
        </button>
        <div class="text-lg sm:text-xl md:text-2xl font-black text-opm-gold tracking-widest whitespace-nowrap">{{ displayDateStr }}</div>
        <button 
          @click="nextMonth" 
          :disabled="!hasNextMonth"
          class="px-3 sm:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors flex items-center justify-center min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
        >
          <span class="hidden sm:inline mr-2">{{ t('home.nextMonth') }}</span><span>&rarr;</span>
        </button>
      </div>

      <transition :name="transitionName" mode="out-in">
        <div :key="currentMonthStr">
          <div v-if="servers.length === 0" class="text-center py-20 bg-[#0b0c10] border border-gray-800 rounded-xl">
            <div class="text-gray-500 text-lg mb-2">{{ t('home.noBannerData', { date: displayDateStr }) }}</div>
            <div class="text-gray-600 text-sm">{{ t('home.comeBackLater') }}</div>
          </div>

          <div v-else class="space-y-12">
            <section v-for="serverGroup in servers" :key="serverGroup.server">
        <div class="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
          <div class="flex items-center space-x-3">
            <span class="text-black font-bold px-2 py-0.5 rounded text-base" :style="{ backgroundColor: serverGroup.serverColor }">{{ serverGroup.server }}</span>
            <span class="font-bold tracking-wider text-base md:text-lg" :style="{ color: serverGroup.serverColor }">{{ serverGroup.serverName }}</span>
          </div>
          <div class="text-gray-400 text-sm md:text-base font-mono tracking-widest">{{ displayDateStr }}</div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <component 
            :is="item.id === 'unknown' ? 'div' : 'router-link'"
            v-for="item in serverGroup.items" 
            :key="item.id"
            :to="item.id === 'unknown' ? undefined : `/character/${item.id}`" 
            class="block relative rounded-xl border overflow-hidden bg-[#0b0c10] transition-transform group"
            :class="[
              item.borderColor, 
              item.shadowColor,
              item.id === 'unknown' ? 'cursor-default' : 'hover:scale-[1.02] cursor-pointer'
            ]"
          >
            <!-- Colored Glow Blob -->
            <div class="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[70px] opacity-25 z-0" :class="item.tagText.replace('text-', 'bg-')"></div>
            
            <div class="absolute inset-0 bg-gradient-to-r from-[#0b0c10]/80 via-[#0b0c10]/40 to-transparent z-10 pointer-events-none"></div>
            
            <img 
              :src="getCharacterImage(item.bannerImage || getChar(item.id).imageURL)" 
              :alt="getChar(item.id).name" 
              class="absolute right-0 bottom-0 h-[105%] w-[65%] object-contain object-right-bottom z-0 group-hover:scale-[1.03] transition-transform duration-700 transform translate-x-2 translate-y-1" 
              style="-webkit-mask-image: linear-gradient(to left, black 70%, transparent);"
              onerror="this.style.display='none'" 
            />
            
            <div class="relative z-20 p-8 flex flex-col h-full justify-between min-h-[220px] w-3/4">
              <div class="flex items-center space-x-3">
                <div class="font-extrabold px-3 py-1 rounded text-lg tracking-widest uppercase" :class="item.tagBg">{{ item.tag }}</div>
                <div class="flex flex-col">
                  <span class="text-xs font-bold uppercase tracking-widest text-white leading-tight">{{ item.period }}</span>
                  <span class="text-sm font-mono font-bold tracking-widest leading-tight whitespace-nowrap" :class="item.tagText">{{ item.date }}</span>
                </div>
              </div>
              
              <div class="mt-4">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-xs font-black px-1.5 py-0.5 rounded" :class="item.tagBg">
                    {{ item.overrideTier || getChar(item.id).tier }}
                  </span>
                  <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white group-hover:text-opm-gold transition-colors duration-300 tracking-tight drop-shadow-lg truncate">
                    {{ item.overrideName || getChar(item.id).name }}
                  </h2>
                </div>
                <p class="text-gray-300 text-base">
                  {{ item.overrideRole || getChar(item.id).roles?.[0] || getChar(item.id).type }}
                </p>
                <p class="text-xs font-extrabold tracking-widest mt-2 uppercase" :class="item.tagText">
                  {{ item.overrideTier || getChar(item.id).tier }} · 
                  {{ item.overrideFaction || getChar(item.id).faction?.toUpperCase() }} · 
                  {{ item.overrideType || getChar(item.id).type?.toUpperCase() }}
                </p>
                
                <p 
                  v-if="item.id !== 'unknown'"
                  class="text-xs font-bold tracking-widest mt-4 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" 
                  :class="item.tagText"
                >
                  {{ t('home.viewDetails') }} &rarr;
                </p>
              </div>
            </div>
          </component>
        </div>
      </section>
          </div>
        </div>
      </transition>

    </div>
  </main>
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
