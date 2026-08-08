import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)
app.use(router)
app.use(i18n)

const mount = () => app.mount('#app')

if (document.querySelector('[data-app-boot]')) {
  router.isReady().then(mount, mount)
} else {
  mount()
}
