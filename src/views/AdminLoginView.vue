<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAuthApiConfigured, login, register, requestPasswordReset, resetPassword } from '../services/authApi'

const route = useRoute()
const router = useRouter()
const initialMode = route.name === 'reset-password'
  ? 'reset'
  : route.query.mode === 'register'
    ? 'register'
    : route.query.mode === 'forgot'
      ? 'forgot'
      : 'login'
const mode = ref(initialMode)
const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const error = ref('')
const notice = ref('')
const developmentResetUrl = ref('')
const submitting = ref(false)
const completed = ref(false)
const transitionDirection = ref('forward')

const isRegister = computed(() => mode.value === 'register')
const isForgot = computed(() => mode.value === 'forgot')
const isReset = computed(() => mode.value === 'reset')
const titleId = computed(() => `${mode.value}-title`)
const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))
const destinationAfterAuth = computed(() => {
  const destination = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return destination.startsWith('/') && !destination.startsWith('//') ? destination : '/'
})

const submit = async () => {
  error.value = ''
  notice.value = ''
  developmentResetUrl.value = ''
  completed.value = false
  submitting.value = true

  try {
    if (isForgot.value) {
      const result = await requestPasswordReset(email.value.trim())
      notice.value = result.message
      developmentResetUrl.value = result.resetUrl || ''
      return
    }
    if (isReset.value) {
      if (!route.query.token) throw new Error('Liên kết đặt lại mật khẩu không hợp lệ.')
      if (password.value !== passwordConfirm.value) throw new Error('Mật khẩu xác nhận chưa khớp.')
      const result = await resetPassword(String(route.query.token), password.value)
      notice.value = result.message
      password.value = ''
      passwordConfirm.value = ''
      return
    }
    if (isRegister.value) {
      await register(username.value.trim(), email.value.trim(), password.value)
    } else {
      await login(username.value.trim(), password.value)
    }
    completed.value = true
    await wait(440)
    await router.replace(destinationAfterAuth.value)
  } catch (exception) {
    completed.value = false
    error.value = exception.message || 'Không thể kết nối hệ thống tài khoản.'
  } finally {
    submitting.value = false
  }
}

const changeMode = (nextMode, direction) => {
  if (submitting.value || mode.value === nextMode) return
  transitionDirection.value = direction
  mode.value = nextMode
  error.value = ''
  notice.value = ''
  developmentResetUrl.value = ''
  completed.value = false
  showPassword.value = false
}

const switchMode = () => {
  changeMode(isForgot.value || isReset.value || isRegister.value ? 'login' : 'register', isRegister.value || isForgot.value || isReset.value ? 'back' : 'forward')
}

const openForgotPassword = () => {
  changeMode('forgot', 'forward')
}
</script>

