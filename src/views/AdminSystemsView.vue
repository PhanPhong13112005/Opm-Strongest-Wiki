<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import RolePortalShell from '../components/RolePortalShell.vue'
import { adminPortalNavigation } from '../data/portalNavigation'
import { authState, clearSession } from '../services/authApi'

const router = useRouter()
const activeSystem = ref('core') // 'core' | 'mastery' | 'tactics' | 'medals' | 'gear' | 'talents'
const search = ref('')
const notice = ref('')
const error = ref('')

const gameSystems = [
  { id: 'core', name: 'Tinh luyện & Lab Lõi', code: 'CORE', icon: '🧬', count: 18, desc: 'Dữ liệu cấp độ Lõi nhân vật, Phòng thí nghiệm Lõi và ma trận buff chỉ số Lõi.' },
  { id: 'mastery', name: 'Tinh thông (Mastery)', code: 'MASTERY', icon: '🔮', count: 32, desc: 'Cấp bậc Tinh thông, sách kỹ năng Tinh thông và các hiệu ứng bonus thuộc tính.' },
  { id: 'tactics', name: 'Chiến thuật (Tactics)', code: 'TACTICS', icon: '⚔️', count: 24, desc: 'Sơ đồ Ma trận Chiến thuật, sách Chiến thuật cao cấp và chỉ số gia tăng đội hình.' },
  { id: 'medals', name: 'Huy chương & Mirage Trial', code: 'MEDALS', icon: '🏅', count: 15, desc: 'Huy chương nhân vật, danh sách ải thử thách Mirage Trial và phần thưởng mốc.' },
  { id: 'gear', name: 'Trang bị, Kỷ vật & Ấn chương', code: 'GEAR', icon: '🛡️', count: 48, desc: 'Bộ trang bị (Equipment), Trang bị Buff, Kỷ vật (Keepsakes) và Ấn chương (Insignias).' },
  { id: 'talents', name: 'Thiên phú & Cố vấn (Talents)', code: 'TALENT', icon: '🌟', count: 20, desc: 'Cây Thiên phú nhân vật, hiệu ứng mở khóa Talent và Cố vấn trận đấu.' },
]

const systemData = {
  core: [
    { id: 'core-rover-ur', name: 'Lõi Rover UR+', type: 'Toàn năng', maxLevel: 10, bonus: '+25% HP toàn đội, Phản thương 18%', char: 'Rover UR+' },
    { id: 'core-g5-ur', name: 'Lõi G5 UR+', type: 'Tấn công', maxLevel: 10, bonus: '+20% Công, Xuyên giáp 15%', char: 'G5 UR+' },
    { id: 'core-nyan-ur', name: 'Lõi Nyan UR+', type: 'Tốc độ', maxLevel: 10, bonus: '+30 Tốc độ, Thiêu đốt diện rộng', char: 'Nyan UR+' },
  ],
  mastery: [
    { id: 'mastery-grapplers', name: 'Tinh thông Đấu Sĩ (Grappler)', maxLevel: 30, perk: 'Tăng 15% HP & 10% Kháng khống chế', activeUsers: 'Phổ biến' },
    { id: 'mastery-hi-tech', name: 'Tinh thông Công Nghệ (Hi-Tech)', maxLevel: 30, perk: 'Tăng 18% Sát thương Tuyệt kỹ', activeUsers: 'Rất cao' },
  ],
  tactics: [
    { id: 'tactic-blitz', name: 'Chiến thuật Đột Kích Tiền Tuyến', tier: 'Cao cấp', level: 5, buff: 'Cộng 120 Tốc độ lượt đầu cho 2 nhân vật hàng trước' },
    { id: 'tactic-shield', name: 'Chiến thuật Kiên Cố Phòng Thủ', tier: 'Trung cấp', level: 5, buff: 'Tạo lá chắn bằng 35% HP tối đa' },
  ],
  medals: [
    { id: 'medal-mirage-1', name: 'Huy chương Mirage Champion', source: 'Mirage Trial Ải 100', stats: 'Tăng 8% Kháng chí mạng' },
    { id: 'medal-hero-s', name: 'Huy chương Anh Hùng Cấp S', source: 'Đua top Bảng xếp hạng', stats: '+1000 Công, +5000 HP' },
  ],
  gear: [
    { id: 'gear-knight', name: 'Bộ Trang bị Hiệp Sĩ (Knight)', setBonus: '2 món: +10% Công | 4 món: Phản lại 30% sát thương nhận vào' },
    { id: 'gear-primal', name: 'Bộ Trang bị Nguyên Thủy (Primal)', setBonus: '2 món: +10% HP | 4 món: Gây thêm sát thương chuẩn khi đánh bạo kích' },
  ],
  talents: [
    { id: 'talent-page-1', name: 'Tầng Thiên Phú 1 - Khởi Đầu', maxPoint: 10, effect: 'Cộng chỉ số cơ bản Công/Thủ/HP' },
    { id: 'talent-page-2', name: 'Tầng Thiên Phú 2 - Chuyên Sâu', maxPoint: 15, effect: 'Mở khóa nội tại tăng sát thương theo phần trăm' },
  ],
}

