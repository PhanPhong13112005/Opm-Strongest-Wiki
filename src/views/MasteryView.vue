<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('spec') // 'spec' or 'resources'
const subTab = ref('phe') // 'phe', 'he', 'cap'
const fromTier = ref(0)
const toTier = ref(10)

const bp = ref(40000000)
const tierHe = ref(6)
const tierPhe = ref(6)
const backgear = ref('') // '', 'atk', 'def', 'balanced'

const enemySpecDef = ref(null)
const enemySpecAtk = ref(null)

const selectedChar = ref({
  name: 'Zombieman',
  tier: 'UR+',
  faction: 'Hero',
  type: 'Duelist',
  imageURL: 'zombieman.webp'
})

const supportChar = ref({
  name: 'Tướng hỗ trợ 1',
  tier: '≥ SR',
  awaken: 5,
  color: 'tím'
})

const formatNum = (num) => new Intl.NumberFormat('en-US').format(num)

const getCharacterImage = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/')) return filename
  return new URL(`../assets/characters/${filename}`, import.meta.url).href
}

const specAtk = computed(() => {
  let bgValue = (backgear.value === 'atk' || backgear.value === 'balanced') ? 0.1 : 0
  return Math.floor((0.3 + (tierHe.value * 0.1) + bgValue) * (bp.value || 0)) + 1
})

const specDef = computed(() => {
  let bgValue = (backgear.value === 'def' || backgear.value === 'balanced') ? 0.1 : 0
  return Math.floor((0.3 + (tierPhe.value * 0.1) + bgValue) * (bp.value || 0)) + 1
})

const calcRate = (mySpec, enemySpec) => {
  if (!mySpec || !enemySpec) return { rate: 1.0, diff: 0 }
  const ratio = mySpec / enemySpec
  let clamped = Math.max(0.25, Math.min(ratio, 2.5))
  let diff = Math.round((clamped - 1) * 100)
  return { rate: clamped, diff }
}

const myAtkRate = computed(() => calcRate(specAtk.value, enemySpecDef.value))
const myDefRate = computed(() => calcRate(enemySpecAtk.value, specDef.value))

