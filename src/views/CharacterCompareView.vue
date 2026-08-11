<script setup>
import { computed, ref } from 'vue'
import charactersData from '../data/characters.json'

const char1Id = ref(charactersData[0]?.id || '')
const char2Id = ref(charactersData[1]?.id || '')

const getChar = (id) => {
  const c = charactersData.find(item => item.id === id)
  if (!c) return null
  return {
    id: c.id,
    nameVi: c.name_vi,
    nameEn: c.name_en,
    tier: c.tier,
    factionVi: c.faction_vi,
    typeVi: c.type_vi,
    imageUrl: c.image_url,
    baseStats: c.base_stats || { atk: 1000, hp: 5000, def: 500, spd: 100 },
    pvpStats: c.pvp_stats || { atk: 1500, hp: 7500, def: 750, spd: 120 },
    skills: c.skills || [],
  }
}

const character1 = computed(() => getChar(char1Id.value))
const character2 = computed(() => getChar(char2Id.value))

const statCompare = (val1 = 0, val2 = 0) => {
  if (val1 > val2) return 'higher'
  if (val1 < val2) return 'lower'
  return 'equal'
}
</script>

<template>
  <div class="compare-page">
    <div class="compare-container">
      <header class="compare-header">
        <span class="eyebrow">CÔNG CỤ SO SÁNH</span>
        <h1>So Sánh Nhân Vật Song Song</h1>
        <p>So sánh bảng chỉ số Base, PVP và Kỹ năng trực quan giữa 2 nhân vật.</p>
      </header>

      <!-- Selector Headers -->
      <div class="selector-grid">
        <div class="select-box">
          <label>Chọn Nhân vật 1:</label>
          <select v-model="char1Id">
            <option v-for="c in charactersData" :key="c.id" :value="c.id">
              [{{ c.tier }}] {{ c.name_vi }}
            </option>
          </select>
        </div>

        <div class="vs-badge">VS</div>

        <div class="select-box">
          <label>Chọn Nhân vật 2:</label>
          <select v-model="char2Id">
            <option v-for="c in charactersData" :key="c.id" :value="c.id">
              [{{ c.tier }}] {{ c.name_vi }}
            </option>
          </select>
        </div>
      </div>

      <!-- Character Card Overviews -->
      <div v-if="character1 && character2" class="compare-cards">
        <!-- Char 1 -->
        <article class="char-card">
          <img :src="character1.imageUrl" :alt="character1.nameVi" class="char-img" />
          <span class="tier-pill">{{ character1.tier }}</span>
          <h2>{{ character1.nameVi }}</h2>
          <p>{{ character1.nameEn }} · {{ character1.factionVi }} · {{ character1.typeVi }}</p>
        </article>

        <!-- Char 2 -->
        <article class="char-card">
          <img :src="character2.imageUrl" :alt="character2.nameVi" class="char-img" />
          <span class="tier-pill">{{ character2.tier }}</span>
          <h2>{{ character2.nameVi }}</h2>
          <p>{{ character2.nameEn }} · {{ character2.factionVi }} · {{ character2.typeVi }}</p>
        </article>
      </div>

      <!-- Stats Comparison Table -->
      <section v-if="character1 && character2" class="stats-panel">
        <h3>So Sánh Chỉ Số Cơ Bản (Base Stats)</h3>
        <div class="stat-rows">
          <!-- ATK -->
          <div class="stat-row">
            <div class="stat-val" :class="statCompare(character1.baseStats.atk, character2.baseStats.atk)">
              <strong>{{ character1.baseStats.atk.toLocaleString('vi-VN') }}</strong>
            </div>
            <div class="stat-name">TẤN CÔNG (ATK)</div>
            <div class="stat-val" :class="statCompare(character2.baseStats.atk, character1.baseStats.atk)">
              <strong>{{ character2.baseStats.atk.toLocaleString('vi-VN') }}</strong>
            </div>
          </div>

          <!-- HP -->
          <div class="stat-row">
            <div class="stat-val" :class="statCompare(character1.baseStats.hp, character2.baseStats.hp)">
              <strong>{{ character1.baseStats.hp.toLocaleString('vi-VN') }}</strong>
            </div>
            <div class="stat-name">MÁU (HP)</div>
            <div class="stat-val" :class="statCompare(character2.baseStats.hp, character1.baseStats.hp)">
              <strong>{{ character2.baseStats.hp.toLocaleString('vi-VN') }}</strong>
            </div>
          </div>

          <!-- DEF -->
          <div class="stat-row">
            <div class="stat-val" :class="statCompare(character1.baseStats.def, character2.baseStats.def)">
              <strong>{{ character1.baseStats.def.toLocaleString('vi-VN') }}</strong>
            </div>
            <div class="stat-name">PHÒNG THỦ (DEF)</div>
            <div class="stat-val" :class="statCompare(character2.baseStats.def, character1.baseStats.def)">
              <strong>{{ character2.baseStats.def.toLocaleString('vi-VN') }}</strong>
            </div>
          </div>

          <!-- SPD -->
          <div class="stat-row">
            <div class="stat-val" :class="statCompare(character1.baseStats.spd, character2.baseStats.spd)">
              <strong>{{ character1.baseStats.spd }}</strong>
            </div>
            <div class="stat-name">TỐC ĐỘ (SPD)</div>
            <div class="stat-val" :class="statCompare(character2.baseStats.spd, character1.baseStats.spd)">
              <strong>{{ character2.baseStats.spd }}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.compare-page { min-height: calc(100vh - 80px); background: #05080e; padding: 30px 20px; }
.compare-container { max-width: 1100px; margin: 0 auto; }
.compare-header { text-align: center; margin-bottom: 24px; }
.eyebrow { color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; }
.compare-header h1 { margin: 4px 0; color: #f8fafc; font-size: 26px; font-weight: 950; }
.compare-header p { margin: 0; color: #8194a6; font-size: 13.5px; }

.selector-grid { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 24px; }
.select-box label { display: block; margin-bottom: 6px; color: #ffc700; font-size: 12px; font-weight: 850; }
.select-box select { height: 42px; width: 280px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, .14); background: #0f172a; color: #fff; font-size: 13.5px; font-weight: 850; padding: 0 12px; outline: none; }
.vs-badge { width: 44px; height: 44px; border-radius: 50%; background: #ffc700; color: #020617; font-size: 16px; font-weight: 950; display: grid; place-items: center; margin-top: 18px; }

.compare-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.char-card { border: 1px solid rgba(255, 255, 255, .1); border-radius: 20px; background: rgba(12, 19, 32, .9); padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.char-img { width: 90px; height: 90px; border-radius: 18px; object-fit: cover; border: 2px solid rgba(255, 199, 0, .4); }
.tier-pill { display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 8px; background: rgba(255, 199, 0, .15); color: #ffc700; font-weight: 900; font-size: 12px; }
.char-card h2 { margin: 8px 0 4px; color: #f8fafc; font-size: 20px; font-weight: 950; }
.char-card p { margin: 0; color: #8194a6; font-size: 12.5px; }

.stats-panel { border: 1px solid rgba(255, 255, 255, .1); border-radius: 20px; background: rgba(12, 19, 32, .9); padding: 24px; }
.stats-panel h3 { margin: 0 0 18px; color: #ffc700; font-size: 17px; font-weight: 900; text-align: center; }
.stat-rows { display: grid; gap: 12px; }
.stat-row { display: grid; grid-template-columns: 1fr 180px 1fr; align-items: center; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, .06); padding-bottom: 10px; }
.stat-name { color: #8194a6; font-size: 11px; font-weight: 900; letter-spacing: .12em; }
.stat-val strong { font-size: 18px; font-weight: 950; }
.stat-val.higher strong { color: #34d399; }
.stat-val.lower strong { color: #f87171; }
.stat-val.equal strong { color: #cbd5e1; }

@media (max-width: 768px) {
  .selector-grid { flex-direction: column; }
  .compare-cards { grid-template-columns: 1fr; }
  .stat-row { grid-template-columns: 1fr 100px 1fr; }
}
</style>
