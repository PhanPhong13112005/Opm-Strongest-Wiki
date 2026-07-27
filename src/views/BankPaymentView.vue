<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { refreshSession } from '../services/authApi'
import { createBankTopUpQr, getBankTopUpQr, updateBankTopUpPayment } from '../services/communityApi'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true,
  },
})

const router = useRouter()
const payment = ref(null)
const loading = ref(true)
const error = ref('')
const pollError = ref('')
const actionError = ref('')
const actionLoading = ref('')
const copied = ref('')
const countdown = ref(3)
const remainingSeconds = ref(0)
const successStarted = ref(false)
let pollTimer
let countdownTimer
let expiryTimer

const paymentId = computed(() => Number(props.id))
const status = computed(() => payment.value?.topUp?.status || '')
const isPending = computed(() => status.value === 'Pending')
const isPaymentReported = computed(() => status.value === 'PaymentReported')
const isPaid = computed(() => ['Paid', 'Approved'].includes(status.value))
const isRejected = computed(() => status.value === 'Rejected')
const isCancelled = computed(() => status.value === 'Cancelled')
const isExpired = computed(() => status.value === 'Expired')
const isClosed = computed(() => isRejected.value || isCancelled.value || isExpired.value)
const remainingTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const closedTitle = computed(() => {
  if (isCancelled.value) return 'Bạn đã hủy thanh toán'
  if (isExpired.value) return 'Mã thanh toán đã hết hạn'
  return 'Thanh toán bị từ chối'
})
const closedDescription = computed(() => {
  if (isCancelled.value) return 'Yêu cầu này đã được hủy và sẽ không được đối soát.'
  if (isExpired.value) return 'Thời hạn 5 phút đã kết thúc. Hãy tạo mã mới để thanh toán.'
  return payment.value?.topUp?.staffNote || 'Giao dịch chưa thể được xác nhận.'
})

const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const clearTimers = () => {
  window.clearTimeout(pollTimer)
  window.clearInterval(countdownTimer)
  window.clearInterval(expiryTimer)
}

const beginSuccessRedirect = async () => {
  if (successStarted.value) return
  successStarted.value = true
  clearTimers()
  try {
    await refreshSession()
  } catch {
    // The paid order is authoritative even if refreshing the balance times out.
  }
  countdown.value = 3
  countdownTimer = window.setInterval(async () => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      window.clearInterval(countdownTimer)
      await router.replace({ name: 'top-up' })
    }
  }, 1000)
}

const schedulePoll = () => {
  window.clearTimeout(pollTimer)
  if (isPending.value || isPaymentReported.value) {
    pollTimer = window.setTimeout(() => loadPayment(false), 2500)
  }
}

const updateExpiryCountdown = () => {
  const expiresAt = Date.parse(payment.value?.expiresAt || '')
  remainingSeconds.value = Number.isFinite(expiresAt)
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
    : 0
  if (remainingSeconds.value === 0 && isPending.value) {
    window.clearInterval(expiryTimer)
    loadPayment(false)
  }
}

const startExpiryCountdown = () => {
  window.clearInterval(expiryTimer)
  if (!isPending.value) return
  updateExpiryCountdown()
  if (remainingSeconds.value > 0) {
    expiryTimer = window.setInterval(updateExpiryCountdown, 1000)
  }
}

const handlePaymentState = async () => {
  if (isPaid.value) {
    await beginSuccessRedirect()
    return
  }
  if (isPending.value) startExpiryCountdown()
  else window.clearInterval(expiryTimer)
  schedulePoll()
}

const loadPayment = async (showLoading = true) => {
  if (!Number.isInteger(paymentId.value) || paymentId.value <= 0) {
    error.value = 'Mã yêu cầu thanh toán không hợp lệ.'
    loading.value = false
    return
  }

  if (showLoading) loading.value = true
  if (!payment.value) error.value = ''
  pollError.value = ''
  try {
    payment.value = await getBankTopUpQr(paymentId.value)
    await handlePaymentState()
  } catch (exception) {
    if (payment.value) {
      pollError.value = 'Tạm thời chưa kiểm tra được trạng thái. Hệ thống sẽ thử lại.'
      schedulePoll()
    } else {
      error.value = exception.message
    }
  } finally {
    loading.value = false
  }
}

