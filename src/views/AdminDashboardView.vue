<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { authState, clearSession } from '../services/authApi'
import { getAdminDashboard, getAdminUsers, updateAdminUserRole } from '../services/adminApi'

const router = useRouter()
const stats = ref(null)
const users = ref([])
const error = ref('')
const notice = ref('')
const loading = ref(true)
const updatingUserId = ref(null)
const userSearch = ref('')

const navigation = [
  { to: '/admin/dashboard', index: '01', label: 'Tổng quan', hint: 'Sức khỏe hệ thống', match: '/admin/dashboard' },
  { to: '/admin/characters', index: '02', label: 'Nhân vật', hint: 'Nhân vật và Kỷ vật', match: '/admin/characters' },
  { to: '/admin/events', index: '03', label: 'Sự kiện', hint: 'Nội dung sự kiện', match: '/admin/events' },
  { to: '/admin/releases', index: '04', label: 'Lịch ra mắt', hint: 'Banner CN và SEA', match: '/admin/releases' },
  { to: '/staff', index: '05', label: 'Khu nhân viên', hint: 'Kiểm duyệt cộng đồng' },
]

const labels = {
  users: 'Tài khoản người dùng',
  staff: 'Nhân viên',
  admins: 'Quản trị viên',
  eventComments: 'Bình luận sự kiện',
  forumTopics: 'Chủ đề diễn đàn',
  forumPosts: 'Phản hồi diễn đàn',
  pendingTopUps: 'Nạp thẻ chờ duyệt',
  characters: 'Nhân vật',
  events: 'Sự kiện',
  releaseEntries: 'Mốc ra mắt',
}

const mainStatKeys = ['users', 'characters', 'events', 'pendingTopUps']
const primaryStats = computed(() => mainStatKeys.map((key, index) => ({
  key,
  label: labels[key],
  value: stats.value?.[key] ?? 0,
  tone: ['blue', 'gold', 'violet', 'rose'][index],
})))

