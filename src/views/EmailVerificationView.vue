<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { authState, refreshSession, verifyEmail } from '../services/authApi'

const route = useRoute()
const status = ref('loading')
const message = ref('Đang kiểm tra liên kết xác minh Gmail...')
const destination = computed(() => authState.session ? '/account' : '/login')

onMounted(async () => {
  const token = String(route.query.token || '')
  if (!token) {
    status.value = 'error'
    message.value = 'Liên kết xác minh Gmail không hợp lệ.'
    return
  }

  try {
    const result = await verifyEmail(token)
    status.value = 'success'
    message.value = result.message || 'Gmail đã được xác minh thành công.'
    if (authState.session) await refreshSession().catch(() => {})
  } catch (error) {
    status.value = 'error'
    message.value = error?.message || 'Liên kết xác minh Gmail không hợp lệ hoặc đã hết hạn.'
  }
})
</script>

<template>
  <main class="verification-page">
    <section class="verification-card" :class="`verification-card--${status}`">
      <div class="verification-icon" aria-hidden="true">
        <span v-if="status === 'loading'" class="verification-spinner" />
        <span v-else-if="status === 'success'">✓</span>
        <span v-else>!</span>
      </div>
      <p class="verification-kicker">ACCOUNT SECURITY</p>
      <h1>Xác minh Gmail</h1>
      <p :role="status === 'error' ? 'alert' : 'status'">{{ message }}</p>
      <RouterLink v-if="status !== 'loading'" :to="destination">
        {{ authState.session ? 'Về trang tài khoản' : 'Đến trang đăng nhập' }}
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.verification-page{display:grid;min-height:calc(100vh - 150px);place-items:center;padding:48px 18px;background:radial-gradient(circle at 50% 20%,rgba(77,211,247,.1),transparent 38%)}
.verification-card{width:min(100%,560px);border:1px solid rgba(100,145,180,.22);border-radius:22px;background:linear-gradient(145deg,rgba(11,25,39,.98),rgba(6,13,22,.98));padding:42px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.3)}
.verification-icon{display:grid;width:66px;height:66px;margin:0 auto 20px;place-items:center;border:1px solid rgba(85,216,255,.35);border-radius:18px;background:rgba(85,216,255,.09);color:#55d8ff;font-size:30px;font-weight:950}
.verification-card--success .verification-icon{border-color:rgba(83,225,169,.4);background:rgba(83,225,169,.1);color:#53e1a9}
.verification-card--error .verification-icon{border-color:rgba(255,114,128,.4);background:rgba(255,114,128,.1);color:#ff7280}
.verification-spinner{width:25px;height:25px;border:3px solid rgba(85,216,255,.22);border-top-color:#55d8ff;border-radius:50%;animation:verification-spin .8s linear infinite}
.verification-kicker{margin:0;color:#55d8ff;font:850 10px/1.2 ui-monospace,monospace;letter-spacing:.17em}
h1{margin:9px 0 12px;color:#f4f8fc;font-size:clamp(28px,5vw,42px);letter-spacing:-.035em}
.verification-card>p:not(.verification-kicker){margin:0 auto;color:#94aabd;font-size:14px;line-height:1.7}
a{display:inline-flex;margin-top:26px;border-radius:10px;background:#55d8ff;padding:12px 18px;color:#04111a;font-size:13px;font-weight:900}
@keyframes verification-spin{to{transform:rotate(360deg)}}
@media(max-width:560px){.verification-page{min-height:calc(100vh - 90px);padding:24px 14px}.verification-card{padding:30px 20px}}
@media(prefers-reduced-motion:reduce){.verification-spinner{animation-duration:1.8s}}
</style>