const updatePayment = async action => {
  actionError.value = ''
  actionLoading.value = action
  try {
    const topUp = await updateBankTopUpPayment(paymentId.value, action)
    payment.value = { ...payment.value, topUp }
    await handlePaymentState()
  } catch (exception) {
    actionError.value = exception.message
    await loadPayment(false)
  } finally {
    actionLoading.value = ''
  }
}

const cancelPayment = async () => {
  if (!globalThis.confirm('Hủy yêu cầu thanh toán này? Mã QR hiện tại sẽ không còn được xử lý.')) return
  await updatePayment('cancel')
}

const retryPayment = async () => {
  actionError.value = ''
  actionLoading.value = 'retry'
  try {
    const result = await createBankTopUpQr(Number(payment.value?.topUp?.amount || 0))
    await router.replace({ name: 'bank-payment', params: { id: result.topUp.id } })
  } catch (exception) {
    actionError.value = exception.message
  } finally {
    actionLoading.value = ''
  }
}

const copyValue = async (value, field) => {
  try {
    await navigator.clipboard.writeText(String(value))
    copied.value = field
    window.setTimeout(() => {
      if (copied.value === field) copied.value = ''
    }, 1600)
  } catch {
    pollError.value = 'Không thể sao chép tự động. Vui lòng sao chép thủ công.'
  }
}

const resetAndLoad = () => {
  clearTimers()
  payment.value = null
  loading.value = true
  error.value = ''
  pollError.value = ''
  actionError.value = ''
  remainingSeconds.value = 0
  countdown.value = 3
  successStarted.value = false
  loadPayment()
}

onMounted(loadPayment)
watch(() => props.id, resetAndLoad)
onBeforeUnmount(clearTimers)
</script>