<template>
  <main class="login-page">
    <section class="login-card" :aria-labelledby="titleId">
      <Transition name="login-panel" mode="out-in">
        <div :key="mode" class="login-panel" :class="`is-${transitionDirection}`">
      <header class="login-heading">
        <h1 :id="titleId">
          {{ isRegister ? 'Đăng ký tài khoản' : isForgot ? 'Quên mật khẩu' : isReset ? 'Đặt mật khẩu mới' : 'Đăng nhập' }}
        </h1>
        <span>
          {{ isRegister
            ? 'Đăng ký bằng Gmail để bảo vệ tài khoản và khôi phục mật khẩu khi cần.'
            : isForgot
              ? 'Nhập Gmail đã đăng ký. Hệ thống sẽ gửi liên kết đặt lại mật khẩu dùng một lần.'
              : isReset
                ? 'Tạo mật khẩu mới có từ 8 đến 72 ký tự cho tài khoản của bạn.'
                : 'Đăng nhập bằng tên tài khoản hoặc Gmail.' }}
        </span>
      </header>

      <div v-if="!isAuthApiConfigured()" class="login-notice" role="alert">
        Không thể kết nối máy chủ tài khoản. Vui lòng thử lại sau.
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label v-if="!isForgot && !isReset">
          <span>{{ isRegister ? 'Tên đăng nhập' : 'Tên đăng nhập hoặc Gmail' }}</span>
          <input
            v-model="username"
            autocomplete="username"
            minlength="3"
            maxlength="254"
            required
            :placeholder="isRegister ? 'Chọn tên đăng nhập' : 'Nhập tên đăng nhập hoặc Gmail'"
          />
        </label>

        <label v-if="isRegister || isForgot">
          <span>Địa chỉ Gmail</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            maxlength="254"
            required
            placeholder="tenban@gmail.com"
          />
          <small v-if="isRegister" class="login-field-hint">Gmail này được dùng để khôi phục mật khẩu.</small>
        </label>

        <label v-if="!isForgot">
          <span>{{ isReset ? 'Mật khẩu mới' : 'Mật khẩu' }}</span>
          <span class="password-field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isRegister || isReset ? 'new-password' : 'current-password'"
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

        <label v-if="isReset">
          <span>Xác nhận mật khẩu mới</span>
          <input
            v-model="passwordConfirm"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            minlength="8"
            maxlength="72"
            required
            placeholder="Nhập lại mật khẩu mới"
          />
        </label>

        <button v-if="!isRegister && !isForgot && !isReset" class="login-forgot" type="button" @click="openForgotPassword">
          Quên mật khẩu?
        </button>

        <Transition name="login-feedback">
          <p
            v-if="submitting && !completed && !isRegister && !isForgot && !isReset"
            class="login-checking"
            role="status"
            aria-live="polite"
          >
            <span class="login-checking-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span>Đang kiểm tra thông tin đăng nhập…</span>
          </p>
        </Transition>

        <p v-if="error" role="alert" class="login-error">{{ error }}</p>
        <p v-if="notice" role="status" class="login-success">{{ notice }}</p>
        <a v-if="developmentResetUrl" class="login-development-link" :href="developmentResetUrl">
          Mở liên kết đặt lại mật khẩu local
        </a>

        <button
          class="login-submit"
          :class="{ 'is-loading': submitting && !completed, 'is-complete': completed }"
          :disabled="submitting || !isAuthApiConfigured()"
        >
          <span v-if="submitting && !completed" class="login-spinner" aria-hidden="true"></span>
          <span v-else-if="completed" class="login-check" aria-hidden="true">✓</span>
          <span>
            {{ completed
              ? isRegister ? 'Đăng ký thành công' : 'Đăng nhập thành công'
              : submitting
                ? isRegister || isForgot || isReset ? 'Đang xử lý…' : 'Đang kiểm tra…'
                : isRegister
                  ? 'Đăng ký bằng Gmail'
                  : isForgot
                    ? 'Gửi liên kết'
                    : isReset
                      ? 'Cập nhật mật khẩu'
                      : 'Đăng nhập' }}
          </span>
        </button>
      </form>

      <p class="login-switch">
        {{ isForgot || isReset ? 'Quay lại tài khoản?' : isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?' }}
        <button type="button" @click="switchMode">
          {{ isForgot || isReset ? 'Đăng nhập' : isRegister ? 'Đăng nhập' : 'Đăng ký ngay' }}
        </button>
      </p>
        </div>
      </Transition>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  isolation: isolate;
  display: grid;
  overflow: hidden;
  min-height: calc(100vh - 96px);
  place-items: center;
  padding: 56px 20px 72px;
  background:
    radial-gradient(circle at 50% 0%, rgba(73, 205, 255, .09), transparent 34%),
    #060a11;
}

.login-page::before,
.login-page::after {
  position: absolute;
  z-index: -1;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  content: '';
  filter: blur(10px);
  opacity: .42;
  pointer-events: none;
}

.login-page::before {
  top: -190px;
  left: max(-170px, calc(50% - 500px));
  background: radial-gradient(circle, rgba(85, 216, 255, .26), transparent 68%);
  animation: login-orb-left 9s ease-in-out infinite alternate;
}

.login-page::after {
  right: max(-190px, calc(50% - 520px));
  bottom: -210px;
  background: radial-gradient(circle, rgba(107, 92, 255, .2), transparent 68%);
  animation: login-orb-right 11s ease-in-out infinite alternate;
}

.login-card {
  overflow: hidden;
  width: min(100%, 480px);
  border: 1px solid rgba(125, 157, 185, .2);
  border-radius: 18px;
  background: rgba(12, 18, 28, .96);
  padding: 42px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .36);
  animation: login-card-in .28s ease-out both;
}

