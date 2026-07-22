<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import eventsData from '../data/events.json'
import { getEventById } from '../services/eventApi'
import EventComments from '../components/EventComments.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const eventId = computed(() => String(route.params.id || ''))
const localEvent = computed(() => eventsData.find(e => e.id === eventId.value) || null)
const apiEvent = ref(null)
const event = computed(() => apiEvent.value || localEvent.value)

const activeSection = ref(0)
const selectedImage = ref(null)
const tabsContainer = ref(null)
let activeRequest = 0

const loadEvent = async () => {
  const requestId = ++activeRequest
  apiEvent.value = null
  activeSection.value = 0
  selectedImage.value = null

  try {
    const result = await getEventById(eventId.value, locale.value, localEvent.value)
    if (requestId === activeRequest) apiEvent.value = result
  } catch {
    // JSON local remains the visible source when the API is unavailable.
  }
}

watch([eventId, locale], loadEvent, { immediate: true })

const scrollTabs = (direction) => {
  if (tabsContainer.value) {
    const scrollAmount = 150
    tabsContainer.value.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }
}

const openImage = (src) => {
  selectedImage.value = src
}

const closeImage = () => {
  selectedImage.value = null
}

const getTitle = (e) => {
  if (!e) return ''
  return locale.value === 'en' ? e.titleEn : e.titleVi
}

const getDescription = (e) => {
  if (!e) return ''
  return locale.value === 'en' ? e.descriptionEn : e.descriptionVi
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return new Date(dateString).toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US', options)
}

const goBack = () => {
  router.push('/events')
}
</script>

