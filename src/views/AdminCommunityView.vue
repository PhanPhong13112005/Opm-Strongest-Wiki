<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { adminPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'
import {
  deleteAdminEventComment,
  deleteAdminForumTopic,
  getAdminCommunityFeed,
  toggleAdminForumTopicLock,
} from '../services/adminApi'

const router = useRouter()
const activeTab = ref('topics') // 'topics' | 'comments'
const feed = ref({ topics: [], comments: [] })
const loading = ref(true)
const page = ref(1)
const pageSize = 25
const search = ref('')
const notice = ref('')
const error = ref('')
const actionId = ref(null)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    feed.value = await getAdminCommunityFeed({
      kind: activeTab.value,
      page: page.value,
      pageSize,
    })
  } catch (err) {
    error.value = err.message || 'Không thể tải danh sách cộng đồng.'
  } finally {
    loading.value = false
  }
}

const filteredTopics = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return feed.value.topics || []
  return (feed.value.topics || []).filter(t =>
    String(t.title || '').toLowerCase().includes(kw) ||
    String(t.author || '').toLowerCase().includes(kw)
  )
})

const filteredComments = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return feed.value.comments || []
  return (feed.value.comments || []).filter(c =>
    String(c.content || '').toLowerCase().includes(kw) ||
    String(c.author || '').toLowerCase().includes(kw)
  )
})

const toggleLock = async (topic) => {
  actionId.value = topic.id
  notice.value = ''
  error.value = ''
  try {
    const nextLocked = !topic.isLocked
    const updated = await toggleAdminForumTopicLock(topic.id, nextLocked, topic.version)
    Object.assign(topic, updated)
    notice.value = `Đã ${nextLocked ? 'khóa' : 'mở khóa'} chủ đề "${topic.title}".`
  } catch (err) {
    error.value = err.message || 'Lỗi thay đổi trạng thái chủ đề.'
  } finally {
    actionId.value = null
  }
}

const deleteTopic = async (topic) => {
  if (!globalThis.confirm(`Bạn có chắc chắn muốn ẩn/xóa chủ đề "${topic.title}"?`)) return
  actionId.value = topic.id
  notice.value = ''
  error.value = ''
  try {
    await deleteAdminForumTopic(topic.id, topic.version)
    feed.value.topics = feed.value.topics.filter(t => t.id !== topic.id)
    notice.value = `Đã xóa chủ đề "${topic.title}".`
  } catch (err) {
    error.value = err.message || 'Lỗi xóa chủ đề.'
  } finally {
    actionId.value = null
  }
}

const deleteComment = async (comment) => {
  if (!globalThis.confirm('Xóa bình luận sự kiện này?')) return
  actionId.value = comment.id
  notice.value = ''
  error.value = ''
  try {
    await deleteAdminEventComment(comment.id, comment.version)
    feed.value.comments = feed.value.comments.filter(c => c.id !== comment.id)
    notice.value = 'Đã xóa bình luận sự kiện.'
  } catch (err) {
    error.value = err.message || 'Lỗi xóa bình luận.'
  } finally {
    actionId.value = null
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(Number(feed.value?.totalItems || 0) / pageSize)))
const changePage = async nextPage => {
  page.value = Math.min(totalPages.value, Math.max(1, nextPage))
  await load()
}

const logout = async () => {
  clearSession()
  await router.replace('/')
}

watch(activeTab, async () => {
  page.value = 1
  search.value = ''
  await load()
})
onMounted(load)
</script>

