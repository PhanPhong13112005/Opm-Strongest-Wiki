<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import GlobalDataLoader from './components/GlobalDataLoader.vue'
import { pendingApiRequests } from './services/apiClient'
import { authState, clearSession, hasRole, hasValidSession } from './services/authApi'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const DeferredAnalytics = defineAsyncComponent(() => import('@vercel/analytics/vue').then(module => module.Analytics))
const DeferredSpeedInsights = defineAsyncComponent(() => import('@vercel/speed-insights/vue').then(module => module.SpeedInsights))
const telemetryReady = ref(false)
let telemetryDelayTimer = null
let telemetryIdleHandle = null
const isRouteLoading = ref(false)
const isGlobalLoading = computed(() => isRouteLoading.value)
const removeLoadingBeforeGuard = router.beforeEach(() => {
  isRouteLoading.value = true
  return true
})
const removeLoadingAfterHook = router.afterEach(() => {
  isRouteLoading.value = false
})
const removeLoadingErrorHook = router.onError(() => {
  isRouteLoading.value = false
})
const lang = ref(locale.value.toUpperCase())
const isMobileMenuOpen = ref(false)
const isMobileFeaturesOpen = ref(false)
const isMobileSystemsOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const currentYear = new Date().getFullYear()
const isAuthenticated = computed(() => Boolean(authState.session) && hasValidSession())
const workspaceRole = computed(() => String(authState.session?.role || 'User').toLowerCase())
const workspaceRoleLabel = computed(() => ({
  user: 'THÀNH VIÊN',
  staff: 'NHÂN VIÊN',
  admin: 'QUẢN TRỊ VIÊN',
}[workspaceRole.value] || 'THÀNH VIÊN'))
const accountRoleLabel = computed(() => ({
  User: 'Thành viên',
  Staff: 'Nhân viên',
  Admin: 'Quản trị viên',
}[authState.session?.role] || 'Thành viên'))
const roleMenuItem = computed(() => {
  if (authState.session?.role === 'Admin') {
    return { to: '/admin/dashboard', label: 'Vào trang Quản trị', hint: 'Dashboard và quản lý dữ liệu', code: 'QT' }
  }
  if (authState.session?.role === 'Staff') {
    return { to: '/staff', label: 'Vào trang Nhân viên', hint: 'Kiểm duyệt nội dung cộng đồng', code: 'NV' }
  }
  return { to: '/forum', label: 'Vào Diễn đàn', hint: 'Trao đổi cùng cộng đồng', code: 'DD' }
})
const systemRoutes = ['/equipment', '/buff-gear', '/stats', '/backgear', '/keepsakes', '/insignias']
const featureRoutes = ['/mastery', '/core-lab', '/core-refinement', '/medals', '/tactics', '/talents']
const isSystemsRoute = computed(() => systemRoutes.some(path => route.path.startsWith(path)))
const isFeaturesRoute = computed(() => featureRoutes.some(path => route.path.startsWith(path)))
const toggleMobileMenu = () => {
  const willOpen = !isMobileMenuOpen.value
  isMobileMenuOpen.value = willOpen
  if (willOpen) {
    isMobileFeaturesOpen.value = isFeaturesRoute.value
    isMobileSystemsOpen.value = isSystemsRoute.value
  }
}
const isWorkspaceRoute = computed(() => isAuthenticated.value && (
  ['/account', '/forum', '/advisor', '/staff'].includes(route.path)
  || route.path.startsWith('/admin/')
))

const workspaceLinks = computed(() => {
  const community = [
    { to: '/forum', code: 'DD', label: 'Diễn đàn' },
    { to: '/advisor', code: 'AI', label: 'Trợ lý AI', badge: 'THỬ NGHIỆM' },
  ]
  if (hasRole('Admin')) {
    return [
      { to: '/admin/dashboard', code: '01', label: 'Tổng quan' },
      { to: '/admin/characters', code: 'CH', label: 'Nhân vật' },
      { to: '/admin/events', code: 'EV', label: 'Sự kiện' },
      { to: '/admin/releases', code: 'RL', label: 'Lịch ra mắt' },
      { to: '/admin/top-ups', code: 'CP', label: 'Đơn Coupon' },
      { to: '/staff', code: 'KD', label: 'Kiểm duyệt' },
      ...community,
    ]
  }
  if (hasRole('Staff')) return [{ to: '/staff', code: '01', label: 'Tổng quan' }, ...community]
  return [
    { to: '/account', code: '01', label: 'Tổng quan' },
    ...community,
  ]
})