const currentItems = computed(() => {
  const items = systemData[activeSystem.value] || []
  const kw = search.value.trim().toLowerCase()
  if (!kw) return items
  return items.filter(item =>
    String(item.name || '').toLowerCase().includes(kw) ||
    String(item.id || '').toLowerCase().includes(kw)
  )
})

const logout = async () => {
  clearSession()
  await router.replace('/')
}
</script>

<template>
  <RolePortalShell
    role="admin"
    role-label="Khu vực quản trị viên"
    title="Quản lý Tính năng & Hệ thống Game"
    description="Tra cứu và quản lý toàn bộ dữ liệu Catalog tính năng: Lõi (Core), Tinh thông, Chiến thuật, Huy chương, Trang bị và Thiên phú."
    :display-name="authState.session?.displayName"
    :username="authState.session?.username"
    :navigation="adminPortalNavigation"
    @logout="logout"
  >
    <p v-if="notice" class="admin-message admin-message--success" role="status">{{ notice }}</p>
    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>

    <!-- System Selector Grid -->
    <div class="system-grid">
      <article
        v-for="sys in gameSystems"
        :key="sys.id"
        class="system-card"
        :class="{ 'system-card--active': activeSystem === sys.id }"
        @click="activeSystem = sys.id"
      >
        <div class="card-icon">{{ sys.icon }}</div>
        <div class="card-body">
          <span class="card-code">{{ sys.code }}</span>
          <h3>{{ sys.name }}</h3>
          <p>{{ sys.desc }}</p>
        </div>
      </article>
    </div>

    <!-- Data Catalog Table -->
    <section class="sys-panel">
      <header class="sys-panel__header">
        <div>
          <span>Dữ liệu Catalog</span>
          <h2>{{ gameSystems.find(s => s.id === activeSystem)?.name }}</h2>
        </div>
        <label class="sys-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /></svg>
          <input v-model="search" type="search" placeholder="Tìm kiếm trong catalog…" />
        </label>
      </header>

      <div class="sys-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã ID</th>
              <th>Tên tính năng / Vật phẩm</th>
              <th>Thông số / Hiệu ứng Buff</th>
              <th>Giới hạn / Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentItems" :key="item.id">
              <td><code>{{ item.id }}</code></td>
              <td><strong>{{ item.name }}</strong></td>
              <td>
                <span class="buff-badge">
                  {{ item.bonus || item.perk || item.buff || item.stats || item.setBonus || item.effect }}
                </span>
              </td>
              <td>
                <span class="status-tag">Cấp tối đa: {{ item.maxLevel || item.level || item.maxPoint || 'Chuẩn' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="currentItems.length === 0" class="sys-empty">
          Không tìm thấy dữ liệu phù hợp trong catalog này.
        </div>
      </div>
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

.system-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}
.system-card {
  cursor: pointer;
  display: flex;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
  padding: 20px;
  transition: all .25 ease;
}
.system-card:hover { border-color: rgba(255, 199, 0, .4); transform: translateY(-2px); }
.system-card--active { border-color: #ffc700; background: linear-gradient(145deg, rgba(255, 199, 0, .1), rgba(12, 19, 32, .98)); box-shadow: 0 0 20px rgba(255, 199, 0, .2); }

.card-icon { font-size: 32px; display: grid; place-items: center; }
.card-body { min-width: 0; }
.card-code { color: #ffc700; font-size: 10px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.card-body h3 { margin: 4px 0 6px; color: #f8fafc; font-size: 16px; font-weight: 900; }
.card-body p { margin: 0; color: #8194a6; font-size: 12px; line-height: 1.45; }

.sys-panel {
  margin-top: 24px;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 22px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
  overflow: hidden;
}
.sys-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  background: rgba(15, 23, 42, .3);
}
.sys-panel__header span { color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.sys-panel__header h2 { margin: 4px 0 0; color: #f8fafc; font-size: 22px; font-weight: 950; }

.sys-search {
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
.sys-search svg { width: 16px; height: 16px; fill: none; stroke: #64748b; stroke-width: 2; }
.sys-search input { width: 100%; background: transparent; color: #f8fafc; font-size: 13px; outline: none; }

.sys-table-wrap { overflow-x: auto; }
.sys-table-wrap table { width: 100%; min-width: 800px; border-collapse: collapse; text-align: left; }
.sys-table-wrap th { border-bottom: 1px solid rgba(255, 255, 255, .08); padding: 14px 22px; color: #94a3b8; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.sys-table-wrap td { border-bottom: 1px solid rgba(255, 255, 255, .05); padding: 14px 22px; color: #cbd5e1; font-size: 13px; }

.buff-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; background: rgba(56, 189, 248, .1); color: #38bdf8; font-weight: 800; font-size: 12.5px; border: 1px solid rgba(56, 189, 248, .2); }
.status-tag { display: inline-block; padding: 4px 10px; border-radius: 6px; background: rgba(255, 199, 0, .1); color: #ffc700; font-size: 11.5px; font-weight: 850; }
.sys-empty { display: grid; min-height: 140px; place-items: center; padding: 24px; color: #94a3b8; font-size: 13.5px; font-weight: 700; }

@media (max-width: 900px) {
  .system-grid { grid-template-columns: 1fr; }
  .sys-panel__header { flex-direction: column; align-items: flex-start; }
  .sys-search { width: 100%; }
}
</style>