@keyframes login-card-in {
  from { opacity: 0; transform: translateY(8px) scale(.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes login-orb-left {
  to { transform: translate3d(80px, 48px, 0) scale(1.08); }
}

@keyframes login-orb-right {
  to { transform: translate3d(-74px, -52px, 0) scale(.92); }
}

.login-panel {
  will-change: opacity, transform;
}

.login-panel-enter-active,
.login-panel-leave-active {
  transition:
    opacity .28s ease,
    transform .36s cubic-bezier(.22, .8, .3, 1),
    filter .3s ease;
}

.login-panel-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: translateX(52px) scale(.985);
}

.login-panel-leave-to {
  opacity: 0;
  filter: blur(6px);
  transform: translateX(-52px) scale(.985);
}

.login-panel.is-back.login-panel-enter-from {
  transform: translateX(-52px) scale(.985);
}

.login-panel.is-back.login-panel-leave-to {
  transform: translateX(52px) scale(.985);
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

.login-field-hint {
  display: block;
  margin-top: 7px;
  color: #70859a;
  font-size: 12px;
  line-height: 1.5;
}

.login-forgot {
  justify-self: end;
  margin-top: -9px;
  color: #63dcff;
  font-size: 13px;
  font-weight: 800;
  transition: color .18s ease, transform .16s ease;
}

.login-forgot:hover {
  color: #b8f0ff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.login-forgot:active,
.login-switch button:active {
  transform: scale(.95);
}

.login-development-link {
  border: 1px dashed rgba(85, 216, 255, .35);
  border-radius: 9px;
  background: rgba(85, 216, 255, .06);
  padding: 11px 13px;
  color: #78e2ff;
  font-size: 13px;
  font-weight: 800;
  text-align: center;
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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  overflow: hidden;
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

.login-submit.is-loading {
  opacity: .82;
}

.login-submit.is-complete {
  background: #55e0b5;
  box-shadow: 0 10px 30px rgba(85, 224, 181, .18);
  animation: login-success-pulse .4s ease-out both;
}

.login-spinner {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  border: 2px solid rgba(3, 16, 25, .28);
  border-top-color: #031019;
  border-radius: 50%;
  animation: login-spin .7s linear infinite;
}

.login-check {
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: rgba(3, 16, 25, .13);
  font-size: 14px;
  line-height: 1;
  animation: login-check-in .28s cubic-bezier(.2, .9, .3, 1.4) both;
}

@keyframes login-spin {
  to { transform: rotate(360deg); }
}

@keyframes login-check-in {
  from { opacity: 0; transform: scale(.55) rotate(-18deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}

@keyframes login-success-pulse {
  50% { transform: scale(1.018); }
}

.login-submit:disabled {
  cursor: not-allowed;
  opacity: .48;
}

.login-submit.is-loading:disabled {
  opacity: .82;
}

.login-submit.is-complete:disabled {
  opacity: 1;
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
  transition: color .18s ease, transform .16s ease;
}

.login-switch button:hover {
  color: #b8f0ff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.login-checking {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0;
  border: 1px solid rgba(85, 216, 255, .22);
  border-radius: 9px;
  background: rgba(85, 216, 255, .06);
  padding: 11px 14px;
  color: #9ee9ff;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.4;
}

.login-checking-dots {
  display: inline-flex;
  gap: 3px;
}

.login-checking-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  animation: login-dot-bounce .9s ease-in-out infinite;
}

.login-checking-dots i:nth-child(2) {
  animation-delay: .12s;
}

.login-checking-dots i:nth-child(3) {
  animation-delay: .24s;
}

.login-feedback-enter-active,
.login-feedback-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.login-feedback-enter-from,
.login-feedback-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes login-dot-bounce {
  0%, 70%, 100% { opacity: .35; transform: translateY(0); }
  35% { opacity: 1; transform: translateY(-3px); }
}

.login-notice,
.login-error,
.login-success {
  font-size: 13px;
  line-height: 1.55;
}

.login-notice,
.login-error,
.login-success {
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

.login-success {
  border: 1px solid rgba(85, 224, 181, .28);
  background: rgba(85, 224, 181, .07);
  color: #83e9c9;
}

@media (prefers-reduced-motion: reduce) {
  .login-card,
  .login-page::before,
  .login-page::after,
  .login-panel-enter-active,
  .login-panel-leave-active,
  .login-spinner,
  .login-check,
  .login-submit.is-complete {
    animation: none;
  }

  .login-panel-enter-active,
  .login-panel-leave-active {
    transition: opacity .16s ease;
  }

  .login-panel-enter-from,
  .login-panel-leave-to,
  .login-panel.is-back.login-panel-enter-from,
  .login-panel.is-back.login-panel-leave-to {
    opacity: 0;
    filter: none;
    transform: none;
  }
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