const toggleLang = () => {
  const next = lang.value === 'VI' ? 'EN' : 'VI'
  lang.value = next
  locale.value = next.toLowerCase()
}

const closeAccountMenuOutside = (event) => {
  if (isAccountMenuOpen.value && !accountMenuRef.value?.contains(event.target)) {
    isAccountMenuOpen.value = false
  }
}

const logout = async () => {
  clearSession()
  isAccountMenuOpen.value = false
  await router.push('/')
}

watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
  isMobileFeaturesOpen.value = false
  isMobileSystemsOpen.value = false
  isAccountMenuOpen.value = false
})
watch(locale, (value) => {
  document.documentElement.lang = value === 'en' ? 'en' : 'vi'
}, { immediate: true })
onMounted(() => {
  document.addEventListener('pointerdown', closeAccountMenuOutside)
  telemetryDelayTimer = globalThis.setTimeout(() => {
    telemetryDelayTimer = null
    const enableTelemetry = () => {
      telemetryIdleHandle = null
      telemetryReady.value = true
    }
    if (typeof globalThis.requestIdleCallback === 'function') {
      telemetryIdleHandle = globalThis.requestIdleCallback(enableTelemetry, { timeout: 1_500 })
    } else {
      enableTelemetry()
    }
  }, 3_500)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeAccountMenuOutside)
  if (telemetryDelayTimer !== null) globalThis.clearTimeout(telemetryDelayTimer)
  if (telemetryIdleHandle !== null && typeof globalThis.cancelIdleCallback === 'function') {
    globalThis.cancelIdleCallback(telemetryIdleHandle)
  }
  removeLoadingBeforeGuard()
  removeLoadingAfterHook()
  removeLoadingErrorHook()
})
</script>

