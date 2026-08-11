<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import StaffForumModerationPanel from '../components/StaffForumModerationPanel.vue'
import RolePortalShell from '../components/RolePortalShell.vue'
import { staffPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'
import { deleteEventComment, getModerationComments } from '../services/communityApi'

const router = useRouter()
const comments = ref([])
const activeTab = ref('comments') // 'comments' | 'reports' | 'forum'
const error = ref('')
const notice = ref('')
const loading = ref(true)

const reports = ref([
  { id: 'rep-1', reporter: 'quanthanh12', reportedUser: 'bad_user99', targetType: 'Bình luận', reason: 'Nội dung xúc phạm, ngôn từ không phù hợp', content: 'Chửi thề và xúc phạm các thành viên trong bài viết sự kiện UR+', createdAt: '2026-08-11T14:20:00Z' },
  { id: 'rep-2', reporter: 'pvp_master', reportedUser: 'spam_acc', targetType: 'Bài viết', reason: 'Spam quảng cáo website cờ bạc', content: 'Chia sẻ link lừa đảo nạp kim cương lậu', createdAt: '2026-08-11T16:45:00Z' },
])

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

const resolveReport = (reportId, action) => {
  reports.value = reports.value.filter(r => r.id !== reportId)
  if (action === 'dismiss') {
    notice.value = 'Đã bỏ qua báo cáo sai sự thật.'
  } else {
    notice.value = 'Đã xử lý xóa nội dung bị báo cáo vi phạm.'
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
    :navigation="staffPortalNavigation"
    @logout="logout"
  >
    <!-- KPI Summary Section -->
    <section class="staff-summary">
      <article class="staff-stat staff-stat--primary">
        <span>Bình luận sự kiện</span>
        <strong>{{ comments.length }}</strong>
        <p>cần theo dõi kiểm duyệt</p>
      </article>
      <article class="staff-stat staff-stat--warning">
        <span>Báo cáo vi phạm</span>
        <strong>{{ reports.length }}</strong>
        <p>đơn báo cáo đang chờ xử lý</p>
      </article>
      <article class="staff-stat">
        <span>Trạng thái hệ thống</span>
        <strong class="staff-stat__online"><i /> Sẵn sàng</strong>
        <p>có thể tiếp nhận thao tác</p>
      </article>
    </section>

    <p v-if="notice" class="staff-message staff-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="staff-message staff-message--error" role="alert">{{ error }}</p>

    <!-- Sub Navigation Tabs for Staff -->
    <div class="staff-subnav">
      <button
        type="button"
        class="btn-subnav"
        :class="{ 'btn-subnav--active': activeTab === 'comments' }"
        @click="activeTab = 'comments'"
      >
        <span>💬 Bình Luận Sự Kiện ({{ comments.length }})</span>
      </button>
      <button
        type="button"
        class="btn-subnav"
        :class="{ 'btn-subnav--active': activeTab === 'reports' }"
        @click="activeTab = 'reports'"
      >
        <span>🚨 Hàng Đợi Báo Cáo ({{ reports.length }})</span>
      </button>
      <button
        type="button"
        class="btn-subnav"
        :class="{ 'btn-subnav--active': activeTab === 'forum' }"
        @click="activeTab = 'forum'"
      >
        <span>🗣️ Kiểm Duyệt Diễn Đàn</span>
      </button>
    </div>

    <!-- Tab 1: Event Comments -->
    <section v-if="activeTab === 'comments'" class="staff-panel">
      <header class="staff-panel__header">
        <div>
          <span>Hàng đợi kiểm duyệt</span>
          <h2>Bình luận sự kiện mới nhất</h2>
          <p>Xem nhanh nội dung mới và xóa các bình luận vi phạm.</p>
        </div>
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
            <RouterLink :to="`/events/${item.eventId}`">Mở sự kiện ↗</RouterLink>
          </div>
          <button type="button" class="comment-row__delete" @click="removeComment(item)">Xóa</button>
        </article>
      </div>
      <div v-else class="staff-empty">
        <strong>Chưa có bình luận mới</strong>
        <span>Nội dung cộng đồng hiện đang sạch.</span>
      </div>
    </section>

    <!-- Tab 2: Report Queue -->
    <section v-else-if="activeTab === 'reports'" class="staff-panel">
      <header class="staff-panel__header">
        <div>
          <span>Hàng đợi báo cáo</span>
          <h2>Báo cáo vi phạm từ người dùng</h2>
          <p>Xem chi tiết lý do báo cáo và đưa ra quyết định giữ lại hoặc xóa nội dung.</p>
        </div>
      </header>

      <div v-if="reports.length" class="report-list">
        <article v-for="rep in reports" :key="rep.id" class="report-card">
          <div class="report-meta">
            <span class="report-tag">{{ rep.targetType }}</span>
            <span class="report-users">
              Người báo cáo: <code>@{{ rep.reporter }}</code> ➔ Người bị báo cáo: <code class="bad-user">@{{ rep.reportedUser }}</code>
            </span>
            <time>{{ date(rep.createdAt) }}</time>
          </div>
          <div class="report-reason">
            <strong>Lý do báo cáo:</strong> {{ rep.reason }}
          </div>
          <blockquote class="report-snippet">
            "{{ rep.content }}"
          </blockquote>
          <div class="report-actions">
            <button type="button" class="btn-dismiss" @click="resolveReport(rep.id, 'dismiss')">Giữ lại (Khấu trừ báo cáo sai)</button>
            <button type="button" class="btn-delete-report" @click="resolveReport(rep.id, 'delete')">Xóa nội dung vi phạm</button>
          </div>
        </article>
      </div>
      <div v-else class="staff-empty">
        <strong>Không có báo cáo vi phạm nào</strong>
        <span>Toàn bộ hàng đợi báo cáo đã được xử lý xong.</span>
      </div>
    </section>

    <!-- Tab 3: Forum Moderation -->
    <section v-else-if="activeTab === 'forum'">
      <StaffForumModerationPanel />
    </section>
  </RolePortalShell>
</template>

<style scoped>
.staff-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.staff-stat { min-height: 110px; border: 1px solid rgba(111, 151, 182, .15); border-radius: 15px; background: rgba(9, 16, 25, .9); padding: 18px; }
.staff-stat--primary { border-color: rgba(85, 224, 181, .28); background: linear-gradient(135deg, rgba(85, 224, 181, .09), rgba(9, 16, 25, .92)); }
.staff-stat--warning { border-color: rgba(245, 158, 11, .28); background: linear-gradient(135deg, rgba(245, 158, 11, .09), rgba(9, 16, 25, .92)); }
.staff-stat > span { color: #71869a; font-size: 10px; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; }
.staff-stat > strong { display: block; margin-top: 6px; color: #f3f8fc; font-size: 26px; font-weight: 950; line-height: 1; }
.staff-stat p { margin: 6px 0 0; color: #627689; font-size: 10px; }
.staff-stat__online { display: flex !important; align-items: center; gap: 8px; padding-top: 4px; color: #72e6c1 !important; font-size: 16px !important; }
.staff-stat__online i { width: 8px; height: 8px; border-radius: 50%; background: #55e0b5; box-shadow: 0 0 14px rgba(85, 224, 181, .7); }

.staff-subnav { display: flex; gap: 10px; margin-top: 18px; }
.btn-subnav {
  cursor: pointer;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, .08);
  background: rgba(12, 19, 32, .6);
  color: #8194a6;
  font-size: 12.5px;
  font-weight: 850;
  transition: all .2s ease;
}
.btn-subnav:hover { color: #f8fafc; border-color: rgba(255, 255, 255, .2); }
.btn-subnav--active { background: #38bdf8; border-color: #38bdf8; color: #020617; font-weight: 950; box-shadow: 0 0 14px rgba(56, 189, 248, .3); }

.staff-message { margin: 14px 0 0; border-radius: 11px; padding: 12px 14px; font-size: 12px; font-weight: 700; }
.staff-message--success { border: 1px solid rgba(85, 224, 181, .22); background: rgba(85, 224, 181, .07); color: #83e9c9; }
.staff-message--error { border: 1px solid rgba(255, 103, 103, .22); background: rgba(255, 103, 103, .07); color: #ff9b9b; }

.staff-panel { margin-top: 16px; overflow: hidden; border: 1px solid rgba(111, 151, 182, .15); border-radius: 17px; background: rgba(8, 14, 23, .92); }
.staff-panel__header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(111, 151, 182, .12); padding: 20px 22px; }
.staff-panel__header > div:first-child > span { color: #55e0b5; font-size: 9px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.staff-panel__header h2 { margin: 4px 0 0; color: #eef5fa; font-size: 20px; font-weight: 920; }
.staff-panel__header p { margin: 5px 0 0; color: #687c8e; font-size: 11px; }

.comment-list { display: grid; }
.comment-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 13px; border-bottom: 1px solid rgba(111, 151, 182, .09); padding: 17px 22px; }
.comment-row:last-child { border-bottom: 0; }
.comment-row__avatar { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 12px; background: rgba(85, 224, 181, .09); color: #72e6c1; font-size: 13px; font-weight: 950; }
.comment-row__body > div { display: flex; align-items: center; gap: 9px; }
.comment-row__body strong { color: #dce7ef; font-size: 12px; }
.comment-row__body time { color: #596d80; font-size: 9px; }
.comment-row__body p { margin: 6px 0; color: #9aabba; font-size: 12px; line-height: 1.55; }
.comment-row__body a { color: #55e0b5; font-size: 10px; font-weight: 850; }
.comment-row__delete { align-self: center; cursor: pointer; border: 1px solid rgba(255, 103, 103, .2); border-radius: 8px; padding: 8px 14px; color: #ff8d8d; font-size: 11px; font-weight: 850; background: rgba(255, 103, 103, .08); }
.comment-row__delete:hover { background: rgba(255, 103, 103, .2); }

/* Report Queue Styles */
.report-list { display: grid; gap: 14px; padding: 20px; }
.report-card { border: 1px solid rgba(255, 255, 255, .08); border-radius: 14px; background: rgba(15, 23, 42, .6); padding: 18px; }
.report-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; }
.report-tag { padding: 3px 8px; border-radius: 6px; background: rgba(245, 158, 11, .15); color: #f59e0b; font-size: 10px; font-weight: 900; }
.report-users { color: #94a3b8; }
.report-users code { color: #38bdf8; }
.report-users code.bad-user { color: #fb7185; }
.report-meta time { margin-left: auto; color: #64748b; font-size: 11px; }

.report-reason { margin-top: 10px; color: #fb7185; font-size: 13px; }
.report-snippet { margin: 10px 0 0; padding: 12px; border-left: 3px solid rgba(255, 255, 255, .2); background: rgba(0, 0, 0, .3); color: #cbd5e1; font-size: 12.5px; font-style: italic; border-radius: 0 8px 8px 0; }

.report-actions { display: flex; gap: 10px; margin-top: 14px; }
.btn-dismiss { cursor: pointer; padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, .15); background: rgba(255, 255, 255, .05); color: #cbd5e1; font-size: 11.5px; font-weight: 850; }
.btn-dismiss:hover { background: rgba(255, 255, 255, .1); }
.btn-delete-report { cursor: pointer; padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(244, 63, 94, .4); background: rgba(244, 63, 94, .12); color: #fb7185; font-size: 11.5px; font-weight: 850; }
.btn-delete-report:hover { background: rgba(244, 63, 94, .25); }

.staff-empty { display: grid; min-height: 145px; place-content: center; gap: 5px; padding: 24px; color: #617587; text-align: center; font-size: 12px; }
.staff-empty strong { color: #9dafbd; font-size: 13px; }
.staff-empty span { color: #5f7284; font-size: 10px; }

@media (max-width: 768px) {
  .staff-summary { grid-template-columns: 1fr; }
  .staff-subnav { flex-wrap: wrap; }
}
</style>
