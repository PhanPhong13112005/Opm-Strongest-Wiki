<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { authState, clearSession } from '../services/authApi'
import { getAdminTopUps, reviewAdminTopUp } from '../services/adminApi'

const router = useRouter()
const orders = ref([])
const filter = ref('Pending')
const notes = ref({})
const loading = ref(true)
const reviewingId = ref(null)
const error = ref('')
const notice = ref('')

const filters = [
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Đã từ chối' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: '', label: 'Tất cả' },
]

const navigation = [
  { to: '/admin/dashboard', index: '01', label: 'Tổng quan', hint: 'Sức khỏe hệ thống', match: '/admin/dashboard' },
  { to: '/admin/characters', index: '02', label: 'Nhân vật', hint: 'Nhân vật và Kỷ vật', match: '/admin/characters' },
  { to: '/admin/events', index: '03', label: 'Sự kiện', hint: 'Nội dung sự kiện', match: '/admin/events' },
  { to: '/admin/releases', index: '04', label: 'Lịch ra mắt', hint: 'Banner CN và SEA', match: '/admin/releases' },
  { to: '/admin/top-ups', index: '05', label: 'Đơn Coupon', hint: 'Duyệt đơn nạp thủ công', match: '/admin/top-ups' },
  { to: '/staff', index: '06', label: 'Khu nhân viên', hint: 'Kiểm duyệt cộng đồng' },
]

const parseCouponReference = (referenceCode = '', amount = 0) => {
  const match = /^UID:(\d{5,20})\|SID:([A-Za-z0-9_-]{1,20})\|CP:6\|QTY:(10|[1-9])\|([A-Z0-9]+)$/.exec(referenceCode)
  if (!match) {
    return { uid: '—', serverId: '—', coupons: '—', orderCode: referenceCode || '—', isValid: false }
  }
  const quantity = Number(match[3])
  return {
    uid: match[1],
    serverId: match[2],
    coupons: 6 * quantity,
    orderCode: match[4],
    isValid: Number(amount) === 13000 * quantity,
  }
}

const displayOrders = computed(() => orders.value.map(order => ({
  ...order,
  coupon: parseCouponReference(order.referenceCode, order.amount),
})))

const statusLabel = status => ({
  Pending: 'Chờ xử lý',
  PaymentReported: 'Chờ xử lý',
  Approved: 'Đã duyệt',
  Rejected: 'Đã từ chối',
  Cancelled: 'Đã hủy',
}[status] || status)

const isPending = order => ['Pending', 'PaymentReported'].includes(order.status)
const isOwnOrder = order => Boolean(authState.session?.userId) &&
  String(order.userId) === String(authState.session.userId)
const canReview = order => isPending(order) && !isOwnOrder(order)
const canApprove = order => canReview(order) && order.coupon.isValid
const formatMoney = amount => `${Number(amount || 0).toLocaleString('vi-VN')}đ`
const formatReviewer = subject => String(subject || '').startsWith('admin:')
  ? `@${String(subject).slice(6)}`
  : subject || 'Chưa ghi nhận'
const formatDate = value => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—'

const load = async ({ preserveError = false } = {}) => {
  loading.value = true
  if (!preserveError) error.value = ''
  try {
    orders.value = await getAdminTopUps(filter.value)
    notes.value = Object.fromEntries(orders.value.map(order => [order.id, order.staffNote || '']))
    return true
  } catch (exception) {
    if (!preserveError) error.value = exception.message
    return false
  } finally {
    loading.value = false
  }
}

const changeFilter = async value => {
  if (filter.value === value) return
  filter.value = value
  notice.value = ''
  await load()
}