const secondaryStats = computed(() => Object.entries(stats.value || {})
  .filter(([key]) => !mainStatKeys.includes(key))
  .map(([key, value]) => ({ key, value, label: labels[key] || key })))

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
  { to: '/staff', code: 'SAFE-04', title: 'Kiểm duyệt', description: 'Duyệt nạp thẻ, bình luận và nội dung diễn đàn.', color: 'green' },
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
    :navigation="navigation"
    @logout="logout"
  >
    <section class="admin-overview">
      <div class="admin-overview__heading">
        <div>
          <span>Dữ liệu trực tiếp</span>
          <h2>Tình hình hiện tại</h2>
        </div>
        <p><i /> Hệ thống đang hoạt động</p>
      </div>

      <div class="admin-stat-grid">
        <article v-for="item in primaryStats" :key="item.key" class="admin-stat" :class="`admin-stat--${item.tone}`">
          <span>{{ item.label }}</span>
          <strong>{{ loading ? '—' : Number(item.value).toLocaleString('vi-VN') }}</strong>
          <small>Đang ghi nhận</small>
        </article>
      </div>

      <div v-if="secondaryStats.length" class="admin-secondary-stats">
        <div v-for="item in secondaryStats" :key="item.key">
          <span>{{ item.label }}</span>
          <strong>{{ Number(item.value).toLocaleString('vi-VN') }}</strong>
        </div>
      </div>
    </section>

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
          <p>Thay đổi vai trò để cấp đúng quyền cho từng tài khoản.</p>
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
              <th>Vai trò</th>
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
                <select v-model="user.role" :disabled="updatingUserId === user.id" :aria-label="`Vai trò của ${user.displayName}`" @change="updateRole(user)">
                  <option>User</option>
                  <option>Staff</option>
                  <option>Admin</option>
                </select>
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
.admin-overview { overflow: hidden; border: 1px solid rgba(120, 152, 181, .16); border-radius: 18px; background: rgba(8, 14, 23, .92); }
.admin-overview__heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid rgba(120, 152, 181, .11); padding: 20px 22px; }
.admin-overview__heading span, .admin-section-heading span, .admin-users__header > div > span { color: #ffb84d; font-size: 9px; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
.admin-overview__heading h2, .admin-section-heading h2, .admin-users__header h2 { margin: 4px 0 0; color: #f0f6fb; font-size: 20px; font-weight: 920; }
.admin-overview__heading > p { display: flex; align-items: center; gap: 7px; margin: 0; color: #6f8496; font-size: 10px; font-weight: 750; }
.admin-overview__heading > p i { width: 7px; height: 7px; border-radius: 50%; background: #55e0b5; box-shadow: 0 0 12px rgba(85, 224, 181, .7); }

.admin-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: rgba(120, 152, 181, .09); }
.admin-stat { --stat-color: 85, 216, 255; min-height: 145px; background: #080f18; padding: 22px; }
.admin-stat--gold { --stat-color: 255, 184, 77; }
.admin-stat--violet { --stat-color: 178, 129, 255; }
.admin-stat--rose { --stat-color: 255, 105, 124; }
.admin-stat > span { display: block; min-height: 28px; color: #718597; font-size: 10px; font-weight: 800; line-height: 1.4; text-transform: uppercase; letter-spacing: .06em; }
.admin-stat > strong { display: block; margin-top: 8px; color: rgb(var(--stat-color)); font-size: 34px; font-weight: 950; line-height: 1; }
.admin-stat > small { display: block; margin-top: 10px; color: #4f6375; font-size: 9px; }
.admin-secondary-stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); border-top: 1px solid rgba(120, 152, 181, .1); }
.admin-secondary-stats > div { display: flex; min-height: 54px; align-items: center; justify-content: space-between; gap: 8px; border-right: 1px solid rgba(120, 152, 181, .08); padding: 10px 13px; }
.admin-secondary-stats > div:last-child { border-right: 0; }
.admin-secondary-stats span { color: #607487; font-size: 8px; font-weight: 800; line-height: 1.35; text-transform: uppercase; }
.admin-secondary-stats strong { color: #ccd7e0; font-size: 14px; font-weight: 900; }

.admin-message { margin: 14px 0 0; border-radius: 11px; padding: 12px 14px; font-size: 12px; font-weight: 700; }
.admin-message--success { border: 1px solid rgba(85, 224, 181, .22); background: rgba(85, 224, 181, .07); color: #83e9c9; }
.admin-message--error { border: 1px solid rgba(255, 103, 103, .22); background: rgba(255, 103, 103, .07); color: #ff9b9b; }

.admin-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 27px 2px 12px; }
.admin-section-heading p { margin: 0; color: #607487; font-size: 10px; }
.admin-module-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; }
.admin-module { --module-color: 255, 184, 77; display: flex; min-height: 188px; flex-direction: column; border: 1px solid rgba(var(--module-color), .17); border-radius: 15px; background: linear-gradient(145deg, rgba(var(--module-color), .055), rgba(8, 14, 23, .94) 58%); padding: 19px; transition: transform .18s ease, border-color .18s ease; }
.admin-module--blue { --module-color: 85, 216, 255; }
.admin-module--violet { --module-color: 178, 129, 255; }
.admin-module--green { --module-color: 85, 224, 181; }
.admin-module:hover { transform: translateY(-3px); border-color: rgba(var(--module-color), .4); }
.admin-module > span { color: rgb(var(--module-color)); font: 800 8px ui-monospace, monospace; letter-spacing: .1em; }
.admin-module h3 { margin: 23px 0 0; color: #edf4fa; font-size: 17px; font-weight: 900; }
.admin-module p { margin: 7px 0 16px; color: #6d8194; font-size: 10px; line-height: 1.55; }
.admin-module b { display: flex; align-items: center; justify-content: space-between; margin-top: auto; border-top: 1px solid rgba(var(--module-color), .12); padding-top: 11px; color: rgb(var(--module-color)); font-size: 9px; font-weight: 900; }
.admin-module b i { font-style: normal; font-size: 14px; }

.admin-users { margin-top: 17px; overflow: hidden; border: 1px solid rgba(120, 152, 181, .16); border-radius: 17px; background: rgba(8, 14, 23, .92); }
.admin-users__header { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(120, 152, 181, .11); padding: 20px 22px; }
.admin-users__header p { margin: 5px 0 0; color: #65798c; font-size: 10px; }
.admin-user-search { display: flex; width: min(100%, 280px); height: 40px; align-items: center; gap: 9px; border: 1px solid rgba(120, 152, 181, .18); border-radius: 10px; background: rgba(2, 8, 14, .5); padding: 0 12px; }
.admin-user-search:focus-within { border-color: rgba(255, 184, 77, .45); box-shadow: 0 0 0 3px rgba(255, 184, 77, .06); }
.admin-user-search svg { width: 16px; flex: 0 0 16px; fill: none; stroke: #617587; stroke-width: 1.7; }
.admin-user-search input { width: 100%; background: transparent; color: #dfe8ef; font-size: 11px; outline: none; }
.admin-user-search input::placeholder { color: #576a7d; }
.admin-table-wrap { overflow-x: auto; }
.admin-table-wrap table { width: 100%; min-width: 760px; border-collapse: collapse; text-align: left; }
.admin-table-wrap th { border-bottom: 1px solid rgba(120, 152, 181, .1); padding: 12px 17px; color: #5d7184; font-size: 8px; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
.admin-table-wrap td { border-bottom: 1px solid rgba(120, 152, 181, .075); padding: 13px 17px; color: #788c9e; font-size: 10px; }
.admin-table-wrap tbody tr:hover { background: rgba(255, 184, 77, .025); }
.admin-user-cell { display: flex; align-items: center; gap: 10px; }
.admin-user-cell > span { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 9px; background: rgba(255, 184, 77, .09); color: #ffbd58; font-size: 10px; font-weight: 950; }
.admin-user-cell strong { color: #dce6ee; font-size: 11px; }
.admin-table-wrap code { color: #8ca0b1; font: 10px ui-monospace, monospace; }
.admin-balance { color: #ffc66b; font-size: 11px; }
.admin-table-wrap select { min-width: 92px; height: 34px; border: 1px solid rgba(120, 152, 181, .2); border-radius: 8px; background: #070d15; padding: 0 9px; color: #d9e3eb; font-size: 10px; font-weight: 800; outline: none; }
.admin-table-wrap select:focus { border-color: rgba(255, 184, 77, .5); }
.admin-table-wrap select:disabled { cursor: wait; opacity: .5; }
.admin-users__empty { display: grid; min-height: 120px; place-items: center; padding: 20px; color: #617587; font-size: 11px; }

@media (max-width: 1100px) {
  .admin-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .admin-secondary-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .admin-module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 650px) {
  .admin-overview__heading, .admin-users__header { align-items: flex-start; flex-direction: column; }
  .admin-overview__heading > p { display: none; }
  .admin-stat { min-height: 125px; padding: 17px; }
  .admin-stat > strong { font-size: 29px; }
  .admin-secondary-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .admin-module-grid { grid-template-columns: 1fr; }
  .admin-module { min-height: 165px; }
  .admin-section-heading p { display: none; }
  .admin-user-search { width: 100%; }
}
</style>
