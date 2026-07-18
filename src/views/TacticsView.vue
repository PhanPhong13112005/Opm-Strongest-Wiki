<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import tacticsFallback from '../data/tactics.json'
import { upperRewards, lowerRewards } from '../data/towerRewards.js'
import { getTacticCatalog } from '../services/tacticApi'

const { t, locale } = useI18n()
const activeTab = ref('cards')
const subTabTower = ref('overview')
const tacticCards = ref(tacticsFallback.cards)
const tacticFrames = ref(tacticsFallback.frames)

const loadTactics = async () => {
  try {
    const catalog = await getTacticCatalog(locale.value, tacticsFallback)
    tacticCards.value = catalog.cards
    tacticFrames.value = catalog.frames
  } catch {
    tacticCards.value = tacticsFallback.cards
    tacticFrames.value = tacticsFallback.frames
  }
}

const towerSliders = {
  upper: {
    images: [
      '/Feature/tactics/Crescent_Tower/Up_Crescent/Main.png',
      '/Feature/tactics/Crescent_Tower/Up_Crescent/reward_1.png',
      '/Feature/tactics/Crescent_Tower/Up_Crescent/reward_2.png',
      '/Feature/tactics/Crescent_Tower/Up_Crescent/reward_3.png'
    ],
    index: ref(0)
  },
  lower: {
    images: [
      '/Feature/tactics/Crescent_Tower/Low_Crescent/Main.png',
      '/Feature/tactics/Crescent_Tower/Low_Crescent/reward_1.png',
      '/Feature/tactics/Crescent_Tower/Low_Crescent/reward_2.png',
      '/Feature/tactics/Crescent_Tower/Low_Crescent/reward_3.png'
    ],
    index: ref(0)
  },
  notes: {
    images: [
      '/Feature/tactics/Crescent_Tower/Auto_1.png',
      '/Feature/tactics/Crescent_Tower/Auto_2.png',
      '/Feature/tactics/Crescent_Tower/Monthly_Buff .png'
    ],
    index: ref(0)
  }
}

const activeSlider = computed(() => towerSliders[subTabTower.value])

const nextSliderImage = () => {
  if (activeSlider.value) {
    activeSlider.value.index.value = (activeSlider.value.index.value + 1) % activeSlider.value.images.length
  }
}
const prevSliderImage = () => {
  if (activeSlider.value) {
    activeSlider.value.index.value = (activeSlider.value.index.value - 1 + activeSlider.value.images.length) % activeSlider.value.images.length
  }
}

let sliderInterval = null
onMounted(() => {
  loadTactics()
  sliderInterval = setInterval(() => {
    if (activeTab.value === 'tower' && activeSlider.value && subTabTower.value !== 'overview') {
      nextSliderImage()
    }
  }, 5000)
})
watch(locale, loadTactics)

onUnmounted(() => {
  if (sliderInterval) clearInterval(sliderInterval)
})

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num)

// Frame accents are supplied by JSON/the API. Render the hex value directly so
// their colors do not depend on Tailwind discovering runtime-generated classes.
const frameAccentColor = (frame) => {
  const match = frame?.colorClass?.match(/#[0-9a-f]{6}/i)
  return match?.[0] || '#f8fafc'
}
const frameCardStyle = (frame) => ({ borderLeftColor: frameAccentColor(frame) })
const frameIconStyle = (frame) => ({ backgroundColor: `${frameAccentColor(frame)}1a` })

const rewardCurrentPage = ref(1)

const currentTowerData = computed(() => subTabTower.value === 'upper' ? upperRewards : lowerRewards)

const visibleRewards = computed(() => {
  const start = (rewardCurrentPage.value - 1) * 3
  return currentTowerData.value.slice(start, start + 3)
})
const totalRewardPages = computed(() => Math.ceil(currentTowerData.value.length / 3))

// Pagination logic
const itemsPerPage = 6
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(tacticCards.value.length / itemsPerPage))

const visibleCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return tacticCards.value.slice(start, start + itemsPerPage)
})

const maxRarityTier = rarity => rarity?.tiers?.at(-1) || null
const rarityTextClass = key => key === 'orange'
  ? 'text-orange-400'
  : key === 'purple'
    ? 'text-purple-400'
    : 'text-sky-400'
const scalingValue = (card, value) => card.scaling?.unit === 'flat'
  ? `+${value} ${locale.value === 'vi' ? 'năng lượng' : 'energy'}`
  : `+${value}${card.scaling?.unit || ''}`

// Flat attributes granted by every tactic card when it is equipped.
// The four slots share ATK and differ by their slot-specific secondary ATK.
const equippedSlots = [
  { numeral: 'I', secondary: 'S.ATK' },
  { numeral: 'II', secondary: 'C.ATK' },
  { numeral: 'III', secondary: 'R.ATK' },
  { numeral: 'IV', secondary: 'G.ATK' }
]
const equippedBaseValues = {
  blue: 200,
  purple: 400,
  orange: 800
}

