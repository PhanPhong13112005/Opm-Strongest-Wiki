<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'

const { t, locale } = useI18n()
const charactersData = computed(() => locale.value === 'en' ? charactersDataEn : charactersDataVi)

const getCharacterImage = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/')) return filename
  return new URL(`../assets/characters/${filename}`, import.meta.url).href
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

const scheduleData = {
  '2026-06': [
    {
      server: 'CN',
      serverName: t('home.serverTrungFull'),
      serverColor: '#00d8b6',
      items: [
        {
          id: '100316-urplus',
          bannerImage: '/Characters/Full_Background/Rover_UR+.png',
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
          bannerImage: '/Characters/Full_Background/G5_UR+.png',
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
          bannerImage: '/Characters/Full_Background/Nyan_UR+.png',
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
          bannerImage: '/Characters/Full_Background/Amai_Mask_Ur+.png',
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
          bannerImage: '/Characters/Full_Background/ZombIeMan_UR+.png',
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
          bannerImage: '/Characters/Full_Background/Bang&Bomb_Ur+.png',
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
          bannerImage: '/Characters/Full_Background/Atomic Samurai_UR+.png',
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
          bannerImage: '/Characters/Full_Background/Tatsumaki_UR+.png',
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
          overrideName: 'Nhân Vật Bí Ẩn',
          overrideTier: 'UR+',
          overrideFaction: 'UNKNOWN',
          overrideType: 'UNKNOWN',
          overrideRole: 'Sức Mạnh Tiềm Ẩn',
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
          bannerImage: '/Characters/Full_Background/Rover_UR+.png',
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
          bannerImage: '/Characters/Full_Background/G5_UR+.png',
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
          bannerImage: '/Characters/Full_Background/Nyan_UR+.png',
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
}

const hasNextMonth = computed(() => !!scheduleData[nextMonthStr.value])
const hasPrevMonth = computed(() => !!scheduleData[prevMonthStr.value])

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
  return scheduleData[currentMonthStr.value] || []
})
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div class="space-y-12 pb-20">

      <!-- Month Navigation -->
      <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-xl p-3 sm:p-4">
        <button 
          @click="prevMonth" 
          :disabled="!hasPrevMonth"
          class="px-3 sm:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors flex items-center justify-center min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
        >
          <span>&larr;</span><span class="hidden sm:inline ml-2">Tháng trước</span>
        </button>
        <div class="text-lg sm:text-xl md:text-2xl font-black text-opm-gold tracking-widest whitespace-nowrap">{{ displayDateStr }}</div>
        <button 
          @click="nextMonth" 
          :disabled="!hasNextMonth"
          class="px-3 sm:px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold transition-colors flex items-center justify-center min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
        >
          <span class="hidden sm:inline mr-2">Tháng sau</span><span>&rarr;</span>
        </button>
      </div>

      <transition :name="transitionName" mode="out-in">
        <div :key="currentMonthStr">
          <div v-if="servers.length === 0" class="text-center py-20 bg-[#0b0c10] border border-gray-800 rounded-xl">
            <div class="text-gray-500 text-lg mb-2">Chưa có dữ liệu banner cho {{ displayDateStr }}</div>
            <div class="text-gray-600 text-sm">Vui lòng quay lại sau!</div>
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
