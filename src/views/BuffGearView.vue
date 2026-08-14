<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buffGearSlots, buffGearSourceAssets } from '../data/buffGear/slots.js'
import { buffGearProgression, buffGearStructure, buffGearConfirmedExample } from '../data/buffGear/progression.js'
import { buffGearSkills } from '../data/buffGear/skills.js'
import { buffGearTerminology, buffGearTermById } from '../data/buffGear/terminology.js'
import { buffGearGoldStarCosts, buffGearPurpleStarCosts } from '../data/buffGear/simulator.js'
import BuffGearWorkbench from '../components/buffGear/BuffGearWorkbench.vue'

const { t, locale } = useI18n()
const activeTab = ref('overview')
const tabs = ['overview', 'stats', 'redUpgrade']

const heroFacts = Object.freeze({
  slots: buffGearSlots.length,
  systems: buffGearProgression.length,
  skills: buffGearSkills.length,
})

const statSearch = ref('')
const currentStatPage = ref(1)
const statsPerPage = 10
const showAssets = ref(false)

const filteredStats = computed(() => {
  const query = statSearch.value.trim().toLowerCase()
  if (!query) return buffGearTerminology
  return buffGearTerminology.filter(item =>
    item.id.toLowerCase().includes(query) ||
    item.vi.toLowerCase().includes(query) ||
    item.en.toLowerCase().includes(query) ||
    item.explanationVi.toLowerCase().includes(query)
  )
})

const totalStatPages = computed(() => Math.max(1, Math.ceil(filteredStats.value.length / statsPerPage)))

const paginatedStats = computed(() => {
  const start = (currentStatPage.value - 1) * statsPerPage
  return filteredStats.value.slice(start, start + statsPerPage)
})

const goToStatPage = (page) => {
  if (page >= 1 && page <= totalStatPages.value) {
    currentStatPage.value = page
  }
}

const onSearchInput = () => {
  currentStatPage.value = 1
}

const statLabel = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'vi' : 'en'] || id
const statHelp = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'explanationVi' : 'explanationEn'] || ''

const slotCardsData = Object.freeze([
  {
    id: 'faction',
    num: '01',
    nameVi: 'Thẻ Phe (Faction Card)',
    nameEn: 'Faction Buff Gear',
    asset: '/Buff Gear/optimized/equipcard_1_1.webp',
    color: '#efbc47',
    compatVi: 'Anh Hùng & Quái Nhân (Võ thuật gộp vào Anh Hùng; Tội phạm & Khác gộp vào Quái Nhân)',
    mainStats: ['% Tấn công (+5% ~ +35%)', '% Máu (+5% ~ +35%)', '% Phòng thủ (+5% ~ +35%)'],
    transformation: ['ATK (Công)', 'HP (Máu)', 'DEF (Thủ)', 'RED_DEF (Xuyên DEF)', 'ATK_BONUS (% Công)', 'HP_BONUS (% Máu)', 'DEF_BONUS (% Thủ)', 'SPD_BONUS (Tốc độ)'],
    purification: ['Công (600–2000)', 'Thủ (150–500)', 'Máu (2400–12000)', '% Công (1–10%)', '% Thủ (1–10%)', '% Máu (1–10%)', 'Chính xác HIT (1–10%)', 'Kháng RES (1–10%)'],
    refine: ['% Công', '% Thủ', '% Máu', 'Tỉ lệ chí mạng (CRIT)', 'Tỉ lệ đỡ đòn (BLOCK_RATE)', 'Sát thương chí mạng (CRIT_DMG)', 'Tốc độ (SPD)'],
  },
  {
    id: 'type',
    num: '02',
    nameVi: 'Thẻ Hệ (Type Card)',
    nameEn: 'Type Buff Gear',
    asset: '/Buff Gear/optimized/equipcard_2_1.webp',
    color: '#58d9f5',
    compatVi: 'Vũ Trang, Giác Đấu, Công Nghệ, Tâm Linh',
    mainStats: ['% Tấn công (+5% ~ +35%)', '% Máu (+5% ~ +35%)', '% Phòng thủ (+5% ~ +35%)'],
    transformation: ['ATK (Công)', 'HP (Máu)', 'DEF (Thủ)', 'RED_DEF (Xuyên DEF)', 'CRIT (Chí mạng)', 'BLOCK (Đỡ đòn)', 'EFFECT_HIT (Chính xác hiệu ứng)', 'EFFECT_RESIST (Kháng hiệu ứng)'],
    purification: ['Công (600–2000)', 'Thủ (150–500)', 'Máu (2400–12000)', '% Công (1–10%)', '% Thủ (1–10%)', '% Máu (1–10%)', 'Tăng ST Phe (1–10%)', 'Giảm ST Phe (1–10%)'],
    refine: ['% Công', '% Thủ', '% Máu', 'Kháng chí mạng (CRIT_RES)', 'Đỡ đòn (BLOCK)', 'Phản sát thương (DMG_REFLECT)'],
  },
  {
    id: 'level',
    num: '03',
    nameVi: 'Thẻ Cấp (Level Card)',
    nameEn: 'Level Buff Gear',
    asset: '/Buff Gear/optimized/equipcard_3_1.webp',
    color: '#ad82ff',
    compatVi: 'Hạng S (S & SS), Hạng A, B, C, Cấp Rồng, Quỷ, Hổ, Đặc Biệt',
    mainStats: ['% Tấn công (+5% ~ +35%)', '% Máu (+5% ~ +35%)', '% Phòng thủ (+5% ~ +35%)'],
    transformation: ['ATK (Công)', 'HP (Máu)', 'DEF (Thủ)', 'RED_DEF (Xuyên DEF)', 'SKILL_DMG (ST Kỹ năng)', 'DMG_FREE (Giảm ST)', 'BONUS_DMG (ST Cộng thêm)', 'BONUS_DMG_FREE (Giảm ST Cộng thêm)'],
    purification: ['Công (600–2000)', 'Thủ (150–500)', 'Máu (2400–12000)', '% Công (1–10%)', '% Thủ (1–10%)', '% Máu (1–10%)', 'Tăng ST Đấu trường (1–10%)', 'Giảm ST Đấu trường (1–10%)'],
    refine: ['% Công', '% Thủ', '% Máu', 'Tăng DMG Rate', 'Giảm sát thương (DMG_FREE)'],
  },
])

