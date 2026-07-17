<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import eventsData from '../data/events.json'
import { getEvents } from '../services/eventApi'

const { t, locale } = useI18n()

// Keep track of which event is currently expanded (accordion style)
const expandedEventId = ref(null)

const currentCategory = ref('main') // 'main' or 'other'
const apiEvents = ref(null)
let activeRequest = 0

const toggleEvent = (id) => {
  if (expandedEventId.value === id) {
    expandedEventId.value = null
  } else {
    expandedEventId.value = id
  }
}

// Format the date for the schedule view
const formatDate = (dateString) => {
  const options = { month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US', options)
}

const getTitle = (event) => {
  return locale.value === 'en' ? event.titleEn : event.titleVi
}

const getDescription = (event) => {
  return locale.value === 'en' ? event.descriptionEn : event.descriptionVi
}

const localEvents = computed(() => {
  return eventsData
    .filter(event => event.category === currentCategory.value)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
})

const sortedEvents = computed(() => apiEvents.value || localEvents.value)

const loadEvents = async () => {
  const requestId = ++activeRequest
  apiEvents.value = null

  try {
    const result = await getEvents({
      language: locale.value,
      category: currentCategory.value,
      page: 1,
      pageSize: 100,
      localEvents: eventsData,
    })
    if (requestId === activeRequest) apiEvents.value = result.items
  } catch {
    // JSON local remains the visible source when the API is unavailable.
  }
}

watch([locale, currentCategory], () => {
  expandedEventId.value = null
  loadEvents()
}, { immediate: true })

</script>

<template>
  <main class="min-h-screen py-10 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
    <!-- Background elements -->
    <div class="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-opm-gold/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="mx-auto max-w-4xl relative z-10">
      <!-- Header -->
      <header class="mb-8 max-w-3xl">
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-opm-gold">OPM Database</p>
        <h1 class="text-4xl font-black text-white sm:text-5xl tracking-tight">{{ t('events.title') }}</h1>
        <p class="mt-4 text-gray-400 leading-relaxed">{{ t('events.desc') }}</p>
      </header>

      <!-- Disclaimer Alert -->
      <div class="mb-10 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start sm:items-center gap-4">
        <svg class="w-6 h-6 text-yellow-500 shrink-0 mt-1 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <p class="text-sm font-medium text-yellow-200/90 leading-relaxed">
          {{ t('events.disclaimer') }}
        </p>
      </div>

      <!-- Category Tabs -->
      <div class="mb-8 flex gap-2">
        <button 
          @click="currentCategory = 'main'"
          class="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
          :class="currentCategory === 'main' ? 'bg-opm-gold text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-[#12131a] text-gray-400 border border-white/10 hover:border-opm-gold/50 hover:text-white'"
        >
          {{ t('events.mainEvents') }}
        </button>
        <button 
          @click="currentCategory = 'other'"
          class="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
          :class="currentCategory === 'other' ? 'bg-opm-gold text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-[#12131a] text-gray-400 border border-white/10 hover:border-opm-gold/50 hover:text-white'"
        >
          {{ t('events.otherEvents') }}
        </button>
      </div>

      <!-- Schedule Accordion List -->
      <transition-group name="list" tag="div" class="space-y-3">
        <div 
          v-for="event in sortedEvents" 
          :key="event.id"
          class="rounded-xl border transition-all duration-300 overflow-hidden"
          :class="expandedEventId === event.id ? 'border-opm-gold bg-[#12131a] shadow-[0_0_20px_rgba(255,215,0,0.1)]' : 'border-white/5 bg-[#0a0b10] hover:border-white/20'"
        >
          <!-- Event Header (Clickable) -->
        <div class="p-5 border-b border-white/5 cursor-pointer select-none group/header hover:bg-white/[0.02] transition-colors" @click="toggleEvent(event.id)">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span 
                  v-if="event.category !== 'other'"
                  class="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-1 rounded"
                >
                  {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
                </span>
                <span 
                  v-if="event.serverLaunchDay"
                  class="inline-flex items-center gap-1 text-xs font-bold text-opm-gold uppercase tracking-wider bg-opm-gold/10 border border-opm-gold/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {{ locale === 'vi' ? `Ngày ${event.serverLaunchDay} Server Mới` : `Day ${event.serverLaunchDay} New Server` }}
                </span>
              </div>
              <!-- Event Title -->
              <h2 
                class="text-base sm:text-lg font-black transition-colors"
                :class="expandedEventId === event.id ? 'text-opm-gold' : 'text-white'"
              >
                {{ getTitle(event) }}
              </h2>
            </div>
            
            <!-- Expand/Collapse Icon -->
            <div 
              class="shrink-0 text-gray-400 transition-transform duration-300"
              :class="expandedEventId === event.id ? 'rotate-180 text-opm-gold' : ''"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

          <!-- Accordion Body (Details) -->
          <div 
            v-show="expandedEventId === event.id" 
            class="px-5 pb-6 pt-2 border-t border-white/5"
          >
            <p class="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
              {{ getDescription(event) }}
            </p>
            
            <!-- Main Image (Clickable) -->
            <div 
              @click="$router.push('/events/' + event.id)"
              class="rounded-xl overflow-hidden bg-black/30 border border-white/5 flex justify-center items-center cursor-pointer transition-all duration-300 hover:border-opm-gold/50 hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] group/img"
              title="Click to view details"
            >
              <img 
                :src="event.imageUrl" 
                :alt="getTitle(event)"
                class="max-w-full h-auto object-contain transition-transform duration-500 group-hover/img:scale-[1.02]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </transition-group>
      
    </div>
  </main>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-active {
  position: absolute;
}
</style>
