import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { getPortalPath, hasRole, hasValidSession } from '../services/authApi'

// Keep the landing page in the initial bundle and load feature pages only when
// users visit them. This avoids downloading the large data catalogs and Spine
// renderer on every first visit.
const DetailView = () => import('../views/DetailView.vue')
const CharacterListView = () => import('../views/CharacterListView.vue')
const MasteryView = () => import('../views/MasteryView.vue')
const CoreLabView = () => import('../views/CoreLabView.vue')
const EquipmentView = () => import('../views/EquipmentView.vue')
const EventsView = () => import('../views/EventsView.vue')
const EventDetailView = () => import('../views/EventDetailView.vue')
const PrivacyView = () => import('../views/PrivacyView.vue')
const HistoryView = () => import('../views/HistoryView.vue')
const MedalsView = () => import('../views/MedalsView.vue')
const TacticsView = () => import('../views/TacticsView.vue')
const BackgearView = () => import('../views/BackgearView.vue')
const AdminLoginView = () => import('../views/AdminLoginView.vue')
const AdminCharactersView = () => import('../views/AdminCharactersView.vue')
const UserPortalView = () => import('../views/UserPortalView.vue')
const ForumView = () => import('../views/ForumView.vue')
const AdvisorView = () => import('../views/AdvisorView.vue')
const TopUpView = () => import('../views/TopUpView.vue')
const StaffDashboardView = () => import('../views/StaffDashboardView.vue')
const AdminDashboardView = () => import('../views/AdminDashboardView.vue')
const AdminEventsView = () => import('../views/AdminEventsView.vue')
const AdminReleasesView = () => import('../views/AdminReleasesView.vue')

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
      component: TopUpView,
      meta: { requiresAuth: true }
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
    return getPortalPath()
  }
  return true
})

export default router