<template>
  <RolePortalShell
    role="admin"
    role-label="Khu vực quản trị viên"
    title="Kiểm duyệt Diễn đàn & Cộng đồng"
    description="Quản lý thảo luận, khóa chủ đề vi phạm, xóa bình luận rác để bảo vệ môi trường cộng đồng."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="adminPortalNavigation"
    @logout="logout"
  >
    <p v-if="notice" class="admin-message admin-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>

    <!-- Navigation Tabs -->
    <div class="community-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'topics' }"
        @click="activeTab = 'topics'"
      >
        Diễn đàn ({{ feed.topics?.length || 0 }} chủ đề)
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'comments' }"
        @click="activeTab = 'comments'"
      >
        Bình luận Sự kiện ({{ feed.comments?.length || 0 }})
      </button>
    </div>

    <!-- Topics Tab -->
    <section v-if="activeTab === 'topics'" class="comm-panel">
      <header class="comm-panel__header">
        <div>
          <span>Cộng đồng</span>
          <h2>Chủ đề Diễn đàn</h2>
        </div>
        <label class="comm-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>
          <input v-model="search" type="search" placeholder="Tìm tiêu đề hoặc tác giả…" />
        </label>
      </header>

      <div class="comm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tiêu đề chủ đề</th>
              <th>Tác giả</th>
              <th>Phản hồi</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="topic in filteredTopics" :key="topic.id">
              <td>
                <div class="topic-title">
                  <strong>{{ topic.title }}</strong>
                  <p>{{ topic.contentSnippet }}</p>
                </div>
              </td>
              <td><code>@{{ topic.author }}</code></td>
              <td><b>{{ topic.postCount || 0 }}</b></td>
              <td>{{ new Date(topic.createdAt).toLocaleDateString('vi-VN') }}</td>
              <td>
                <span class="status-pill" :class="{ 'status-pill--locked': topic.isLocked }">
                  {{ topic.isLocked ? 'Đã khóa' : 'Công khai' }}
                </span>
              </td>
              <td>
                <div class="action-group">
                  <button
                    type="button"
                    class="btn-btn btn-lock"
                    :disabled="actionId === topic.id"
                    @click="toggleLock(topic)"
                  >
                    {{ topic.isLocked ? 'Mở khóa' : 'Khóa' }}
                  </button>
                  <button
                    type="button"
                    class="btn-btn btn-del"
                    :disabled="actionId === topic.id"
                    @click="deleteTopic(topic)"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="comm-empty">Đang tải chủ đề diễn đàn…</div>
        <div v-else-if="filteredTopics.length === 0" class="comm-empty">Không tìm thấy chủ đề nào.</div>
      </div>
      <nav class="comm-pagination" aria-label="Phân trang chủ đề">
        <button type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Trang trước</button>
        <span>Trang {{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">Trang sau</button>
      </nav>
    </section>

    <!-- Comments Tab -->
    <section v-else class="comm-panel">
      <header class="comm-panel__header">
        <div>
          <span>Cộng đồng</span>
          <h2>Bình luận Sự kiện</h2>
        </div>
        <label class="comm-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>
          <input v-model="search" type="search" placeholder="Tìm nội dung bình luận…" />
        </label>
      </header>

      <div class="comm-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tác giả</th>
              <th>Nội dung bình luận</th>
              <th>Sự kiện</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in filteredComments" :key="comment.id">
              <td><code>@{{ comment.author }}</code></td>
              <td>
                <p class="comment-text">{{ comment.content }}</p>
              </td>
              <td><span class="event-tag">{{ comment.eventId }}</span></td>
              <td>{{ new Date(comment.createdAt).toLocaleString('vi-VN') }}</td>
              <td>
                <button
                  type="button"
                  class="btn-btn btn-del"
                  :disabled="actionId === comment.id"
                  @click="deleteComment(comment)"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="comm-empty">Đang tải bình luận sự kiện…</div>
        <div v-else-if="filteredComments.length === 0" class="comm-empty">Không tìm thấy bình luận nào.</div>
      </div>
      <nav class="comm-pagination" aria-label="Phân trang bình luận">
        <button type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Trang trước</button>
        <span>Trang {{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">Trang sau</button>
      </nav>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.admin-message {
  margin: 16px 0 0;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 800;
}
.admin-message--success { border: 1px solid rgba(52, 211, 153, .3); background: rgba(52, 211, 153, .08); color: #6ee7b7; }
.admin-message--error { border: 1px solid rgba(244, 63, 94, .3); background: rgba(244, 63, 94, .08); color: #fda4af; }

.community-tabs { display: flex; gap: 10px; margin-top: 20px; }
.tab-btn {
  cursor: pointer;
  height: 44px;
  padding: 0 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, .1);
  background: rgba(15, 23, 42, .6);
  color: #94a3b8;
  font-size: 13.5px;
  font-weight: 850;
  transition: all .2s ease;
}
.tab-btn:hover { color: #f8fafc; border-color: rgba(255, 255, 255, .2); }
.tab-btn--active { background: #ffc700; border-color: #ffc700; color: #020617; box-shadow: 0 0 15px rgba(255, 199, 0, .3); }

.comm-panel {
  margin-top: 20px;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
  overflow: hidden;
}
.comm-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  background: rgba(15, 23, 42, .3);
}
.comm-panel__header span { color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.comm-panel__header h2 { margin: 4px 0 0; color: #f8fafc; font-size: 22px; font-weight: 950; }

.comm-search {
  display: flex;
  width: 280px;
  height: 42px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 12px;
  background: rgba(15, 23, 42, .6);
  padding: 0 14px;
}
.comm-search svg { width: 16px; height: 16px; fill: none; stroke: #64748b; stroke-width: 2; }
.comm-search input { width: 100%; background: transparent; color: #f8fafc; font-size: 13px; outline: none; }

.comm-table-wrap { overflow-x: auto; }
.comm-table-wrap table { width: 100%; min-width: 800px; border-collapse: collapse; text-align: left; }
.comm-table-wrap th { border-bottom: 1px solid rgba(255, 255, 255, .08); padding: 14px 22px; color: #94a3b8; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.comm-table-wrap td { border-bottom: 1px solid rgba(255, 255, 255, .05); padding: 14px 22px; color: #cbd5e1; font-size: 13px; }

.topic-title strong { display: block; color: #f8fafc; font-size: 14px; font-weight: 850; }
.topic-title p { margin: 4px 0 0; color: #64748b; font-size: 12px; max-width: 480px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.comment-text { margin: 0; color: #e2e8f0; font-size: 13px; max-width: 500px; }
.event-tag { display: inline-block; padding: 2px 8px; border-radius: 6px; background: rgba(56, 189, 248, .1); color: #38bdf8; font-size: 11px; font-weight: 800; }

.status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 850; background: rgba(52, 211, 153, .1); color: #34d399; }
.status-pill--locked { background: rgba(244, 63, 94, .1); color: #fb7185; }

.action-group { display: flex; gap: 8px; }
.btn-btn { cursor: pointer; height: 32px; padding: 0 12px; border-radius: 8px; font-size: 12px; font-weight: 850; transition: all .2s ease; }
.btn-lock { border: 1px solid rgba(255, 255, 255, .14); background: rgba(255, 255, 255, .05); color: #e2e8f0; }
.btn-lock:hover { border-color: rgba(255, 255, 255, .3); background: rgba(255, 255, 255, .12); }
.btn-del { border: 1px solid rgba(244, 63, 94, .3); background: rgba(244, 63, 94, .08); color: #fb7185; }
.btn-del:hover { border-color: rgba(244, 63, 94, .6); background: rgba(244, 63, 94, .2); }
.comm-empty { display: grid; min-height: 140px; place-items: center; padding: 24px; color: #94a3b8; font-size: 13.5px; font-weight: 700; }
.comm-pagination { display:flex;align-items:center;justify-content:flex-end;gap:12px;border-top:1px solid rgba(255,255,255,.08);padding:14px 22px;color:#94a3b8;font-size:12px;font-weight:800 }
.comm-pagination button { cursor:pointer;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#0f172a;padding:7px 11px;color:#e2e8f0;font-weight:800 }
.comm-pagination button:disabled { cursor:not-allowed;opacity:.45 }

@media (max-width: 768px) {
  .comm-panel__header { flex-direction: column; align-items: flex-start; }
  .comm-search { width: 100%; }
}
</style>