<template>
  <div class="site-shell min-h-screen" :aria-busy="isGlobalLoading">
    <GlobalDataLoader :active="isGlobalLoading" />
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
          <RouterLink to="/tier-ranking" class="site-nav-link">{{ t('nav.tierRanking') }}</RouterLink>
          <div class="group relative">
            <button class="site-nav-link flex items-center gap-2" :class="{ 'is-active': isFeaturesRoute }">
              {{ t('nav.features') }}
              <svg class="h-3.5 w-3.5 transition group-hover:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" stroke-width="1.8" /></svg>
            </button>
            <div class="site-nav-menu">
              <RouterLink to="/mastery">{{ t('nav.mastery') }}</RouterLink>
              <RouterLink to="/core-lab">{{ t('nav.corelab') }}</RouterLink>
              <RouterLink to="/core-refinement">{{ t('nav.coreRefinement') }}</RouterLink>
              <RouterLink to="/medals">{{ t('nav.medals') }}</RouterLink>
              <RouterLink to="/tactics">{{ t('nav.tactics') }}</RouterLink>
              <RouterLink to="/talents">{{ t('nav.talents') }}</RouterLink>
            </div>
          </div>
          <div class="group relative">
            <button class="site-nav-link flex items-center gap-2" :class="{ 'is-active': isSystemsRoute }">
              {{ t('nav.systems') }}
              <svg class="h-3.5 w-3.5 transition group-hover:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" stroke-width="1.8" /></svg>
            </button>
            <div class="site-nav-menu">
              <RouterLink to="/equipment">{{ t('nav.equipment') }}</RouterLink>
              <RouterLink to="/buff-gear">{{ t('nav.buffGear') }}</RouterLink>
              <RouterLink to="/stats">{{ t('nav.stats') }}</RouterLink>
              <RouterLink to="/backgear">{{ t('nav.backgear') }}</RouterLink>
              <RouterLink to="/keepsakes">{{ t('nav.keepsakes') }}</RouterLink>
              <RouterLink to="/insignias">{{ t('nav.insignias') }}</RouterLink>
            </div>
          </div>
          <RouterLink to="/events" class="site-nav-link">{{ t('nav.events') }}</RouterLink>
          <RouterLink to="/top-up" class="site-nav-link">{{ t('nav.topup') }}</RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2 xl:ml-3">
          <button class="lang-control" :aria-label="`Language ${lang}`" @click="toggleLang">
            <span :class="{ active: lang === 'VI' }">VI</span><span :class="{ active: lang === 'EN' }">EN</span>
          </button>
          <div v-if="isAuthenticated" ref="accountMenuRef" class="account-menu" :class="`account-menu--${workspaceRole}`">
            <button
              class="account-control account-control--signed-in"
              type="button"
              :aria-expanded="isAccountMenuOpen"
              aria-haspopup="menu"
              @click="isAccountMenuOpen = !isAccountMenuOpen"
            >
              <span class="account-control__avatar">{{ authState.session?.displayName?.slice(0, 1)?.toUpperCase() || 'U' }}</span>
              <span class="account-control__identity hidden sm:block">
                <strong>{{ authState.session?.displayName }}</strong>
                <small>{{ accountRoleLabel }}</small>
              </span>
              <svg class="account-control__chevron" :class="{ 'is-open': isAccountMenuOpen }" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" stroke-width="1.8" /></svg>
            </button>

            <transition name="account-menu">
              <div v-if="isAccountMenuOpen" class="account-dropdown" role="menu">
                <header>
                  <span class="account-dropdown__avatar">{{ authState.session?.displayName?.slice(0, 1)?.toUpperCase() || 'U' }}</span>
                  <div>
                    <strong>{{ authState.session?.displayName }}</strong>
                    <small>@{{ authState.session?.username }} · {{ accountRoleLabel }}</small>
                  </div>
                </header>
                <RouterLink :to="roleMenuItem.to" class="account-dropdown__primary" role="menuitem">
                  <span>{{ roleMenuItem.code }}</span>
                  <div><strong>{{ roleMenuItem.label }}</strong><small>{{ roleMenuItem.hint }}</small></div>
                  <b>→</b>
                </RouterLink>
                <RouterLink to="/account" class="account-dropdown__link" role="menuitem">
                  <span>Hồ sơ và thông tin tài khoản</span><b>→</b>
                </RouterLink>
                <button class="account-dropdown__logout" type="button" role="menuitem" @click="logout">Đăng xuất</button>
              </div>
            </transition>
          </div>
          <RouterLink v-else to="/login" class="account-control">
            <span class="account-control__dot" />
            <span class="hidden sm:block">{{ t('nav.login') }}</span>
            <span class="sm:hidden">ID</span>
          </RouterLink>
          <button class="menu-control xl:hidden" aria-label="Mở menu" @click="toggleMobileMenu">
            <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M8 12h12M4 17h16" stroke-width="1.8" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 6 12 12M18 6 6 18" stroke-width="1.8" /></svg>
          </button>
        </div>
      </div>

      <transition name="mobile-menu">
        <nav v-if="isMobileMenuOpen" class="mobile-command-menu" aria-label="Mobile navigation">
          <div class="mobile-command-menu__primary">
            <RouterLink to="/characters">{{ t('nav.characters') }}</RouterLink>
            <RouterLink to="/tier-ranking">{{ t('nav.tierRanking') }}</RouterLink>
            <RouterLink to="/events">{{ t('nav.events') }}</RouterLink>
            <RouterLink to="/top-up">{{ t('nav.topup') }}</RouterLink>
          </div>

          <section class="mobile-command-menu__section">
            <button type="button" class="mobile-command-menu__toggle" :class="{ 'is-active': isFeaturesRoute }" :aria-expanded="isMobileFeaturesOpen" @click="isMobileFeaturesOpen = !isMobileFeaturesOpen">
              <span>{{ t('nav.features') }}</span>
              <small>06</small>
              <svg :class="{ 'is-open': isMobileFeaturesOpen }" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" stroke-width="1.8" /></svg>
            </button>
            <transition name="mobile-features">
              <div v-if="isMobileFeaturesOpen" class="mobile-command-menu__features">
                <RouterLink to="/mastery">{{ t('nav.mastery') }}</RouterLink>
                <RouterLink to="/core-lab">{{ t('nav.corelab') }}</RouterLink>
                <RouterLink to="/core-refinement">{{ t('nav.coreRefinement') }}</RouterLink>
                <RouterLink to="/medals">{{ t('nav.medals') }}</RouterLink>
                <RouterLink to="/tactics">{{ t('nav.tactics') }}</RouterLink>
              <RouterLink to="/talents">{{ t('nav.talents') }}</RouterLink>
              </div>
            </transition>
          </section>

          <section class="mobile-command-menu__section">
            <button type="button" class="mobile-command-menu__toggle" :class="{ 'is-active': isSystemsRoute }" :aria-expanded="isMobileSystemsOpen" @click="isMobileSystemsOpen = !isMobileSystemsOpen">
              <span>{{ t('nav.systems') }}</span>
              <small>06</small>
              <svg :class="{ 'is-open': isMobileSystemsOpen }" viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="m5 7.5 5 5 5-5" stroke-width="1.8" /></svg>
            </button>
            <transition name="mobile-features">
              <div v-if="isMobileSystemsOpen" class="mobile-command-menu__features">
                <RouterLink to="/equipment">{{ t('nav.equipment') }}</RouterLink>
                <RouterLink to="/buff-gear">{{ t('nav.buffGear') }}</RouterLink>
              <RouterLink to="/stats">{{ t('nav.stats') }}</RouterLink>
                <RouterLink to="/backgear">{{ t('nav.backgear') }}</RouterLink>
                <RouterLink to="/keepsakes">{{ t('nav.keepsakes') }}</RouterLink>
                <RouterLink to="/insignias">{{ t('nav.insignias') }}</RouterLink>
              </div>
            </transition>
          </section>
        </nav>
      </transition>
    </header>

    <div v-if="isWorkspaceRoute" class="workspace-frame" :class="`workspace-frame--${workspaceRole}`">
      <aside class="workspace-rail">
        <div class="workspace-profile">
          <span class="workspace-avatar">{{ authState.session?.displayName?.slice(0, 1)?.toUpperCase() || 'U' }}</span>
          <div><strong>{{ authState.session?.displayName }}</strong><small>{{ workspaceRoleLabel }}</small></div>
        </div>
        <p class="workspace-label">KHU VỰC LÀM VIỆC</p>
        <nav>
          <RouterLink v-for="item in workspaceLinks" :key="item.to" :to="item.to" class="workspace-link">
            <span>{{ item.code }}</span><b>{{ item.label }}<small v-if="item.badge">{{ item.badge }}</small></b>
          </RouterLink>
        </nav>
        <RouterLink to="/" class="workspace-exit">← Trở về trang Wiki</RouterLink>
      </aside>
      <div class="workspace-content">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <transition name="page" mode="out-in"><component :is="Component" :key="currentRoute.path" /></transition>
        </RouterView>
      </div>
    </div>

    <div v-else class="flex-grow">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <transition name="page" mode="out-in"><component :is="Component" :key="currentRoute.path" /></transition>
      </RouterView>
    </div>

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
          <p class="site-footer__contact-email"><a href="mailto:luuphongphan12@gmail.com" class="text-amber-400 hover:underline">luuphongphan12@gmail.com</a></p>
          <div class="site-footer__coordinates"><span>VN / SEA</span><span>2026</span></div>
        </section>
      </div>

      <div class="site-footer__bottom">
        <p>{{ t('footer.copyright', { year: currentYear }) }}</p>
        <span aria-hidden="true"></span>
        <p>{{ t('footer.disclaimer') }}</p>
      </div>
    </footer>

    <template v-if="telemetryReady">
      <DeferredAnalytics />
      <DeferredSpeedInsights />
    </template>
  </div>
</template>

<style>
.page-enter-active,.page-leave-active{transition:opacity .22s ease,transform .22s ease}.page-enter-from{opacity:0;transform:translateY(8px)}.page-leave-to{opacity:0;transform:translateY(-5px)}
</style>