const openSkillLibrary = async () => {
  activeTab.value = 'stats'
  await nextTick()
  document.querySelector('#panel-stats')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <main class="buff-page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">{{ t('buffGear.eyebrow') }}</span>
        <h1>{{ t('buffGear.title') }}</h1>
        <p>{{ t('buffGear.description') }}</p>
        <div class="hero-facts" :aria-label="t('buffGear.guide.quickFacts')">
          <span><b>{{ heroFacts.slots }}</b>{{ t('buffGear.heroFacts.slots') }}</span>
          <span><b>{{ heroFacts.systems }}</b>{{ t('buffGear.heroFacts.systems') }}</span>
          <span><b>{{ heroFacts.skills }}</b>{{ t('buffGear.heroFacts.skills') }}</span>
        </div>
      </div>
      <div class="mini-system" aria-hidden="true">
        <span v-for="slot in buffGearSlots" :key="slot.id" :class="`slot--${slot.id}`">{{ slot.code }}</span>
        <i></i><strong>1 + 5 + 1</strong>
      </div>
    </section>

    <!-- Interactive Workbench Simulator -->
    <BuffGearWorkbench @open-skills="openSkillLibrary" />

    <!-- Bottom Navigation Tabs -->
    <nav class="tabs" role="tablist" :aria-label="t('buffGear.tabs.label')">
      <button
        v-for="(tab, index) in tabs"
        :id="`tab-${tab}`"
        :key="tab"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab"
        :aria-controls="`panel-${tab}`"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        <small>0{{ index + 1 }}</small>
        <span>{{ t(`buffGear.tabs.${tab}`) }}</span>
      </button>
    </nav>

    <!-- TAB 1: TỔNG QUAN BUFF GEAR -->
    <section v-if="activeTab === 'overview'" id="panel-overview" class="panel" role="tabpanel" aria-labelledby="tab-overview">
      <header class="section-head">
        <div>
          <span class="eyebrow">01 // TỔNG QUAN BA LOẠI THẺ</span>
          <h2>Tổng quan Buff Gear</h2>
        </div>
        <p>Hệ thống Buff Gear gồm 3 loại thẻ độc lập: <strong>Thẻ Phe</strong>, <strong>Thẻ Hệ</strong>, và <strong>Thẻ Cấp</strong>. Mỗi thẻ có nhóm chỉ số ngẫu nhiên riêng biệt khi Chuyển hóa, Thanh tẩy và Tinh luyện.</p>
      </header>

      <div class="slot-overview-grid">
        <article v-for="card in slotCardsData" :key="card.id" class="slot-overview-card" :style="{ '--accent': card.color }">
          <div class="card-head">
            <img :src="card.asset" :alt="card.nameVi" class="card-thumb" loading="lazy" />
            <div>
              <span class="card-badge">{{ card.num }} // {{ card.id.toUpperCase() }}</span>
              <h3>{{ card.nameVi }}</h3>
              <p class="compat-text">🎯 <strong>Tương thích:</strong> {{ card.compatVi }}</p>
            </div>
          </div>

          <div class="stat-pool-group">
            <div class="pool-box main-pool">
              <h4>⭐ Chỉ số chính (Main Stat)</h4>
              <div class="tag-row">
                <span v-for="ms in card.mainStats" :key="ms" class="tag tag-gold">{{ ms }}</span>
              </div>
            </div>

            <div class="pool-box trans-pool">
              <h4>🌀 Chỉ số Chuyển hóa ngẫu nhiên (5 dòng phụ)</h4>
              <div class="tag-row">
                <span v-for="ts in card.transformation" :key="ts" class="tag tag-blue">{{ ts }}</span>
              </div>
            </div>

            <div class="pool-box pur-pool">
              <h4>🔮 Chỉ số Thanh tẩy (Khi lên Buff Gear Đỏ)</h4>
              <div class="tag-row">
                <span v-for="ps in card.purification" :key="ps" class="tag tag-purple">{{ ps }}</span>
              </div>
            </div>

            <div class="pool-box ref-pool">
              <h4>⚡ Chỉ số Tinh luyện dòng (Khi lên Buff Gear Đỏ)</h4>
              <div class="tag-row">
                <span v-for="rs in card.refine" :key="rs" class="tag tag-red">{{ rs }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- TAB 2: CÁC CHỈ SỐ HIỆN CÓ TRONG GAME (10 CHỈ SỐ / TRANG CÓ NÚT TAB 1, 2, 3...) -->
    <section v-else-if="activeTab === 'stats'" id="panel-stats" class="panel" role="tabpanel" aria-labelledby="tab-stats">
      <header class="section-head">
        <div>
          <span class="eyebrow">02 // TỪ ĐIỂN CHỈ SỐ</span>
          <h2>Các Chỉ số hiện tại đang có trong game</h2>
        </div>
        <p>Tra cứu nhanh ý nghĩa, tác dụng và phân loại của tất cả các chỉ số Buff Gear. Bấm các số trang 1, 2, 3 bên dưới để chuyển trang gọn gàng.</p>
      </header>

      <div class="stat-filter-bar">
        <div class="search-input-wrap">
          <input
            v-model="statSearch"
            type="search"
            placeholder="Tìm theo tên chỉ số hoặc mã code (ví dụ: DEF, CRIT, Sát thương...)"
            @input="onSearchInput"
          />
        </div>
        <div class="stat-count-badge">
          Hiển thị {{ paginatedStats.length }} / {{ filteredStats.length }} chỉ số
        </div>
      </div>

      <!-- 10 Stat Cards List -->
      <div class="stat-cards-list">
        <article v-for="stat in paginatedStats" :key="stat.id" class="stat-glossary-card">
          <div class="stat-card-header">
            <div class="stat-title-group">
              <span class="stat-code-pill">{{ stat.id }}</span>
              <h3>{{ stat.vi }}</h3>
              <small class="stat-en-name">({{ stat.en }})</small>
            </div>
            <span class="stat-badge-type">Thuộc tính Buff Gear</span>
          </div>
          <p class="stat-desc">{{ locale === 'vi' ? stat.explanationVi : stat.explanationEn }}</p>
        </article>
      </div>

      <!-- Pagination Buttons (1, 2, 3...) -->
      <div class="pagination-bar">
        <button
          type="button"
          class="page-nav-btn"
          :disabled="currentStatPage === 1"
          @click="goToStatPage(currentStatPage - 1)"
        >
          ‹ Trang trước
        </button>

        <div class="page-numbers">
          <button
            v-for="p in totalStatPages"
            :key="p"
            type="button"
            class="page-num-btn"
            :class="{ active: currentStatPage === p }"
            @click="goToStatPage(p)"
          >
            {{ p }}
          </button>
        </div>

        <button
          type="button"
          class="page-nav-btn"
          :disabled="currentStatPage === totalStatPages"
          @click="goToStatPage(currentStatPage + 1)"
        >
          Trang sau ›
        </button>
      </div>
    </section>

    <!-- TAB 3: NÂNG CẤP LÊN GEAR ĐỎ CẦN NGUYÊN LIỆU GÌ -->
    <section v-else-if="activeTab === 'redUpgrade'" id="panel-redUpgrade" class="panel" role="tabpanel" aria-labelledby="tab-redUpgrade">
      <header class="section-head">
        <div>
          <span class="eyebrow">03 // LỘ TRÌNH VÀ NGUYÊN LIỆU</span>
          <h2>Nâng cấp lên Gear Đỏ cần nguyên liệu gì</h2>
        </div>
        <p>Điều kiện mở khóa Buff Gear phẩm chất Đỏ, quy tắc kế thừa chỉ số và bảng chi tiết toàn bộ nguyên liệu cần chuẩn bị.</p>
      </header>

      <div class="red-upgrade-sections">
        <!-- Section 1: Conditions & Rules -->
        <div class="upgrade-rule-grid">
          <div class="rule-card">
            <div class="rule-icon">🏆</div>
            <h3>1. Điều kiện mở khóa</h3>
            <p>Nhân vật đạt <strong>Cấp 90 (Lv.90)</strong> trở lên.</p>
            <p>Trang bị thẻ Buff Gear Vàng và nhấn nút <strong>"Tiến Cấp (Advance)"</strong> để mở khóa phẩm chất Đỏ.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">🔄</div>
            <h3>2. Quy tắc Kế thừa</h3>
            <p><strong>Bảo lưu 100%:</strong> Giữ nguyên vẹn 5 dòng Chuyển hóa và số Sao Vàng / Sao Tím hiện có của thẻ Vàng.</p>
            <p>Không bị reset cấp sao hay mất các dòng chỉ số đã chuyển hóa.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">✨</div>
            <h3>3. Quyền lợi khi lên Đỏ</h3>
            <p><strong>Mở Thanh Tẩy (Purification):</strong> 4 mốc (×1, ×3, ×6, ×12) với dòng chỉ số độc quyền và 22 kỹ năng đặc biệt.</p>
            <p><strong>Mở Tinh Luyện Dòng (Refine):</strong> 1 dòng cao cấp nâng từ cấp 0 lên cấp 6 theo sao tím.</p>
          </div>
        </div>

        <!-- Section 2: Drop Buff Advance Requirements (Direct from in-game) -->
        <div class="advance-mats-panel">
          <header class="advance-mats-head">
            <div class="advance-title-row">
              <span class="advance-tag-badge">TIẾN CẤP THẺ ĐỎ (DROP BUFF ADVANCE)</span>
              <h3>🔥 Chi tiết Nguyên liệu Tiến Cấp Buff Gear Đỏ (Từng Thẻ)</h3>
            </div>
            <p>Sau khi nhân vật đạt Lv.90, mỗi thẻ Buff Gear cần lượng nguyên liệu riêng biệt sau đây để tiến cấp lên phẩm chất Đỏ:</p>
          </header>

          <div class="advance-card-mats-grid">
            <!-- Thẻ Phe -->
            <div class="advance-mat-card" style="--accent: #efbc47;">
              <div class="advance-mat-card-header">
                <span class="card-slot-badge">Thẻ 01</span>
                <h4>Thẻ Phe (Hero / Monster)</h4>
              </div>
              <div class="advance-items-list">
                <div class="advance-item-row">
                  <img src="/Buff Gear/card_transform_faction.png" alt="Thẻ tiến cấp Phe" class="advance-item-img" />
                  <div class="advance-item-info">
                    <strong>35 Thẻ / Mảnh</strong>
                    <small>Thẻ tiến cấp Phe</small>
                  </div>
                </div>
                <div class="advance-item-row">
                  <img src="/Buff Gear/item_component_box.png" alt="Hộp linh kiện" class="advance-item-img" />
                  <div class="advance-item-info">
                    <strong>80 Hộp</strong>
                    <small>Hộp linh kiện nâng cấp</small>
                  </div>
                </div>
                <div class="advance-item-row">
                  <div class="advance-gold-badge">🪙</div>
                  <div class="advance-item-info">
                    <strong>100.000</strong>
                    <small>Vàng</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Thẻ Hệ -->
            <div class="advance-mat-card" style="--accent: #58d9f5;">
              <div class="advance-mat-card-header">
                <span class="card-slot-badge">Thẻ 02</span>
                <h4>Thẻ Hệ (Type Buff Gear)</h4>
              </div>
              <div class="advance-items-list">
                <div class="advance-item-row">
                  <img src="/Buff Gear/card_transform_type.png" alt="Thẻ tiến cấp Hệ" class="advance-item-img" />
                  <div class="advance-item-info">
                    <strong>35 Thẻ / Mảnh</strong>
                    <small>Thẻ tiến cấp Hệ</small>
                  </div>
                </div>
                <div class="advance-item-row">
                  <img src="/Buff Gear/item_component_box.png" alt="Hộp linh kiện" class="advance-item-img" />
                  <div class="advance-item-info">
                    <strong>80 Hộp</strong>
                    <small>Hộp linh kiện nâng cấp</small>
                  </div>
                </div>
                <div class="advance-item-row">
                  <div class="advance-gold-badge">🪙</div>
                  <div class="advance-item-info">
                    <strong>100.000</strong>
                    <small>Vàng</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Thẻ Cấp -->
            <div class="advance-mat-card" style="--accent: #ad82ff;">
              <div class="advance-mat-card-header">
                <span class="card-slot-badge">Thẻ 03</span>
                <h4>Thẻ Cấp (Level Buff Gear)</h4>
              </div>
              <div class="advance-items-list">
                <div class="advance-item-row">
                  <img src="/Buff Gear/card_transform_level.png" alt="Thẻ tiến cấp Cấp" class="advance-item-img" />
                  <div class="advance-item-info">
                    <strong>35 Thẻ / Mảnh</strong>
                    <small>Thẻ tiến cấp Cấp</small>
                  </div>
                </div>
                <div class="advance-item-row">
                  <img src="/Buff Gear/item_component_box.png" alt="Hộp linh kiện" class="advance-item-img" />
                  <div class="advance-item-info">
                    <strong>80 Hộp</strong>
                    <small>Hộp linh kiện nâng cấp</small>
                  </div>
                </div>
                <div class="advance-item-row">
                  <div class="advance-gold-badge">🪙</div>
                  <div class="advance-item-info">
                    <strong>100.000</strong>
                    <small>Vàng</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Advance Summary Banner -->
          <div class="advance-total-banner">
            <strong>📌 Tổng nguyên liệu tiến cấp CẢ 3 THẺ lên Đỏ:</strong>
            <span>105 Thẻ tiến cấp (35 thẻ mỗi loại) + 240 Hộp linh kiện + 300.000 Vàng</span>
          </div>
        </div>

        <!-- Section 3: Detailed Material Tables (Stars & Purple Stars) -->
        <div class="material-tables-wrap">
          <!-- Star Ascension Table -->
          <div class="mat-table-card">
            <div class="table-header">
              <img src="/Buff Gear/Item_213001.png" alt="Thẻ tăng sao" class="mat-icon-sm" />
              <div>
                <h3>⭐ Bảng Nguyên liệu Thăng Sao Vàng (★ 1 – 6)</h3>
                <small>Tăng chỉ số chính từ +10% lên tối đa +35%</small>
              </div>
            </div>
            <div class="table-scroll">
              <table class="mat-table">
                <thead>
                  <tr>
                    <th>Mốc Sao</th>
                    <th>🪙 Vàng</th>
                    <th>⭐ Thẻ thăng sao</th>
                    <th>💎 Tinh thể [S]</th>
                    <th>🔮 Lõi Tinh Thể</th>
                    <th>Chỉ số chính</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cost, idx) in buffGearGoldStarCosts.slice(1)" :key="idx">
                    <td><strong>{{ idx + 1 }} ★</strong></td>
                    <td>{{ (cost.gold).toLocaleString('vi-VN') }}</td>
                    <td>{{ cost.ascensionCards }} thẻ</td>
                    <td>{{ (cost.crystalS).toLocaleString('vi-VN') }}</td>
                    <td>{{ (cost.crystalCore).toLocaleString('vi-VN') }}</td>
                    <td class="stat-highlight">+{{ (idx + 2) * 5 }}%</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Tổng (1 Thẻ)</strong></td>
                    <td><strong>270.000</strong></td>
                    <td><strong>96 thẻ</strong></td>
                    <td><strong>6.200</strong></td>
                    <td><strong>3.600</strong></td>
                    <td class="stat-highlight"><strong>+35% (Max)</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Purple Star Refinement Table -->
          <div class="mat-table-card">
            <div class="table-header">
              <img src="/Buff Gear/Item_212008.png" alt="Thẻ tinh luyện" class="mat-icon-sm" />
              <div>
                <h3>🛡️ Bảng Nguyên liệu Tinh Luyện Sao Tím (★ 1 – 6)</h3>
                <small>Mở khóa và nâng cấp dòng Tinh Luyện trên Buff Gear Đỏ</small>
              </div>
            </div>
            <div class="table-scroll">
              <table class="mat-table">
                <thead>
                  <tr>
                    <th>Mốc Sao Tím</th>
                    <th>🪙 Vàng</th>
                    <th>🛡️ Thẻ tinh luyện</th>
                    <th>Điều kiện Sao Vàng</th>
                    <th>Cấp dòng Tinh Luyện</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(cost, idx) in buffGearPurpleStarCosts.slice(1)" :key="idx">
                    <td><strong>{{ idx + 1 }} ★ tím</strong></td>
                    <td>{{ (cost.gold).toLocaleString('vi-VN') }}</td>
                    <td>{{ cost.refinementCards }} thẻ</td>
                    <td>≥ {{ idx + 1 }} ★ vàng</td>
                    <td class="stat-highlight">Cấp {{ idx + 1 }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Tổng (1 Thẻ)</strong></td>
                    <td><strong>600.000</strong></td>
                    <td><strong>48 thẻ</strong></td>
                    <td><strong>6 ★ vàng</strong></td>
                    <td class="stat-highlight"><strong>Cấp 6 (Max)</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.buff-page {
  --cyan: #59dcf8;
  --ink: #edf7ff;
  --muted: #8fa9ba;
  --surface: #071722;
  --surface-2: #0a1d2a;
  --line: rgba(105, 174, 207, 0.22);
  --faction: #efbc47;
  --type: #58d9f5;
  --level: #ad82ff;
  max-width: 1460px;
  margin: auto;
  padding: 24px clamp(12px, 2.2vw, 28px) 84px;
  color: var(--ink);
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  min-height: 180px;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(97, 187, 225, 0.24);
  border-radius: 20px;
  padding: 24px clamp(20px, 3.5vw, 44px);
  background: radial-gradient(circle at 88% 20%, rgba(157, 92, 255, 0.18), transparent 34%), linear-gradient(118deg, #092332, #07121f 62%, #151127);
  margin-bottom: 20px;
}

.hero-copy, .mini-system { position: relative; z-index: 1; }
.eyebrow { color: var(--cyan); font: 900 11px/1.3 ui-monospace, monospace; letter-spacing: 0.17em; text-transform: uppercase; }
.hero h1 { margin: 8px 0; color: #f5f9ff; font-size: clamp(32px, 4vw, 54px); font-weight: 950; line-height: 0.95; letter-spacing: -0.04em; text-transform: uppercase; }
.hero p { max-width: 760px; color: #a8c0d0; font-size: 14px; line-height: 1.6; }
.hero-facts { display: flex; gap: 8px; margin-top: 14px; }
.hero-facts span { display: flex; align-items: center; gap: 7px; border-radius: 10px; background: rgba(3, 19, 30, 0.68); padding: 6px 12px; color: #839eaf; font-size: 12px; font-weight: 850; text-transform: uppercase; }
.hero-facts b { color: var(--cyan); font-size: 17px; }

.mini-system { display: grid; width: 170px; height: 130px; grid-template-columns: repeat(3, 40px); align-content: center; justify-content: center; gap: 10px; justify-self: center; }
.mini-system span { z-index: 1; display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid currentColor; border-radius: 11px; background: #091927; font-weight: 950; font-size: 13px; }
.mini-system .slot--faction { color: var(--faction); }
.mini-system .slot--type { color: var(--type); }
.mini-system .slot--level { color: var(--level); }
.mini-system strong { grid-column: 1/-1; color: #b8ccd9; font: 800 12px ui-monospace, monospace; text-align: center; margin-top: 4px; }

.tabs {
  position: sticky;
  top: 10px;
  z-index: 8;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 18px 0;
  background: rgba(4, 15, 25, 0.94);
  border: 1px solid rgba(89, 220, 248, 0.18);
  border-radius: 14px;
  padding: 6px;
  backdrop-filter: blur(14px);
}

.tabs button {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #829aab;
  font: 850 14px inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button:hover { color: #dff8ff; background: rgba(13, 44, 60, 0.4); }
.tabs button.active { background: #0d2c3c; color: #f2fbff; box-shadow: inset 0 -2px var(--cyan); }
.tabs small { color: var(--cyan); font: 900 11px ui-monospace, monospace; }

.panel {
  border: 1px solid rgba(89, 220, 248, 0.16);
  border-radius: 20px;
  background: linear-gradient(150deg, rgba(8, 25, 37, 0.96), rgba(4, 15, 24, 0.96));
  padding: clamp(18px, 2.8vw, 32px);
  animation: panel-in 0.25s ease both;
}

.section-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 500px);
  align-items: end;
  gap: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 16px;
}

.section-head h2 { margin-top: 6px; font-size: clamp(24px, 3.2vw, 36px); font-weight: 930; letter-spacing: -0.03em; color: #fff; }
.section-head p { color: var(--muted); font-size: 13.5px; line-height: 1.6; }

/* TAB 1: 3 CARDS OVERVIEW */
.slot-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.slot-overview-card {
  border: 1px solid var(--line);
  border-top: 3px solid var(--accent);
  border-radius: 16px;
  background: rgba(9, 29, 42, 0.72);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.card-thumb {
  width: 58px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: #040e16;
  flex-shrink: 0;
}

.card-badge {
  display: inline-block;
  color: var(--accent);
  font: 900 10.5px ui-monospace, monospace;
  text-transform: uppercase;
}

.card-head h3 {
  margin: 2px 0 4px;
  font-size: 16px;
  font-weight: 850;
  color: #fff;
}

.compat-text {
  color: #8fa9ba;
  font-size: 12px;
  line-height: 1.45;
  margin: 0;
}

.stat-pool-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pool-box {
  border-radius: 10px;
  background: rgba(4, 15, 23, 0.6);
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pool-box h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 800;
  color: #cbdbe5;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 6px;
  font-weight: 700;
}

.tag-gold { background: rgba(239, 188, 71, 0.12); color: #efbc47; border: 1px solid rgba(239, 188, 71, 0.25); }
.tag-blue { background: rgba(88, 217, 245, 0.1); color: #58d9f5; border: 1px solid rgba(88, 217, 245, 0.2); }
.tag-purple { background: rgba(173, 130, 255, 0.1); color: #ad82ff; border: 1px solid rgba(173, 130, 255, 0.2); }
.tag-red { background: rgba(255, 99, 120, 0.1); color: #ff6378; border: 1px solid rgba(255, 99, 120, 0.2); }

/* TAB 2: GLOSSARY STATS WITH PAGINATION (10 PER PAGE) */
.stat-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.search-input-wrap {
  flex: 1;
  max-width: 460px;
}

.search-input-wrap input {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #092130;
  padding: 0 14px;
  color: #fff;
  font-size: 13px;
  outline: none;
}

.search-input-wrap input:focus {
  border-color: var(--cyan);
}

.stat-count-badge {
  font-size: 12.5px;
  color: #7b99ab;
  font-weight: 750;
}

.stat-cards-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-glossary-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(9, 27, 39, 0.7);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.stat-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-code-pill {
  border-radius: 5px;
  background: rgba(89, 220, 248, 0.12);
  color: var(--cyan);
  font: 900 10.5px ui-monospace, monospace;
  padding: 3px 6px;
}

.stat-title-group h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 850;
  color: #f1f8fc;
}

.stat-en-name {
  color: #7896a7;
  font-size: 12px;
}

.stat-badge-type {
  font-size: 10.5px;
  color: #92abbc;
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 8px;
  border-radius: 20px;
}

.stat-desc {
  margin: 0;
  color: #a4bccb;
  font-size: 13px;
  line-height: 1.5;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-num-btn {
  min-width: 38px;
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #092232;
  color: #8da4b4;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s;
}

.page-num-btn:hover {
  background: #0e344d;
  color: #fff;
}

.page-num-btn.active {
  background: var(--cyan);
  color: #031520;
  border-color: var(--cyan);
  font-weight: 900;
}

.page-nav-btn {
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #092232;
  color: #8da4b4;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s;
}

.page-nav-btn:hover:not(:disabled) {
  background: #0e344d;
  color: #fff;
}

.page-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* TAB 3: RED UPGRADE & ADVANCE MATERIALS */
.upgrade-rule-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}

.rule-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(9, 29, 42, 0.65);
  padding: 16px;
}

.rule-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.rule-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 850;
  color: #fff;
}

.rule-card p {
  margin: 0 0 6px;
  color: #97b0c0;
  font-size: 12.5px;
  line-height: 1.5;
}

/* Advance Materials Section */
.advance-mats-panel {
  border: 1px solid rgba(255, 99, 120, 0.3);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(25, 10, 20, 0.8), rgba(10, 18, 28, 0.85));
  padding: 20px;
  margin-bottom: 24px;
}

.advance-mats-head {
  margin-bottom: 16px;
}

.advance-tag-badge {
  display: inline-block;
  font: 900 11px ui-monospace, monospace;
  color: #ff6378;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.advance-mats-head h3 {
  margin: 2px 0 6px;
  font-size: 18px;
  font-weight: 900;
  color: #fff;
}

.advance-mats-head p {
  margin: 0;
  color: #9db1bf;
  font-size: 13px;
}

.advance-card-mats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

.advance-mat-card {
  border: 1px solid var(--line);
  border-top: 3px solid var(--accent);
  border-radius: 12px;
  background: rgba(5, 15, 23, 0.8);
  padding: 14px;
}

.advance-mat-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.card-slot-badge {
  font: 900 10.5px ui-monospace, monospace;
  color: var(--accent);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.advance-mat-card-header h4 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 800;
  color: #fff;
}

.advance-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advance-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.advance-item-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 3px;
  flex-shrink: 0;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s;
}

.advance-item-row:hover .advance-item-img {
  transform: scale(1.1);
  border-color: rgba(89, 220, 248, 0.5);
}

.advance-gold-badge {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(239, 188, 71, 0.15);
  border: 1px solid rgba(239, 188, 71, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.advance-item-row:hover .advance-gold-badge {
  transform: scale(1.1);
}

.advance-item-info {
  display: flex;
  flex-direction: column;
}

.advance-item-info strong {
  font-size: 13px;
  color: #fff;
  font-weight: 850;
}

.advance-item-info small {
  font-size: 10.5px;
  color: #8fa9ba;
}

.advance-total-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(255, 99, 120, 0.08);
  border: 1px solid rgba(255, 99, 120, 0.25);
  font-size: 13px;
}

.advance-total-banner strong {
  color: #ff8595;
}

.advance-total-banner span {
  color: #fff;
  font-weight: 800;
}

/* Material Tables */
.material-tables-wrap {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 16px;
}

.mat-table-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(6, 20, 30, 0.8);
  padding: 16px;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mat-icon-sm {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.table-header h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 850;
  color: #fff;
}

.table-header small {
  color: #7b99ab;
  font-size: 11.5px;
}

.table-scroll {
  overflow-x: auto;
}

.mat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
}

.mat-table th, .mat-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mat-table th {
  background: rgba(255, 255, 255, 0.03);
  color: #7b99ab;
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
}

.mat-table td {
  color: #c0d3df;
}

.mat-table tfoot td {
  border-top: 1px solid var(--cyan);
  border-bottom: 0;
  background: rgba(89, 220, 248, 0.05);
  color: #fff;
  font-weight: 800;
}

.stat-highlight {
  color: var(--cyan) !important;
  font-weight: 850;
}

@keyframes panel-in {
  from { opacity: 0.3; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

@media (max-width: 980px) {
  .hero { grid-template-columns: 1fr; }
  .slot-overview-grid { grid-template-columns: 1fr; }
  .stat-cards-list { grid-template-columns: 1fr; }
  .upgrade-rule-grid { grid-template-columns: 1fr; }
  .advance-card-mats-grid { grid-template-columns: 1fr; }
  .advance-total-banner { flex-direction: column; align-items: flex-start; }
  .material-tables-wrap { grid-template-columns: 1fr; }
}

@media (max-width: 680px) {
  .buff-page { padding: 12px 8px 56px; }
  .tabs { grid-template-columns: 1fr; }
  .tabs button { min-height: 42px; font-size: 13px; }
  .section-head { grid-template-columns: 1fr; gap: 8px; }
  .card-head { flex-direction: column; }
}
</style>