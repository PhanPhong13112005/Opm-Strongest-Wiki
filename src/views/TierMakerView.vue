<script setup>
import { ref } from 'vue'
import charactersData from '../data/characters.json'

const tiers = ref([
  { name: 'SS+', color: '#ef4444', items: [] },
  { name: 'SS', color: '#f59e0b', items: [] },
  { name: 'S', color: '#a855f7', items: [] },
  { name: 'A', color: '#3b82f6', items: [] },
  { name: 'B', color: '#22c55e', items: [] },
  { name: 'C', color: '#64748b', items: [] },
  { name: 'D', color: '#475569', items: [] },
])

const availableCharacters = ref(charactersData.slice(0, 40).map(c => ({
  id: c.id,
  nameVi: c.name_vi,
  imageUrl: c.image_url,
})))

const moveCharacter = (char, targetTierName) => {
  // Remove from all tiers and available list
  tiers.value.forEach(t => {
    t.items = t.items.filter(item => item.id !== char.id)
  })
  availableCharacters.value = availableCharacters.value.filter(item => item.id !== char.id)

  if (targetTierName) {
    const targetTier = tiers.value.find(t => t.name === targetTierName)
    if (targetTier) targetTier.items.push(char)
  } else {
    availableCharacters.value.push(char)
  }
}

const resetMaker = () => {
  tiers.value.forEach(t => { t.items = [] })
  availableCharacters.value = charactersData.slice(0, 40).map(c => ({
    id: c.id,
    nameVi: c.name_vi,
    imageUrl: c.image_url,
  }))
}
</script>

<template>
  <div class="tier-maker-page">
    <div class="tier-maker-container">
      <header class="maker-header">
        <div>
          <span class="eyebrow">CÔNG CỤ CÁ NHÂN</span>
          <h1>Tạo Bảng Xếp Hạng Tier Cá Nhân</h1>
          <p>Tự sắp xếp nhân vật theo đánh giá riêng của bạn.</p>
        </div>
        <button type="button" class="btn-reset" @click="resetMaker">Đặt lại từ đầu</button>
      </header>

      <!-- Tier Rows -->
      <div class="tier-rows">
        <div v-for="t in tiers" :key="t.name" class="tier-row">
          <div class="tier-label" :style="{ backgroundColor: t.color }">
            {{ t.name }}
          </div>
          <div class="tier-dropzone">
            <div
              v-for="char in t.items"
              :key="char.id"
              class="tier-item"
              @click="moveCharacter(char, null)"
            >
              <img :src="char.imageUrl" :alt="char.nameVi" />
              <span class="item-tooltip">{{ char.nameVi }}</span>
            </div>
            <span v-if="t.items.length === 0" class="drop-hint">Nhấp vào nhân vật phía dưới để xếp vào Tier {{ t.name }}</span>
          </div>
        </div>
      </div>

      <!-- Character Pool -->
      <section class="pool-section">
        <h3>Danh Sách Nhân Vật Chờ Xếp Hạng ({{ availableCharacters.length }})</h3>
        <div class="pool-grid">
          <div
            v-for="char in availableCharacters"
            :key="char.id"
            class="pool-item"
            @click="moveCharacter(char, 'SS+')"
          >
            <img :src="char.imageUrl" :alt="char.nameVi" />
            <span>{{ char.nameVi }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tier-maker-page { min-height: calc(100vh - 80px); background: #05080e; padding: 30px 20px; }
.tier-maker-container { max-width: 1100px; margin: 0 auto; }
.maker-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.eyebrow { color: #ffc700; font-size: 11px; font-weight: 900; letter-spacing: .14em; }
.maker-header h1 { margin: 4px 0; color: #f8fafc; font-size: 26px; font-weight: 950; }
.maker-header p { margin: 0; color: #8194a6; font-size: 13.5px; }

.btn-reset { cursor: pointer; padding: 10px 18px; border-radius: 12px; border: 1px solid rgba(255, 199, 0, .4); background: rgba(255, 199, 0, .1); color: #ffc700; font-size: 13px; font-weight: 850; }

.tier-rows { display: grid; gap: 10px; margin-bottom: 28px; }
.tier-row { display: flex; border: 1px solid rgba(255, 255, 255, .1); border-radius: 14px; overflow: hidden; background: rgba(12, 19, 32, .8); min-height: 70px; }
.tier-label { width: 90px; display: grid; place-items: center; color: #020617; font-size: 20px; font-weight: 950; flex-shrink: 0; }
.tier-dropzone { flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 14px; }
.drop-hint { color: #475569; font-size: 12px; }

.tier-item { cursor: pointer; position: relative; width: 54px; height: 54px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255, 255, 255, .2); transition: transform .2s; }
.tier-item:hover { transform: scale(1.1); }
.tier-item img { width: 100%; height: 100%; object-fit: cover; }
.item-tooltip { display: none; position: absolute; bottom: 0; inset-x: 0; background: rgba(0,0,0,0.8); color: #fff; font-size: 9px; text-align: center; }
.tier-item:hover .item-tooltip { display: block; }

.pool-section { border: 1px solid rgba(255, 255, 255, .1); border-radius: 20px; background: rgba(12, 19, 32, .9); padding: 22px; }
.pool-section h3 { margin: 0 0 16px; color: #ffc700; font-size: 16px; font-weight: 900; }
.pool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }
.pool-item { cursor: pointer; border: 1px solid rgba(255, 255, 255, .08); border-radius: 12px; background: rgba(255, 255, 255, .02); padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; transition: all .2s; }
.pool-item:hover { border-color: #ffc700; transform: translateY(-2px); }
.pool-item img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
.pool-item span { margin-top: 4px; color: #cbd5e1; font-size: 10px; font-weight: 800; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
