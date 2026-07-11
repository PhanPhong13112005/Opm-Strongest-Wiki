<script setup>
import { computed } from 'vue'
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

const servers = computed(() => [
  {
    server: 'CN',
    serverName: t('home.serverTrungFull'),
    serverColor: '#00d8b6',
    date: '07 / 2026',
    items: [
      {
        id: '100013-urplus',
        bannerImage: '/Characters/Full_Background/zombieman_urplus_full.png',
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
        bannerImage: '/Characters/Full_Background/Bang&Bomb.png',
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
    date: '07 / 2026',
    items: [
      {
        id: '100313-urplus',
        bannerImage: '/Characters/Full_Background/Atomic Samurai.png',
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
        bannerImage: '/Characters/Full_Background/Tatsumaki_V4.png',
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
])
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <div class="space-y-12 pb-20">

      <section v-for="serverGroup in servers" :key="serverGroup.server">
        <div class="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
          <div class="flex items-center space-x-3">
            <span class="text-black font-bold px-2 py-0.5 rounded text-base" :style="{ backgroundColor: serverGroup.serverColor }">{{ serverGroup.server }}</span>
            <span class="font-bold tracking-wider text-base md:text-lg" :style="{ color: serverGroup.serverColor }">{{ serverGroup.serverName }}</span>
          </div>
          <div class="text-gray-400 text-sm md:text-base font-mono tracking-widest">{{ serverGroup.date }}</div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <router-link 
            v-for="item in serverGroup.items" 
            :key="item.id"
            :to="`/character/${item.id}`" 
            class="block relative rounded-xl border overflow-hidden bg-[#0b0c10] hover:scale-[1.02] transition-transform cursor-pointer group"
            :class="[item.borderColor, item.shadowColor]"
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
                  <span class="text-sm font-mono font-bold tracking-widest leading-tight" :class="item.tagText">{{ item.date }}</span>
                </div>
              </div>
              
              <div class="mt-4">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-xs font-black px-1.5 py-0.5 rounded" :class="item.tagBg">
                    {{ getChar(item.id).tier }}
                  </span>
                  <h2 class="text-4xl font-black text-white group-hover:text-opm-gold transition-colors duration-300 tracking-tight drop-shadow-lg whitespace-nowrap">
                    {{ getChar(item.id).name }}
                  </h2>
                </div>
                <p class="text-gray-300 text-base">
                  {{ getChar(item.id).roles?.[0] || getChar(item.id).type }}
                </p>
                <p class="text-xs font-extrabold tracking-widest mt-2 uppercase" :class="item.tagText">
                  {{ getChar(item.id).tier }} · 
                  {{ getChar(item.id).faction?.toUpperCase() }} · 
                  {{ getChar(item.id).type?.toUpperCase() }}
                </p>
                
                <p class="text-xs font-bold tracking-widest mt-4 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" :class="item.tagText">
                  {{ t('home.viewDetails') }} &rarr;
                </p>
              </div>
            </div>
          </router-link>
        </div>
      </section>

    </div>
  </main>
</template>
