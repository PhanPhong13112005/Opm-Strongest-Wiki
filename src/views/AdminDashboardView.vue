<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AdminDashboardCharts from '../components/AdminDashboardCharts.vue'
import RolePortalShell from '../components/RolePortalShell.vue'
import { adminPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'
import { getAdminDashboard, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../services/adminApi'

const router = useRouter()
const stats = ref(null)
const users = ref([])
const error = ref('')
const notice = ref('')
const loading = ref(true)
const updatingUserId = ref(null)
const userSearch = ref('')
const roleFilter = ref('ALL')
const statusFilter = ref('ALL')
const currentPage = ref(1)
const pageSize = 10

const isCurrentAccount = user => String(user.id).toLowerCase() === String(authState.session?.userId || '').toLowerCase()

const filteredUsers = computed(() => {
  let list = users.value
  if (roleFilter.value !== 'ALL') {
    list = list.filter(u => u.role === roleFilter.value)
  }
  if (statusFilter.value === 'ACTIVE') {
    list = list.filter(u => u.isActive !== false)
  } else if (statusFilter.value === 'INACTIVE') {
    list = list.filter(u => u.isActive === false)
  }
  const keyword = userSearch.value.trim().toLocaleLowerCase('vi')
  if (keyword) {
    list = list.filter(user => [user.username, user.displayName, user.role]
      .some(value => String(value || '').toLocaleLowerCase('vi').includes(keyword)))
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize)))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

const modules = [
  { to: '/admin/characters', code: 'DATA-01', title: 'Nhân vật & Kỷ vật', description: 'Thêm, sửa, xóa thông tin nhân vật và gắn Kỷ vật.', color: 'gold' },
  { to: '/admin/releases', code: 'PLAN-02', title: 'Lịch ra mắt', description: 'Quản lý mốc phát hành CN/SEA hiển thị trên trang chủ.', color: 'blue' },
  { to: '/admin/events', code: 'LIVE-03', title: 'Sự kiện', description: 'Cập nhật lịch, nội dung và phần thưởng của sự kiện.', color: 'violet' },
  { to: '/admin/top-ups', code: 'PAY-04', title: 'Đơn Coupon', description: 'Kiểm tra UID, server và xác nhận đơn Coupon đã được nạp.', color: 'rose' },
  { to: '/staff', code: 'SAFE-05', title: 'Kiểm duyệt', description: 'Theo dõi bình luận và xử lý nội dung diễn đàn.', color: 'green' },
]

const activeAdminTab = ref('users') // 'users' | 'audit'

const auditLogs = ref([
  { id: 'log-1', admin: 'admin', action: 'Duyệt đơn Coupon #1042', target: 'UID 100342 — 50.000đ', type: 'topup', createdAt: '2026-08-11T18:30:00Z' },
  { id: 'log-2', admin: 'admin', action: 'Đổi vai trò tài khoản', target: '@staff1 → Staff', type: 'role', createdAt: '2026-08-11T17:15:00Z' },
  { id: 'log-3', admin: 'admin', action: 'Vô hiệu hóa tài khoản', target: '@bad_user99', type: 'status', createdAt: '2026-08-11T16:40:00Z' },
  { id: 'log-4', admin: 'admin', action: 'Cập nhật nhân vật', target: 'Rover UR+ — chỉnh sửa chỉ số PVP', type: 'character', createdAt: '2026-08-11T14:05:00Z' },
  { id: 'log-5', admin: 'admin', action: 'Từ chối đơn Coupon #1041', target: 'UID 99831 — UID sai', type: 'topup', createdAt: '2026-08-11T11:22:00Z' },
])

const addAuditLog = (action, target, type = 'role') => {
  auditLogs.value.unshift({
    id: `log-${Date.now()}`,
    admin: authState.session?.username || 'admin',
    action,
    target,
    type,
    createdAt: new Date().toISOString(),
  })
}

const formatLogDate = (iso) => new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

const load = async () => {
  error.value = ''
  loading.value = true
  try {
    ;[stats.value, users.value] = await Promise.all([getAdminDashboard(), getAdminUsers()])
  } catch (exception) {
    error.value = exception.message
  } finally {
    loading.value = false
  }
}

const updateRole = async user => {
  error.value = ''
  notice.value = ''
  updatingUserId.value = user.id
  try {
    await updateAdminUserRole(user.id, user.role)
    notice.value = `Đã đổi vai trò của ${user.displayName} thành ${user.role}.`
    addAuditLog('Đổi vai trò tài khoản', `@${user.username} → ${user.role}`, 'role')
    stats.value = await getAdminDashboard()
  } catch (exception) {
    error.value = exception.message
    await load()
  } finally {
    updatingUserId.value = null
  }
}

const updateStatus = async user => {
  if (isCurrentAccount(user)) return
  const nextIsActive = user.isActive === false
  const action = nextIsActive ? 'kích hoạt lại' : 'vô hiệu hóa'
  if (!globalThis.confirm(`Bạn muốn ${action} tài khoản “${user.displayName}”?`)) return

  error.value = ''
  notice.value = ''
  updatingUserId.value = user.id
  try {
    const updated = await updateAdminUserStatus(user.id, nextIsActive)
    Object.assign(user, updated)
    notice.value = `Đã ${action} tài khoản ${user.displayName}.`
    addAuditLog(nextIsActive ? 'Kích hoạt lại tài khoản' : 'Vô hiệu hóa tài khoản', `@${user.username}`, 'status')
  } catch (exception) {
    error.value = exception.message
    await load()
  } finally {
    updatingUserId.value = null
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
    title="Tổng quan hệ thống"
    description="Theo dõi dữ liệu, quản lý nội dung và phân quyền tài khoản từ một nơi."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="adminPortalNavigation"
    @logout="logout"
  >
    <AdminDashboardCharts :stats="stats" :loading="loading" />

    <p v-if="notice" class="admin-message admin-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>

    <div class="admin-subnav">
      <button type="button" class="btn-admintab" :class="{ 'btn-admintab--active': activeAdminTab === 'users' }" @click="activeAdminTab = 'users'">
        👥 Quản Lý Người Dùng
      </button>
      <button type="button" class="btn-admintab" :class="{ 'btn-admintab--active': activeAdminTab === 'audit' }" @click="activeAdminTab = 'audit'">
        📜 Nhật Ký Thao Tác ({{ auditLogs.length }})
      </button>
    </div>

    <section v-if="activeAdminTab === 'users'" class="admin-users">
      <header class="admin-users__header">
        <div>
          <span>Tài khoản & quyền truy cập</span>
          <h2>Quản lý người dùng</h2>
          <p>Thay đổi vai trò hoặc trạng thái để kiểm soát quyền truy cập của từng tài khoản.</p>
        </div>
        <div class="admin-users__controls">
          <select v-model="roleFilter" class="admin-filter-select" aria-label="Lọc theo vai trò">
            <option value="ALL">Tất cả Vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="User">User</option>
          </select>
          <select v-model="statusFilter" class="admin-filter-select" aria-label="Lọc theo trạng thái">
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã vô hiệu hóa</option>
          </select>
          <label class="admin-user-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>
            <input v-model="userSearch" type="search" placeholder="Tìm tài khoản hoặc tên…" />
          </label>
        </div>
      </header>

      <div class="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Tên đăng nhập</th>
              <th>Số dư</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td>
                <div class="admin-user-cell">
                  <span>{{ user.displayName?.slice(0, 1).toUpperCase() }}</span>
                  <strong>{{ user.displayName }}</strong>
                </div>
              </td>
              <td><code>@{{ user.username }}</code></td>
              <td><b class="admin-balance">{{ Number(user.balance).toLocaleString('vi-VN') }}đ</b></td>
              <td>{{ new Date(user.createdAt).toLocaleDateString('vi-VN') }}</td>
              <td>
                <span class="admin-account-status" :class="{ 'admin-account-status--inactive': user.isActive === false }">
                  {{ user.isActive === false ? 'Đã vô hiệu hóa' : 'Đang hoạt động' }}
                </span>
              </td>
              <td>
                <select
                  v-model="user.role"
                  :disabled="updatingUserId === user.id || user.isActive === false || isCurrentAccount(user)"
                  :aria-label="`Vai trò của ${user.displayName}`"
                  @change="updateRole(user)"
                >
                  <option>User</option>
                  <option>Staff</option>
                  <option>Admin</option>
                </select>
                <small v-if="isCurrentAccount(user)" class="admin-account-self">Tài khoản hiện tại</small>
              </td>
              <td>
                <button
                  type="button"
                  class="admin-account-action"
                  :class="{ 'admin-account-action--activate': user.isActive === false }"
                  :disabled="updatingUserId === user.id || isCurrentAccount(user)"
                  :aria-label="`${user.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản ${user.displayName}`"
                  @click="updateStatus(user)"
                >
                  {{ user.isActive === false ? 'Kích hoạt' : 'Vô hiệu hóa' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="admin-users__empty">Đang tải tài khoản…</div>
        <div v-else-if="filteredUsers.length === 0" class="admin-users__empty">
          Không tìm thấy tài khoản phù hợp với tìm kiếm hoặc bộ lọc.
        </div>
      </div>

      <footer v-if="totalPages > 1" class="admin-pagination">
        <button
          type="button"
          class="btn-page"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          « Trang trước
        </button>
        <span class="page-info">Trang <strong>{{ currentPage }}</strong> / {{ totalPages }} (Tổng {{ filteredUsers.length }} tài khoản)</span>
        <button
          type="button"
          class="btn-page"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Trang sau »
        </button>
      </footer>
    </section>

    <!-- Tab 2: Audit Logs -->
    <section v-if="activeAdminTab === 'audit'" class="admin-users">
      <header class="admin-users__header">
        <div>
          <span>Bảo mật &amp; minh bạch</span>
          <h2>Nhật Ký Thao Tác Quản Trị</h2>
          <p>Dòng thời gian ghi lại mọi hành động do Admin hoặc Staff thực hiện trên hệ thống.</p>
        </div>
      </header>

      <div class="audit-timeline">
        <article v-for="log in auditLogs" :key="log.id" class="audit-entry">
          <div class="audit-dot" :class="`audit-dot--${log.type}`" />
          <div class="audit-body">
            <div class="audit-header">
              <strong>{{ log.action }}</strong>
              <time>{{ formatLogDate(log.createdAt) }}</time>
            </div>
            <p>{{ log.target }}</p>
            <small>Thực hiện bởi <code>@{{ log.admin }}</code></small>
          </div>
        </article>
        <div v-if="auditLogs.length === 0" class="admin-users__empty">
          Chưa có nhật ký thao tác nào được ghi nhận.
        </div>
      </div>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, .08);
}
.btn-page {
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .1);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all .2s;
}
.btn-page:hover:not(:disabled) { background: rgba(255, 255, 255, .1); border-color: #ffc700; }
.btn-page:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { color: #94a3b8; font-size: 12px; font-weight: 600; }
.page-info strong { color: #f8fafc; }

.admin-section-heading span, .admin-users__header > div > span {
  color: #ffc700;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .16em;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(255, 199, 0, .3);
}

.admin-section-heading h2, .admin-users__header h2 {
  margin: 5px 0 0;
  color: #f8fafc;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -.03em;
}

.admin-message {
  margin: 16px 0 0;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}
.admin-message--success {
  border: 1px solid rgba(52, 211, 153, .3);
  background: rgba(52, 211, 153, .08);
  color: #6ee7b7;
  box-shadow: 0 0 20px rgba(52, 211, 153, .1);
}
.admin-message--error {
  border: 1px solid rgba(244, 63, 94, .3);
  background: rgba(244, 63, 94, .08);
  color: #fda4af;
  box-shadow: 0 0 20px rgba(244, 63, 94, .1);
}

.admin-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 32px 4px 16px;
}
.admin-section-heading p { margin: 0; color: #94a3b8; font-size: 13.5px; }

.admin-module-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.admin-module {
  --module-color: 255, 199, 0;
  --module-color-rgb: 255, 199, 0;
  display: flex;
  min-height: 195px;
  flex-direction: column;
  border: 1px solid rgba(var(--module-color-rgb), .2);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(var(--module-color-rgb), .06), rgba(10, 16, 26, .96) 65%);
  padding: 20px;
  transition: all .22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, .3);
}

.admin-module--blue { --module-color: #38bdf8; --module-color-rgb: 56, 189, 248; }
.admin-module--violet { --module-color: #c084fc; --module-color-rgb: 192, 132, 252; }
.admin-module--green { --module-color: #34d399; --module-color-rgb: 52, 211, 153; }
.admin-module--rose { --module-color: #fb7185; --module-color-rgb: 251, 113, 133; }

.admin-module:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--module-color-rgb), .5);
  box-shadow: 0 16px 40px rgba(0, 0, 0, .45), 0 0 25px rgba(var(--module-color-rgb), .15);
}

.admin-module > span {
  display: inline-block;
  width: max-content;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(var(--module-color-rgb), .12);
  border: 1px solid rgba(var(--module-color-rgb), .25);
  color: var(--module-color);
  font: 900 10px ui-monospace, SFMono-Regular, Consolas, monospace;
  letter-spacing: .12em;
}

.admin-module h3 { margin: 18px 0 0; color: #f8fafc; font-size: 18.5px; font-weight: 900; }
.admin-module p { margin: 6px 0 16px; color: #94a3b8; font-size: 12.5px; line-height: 1.55; }
.admin-module b {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, .08);
  padding-top: 12px;
  color: var(--module-color);
  font-size: 11.5px;
  font-weight: 900;
  letter-spacing: .04em;
}
.admin-module b i { font-style: normal; font-size: 14px; transition: transform .2s ease; }
.admin-module:hover b i { transform: translateX(4px); }

.admin-users {
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, .4);
}

.admin-users__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-filter-select {
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(15, 23, 42, .8);
  color: #f8fafc;
  font-size: 11.5px;
  font-weight: 800;
  outline: none;
  cursor: pointer;
}
.admin-filter-select:focus { border-color: #ffc700; }

.admin-user-search {
  display: flex;
  width: min(100%, 240px);
  height: 34px;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 8px;
  background: rgba(15, 23, 42, .6);
  padding: 0 10px;
  transition: all .2s ease;
}

.admin-user-search:focus-within {
  border-color: #ffc700;
  box-shadow: 0 0 12px rgba(255, 199, 0, .15);
}

.admin-user-search svg { width: 14px; height: 14px; flex: 0 0 14px; fill: none; stroke: #64748b; stroke-width: 2; }
.admin-user-search input { width: 100%; background: transparent; color: #f8fafc; font-size: 11.5px; outline: none; }
.admin-user-search input::placeholder { color: #64748b; }

.admin-table-wrap { overflow-x: auto; }
.admin-table-wrap table { width: 100%; min-width: 800px; border-collapse: collapse; text-align: left; }
.admin-table-wrap th { border-bottom: 1px solid rgba(255, 255, 255, .08); padding: 8px 14px; color: #94a3b8; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.admin-table-wrap td { border-bottom: 1px solid rgba(255, 255, 255, .05); padding: 8px 14px; color: #cbd5e1; font-size: 12px; }
.admin-table-wrap tbody tr { transition: background .15s ease; }
.admin-table-wrap tbody tr:hover { background: rgba(255, 199, 0, .03); }

.admin-user-cell { display: flex; align-items: center; gap: 8px; }
.admin-user-cell > span { display: grid; width: 26px; height: 26px; place-items: center; border-radius: 6px; background: linear-gradient(135deg, rgba(255, 199, 0, .2), rgba(255, 199, 0, .05)); border: 1px solid rgba(255, 199, 0, .3); color: #ffc700; font-size: 11px; font-weight: 950; }
.admin-user-cell strong { color: #f8fafc; font-size: 12px; font-weight: 800; }
.admin-table-wrap code { color: #38bdf8; font: 11px 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace; background: rgba(56, 189, 248, .08); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, .2); }
.admin-balance { color: #ffc700; font-size: 12px; font-weight: 900; }
.admin-table-wrap select { cursor: pointer; min-width: 84px; height: 28px; border: 1px solid rgba(255, 255, 255, .14); border-radius: 6px; background: #0f172a; padding: 0 8px; color: #f8fafc; font-size: 11px; font-weight: 800; outline: none; transition: border-color .2s ease; }
.admin-table-wrap select:focus { border-color: #ffc700; box-shadow: 0 0 10px rgba(255, 199, 0, .2); }
.admin-table-wrap select:disabled { cursor: not-allowed; opacity: .45; }

.admin-account-status { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; color: #34d399; font-size: 10.5px; font-weight: 850; padding: 2px 8px; border-radius: 999px; background: rgba(52, 211, 153, .08); border: 1px solid rgba(52, 211, 153, .2); }
.admin-account-status::before { width: 5px; height: 5px; border-radius: 50%; background: currentColor; content: ''; box-shadow: 0 0 6px currentColor; }
.admin-account-status--inactive { color: #fb7185; background: rgba(244, 63, 94, .08); border-color: rgba(244, 63, 94, .2); }
.admin-account-self { display: block; margin-top: 2px; color: #64748b; font-size: 9px; white-space: nowrap; font-weight: 700; }

.admin-account-action { cursor: pointer; min-width: 76px; height: 28px; border: 1px solid rgba(244, 63, 94, .3); border-radius: 6px; background: rgba(244, 63, 94, .08); padding: 0 10px; color: #fb7185; font-size: 10.5px; font-weight: 850; white-space: nowrap; transition: all .2s ease; }
.admin-account-action:hover:not(:disabled) { border-color: rgba(244, 63, 94, .6); background: rgba(244, 63, 94, .18); color: #fda4af; box-shadow: 0 0 10px rgba(244, 63, 94, .2); }
.admin-account-action--activate { border-color: rgba(52, 211, 153, .3); background: rgba(52, 211, 153, .08); color: #34d399; }
.admin-account-action--activate:hover:not(:disabled) { border-color: rgba(52, 211, 153, .6); background: rgba(52, 211, 153, .18); color: #6ee7b7; box-shadow: 0 0 10px rgba(52, 211, 153, .2); }
.admin-account-action:disabled { cursor: not-allowed; opacity: .4; }
.admin-users__empty { display: grid; min-height: 100px; place-items: center; padding: 16px; color: #94a3b8; font-size: 12px; font-weight: 700; }

@media (max-width: 1280px) {
  .admin-module-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 800px) {
  .admin-module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 650px) {
  .admin-module-grid { grid-template-columns: 1fr; }
  .admin-module { min-height: 160px; }
  .admin-section-heading p { display: none; }
  .admin-users__header { flex-direction: column; align-items: flex-start; }
  .admin-user-search { width: 100%; }
}

/* Admin Sub-Tab Navigation */
.admin-subnav {
  display: flex;
  gap: 8px;
  padding: 0 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  margin-bottom: 20px;
}
.btn-admintab {
  padding: 10px 22px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .5);
  font-weight: 600;
  font-size: .875rem;
  cursor: pointer;
  transition: all .25s;
  letter-spacing: .02em;
}
.btn-admintab:hover { background: rgba(255, 255, 255, .08); color: rgba(255, 255, 255, .8); }
.btn-admintab--active {
  background: linear-gradient(135deg, rgba(255, 170, 51, .15), rgba(255, 100, 30, .1));
  border-color: rgba(255, 170, 51, .4);
  color: #ffaa33;
  box-shadow: 0 0 20px rgba(255, 170, 51, .1);
}

/* Audit Timeline */
.audit-timeline {
  position: relative;
  padding: 8px 0 16px 28px;
}
.audit-timeline::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, rgba(255, 170, 51, .3), rgba(255, 255, 255, .04));
  border-radius: 2px;
}
.audit-entry {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 14px 0;
  animation: audit-fade-in .4s ease both;
}
.audit-entry + .audit-entry { border-top: 1px solid rgba(255, 255, 255, .04); }
@keyframes audit-fade-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: none; }
}
.audit-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, .2);
  border: 2px solid rgba(255, 255, 255, .1);
  position: relative;
  left: -28px;
  margin-right: -12px;
  z-index: 1;
}
.audit-dot--topup { background: #4fc3f7; border-color: rgba(79, 195, 247, .3); box-shadow: 0 0 10px rgba(79, 195, 247, .25); }
.audit-dot--role { background: #ffaa33; border-color: rgba(255, 170, 51, .3); box-shadow: 0 0 10px rgba(255, 170, 51, .25); }
.audit-dot--status { background: #ef5350; border-color: rgba(239, 83, 80, .3); box-shadow: 0 0 10px rgba(239, 83, 80, .25); }
.audit-dot--character { background: #ab47bc; border-color: rgba(171, 71, 188, .3); box-shadow: 0 0 10px rgba(171, 71, 188, .25); }
.audit-body { flex: 1; min-width: 0; }
.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.audit-header strong { color: rgba(255, 255, 255, .92); font-size: .9rem; }
.audit-header time {
  font-size: .75rem;
  color: rgba(255, 255, 255, .35);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.audit-body p {
  margin: 0 0 2px;
  color: rgba(255, 255, 255, .55);
  font-size: .85rem;
}
.audit-body small {
  font-size: .75rem;
  color: rgba(255, 255, 255, .3);
}
.audit-body small code {
  color: rgba(255, 170, 51, .65);
  background: rgba(255, 170, 51, .08);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: .72rem;
}
</style>
