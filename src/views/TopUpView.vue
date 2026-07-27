<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authState, hasValidSession, refreshSession } from '../services/authApi'
import { createBankTopUpQr, getMyTopUps } from '../services/communityApi'

const router = useRouter()
const quickAmounts = [13_000, 50_000, 100_000, 200_000, 500_000, 1_000_000]
const statusFilters = [
  { value: '', label: 'Tất cả' },
  { value: 'Pending', label: 'Đang xử lý' },
  { value: 'Paid', label: 'Đã cộng' },
  { value: 'Closed', label: 'Đã đóng' },
]

const requests = ref([])
const amount = ref(13_000)
const statusFilter = ref('')
const error = ref('')
const loading = ref(false)
const submitting = ref(false)

const isAuthenticated = computed(() => hasValidSession())
const balance = computed(() => Number(authState.session?.balance || 0))
const filteredRequests = computed(() => {
  if (statusFilter.value === 'Pending') {
    return requests.value.filter(request => ['Pending', 'PaymentReported'].includes(request.status))
  }
  if (statusFilter.value === 'Closed') {
    return requests.value.filter(request => ['Rejected', 'Cancelled', 'Expired'].includes(request.status))
  }
  return statusFilter.value
    ? requests.value.filter(request => (
      statusFilter.value === 'Paid'
        ? ['Paid', 'Approved'].includes(request.status)
        : request.status === statusFilter.value
    ))
    : requests.value
})
const pendingCount = computed(() =>
  requests.value.filter(request => ['Pending', 'PaymentReported'].includes(request.status)).length)
const amountIsValid = computed(() => (
  Number.isInteger(Number(amount.value))
  && Number(amount.value) >= 10_000
  && Number(amount.value) <= 100_000_000
))

