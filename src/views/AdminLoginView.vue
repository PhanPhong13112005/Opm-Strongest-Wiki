<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAdminApiConfigured, loginAdmin } from '../services/adminApi'

const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

const submit = async () => {
  error.value = ''
  submitting.value = true
  try {
    await loginAdmin(username.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/characters'
    await router.replace(redirect)
  } catch (exception) {
    error.value = exception.status === 401
      ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
      : exception.message || 'Không thể kết nối backend quản trị.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-24">
    <section class="glass-card w-full max-w-md rounded-2xl border border-white/10 p-7 sm:p-9">
      <p class="mb-2 text-xs font-black uppercase tracking-[0.24em] text-opm-gold">OPM Wiki Admin</p>
      <h1 class="text-3xl font-black text-white">Đăng nhập quản trị</h1>
      <p class="mt-3 text-sm leading-6 text-gray-400">
        Phiên đăng nhập chỉ được giữ trong tab hiện tại và tự hết hạn theo cấu hình backend.
      </p>

      <div v-if="!isAdminApiConfigured()" class="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Chưa cấu hình <code>VITE_API_BASE_URL</code>. Trang quản trị cần backend ASP.NET Core đang hoạt động.
      </div>

      <form class="mt-7 space-y-5" @submit.prevent="submit">
        <label class="block">
          <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Tên đăng nhập</span>
          <input v-model="username" autocomplete="username" required class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-opm-gold" />
        </label>
        <label class="block">
          <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Mật khẩu</span>
          <input v-model="password" type="password" autocomplete="current-password" required class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-opm-gold" />
        </label>

        <p v-if="error" role="alert" class="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{{ error }}</p>

        <button :disabled="submitting || !isAdminApiConfigured()" class="w-full rounded-xl bg-opm-gold px-4 py-3 font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          {{ submitting ? 'Đang đăng nhập…' : 'Đăng nhập' }}
        </button>
      </form>
    </section>
  </main>
</template>
