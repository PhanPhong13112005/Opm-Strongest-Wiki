<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { authState, clearSession } from '../services/authApi'
import { deleteEventComment, getModerationComments } from '../services/communityApi'

const router = useRouter()
const comments = ref([])
const error = ref('')
const notice = ref('')
const loading = ref(true)

const navigation = [
  { to: '/staff', index: '01', label: 'Tổng quan', hint: 'Kiểm duyệt cộng đồng' },
  { to: '/forum', index: '02', label: 'Kiểm duyệt diễn đàn', hint: 'Chủ đề và phản hồi' },
  { to: '/events', index: '03', label: 'Bình luận sự kiện', hint: 'Mở danh sách sự kiện' },
  { to: '/account', index: '04', label: 'Trang cá nhân', hint: 'Tiện ích thành viên' },
]

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    comments.value = await getModerationComments()
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
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

const date = value => new Date(value).toLocaleString('vi-VN')

onMounted(load)
</script>

<template>
  <RolePortalShell
    role="staff"
    role-label="Khu vực nhân viên"
    title="Trung tâm kiểm duyệt"
    description="Theo dõi và xử lý nội dung cộng đồng. Thanh toán được hệ thống đối soát tự động và không thuộc quyền Staff."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="navigation"
    @logout="logout"
  >
    <section class="staff-summary">
      <article class="staff-stat staff-stat--primary">
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

    <section class="staff-panel">
      <header class="staff-panel__header">
        <div>
          <span>Hàng đợi kiểm duyệt</span>
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
.staff-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
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
.staff-panel__link { border: 1px solid rgba(85, 224, 181, .2); border-radius: 9px; padding: 9px 12px; color: #72e6c1; font-size: 10px; font-weight: 850; }
.staff-panel__link b { margin-left: 5px; }

.comment-list { display: grid; }
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
  .staff-panel__header { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 560px) {
  .staff-summary { grid-template-columns: 1fr; }
  .staff-stat { min-height: 110px; padding: 16px; }
  .staff-panel__header { padding: 17px; }
  .comment-row { grid-template-columns: 34px minmax(0, 1fr); padding: 15px 17px; }
  .comment-row__avatar { width: 34px; height: 34px; border-radius: 9px; }
  .comment-row__delete { grid-column: 2; width: fit-content; }
}
</style>