<template>
  <main class="payment-page">
    <div class="payment-shell">
      <RouterLink class="payment-back" :to="{ name: 'top-up', query: { tab: 'bank' } }">
        <span aria-hidden="true">←</span> Quay lại nạp bằng ngân hàng
      </RouterLink>

      <section v-if="loading && !payment" class="payment-state">
        <span class="payment-spinner" aria-hidden="true"></span>
        <h1>Đang chuẩn bị thanh toán</h1>
        <p>Hệ thống đang tải mã QR của bạn.</p>
      </section>

      <section v-else-if="error && !payment" class="payment-state payment-state--error">
        <b aria-hidden="true">!</b>
        <h1>Không mở được thanh toán</h1>
        <p>{{ error }}</p>
        <button type="button" @click="loadPayment()">Thử lại</button>
      </section>

      <section v-else-if="isPaid" class="payment-state payment-state--success" aria-live="assertive">
        <b aria-hidden="true">✓</b>
        <p>THANH TOÁN ĐÃ ĐƯỢC XÁC NHẬN</p>
        <h1>Nạp thành công</h1>
        <strong>{{ formatMoney(payment.topUp.amount) }}</strong>
        <span>Số dư của bạn đã được cập nhật.</span>
        <small>Trở về trang nạp Coupon sau {{ countdown }} giây…</small>
      </section>

      <section v-else-if="isPaymentReported" class="payment-state payment-state--reported" aria-live="polite">
        <span class="payment-spinner" aria-hidden="true"></span>
        <p>YÊU CẦU #{{ payment.topUp.id }}</p>
        <h1>Đang chờ ngân hàng xác nhận</h1>
        <strong>{{ formatMoney(payment.topUp.amount) }}</strong>
        <span>SePay sẽ tự động báo giao dịch về hệ thống; nhân viên không duyệt thanh toán thủ công.</span>
        <small>Trạng thái sẽ tự động cập nhật trên trang này.</small>
        <RouterLink :to="{ name: 'top-up', query: { tab: 'bank' } }">Xem lịch sử giao dịch</RouterLink>
      </section>

      <section v-else-if="isClosed" class="payment-state payment-state--error">
        <b aria-hidden="true">×</b>
        <p>YÊU CẦU #{{ payment.topUp.id }}</p>
        <h1>{{ closedTitle }}</h1>
        <span>{{ closedDescription }}</span>
        <p v-if="actionError" class="payment-action-error" role="alert">{{ actionError }}</p>
        <button type="button" :disabled="actionLoading === 'retry'" @click="retryPayment">
          {{ actionLoading === 'retry' ? 'Đang tạo mã mới…' : 'Thanh toán lại' }}
        </button>
        <RouterLink class="payment-state__secondary" :to="{ name: 'top-up', query: { tab: 'bank' } }">
          Về lịch sử giao dịch
        </RouterLink>
      </section>

      <template v-else-if="payment">
        <header class="payment-heading">
          <div>
            <p>THANH TOÁN ĐƠN #{{ payment.topUp.id }}</p>
            <h1>Quét mã để thanh toán</h1>
            <span>Mở ứng dụng ngân hàng và quét mã VietQR bên dưới.</span>
          </div>
          <div class="payment-waiting">
            <i aria-hidden="true"></i>
            <div>
              <strong>Còn {{ remainingTime }}</strong>
              <span>Thời gian thanh toán mã QR</span>
            </div>
          </div>
        </header>

        <p v-if="pollError" class="payment-alert" role="status">{{ pollError }}</p>

        <section class="payment-card">
          <div class="payment-qr">
            <img
              :src="payment.qrUrl"
              :alt="`Mã QR thanh toán ${formatMoney(payment.topUp.amount)}`"
            />
            <strong>{{ formatMoney(payment.topUp.amount) }}</strong>
            <span>Chỉ thanh toán mã này một lần</span>
          </div>

          <div class="payment-details">
            <div class="payment-instruction">
              <span>01</span>
              <p>Quét QR bằng ứng dụng ngân hàng.</p>
            </div>
            <div class="payment-instruction">
              <span>02</span>
              <p>Giữ nguyên số tiền và nội dung chuyển khoản.</p>
            </div>
            <div class="payment-instruction">
              <span>03</span>
              <p>Chờ SePay tự động xác nhận tiền đã vào tài khoản.</p>
            </div>

            <dl>
              <div>
                <dt>Ngân hàng</dt>
                <dd>{{ payment.bank.bankId }}</dd>
              </div>
              <div>
                <dt>Chủ tài khoản</dt>
                <dd>{{ payment.bank.accountName }}</dd>
              </div>
              <div>
                <dt>Số tài khoản</dt>
                <dd>
                  <code>{{ payment.bank.accountNumber }}</code>
                  <button type="button" @click="copyValue(payment.bank.accountNumber, 'account')">
                    {{ copied === 'account' ? 'Đã chép' : 'Sao chép' }}
                  </button>
                </dd>
              </div>
              <div>
                <dt>Số tiền</dt>
                <dd>
                  <strong>{{ formatMoney(payment.topUp.amount) }}</strong>
                  <button type="button" @click="copyValue(payment.topUp.amount, 'amount')">
                    {{ copied === 'amount' ? 'Đã chép' : 'Sao chép' }}
                  </button>
                </dd>
              </div>
              <div class="payment-reference">
                <dt>Nội dung chuyển khoản</dt>
                <dd>
                  <code>{{ payment.topUp.referenceCode }}</code>
                  <button type="button" @click="copyValue(payment.topUp.referenceCode, 'reference')">
                    {{ copied === 'reference' ? 'Đã chép' : 'Sao chép' }}
                  </button>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <p v-if="actionError" class="payment-alert payment-alert--error" role="alert">{{ actionError }}</p>
        <section class="payment-actions" aria-label="Thao tác thanh toán">
          <button
            type="button"
            class="payment-actions__cancel"
            :disabled="Boolean(actionLoading) || !isPending"
            @click="cancelPayment"
          >
            {{ actionLoading === 'cancel' ? 'Đang hủy…' : 'Hủy thanh toán' }}
          </button>
        </section>

        <p class="payment-note">
          Không cần bấm xác nhận. Số dư chỉ được cộng khi webhook SePay báo đúng số tiền,
          đúng tài khoản nhận và đúng nội dung chuyển khoản.
        </p>
      </template>
    </div>
  </main>
