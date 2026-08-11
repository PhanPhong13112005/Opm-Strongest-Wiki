<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { adminPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'
import { getAdminTierRankingStats, updateAdminBaseVotes } from '../services/adminApi'

const router = useRouter()
const stats = ref(null)
const loading = ref(true)
const search = ref('')
const selectedTier = ref('ALL')
const editingCharacter = ref(null)
const saving = ref(false)
const notice = ref('')
const error = ref('')

const currentMonth = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

const tiers = ['ALL', 'SS+', 'SS', 'S', 'A', 'B', 'C', 'D']

const characters = computed(() => stats.value?.characters || [])

const filteredCharacters = computed(() => {
  let result = characters.value
  if (selectedTier.value !== 'ALL') {
    result = result.filter(c => c.tier === selectedTier.value)
  }
  const kw = search.value.trim().toLowerCase()
  if (kw) {
    result = result.filter(c =>
      String(c.nameVi || '').toLowerCase().includes(kw) ||
      String(c.nameEn || '').toLowerCase().includes(kw) ||
      String(c.id || '').toLowerCase().includes(kw)
    )
  }
  return result
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    stats.value = await getAdminTierRankingStats()
  } catch (err) {
    error.value = err.message || 'Không thể tải dữ liệu Tier Ranking.'
  } finally {
    loading.value = false
  }
}

const openEditModal = (char) => {
  editingCharacter.value = { ...char, baseVotes: char.baseVotes || 0 }
}

const closeEditModal = () => {
  editingCharacter.value = null
}

const saveBaseVotes = async () => {
  if (!editingCharacter.value) return
  saving.value = true
  notice.value = ''
  error.value = ''
  try {
    await updateAdminBaseVotes(editingCharacter.value.id, Number(editingCharacter.value.baseVotes) || 0)
    notice.value = `Đã cập nhật Vote cơ bản cho ${editingCharacter.value.nameVi || editingCharacter.value.nameEn}.`
    closeEditModal()
    await load()
  } catch (err) {
    error.value = err.message || 'Lỗi cập nhật vote.'
  } finally {
    saving.value = false
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
    title="Quản lý Tier Ranking & Bình chọn"
    description="Theo dõi bình chọn xếp hạng nhân vật hằng tháng từ cộng đồng và điều chỉnh Vote cơ bản."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="adminPortalNavigation"
    @logout="logout"
  >
    <p v-if="notice" class="admin-message admin-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>

    <!-- Top KPI Grid -->
    <div class="tier-kpi-grid">
      <article class="tier-kpi-card">
        <span>Kỳ bình chọn hiện tại</span>
        <strong>Tháng {{ currentMonth }}</strong>
        <small>Mở bình chọn tự động hàng tháng</small>
      </article>
      <article class="tier-kpi-card">
        <span>Tổng lượt Vote tháng</span>
        <strong>{{ loading ? '—' : Number(stats?.totalVotes || 0).toLocaleString('vi-VN') }}</strong>
        <small>Bình chọn từ tài khoản thành viên</small>
      </article>
      <article class="tier-kpi-card">
        <span>Nhân vật được Vote</span>
        <strong>{{ loading ? '—' : (stats?.votedCount || characters.length) }}</strong>
        <small>Nhân vật có tương tác vote</small>
      </article>
    </div>

    <!-- Filter & Search Toolbar -->
    <section class="tier-panel">
      <header class="tier-panel__header">
        <div>
          <span>Danh sách xếp hạng</span>
          <h2>Thống kê & Vote cơ bản</h2>
        </div>
        <div class="tier-controls">
          <select v-model="selectedTier" class="tier-select" aria-label="Lọc theo Tier">
            <option v-for="t in tiers" :key="t" :value="t">
              {{ t === 'ALL' ? 'Tất cả Tier' : `Tier ${t}` }}
            </option>
          </select>

          <label class="tier-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>
            <input v-model="search" type="search" placeholder="Tìm nhân vật…" />
          </label>
        </div>
      </header>

      <div class="tier-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nhân vật</th>
              <th>Tier</th>
              <th>Vote cơ bản (Base)</th>
              <th>Vote cộng đồng</th>
              <th>Tổng Vote</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="char in filteredCharacters" :key="char.id">
              <td>
                <div class="char-cell">
                  <img :src="char.imageUrl || '/placeholder.png'" :alt="char.nameVi" class="char-avatar" />
                  <div>
                    <strong>{{ char.nameVi }}</strong>
                    <small>{{ char.nameEn }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="tier-badge" :class="`tier-badge--${char.tier?.toLowerCase().replace('+', '-plus')}`">
                  {{ char.tier }}
                </span>
              </td>
              <td><code>{{ char.baseVotes || 0 }}</code></td>
              <td><b class="vote-count">{{ Number(char.communityVotes || 0).toLocaleString('vi-VN') }}</b></td>
              <td><strong class="vote-total">{{ Number((char.baseVotes || 0) + (char.communityVotes || 0)).toLocaleString('vi-VN') }}</strong></td>
              <td>
                <button type="button" class="btn-action" @click="openEditModal(char)">
                  Sửa Vote cơ bản
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="loading" class="tier-empty">Đang tải dữ liệu Tier Ranking…</div>
        <div v-else-if="filteredCharacters.length === 0" class="tier-empty">
          Không tìm thấy nhân vật nào phù hợp.
        </div>
      </div>
    </section>

    <!-- Modal Edit Base Votes -->
    <div v-if="editingCharacter" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-card">
        <h3>Điều chỉnh Vote Cơ Bản</h3>
        <p>Nhân vật: <strong>{{ editingCharacter.nameVi }}</strong> ({{ editingCharacter.nameEn }})</p>

        <label class="modal-label">
          <span>Số Vote cơ bản bổ sung:</span>
          <input v-model.number="editingCharacter.baseVotes" type="number" min="0" max="999999" class="modal-input" />
        </label>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="closeEditModal">Hủy</button>
          <button type="button" class="btn-save" :disabled="saving" @click="saveBaseVotes">
            {{ saving ? 'Đang lưu…' : 'Lưu thay đổi' }}
          </button>
        </div>
      </div>
    </div>
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

.tier-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.tier-kpi-card {
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
  padding: 22px;
}
.tier-kpi-card span { display: block; color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.tier-kpi-card strong { display: block; margin-top: 8px; color: #f8fafc; font-size: 28px; font-weight: 950; }
.tier-kpi-card small { display: block; margin-top: 6px; color: #64748b; font-size: 12px; }

.tier-panel {
  margin-top: 24px;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
  overflow: hidden;
}
.tier-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  background: rgba(15, 23, 42, .3);
}
.tier-panel__header span { color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.tier-panel__header h2 { margin: 4px 0 0; color: #f8fafc; font-size: 22px; font-weight: 950; }

.tier-controls { display: flex; align-items: center; gap: 12px; }
.tier-select {
  height: 42px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 12px;
  background: #0f172a;
  padding: 0 14px;
  color: #f8fafc;
  font-size: 13px;
  font-weight: 800;
  outline: none;
}
.tier-search {
  display: flex;
  width: 240px;
  height: 42px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 12px;
  background: rgba(15, 23, 42, .6);
  padding: 0 14px;
}
.tier-search svg { width: 16px; height: 16px; fill: none; stroke: #64748b; stroke-width: 2; }
.tier-search input { width: 100%; background: transparent; color: #f8fafc; font-size: 13px; outline: none; }

.tier-table-wrap { overflow-x: auto; }
.tier-table-wrap table { width: 100%; min-width: 800px; border-collapse: collapse; text-align: left; }
.tier-table-wrap th { border-bottom: 1px solid rgba(255, 255, 255, .08); padding: 14px 22px; color: #94a3b8; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.tier-table-wrap td { border-bottom: 1px solid rgba(255, 255, 255, .05); padding: 14px 22px; color: #cbd5e1; font-size: 13px; }

.char-cell { display: flex; align-items: center; gap: 12px; }
.char-avatar { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(255, 255, 255, .1); }
.char-cell strong { display: block; color: #f8fafc; font-size: 13.5px; font-weight: 800; }
.char-cell small { color: #64748b; font-size: 11px; }

.tier-badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 12px; }
.tier-badge--ss-plus { background: rgba(239, 68, 68, .2); color: #f87171; border: 1px solid rgba(239, 68, 68, .4); }
.tier-badge--ss { background: rgba(245, 158, 11, .2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, .4); }
.tier-badge--s { background: rgba(168, 85, 247, .2); color: #c084fc; border: 1px solid rgba(168, 85, 247, .4); }
.tier-badge--a { background: rgba(59, 130, 246, .2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, .4); }
.tier-badge--b { background: rgba(34, 197, 94, .2); color: #4ade80; border: 1px solid rgba(34, 197, 94, .4); }

.vote-count { color: #38bdf8; font-weight: 900; }
.vote-total { color: #ffc700; font-weight: 950; font-size: 14px; }
.btn-action { cursor: pointer; padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255, 199, 0, .3); background: rgba(255, 199, 0, .08); color: #ffc700; font-size: 12px; font-weight: 850; transition: all .2s ease; }
.btn-action:hover { background: rgba(255, 199, 0, .2); border-color: rgba(255, 199, 0, .6); }
.tier-empty { display: grid; min-height: 140px; place-items: center; padding: 24px; color: #94a3b8; font-size: 13.5px; font-weight: 700; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; z-index: 99; display: grid; place-items: center; background: rgba(0, 0, 0, .75); backdrop-filter: blur(8px); }
.modal-card { width: min(90%, 440px); border: 1px solid rgba(255, 255, 255, .15); border-radius: 20px; background: #0f172a; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
.modal-card h3 { margin: 0 0 8px; color: #f8fafc; font-size: 20px; font-weight: 950; }
.modal-card p { margin: 0 0 20px; color: #94a3b8; font-size: 13.5px; }
.modal-label { display: grid; gap: 8px; }
.modal-label span { color: #cbd5e1; font-size: 13px; font-weight: 800; }
.modal-input { height: 42px; border: 1px solid rgba(255, 255, 255, .14); border-radius: 10px; background: #020617; padding: 0 14px; color: #ffc700; font-size: 16px; font-weight: 900; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-cancel { cursor: pointer; height: 38px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, .14); background: transparent; padding: 0 16px; color: #94a3b8; font-size: 13px; font-weight: 800; }
.btn-save { cursor: pointer; height: 38px; border-radius: 10px; border: none; background: #ffc700; padding: 0 18px; color: #020617; font-size: 13px; font-weight: 950; }

@media (max-width: 768px) {
  .tier-kpi-grid { grid-template-columns: 1fr; }
  .tier-panel__header { flex-direction: column; align-items: flex-start; }
  .tier-controls { width: 100%; flex-direction: column; }
  .tier-search { width: 100%; }
}
</style>
