<script setup>
import { computed, ref, watch } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import { authState, getPortalPath, hasRole, hasValidSession } from './services/authApi'

const { t, locale } = useI18n()
const route = useRoute()
const lang = ref(locale.value.toUpperCase())
const isMobileMenuOpen = ref(false)
const currentYear = new Date().getFullYear()
const accountPath = computed(() => getPortalPath(authState.session?.role))
const featureRoutes = ['/core-lab', '/medals', '/tactics', '/backgear', '/keepsakes', '/insignias']
const isFeaturesRoute = computed(() => featureRoutes.some(path => route.path.startsWith(path)))
const isWorkspaceRoute = computed(() => hasValidSession() && (
  ['/account', '/forum', '/advisor', '/top-up', '/staff'].includes(route.path)
  || route.path.startsWith('/admin/')
))

const workspaceLinks = computed(() => {
  const community = [
    { to: '/forum', code: 'CM', label: 'Cộng đồng' },
    { to: '/advisor', code: 'AI', label: 'Trợ lý dữ liệu' },
    { to: '/top-up', code: 'CR', label: 'Nạp tín dụng' },
  ]
  if (hasRole('Admin')) {
    return [
      { to: '/admin/dashboard', code: 'DB', label: 'Dashboard' },
      { to: '/admin/characters', code: 'CH', label: 'Nhân vật' },
      { to: '/admin/events', code: 'EV', label: 'Sự kiện' },
      { to: '/admin/releases', code: 'RL', label: 'Lịch ra mắt' },
      { to: '/staff', code: 'OP', label: 'Vận hành' },
      ...community,
    ]
  }
  if (hasRole('Staff')) return [{ to: '/staff', code: 'OP', label: 'Vận hành' }, ...community]
  return [{ to: '/account', code: 'HQ', label: 'Tổng quan' }, ...community]
})

const toggleLang = () => {
  const next = lang.value === 'VI' ? 'EN' : 'VI'
  lang.value = next
  locale.value = next.toLowerCase()
}

watch(() => route.fullPath, () => { isMobileMenuOpen.value = false })
</script>

