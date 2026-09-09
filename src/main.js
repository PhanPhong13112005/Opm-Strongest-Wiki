import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { inject } from '@vercel/analytics'

inject()

const app = createApp(App)
app.use(router)
app.use(i18n)

const mount = () => app.mount('#app')

router.isReady().then(mount, mount)
