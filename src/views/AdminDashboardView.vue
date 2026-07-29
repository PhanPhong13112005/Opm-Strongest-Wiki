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

const isCurrentAccount = user => String(user.id).toLowerCase() === String(authState.session?.userId || '').toLowerCase()

const filteredUsers = computed(() => {
  const keyword = userSearch.value.trim().toLocaleLowerCase('vi')
  if (!keyword) return users.value
  return users.value.filter(user => [user.username, user.displayName, user.role]
    .some(value => String(value || '').toLocaleLowerCase('vi').includes(keyword)))
})

const modules = [
  { to: '/admin/characters', code: 'DATA-01', title: 'Nhân vật & Kỷ vật', description: 'Thêm, sửa, xóa thông tin nhân vật và gắn Kỷ vật.', color: 'gold' },
  { to: '/admin/releases', code: 'PLAN-02', title: 'Lịch ra mắt', description: 'Quản lý mốc phát hành CN/SEA hiển thị trên trang chủ.', color: 'blue' },
  { to: '/admin/events', code: 'LIVE-03', title: 'Sự kiện', description: 'Cập nhật lịch, nội dung và phần thưởng của sự kiện.', color: 'violet' },
  { to: '/admin/top-ups', code: 'PAY-04', title: 'Đơn Coupon', description: 'Kiểm tra UID, server và xác nhận đơn Coupon đã được nạp.', color: 'rose' },
  { to: '/staff', code: 'SAFE-05', title: 'Kiểm duyệt', description: 'Theo dõi bình luận và xử lý nội dung diễn đàn.', color: 'green' },
]

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

    <div class="admin-section-heading">
      <div>
        <span>Công cụ quản trị</span>
        <h2>Quản lý nội dung</h2>
      </div>
      <p>Chọn khu vực cần chỉnh sửa</p>
    </div>

    <nav class="admin-module-grid" aria-label="Công cụ quản trị nội dung">
      <RouterLink v-for="module in modules" :key="module.to" :to="module.to" class="admin-module" :class="`admin-module--${module.color}`">
        <span>{{ module.code }}</span>
        <h3>{{ module.title }}</h3>
        <p>{{ module.description }}</p>
        <b>Quản lý <i>→</i></b>
      </RouterLink>
    </nav>

    <section class="admin-users">
      <header class="admin-users__header">
        <div>
          <span>Tài khoản & quyền truy cập</span>
          <h2>Quản lý người dùng</h2>
          <p>Thay đổi vai trò hoặc trạng thái để kiểm soát quyền truy cập của từng tài khoản.</p>
        </div>
        <label class="admin-user-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>
          <input v-model="userSearch" type="search" placeholder="Tìm tài khoản hoặc tên…" />
        </label>
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
            <tr v-for="user in filteredUsers" :key="user.id">
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
          {{ userSearch ? 'Không tìm thấy tài khoản phù hợp.' : 'Chưa có tài khoản cộng đồng.' }}
        </div>
      </div>
    </section>
  </RolePortalShell>
</template>