<template>
  <main class="min-h-screen py-10 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
    <!-- Background elements -->
    <div class="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-opm-gold/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="mx-auto max-w-5xl relative z-10" v-if="event">
      
      <!-- Back Button -->
      <button 
        @click="goBack"
        class="mb-8 flex items-center gap-2 text-gray-400 hover:text-opm-gold transition-colors font-bold text-sm tracking-wider uppercase group"
      >
        <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        {{ locale === 'vi' ? 'Quay lại Lịch sự kiện' : 'Back to Schedule' }}
      </button>

      <!-- Event Header -->
      <header class="mb-10">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <div v-if="event.category !== 'other'" class="inline-flex px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 font-medium">
            {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
          </div>
          <div v-if="event.serverLaunchDay" class="inline-flex items-center gap-1.5 px-3 py-1 bg-opm-gold/10 border border-opm-gold/30 rounded-lg text-sm text-opm-gold font-bold shadow-[0_0_10px_rgba(255,215,0,0.1)]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {{ locale === 'vi' ? `Ra mắt vào Ngày ${event.serverLaunchDay} Server Mới` : `Launches on Day ${event.serverLaunchDay} of New Server` }}
          </div>
        </div>
        <h1 class="text-3xl font-black text-white sm:text-4xl tracking-tight mb-6">
          {{ getTitle(event) }}
        </h1>
      </header>

      <!-- Main Image -->
      <div v-if="event.imageUrl" class="rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl mb-8 flex justify-center items-center">
        <img 
          :src="event.imageUrl" 
          :alt="getTitle(event)"
          class="w-full max-h-[400px] object-contain"
        />
      </div>

      <!-- Description under Image -->
      <div class="mb-12">
        <p class="text-gray-300 leading-relaxed max-w-3xl text-lg whitespace-pre-line">
          {{ getDescription(event) }}
        </p>
      </div>

      <!-- Sections (Grouped Detail Images) -->
      <div v-if="event.sections && event.sections.length > 0" class="space-y-6">
        
        <!-- Tabs with Arrows -->
        <div class="relative flex items-center group">
          <button 
            @click="scrollTabs('left')"
            class="absolute left-0 z-10 w-8 h-[calc(100%-8px)] bg-gradient-to-r from-[#0a0b10] via-[#0a0b10]/80 to-transparent flex items-center justify-start text-gray-400 hover:text-white pointer-events-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div ref="tabsContainer" class="flex-1 flex gap-2 sm:gap-4 border-b border-white/10 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory px-6">
            <button 
              v-for="(section, sIdx) in event.sections" 
              :key="sIdx"
              @click="activeSection = sIdx"
              class="whitespace-nowrap px-4 py-2 font-bold uppercase tracking-widest text-sm transition-colors border-b-2 snap-start"
              :class="activeSection === sIdx ? 'border-opm-gold text-opm-gold' : 'border-transparent text-gray-400 hover:text-gray-200'"
            >
              {{ locale === 'vi' ? section.titleVi : section.titleEn }}
            </button>
          </div>

          <button 
            @click="scrollTabs('right')"
            class="absolute right-0 z-10 w-8 h-[calc(100%-8px)] bg-gradient-to-l from-[#0a0b10] via-[#0a0b10]/80 to-transparent flex items-center justify-end text-gray-400 hover:text-white pointer-events-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Active Section Content -->
        <div v-if="event.sections[activeSection]">
          <transition name="fade-slide" mode="out-in">
            <div :key="activeSection">
              <!-- Grid Layout for Sections with Images -->
              <div v-if="event.sections[activeSection].images && event.sections[activeSection].images.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  v-for="(img, idx) in event.sections[activeSection].images" 
                  :key="idx"
                  class="rounded-xl overflow-hidden bg-[#0a0b10] border border-white/5 shadow-lg flex flex-col group"
                >
                  <div class="bg-black/40 p-2 flex items-center justify-center border-b border-white/5 flex-1 relative cursor-pointer group-hover:bg-white/5 transition-colors" @click="openImage(img)">
                    <img 
                      :src="img" 
                      alt="Detail"
                      class="max-w-full h-auto object-contain group-hover:scale-[1.03] transition-transform duration-500 rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div v-if="event.sections[activeSection].tasks && event.sections[activeSection].tasks[idx] && event.sections[activeSection].tasks[idx].length > 0" class="p-4 bg-gradient-to-b from-[#0a0b10] to-[#05060a] border-t border-white/5">
                    <div class="space-y-2.5">
                      <div 
                        v-for="(task, tIdx) in event.sections[activeSection].tasks[idx]" 
                        :key="tIdx"
                        class="flex items-start gap-2.5"
                      >
                        <div class="mt-1 w-3.5 h-3.5 rounded-sm border border-opm-gold/50 flex flex-shrink-0 items-center justify-center bg-black/50">
                          <div class="w-1.5 h-1.5 bg-opm-gold rounded-sm"></div>
                        </div>
                        <span class="text-sm text-gray-200 font-medium leading-snug">{{ locale === 'vi' ? task.descVi : task.descEn }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- List Layout for Sections without Images -->
              <div v-else-if="event.sections[activeSection].tasks && event.sections[activeSection].tasks.length > 0" class="rounded-xl overflow-hidden bg-[#0a0b10] border border-white/5 shadow-lg p-6">
                <div class="space-y-4">
                  <div 
                    v-for="(task, tIdx) in event.sections[activeSection].tasks[0]" 
                    :key="tIdx"
                    class="flex items-start gap-3"
                  >
                    <div class="mt-1.5 w-4 h-4 rounded-sm border border-opm-gold/50 flex flex-shrink-0 items-center justify-center bg-black/50">
                      <div class="w-2 h-2 bg-opm-gold rounded-sm"></div>
                    </div>
                    <span class="text-base text-gray-200 font-medium leading-relaxed">{{ locale === 'vi' ? task.descVi : task.descEn }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Fallback Detail Images Grid (If no sections) -->
      <div v-else-if="event.detailImages && event.detailImages.length > 0">
        <h2 class="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-2">
          {{ locale === 'vi' ? 'Chi tiết sự kiện' : 'Event Details' }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="(img, idx) in event.detailImages" 
            :key="idx"
            class="rounded-xl overflow-hidden bg-[#0a0b10] border border-white/5 shadow-lg group flex items-center justify-center p-2 cursor-pointer hover:bg-white/5 transition-colors"
            @click="openImage(img)"
          >
            <img 
              :src="img" 
              alt="Detail"
              class="max-w-full h-auto object-contain group-hover:scale-[1.03] transition-transform duration-500 rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <EventComments :event-id="eventId" />
      
    </div>
    
    <!-- 404 / Not Found -->
    <div v-else class="mx-auto max-w-4xl relative z-10 text-center py-20">
      <h1 class="text-3xl font-bold text-white mb-4">Event Not Found</h1>
      <button 
        @click="goBack"
        class="px-6 py-3 bg-opm-gold text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
      >
        Go Back
      </button>
    </div>

    <!-- Image Zoom Modal -->
    <transition name="zoom-fade">
      <div 
        v-if="selectedImage" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm"
        @click="closeImage"
      >
        <button 
          class="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-[101]"
          @click.stop="closeImage"
        >
          <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <img 
          :src="selectedImage" 
          class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          @click.stop
        />
      </div>
    </transition>
  </main>
</template>

<style scoped>
/* Image Modal Transition */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 1, 0.3, 1);
}
.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Tab Content Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