const review = async (order, status) => {
  if (isOwnOrder(order)) {
    error.value = 'Không thể tự xử lý đơn Coupon của chính bạn.'
    return
  }
  const staffNote = String(notes.value[order.id] || '').trim()
  if (status === 'Approved' && !order.coupon.isValid) {
    error.value = 'Thông tin hoặc giá trị đơn Coupon không hợp lệ. Chỉ có thể từ chối đơn.'
    return
  }
  if (status === 'Rejected' && !staffNote) {
    error.value = 'Vui lòng nhập lý do từ chối để người dùng biết cách xử lý.'
    return
  }
  const confirmation = status === 'Approved'
    ? [
        `Xác nhận đã nạp đơn Coupon #${order.id}?`,
        `Người nhận: @${order.username}`,
        `UID: ${order.coupon.uid}`,
        `Server: ${order.coupon.serverId}`,
        `${order.coupon.coupons} Coupon · ${formatMoney(order.amount)}`,
        'Hành động này không thể hoàn tác.',
      ].join('\n')
    : [
        `Từ chối đơn Coupon #${order.id}?`,
        `Người nhận: @${order.username} · UID ${order.coupon.uid} · Server ${order.coupon.serverId}`,
        `Lý do: ${staffNote}`,
      ].join('\n')
  if (!globalThis.confirm(confirmation)) return

  reviewingId.value = order.id
  error.value = ''
  notice.value = ''
  try {
    await reviewAdminTopUp(order.id, status, staffNote)
    notice.value = status === 'Approved'
      ? `Đã xác nhận đơn #${order.id} được nạp thành công.`
      : `Đã từ chối đơn #${order.id}.`
    await load()
  } catch (exception) {
    if (exception.status === 409) {
      const refreshed = await load({ preserveError: true })
      error.value = refreshed
        ? `${exception.message} Danh sách đã được làm mới.`
        : `${exception.message} Không thể tự động làm mới danh sách.`
    } else {
      error.value = exception.message
    }
  } finally {
    reviewingId.value = null
  }
}

const logout = async () => {
  clearSession()
  await router.replace('/')
}

onMounted(load)
</script>

<template>
  <RolePortalShell
    role="admin"
    role-label="Khu vực quản trị viên"
    title="Xử lý đơn Coupon"
    description="Kiểm tra đúng UID và server, nạp Coupon trong game rồi cập nhật kết quả cho người dùng."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="navigation"
    @logout="logout"
  >
    <section class="coupon-queue">
      <header class="coupon-queue__header">
        <div>
          <span>Hàng đợi thủ công</span>
          <h2>Yêu cầu nạp Coupon</h2>
          <p>Chỉ xác nhận sau khi Coupon đã được nạp đúng tài khoản trong game.</p>
        </div>
        <button type="button" class="coupon-refresh" :disabled="loading" @click="load">
          {{ loading ? 'Đang tải…' : 'Làm mới' }}
        </button>
      </header>

      <nav class="coupon-filters" aria-label="Lọc trạng thái đơn Coupon">
        <button
          v-for="item in filters"
          :key="item.label"
          type="button"
          :class="{ active: filter === item.value }"
          :aria-pressed="filter === item.value"
          @click="changeFilter(item.value)"
        >
          {{ item.label }}
        </button>
      </nav>
    </section>

    <p v-if="notice" class="coupon-message coupon-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="coupon-message coupon-message--error" role="alert">{{ error }}</p>

    <div v-if="loading" class="coupon-empty">Đang tải danh sách đơn Coupon…</div>
    <div v-else-if="displayOrders.length === 0" class="coupon-empty">
      Không có đơn Coupon ở trạng thái này.
    </div>
    <section v-else class="coupon-list" aria-label="Danh sách đơn Coupon">
      <article v-for="order in displayOrders" :key="order.id" class="coupon-order">
        <header>
          <div>
            <span class="coupon-order__id">ĐƠN #{{ order.id }}</span>
            <h3>{{ order.displayName }}</h3>
            <p>@{{ order.username }} · {{ formatDate(order.createdAt) }}</p>
          </div>
          <span class="coupon-status" :class="`coupon-status--${order.status.toLowerCase()}`">
            {{ statusLabel(order.status) }}
          </span>
        </header>

        <dl class="coupon-order__facts">
          <div><dt>UID</dt><dd>{{ order.coupon.uid }}</dd></div>
          <div><dt>Server (SID)</dt><dd>{{ order.coupon.serverId }}</dd></div>
          <div><dt>Số Coupon</dt><dd>{{ order.coupon.coupons }}</dd></div>
          <div><dt>Giá trị</dt><dd>{{ formatMoney(order.amount) }}</dd></div>
        </dl>

        <div class="coupon-order__reference">
          <span>Mã đơn</span>
          <code>{{ order.coupon.orderCode }}</code>
        </div>

        <label class="coupon-note">
          <span>Ghi chú xử lý</span>
          <textarea
            v-model="notes[order.id]"
            rows="3"
            maxlength="500"
            :disabled="!canReview(order) || reviewingId === order.id"
            :placeholder="isOwnOrder(order) ? 'Cần Admin khác xử lý.' : isPending(order) ? 'Ví dụ: Đã nạp đủ Coupon vào UID…' : 'Không có ghi chú.'"
          />
          <small>{{ (notes[order.id] || '').length }}/500</small>
        </label>

        <p v-if="isPending(order) && !order.coupon.isValid" class="coupon-order__reviewed coupon-order__reviewed--warning">
          Dữ liệu UID/SID/số lượng hoặc giá trị không hợp lệ. Chỉ được từ chối đơn này.
        </p>
        <p v-if="isPending(order) && isOwnOrder(order)" class="coupon-order__reviewed coupon-order__reviewed--warning">
          Cần quản trị viên khác xử lý đơn của bạn.
        </p>
        <footer v-else-if="canReview(order)">
          <button
            type="button"
            class="coupon-action coupon-action--reject"
            :disabled="reviewingId === order.id"
            :aria-label="`Từ chối đơn #${order.id}`"
            @click="review(order, 'Rejected')"
          >
            Từ chối
          </button>
          <button
            type="button"
            class="coupon-action coupon-action--approve"
            :disabled="reviewingId === order.id || !canApprove(order)"
            :aria-label="`Duyệt đơn #${order.id}`"
            @click="review(order, 'Approved')"
          >
            {{ reviewingId === order.id ? 'Đang xử lý…' : 'Xác nhận đã nạp' }}
          </button>
        </footer>
        <p v-else-if="order.status === 'Cancelled'" class="coupon-order__reviewed">
          Người dùng đã hủy trước khi xử lý.
        </p>
        <p v-else class="coupon-order__reviewed">
          Xử lý bởi {{ formatReviewer(order.reviewedBySubject) }} · {{ formatDate(order.reviewedAt) }}
        </p>
      </article>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.coupon-queue { overflow: hidden; border: 1px solid rgba(255, 184, 77, .18); border-radius: 18px; background: rgba(8, 14, 23, .94); }