</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
    <div class="text-center mb-12">
      <h3 class="text-gray-400 uppercase tracking-widest text-xs mb-2">TINH THÔNG · 专精</h3>
      <h1 class="text-4xl font-black text-white mb-2">Tinh Thông</h1>
      <p class="text-gray-400">Hệ Tinh Thông (Arena) — cơ chế và chi phí nâng cấp.</p>
    </div>
    
    <div class="flex justify-center mb-10">
      <div class="flex bg-[#0b0c10] rounded-full border border-gray-800 p-1">
        <button 
          @click="activeTab = 'spec'"
          class="px-8 py-2 rounded-full font-bold transition-colors"
          :class="activeTab === 'spec' ? 'bg-[#1f2833] text-white' : 'text-gray-500 hover:text-white'"
        >
          Spec ATK / DEF
        </button>
        <button 
          @click="activeTab = 'resources'"
          class="px-8 py-2 rounded-full font-bold transition-colors"
          :class="activeTab === 'resources' ? 'bg-[#1f2833] text-white' : 'text-gray-500 hover:text-white'"
        >
          Tài nguyên nâng cấp
        </button>
      </div>
    </div>
    
    <!-- Tab 1: Spec ATK / DEF -->
    <div v-if="activeTab === 'spec'" class="space-y-8">
      <!-- Cơ chế -->
      <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold text-white mb-4">Cơ chế</h2>
        <p class="text-gray-400 mb-6 text-sm leading-relaxed">
          Mỗi tướng có <strong>3 nhánh Tinh Thông cố định</strong> — Phe, Hệ, và Cấp (theo phe phái, hệ, và độ hiếm của tướng). Nâng chúng cho HP/ATK/DEF thẳng <em>và</em> quan trọng hơn là hai chỉ số <strong>Spec</strong> chỉ có tác dụng ở đấu trường.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="border border-gray-700 bg-[#12131a] p-5 rounded-lg flex flex-col justify-center">
            <div class="text-[#00d8b6] font-bold mb-1">Tinh Thông Hệ (Công)</div>
            <div class="text-white font-black mb-1">→ Spec ATK</div>
            <div class="text-gray-500 text-xs">+10% mỗi bậc → 100%</div>
          </div>
          <div class="border border-gray-700 bg-[#12131a] p-5 rounded-lg flex flex-col justify-center">
            <div class="text-[#f5a623] font-bold mb-1">Tinh Thông Phe (Thủ)</div>
            <div class="text-white font-black mb-1">→ Spec DEF</div>
            <div class="text-gray-500 text-xs">+10% mỗi bậc → 100%</div>
          </div>
          <div class="border border-gray-700 bg-[#12131a] p-5 rounded-lg flex flex-col justify-center">
            <div class="text-white font-bold mb-1">Tinh Thông Cấp</div>
            <div class="text-gray-300 font-bold mb-1">→ chỉ stat thẳng</div>
            <div class="text-gray-500 text-xs">không cho % Spec</div>
          </div>
        </div>

        <div class="bg-[#12131a] border border-gray-700 rounded-lg p-4 font-mono text-sm space-y-2">
          <div class="flex flex-col md:flex-row md:items-center gap-2">
            <code class="bg-[#0b0c10] px-3 py-1.5 rounded text-white border border-gray-800 block md:inline-block w-full md:w-auto">Spec ATK = (0.3 + <span class="text-[#00d8b6]">Type upgrade</span>) × BP + 1</code>
            <code class="bg-[#0b0c10] px-3 py-1.5 rounded text-white border border-gray-800 block md:inline-block w-full md:w-auto">Spec DEF = (0.3 + <span class="text-[#f5a623]">Faction upgrade</span>) × BP + 1</code>
          </div>
          <div class="text-gray-500 text-xs mt-2">nền 0.3 · BP = Lực Chiến · số liệu xác minh từ dữ liệu game CN</div>
        </div>
      </div>

      <!-- Công cụ tính -->
      <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold text-white mb-6">Công cụ tính</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="space-y-6">
            <!-- Lực Chiến (BP) -->
            <div>
              <label class="block text-gray-300 font-bold text-sm mb-2">Lực Chiến (BP)</label>
              <input type="text" inputmode="numeric" v-model.number="bp" class="w-full bg-[#12131a] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gray-500 transition-colors" placeholder="0" />
            </div>

            <!-- Tinh Thông Hệ -->
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-gray-300 font-bold text-sm">Tinh Thông Hệ (Công) <em class="text-gray-500 font-normal">→ Spec ATK</em></label>
                <span class="text-[#00d8b6] font-bold">{{ tierHe }}<span class="text-gray-500 text-xs">/10</span></span>
              </div>
              <input type="range" min="0" max="10" step="1" v-model.number="tierHe" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00d8b6]" />
            </div>

            <!-- Tinh Thông Phe -->
            <div>
              <div class="flex justify-between mb-2">
                <label class="text-gray-300 font-bold text-sm">Tinh Thông Phe (Thủ) <em class="text-gray-500 font-normal">→ Spec DEF</em></label>
                <span class="text-[#f5a623] font-bold">{{ tierPhe }}<span class="text-gray-500 text-xs">/10</span></span>
              </div>
              <input type="range" min="0" max="10" step="1" v-model.number="tierPhe" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#f5a623]" />
            </div>
            
            <!-- Backgear -->
            <div>
              <label class="block text-gray-300 font-bold text-sm mb-2">Backgear (背饰)</label>
              <div class="relative">
                <select v-model="backgear" class="w-full bg-[#12131a] border border-gray-700 rounded-lg px-4 py-2.5 text-white appearance-none focus:outline-none focus:border-gray-500 transition-colors cursor-pointer">
                  <option value="">Không có</option>
                  <option value="atk">Backgear Spec-ATK</option>
                  <option value="def">Backgear Spec-DEF</option>
                  <option value="balanced">Backgear cân bằng</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <p class="text-gray-500 text-xs leading-relaxed border-l-2 border-gray-700 pl-3">
              Lưu ý: Tactic Phẫn Nộ/Bình Tĩnh là chỉ số Arena riêng — khuếch đại/phản Spec-ATK khi đánh, KHÔNG cộng vào giá trị Spec-ATK/DEF. Backgear là nguồn cộng thêm duy nhất.
            </p>
          </div>

          <div class="flex flex-col space-y-4">
            <div class="bg-[#12131a] p-5 rounded-lg border border-gray-700 flex flex-col justify-center relative overflow-hidden group hover:border-[#00d8b6]/50 transition-colors">
              <div class="absolute right-0 top-0 bottom-0 w-1 bg-[#00d8b6]"></div>
              <div class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">SPEC ATK</div>
              <div class="text-4xl font-black text-white mb-2">{{ formatNum(specAtk) }}</div>
              <div class="text-gray-500 text-xs font-mono">(0.3 + {{ (tierHe * 0.1 + (backgear === 'atk' || backgear === 'balanced' ? 0.1 : 0)) * 100 }}%) × {{ formatNum(bp || 0) }} + 1</div>
            </div>
            <div class="bg-[#12131a] p-5 rounded-lg border border-gray-700 flex flex-col justify-center relative overflow-hidden group hover:border-[#f5a623]/50 transition-colors">
              <div class="absolute right-0 top-0 bottom-0 w-1 bg-[#f5a623]"></div>
              <div class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">SPEC DEF</div>
              <div class="text-4xl font-black text-white mb-2">{{ formatNum(specDef) }}</div>
              <div class="text-gray-500 text-xs font-mono">(0.3 + {{ (tierPhe * 0.1 + (backgear === 'def' || backgear === 'balanced' ? 0.1 : 0)) * 100 }}%) × {{ formatNum(bp || 0) }} + 1</div>
            </div>
          </div>
        </div>

        <div class="mt-12">
          <h3 class="text-lg font-bold text-white mb-2">Đối đầu ở đấu trường</h3>
          <p class="text-gray-500 text-sm mb-6">
            Sát thương nhân theo tỉ lệ Spec-ATK của bạn / Spec-DEF địch, kẹp trong ×0.25–×2.5. Để ô địch trống hoặc 0 để lấy gương chỉ số của bạn.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-[#12131a] border border-gray-800 rounded-lg p-5">
              <label class="block text-gray-400 text-sm font-bold mb-2">Spec-DEF địch</label>
              <input type="number" min="0" placeholder="36,000,001" v-model.number="enemySpecDef" class="w-full bg-[#0b0c10] border border-gray-700 rounded-lg px-4 py-2.5 text-white mb-4 focus:outline-none focus:border-gray-500" />
              <div class="flex justify-between items-end border-t border-gray-800 pt-4">
                <span class="text-gray-400 text-sm">Bạn gây</span>
                <div class="text-right">
                  <div class="text-2xl font-black" :class="myAtkRate.diff > 0 ? 'text-[#00d8b6]' : myAtkRate.diff < 0 ? 'text-red-400' : 'text-white'">
                    ×{{ myAtkRate.rate.toFixed(2) }}
                  </div>
                  <div class="text-xs" :class="myAtkRate.diff > 0 ? 'text-[#00d8b6]/70' : myAtkRate.diff < 0 ? 'text-red-400/70' : 'text-gray-500'">
                    {{ myAtkRate.diff > 0 ? '+' : '' }}{{ myAtkRate.diff }}%
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-[#12131a] border border-gray-800 rounded-lg p-5">
              <label class="block text-gray-400 text-sm font-bold mb-2">Spec-ATK địch</label>
              <input type="number" min="0" placeholder="36,000,001" v-model.number="enemySpecAtk" class="w-full bg-[#0b0c10] border border-gray-700 rounded-lg px-4 py-2.5 text-white mb-4 focus:outline-none focus:border-gray-500" />
              <div class="flex justify-between items-end border-t border-gray-800 pt-4">
                <span class="text-gray-400 text-sm">Bạn nhận</span>
                <div class="text-right">
                  <div class="text-2xl font-black" :class="myDefRate.diff < 0 ? 'text-[#f5a623]' : myDefRate.diff > 0 ? 'text-red-400' : 'text-white'">
                    ×{{ myDefRate.rate.toFixed(2) }}
                  </div>
                  <div class="text-xs" :class="myDefRate.diff < 0 ? 'text-[#f5a623]/70' : myDefRate.diff > 0 ? 'text-red-400/70' : 'text-gray-500'">
                    {{ myDefRate.diff > 0 ? '+' : '' }}{{ myDefRate.diff }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto rounded-lg border border-gray-800">
            <table class="w-full text-sm text-left text-gray-300">
              <thead class="text-xs text-gray-400 bg-[#12131a] border-b border-gray-800">
                <tr>
                  <th class="px-4 py-3 font-medium">Spec-ATK bạn vs Spec-DEF địch</th>
                  <th class="px-4 py-3 font-medium">combatRate</th>
                  <th class="px-4 py-3 font-medium">Sát thương đấu trường</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800/50 bg-[#0b0c10]">
                <tr>
                  <td class="px-4 py-3">≥ 2.5× cao hơn</td>
                  <td class="px-4 py-3 font-mono">×2.50</td>
                  <td class="px-4 py-3 text-green-400">+150%</td>
                </tr>
                <tr>
                  <td class="px-4 py-3">2× cao hơn</td>
                  <td class="px-4 py-3 font-mono">×2.00</td>
                  <td class="px-4 py-3 text-green-400">+100%</td>
                </tr>
                <tr>
                  <td class="px-4 py-3">bằng nhau</td>
                  <td class="px-4 py-3 font-mono text-gray-500">×1.00</td>
                  <td class="px-4 py-3 text-gray-500">giữ nguyên</td>
                </tr>
                <tr>
                  <td class="px-4 py-3">½</td>
                  <td class="px-4 py-3 font-mono">×0.50</td>
                  <td class="px-4 py-3 text-red-400">−50%</td>
                </tr>
                <tr>
                  <td class="px-4 py-3">≤ ¼ thấp hơn</td>
                  <td class="px-4 py-3 font-mono">×0.25</td>
                  <td class="px-4 py-3 text-red-400">−75%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Những gì tăng -->
      <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold text-white mb-4">Những gì tăng Spec ATK / DEF</h2>
        <ul class="space-y-4 text-sm text-gray-400 pl-4 list-disc marker:text-gray-700">
          <li>
            <strong class="text-white">Lực Chiến (BP)</strong> — hệ số nhân trong công thức, nên MỌI thứ tăng BP đều tăng cả 2 chỉ số Spec: cấp, trang bị, sao/thức tỉnh, core, huy hiệu, đội hình.
          </li>
          <li>
            <strong class="text-[#00d8b6]">Bậc Tinh Thông Hệ (Công)</strong> — nguồn DUY NHẤT của % Spec-ATK (+10%/bậc, tối đa +100%).
          </li>
          <li>
            <strong class="text-[#f5a623]">Bậc Tinh Thông Phe (Thủ)</strong> — nguồn DUY NHẤT của % Spec-DEF (+10%/bậc, tối đa +100%).
          </li>
          <li>
            <strong class="text-white">Thức tỉnh / độ hiếm</strong> — tăng BP và trần Tinh Thông Cấp (stat thẳng), gián tiếp nâng cả 2 chỉ số Spec.
          </li>
          <li>
            <strong class="text-white">Backgear (背饰)</strong> — nguồn cộng % Spec-ATK/DEF thêm DUY NHẤT — cộng vào cùng công thức (loại ATK tối đa +10% ATK, loại DEF tối đa +10% DEF, cân bằng cho cả hai). Đã kiểm chứng in-game.
          </li>
          <li>
            <strong class="text-white">Tactic Phẫn Nộ/Bình Tĩnh</strong> — chỉ số Arena riêng (Phẫn Nộ khuếch đại Spec-ATK khi đánh, Bình Tĩnh phản lại đối thủ) — KHÔNG cộng vào giá trị Spec-ATK/DEF.
          </li>
        </ul>
        <div class="mt-6 border-l-2 border-gray-700 pl-4 py-1 text-sm text-gray-500">
          Tinh Thông vô tác dụng khi đánh quái — chỉ đổi sát thương ở đấu trường. Nó tương đối: Spec-ATK của bạn luôn được so với Spec-DEF của đối thủ cụ thể.
        </div>
      </div>
    </div>
    
    <!-- Tab 2: Tài nguyên nâng cấp -->
    <div v-if="activeTab === 'resources'" class="space-y-6">
      <!-- Character Select Box -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <div class="w-24 h-32 rounded-lg border border-[#ef4444] overflow-hidden relative cursor-pointer hover:scale-105 transition-transform bg-[#0b0c10]">
            <img :src="getCharacterImage(selectedChar.imageURL)" class="w-full h-full object-cover object-top" />
            <div class="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[10px] font-bold text-center py-1 border-t border-[#ef4444]">
              <span class="text-gray-400 mr-1">🔄</span>Đổi tướng
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-black text-white mb-2">{{ selectedChar.name }}</h2>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ selectedChar.tier }}</span>
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ selectedChar.faction }}</span>
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ selectedChar.type }}</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3 bg-[#0b0c10] border border-gray-800 rounded-xl p-4 border-dashed border-[#f97316]/50 cursor-pointer hover:bg-[#12131a] transition-colors">
          <div class="w-8 h-8 rounded bg-[#1f2937] flex items-center justify-center border border-gray-700">
            <span class="text-[#ef4444] font-bold">+</span>
          </div>
          <div>
            <div class="text-white font-bold text-sm">{{ supportChar.name }}</div>
            <div class="text-gray-400 text-xs">Cùng Phe · {{ supportChar.tier }}</div>
            <div class="text-[#eab308] text-xs">→ Thức Tỉnh {{ supportChar.awaken }}★ ({{ supportChar.color }})</div>
          </div>
        </div>
      </div>

      <!-- Sub Tabs -->
      <div class="flex space-x-2 pb-2">
        <button 
          @click="subTab = 'phe'"
          class="flex-1 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 border"
          :class="subTab === 'phe' ? 'bg-[#12131a] border-[#f97316] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <span class="w-5 h-5 rounded-full bg-[#eab308] flex items-center justify-center text-black text-xs font-black">Phe</span>
          <span>Tinh Thông Phe (Thủ)</span>
        </button>
        <button 
          @click="subTab = 'he'"
          class="flex-1 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 border"
          :class="subTab === 'he' ? 'bg-[#12131a] border-[#00d8b6] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <span class="w-5 h-5 rounded-full bg-[#00d8b6] flex items-center justify-center text-white text-xs font-black">Hệ</span>
          <span>Tinh Thông Hệ (Công)</span>
        </button>
        <button 
          @click="subTab = 'cap'"
          class="flex-1 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 border"
          :class="subTab === 'cap' ? 'bg-[#12131a] border-gray-500 text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <span class="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-black">Cấp</span>
          <span>Tinh Thông Cấp</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="bg-[#12131a] border border-gray-800 rounded-lg p-6">
        <div class="flex items-center space-x-3 mb-8 pb-4 border-b border-gray-800">
          <div class="w-10 h-10 rounded-full bg-[#eab308] flex items-center justify-center border-2 border-black"></div>
          <div>
            <h3 class="text-white font-bold text-lg">Tinh Thông Phe (Thủ)</h3>
            <div class="text-[#ef4444] text-xs font-bold">{{ selectedChar.faction }}</div>
          </div>
        </div>

        <!-- Tier Selectors -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div class="text-gray-500 text-xs mb-2">Từ tier</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="fromTier = Math.max(0, fromTier - 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <span class="text-white font-bold text-sm">{{ fromTier === 0 ? 'Chưa mở' : 'Tier ' + fromTier }}</span>
              <button @click="fromTier = Math.min(toTier - 1, fromTier + 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-xs mb-2">Đến tier</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="toTier = Math.max(fromTier + 1, toTier - 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <span class="text-white font-bold text-sm">Tier {{ toTier }}</span>
              <button @click="toTier = Math.min(10, toTier + 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
        </div>

        <!-- Stats Gained -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">CHỈ SỐ TĂNG</h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">ATK</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">0</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">17.220</span>
              </div>
            </div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">DEF</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">0</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">17.220</span>
              </div>
            </div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">HP</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">0</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">103.320</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Materials -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">NGUYÊN LIỆU</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-[#1e3a8a] rounded"></div>
                <div class="text-gray-400 text-[10px] leading-tight">Vật liệu Tinh Thông<br>Phe</div>
              </div>
              <div class="text-white font-bold text-sm mt-1">×11.666</div>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-red-900 rounded"></div>
                <div class="text-gray-400 text-[10px] leading-tight">Chứng chỉ Phe</div>
              </div>
              <div class="text-white font-bold text-sm mt-1">×135</div>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-blue-500 rounded"></div>
                <div class="text-gray-400 text-[10px] leading-tight">Thẻ TT Phe+</div>
              </div>
              <div class="text-white font-bold text-sm mt-1">×92</div>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-blue-400 rounded"></div>
                <div class="text-gray-400 text-[10px] leading-tight">Thẻ TT Phe++</div>
              </div>
              <div class="text-white font-bold text-sm mt-1">×78</div>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-blue-600 rounded"></div>
                <div class="text-gray-400 text-[10px] leading-tight">Thẻ TT Phe</div>
              </div>
              <div class="text-white font-bold text-sm mt-1">×16</div>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center">
              <div class="flex items-center space-x-3 mb-1">
                <div class="w-8 h-8 bg-[#eab308] rounded-full"></div>
                <div class="text-gray-400 text-[10px] leading-tight">Vàng</div>
              </div>
              <div class="text-[#eab308] font-bold text-sm mt-1">×155.000</div>
            </div>
          </div>
        </div>

        <!-- Requirements -->
        <div>
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">ĐIỀU KIỆN</h4>
          <div class="space-y-2">
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 1</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">2★ vàng</strong></li>
                <li>Nhân vật hỗ trợ: Đột Phá <strong class="text-[#eab308]">3★ (vàng)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 2</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">3★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">2★</strong></li>
                <li>Nhân vật hỗ trợ: Đột Phá <strong class="text-[#eab308]">3★ (vàng)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 3</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">3★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">3★</strong></li>
                <li>Nhân vật hỗ trợ: Đột Phá <strong class="text-[#eab308]">4★ (vàng)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 4</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">4★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">3★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">2★ (tím)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 5</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">4★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">4★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">2★ (tím)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 6</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">5★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">4★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">3★ (tím)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 7</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">5★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">5★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">3★ (tím)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 8</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">6★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">5★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">4★ (tím)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 9</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">6★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">6★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">4★ (tím)</strong></li>
              </ul>
            </div>
            <div class="bg-[#0b0c10] border border-gray-800 rounded-lg p-4 flex space-x-4">
              <div class="text-[#ef4444] font-bold text-sm w-12 shrink-0">Tier 10</div>
              <ul class="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>Bản thân đột phá đạt <strong class="text-[#eab308]">7★ vàng</strong></li>
                <li>Huy Hiệu của bản thân đạt <strong class="text-white">6★</strong></li>
                <li>Nhân vật hỗ trợ: Thức Tỉnh <strong class="text-purple-400">5★ (tím)</strong></li>
              </ul>
            </div>
          </div>
          
          <div class="flex justify-center mt-8">
            <button class="px-6 py-2 rounded-full border border-gray-700 bg-[#0b0c10] text-gray-300 font-bold hover:bg-[#1f2937] transition-colors text-sm">
              ⊞ Danh sách tướng
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
