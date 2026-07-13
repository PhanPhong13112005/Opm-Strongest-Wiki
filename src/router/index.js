import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DetailView from '../views/DetailView.vue'
import CharacterListView from '../views/CharacterListView.vue'
import MasteryView from '../views/MasteryView.vue'
import CoreLabView from '../views/CoreLabView.vue'
import EquipmentView from '../views/EquipmentView.vue'
import EventsView from '../views/EventsView.vue'
import EventDetailView from '../views/EventDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