.coupon-queue__header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 22px; }
.coupon-queue__header span { color: #ffb84d; font-size: 9px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.coupon-queue__header h2 { margin: 4px 0 0; color: #f2f7fb; font-size: 21px; font-weight: 920; }
.coupon-queue__header p { margin: 7px 0 0; color: #8194a6; font-size: 12px; }
.coupon-refresh { flex: 0 0 auto; border: 1px solid rgba(255, 184, 77, .3); border-radius: 10px; padding: 9px 14px; color: #ffc76e; font-size: 11px; font-weight: 850; }
.coupon-refresh:hover:not(:disabled) { background: rgba(255, 184, 77, .08); }
.coupon-refresh:disabled, .coupon-action:disabled { cursor: wait; opacity: .55; }
.coupon-filters { display: flex; gap: 6px; overflow-x: auto; border-top: 1px solid rgba(120, 152, 181, .11); padding: 12px 16px; }
.coupon-filters button { flex: 0 0 auto; border: 1px solid transparent; border-radius: 999px; padding: 8px 13px; color: #73889b; font-size: 11px; font-weight: 800; }
.coupon-filters button.active { border-color: rgba(255, 184, 77, .32); background: rgba(255, 184, 77, .1); color: #ffd28d; }
.coupon-message { margin: 14px 0 0; border: 1px solid; border-radius: 12px; padding: 12px 14px; font-size: 12px; }
.coupon-message--success { border-color: rgba(85, 224, 181, .25); background: rgba(85, 224, 181, .08); color: #8cebcf; }
.coupon-message--error { border-color: rgba(255, 103, 103, .25); background: rgba(255, 103, 103, .08); color: #ffaaa0; }
.coupon-empty { margin-top: 14px; border: 1px dashed rgba(120, 152, 181, .18); border-radius: 16px; padding: 46px 20px; color: #718598; text-align: center; font-size: 13px; }
.coupon-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 14px; }
.coupon-order { min-width: 0; border: 1px solid rgba(120, 152, 181, .15); border-radius: 17px; background: linear-gradient(145deg, rgba(12, 22, 34, .98), rgba(7, 13, 21, .98)); padding: 19px; }
.coupon-order > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.coupon-order__id { color: #ffb84d; font: 850 9px ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .13em; }
.coupon-order h3 { overflow: hidden; margin: 5px 0 0; color: #eef5fb; font-size: 17px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
.coupon-order header p { margin: 4px 0 0; color: #64798c; font-size: 10px; }
.coupon-status { flex: 0 0 auto; border: 1px solid; border-radius: 999px; padding: 6px 9px; font-size: 9px; font-weight: 900; text-transform: uppercase; }
.coupon-status--pending, .coupon-status--paymentreported { border-color: rgba(255, 184, 77, .3); color: #ffc76e; }
.coupon-status--approved { border-color: rgba(85, 224, 181, .3); color: #78e3c3; }
.coupon-status--rejected { border-color: rgba(255, 103, 103, .3); color: #ff9185; }
.coupon-status--cancelled { border-color: rgba(126, 145, 161, .3); color: #9aabba; }
.coupon-order__facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; margin: 17px 0 0; overflow: hidden; border: 1px solid rgba(120, 152, 181, .11); border-radius: 12px; background: rgba(120, 152, 181, .09); }
.coupon-order__facts div { min-width: 0; background: #09111b; padding: 12px 10px; }
.coupon-order__facts dt { color: #5f7487; font-size: 8px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
.coupon-order__facts dd { overflow: hidden; margin: 5px 0 0; color: #dce7ef; font: 800 12px ui-monospace, SFMono-Regular, Consolas, monospace; text-overflow: ellipsis; }
.coupon-order__reference { display: flex; align-items: center; gap: 10px; min-width: 0; margin-top: 13px; }
.coupon-order__reference span { color: #5f7487; font-size: 9px; font-weight: 850; text-transform: uppercase; }
.coupon-order__reference code { overflow: hidden; color: #9eb1c1; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.coupon-note { position: relative; display: block; margin-top: 15px; }
.coupon-note > span { display: block; margin-bottom: 7px; color: #8397a9; font-size: 10px; font-weight: 800; }
.coupon-note textarea { width: 100%; resize: vertical; border: 1px solid rgba(120, 152, 181, .16); border-radius: 11px; background: rgba(0, 0, 0, .2); padding: 11px 12px 22px; color: #e8f0f6; font-size: 12px; line-height: 1.55; outline: none; }
.coupon-note textarea:focus { border-color: rgba(255, 184, 77, .45); }
.coupon-note textarea:disabled { color: #7b8d9d; opacity: .72; }
.coupon-note small { position: absolute; right: 9px; bottom: 7px; color: #526678; font-size: 8px; }
.coupon-order footer { display: flex; justify-content: flex-end; gap: 9px; margin-top: 14px; }
.coupon-action { border: 1px solid; border-radius: 10px; padding: 9px 13px; font-size: 11px; font-weight: 880; }
.coupon-action--reject { border-color: rgba(255, 103, 103, .25); color: #ff9c91; }
.coupon-action--approve { border-color: rgba(85, 224, 181, .28); background: rgba(85, 224, 181, .1); color: #84e8ca; }
.coupon-order__reviewed { margin: 13px 0 0; color: #657a8c; font-size: 10px; text-align: right; }
.coupon-order__reviewed--warning { color: #ffc76e; }
@media (max-width: 980px) { .coupon-list { grid-template-columns: 1fr; } }
@media (max-width: 560px) {
  .coupon-queue__header { align-items: flex-start; padding: 18px; }
  .coupon-queue__header p { max-width: 240px; }
  .coupon-order { padding: 15px; }
  .coupon-order__facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .coupon-order footer { display: grid; grid-template-columns: 1fr 1.45fr; }
  .coupon-action { padding-inline: 8px; }
}
</style>