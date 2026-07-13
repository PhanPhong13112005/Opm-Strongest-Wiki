<script setup>
import { ref, watch } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

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
          <RouterLink to="/core-lab" class="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.corelab') }}
          </RouterLink>
          <RouterLink to="/keepsakes" class="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.keepsakes') }}
          </RouterLink>
          <RouterLink to="/insignias" class="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
            {{ t('nav.insignias') }}
          </RouterLink>
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
        <RouterLink @click="toggleMobileMenu" to="/core-lab" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
          {{ t('nav.corelab') }}
        </RouterLink>
        <RouterLink @click="toggleMobileMenu" to="/keepsakes" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
          {{ t('nav.keepsakes') }}
        </RouterLink>
        <RouterLink @click="toggleMobileMenu" to="/insignias" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
          {{ t('nav.insignias') }}
        </RouterLink>
        <RouterLink @click="toggleMobileMenu" to="/events" class="text-sm font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors" exact-active-class="text-white">
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
        <RouterLink to="/privacy" class="text-gray-400 hover:text-white text-xs underline decoration-gray-600 underline-offset-4">{{ t('footer.privacy') }}</RouterLink>
      </div>
    </footer>
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
