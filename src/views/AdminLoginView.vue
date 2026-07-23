<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAuthApiConfigured, login, register } from '../services/authApi'

const route = useRoute()
const router = useRouter()
const mode = ref(route.query.mode === 'register' ? 'register' : 'login')
const username = ref('')
const displayName = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const submitting = ref(false)

const isRegister = computed(() => mode.value === 'register')

const submit = async () => {
  error.value = ''
  submitting.value = true

  try {
    if (isRegister.value) {
      await register(username.value.trim(), displayName.value.trim(), password.value)
    } else {
      await login(username.value.trim(), password.value)
    }
    await router.replace('/')
  } catch (exception) {
    error.value = exception.message || 'Không thể kết nối hệ thống tài khoản.'
  } finally {
    submitting.value = false
  }
}

const switchMode = () => {
  mode.value = isRegister.value ? 'login' : 'register'
  error.value = ''
}
</script>

<template>
  <main class="login-page">
    <section class="login-card" :aria-labelledby="isRegister ? 'register-title' : 'login-title'">
      <header class="login-heading">
        <h1 :id="isRegister ? 'register-title' : 'login-title'">
          {{ isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập' }}
        </h1>
        <span>
          {{ isRegister
            ? 'Tạo tài khoản để tham gia diễn đàn, bình luận và sử dụng các tính năng cộng đồng.'
            : 'Đăng nhập để tiếp tục sử dụng tài khoản của bạn.' }}
        </span>
      </header>

      <div v-if="!isAuthApiConfigured()" class="login-notice" role="alert">
        Không thể kết nối máy chủ tài khoản. Vui lòng thử lại sau.
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label>
          <span>Tên đăng nhập</span>
          <input
            v-model="username"
            autocomplete="username"
            minlength="3"
            maxlength="30"
            required
            placeholder="Nhập tên đăng nhập"
          />
        </label>

        <label v-if="isRegister">
          <span>Tên hiển thị</span>
          <input
            v-model="displayName"
            autocomplete="name"
            minlength="2"
            maxlength="60"
            required
            placeholder="Tên hiển thị trong cộng đồng"
          />
        </label>

        <label>
          <span>Mật khẩu</span>
          <span class="password-field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              minlength="8"
              maxlength="72"
              required
              placeholder="Tối thiểu 8 ký tự"
            />
            <button
              type="button"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Ẩn' : 'Hiện' }}
            </button>
          </span>
        </label>

        <p v-if="error" role="alert" class="login-error">{{ error }}</p>

        <button class="login-submit" :disabled="submitting || !isAuthApiConfigured()">
          {{ submitting ? 'Đang xử lý…' : (isRegister ? 'Đăng ký' : 'Đăng nhập') }}
        </button>
      </form>

      <p class="login-switch">
        {{ isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?' }}
        <button type="button" @click="switchMode">
          {{ isRegister ? 'Đăng nhập' : 'Đăng ký ngay' }}
        </button>
      </p>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: calc(100vh - 96px);
  place-items: center;
  padding: 56px 20px 72px;
  background:
    radial-gradient(circle at 50% 0%, rgba(73, 205, 255, .09), transparent 34%),
    #060a11;
}

.login-card {
  width: min(100%, 480px);
  border: 1px solid rgba(125, 157, 185, .2);
  border-radius: 18px;
  background: rgba(12, 18, 28, .96);
  padding: 42px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .36);
  animation: login-card-in .28s ease-out both;
}

@keyframes login-card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-heading {
  margin: 0;
}

.login-heading h1 {
  margin: 0;
  color: #f7faff;
  font-size: clamp(32px, 6vw, 40px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -.035em;
}

.login-heading > span {
  display: block;
  margin-top: 12px;
  color: #9babbc;
  font-size: 15px;
  line-height: 1.65;
}

.login-form {
  display: grid;
  gap: 20px;
  margin-top: 30px;
}

.login-form label > span:first-child {
  display: block;
  margin-bottom: 9px;
  color: #dce6ef;
  font-size: 14px;
  font-weight: 750;
}

.login-form input {
  width: 100%;
  height: 50px;
  border: 1px solid rgba(126, 157, 184, .27);
  border-radius: 10px;
  background: #070c13;
  padding: 0 15px;
  color: #eef6ff;
  font-size: 15px;
  outline: none;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.login-form input::placeholder {
  color: #607387;
}

.login-form input:hover {
  border-color: rgba(126, 183, 218, .46);
}

.login-form input:focus {
  border-color: #55d8ff;
  background: #09121d;
  box-shadow: 0 0 0 3px rgba(85, 216, 255, .1);
}

.password-field {
  position: relative;
  display: block;
}

.password-field input {
  padding-right: 66px;
}

.password-field button {
  position: absolute;
  right: 6px;
  top: 50%;
  min-width: 48px;
  transform: translateY(-50%);
  border-radius: 7px;
  padding: 8px 7px;
  color: #82cfe8;
  font-size: 12px;
  font-weight: 800;
}

.password-field button:hover,
.password-field button:focus-visible {
  background: rgba(85, 216, 255, .09);
  color: #dff8ff;
  outline: none;
}

.login-submit {
  min-height: 50px;
  margin-top: 4px;
  border-radius: 10px;
  background: #55d8ff;
  color: #031019;
  font-size: 15px;
  font-weight: 900;
  transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #79e2ff;
  box-shadow: 0 10px 28px rgba(85, 216, 255, .18);
}

.login-submit:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit:disabled {
  cursor: not-allowed;
  opacity: .48;
}

.login-switch {
  margin-top: 24px;
  color: #9babbc;
  text-align: center;
  font-size: 14px;
}

.login-switch button {
  margin-left: 4px;
  color: #63dcff;
  font-weight: 850;
}

.login-switch button:hover {
  color: #b8f0ff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.login-notice,
.login-error {
  font-size: 13px;
  line-height: 1.55;
}

.login-notice,
.login-error {
  border-radius: 9px;
  padding: 12px 14px;
}

.login-notice {
  margin-top: 22px;
  border: 1px solid rgba(255, 181, 79, .25);
  background: rgba(255, 181, 79, .07);
  color: #f0c178;
}

.login-error {
  border: 1px solid rgba(255, 106, 87, .25);
  background: rgba(255, 106, 87, .07);
  color: #ff9385;
}

@media (max-width: 560px) {
  .login-page {
    place-items: start center;
    padding: 28px 14px 48px;
  }

  .login-card {
    border-radius: 14px;
    padding: 28px 22px;
  }

  .login-heading h1 {
    font-size: 32px;
  }

  .login-heading > span {
    font-size: 14px;
  }
}
</style>
