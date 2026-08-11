import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getPortalPath, hasRole, hasValidSession } from '../services/authApi'

// Retry dynamic imports up to 2 times with a small delay. This prevents blank
// pages when chunk loads fail due to race conditions during fast navigation or
// flaky network conditions.
const retryImport = (loader, retries = 2, delay = 800) => () =>
  loader().catch((error) => {
    if (retries <= 0) throw error
    return new Promise((resolve) => globalThis.setTimeout(resolve, delay)).then(() =>
      retryImport(loader, retries - 1, delay)()
    )
  })

// Keep the landing page in the initial bundle and load feature pages only when
// users visit them. This avoids downloading the large data catalogs and Spine
// renderer on every first visit.
const DetailView = retryImport(() => import('../views/DetailView.vue'))
const CharacterListView = retryImport(() => import('../views/CharacterListView.vue'))
const TierRankingView = retryImport(() => import('../views/TierRankingView.vue'))
const MasteryView = retryImport(() => import('../views/MasteryView.vue'))
const GearCatalogView = retryImport(() => import('../views/GearCatalogView.vue'))
const BuffGearView = retryImport(() => import('../views/BuffGearView.vue'))
const CoreLabView = retryImport(() => import('../views/CoreLabView.vue'))
const CoreRefinementView = retryImport(() => import('../views/CoreRefinementView.vue'))
const EquipmentView = retryImport(() => import('../views/EquipmentView.vue'))
const EventsView = retryImport(() => import('../views/EventsView.vue'))
const EventDetailView = retryImport(() => import('../views/EventDetailView.vue'))
const PrivacyView = retryImport(() => import('../views/PrivacyView.vue'))
const HistoryView = retryImport(() => import('../views/HistoryView.vue'))
const MedalsView = retryImport(() => import('../views/MedalsView.vue'))
const TacticsView = retryImport(() => import('../views/TacticsView.vue'))
const BackgearView = retryImport(() => import('../views/BackgearView.vue'))
const StatsView = retryImport(() => import('../views/StatsView.vue'))
const TalentsView = retryImport(() => import('../views/TalentsView.vue'))
const EmailVerificationView = retryImport(() => import('../views/EmailVerificationView.vue'))
const AdminLoginView = retryImport(() => import('../views/AdminLoginView.vue'))
const AdminCharactersView = retryImport(() => import('../views/AdminCharactersView.vue'))
const AdminTierRankingView = retryImport(() => import('../views/AdminTierRankingView.vue'))
const AdminCommunityView = retryImport(() => import('../views/AdminCommunityView.vue'))
const AdminSystemsView = retryImport(() => import('../views/AdminSystemsView.vue'))
const LineupBuilderView = retryImport(() => import('../views/LineupBuilderView.vue'))
const CharacterCompareView = retryImport(() => import('../views/CharacterCompareView.vue'))
const TierMakerView = retryImport(() => import('../views/TierMakerView.vue'))
const UserPortalView = retryImport(() => import('../views/UserPortalView.vue'))
const ForumView = retryImport(() => import('../views/ForumView.vue'))
const AdvisorView = retryImport(() => import('../views/AdvisorView.vue'))
const TopUpHubView = retryImport(() => import('../views/TopUpHubView.vue'))
const BankPaymentView = retryImport(() => import('../views/BankPaymentView.vue'))
const StaffDashboardView = retryImport(() => import('../views/StaffDashboardView.vue'))
const AdminDashboardView = retryImport(() => import('../views/AdminDashboardView.vue'))
const AdminEventsView = retryImport(() => import('../views/AdminEventsView.vue'))
const AdminReleasesView = retryImport(() => import('../views/AdminReleasesView.vue'))
const AdminTopUpsView = retryImport(() => import('../views/AdminTopUpsView.vue'))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/medals',
      name: 'medals',
      component: MedalsView
    },
    {
      path: '/tactics',
      name: 'tactics',
      component: TacticsView
    },
    {
      path: '/backgear',
      name: 'backgear',
      component: BackgearView
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsView
    },
    {
      path: '/talents',
      name: 'talents',
      component: TalentsView
    },    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/character/:id',
      name: 'character-detail',
      component: DetailView,
      props: true
    },
    {
      path: '/characters',
      name: 'characters',
      component: CharacterListView
    },
    {
      path: '/tier-ranking',
      name: 'tier-ranking',
      component: TierRankingView
    },
    {
      path: '/mastery',
      name: 'mastery',
      component: MasteryView
    },
    {
      path: '/core-lab',
      name: 'core-lab',
      component: CoreLabView
    },
    {
      path: '/core-refinement',
      name: 'core-refinement',
      component: CoreRefinementView
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: GearCatalogView
    },
    {
      path: '/buff-gear',
      name: 'buff-gear',
      component: BuffGearView
    },
    {
      path: '/keepsakes',
      name: 'keepsakes',
      component: EquipmentView,
      props: { kind: 'keepsake' }
    },
    {
      path: '/keepsake/:id',
      name: 'keepsake-detail',
      component: EquipmentView,
      props: route => ({ kind: 'keepsake', id: route.params.id })
    },
    {
      path: '/insignias',
      name: 'insignias',
      component: EquipmentView,
      props: { kind: 'insignia' }
    },
    {
      path: '/insignia/:id',
      name: 'insignia-detail',
      component: EquipmentView,
      props: route => ({ kind: 'insignia', id: route.params.id })
    },
    {
      path: '/events',
      name: 'events',
      component: EventsView
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: EventDetailView
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyView
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView
    },
    {
      path: '/login',
      name: 'login',
      component: AdminLoginView
    },
    {
      path: '/register',
      redirect: { path: '/login', query: { mode: 'register' } }
    },
    {
      path: '/forgot-password',
      redirect: { path: '/login', query: { mode: 'forgot' } }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: AdminLoginView
    },    {
      path: '/verify-email',
      name: 'verify-email',
      component: EmailVerificationView
    },
    {
      path: '/admin/login',
      redirect: '/login'
    },
    {
      path: '/account',
      name: 'account',
      component: UserPortalView,
      meta: { requiresAuth: true }
    },
    {
      path: '/forum',
      name: 'forum',
      component: ForumView,
      meta: { requiresAuth: true }
    },
    {
      path: '/advisor',
      name: 'advisor',
      component: AdvisorView,
      meta: { requiresAuth: true }
    },
    {
      path: '/top-up',
      name: 'top-up',
      component: TopUpHubView
    },
    {
      path: '/top-up/payment/:id',
      name: 'bank-payment',
      component: BankPaymentView,
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/coupon-top-up',
      redirect: '/top-up'
    },
    {
      path: '/staff',
      name: 'staff-dashboard',
      component: StaffDashboardView,
      meta: { requiresAuth: true, roles: ['Staff', 'Admin'] }
    },
    {
      path: '/admin',
      redirect: '/admin/dashboard'
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/characters',
      name: 'admin-characters',
      component: AdminCharactersView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/events',
      name: 'admin-events',
      component: AdminEventsView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/releases',
      name: 'admin-releases',
      component: AdminReleasesView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/top-ups',
      name: 'admin-top-ups',
      component: AdminTopUpsView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/tier-ranking',
      name: 'admin-tier-ranking',
      component: AdminTierRankingView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/community',
      name: 'admin-community',
      component: AdminCommunityView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/admin/systems',
      name: 'admin-systems',
      component: AdminSystemsView,
      meta: { requiresAuth: true, roles: ['Admin'] }
    },
    {
      path: '/lineup-builder',
      name: 'lineup-builder',
      component: LineupBuilderView
    },
    {
      path: '/compare',
      name: 'compare',
      component: CharacterCompareView
    },
    {
      path: '/tier-maker',
      name: 'tier-maker',
      component: TierMakerView
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // Preserve the current scroll position when only query parameters change
    // (for example, selecting a Backgear character updates ?character=...).
    if (to.path === from.path && to.hash === from.hash) {
      return false
    }
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to) => {
  if ((to.meta.requiresAuth || to.meta.roles) && !hasValidSession()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !hasRole(...to.meta.roles)) {
    return getPortalPath()
  }
  if (to.name === 'login' && hasValidSession()) {
    return '/'
  }
  return true
})

export default router
