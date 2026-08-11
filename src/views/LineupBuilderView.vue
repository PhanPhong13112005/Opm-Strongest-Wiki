<script setup>
import { computed, ref } from 'vue'
import charactersData from '../data/characters.json'

const frontRow = ref([null, null, null])
const backRow = ref([null, null, null])
const activeSlot = ref(null) // { row: 'front' | 'back', index: number }
const searchKw = ref('')
const selectedFaction = ref('ALL')

const factions = ['ALL', 'Anh Hùng', 'Quái Vật', 'Hiệp Hội Tội Phạm', 'Bất Định']

const allCharacters = charactersData.map(c => ({
  id: c.id,
  nameVi: c.name_vi,
  nameEn: c.name_en,
  factionVi: c.faction_vi,
  typeVi: c.type_vi,
  tier: c.tier,
  imageUrl: c.image_url,
  baseAtk: c.base_stats?.atk || 1000,
  baseHp: c.base_stats?.hp || 5000,
  baseDef: c.base_stats?.def || 500,
  baseSpd: c.base_stats?.spd || 100,
  isCore: String(c.name_vi || '').includes('Lõi') || String(c.id).includes('urplus') || String(c.id).includes('rover') || String(c.id).includes('g5'),
}))

const filteredCharacters = computed(() => {
  let list = allCharacters
  if (selectedFaction.value !== 'ALL') {
    list = list.filter(c => c.factionVi === selectedFaction.value)
  }
  const kw = searchKw.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(c => c.nameVi.toLowerCase().includes(kw) || c.nameEn.toLowerCase().includes(kw))
  }
  return list
})

const selectedTeam = computed(() => [
  ...frontRow.value.filter(Boolean),
  ...backRow.value.filter(Boolean),
])

const totalStats = computed(() => {
  return selectedTeam.value.reduce((acc, c) => ({
    atk: acc.atk + c.baseAtk,
    hp: acc.hp + c.baseHp,
    def: acc.def + c.baseDef,
    spd: Math.max(acc.spd, c.baseSpd),
  }), { atk: 0, hp: 0, def: 0, spd: 0 })
})

const activeCore = computed(() => {
  const coreChar = selectedTeam.value.find(c => c.isCore)
  if (!coreChar) return null
  return {
    name: `Lõi Kích Hoạt (${coreChar.nameVi})`,
    effect: 'Tăng 25% HP tối đa toàn đội, Phản thương 18% sát thương nhận vào, nhận 3 Năng lượng đầu trận.',
  }
})

const selectSlot = (row, index) => {
  activeSlot.value = { row, index }
}

const assignCharacter = (char) => {
  if (!activeSlot.value) return
  const { row, index } = activeSlot.value
  if (row === 'front') frontRow.value[index] = char
  else backRow.value[index] = char
  activeSlot.value = null
}

const removeCharacter = (row, index) => {
  if (row === 'front') frontRow.value[index] = null
  else backRow.value[index] = null
}

const clearAll = () => {
  frontRow.value = [null, null, null]
  backRow.value = [null, null, null]
  activeSlot.value = null
}
</script>

