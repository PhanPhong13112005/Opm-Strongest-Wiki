<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { authState, clearSession } from '../services/authApi'
import { deleteEventComment, getModerationComments, getStaffTopUps, reviewTopUp } from '../services/communityApi'

const router = useRouter()
const topUps = ref([])
const comments = ref([])
const status = ref('Pending')
const error = ref('')
const notice = ref('')
const loading = ref(true)
const processingId = ref(null)

const navigation = [
  { to: '/staff', index: '01', label: 'Tổng quan', hint: 'Hàng đợi cần xử lý' },
  { to: '/forum', index: '02', label: 'Kiểm duyệt diễn đàn', hint: 'Chủ đề và phản hồi' },
  { to: '/events', index: '03', label: 'Bình luận sự kiện', hint: 'Mở danh sách sự kiện' },
  { to: '/account', index: '04', label: 'Trang cá nhân', hint: 'Tiện ích thành viên' },
]

const filters = [
  { value: 'Pending', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
  { value: '', label: 'Tất cả' },
]

const pendingCount = computed(() => status.value === 'Pending' ? topUps.value.length : '—')

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    ;[topUps.value, comments.value] = await Promise.all([
      getStaffTopUps(status.value),
      getModerationComments(),
    ])
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

const setStatus = async nextStatus => {
  status.value = nextStatus
  await load()
}

const review = async (item, nextStatus) => {
  const isCoupon = item.provider === 'Coupon Order'
  const promptText = nextStatus === 'Approved'
    ? (isCoupon ? 'Ghi chú xác nhận đã nạp Coupon' : 'Ghi chú duyệt (không bắt buộc)')
    : 'Nhập lý do từ chối'
  const note = globalThis.prompt(promptText) ?? ''
  if (nextStatus === 'Rejected' && !note.trim()) return

  error.value = ''
  notice.value = ''
  processingId.value = item.id
  try {
    await reviewTopUp(item.id, nextStatus, note)
    notice.value = `Đã ${nextStatus === 'Approved' ? 'duyệt' : 'từ chối'} yêu cầu #${item.id}.`
    await load()
  } catch (exception) {
    error.value = exception.message
  } finally {
    processingId.value = null
  }
}

const removeComment = async item => {
  if (!globalThis.confirm('Xóa bình luận không hợp lệ này?')) return
  error.value = ''
  try {
    await deleteEventComment(item.id)
    comments.value = comments.value.filter(comment => comment.id !== item.id)
    notice.value = 'Đã xóa bình luận khỏi sự kiện.'
  } catch (exception) {
    error.value = exception.message
  }
}

const logout = async () => {
  clearSession()
  await router.replace('/')
}

const money = value => `${Number(value).toLocaleString('vi-VN')}đ`
const date = value => new Date(value).toLocaleString('vi-VN')
const statusLabel = value => ({ Pending: 'Chờ duyệt', Approved: 'Đã duyệt', Rejected: 'Từ chối' }[value] || value)
const requestLabel = item => item.provider === 'Coupon Order' ? 'Đơn Coupon' : item.provider
const referenceLabel = item => item.provider === 'Coupon Order'
  ? item.referenceCode.replaceAll('|', ' · ')
  : item.referenceCode

onMounted(load)
</script>

<template>
  <RolePortalShell
    role="staff"
    role-label="Khu vực nhân viên"
    title="Trung tâm kiểm duyệt"
    description="Duyệt yêu cầu nạp thẻ, đơn Coupon và xử lý nội dung cộng đồng trong một màn hình."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="navigation"
    @logout="logout"
  >
    <section class="staff-summary">
      <article class="staff-stat staff-stat--primary">
        <span>Cần xử lý</span>
        <strong>{{ pendingCount }}</strong>
        <p>yêu cầu nạp đang chờ</p>
      </article>
      <article class="staff-stat">
        <span>Nội dung gần đây</span>
        <strong>{{ comments.length }}</strong>
        <p>bình luận cần theo dõi</p>
      </article>
      <article class="staff-stat">
        <span>Trạng thái hệ thống</span>
        <strong class="staff-stat__online"><i /> Sẵn sàng</strong>
        <p>có thể tiếp nhận thao tác</p>
      </article>
    </section>

    <p v-if="notice" class="staff-message staff-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="staff-message staff-message--error" role="alert">{{ error }}</p>

    <section class="staff-panel staff-panel--topups">
      <header class="staff-panel__header">
        <div>
          <span>Hàng đợi 01</span>
          <h2>Yêu cầu nạp &amp; Coupon</h2>
          <p>Kiểm tra mã giao dịch hoặc UID, Server và gói Coupon trước khi duyệt.</p>
        </div>
        <div class="staff-filters" aria-label="Lọc trạng thái yêu cầu nạp">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            :class="{ 'is-active': status === filter.value }"
            @click="setStatus(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </header>

      <div v-if="loading" class="staff-empty">Đang tải hàng đợi…</div>
      <div v-else-if="topUps.length" class="topup-list">
        <article v-for="item in topUps" :key="item.id" class="topup-row">
          <div class="topup-row__id"><span>#</span>{{ item.id }}</div>
          <div class="topup-row__person">
            <strong>{{ item.displayName }}</strong>
            <span><b :class="{ 'is-coupon': item.provider === 'Coupon Order' }">{{ requestLabel(item) }}</b> · {{ referenceLabel(item) }}</span>
          </div>
          <strong class="topup-row__amount">{{ money(item.amount) }}</strong>
          <span class="topup-status" :class="`topup-status--${item.status.toLowerCase()}`">
            {{ statusLabel(item.status) }}
          </span>
          <div v-if="item.status === 'Pending'" class="topup-row__actions">
            <button type="button" class="approve" :disabled="processingId === item.id" @click="review(item, 'Approved')">{{ item.provider === 'Coupon Order' ? 'Đã nạp' : 'Duyệt' }}</button>
            <button type="button" class="reject" :disabled="processingId === item.id" @click="review(item, 'Rejected')">Từ chối</button>
          </div>
          <time v-else>{{ date(item.reviewedAt || item.createdAt) }}</time>
        </article>
      </div>
      <div v-else class="staff-empty">
        <strong>Không có yêu cầu trong mục này</strong>
        <span>Hàng đợi hiện đã được xử lý hết.</span>
      </div>
    </section>

    <section class="staff-panel">
      <header class="staff-panel__header">
        <div>
          <span>Hàng đợi 02</span>
          <h2>Bình luận sự kiện</h2>
          <p>Xem nhanh nội dung mới và xóa các bình luận vi phạm.</p>
        </div>
        <RouterLink to="/forum" class="staff-panel__link">Kiểm duyệt diễn đàn <b>→</b></RouterLink>
      </header>

      <div v-if="loading" class="staff-empty">Đang tải bình luận…</div>
      <div v-else-if="comments.length" class="comment-list">
        <article v-for="item in comments" :key="item.id" class="comment-row">
          <div class="comment-row__avatar">{{ item.displayName?.slice(0, 1).toUpperCase() }}</div>
          <div class="comment-row__body">
            <div>
              <strong>{{ item.displayName }}</strong>
              <time>{{ date(item.createdAt) }}</time>
            </div>
            <p>{{ item.content }}</p>
            <RouterLink :to="`/events/${item.eventId}`">Mở sự kiện</RouterLink>
          </div>
          <button type="button" class="comment-row__delete" @click="removeComment(item)">Xóa</button>
        </article>
      </div>
      <div v-else class="staff-empty">
        <strong>Chưa có bình luận mới</strong>
        <span>Nội dung cộng đồng hiện đang sạch.</span>
      </div>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.staff-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.staff-stat { min-height: 126px; border: 1px solid rgba(111, 151, 182, .15); border-radius: 15px; background: rgba(9, 16, 25, .9); padding: 20px; }
.staff-stat--primary { border-color: rgba(85, 224, 181, .28); background: linear-gradient(135deg, rgba(85, 224, 181, .09), rgba(9, 16, 25, .92)); }
.staff-stat > span { color: #71869a; font-size: 10px; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; }
.staff-stat > strong { display: block; margin-top: 8px; color: #f3f8fc; font-size: 30px; font-weight: 950; line-height: 1; }
.staff-stat p { margin: 8px 0 0; color: #627689; font-size: 10px; }
.staff-stat__online { display: flex !important; align-items: center; gap: 8px; padding-top: 6px; color: #72e6c1 !important; font-size: 18px !important; }
.staff-stat__online i { width: 8px; height: 8px; border-radius: 50%; background: #55e0b5; box-shadow: 0 0 14px rgba(85, 224, 181, .7); }

.staff-message { margin: 14px 0 0; border-radius: 11px; padding: 12px 14px; font-size: 12px; font-weight: 700; }
.staff-message--success { border: 1px solid rgba(85, 224, 181, .22); background: rgba(85, 224, 181, .07); color: #83e9c9; }
.staff-message--error { border: 1px solid rgba(255, 103, 103, .22); background: rgba(255, 103, 103, .07); color: #ff9b9b; }

.staff-panel { margin-top: 16px; overflow: hidden; border: 1px solid rgba(111, 151, 182, .15); border-radius: 17px; background: rgba(8, 14, 23, .92); }
.staff-panel__header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(111, 151, 182, .12); padding: 20px 22px; }
.staff-panel__header > div:first-child > span { color: #55e0b5; font-size: 9px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.staff-panel__header h2 { margin: 4px 0 0; color: #eef5fa; font-size: 20px; font-weight: 920; }
.staff-panel__header p { margin: 5px 0 0; color: #687c8e; font-size: 11px; }
.staff-filters { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; }
.staff-filters button { border: 1px solid rgba(111, 151, 182, .14); border-radius: 8px; padding: 8px 10px; color: #75899b; font-size: 10px; font-weight: 800; }
.staff-filters button:hover { color: #c8d6df; }
.staff-filters button.is-active { border-color: rgba(85, 224, 181, .4); background: rgba(85, 224, 181, .1); color: #72e6c1; }
.staff-panel__link { border: 1px solid rgba(85, 224, 181, .2); border-radius: 9px; padding: 9px 12px; color: #72e6c1; font-size: 10px; font-weight: 850; }
.staff-panel__link b { margin-left: 5px; }

.topup-list, .comment-list { display: grid; }
.topup-row { display: grid; grid-template-columns: 70px minmax(180px, 1.3fr) minmax(100px, .7fr) 100px minmax(150px, auto); align-items: center; gap: 14px; min-height: 78px; border-bottom: 1px solid rgba(111, 151, 182, .09); padding: 12px 22px; }
.topup-row:last-child { border-bottom: 0; }
.topup-row__id { color: #8ca0b2; font: 800 12px ui-monospace, monospace; }
.topup-row__id span { margin-right: 2px; color: #55e0b5; }
.topup-row__person strong { display: block; color: #dce7ef; font-size: 13px; }
.topup-row__person span { display: block; margin-top: 4px; color: #637789; font-size: 10px; }
.topup-row__person span b { color: #8398aa; font-weight: 850; }
.topup-row__person span b.is-coupon { color: #72e5c2; }
.topup-row__amount { color: #f4f8fb; font-size: 15px; }
.topup-status { width: fit-content; border-radius: 999px; padding: 6px 8px; font-size: 9px; font-weight: 900; }
.topup-status--pending { background: rgba(255, 188, 77, .1); color: #ffc76b; }
.topup-status--approved { background: rgba(85, 224, 181, .1); color: #72e6c1; }
.topup-status--rejected { background: rgba(255, 103, 103, .1); color: #ff9494; }
.topup-row__actions { display: flex; justify-content: flex-end; gap: 6px; }
.topup-row__actions button { border-radius: 8px; padding: 8px 11px; font-size: 10px; font-weight: 900; }
.topup-row__actions .approve { background: #55e0b5; color: #06120f; }
.topup-row__actions .reject { border: 1px solid rgba(255, 103, 103, .25); color: #ff9494; }
.topup-row__actions button:disabled { cursor: wait; opacity: .5; }
.topup-row > time { color: #607486; font-size: 9px; text-align: right; }

.comment-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 13px; border-bottom: 1px solid rgba(111, 151, 182, .09); padding: 17px 22px; }
.comment-row:last-child { border-bottom: 0; }
.comment-row__avatar { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 12px; background: rgba(85, 224, 181, .09); color: #72e6c1; font-size: 13px; font-weight: 950; }
.comment-row__body > div { display: flex; align-items: center; gap: 9px; }
.comment-row__body strong { color: #dce7ef; font-size: 12px; }
.comment-row__body time { color: #596d80; font-size: 9px; }
.comment-row__body p { margin: 6px 0; color: #9aabba; font-size: 12px; line-height: 1.55; }
.comment-row__body a { color: #55e0b5; font-size: 9px; font-weight: 850; }
.comment-row__delete { align-self: center; border: 1px solid rgba(255, 103, 103, .2); border-radius: 8px; padding: 8px 10px; color: #ff8d8d; font-size: 10px; font-weight: 850; }
.staff-empty { display: grid; min-height: 145px; place-content: center; gap: 5px; padding: 24px; color: #617587; text-align: center; font-size: 12px; }
.staff-empty strong { color: #9dafbd; font-size: 13px; }
.staff-empty span { color: #5f7284; font-size: 10px; }

@media (max-width: 900px) {
  .staff-summary { grid-template-columns: 1fr 1fr; }
  .staff-stat:last-child { grid-column: 1 / -1; }
  .staff-panel__header { align-items: flex-start; flex-direction: column; }
  .staff-filters { justify-content: flex-start; }
  .topup-row { grid-template-columns: 60px minmax(0, 1fr) auto; }
  .topup-row__amount { text-align: right; }
  .topup-status { grid-column: 2; }
  .topup-row__actions, .topup-row > time { grid-column: 3; grid-row: 2; }
}

@media (max-width: 560px) {
  .staff-summary { grid-template-columns: 1fr 1fr; }
  .staff-stat { min-height: 110px; padding: 16px; }
  .staff-stat:last-child { display: none; }
  .staff-panel__header { padding: 17px; }
  .staff-filters { display: grid; width: 100%; grid-template-columns: 1fr 1fr; }
  .topup-row { grid-template-columns: 1fr auto; padding: 16px 17px; }
  .topup-row__id { display: none; }
  .topup-row__person { grid-column: 1; }
  .topup-row__amount { grid-column: 2; grid-row: 1; }
  .topup-status { grid-column: 1; grid-row: 2; }
  .topup-row__actions, .topup-row > time { grid-column: 2; grid-row: 2; }
  .comment-row { grid-template-columns: 34px minmax(0, 1fr); padding: 15px 17px; }
  .comment-row__avatar { width: 34px; height: 34px; border-radius: 9px; }
  .comment-row__delete { grid-column: 2; width: fit-content; }
}
</style>
