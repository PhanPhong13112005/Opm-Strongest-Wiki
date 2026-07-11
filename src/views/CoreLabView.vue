<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in text-white font-sans">
    <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-opm-gold to-yellow-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Phòng Nghiên Cứu
        </h1>
        <p class="text-gray-400 mt-2 text-sm max-w-2xl">
          Hệ Core (Phòng thí nghiệm) — tài nguyên cần để nâng core và các buff mở ra ở từng level.
        </p>
      </div>
      
      <!-- Hero Selector Grid -->
      <div class="flex flex-wrap gap-2 sm:gap-3">
        <button 
          v-for="hero in heroes" 
          :key="hero.coreHeId"
          @click="selectedHeroId = hero.coreHeId"
          class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none bg-[#05060a]"
          :class="selectedHeroId === hero.coreHeId ? 'border-opm-gold scale-110 shadow-[0_0_10px_rgba(255,215,0,0.5)] z-10' : 'border-gray-700 opacity-60 hover:opacity-100 hover:border-gray-500'"
          :title="hero.name"
        >
          <img :src="getHeroPortrait(hero)" :alt="hero.name" class="w-full h-full object-cover">
        </button>
      </div>
    </div>

    <!-- Active Hero Card -->
    <div v-if="activeHero" class="bg-gradient-to-r from-[#1a1c23] to-[#0f111a] rounded-2xl p-6 mb-8 border border-gray-800 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row gap-6 items-center sm:items-start">
      <!-- Glow effect -->
      <div class="absolute -top-20 -left-20 w-64 h-64 bg-opm-gold/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 border-2 border-gray-700 rounded-xl overflow-hidden shadow-lg bg-[#05060a]">
        <img :src="getHeroPortrait(activeHero)" :alt="activeHero.name" class="w-full h-full object-cover">
      </div>
      <div class="flex-grow text-center sm:text-left z-10 w-full">
        <h2 class="text-2xl font-bold text-white uppercase tracking-wider mb-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {{ activeHero.name }}
          <span v-if="activeHero.type" class="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-gray-800 border border-gray-600 text-gray-300">
            {{ activeHero.type }}
          </span>
          <span v-if="activeHero.faction" class="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-gray-800 border border-gray-600 text-gray-300">
            {{ activeHero.faction }}
          </span>
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 w-full">
          <div class="bg-[#05060a]/50 p-3 rounded-lg border border-gray-800/50 backdrop-blur-sm">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Kỹ Năng Core</div>
            <div class="text-sm font-bold text-opm-gold">{{ activeHero.coreName }}</div>
          </div>
          <div class="bg-[#05060a]/50 p-3 rounded-lg border border-gray-800/50 backdrop-blur-sm">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Đ.Kiện Kích Hoạt Cơ Bản</div>
            <div class="text-sm text-gray-300">{{ formatUnlockCondition(activeHero.gate_vi) }}</div>
          </div>
          <div class="bg-[#05060a]/50 p-3 rounded-lg border border-gray-800/50 backdrop-blur-sm">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Đ.Kiện Kích Hoạt Nâng Cao</div>
            <div class="text-sm text-gray-300">{{ formatUnlockCondition(activeHero.gate_vi) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div v-if="activeHero" class="grid grid-cols-1 xl:grid-cols-3 gap-8">
      
      <!-- Left Column: Controls & Requirements -->
      <div class="space-y-8 xl:col-span-1">
        <!-- Level Selectors -->
        <div class="bg-[#1a1c23] rounded-2xl p-6 border border-gray-800 shadow-xl">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-opm-gold rounded-full"></div>
            Cấp Độ Tính Toán
          </h3>

          <div class="flex items-center gap-2 sm:gap-4 mb-6">
            <div class="flex-1">
              <label class="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Từ Level</label>
              <div class="flex items-center bg-[#05060a] rounded-lg border border-gray-700 overflow-hidden">
                <button @click="fromLevel = Math.max(0, fromLevel - 1)" class="px-2 sm:px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">-</button>
                <input type="number" v-model.number="fromLevel" class="w-full bg-transparent text-center text-white font-bold py-2 focus:outline-none" min="0" :max="toLevel">
                <button @click="fromLevel = Math.min(toLevel, fromLevel + 1)" class="px-2 sm:px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">+</button>
              </div>
            </div>
            <div class="text-gray-600 font-bold mt-6">→</div>
            <div class="flex-1">
              <label class="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Đến Level</label>
              <div class="flex items-center bg-[#05060a] rounded-lg border border-gray-700 overflow-hidden">
                <button @click="toLevel = Math.max(fromLevel, toLevel - 1)" class="px-2 sm:px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">-</button>
                <input type="number" v-model.number="toLevel" class="w-full bg-transparent text-center text-white font-bold py-2 focus:outline-none" :min="fromLevel" :max="activeHero.maxLv">
                <button @click="toLevel = Math.min(activeHero.maxLv, toLevel + 1)" class="px-2 sm:px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">+</button>
              </div>
            </div>
          </div>

          <!-- Quick Jump Buttons -->
          <div>
            <label class="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Mốc Nâng Cấp Nhanh</label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="lv in [...activeHero.milestones, activeHero.maxLv]" 
                :key="lv"
                @click="toLevel = lv"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                :class="toLevel === lv ? 'bg-opm-gold/20 text-opm-gold border-opm-gold' : 'bg-[#05060a] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'"
              >
                Lv {{ lv }}
              </button>
            </div>
          </div>
        </div>

        <!-- Total Resources -->
        <div class="bg-[#1a1c23] rounded-2xl p-6 border border-gray-800 shadow-xl">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            Tổng Tài Nguyên Cần
          </h3>
          
          <div v-if="totalResources.length === 0" class="text-center py-8 text-sm text-gray-500">
            Chưa chọn khoảng cấp độ để tính toán.
          </div>
          
          <div v-else class="grid grid-cols-2 gap-3">
            <div v-for="res in totalResources" :key="res.id" class="flex items-center gap-2 sm:gap-3 bg-[#05060a] p-2 rounded-lg border border-gray-800/50 group hover:border-gray-600 transition-colors">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-800 border border-gray-700 p-0.5 overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img v-if="res.icon" :src="res.icon" :alt="res.name" class="w-full h-full object-contain group-hover:scale-110 transition-transform">
                <div v-else class="w-full h-full bg-yellow-600/30 rounded flex items-center justify-center text-yellow-500 font-bold text-xs">G</div>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-[9px] sm:text-[10px] text-gray-500 truncate" :title="res.name">{{ res.name }}</span>
                <span class="text-xs sm:text-sm font-black text-white truncate">{{ formatNumber(res.amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Specific Parts -->
        <div class="bg-[#1a1c23] rounded-2xl p-6 border border-gray-800 shadow-xl">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            Linh Kiện Cần (6 Loại)
          </h3>
          
          <div class="grid grid-cols-3 gap-3">
            <div v-for="part in activeHero.parts" :key="part.code" class="flex flex-col items-center gap-2 bg-[#05060a] p-2.5 rounded-lg border border-gray-800/50">
              <div class="w-10 h-10 sm:w-12 sm:h-12 rounded bg-gray-800 border border-gray-700 p-1 flex items-center justify-center">
                <img :src="getItemIcon(part.code, activeHero)" :alt="getItemName(part.code)" class="w-full h-full object-contain">
              </div>
              <div class="text-[9px] sm:text-[10px] text-gray-500 text-center truncate w-full" :title="getItemName(part.code)">{{ getItemName(part.code) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Buffs List -->
      <div class="xl:col-span-2">
        <div class="bg-[#1a1c23] rounded-2xl p-6 border border-gray-800 shadow-xl h-full">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
            Buff Nhận Được
          </h3>

          <div v-if="unlockedLevels.length === 0" class="text-center py-12 text-gray-500 bg-[#05060a] rounded-xl border border-gray-800 border-dashed">
            Chưa có buff nào được mở khóa trong khoảng cấp độ này.
          </div>

          <div v-else class="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            <div 
              v-for="lvl in unlockedLevels" 
              :key="lvl.lv"
              class="relative rounded-xl p-4 overflow-hidden border transition-all"
              :class="lvl.isMilestone ? 'bg-gradient-to-r from-purple-900/40 to-[#05060a] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-[#05060a] border-gray-800 hover:border-gray-600'"
            >
              <div class="flex items-start gap-3 sm:gap-4 z-10 relative">
                <!-- Level Badge -->
                <div class="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg" :class="lvl.isMilestone ? 'bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)] text-white' : 'bg-gray-800 text-gray-400'">
                  <span class="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Lv</span>
                  <span class="text-lg sm:text-xl font-black leading-none">{{ lvl.lv }}</span>
                </div>

                <!-- Buff Info -->
                <div class="flex-grow min-w-0">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                    <div class="flex items-center gap-2 sm:gap-3">
                      <div v-if="lvl.isMilestone && lvl.milestoneIcon" class="w-8 h-8 rounded bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                        <img :src="getMilestoneIcon(lvl.milestoneIcon, activeHero)" :alt="lvl.coreName_vi" class="w-full h-full object-cover">
                      </div>
                      <span class="font-bold text-sm sm:text-base" :class="lvl.isMilestone ? 'text-purple-300' : 'text-gray-300'">
                        {{ lvl.reward_vi }}
                      </span>
                    </div>
                    <span v-if="lvl.isMilestone" class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/30 self-start sm:self-auto flex-shrink-0">
                      Mốc Quan Trọng
                    </span>
                  </div>

                  <!-- Description Box -->
                  <div v-if="lvl.coreEffect_vi" class="mt-3 text-[13px] sm:text-sm text-[#d1d5db] bg-[#121318] p-3 sm:p-4 rounded border border-gray-700/60 leading-relaxed shadow-inner break-words" v-html="formatCoreEffect(lvl.coreEffect_vi, activeHero.gate_vi)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import coreLabData from '@/data/coreLab.json'

const heroes = coreLabData.heroes || []
const items = coreLabData.items || {}

const selectedHeroId = ref(heroes.length > 0 ? heroes[0].coreHeId : null)
const fromLevel = ref(0)
const toLevel = ref(4)

const suffixToFolder = {
  '307': 'Psykos_V2',
  '196': 'Child_Emperor_V2',
  '184': 'Boros',
  '078': 'Drive_Knight',
  '159': 'Geryuganshoop',
  '108': 'Bomb',
  '045': 'Child_Emperor',
  '003': 'SeaKing',
  '109': 'Psykos',
  '013': 'Zombie_Man',
  '029': 'Amai',
  '092': 'Bakuzan',
  '083': 'Genus',
  '001': 'Genos',
  '008': 'Mosquito_Girl'
}

// Helper: Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const activeHero = computed(() => {
  return heroes.find(h => h.coreHeId === selectedHeroId.value) || null
})

// Ensures fromLevel is always <= toLevel and toLevel <= maxLv
watch(activeHero, (newHero) => {
  if (newHero) {
    if (toLevel.value > newHero.maxLv) {
      toLevel.value = newHero.maxLv
    }
  }
})

watch([fromLevel, toLevel], ([newFrom, newTo]) => {
  if (newFrom > newTo) {
    toLevel.value = newFrom
  }
  if (activeHero.value && newTo > activeHero.value.maxLv) {
    toLevel.value = activeHero.value.maxLv
  }
  if (newFrom < 0) fromLevel.value = 0
})

// Calculate total resources for the selected level range
const totalResources = computed(() => {
  if (!activeHero.value || fromLevel.value >= toLevel.value) return []
  
  const resourceMap = {}
  
  // Levels in the hero's data are 1-indexed (lv: 1 is the cost from 0->1)
  const levelsToCalculate = activeHero.value.levels.filter(
    lvl => lvl.lv > fromLevel.value && lvl.lv <= toLevel.value
  )
  
  levelsToCalculate.forEach(lvl => {
    // Add up generic costs (like Gold, Research Notes, etc.)
    if (lvl.cost) {
      lvl.cost.forEach(([itemId, amount]) => {
        resourceMap[itemId] = (resourceMap[itemId] || 0) + amount
      })
    }
    // Add up specific component costs
    if (lvl.comp) {
      lvl.comp.forEach(([itemId, amount]) => {
        resourceMap[itemId] = (resourceMap[itemId] || 0) + amount
      })
    }
  })
  
  // Format into an array
  const result = Object.keys(resourceMap).map(itemId => {
    const itemData = items[itemId] || {}
    return {
      id: itemId,
      name: itemData.vi || `Item ${itemId}`,
      icon: getItemIcon(itemId, activeHero.value),
      amount: resourceMap[itemId]
    }
  })
  
  // Sort: Gold ("0") last, then by amount descending
  return result.sort((a, b) => {
    if (a.id === '0') return 1
    if (b.id === '0') return -1
    return b.amount - a.amount
  })
})

const unlockedLevels = computed(() => {
  if (!activeHero.value || fromLevel.value >= toLevel.value) return []
  return activeHero.value.levels.filter(
    lvl => lvl.lv > fromLevel.value && lvl.lv <= toLevel.value
  )
})

const formatUnlockCondition = (text) => {
  if (!text) return '';
  return text.replace(/([0-9]+)[x×]\s*/g, (match, p1) => {
    if (p1 === '1') return '';
    return p1 + ' ';
  }).replace(/\s*\+\s*/g, ', ');
}

const formatCoreEffect = (text, unlockCondition) => {
  if (!text) return 'Đang cập nhật';
  
  let formattedCondition = formatUnlockCondition(unlockCondition);

  
  const conditionHtml = formattedCondition 
    ? `<br/><span class="text-[#c4774a] font-bold mt-1 inline-block">[Điều kiện]:</span><span class="text-[#a0a5b1] font-normal"> Ra trận ${formattedCondition}.</span>` 
    : '';

  let formatted = text
    .replace(/\[(Cơ bản|Hiệu quả sơ cấp|Basic Effect|Hiệu ứng cơ bản|Basic)\]:?\s*/g, `<span class="text-[#c4774a] font-bold">[Hiệu quả sơ cấp]:</span> `)
    .replace(/\s*\[(Nâng cao|Hiệu quả cao cấp|Advanced Effect|Advanced)\]:?\s*/g, `${conditionHtml}<br/><br/><span class="text-[#c4774a] font-bold">[Hiệu quả cao cấp]:</span> `);
    
  if (formattedCondition && formatted.includes('[Hiệu quả sơ cấp]')) {
    formatted += conditionHtml;
  }
  
  return formatted;
}

const getItemIcon = (itemId, hero) => {
  if (!hero) return '';
  const folder = suffixToFolder[hero.iconSuffix];
  if (!folder) return '';
  
  if (itemId === '0') return ''; // Gold
  
  if (itemId.startsWith('it_215')) {
    const filename = itemId.replace('it_', 'Item_');
    return `/Core_Skill/${folder}/${filename}.png`;
  }

  // Generic items like Tâm Đắc (it_214001) and Ghi Chép (it_214002)
  if (itemId.startsWith('it_214')) {
    const filename = itemId.replace('it_', 'Item_');
    return `/Core_Skill/Items/${filename}.png`;
  }
  
  const item = items[itemId]
  return item?.icon || '';
}

const getMilestoneIcon = (milestoneIconPath, hero) => {
  if (!milestoneIconPath || !hero) return '';
  const folder = suffixToFolder[hero.iconSuffix];
  if (!folder) return milestoneIconPath;
  
  const match = milestoneIconPath.match(/\/([^/]+)\.webp$/);
  if (match) {
    return `/Core_Skill/${folder}/${match[1]}.png`;
  }
  return milestoneIconPath;
}

const getHeroPortrait = (hero) => {
  if (!hero) return '';
  const folder = suffixToFolder[hero.iconSuffix];
  if (!folder) return hero.portrait || '';
  return `/Core_Skill/${folder}/${hero.iconSuffix}_c.png`;
}

const getItemName = (itemId) => {
  const item = items[itemId]
  return item?.vi || `Item ${itemId}`
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