<template>
  <div class="lineup-builder-page">
    <div class="builder-container">
      <header class="builder-header">
        <div>
          <span class="eyebrow">CÔNG CỤ XÂY DỰNG ĐỘI HÌNH</span>
          <h1>Xây Dựng Đội Hình & Lõi Kích Hoạt</h1>
          <p>Chọn 6 vị trí chiến đấu để xem tổng chỉ số buff và hiệu ứng Lõi (Core Synergy).</p>
        </div>
        <button type="button" class="btn-clear" @click="clearAll">Làm mới đội hình</button>
      </header>

      <!-- Grid Slot Selection -->
      <div class="field-layout">
        <!-- Back Row -->
        <div class="row-section">
          <h3>Hàng Sau (Vị trí 4, 5, 6)</h3>
          <div class="slot-grid">
            <div
              v-for="(char, idx) in backRow"
              :key="`back-${idx}`"
              class="slot-card"
              :class="{ 'slot-card--active': activeSlot?.row === 'back' && activeSlot?.index === idx }"
              @click="selectSlot('back', idx)"
            >
              <div v-if="char" class="slot-filled">
                <img :src="char.imageUrl" :alt="char.nameVi" />
                <span class="slot-name">{{ char.nameVi }}</span>
                <button type="button" class="btn-remove" @click.stop="removeCharacter('back', idx)">✕</button>
              </div>
              <div v-else class="slot-empty">
                <span>+ Thêm Vị trí {{ idx + 4 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Front Row -->
        <div class="row-section">
          <h3>Hàng Trước (Vị trí 1, 2, 3)</h3>
          <div class="slot-grid">
            <div
              v-for="(char, idx) in frontRow"
              :key="`front-${idx}`"
              class="slot-card"
              :class="{ 'slot-card--active': activeSlot?.row === 'front' && activeSlot?.index === idx }"
              @click="selectSlot('front', idx)"
            >
              <div v-if="char" class="slot-filled">
                <img :src="char.imageUrl" :alt="char.nameVi" />
                <span class="slot-name">{{ char.nameVi }}</span>
                <button type="button" class="btn-remove" @click.stop="removeCharacter('front', idx)">✕</button>
              </div>
              <div v-else class="slot-empty">
                <span>+ Thêm Vị trí {{ idx + 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Summary Bar -->
      <div class="summary-panel">
        <div class="stats-summary">
          <div class="stat-box">
            <span>Tổng Công</span>
            <strong>{{ totalStats.atk.toLocaleString('vi-VN') }}</strong>
          </div>
          <div class="stat-box">
            <span>Tổng HP</span>
            <strong>{{ totalStats.hp.toLocaleString('vi-VN') }}</strong>
          </div>
          <div class="stat-box">
            <span>Tổng Thủ</span>
            <strong>{{ totalStats.def.toLocaleString('vi-VN') }}</strong>
          </div>
          <div class="stat-box">
            <span>Tốc Tối Đa</span>
            <strong>{{ totalStats.spd }}</strong>
          </div>
        </div>

        <div class="core-summary">
          <div v-if="activeCore" class="core-active-box">
            <span class="core-tag">⚡ LÕI ACTIVE</span>
            <h4>{{ activeCore.name }}</h4>
            <p>{{ activeCore.effect }}</p>
          </div>
          <div v-else class="core-empty-box">
            <span>Chưa có Lõi kích hoạt. Hãy chọn 1 nhân vật Lõi (Rover UR+, G5 UR+...)</span>
          </div>
        </div>
      </div>

      <!-- Character Picker Drawer / Modal -->
      <div v-if="activeSlot" class="picker-backdrop" @click.self="activeSlot = null">
        <div class="picker-modal">
          <header class="picker-header">
            <h3>Chọn Nhân vật cho Vị trí {{ activeSlot.row === 'front' ? activeSlot.index + 1 : activeSlot.index + 4 }}</h3>
            <div class="picker-filters">
              <input v-model="searchKw" type="search" placeholder="Tìm tên nhân vật…" class="picker-input" />
              <select v-model="selectedFaction" class="picker-select">
                <option v-for="f in factions" :key="f" :value="f">{{ f === 'ALL' ? 'Tất cả Phe' : f }}</option>
              </select>
            </div>
          </header>

          <div class="picker-grid">
            <div
              v-for="c in filteredCharacters"
              :key="c.id"
              class="picker-card"
              @click="assignCharacter(c)"
            >
              <img :src="c.imageUrl" :alt="c.nameVi" />
              <strong>{{ c.nameVi }}</strong>
              <small>{{ c.tier }} · {{ c.factionVi }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lineup-builder-page { min-height: calc(100vh - 80px); background: #05080e; padding: 30px 20px; }
.builder-container { max-width: 1200px; margin: 0 auto; }
.builder-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.eyebrow { color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; }
.builder-header h1 { margin: 4px 0; color: #f8fafc; font-size: 26px; font-weight: 950; }
.builder-header p { margin: 0; color: #8194a6; font-size: 13.5px; }

.btn-clear { cursor: pointer; padding: 10px 18px; border-radius: 12px; border: 1px solid rgba(244, 63, 94, .4); background: rgba(244, 63, 94, .1); color: #fb7185; font-size: 13px; font-weight: 850; }

.field-layout { display: grid; gap: 20px; }
.row-section h3 { margin: 0 0 12px; color: #ffc700; font-size: 15px; font-weight: 900; }
.slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.slot-card {
  cursor: pointer;
  height: 140px;
  border: 2px dashed rgba(255, 255, 255, .15);
  border-radius: 16px;
  background: rgba(12, 19, 32, .6);
  display: grid;
  place-items: center;
  transition: all .2s ease;
}
.slot-card:hover { border-color: rgba(255, 199, 0, .4); }
.slot-card--active { border-color: #ffc700; background: rgba(255, 199, 0, .08); }

.slot-empty { color: #64748b; font-size: 13px; font-weight: 800; }
.slot-filled { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; }
.slot-filled img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; }
.slot-name { margin-top: 8px; color: #f8fafc; font-size: 13px; font-weight: 850; text-align: center; }
.btn-remove { position: absolute; top: 8px; right: 8px; cursor: pointer; width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(244, 63, 94, .8); color: #fff; font-size: 11px; font-weight: 900; }

.summary-panel { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.stats-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; border: 1px solid rgba(255, 255, 255, .1); border-radius: 18px; background: rgba(12, 19, 32, .9); padding: 18px; }
.stat-box span { display: block; color: #8194a6; font-size: 11px; font-weight: 800; }
.stat-box strong { color: #ffc700; font-size: 20px; font-weight: 950; }

.core-summary { border: 1px solid rgba(255, 255, 255, .1); border-radius: 18px; background: rgba(12, 19, 32, .9); padding: 18px; }
.core-tag { color: #38bdf8; font-size: 10px; font-weight: 900; letter-spacing: .12em; }
.core-active-box h4 { margin: 4px 0; color: #f8fafc; font-size: 17px; font-weight: 900; }
.core-active-box p { margin: 0; color: #cbd5e1; font-size: 13px; line-height: 1.45; }
.core-empty-box { color: #64748b; font-size: 13px; display: grid; height: 100%; place-items: center; text-align: center; }

/* Modal Picker */
.picker-backdrop { position: fixed; inset: 0; z-index: 99; display: grid; place-items: center; background: rgba(0, 0, 0, .8); backdrop-filter: blur(6px); }
.picker-modal { width: min(90%, 720px); max-height: 80vh; border: 1px solid rgba(255, 255, 255, .15); border-radius: 20px; background: #0f172a; padding: 24px; display: flex; flex-direction: column; }
.picker-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.picker-header h3 { margin: 0; color: #f8fafc; font-size: 18px; font-weight: 900; }
.picker-filters { display: flex; gap: 10px; }
.picker-input, .picker-select { height: 38px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, .14); background: #020617; padding: 0 12px; color: #fff; font-size: 13px; outline: none; }
.picker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; overflow-y: auto; padding-right: 6px; }
.picker-card { cursor: pointer; border: 1px solid rgba(255, 255, 255, .1); border-radius: 14px; background: rgba(255, 255, 255, .03); padding: 12px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all .2s; }
.picker-card:hover { border-color: #ffc700; background: rgba(255, 199, 0, .08); }
.picker-card img { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; }
.picker-card strong { margin-top: 6px; color: #f8fafc; font-size: 12.5px; font-weight: 850; }
.picker-card small { color: #64748b; font-size: 11px; }

@media (max-width: 768px) {
  .slot-grid { grid-template-columns: 1fr; }
  .summary-panel { grid-template-columns: 1fr; }
  .picker-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
