<script setup>
import { ref, watch } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'

const { t, locale } = useI18n()

// Use a ref for the UI toggle but sync it with vue-i18n locale
const lang = ref(locale.value.toUpperCase())
const isMobileMenuOpen = ref(false)

const toggleLang = () => {
  const newLang = lang.value === 'VI' ? 'EN' : 'VI'
  lang.value = newLang
  locale.value = newLang.toLowerCase()
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-opm-dark">
    <!-- Header/Navbar chung cho toàn trang -->
    <header class="sticky top-0 z-40 border-b border-white/5 bg-[#05060a]/90 backdrop-blur-md">
      <div class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 relative">
        <RouterLink to="/" class="text-2xl font-black uppercase tracking-[0.2em] text-white hover:text-gray-300 transition-colors">
          OPM STRONGEST
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden sm:flex gap-8 items-center">
          <RouterLink to="/characters" class="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.characters') }}
          </RouterLink>
          <RouterLink to="/mastery" class="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.mastery') }}
          </RouterLink>

          <!-- Dropdown Features -->
          <div class="relative group">
            <button class="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors focus:outline-none py-2">
              {{ t('nav.features') }}
              <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 rounded-lg bg-[#0a0c10] border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
              <div class="flex flex-col">
                <RouterLink to="/core-lab" class="px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5" exact-active-class="text-white bg-white/5">
                  {{ t('nav.corelab') }}
                </RouterLink>
                <RouterLink to="/medals" class="px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5" exact-active-class="text-white bg-white/5">
                  {{ t('nav.medals') }}
                </RouterLink>
                <RouterLink to="/tactics" class="px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5" exact-active-class="text-white bg-white/5">
                  {{ t('nav.tactics') }}
                </RouterLink>
                <RouterLink to="/backgear" class="px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5" exact-active-class="text-white bg-white/5">
                  {{ t('nav.backgear') }}
                </RouterLink>
                <RouterLink to="/keepsakes" class="px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5" exact-active-class="text-white bg-white/5">
                  {{ t('nav.keepsakes') }}
                </RouterLink>
                <RouterLink to="/insignias" class="px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:bg-white/5 transition-colors" exact-active-class="text-white bg-white/5">
                  {{ t('nav.insignias') }}
                </RouterLink>
              </div>
            </div>
          </div>

          <RouterLink to="/events" class="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.events') }}
          </RouterLink>
          
          <div class="ml-4 flex items-center bg-[#1a1c23] rounded-full px-1 py-1 border border-gray-700 cursor-pointer relative" @click="toggleLang">
            <div class="absolute inset-y-1 w-1/2 rounded-full bg-opm-gold transition-all duration-300" :class="lang === 'VI' ? 'left-1' : 'left-[calc(50%-4px)]'"></div>
            <span class="relative z-10 text-[10px] font-bold px-3 py-0.5 rounded-full transition-colors" :class="lang === 'VI' ? 'text-black' : 'text-gray-400'">VI</span>
            <span class="relative z-10 text-[10px] font-bold px-3 py-0.5 rounded-full transition-colors" :class="lang === 'EN' ? 'text-black' : 'text-gray-400'">EN</span>
          </div>
        </nav>

        <!-- Mobile Navigation Toggle -->
        <div class="flex sm:hidden items-center gap-4">
          <div class="flex items-center bg-[#1a1c23] rounded-full px-1 py-1 border border-gray-700 cursor-pointer relative" @click="toggleLang">
            <div class="absolute inset-y-1 w-1/2 rounded-full bg-opm-gold transition-all duration-300" :class="lang === 'VI' ? 'left-1' : 'left-[calc(50%-4px)]'"></div>
            <span class="relative z-10 text-[10px] font-bold px-3 py-0.5 rounded-full transition-colors" :class="lang === 'VI' ? 'text-black' : 'text-gray-400'">VI</span>
            <span class="relative z-10 text-[10px] font-bold px-3 py-0.5 rounded-full transition-colors" :class="lang === 'EN' ? 'text-black' : 'text-gray-400'">EN</span>
          </div>
          <button @click="toggleMobileMenu" class="text-gray-400 hover:text-white focus:outline-none">
            <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div v-if="isMobileMenuOpen" class="sm:hidden absolute top-20 left-0 w-full bg-[#05060a]/95 backdrop-blur-md border-b border-white/5 py-4 px-4 flex flex-col gap-4 shadow-xl z-50">
        <RouterLink @click="toggleMobileMenu" to="/characters" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
          {{ t('nav.characters') }}
        </RouterLink>
        <RouterLink @click="toggleMobileMenu" to="/mastery" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
          {{ t('nav.mastery') }}
        </RouterLink>

        <!-- Features Group Header -->
        <div class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 px-2 border-b border-white/5 pb-2">
          {{ t('nav.features') }}
        </div>
        <div class="flex flex-col gap-4 pl-4 border-l-2 border-white/5 ml-2">
          <RouterLink @click="toggleMobileMenu" to="/core-lab" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.corelab') }}
          </RouterLink>
          <RouterLink @click="toggleMobileMenu" to="/medals" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.medals') }}
          </RouterLink>
          <RouterLink @click="toggleMobileMenu" to="/tactics" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.tactics') }}
          </RouterLink>
          <RouterLink @click="toggleMobileMenu" to="/backgear" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.backgear') }}
          </RouterLink>
          <RouterLink @click="toggleMobileMenu" to="/keepsakes" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.keepsakes') }}
          </RouterLink>
          <RouterLink @click="toggleMobileMenu" to="/insignias" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.insignias') }}
          </RouterLink>
        </div>

        <RouterLink @click="toggleMobileMenu" to="/events" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors mt-2" exact-active-class="text-white">
          {{ t('nav.events') }}
        </RouterLink>
      </div>
    </header>

    <!-- Khu vực hiển thị View tương ứng -->
    <RouterView class="flex-grow" v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>

    <!-- Footer -->
    <footer class="border-t border-white/5 bg-[#05060a] py-8 mt-auto">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <p class="text-gray-500 text-xs mb-2">{{ t('footer.desc') }}</p>
        <div class="flex justify-center gap-4 text-xs">
          <RouterLink to="/history" class="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-4">{{ t('footer.history') || 'Lịch sử' }}</RouterLink>
          <span class="text-gray-600">|</span>
          <RouterLink to="/privacy" class="text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-4">{{ t('footer.privacy') || 'Chính sách bảo mật' }}</RouterLink>
        </div>
      </div>
    </footer>

    <Analytics />
    <SpeedInsights />
  </div>
</template>

<style>
/* CSS cho router-link-active nếu cần */
.router-link-exact-active {
  @apply text-white;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