const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`
const formatDate = value => new Date(value).toLocaleString('vi-VN')
const statusLabel = value => ({
  Pending: 'Chờ thanh toán',
  PaymentReported: 'Chờ ngân hàng xác nhận',
  Paid: 'Đã cộng số dư',
  Approved: 'Đã cộng số dư',
  Rejected: 'Đã từ chối',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn',
}[value] || value)

const load = async () => {
  if (!hasValidSession()) {
    requests.value = []
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    const [items] = await Promise.all([getMyTopUps(), refreshSession()])
    requests.value = items.filter(item => item.provider !== 'Coupon Order')
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

const chooseAmount = value => {
  amount.value = value
  error.value = ''
}

const submit = async () => {
  if (!hasValidSession()) {
    await router.push({ name: 'login', query: { redirect: '/top-up?tab=bank' } })
    return
  }

  error.value = ''
  if (!amountIsValid.value) {
    error.value = 'Số tiền phải là số nguyên từ 10.000đ đến 100.000.000đ.'
    return
  }

  submitting.value = true
  try {
    const result = await createBankTopUpQr(Number(amount.value))
    await router.push({ name: 'bank-payment', params: { id: result.topUp.id } })
  } catch (exception) {
    error.value = exception.message
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="topup-page">
    <div class="topup-shell">
      <header class="topup-hero">
        <div>
          <p>NẠP SỐ DƯ THÀNH VIÊN</p>
          <h1>Nạp bằng ngân hàng</h1>
          <span>Nhập số tiền, tạo mã VietQR rồi quét bằng ứng dụng ngân hàng của bạn.</span>
        </div>
        <div v-if="isAuthenticated" class="topup-balance">
          <span>Số dư hiện tại</span>
          <strong>{{ formatMoney(balance) }}</strong>
          <small>{{ pendingCount }} yêu cầu đang chờ</small>
        </div>
        <div v-else class="topup-balance">
          <span>Tài khoản thành viên</span>
          <strong>Chưa đăng nhập</strong>
          <small>Bạn chỉ cần đăng nhập khi nhấn tạo mã QR.</small>
        </div>
      </header>

      <div class="topup-security">
        <span aria-hidden="true">!</span>
        <p>
          Mã QR tự điền <b>số tiền và nội dung chuyển khoản</b>. Không sửa nội dung,
          không cung cấp mật khẩu, OTP, mã PIN hoặc thông tin thẻ cho bất kỳ ai.
        </p>
      </div>

      <p v-if="error" class="topup-alert topup-alert--error" role="alert">{{ error }}</p>

      <form class="topup-form" novalidate @submit.prevent="submit">
        <section class="topup-panel">
          <header class="topup-panel__heading">
            <span>01</span>
            <div>
              <h2>Nhập số tiền cần nạp</h2>
              <p>Hệ thống sẽ tự tạo nội dung chuyển khoản riêng cho yêu cầu này.</p>
            </div>
          </header>

          <div class="topup-fields topup-fields--amount">
            <label class="topup-field">
              <span>Số tiền</span>
              <div class="topup-amount-input">
                <input
                  v-model.number="amount"
                  type="number"
                  min="10000"
                  max="100000000"
                  step="1000"
                  required
                  inputmode="numeric"
                  aria-label="Số tiền nạp"
                />
                <b>VND</b>
              </div>
              <small>Tối thiểu 10.000đ và tối đa 100.000.000đ.</small>
            </label>
          </div>

          <div class="topup-quick-amounts" aria-label="Chọn nhanh số tiền">
            <button
              v-for="value in quickAmounts"
              :key="value"
              type="button"
              :class="{ 'is-selected': Number(amount) === value }"
              @click="chooseAmount(value)"
            >
              {{ formatMoney(value) }}
            </button>
          </div>
        </section>

        <section class="topup-submit">
          <div>
            <span>Số tiền tạo QR</span>
            <strong>{{ formatMoney(amount) }}</strong>
            <small>VietQR · SePay đối soát tự động</small>
          </div>
          <button :disabled="submitting || (isAuthenticated && !amountIsValid)">
            {{ submitting ? 'Đang tạo mã QR…' : (isAuthenticated ? 'Tạo mã QR' : 'Đăng nhập để tạo mã QR') }}
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </form>

      <section v-if="isAuthenticated" class="topup-history">
        <header>
          <div>
            <span>LỊCH SỬ GIAO DỊCH</span>
            <h2>Yêu cầu nạp của bạn</h2>
          </div>
          <button type="button" :disabled="loading" @click="load">
            {{ loading ? 'Đang tải…' : 'Làm mới' }}
          </button>
        </header>

        <nav class="topup-filters" aria-label="Lọc trạng thái yêu cầu">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            type="button"
            :class="{ 'is-active': statusFilter === filter.value }"
            @click="statusFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </nav>

        <div v-if="loading" class="topup-empty">Đang tải lịch sử yêu cầu…</div>
        <div v-else-if="filteredRequests.length" class="topup-history__list">
          <article v-for="item in filteredRequests" :key="item.id">
            <div class="topup-history__main">
              <span>#{{ item.id }}</span>
              <div>
                <strong>{{ formatMoney(item.amount) }}</strong>
                <small>{{ item.provider }} · {{ formatDate(item.createdAt) }}</small>
              </div>
            </div>
            <div class="topup-history__reference">
              <span>Nội dung chuyển khoản</span>
              <strong>{{ item.referenceCode }}</strong>
              <small v-if="item.staffNote">Phản hồi: {{ item.staffNote }}</small>
            </div>
            <div class="topup-history__actions">
              <b class="topup-status" :class="`is-${item.status.toLowerCase()}`">
                {{ statusLabel(item.status) }}
              </b>
              <RouterLink :to="{ name: 'bank-payment', params: { id: item.id } }">
                Xem chi tiết
              </RouterLink>
            </div>
          </article>
        </div>
        <div v-else class="topup-empty">
          {{ requests.length ? 'Không có yêu cầu ở trạng thái này.' : 'Bạn chưa gửi yêu cầu nạp nào.' }}
        </div>
      </section>
      <section v-else class="topup-history topup-history--guest">
        <header>
          <div>
            <span>LỊCH SỬ GIAO DỊCH</span>
            <h2>Đăng nhập để xem yêu cầu của bạn</h2>
          </div>
          <RouterLink :to="{ name: 'login', query: { redirect: '/top-up?tab=bank' } }">Đăng nhập</RouterLink>
        </header>
      </section>
    </div>
  </main>
</template>

<style scoped>
.topup-page {
  min-height: calc(100vh - 96px);
  padding: 38px 26px 72px;
  background:
    radial-gradient(circle at 88% 0, rgba(85, 216, 255, .08), transparent 27%),
    radial-gradient(circle at 8% 38%, rgba(255, 184, 77, .04), transparent 24%);
}

.topup-shell { width: min(100%, 1120px); margin: 0 auto; }
.topup-page { font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
.topup-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; border-bottom: 1px solid rgba(104, 151, 190, .16); padding-bottom: 25px; }
.topup-hero p, .topup-history > header span { margin: 0; color: #55d8ff; font: 900 11px ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .11em; }
.topup-hero h1 { margin: 6px 0 0; color: #f4f9fc; font-size: clamp(36px, 5vw, 52px); font-weight: 900; line-height: 1.12; letter-spacing: -.03em; }
.topup-hero > div > span { display: block; max-width: 650px; margin-top: 8px; color: #9aabba; font-size: 14px; line-height: 1.6; }
.topup-balance { min-width: 230px; border: 1px solid rgba(85, 216, 255, .2); border-radius: 15px; background: rgba(85, 216, 255, .055); padding: 15px 18px; text-align: right; }
.topup-balance span { margin: 0; color: #91a4b1; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.topup-balance strong { display: block; margin-top: 4px; color: #daf7ff; font-size: 24px; font-weight: 950; }
.topup-balance small { display: block; margin-top: 4px; color: #8296a4; font-size: 11px; }
.topup-security { display: flex; align-items: center; gap: 11px; margin-top: 16px; border: 1px solid rgba(255, 184, 77, .18); border-radius: 11px; background: rgba(255, 184, 77, .055); padding: 11px 14px; }
.topup-security > span { display: grid; width: 25px; height: 25px; flex: 0 0 25px; place-items: center; border-radius: 50%; background: #ffb84d; color: #1b1103; font-size: 12px; font-weight: 950; }
.topup-security p { margin: 0; color: #c1aa85; font-size: 12px; line-height: 1.6; }
.topup-security b { color: #e8c891; }
.topup-alert { margin: 13px 0 0; border-radius: 10px; padding: 12px 14px; font-size: 11px; font-weight: 750; }
.topup-alert--error { border: 1px solid rgba(255, 103, 103, .25); background: rgba(255, 103, 103, .07); color: #ffaaa3; }
.topup-form { display: grid; gap: 14px; margin-top: 18px; }
.topup-panel { overflow: hidden; border: 1px solid rgba(102, 145, 180, .16); border-radius: 17px; background: rgba(7, 14, 23, .92); }
.topup-panel__heading { display: flex; align-items: center; gap: 13px; border-bottom: 1px solid rgba(102, 145, 180, .12); padding: 18px 21px; }
.topup-panel__heading > span { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 8px; background: rgba(85, 216, 255, .09); color: #55d8ff; font: 900 10px ui-monospace, monospace; }
.topup-panel__heading h2 { margin: 0; color: #edf6fa; font-size: 19px; font-weight: 850; line-height: 1.35; }
.topup-panel__heading p { margin: 4px 0 0; color: #8799a9; font-size: 12px; line-height: 1.5; }
.topup-fields { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; padding: 20px 21px 13px; }
.topup-fields--amount { grid-template-columns: minmax(0, 520px); }
.topup-field > span { display: block; color: #a2b2c0; font-size: 13px; font-weight: 750; }
.topup-field input { width: 100%; margin-top: 8px; border: 1px solid rgba(113, 151, 181, .2); border-radius: 10px; background: #050b12; padding: 13px 14px; color: #edf7fb; font-size: 15px; line-height: 1.5; outline: none; }
.topup-field input:focus { border-color: rgba(85, 216, 255, .55); box-shadow: 0 0 0 3px rgba(85, 216, 255, .06); }
.topup-field small { display: block; margin-top: 7px; color: #8295a5; font-size: 11px; line-height: 1.45; }
.topup-amount-input { position: relative; }
.topup-amount-input input { padding-right: 60px; }
.topup-amount-input b { position: absolute; top: 22px; right: 13px; color: #55d8ff; font: 900 9px ui-monospace, monospace; letter-spacing: .08em; }
.topup-quick-amounts { display: flex; flex-wrap: wrap; gap: 8px; border-top: 1px solid rgba(102, 145, 180, .1); padding: 14px 21px 18px; }
.topup-quick-amounts button { border: 1px solid rgba(111, 151, 182, .17); border-radius: 99px; background: rgba(255, 255, 255, .02); padding: 9px 13px; color: #94a6b5; font-size: 12px; font-weight: 800; }
.topup-quick-amounts button.is-selected { border-color: rgba(85, 216, 255, .48); background: rgba(85, 216, 255, .09); color: #82e4ff; }
.topup-submit { display: flex; align-items: center; justify-content: space-between; gap: 20px; border: 1px solid rgba(85, 216, 255, .22); border-radius: 16px; background: linear-gradient(110deg, rgba(85, 216, 255, .07), rgba(7, 14, 23, .94)); padding: 15px 16px 15px 22px; }
.topup-submit > div > span { display: block; color: #8ca0ad; font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.topup-submit strong { display: block; margin-top: 4px; color: #eaf7fb; font-size: 23px; }
.topup-submit small { display: block; margin-top: 3px; color: #8296a4; font-size: 11px; }
.topup-submit > button { display: flex; min-width: 270px; align-items: center; justify-content: space-between; border-radius: 11px; background: #55d8ff; padding: 15px 18px; color: #04131b; font-size: 14px; font-weight: 850; }
.topup-submit > button:disabled { cursor: not-allowed; opacity: .42; }
.topup-submit > button span { font-size: 18px; }
.topup-history { margin-top: 20px; overflow: hidden; border: 1px solid rgba(102, 145, 180, .15); border-radius: 16px; background: rgba(7, 14, 23, .84); }
.topup-history > header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(102, 145, 180, .12); padding: 17px 20px; }
.topup-history h2 { margin: 4px 0 0; color: #eaf3f8; font-size: 19px; font-weight: 850; }
.topup-history > header button { border: 1px solid rgba(85, 216, 255, .18); border-radius: 8px; padding: 7px 10px; color: #74cce4; font-size: 9px; font-weight: 850; }
.topup-history--guest > header a { border: 1px solid rgba(85, 216, 255, .18); border-radius: 8px; padding: 7px 10px; color: #74cce4; font-size: 9px; font-weight: 850; }
.topup-history > header button:disabled { opacity: .45; }
.topup-filters { display: flex; gap: 7px; overflow-x: auto; border-bottom: 1px solid rgba(102, 145, 180, .09); padding: 11px 20px; }
.topup-filters button { flex: 0 0 auto; border-radius: 99px; padding: 7px 11px; color: #8a9eae; font-size: 11px; font-weight: 800; }
.topup-filters button.is-active { background: rgba(85, 216, 255, .09); color: #72ddfa; }
.topup-history__list article { display: grid; grid-template-columns: minmax(190px, .8fr) minmax(240px, 1fr) auto; align-items: center; gap: 18px; border-bottom: 1px solid rgba(102, 145, 180, .09); padding: 16px 20px; }
.topup-history__list article:last-child { border: 0; }
.topup-history__main { display: flex; align-items: center; gap: 11px; }
.topup-history__main > span { display: grid; min-width: 42px; height: 34px; place-items: center; border-radius: 8px; background: rgba(85, 216, 255, .07); color: #69bdd4; font: 850 9px ui-monospace, monospace; }
.topup-history__main strong { color: #e6f1f6; font-size: 13px; }
.topup-history__main small, .topup-history__reference small { display: block; margin-top: 4px; color: #5f7486; font-size: 9px; }
.topup-history__reference > span { display: block; color: #5f7486; font-size: 8px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
.topup-history__reference strong { display: block; overflow-wrap: anywhere; margin-top: 4px; color: #9eb0bd; font: 750 10px ui-monospace, monospace; }
.topup-status { border-radius: 99px; padding: 6px 9px; font-size: 8px; white-space: nowrap; }
.topup-status.is-pending { background: rgba(255, 188, 74, .1); color: #ffc866; }
.topup-status.is-paymentreported { background: rgba(85, 216, 255, .1); color: #7cddf8; }
.topup-status.is-paid, .topup-status.is-approved { background: rgba(85, 224, 181, .1); color: #72e5c2; }
.topup-status.is-rejected, .topup-status.is-cancelled, .topup-status.is-expired { background: rgba(255, 103, 103, .1); color: #ff9999; }
.topup-history__actions { display: flex; align-items: flex-end; flex-direction: column; gap: 7px; }
.topup-history__actions a { color: #72d9f5; font-size: 9px; font-weight: 850; white-space: nowrap; }
.topup-history__actions a:hover { color: #b8efff; }
.topup-empty { display: grid; min-height: 120px; place-items: center; padding: 24px; color: #8295a5; font-size: 13px; text-align: center; }

@media (max-width: 880px) {
  .topup-history__list article { grid-template-columns: 1fr auto; }
  .topup-history__reference { grid-column: 1 / -1; grid-row: 2; }
  .topup-history__actions { grid-column: 2; grid-row: 1; }
}

@media (max-width: 680px) {
  .topup-page { padding: 22px 12px 48px; }
  .topup-hero { align-items: stretch; flex-direction: column; }
  .topup-hero h1 { font-size: 32px; }
  .topup-balance { min-width: 0; text-align: left; }
  .topup-panel__heading { padding: 15px; }
  .topup-fields { padding: 16px 15px 12px; }
  .topup-field input { font-size: 16px; }
  .topup-quick-amounts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 12px 15px 15px; }
  .topup-quick-amounts button { min-height: 40px; }
  .topup-fields { grid-template-columns: 1fr; }
  .topup-submit { align-items: stretch; flex-direction: column; }
  .topup-submit > button { min-width: 0; min-height: 48px; }
  .topup-history > header { padding: 15px; }
  .topup-filters { padding-inline: 15px; }
}

@media (max-width: 440px) {
  .topup-history__list article { align-items: flex-start; grid-template-columns: 1fr; }
  .topup-history__reference { grid-column: auto; grid-row: auto; }
  .topup-history__actions { grid-column: auto; grid-row: auto; align-items: flex-start; }
}
</style>