<style scoped>
.admin-section-heading span, .admin-users__header > div > span { color: #ffbf59; font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.admin-section-heading h2, .admin-users__header h2 { margin: 5px 0 0; color: #f2f7fb; font-size: 22px; font-weight: 920; }

.admin-message { margin: 14px 0 0; border-radius: 11px; padding: 12px 14px; font-size: 12px; font-weight: 700; }
.admin-message--success { border: 1px solid rgba(85, 224, 181, .22); background: rgba(85, 224, 181, .07); color: #83e9c9; }
.admin-message--error { border: 1px solid rgba(255, 103, 103, .22); background: rgba(255, 103, 103, .07); color: #ff9b9b; }

.admin-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 27px 2px 12px; }
.admin-section-heading p { margin: 0; color: #91a3b3; font-size: 13px; }
.admin-module-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; }
.admin-module { --module-color: 255, 184, 77; display: flex; min-height: 188px; flex-direction: column; border: 1px solid rgba(var(--module-color), .17); border-radius: 15px; background: linear-gradient(145deg, rgba(var(--module-color), .055), rgba(8, 14, 23, .94) 58%); padding: 19px; transition: transform .18s ease, border-color .18s ease; }
.admin-module--blue { --module-color: 85, 216, 255; }
.admin-module--violet { --module-color: 178, 129, 255; }
.admin-module--green { --module-color: 85, 224, 181; }
.admin-module:hover { transform: translateY(-3px); border-color: rgba(var(--module-color), .4); }
.admin-module > span { color: rgb(var(--module-color)); font: 800 10px ui-monospace, monospace; letter-spacing: .1em; }
.admin-module h3 { margin: 23px 0 0; color: #edf4fa; font-size: 19px; font-weight: 900; }
.admin-module p { margin: 7px 0 16px; color: #9aabba; font-size: 13px; line-height: 1.6; }
.admin-module b { display: flex; align-items: center; justify-content: space-between; margin-top: auto; border-top: 1px solid rgba(var(--module-color), .12); padding-top: 11px; color: rgb(var(--module-color)); font-size: 11px; font-weight: 900; }
.admin-module b i { font-style: normal; font-size: 14px; }

.admin-users { margin-top: 17px; overflow: hidden; border: 1px solid rgba(120, 152, 181, .16); border-radius: 17px; background: rgba(8, 14, 23, .92); }
.admin-users__header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(120, 152, 181, .11); padding: 20px 22px; }
.admin-users__header p { margin: 7px 0 0; color: #91a3b3; font-size: 13px; line-height: 1.5; }
.admin-user-search { display: flex; width: min(100%, 280px); height: 40px; align-items: center; gap: 9px; border: 1px solid rgba(120, 152, 181, .18); border-radius: 10px; background: rgba(2, 8, 14, .5); padding: 0 12px; }
.admin-user-search:focus-within { border-color: rgba(255, 184, 77, .45); box-shadow: 0 0 0 3px rgba(255, 184, 77, .06); }
.admin-user-search svg { width: 16px; flex: 0 0 16px; fill: none; stroke: #617587; stroke-width: 1.7; }
.admin-user-search input { width: 100%; background: transparent; color: #e7eef4; font-size: 13px; outline: none; }
.admin-user-search input::placeholder { color: #576a7d; }
.admin-table-wrap { overflow-x: auto; }
.admin-table-wrap table { width: 100%; min-width: 760px; border-collapse: collapse; text-align: left; }
.admin-table-wrap th { border-bottom: 1px solid rgba(120, 152, 181, .1); padding: 12px 17px; color: #91a3b3; font-size: 11px; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
.admin-table-wrap td { border-bottom: 1px solid rgba(120, 152, 181, .075); padding: 13px 17px; color: #a5b4c0; font-size: 12px; }
.admin-table-wrap tbody tr:hover { background: rgba(255, 184, 77, .025); }
.admin-user-cell { display: flex; align-items: center; gap: 10px; }
.admin-user-cell > span { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 9px; background: rgba(255, 184, 77, .09); color: #ffbd58; font-size: 10px; font-weight: 950; }
.admin-user-cell strong { color: #e5edf3; font-size: 13px; }
.admin-table-wrap code { color: #8ca0b1; font: 12px ui-monospace, monospace; }
.admin-balance { color: #ffc66b; font-size: 13px; }
.admin-table-wrap select { min-width: 92px; height: 34px; border: 1px solid rgba(120, 152, 181, .2); border-radius: 8px; background: #070d15; padding: 0 9px; color: #e3ebf1; font-size: 12px; font-weight: 800; outline: none; }
.admin-table-wrap select:focus { border-color: rgba(255, 184, 77, .5); }
.admin-table-wrap select:disabled { cursor: not-allowed; opacity: .5; }
.admin-account-status { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; color: #55e0b5; font-size: 11px; font-weight: 850; }
.admin-account-status::before { width: 6px; height: 6px; border-radius: 50%; background: currentColor; content: ''; box-shadow: 0 0 9px currentColor; }
.admin-account-status--inactive { color: #ff7f87; }
.admin-account-self { display: block; margin-top: 5px; color: #8194a5; font-size: 10px; white-space: nowrap; }
.admin-account-action { min-width: 84px; height: 34px; border: 1px solid rgba(255, 127, 135, .32); border-radius: 8px; background: rgba(255, 87, 98, .08); padding: 0 10px; color: #ffadb2; font-size: 11px; font-weight: 850; white-space: nowrap; }
.admin-account-action:hover:not(:disabled) { border-color: rgba(255, 127, 135, .58); background: rgba(255, 87, 98, .14); }
.admin-account-action--activate { border-color: rgba(85, 224, 181, .32); background: rgba(85, 224, 181, .08); color: #71e7c2; }
.admin-account-action:disabled { cursor: not-allowed; opacity: .45; }
.admin-users__empty { display: grid; min-height: 120px; place-items: center; padding: 20px; color: #91a3b3; font-size: 13px; }

@media (max-width: 1100px) {
  .admin-module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 650px) {
  .admin-module-grid { grid-template-columns: 1fr; }
  .admin-module { min-height: 165px; }
  .admin-section-heading p { display: none; }
  .admin-user-search { width: 100%; }
}
</style>