</template>

<style scoped>
.payment-page {
  min-height: calc(100vh - 96px);
  padding: 30px 24px 64px;
  background:
    radial-gradient(circle at 50% -10%, rgba(85, 224, 181, .09), transparent 34%),
    #050a11;
}

.payment-shell { width: min(100%, 960px); margin: 0 auto; }
.payment-page { font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
.payment-back { display: inline-flex; align-items: center; gap: 8px; color: #91a4ad; font-size: 13px; font-weight: 750; }
.payment-back:hover { color: #78e5c4; }
.payment-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; margin-top: 24px; border-bottom: 1px solid rgba(101, 147, 177, .15); padding-bottom: 22px; }
.payment-heading p, .payment-state > p { margin: 0; color: #55e0b5; font: 900 11px ui-monospace, monospace; letter-spacing: .11em; }
.payment-heading h1 { margin: 6px 0 0; color: #f4f9fc; font-size: clamp(34px, 5vw, 48px); font-weight: 900; line-height: 1.12; letter-spacing: -.03em; }
.payment-heading > div > span { display: block; margin-top: 7px; color: #9aabba; font-size: 14px; line-height: 1.55; }
.payment-waiting { display: flex; min-width: 220px; align-items: center; gap: 11px; border: 1px solid rgba(255, 188, 74, .2); border-radius: 12px; background: rgba(255, 188, 74, .055); padding: 12px 14px; }
.payment-waiting i { width: 10px; height: 10px; border-radius: 50%; background: #ffc766; box-shadow: 0 0 0 5px rgba(255, 199, 102, .08); animation: payment-pulse 1.7s ease-in-out infinite; }
.payment-waiting strong, .payment-waiting span { display: block; }
.payment-waiting strong { color: #f1d49b; font-size: 13px; }
.payment-waiting span { margin-top: 3px; color: #b29c78; font-size: 11px; }
.payment-alert { margin: 13px 0 0; border: 1px solid rgba(255, 188, 74, .2); border-radius: 9px; background: rgba(255, 188, 74, .05); padding: 11px 13px; color: #d8bc83; font-size: 12px; line-height: 1.5; }
.payment-alert--error { border-color: rgba(255, 103, 103, .24); background: rgba(255, 103, 103, .06); color: #ff9a9a; }
.payment-card { display: grid; grid-template-columns: minmax(280px, 350px) minmax(0, 1fr); gap: 22px; margin-top: 18px; border: 1px solid rgba(85, 224, 181, .2); border-radius: 18px; background: rgba(7, 14, 23, .94); padding: 22px; }
.payment-qr { align-self: start; border-radius: 16px; background: #fff; padding: 12px 12px 15px; text-align: center; }
.payment-qr img { display: block; width: 100%; aspect-ratio: 1 / 1.18; object-fit: contain; }
.payment-qr strong { display: block; margin-top: 7px; color: #0b4a37; font-size: 20px; font-weight: 950; }
.payment-qr span { display: block; margin-top: 4px; color: #566c64; font-size: 11px; }
.payment-details { min-width: 0; }
.payment-instruction { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(102, 145, 180, .1); padding: 9px 0; }
.payment-instruction:first-child { padding-top: 0; }
.payment-instruction > span { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 7px; background: rgba(85, 224, 181, .08); color: #62dbb8; font: 900 10px ui-monospace, monospace; }
.payment-instruction p { margin: 0; color: #a0b1bd; font-size: 13px; line-height: 1.5; }
.payment-details dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; margin: 15px 0 0; }
.payment-details dl > div { min-width: 0; border: 1px solid rgba(102, 145, 180, .13); border-radius: 10px; background: rgba(3, 8, 14, .65); padding: 11px 12px; }
.payment-details dt { color: #879aa9; font-size: 10px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.payment-details dd { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 8px; margin: 7px 0 0; color: #e8f1f5; font-size: 13px; font-weight: 800; }
.payment-details code { overflow-wrap: anywhere; color: #9cebd4; font: 800 12px ui-monospace, monospace; }
.payment-details dd > strong { color: #70e7c2; font-size: 15px; }
.payment-details button { flex: 0 0 auto; border: 1px solid rgba(85, 224, 181, .2); border-radius: 6px; padding: 6px 9px; color: #7cd9ba; font-size: 11px; font-weight: 800; }
.payment-reference { grid-column: 1 / -1; }
.payment-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }
.payment-actions button { min-height: 44px; border-radius: 10px; padding: 11px 18px; font-size: 13px; font-weight: 850; }
.payment-actions button:disabled, .payment-state button:disabled { cursor: wait; opacity: .48; }
.payment-actions__cancel { border: 1px solid rgba(255, 103, 103, .28); color: #ff9696; }
.payment-note { margin: 13px 2px 0; color: #8a9eae; font-size: 12px; line-height: 1.65; text-align: center; }
.payment-state { display: flex; min-height: 500px; align-items: center; justify-content: center; flex-direction: column; padding: 30px; text-align: center; }
.payment-state > b { display: grid; width: 74px; height: 74px; place-items: center; border-radius: 50%; background: rgba(85, 224, 181, .1); color: #62e0bb; font-size: 38px; }
.payment-state h1 { margin: 18px 0 0; color: #f1f8f5; font-size: clamp(32px, 6vw, 50px); font-weight: 950; letter-spacing: -.04em; }
.payment-state > strong { margin-top: 12px; color: #75e4c2; font-size: 28px; }
.payment-state > span { margin-top: 8px; color: #9cadA6; font-size: 14px; line-height: 1.55; }
.payment-state > small { margin-top: 20px; color: #81948d; font-size: 12px; }
.payment-state button, .payment-state a { margin-top: 18px; border-radius: 9px; background: #55e0b5; padding: 11px 16px; color: #04130e; font-size: 13px; font-weight: 850; }
.payment-state .payment-state__secondary { margin-top: 9px; border: 1px solid rgba(111, 151, 182, .2); background: transparent; color: #8398a8; }
.payment-action-error { margin: 14px 0 0; color: #ff9898; font-size: 10px; }
.payment-state--reported > b { background: rgba(85, 216, 255, .1); color: #70dcfa; }
.payment-state--reported > p { color: #67d7f6; }
.payment-state--error > b { background: rgba(255, 103, 103, .1); color: #ff8c8c; }
.payment-state--error > p { color: #ff9292; }
.payment-spinner { width: 42px; height: 42px; border: 3px solid rgba(85, 224, 181, .12); border-top-color: #55e0b5; border-radius: 50%; animation: payment-spin .8s linear infinite; }

@keyframes payment-spin { to { transform: rotate(360deg); } }
@keyframes payment-pulse { 50% { opacity: .45; transform: scale(.85); } }

@media (max-width: 720px) {
  .payment-page { min-height: calc(100vh - 72px); padding: 18px 12px 42px; }
  .payment-heading { align-items: stretch; flex-direction: column; margin-top: 17px; padding-bottom: 17px; }
  .payment-heading h1 { font-size: 31px; }
  .payment-waiting { min-width: 0; }
  .payment-card { grid-template-columns: 1fr; gap: 17px; padding: 13px; }
  .payment-qr { width: min(100%, 360px); justify-self: center; }
  .payment-details dl { grid-template-columns: 1fr; }
  .payment-reference { grid-column: auto; }
  .payment-details dd { gap: 10px; }
  .payment-details button { min-height: 34px; padding-inline: 10px; }
  .payment-actions { display: grid; grid-template-columns: 1fr; }
  .payment-actions button { width: 100%; min-height: 48px; }
  .payment-state { min-height: 430px; padding-inline: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .payment-spinner, .payment-waiting i { animation: none; }
}
</style>