<template>
  <div class="site-shell min-h-screen">
    <header class="site-header">
      <div class="site-header__signal">
        <div class="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <span>HERO DATA NETWORK // LIVE ARCHIVE</span>
          <span class="hidden sm:inline">DATABASE STATUS: <b>ONLINE</b></span>
        </div>
      </div>

      <div class="site-header__main mx-auto flex max-w-[1440px] items-center gap-5 px-4 sm:px-6">
        <RouterLink to="/" class="brand-lockup" aria-label="OPM Strongest Wiki">
          <span class="brand-lockup__mark"><i>O</i><i>S</i></span>
          <span><strong>OPM STRONGEST</strong><small>HERO DATA BUREAU</small></span>
        </RouterLink>

        <nav class="ml-auto hidden items-center gap-1 xl:flex" aria-label="Điều hướng chính">
          <RouterLink to="/characters" class="site-nav-link">{{ t('nav.characters') }}</RouterLink>
          <RouterLink to="/mastery" class="site-nav-link">{{ t('nav.mastery') }}</RouterLink>
          <div class="group relative">
            <button class="site-nav-link flex items-center gap-2" :class="{ 'is-active': isFeaturesRoute }">
              {{ t('nav.features') }}
              <svg class="h-3.5 w-3.5 transition group-hover:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" stroke-width="1.8" /></svg>
            </button>
            <div class="site-nav-menu">
              <RouterLink to="/core-lab">{{ t('nav.corelab') }}</RouterLink>
              <RouterLink to="/medals">{{ t('nav.medals') }}</RouterLink>
              <RouterLink to="/tactics">{{ t('nav.tactics') }}</RouterLink>
              <RouterLink to="/backgear">{{ t('nav.backgear') }}</RouterLink>
              <RouterLink to="/keepsakes">{{ t('nav.keepsakes') }}</RouterLink>
              <RouterLink to="/insignias">{{ t('nav.insignias') }}</RouterLink>
            </div>
          </div>
          <RouterLink to="/events" class="site-nav-link">{{ t('nav.events') }}</RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2 xl:ml-3">
          <button class="lang-control" :aria-label="`Language ${lang}`" @click="toggleLang">
            <span :class="{ active: lang === 'VI' }">VI</span><span :class="{ active: lang === 'EN' }">EN</span>
          </button>
          <RouterLink :to="hasValidSession() ? accountPath : '/login'" class="account-control">
            <span class="account-control__dot" />
            <span class="hidden max-w-[120px] truncate sm:block">{{ hasValidSession() ? authState.session?.displayName : t('nav.login') }}</span>
            <span class="sm:hidden">ID</span>
          </RouterLink>
          <button class="menu-control xl:hidden" aria-label="Mở menu" @click="isMobileMenuOpen = !isMobileMenuOpen">
            <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M8 12h12M4 17h16" stroke-width="1.8" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 6 12 12M18 6 6 18" stroke-width="1.8" /></svg>
          </button>
        </div>
      </div>

      <nav v-if="isMobileMenuOpen" class="mobile-command-menu">
        <RouterLink to="/characters">{{ t('nav.characters') }}</RouterLink>
        <RouterLink to="/mastery">{{ t('nav.mastery') }}</RouterLink>
        <RouterLink to="/events">{{ t('nav.events') }}</RouterLink>
        <RouterLink to="/tactics">{{ t('nav.tactics') }}</RouterLink>
        <RouterLink to="/backgear">{{ t('nav.backgear') }}</RouterLink>
        <RouterLink to="/keepsakes">{{ t('nav.keepsakes') }}</RouterLink>
        <RouterLink to="/insignias">{{ t('nav.insignias') }}</RouterLink>
      </nav>
    </header>

    <div v-if="isWorkspaceRoute" class="workspace-frame">
      <aside class="workspace-rail">
        <div class="workspace-profile">
          <span class="workspace-avatar">{{ authState.session?.displayName?.slice(0, 1)?.toUpperCase() || 'U' }}</span>
          <div><strong>{{ authState.session?.displayName }}</strong><small>{{ authState.session?.role }} ACCESS</small></div>
        </div>
        <p class="workspace-label">CONTROL DECK</p>
        <nav>
          <RouterLink v-for="item in workspaceLinks" :key="item.to" :to="item.to" class="workspace-link">
            <span>{{ item.code }}</span><b>{{ item.label }}</b>
          </RouterLink>
        </nav>
        <RouterLink to="/" class="workspace-exit">← Trở về Wiki</RouterLink>
      </aside>
      <div class="workspace-content">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <transition name="page" mode="out-in"><component :is="Component" :key="currentRoute.path" /></transition>
        </RouterView>
      </div>
    </div>

    <RouterView v-else class="flex-grow" v-slot="{ Component, route: currentRoute }">
      <transition name="page" mode="out-in"><component :is="Component" :key="currentRoute.path" /></transition>
    </RouterView>

    <footer v-if="!isWorkspaceRoute" class="site-footer">
      <div class="site-footer__accent" aria-hidden="true"></div>

      <div class="site-footer__main">
        <section class="site-footer__brand">
          <p class="site-footer__eyebrow"><span></span>{{ t('footer.eyebrow') }}</p>
          <RouterLink to="/" class="site-footer__lockup" aria-label="OPM Strongest Wiki">
            <span class="site-footer__mark"><i>O</i><i>S</i></span>
            <span><strong>OPM STRONGEST</strong><small>HERO DATA BUREAU</small></span>
          </RouterLink>
          <p class="site-footer__description">{{ t('footer.desc') }}</p>
        </section>

        <nav class="site-footer__navigation" :aria-label="t('footer.navigation')">
          <p class="site-footer__label">{{ t('footer.navigation') }}</p>
          <RouterLink to="/history" class="site-footer__link">
            <span>01</span>
            <span><strong>{{ t('footer.history') }}</strong><small>{{ t('footer.historyHint') }}</small></span>
            <b aria-hidden="true">↗</b>
          </RouterLink>
          <RouterLink to="/privacy" class="site-footer__link">
            <span>02</span>
            <span><strong>{{ t('footer.privacy') }}</strong><small>{{ t('footer.privacyHint') }}</small></span>
            <b aria-hidden="true">↗</b>
          </RouterLink>
        </nav>

        <section class="site-footer__status">
          <p class="site-footer__label">{{ t('footer.systemStatus') }}</p>
          <div class="site-footer__online"><span></span><strong>{{ t('footer.online') }}</strong></div>
          <p>{{ t('footer.independent') }}</p>
          <div class="site-footer__coordinates"><span>VN / SEA</span><span>2026</span></div>
        </section>
      </div>

      <div class="site-footer__bottom">
        <p>{{ t('footer.copyright', { year: currentYear }) }}</p>
        <span aria-hidden="true"></span>
        <p>{{ t('footer.disclaimer') }}</p>
      </div>
    </footer>

    <Analytics /><SpeedInsights />
  </div>
</template>

<style>
.page-enter-active,.page-leave-active{transition:opacity .22s ease,transform .22s ease}.page-enter-from{opacity:0;transform:translateY(8px)}.page-leave-to{opacity:0;transform:translateY(-5px)}
</style>