// Modal logic
const selectedCard = ref(null)
const activeRarityTab = ref('orange')
const activeEquippedStar = ref(0)
const zoomedImage = ref(null)
const activeRarity = computed(() => selectedCard.value?.scaling?.rarities?.find(
  rarity => rarity.key === activeRarityTab.value
))
const activeEquippedValue = computed(() => (
  equippedBaseValues[activeRarityTab.value] || 0
) * (activeEquippedStar.value + 1))

const selectRarity = (key) => {
  activeRarityTab.value = key
  const rarity = selectedCard.value?.scaling?.rarities?.find(item => item.key === key)
  activeEquippedStar.value = maxRarityTier(rarity)?.star ?? 0
}

const zoomImage = (src) => {
  zoomedImage.value = src
}

const openModal = (card) => {
  selectedCard.value = card
  if (card.scaling && card.scaling.rarities && card.scaling.rarities.length > 0) {
    selectRarity(card.scaling.rarities[card.scaling.rarities.length - 1].key)
  }
}

const closeModal = () => {
  selectedCard.value = null
}

const tabContainer = ref(null)
const scrollTabs = (direction) => {
  if (tabContainer.value) {
    const scrollAmount = direction === 'left' ? -150 : 150
    tabContainer.value.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-opm-dark pt-24 pb-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Title Section -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 bg-opm-red/10 border border-opm-red/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] text-[#ff1a1a] mb-4">
          <span class="w-2 h-2 rounded-full bg-[#ff1a1a] animate-pulse"></span>
          {{ t('tactics.levelRequired') }}
        </div>
        <h1 class="text-4xl sm:text-5xl font-black uppercase tracking-wider text-white mb-4">
          {{ t('tactics.title') }}
        </h1>
        <p class="max-w-3xl mx-auto text-gray-400 text-sm sm:text-base leading-relaxed">
          {{ t('tactics.desc') }}
        </p>
      </div>

      <!-- Navigation Tabs -->
      <div class="relative mb-10 border-b border-white/5 pb-6">
        <div class="flex items-center">
          <button @click="scrollTabs('left')" class="absolute left-0 z-10 p-1.5 bg-black/80 rounded-full border border-white/10 text-white hover:text-opm-red shadow-[0_0_15px_rgba(0,0,0,0.9)] sm:hidden flex items-center justify-center">
            <svg class="w-4 h-4 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          
          <div ref="tabContainer" class="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 w-full px-8 sm:px-0">
            <button
              @click="activeTab = 'lab'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'lab' ? 'bg-[#ff1a1a] text-white shadow-glow-red' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('tactics.tabLab') }}
            </button>
            <button
              @click="activeTab = 'tower'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'tower' ? 'bg-[#ff1a1a] text-white shadow-glow-red' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('tactics.tabCrescentTower') }}
            </button>
            <button
              @click="activeTab = 'cards'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'cards' ? 'bg-[#ff1a1a] text-white shadow-glow-red' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('tactics.tabCards') }}
            </button>
            <button
              @click="activeTab = 'frames'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'frames' ? 'bg-[#ff1a1a] text-white shadow-glow-red' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('tactics.tabFrames') }}
            </button>
          </div>

          <button @click="scrollTabs('right')" class="absolute right-0 z-10 p-1.5 bg-black/80 rounded-full border border-white/10 text-white hover:text-opm-red shadow-[0_0_15px_rgba(0,0,0,0.9)] sm:hidden flex items-center justify-center">
            <svg class="w-4 h-4 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Details Column -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- TAB 1: LABORATORY -->
          <div v-if="activeTab === 'lab'" class="space-y-6 animate-fade-in">
            <div class="glass-card p-6 sm:p-8">
              <h2 class="text-2xl font-black uppercase tracking-wider text-white mb-6 border-l-4 border-[#ff1a1a] pl-3">
                {{ t('tactics.labRules') }}
              </h2>
              
              <!-- Content VI -->
              <div v-if="locale === 'vi'" class="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">1</span>
                  <span>Phòng Nghiên Cứu gồm <strong>6 Trang Chiến thuật</strong> lớn: <em>Anh Hùng, Quái Nhân, Giác Đấu, Vũ Trang, Công Nghệ, Tâm Linh</em>. Các chỉ số được cộng cho toàn bộ nhân vật thuộc trang đó.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">2</span>
                  <span>Mỗi trang chứa <strong>8 Thẻ Chiến thuật (Tactic Cards)</strong>. Khi ghép đủ 4 Thẻ chiến thuật (phần I, II, III, IV) cùng loại sẽ kích hoạt <strong>Kỹ năng Chiến thuật</strong>.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">3</span>
                  <span>Cấp Sao và Phẩm chất của Kỹ năng được tính theo <strong>Thẻ thấp nhất trong 4 Thẻ</strong>. Khi Kỹ năng đạt đến <strong>Cam 5 Sao</strong>, nó sẽ chuyển hóa thành <strong>Chiến thuật Đặc biệt</strong> tăng mạnh hiệu ứng.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">4</span>
                  <span>Khảm các bộ Thẻ liên quan đạt chất lượng và số lượng yêu cầu để kích hoạt <strong>Kết hợp Chiến thuật</strong> tăng mạnh chỉ số Thưởng. Chỉ số cộng dồn và có hiệu lực cho cả trang.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">5</span>
                  <span>Giới hạn: Chỉ đặt tối đa <strong>1 bộ Chiến thuật cùng loại</strong> trong phòng thí nghiệm. Thăng sao Thẻ chiến thuật tăng mạnh thuộc tính thẻ.</span>
                </p>
              </div>

              <!-- Content EN -->
              <div v-else class="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">1</span>
                  <span>The Lab features <strong>6 Tactic Pages</strong>: <em>Hero, Monster, Duelist, Grappler, Tech, Esper</em>. Attributes apply to all characters under that page.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">2</span>
                  <span>Each page contains <strong>8 Tactic Cards</strong>. Equip parts I, II, III, and IV of the same type to activate the <strong>Tactic Skill</strong>.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">3</span>
                  <span>The Skill level and quality are determined by the <strong>lowest card among the 4 parts</strong>. Reaching <strong>Orange 5 Stars</strong> unlocks <strong>Special Tactics</strong>, boosting effects dramatically.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">4</span>
                  <span>Equip related cards to activate <strong>Tactic Combinations</strong> for massive bonus stats. Different levels stack together.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">5</span>
                  <span>Limit: You can only equip <strong>1 tactic set of the same type</strong>. Ascend Star level to greatly increase stats.</span>
                </p>
              </div>
            </div>

            <!-- Tactic Frame Info Card -->
            <div class="glass-card p-6">
              <h3 class="text-lg font-bold text-white mb-3">
                {{ locale === 'vi' ? 'Khung Chiến Thuật (Tactic Frame)' : 'Tactic Frame' }}
              </h3>
              <p class="text-sm text-gray-400 leading-relaxed">
                {{ locale === 'vi' 
                   ? 'Mỗi phần chiến thuật có thể đặt 1 Khung Chiến Thuật. Khung được đổi từ Cửa Hàng Đổi, giúp tăng chỉ số cho toàn bộ nhân vật thuộc trang chiến thuật đó.'
                   : 'One Tactic Frame can be placed in each section. Frames are acquired from the Exchange Shop and apply attributes to all characters under the current page.' }}
              </p>
            </div>
          </div>

          <!-- TAB 2: CRESCENT TOWER -->
          <div v-if="activeTab === 'tower'" class="space-y-6 animate-fade-in">
            <!-- Tower Sub-tabs -->
            <div class="flex items-center gap-2 border-b border-white/5 pb-4 mb-2 overflow-x-auto custom-scrollbar">
              <button 
                @click="subTabTower = 'overview'" 
                class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                :class="subTabTower === 'overview' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'"
              >
                {{ locale === 'vi' ? 'Tổng Quan' : 'Overview' }}
              </button>
              <button 
                @click="subTabTower = 'upper'" 
                class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                :class="subTabTower === 'upper' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'"
              >
                {{ locale === 'vi' ? 'Tháp Thượng Huyền' : 'Upper Crescent Tower' }}
              </button>
              <button 
                @click="subTabTower = 'lower'" 
                class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                :class="subTabTower === 'lower' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border border-[#ff1a1a]/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'"
              >
                {{ locale === 'vi' ? 'Tháp Hạ Huyền' : 'Lower Crescent Tower' }}
              </button>
              <button 
                @click="subTabTower = 'notes'" 
                class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                :class="subTabTower === 'notes' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'"
              >
                {{ locale === 'vi' ? 'Lưu Ý' : 'Notes' }}
              </button>
            </div>

            <div v-if="subTabTower === 'overview'" class="glass-card p-6 sm:p-8 animate-fade-in">
              <h2 class="text-2xl font-black uppercase tracking-wider text-white mb-6 border-l-4 border-[#ff1a1a] pl-3">
                {{ t('tactics.crescentTowerRules') }}
              </h2>
              
              <!-- Content VI -->
              <div v-if="locale === 'vi'" class="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">1</span>
                  <span><strong>Tháp Trăng Khuyết (Crescent Tower)</strong> là phó bản leo tháp hàng tháng gồm <strong>120 tầng</strong>. Chia làm 2 cấp độ: Tháp Thượng Huyền (Upper) và Tháp Hạ Huyền (Lower) với độ khó tăng dần.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">2</span>
                  <span>Thời gian khiêu chiến là <strong>30 ngày</strong>. Sau 30 ngày, tháp tự động reset tiến độ và phần thưởng để người chơi bắt đầu lại từ đầu. Cả hai độ khó mở đồng thời và cho phép chuyển đổi tự do.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">3</span>
                  <span>Mỗi thử thách thắng tiêu hao <strong>1 Chìa khóa</strong>, khiêu chiến thua không mất chìa. Người chơi nhận được <strong>6 chìa/ngày</strong>, tối đa tích lũy <strong>120 chìa/tháng</strong>.</span>
                </p>
                <p class="flex items-start gap-3 text-[#ff1a1a] font-bold">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a] font-sans">!</span>
                  <span>Quy tắc chia 2 Trận (Bắt buộc chiến thắng cả 2 trận mới qua ải):<br/>
                    - Trận 1: Cấm Quái Nhân (Monster) và Tội Phạm (Outlaw) ra trận.<br/>
                    - Trận 2: Cấm Anh Hùng (Hero) và Võ Thuật (Martial Artist) ra trận.
                  </span>
                </p>
              </div>

              <!-- Content EN -->
              <div v-else class="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">1</span>
                  <span><strong>Crescent Tower</strong> is a monthly tower challenge with <strong>120 floors</strong>. It is divided into Upper and Lower difficulty.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">2</span>
                  <span>The challenge cycle lasts <strong>30 days</strong>. Afterwards, progress and rewards reset. Both difficulties open simultaneously; you can switch between them freely.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a]">3</span>
                  <span>Each successful clear consumes <strong>1 Key</strong>. Keys are not consumed on failure. Get <strong>6 keys daily</strong>, up to a monthly maximum of <strong>120 keys</strong>.</span>
                </p>
                <p class="flex items-start gap-3 text-opm-red font-bold">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 flex items-center justify-center text-xs font-bold text-[#ff1a1a] font-sans">!</span>
                  <span>2-Battle Restriction Rules (Must win both battles to pass):<br/>
                    - Battle 1: Monsters and Outlaws are banned.<br/>
                    - Battle 2: Heroes and Martial Artists are banned.
                  </span>
                </p>
              </div>
            </div>

            <div v-if="subTabTower === 'upper' || subTabTower === 'lower'">
              <!-- Tower Tip Card -->
              <div class="border border-opm-red/20 bg-opm-red/5 p-4 rounded-lg flex gap-3">
                <svg class="w-5 h-5 text-opm-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <h4 class="text-sm font-bold text-opm-red mb-1">
                    {{ locale === 'vi' ? 'Mẹo Leo Tháp:' : 'Tower Tips:' }}
                  </h4>
                  <p class="text-xs text-gray-400 leading-relaxed">
                    {{ locale === 'vi'
                       ? 'Do cơ chế chia 2 Trận cấm nghiêm ngặt phe phái (Trận 1 dùng phe Anh Hùng/Võ Thuật, Trận 2 dùng phe Quái Nhân/Tội Phạm), bạn cần chuẩn bị ít nhất 2 đội hình mạnh mẽ cân bằng cho cả 2 chiến tuyến.'
                       : 'Due to the strict faction bans in the 2-Battle mechanism (Battle 1: Hero/Martial Artist, Battle 2: Monster/Outlaw), you must build at least 2 strong, well-balanced rosters for both sides.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Notes Section -->
            <div v-if="subTabTower === 'notes'" class="border border-orange-500/20 bg-orange-500/5 p-5 rounded-xl space-y-4 animate-fade-in">
              <h4 class="text-base font-bold text-orange-400 border-b border-orange-500/20 pb-2">
                {{ locale === 'vi' ? 'Lưu ý khi leo Tháp Trăng Khuyết' : 'Crescent Tower Notes' }}
              </h4>
              <ul class="space-y-3 text-sm text-gray-300">
                <li class="flex items-start gap-3">
                  <span class="text-orange-500 mt-0.5"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></span>
                  <span>{{ locale === 'vi' ? 'Có thể sử dụng Càn Quét (Auto) để quét ải nhanh và bạn có thể X ra mà không bị hủy (trừ khi thoát game)' : 'Auto-clear allows fast sweeping, and you can close the window without cancelling it (unless you exit the game)' }}</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-orange-500 mt-0.5"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></span>
                  <span>{{ locale === 'vi' ? 'Buff Hàng Tháng (Monthly Buff) sẽ thay đổi mỗi kỳ mà quái nhận được, Hãy tận dụng những buff cùi để win ải nhé.' : 'Monthly Buffs given to enemies change each season. Take advantage of weak buffs to clear stages.' }}</span>
                </li>
              </ul>
            </div>

            <!-- Tower Rewards -->
            <div v-if="subTabTower === 'upper' || subTabTower === 'lower'" class="border border-[#e8c37a]/30 bg-[#e8c37a]/10 p-4 rounded-lg mt-6 animate-fade-in">
              <div class="flex items-center justify-between mb-3 border-b border-[#e8c37a]/20 pb-2">
                <h4 class="text-sm font-bold text-[#e8c37a] flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                  {{ locale === 'vi' ? 'Phần Thưởng' : 'Rewards' }}
                </h4>
                
                <!-- Pagination Controls -->
                <div class="flex items-center gap-3 text-xs font-bold">
                  <button @click="rewardCurrentPage > 1 && rewardCurrentPage--" :disabled="rewardCurrentPage === 1" class="px-3 py-1 bg-[#e8c37a]/20 text-[#e8c37a] rounded-lg disabled:opacity-30 hover:bg-[#e8c37a]/30 transition-colors">&lt;</button>
                  <span class="text-gray-300 bg-black/30 px-3 py-1 rounded-full">{{ rewardCurrentPage }} / {{ totalRewardPages }}</span>
                  <button @click="rewardCurrentPage < totalRewardPages && rewardCurrentPage++" :disabled="rewardCurrentPage === totalRewardPages" class="px-3 py-1 bg-[#e8c37a]/20 text-[#e8c37a] rounded-lg disabled:opacity-30 hover:bg-[#e8c37a]/30 transition-colors">&gt;</button>
                </div>
              </div>

              <transition name="fade" mode="out-in">
                <div :key="rewardCurrentPage" class="space-y-3 mt-1 text-sm custom-scrollbar max-h-[320px] overflow-y-auto pr-1">
                  <div v-for="reward in visibleRewards" :key="reward.stage" class="bg-black/20 p-3 rounded-lg border border-[#e8c37a]/10 hover:border-[#e8c37a]/30 transition-colors">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="px-2 py-0.5 rounded bg-[#e8c37a]/20 text-[#e8c37a] font-bold text-xs uppercase">{{ locale === 'vi' ? 'Vượt ải' : 'Stage' }} {{ reward.stage }}</span>
                    </div>
                    <ul class="space-y-2.5 text-gray-300 ml-2 border-l-2 border-[#e8c37a]/30 pl-4 py-1">
                      <li v-for="(item, idx) in reward.items" :key="idx" class="flex items-start gap-2">
                        <span :class="`${item.class} mt-0.5 text-lg leading-none`">•</span>
                        <span>
                          <b :class="item.class">{{ item.name[locale] }}</b> 
                          <br v-if="item.desc" class="sm:hidden"/>
                          <span v-if="item.desc" class="text-xs text-gray-400 ml-1">{{ item.desc[locale] }}</span>
                          <span v-if="item.count" class="text-xs font-bold text-white bg-white/10 px-1.5 py-0.5 rounded ml-2">x{{ item.count }}</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- TAB 3: CARDS -->
          <div v-if="activeTab === 'cards'" class="space-y-6 animate-fade-in">
            <div class="rounded-xl border border-[#e8c37a]/25 bg-[#e8c37a]/5 px-4 py-3 text-sm text-gray-300">
              {{ locale === 'vi'
                ? 'Mỗi thẻ hiển thị chỉ số tối đa theo phẩm chất. Nhấn vào thẻ để xem đầy đủ chỉ số của từng sao.'
                : 'Each card shows its maximum stat by rarity. Select a card to view the complete stat table for every star.' }}
            </div>
            <transition name="fade" mode="out-in">
              <div :key="currentPage" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                <div v-for="card in visibleCards" :key="card.id" 
                     @click="openModal(card)"
                     class="glass-card group relative p-3 sm:p-4 rounded-xl flex flex-col items-center justify-start text-center border border-white/5 hover:border-opm-red/50 transition-colors cursor-pointer">
                  <div class="relative shrink-0 w-3/5 max-w-[124px] mb-3 transition-transform group-hover:scale-105 duration-300">
                    <img src="/Feature/tactics/pic_zsk_ka_01.png" alt="Tactic Frame" class="w-full h-auto object-contain drop-shadow-lg" />
                    <span class="absolute left-[49.5%] top-1/2 block aspect-square w-[77%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
                      <img :src="`/Feature/tactics/Card/${card.icon}`" :alt="card.name[locale]" class="h-full w-full object-cover" />
                    </span>
                  </div>
                  <div class="font-black uppercase tracking-wide text-white text-sm sm:text-base mb-1">{{ card.name[locale] }}</div>
                  <div class="text-xs text-gray-500 font-bold mb-2">{{ card.count }} {{ locale === 'vi' ? 'thẻ' : 'cards' }}</div>
                  <div class="text-xs text-gray-300 leading-relaxed">{{ card.eff[locale] }}</div>
                  <div v-if="card.scaling?.rarities?.length" class="mt-3 grid w-full grid-cols-3 gap-1.5 border-t border-white/10 pt-3">
                    <div
                      v-for="rarity in card.scaling.rarities"
                      :key="rarity.key"
                      class="rounded-lg border border-white/5 bg-black/20 px-1.5 py-2"
                    >
                      <div class="text-[10px] font-black uppercase tracking-wide" :class="rarityTextClass(rarity.key)">
                        {{ locale === 'vi' ? rarity.name_vi : rarity.name_en }}
                      </div>
                      <template v-if="maxRarityTier(rarity)">
                        <div class="mt-1 text-[10px] text-gray-500">★{{ maxRarityTier(rarity).star }}</div>
                        <div class="text-xs font-black text-white">{{ scalingValue(card, maxRarityTier(rarity).value) }}</div>
                      </template>
                    </div>
                  </div>
                  <div class="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#e8c37a]/70">
                    {{ locale === 'vi' ? 'Nhấn để xem từng sao' : 'Select for every star' }}
                  </div>
                </div>
              </div>
            </transition>
            
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
              <button @click="currentPage--" :disabled="currentPage === 1" class="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              
              <button v-for="page in totalPages" :key="page" 
                      @click="currentPage = page"
                      class="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors font-bold text-sm"
                      :class="currentPage === page ? 'border-opm-red bg-opm-red/20 text-opm-red' : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'">
                {{ page }}
              </button>

              <button @click="currentPage++" :disabled="currentPage === totalPages" class="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>

          <!-- TAB 4: FRAMES -->
          <div v-if="activeTab === 'frames'" class="space-y-6 animate-fade-in">
            <div class="glass-card p-6 sm:p-8 mb-6 border-l-4 border-[#e8c37a]">
              <h3 class="text-lg font-black uppercase tracking-wider text-[#e8c37a] mb-2">
                {{ locale === 'vi' ? 'Viền Thẻ' : 'Tactic Frames' }}
              </h3>
              <p class="text-sm text-gray-400 leading-relaxed">
                {{ locale === 'vi' 
                   ? 'Viền thẻ là khung cố định, cộng thẳng Máu/Phòng thủ (không phải %), chồng lên hiệu ứng thẻ. Bậc cao hơn thì mạnh hơn. Khung không nâng sao; chỉ thẻ bên trong mới tốn tài nguyên nâng sao.'
                   : 'Frames provide flat HP/DEF bonuses (not %), stacking with card effects. Higher tiers give more stats. Frames cannot be upgraded; only the socketed card uses upgrade materials.' }}
              </p>
            </div>
            
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="frame in tacticFrames" :key="frame.id" class="glass-card flex items-center gap-3 rounded-lg border-l-2 p-3 sm:p-4 transition-colors hover:bg-white/5" :style="frameCardStyle(frame)">
                <div class="rounded-md p-1" :style="frameIconStyle(frame)">
                  <img :src="`/Feature/tactics/Card border/${frame.icon}`" :alt="frame.name" class="w-10 h-10 shrink-0 object-contain" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-black text-sm uppercase tracking-wider" :style="{ color: frameAccentColor(frame) }">
                    {{ locale === 'vi' ? frame.name.replace('Standard', 'Tiêu Chuẩn').replace('Exquisite', 'Tinh Xảo').replace('Treasured', 'Trân Bảo').replace('Custom', 'Cao Cấp') : frame.name }}
                  </div>
                  <div class="mt-1 flex gap-3 text-xs tracking-wide">
                    <span class="text-gray-400">HP <b class="font-bold text-white">+{{ formatNumber(frame.hp) }}</b></span>
                    <span class="text-gray-400">DEF <b class="font-bold text-white">+{{ formatNumber(frame.def) }}</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Right: Main Illustration Column -->
        <div class="lg:col-span-5 space-y-6">
          <transition name="fade" mode="out-in">
            <div :key="activeTab + '-' + subTabTower" class="glass-card p-6 sticky top-24">
              <h3 class="text-lg font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-opm-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {{ locale === 'vi' ? 'Minh Họa Tính Năng' : 'Feature Illustration' }}
              </h3>
              
              <div class="space-y-4">
                <img v-if="activeTab === 'tower' && subTabTower === 'overview'" src="/Feature/tactics/Crescent_Tower/Main.png" @click="zoomImage('/Feature/tactics/Crescent_Tower/Main.png')" class="w-full rounded-lg border border-white/10 shadow-glow-red hover:scale-[1.01] transition-transform duration-300 cursor-pointer" alt="Crescent Tower Overview UI" />
                <!-- Minh họa Tab Thượng, Hạ, Lưu Ý (Slider chung) -->
                <div v-else-if="activeTab === 'tower' && activeSlider" class="relative w-full aspect-[4/3] rounded-lg overflow-hidden group border border-white/10 shadow-glow-red bg-black/50">
                  <div class="absolute inset-0 w-full h-full">
                    <img v-for="(img, idx) in activeSlider.images" :key="img"
                         :src="img" @click="zoomImage(img)" 
                         class="w-full h-full object-contain cursor-pointer transition-opacity duration-700 absolute inset-0" 
                         :class="activeSlider.index.value === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'"
                         alt="Tower UI" />
                  </div>
                  
                  <!-- Nút Phóng to ảnh -->
                  <button @click.stop="zoomImage(activeSlider.images[activeSlider.index.value])" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-lg opacity-50 hover:opacity-100 transition-opacity hover:bg-opm-red z-20 shadow-lg border border-white/20" title="Phóng to">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  </button>

                  <!-- Nút Previous -->
                  <button @click.stop="prevSliderImage" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full opacity-50 hover:opacity-100 transition-opacity hover:bg-opm-red z-20 shadow-lg border border-white/20">
                    <svg class="w-5 h-5 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  
                  <!-- Nút Next -->
                  <button @click.stop="nextSliderImage" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full opacity-50 hover:opacity-100 transition-opacity hover:bg-opm-red z-20 shadow-lg border border-white/20">
                    <svg class="w-5 h-5 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                  
                  <!-- Dots -->
                  <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    <button v-for="(_, idx) in activeSlider.images" :key="idx" @click.stop="activeSlider.index.value = idx"
                            :class="activeSlider.index.value === idx ? 'bg-opm-red w-4' : 'bg-white/50 w-2 hover:bg-white'"
                            class="h-2 rounded-full transition-all duration-300 shadow-sm"></button>
                  </div>
                </div>

                <img v-else src="/Feature/tactics/Main.png" @click="zoomImage('/Feature/tactics/Main.png')" class="w-full rounded-lg border border-white/10 shadow-glow-red hover:scale-[1.01] transition-transform duration-300 cursor-pointer" alt="Tactics System UI" />
                <p class="text-xs text-gray-500 text-center leading-relaxed">
                  {{ locale === 'vi' 
                     ? (activeTab === 'tower' ? 'Giao diện leo tháp Trăng Khuyết trong game. (Nhấn vào ảnh để phóng to)' : 'Giao diện chính Phòng Nghiên Cứu Chiến thuật trong game với các ô khảm thẻ chiến thuật. (Nhấn vào ảnh để phóng to)') 
                     : (activeTab === 'tower' ? 'Crescent Tower challenge interface in-game. (Click to zoom)' : 'Main Tactic Research Lab system interface in-game with tactic card socket slots. (Click to zoom)') }}
                </p>
              </div>
            </div>
          </transition>
        </div>

      </div>
    </div>
    
    <!-- Modal Chi Tiết Thẻ -->
    <transition name="fade-fast">
      <div v-if="selectedCard" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" @click.self="closeModal">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeModal"></div>
        <div class="tactic-detail-modal relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/10 shadow-2xl pointer-events-auto glass-card">
          <!-- Modal Header -->
          <div class="sticky top-0 z-10 bg-[#11131a]/90 backdrop-blur-md p-4 sm:p-6 border-b border-white/10 flex items-center gap-4">
            <button @click="closeModal" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div class="relative shrink-0 w-20 sm:w-24">
              <img src="/Feature/tactics/pic_zsk_ka_01.png" alt="Frame" class="w-full h-auto object-contain drop-shadow-lg" />
              <span class="absolute left-[49.5%] top-1/2 block aspect-square w-[77%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
                <img :src="`/Feature/tactics/Card/${selectedCard.icon}`" alt="Icon" class="h-full w-full object-cover" />
              </span>
            </div>
            
            <div>
              <h2 class="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mb-1">{{ selectedCard.name[locale] }}</h2>
              <p class="text-xs sm:text-sm text-gray-400 font-bold mb-1">{{ selectedCard.count }} {{ locale === 'vi' ? 'thẻ tối đa' : 'max cards' }}</p>
              <p class="text-sm text-opm-red font-bold">{{ selectedCard.eff[locale] }}</p>
            </div>
          </div>
          
          <!-- Modal Body: Mảng Scaling (Dạng Tab) -->
          <div class="p-4 sm:p-6 space-y-4">
            <h3 class="text-lg font-black uppercase text-[#e8c37a] border-l-4 border-[#e8c37a] pl-3">
              {{ locale === 'vi' ? 'Chỉ số nâng cấp sao' : 'Star Upgrade Stats' }}
            </h3>
            
            <div v-if="selectedCard.scaling && selectedCard.scaling.rarities" class="space-y-4">
              <!-- Tabs Header -->
              <div class="flex gap-2 border-b border-white/10 pb-2">
                <button v-for="rarity in selectedCard.scaling.rarities" :key="rarity.key"
                        @click="selectRarity(rarity.key)"
                        class="px-5 py-2 rounded-t-lg font-bold text-sm uppercase transition-colors border-b-2"
                        :class="[
                          activeRarityTab === rarity.key 
                            ? (rarity.key === 'orange' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : rarity.key === 'purple' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-blue-500 text-blue-400 bg-blue-500/10')
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        ]">
                  {{ locale === 'vi' ? rarity.name_vi : rarity.name_en }}
                </button>
              </div>

              <!-- Flat stats granted while the four tactic-card slots are equipped -->
              <section class="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
                <div class="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h4 class="text-sm font-black uppercase tracking-wider text-white">
                      {{ locale === 'vi' ? 'Chỉ số khi lắp' : 'Equipped Stats' }}
                    </h4>
                    <p class="mt-1 text-xs text-gray-500">
                      {{ locale === 'vi' ? 'Chọn cấp sao để xem chỉ số khi lắp tương ứng.' : 'Choose a star level to view its equipped stats.' }}
                    </p>
                  </div>
                  <select
                    v-model.number="activeEquippedStar"
                    class="rounded-lg border border-yellow-400/25 bg-[#11131a] px-3 py-2 text-sm font-black text-yellow-300 outline-none transition focus:border-yellow-300"
                    :aria-label="locale === 'vi' ? 'Chọn cấp sao' : 'Choose star level'"
                  >
                    <option v-for="tier in activeRarity?.tiers || []" :key="tier.star" :value="tier.star">
                      ★{{ tier.star }}
                    </option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <article
                    v-for="slot in equippedSlots"
                    :key="slot.numeral"
                    class="rounded-lg border bg-[#0b0d13] p-2.5"
                    :class="activeRarityTab === 'orange' ? 'border-orange-500/30' : activeRarityTab === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30'"
                  >
                    <div class="mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
                      <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                        <img :src="`/Feature/tactics/Card/${selectedCard.icon}`" alt="" class="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div class="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">
                          {{ locale === 'vi' ? 'Vị trí' : 'Slot' }}
                        </div>
                        <div class="font-black" :class="rarityTextClass(activeRarityTab)">{{ slot.numeral }}</div>
                      </div>
                    </div>
                    <dl class="space-y-1 text-xs tabular-nums">
                      <div class="flex items-center justify-between gap-2">
                        <dt class="text-gray-400">ATK</dt>
                        <dd class="font-black text-sky-400">+{{ formatNumber(activeEquippedValue) }}</dd>
                      </div>
                      <div class="flex items-center justify-between gap-2">
                        <dt class="text-gray-400">{{ slot.secondary }}</dt>
                        <dd class="font-black text-sky-400">+{{ formatNumber(activeEquippedValue) }}</dd>
                      </div>
                    </dl>
                  </article>
                </div>
              </section>

              <!-- Tab Body -->
              <div v-for="rarity in selectedCard.scaling.rarities" :key="rarity.key" 
                   v-show="activeRarityTab === rarity.key" 
                   class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  
                  <!-- Tiers -->
                  <div v-for="tier in rarity.tiers" :key="tier.star" 
                       class="glass-card flex flex-col items-center justify-center p-4 text-center border transition-transform hover:scale-105" 
                       :class="rarity.key === 'orange' ? 'border-orange-500/30' : rarity.key === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30'">
                     <div class="flex items-center gap-1 mb-2 bg-black/40 px-2 py-0.5 rounded-full">
                        <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <span class="font-bold text-white text-base">{{ tier.star }}</span>
                     </div>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mb-1">{{ locale === 'vi' ? selectedCard.scaling.label_vi : selectedCard.scaling.label_en }}</span>
                     <span class="font-black text-xl"
                           :class="rarity.key === 'orange' ? 'text-orange-400' : rarity.key === 'purple' ? 'text-purple-400' : 'text-blue-400'">
                        +{{ tier.value }}{{ selectedCard.scaling.unit === 'flat' ? (locale === 'vi' ? ' năng lượng' : ' energy') : selectedCard.scaling.unit }}
                     </span>
                  </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </transition>

    <!-- Modal Zoom Ảnh -->
    <transition name="fade">
      <div v-if="zoomedImage" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" @click="zoomedImage = null">
        <div class="relative max-w-[90vw] max-h-[90vh] flex justify-center items-center">
          <img :src="zoomedImage" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10" @click.stop />
          <button @click="zoomedImage = null" class="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-colors border-2 border-white/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.glass-card {
  background: rgba(17, 19, 26, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  overflow: hidden;
}

.tactic-detail-modal {
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}
</style>
