<script setup>
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const activeTab = ref('overview')
const showSummary = ref(false)

const tabContainer = ref(null)
const scrollTabs = (direction) => {
  if (tabContainer.value) {
    const scrollAmount = direction === 'left' ? -150 : 150
    tabContainer.value.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }
}

// Image Modal State
const isImageModalOpen = ref(false)
const selectedImageForModal = ref('')
const openImageModal = (imageUrl) => {
  selectedImageForModal.value = imageUrl
  isImageModalOpen.value = true
}

// Mirage Trial Data
const mirageData = [
  { stage: '5', itemVi: 'Cục tím Anh Hùng', itemEn: 'Hero Purple Core' },
  { stage: '20', itemVi: 'Cục vàng (Trên)', itemEn: 'Gold Core (Top)' },
  { stage: '40', itemVi: 'Cục vàng (Dưới)', itemEn: 'Gold Core (Bottom)' },
  { stage: '65', itemVi: 'Cục cầu vồng', itemEn: 'Rainbow Core', image: '/Feature/medals/Mirage_trial/ai_65.png' },
  { stage: '90', itemVi: 'Cục cầu vồng', itemEn: 'Rainbow Core', image: '/Feature/medals/Mirage_trial/ai_90.png' }
]

// Emblem Ultimate Skills Data
const emblemSkillsData = [
  // Ultimate Emblems
  {
    id: 'eternal_heart',
    nameVi: 'Trái Tim Vĩnh Hằng', nameEn: 'Eternal Heart',
    type: 'Passive',
    inlay: 2,
    enhance: [
      { level: 1, descVi: 'Tất cả tăng 5% tấn công', descEn: 'All allies ATK +5%' },
      { level: 2, descVi: 'Tất cả tăng 5% tỉ lệ chí mạng', descEn: 'All allies CRIT Rate +5%' },
      { level: 3, descVi: 'Tất cả tăng 5% tấn công', descEn: 'All allies ATK +5%' },
      { level: 4, descVi: 'Tất cả tăng 5% sát thương chí mạng', descEn: 'All allies CRIT DMG +5%' }
    ],
    ascend: [
      { star: 1, descVi: 'Tất cả tăng 10% tấn công', descEn: 'All allies ATK +10%' },
      { star: 2, descVi: 'Tất cả tăng 8% tỉ lệ chí mạng', descEn: 'All allies CRIT Rate +8%' },
      { star: 3, descVi: 'Tất cả tăng 10% tấn công', descEn: 'All allies ATK +10%' },
      { star: 4, descVi: 'Tất cả tăng 15% sát thương chí mạng', descEn: 'All allies CRIT DMG +15%' },
      { star: 5, descVi: 'Tất cả tăng 10% tỉ lệ trúng', descEn: 'All allies Effect Hit +10%' }
    ]
  },
  {
    id: 'sharp_blade',
    nameVi: 'Lưỡi Kiếm Sắc Bén', nameEn: 'Sharp Blade',
    type: 'Passive',
    inlay: 2,
    enhance: [
      { level: 1, descVi: 'Tất cả tăng 5% tấn công', descEn: 'All allies ATK +5%' },
      { level: 2, descVi: 'Tất cả tăng 3% tỉ lệ chí mạng', descEn: 'All allies CRIT Rate +3%' },
      { level: 3, descVi: 'Tất cả tăng 5% tấn công', descEn: 'All allies ATK +5%' },
      { level: 4, descVi: 'Tất cả tăng 8% sát thương chí mạng', descEn: 'All allies CRIT DMG +8%' }
    ],
    ascend: [
      { star: 1, descVi: 'Tất cả tăng 10% tấn công', descEn: 'All allies ATK +10%' },
      { star: 2, descVi: 'Tất cả tăng 8% tỉ lệ chí mạng', descEn: 'All allies CRIT Rate +8%' },
      { star: 3, descVi: 'Tất cả tăng 10% tấn công', descEn: 'All allies ATK +10%' },
      { star: 4, descVi: 'Tất cả tăng 15% sát thương chí mạng', descEn: 'All allies CRIT DMG +15%' },
      { star: 5, descVi: 'Tất cả tăng 10% tỉ lệ trúng', descEn: 'All allies Hit +10%' }
    ]
  },
  // Passive & Active Emblems
  {
    id: 'undying_shield',
    nameVi: 'Khiên Bất Tử', nameEn: 'Undying Shield',
    type: 'Passive',
    inlay: 3,
    skillEffectVi: 'Tạo Khiên Bất Tử cho 1 đồng minh ngẫu nhiên hàng trước. Kích hoạt 2 lần mỗi trận.',
    skillEffectEn: 'Grants Undying Shield to 1 random ally in the front row. Triggers twice per battle.',
    enhance: [
      { level: 1, descVi: 'Tạo Khiên Bất Tử cho 1 đồng minh ngẫu nhiên hàng trước. Kích hoạt 2 lần mỗi trận.', descEn: 'Grants Undying Shield to 1 random ally in the front row. Triggers twice per battle.' },
      { level: 2, descVi: 'Tạo Độ Bền cho hàng trước bằng 20% HP tối đa.', descEn: 'Grants Tenacity to the front row by 20% max HP.' },
      { level: 3, descVi: 'Tạo Khiên Bất Tử cho toàn đội.', descEn: 'Grants Undying Shield to all allies.' },
      { level: 4, descVi: 'Tạo Khiên Bất Tử 4 lần cho mỗi đồng minh.', descEn: 'Grants Undying Shield 4 times for every ally.' }
    ],
    ascend: [
      { star: 1, descVi: 'Nhận hiệu ứng Siêu Bất Khuất (Khiên Xanh) khi chịu ST chí mạng. Hồi 20% HP Tối đa. Kích hoạt 1 lần mỗi nhân vật.', descEn: 'Gain Specialized Unyielding when taking fatal damage. Recovers 20% Max HP. Triggers once per character.' },
      { star: 2, descVi: 'Hồi 20% HP Tối đa. Nhận 20% Miễn ST trong trạng thái Siêu Bất Khuất (Khiên Xanh).', descEn: 'Recovers 20% Max HP. Gain 20% DMG Free during Specialized Unyielding.' },
      { star: 3, descVi: 'Hồi 40% HP Tối đa. Nhận 20% Miễn ST trong trạng thái Siêu Bất Khuất (Khiên Xanh).', descEn: 'Recovers 40% Max HP. Gain 20% DMG Free.' },
      { star: 4, descVi: 'Hồi 40% HP Tối đa. Nhận 40% Miễn ST trong trạng thái Siêu Bất Khuất (Khiên Xanh).', descEn: 'Recovers 40% Max HP. Gain 40% DMG Free.' },
      { star: 5, descVi: 'Hồi 40% HP Tối đa. Nhận 40% Miễn ST. Kích hoạt 2 lần mỗi nhân vật.', descEn: 'Recovers 40% Max HP. Gain 40% DMG Free. Triggers twice per character.' }
    ]
  },
  {
    id: 'distorted_field',
    nameVi: 'Trường Lực Bóp Méo', nameEn: 'Distorted Field',
    type: 'Active',
    inlay: 3,
    skillEffectVi: 'Gây Sát Thương Huy Chương bằng 200% ATK trung bình đội hình lên 1 kẻ địch ngẫu nhiên. Tiêu hao 1000 NL, kích hoạt 1 lần.',
    skillEffectEn: 'Deals Emblem DMG by 200% of average team ATK to a random enemy. Costs 1000 Energy, triggers once per battle.',
    enhance: [
      { level: 1, descVi: 'Gây ST Huy Chương bằng 200% ATK trung bình lên 1 kẻ địch ngẫu nhiên.', descEn: 'Deals Emblem DMG by 200% of average team ATK to a random enemy.' },
      { level: 2, descVi: 'Sát Thương Huy Chương có 50% tỉ lệ Bạo kích.', descEn: 'Emblem DMG has a 50% CRIT chance.' },
      { level: 3, descVi: 'Tăng mục tiêu chịu Sát Thương Huy Chương lên 4.', descEn: 'Increases targets of Emblem DMG to 4.' },
      { level: 4, descVi: 'Kích hoạt Trường Lực Bóp Méo 2 lần mỗi trận.', descEn: 'Releases Distorted Field twice per battle.' }
    ],
    ascend: [
      { star: 1, descVi: 'Gây 1 tầng Trường Lực bằng 380% ATK lên 4 kẻ địch (Có thể bạo kích). Biến mất sau 3 lần.', descEn: 'Inflict 1 layer of Specialized Field equal to 380% ATK to 4 random enemies. Disappears after 3 times.' },
      { star: 2, descVi: 'Gây 1 tầng bằng 380% ATK lên 5 kẻ địch. Gây thêm Đặc Hóa Suy Yếu (Giảm 40% ST gây ra trong 2 hiệp).', descEn: 'Inflict to 5 enemies. Additionally inflicts Specialized Disabled (Reduces DMG Rate by 40% for 2 rounds).' },
      { star: 3, descVi: 'Gây 1 tầng bằng 760% ATK lên 4 kẻ địch.', descEn: 'Inflict 1 layer equal to 760% ATK to 4 random enemies.' },
      { star: 4, descVi: 'Gây 1 tầng bằng 760% ATK lên 5 kẻ địch. Biến mất sau 4 lần.', descEn: 'Inflict 1 layer equal to 760% ATK to 5 random enemies. Disappears after 4 times.' },
      { star: 5, descVi: 'Gây 1 tầng bằng 1140% ATK lên 6 kẻ địch. Biến mất sau 5 lần.', descEn: 'Inflict 1 layer equal to 1140% ATK to 6 random enemies. Disappears after 5 times.' }
    ]
  },
  {
    id: 'wall_sanctuary',
    nameVi: 'Tường Thánh Điện', nameEn: 'Wall of Sanctuary',
    type: 'Passive',
    inlay: 2,
    skillEffectVi: 'ATK toàn đội +5%',
    skillEffectEn: 'Team ATK +5%',
    enhance: [
      { level: 1, descVi: 'Tất cả tăng 5% ATK', descEn: 'All ATK +5%' },
      { level: 2, descVi: 'Tất cả tăng 6% tỉ lệ chí mạng', descEn: 'All CRIT +6%' },
      { level: 3, descVi: 'Tất cả tăng 5% HP', descEn: 'All HP +5%' },
      { level: 4, descVi: 'Tất cả tăng 8% Miễn ST không chí mạng', descEn: 'All Non-Crit DMG Free +8%' }
    ],
    ascend: [
      { star: 1, descVi: 'Tất cả tăng 10% ATK', descEn: 'All ATK +10%' },
      { star: 2, descVi: 'Tất cả tăng 10% Sát thương chí mạng', descEn: 'All CRIT DMG +10%' },
      { star: 3, descVi: 'Tất cả tăng 10% HP', descEn: 'All HP +10%' },
      { star: 4, descVi: 'Tất cả tăng 8% Né Chuyên Biệt', descEn: 'All Specialized Evade +8%' },
      { star: 5, descVi: 'Tất cả tăng 8% Tỉ lệ trúng chuyên biệt', descEn: 'All Specialized Hit +8%' }
    ]
  },
  {
    id: 'piercing_sword',
    nameVi: 'Kiếm Xuyên Thấu', nameEn: 'Piercing Sword',
    type: 'Active',
    inlay: 2,
    skillEffectVi: 'Gây ST Huy Chương bằng 200% ATK trung bình lên 3 kẻ địch ngẫu nhiên. Tiêu hao 1000 NL, kích hoạt 1 lần.',
    skillEffectEn: 'Deals Emblem DMG equal to 200% of allied average ATK to 3 random enemies. Costs 1,000 Energy, triggers once.',
    enhance: [
      { level: 1, descVi: 'Gây ST Huy Chương bằng 200% ATK trung bình lên 3 kẻ địch ngẫu nhiên.', descEn: 'Deals Emblem DMG equal to 200% of allied average ATK to 3 random enemies.' },
      { level: 2, descVi: 'Tăng ST Huy Chương lên 300% ATK trung bình.', descEn: 'Increased Emblem DMG to 300% of average ATK.' },
      { level: 3, descVi: 'Tăng số mục tiêu của ST Huy Chương lên toàn bộ kẻ địch.', descEn: 'Increased Attack targets of Emblem DMG to all enemies.' },
      { level: 4, descVi: 'Kích hoạt Kiếm Xuyên Thấu 2 lần mỗi trận.', descEn: 'Triggers twice per battle.' }
    ],
    ascend: [
      { star: 1, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 2, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 3, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 4, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 5, descVi: 'Đang cập nhật...', descEn: 'TBD' }
    ]
  },
  {
    id: 'reviving_wind',
    nameVi: 'Ngọn Gió Phục Sinh', nameEn: 'Reviving Wind',
    type: 'Passive',
    inlay: 2,
    skillEffectVi: 'Bắt đầu hiệp, hàng trước nhận Hồi máu bằng 100% HP Tối đa. Kích hoạt 1 lần mỗi trận.',
    skillEffectEn: 'At the beginning of the round, Front Row characters receive 100% Max HP Healing. Triggers once.',
    enhance: [
      { level: 1, descVi: 'Bắt đầu hiệp, hàng trước nhận Hồi máu bằng 100% HP Tối đa.', descEn: 'Front Row characters receive 100% Max HP Healing.' },
      { level: 2, descVi: 'Tạo Độ Bền cho đồng minh hàng trước bằng 30% HP Tối đa.', descEn: 'Grants Tenacity to Front Row allies equal to 30% of Max HP.' },
      { level: 3, descVi: 'Mở rộng hiệu ứng hồi máu lên toàn bộ đồng minh.', descEn: 'Increased Healing Effect targeting to all allies.' },
      { level: 4, descVi: 'Tăng hiệu ứng hồi máu lên 150% HP Tối đa.', descEn: 'Healing Effect increased to 150% of Max HP.' }
    ],
    ascend: [
      { star: 1, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 2, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 3, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 4, descVi: 'Đang cập nhật...', descEn: 'TBD' },
      { star: 5, descVi: 'Đang cập nhật...', descEn: 'TBD' }
    ]
  }
]

const activeEmblemId = ref('eternal_heart')
const activeEmblem = computed(() => emblemSkillsData.find(e => e.id === activeEmblemId.value) || emblemSkillsData[0])

// Carousel Logic
const currentImageIndex = ref(0)
const illustrations = {
  mirage: [
    '/Feature/medals/Mirage_trial/Main.png',
    '/Feature/medals/Mirage_trial/Ảnh chụp màn hình 2026-07-14 153422.png',
    '/Feature/medals/Mirage_trial/Ảnh chụp màn hình 2026-07-14 153429.png',
    '/Feature/medals/Mirage_trial/Ảnh chụp màn hình 2026-07-14 153440.png',
    '/Feature/medals/Mirage_trial/Ảnh chụp màn hình 2026-07-14 153446.png',
    '/Feature/medals/Mirage_trial/Ảnh chụp màn hình 2026-07-14 153457.png'
  ],
  gems: [
    '/Feature/medals/Gem/TSG_00_1.png',
    '/Feature/medals/Gem/TSG_00_2.png',
    '/Feature/medals/Gem/TSG_00_3.png',
    '/Feature/medals/Gem/TSG_01_1.png',
    '/Feature/medals/Gem/TSG_03_1.png',
    '/Feature/medals/Gem/TSG_04_1.png'
  ]
}

const currentIllustrations = computed(() => {
  if (activeTab.value === 'overview') {
    return ['/Feature/medals/Main.png']
  }
  if (activeTab.value === 'bounty') {
    return ['/Feature/medals/Bounty Mission/Main.png']
  }
  if (activeTab.value === 'skill') {
    const id = activeEmblemId.value
    const folderMap = {
      'sharp_blade': { folder: 'sharp_blade', count: 3 },
      'eternal_heart': { folder: 'eternal_heart', count: 3 },
      'undying_shield': { folder: 'shield_protection', count: 8 },
      'distorted_field': { folder: 'force_field', count: 8 },
      'wall_sanctuary': { folder: 'guard_wall', count: 3 },
      'piercing_sword': { folder: 'piercing_sword', count: 2 },
      'reviving_wind': { folder: 'wind_resurrection', count: 2 }
    }
    const info = folderMap[id]
    if (info) {
      return Array.from({ length: info.count }, (_, i) => `/Feature/medals/${info.folder}/${info.folder}_${i + 1}.png`)
    }
    return ['/Feature/medals/Main.png']
  }
  return illustrations[activeTab.value] || ['/Feature/medals/Main.png']
})

watch([activeTab, activeEmblemId], () => {
  currentImageIndex.value = 0
  startSlider()
})

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % currentIllustrations.value.length
  startSlider()
}
const prevImage = () => {
  currentImageIndex.value = (currentImageIndex.value - 1 + currentIllustrations.value.length) % currentIllustrations.value.length
  startSlider()
}

let sliderInterval = null
const startSlider = () => {
  stopSlider()
  if (currentIllustrations.value.length > 1) {
    sliderInterval = setInterval(() => {
      currentImageIndex.value = (currentImageIndex.value + 1) % currentIllustrations.value.length
    }, 5000)
  }
}
const stopSlider = () => {
  if (sliderInterval) clearInterval(sliderInterval)
}

onMounted(() => {
  startSlider()
})
onUnmounted(() => {
  stopSlider()
})

// Gems Data (Offense and Defense)
const gemsOffense = [
  { nameVi: 'Tăng ST Kỹ Năng', nameEn: 'Skill DMG dealt', stat: '+5% -> +40%', rarity: 'Phẩm Tím', image: '/Feature/medals/Gem/TSG_00_1.png' },
  { nameVi: 'Hiệu Ứng Chuẩn Xác', nameEn: 'Effect Hit', stat: '+5% -> +40%', rarity: 'Phẩm Tím', image: '/Feature/medals/Gem/TSG_00_2.png' },
  { nameVi: 'Xuyên Đỡ Đòn', nameEn: 'Block Pierce', stat: '+5% -> +40%', rarity: 'Phẩm Tím', image: '/Feature/medals/Gem/TSG_00_3.png' },
  { nameVi: 'Tăng ST Chuẩn', nameEn: 'True DMG dealt', stat: '+2.5% -> +20%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_01_1.png' },
  { nameVi: 'Chính xác chuyên biệt', nameEn: 'Specialized Hit', stat: '+2.5% -> +20%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_01_2.png' },
  { nameVi: 'Tăng ST Đấu Trường', nameEn: 'Arena DMG dealt', stat: '+2.5% -> +20%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_02_1.png' },
  { nameVi: 'Tấn Công % / Phòng Thủ %', nameEn: 'ATK% / DEF%', stat: '+1% -> +8%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_02_2.png' }
]

const gemsDefense = [
  { nameVi: 'Giảm ST Kỹ Năng nhận', nameEn: 'Skill DMG taken reduction', stat: '+5% -> +40%', rarity: 'Phẩm Tím', image: '/Feature/medals/Gem/TSG_00_4.png' },
  { nameVi: 'Kháng Hiệu Ứng', nameEn: 'Effect Resist', stat: '+5% -> +40%', rarity: 'Phẩm Tím', image: '/Feature/medals/Gem/TSG_00_5.png' },
  { nameVi: 'Tỉ Lệ Đỡ Đòn', nameEn: 'Block Rate', stat: '+2.5% -> +20%', rarity: 'Phẩm Tím', image: '/Feature/medals/Gem/TSG_00_6.png' },
  { nameVi: 'Giảm ST Chuẩn nhận', nameEn: 'True DMG taken reduction', stat: '+2.5% -> +20%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_03_1.png' },
  { nameVi: 'Né tránh chuyên biệt', nameEn: 'Specialized Dodge', stat: '+2.5% -> +20%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_03_2.png' },
  { nameVi: 'Giảm ST Đấu Trường nhận', nameEn: 'Arena DMG taken reduction', stat: '+2.5% -> +20%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_04_1.png' },
  { nameVi: 'Máu % / Kháng Bạo %', nameEn: 'HP% / Crit Resist%', stat: '+1% -> +8%', rarity: 'Phẩm Vàng', image: '/Feature/medals/Gem/TSG_04_2.png' }
]

// Gem Helper Methods
const getGemAtk = (lvl) => [13500, 14400, 19800, 22500, 27000, 36000, 54000, 72000][lvl]
const getGemDef = (lvl) => getGemAtk(lvl) / 2
const getGemHp = (lvl) => getGemAtk(lvl) * 6
const getGemCostStr = (lvl) => {
  if (lvl === 7) return 'MAX'
  const gold = [100, 200, 300, 400, 500, 600, 700][lvl]
  const gemCount = [1, 1, 2, 2, 3, 3, 3][lvl]
  const goldStr = locale.value === 'vi' ? 'vàng' : 'gold'
  return `${gold}.000 ${goldStr} +${gemCount} gem`
}
const getGemMainStat = (statString, lvl) => {
  const match = statString.match(/\+([\d.]+)%\s*->\s*\+([\d.]+)%/)
  if (match) {
    const min = parseFloat(match[1])
    const max = parseFloat(match[2])
    const step = (max - min) / 7
    const val = min + step * lvl
    return `+${val % 1 === 0 ? val : val.toFixed(1)}%`
  }
  return statString
}

const gemDisplayLimits = reactive({})
const getGemDisplayLimit = (gemName) => {
  return gemDisplayLimits[gemName] || 1
}
const showMoreGemLevels = (gemName) => {
  const current = getGemDisplayLimit(gemName)
  if (current < 8) {
    gemDisplayLimits[gemName] = Math.min(current + 2, 8)
  }
}
const hideAllGemLevels = (gemName) => {
  gemDisplayLimits[gemName] = 1
}
</script>

<template>
  <div class="min-h-screen bg-opm-dark pt-24 pb-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Title Section -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 bg-[#ff1a1a]/10 border border-[#ff1a1a]/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] text-[#ff1a1a] mb-4">
          <span class="w-2 h-2 rounded-full bg-[#ff1a1a] animate-pulse"></span>
          {{ t('medals.levelRequired') }}
        </div>
        <h1 class="text-4xl sm:text-5xl font-black uppercase tracking-wider text-white mb-4">
          {{ t('medals.title') }}
        </h1>
        <p class="max-w-3xl mx-auto text-gray-400 text-sm sm:text-base leading-relaxed">
          {{ t('medals.desc') }}
        </p>
      </div>

      <!-- Navigation Tabs -->
      <div class="relative mb-10 border-b border-white/5 pb-6">
        <div class="flex items-center">
          <button @click="scrollTabs('left')" class="absolute left-0 z-10 p-1.5 bg-black/80 rounded-full border border-white/10 text-white hover:text-opm-gold shadow-[0_0_15px_rgba(0,0,0,0.9)] sm:hidden flex items-center justify-center">
            <svg class="w-4 h-4 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          
          <div ref="tabContainer" class="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-2 w-full px-8 sm:px-0">
            <button
              @click="activeTab = 'overview'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'overview' ? 'bg-opm-gold text-black shadow-glow-gold' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('medals.tabOverview') }}
            </button>
            <button
              @click="activeTab = 'mirage'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'mirage' ? 'bg-opm-gold text-black shadow-glow-gold' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('medals.tabMirage') }}
            </button>
            <button
              @click="activeTab = 'skill'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'skill' ? 'bg-opm-gold text-black shadow-glow-gold' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('medals.tabSkill') }}
            </button>
            <button
              @click="activeTab = 'bounty'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'bounty' ? 'bg-opm-gold text-black shadow-glow-gold' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('medals.tabBounty') }}
            </button>
            <button
              @click="activeTab = 'gems'"
              class="shrink-0 snap-center px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-[0.1em] transition-all duration-300"
              :class="activeTab === 'gems' ? 'bg-opm-gold text-black shadow-glow-gold' : 'bg-[#1a1c23] text-gray-400 hover:text-white'"
            >
              {{ t('medals.tabGems') }}
            </button>
          </div>

          <button @click="scrollTabs('right')" class="absolute right-0 z-10 p-1.5 bg-black/80 rounded-full border border-white/10 text-white hover:text-opm-gold shadow-[0_0_15px_rgba(0,0,0,0.9)] sm:hidden flex items-center justify-center">
            <svg class="w-4 h-4 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left: Details Column -->
        <div class="lg:col-span-7 space-y-6">
          
          <transition name="fade" mode="out-in">
          <!-- TAB 1: OVERVIEW -->
          <div v-if="activeTab === 'overview'" key="overview" class="space-y-6">
            <div class="glass-card p-6 sm:p-8">
              <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <h2 class="text-2xl font-black uppercase tracking-wider text-white border-l-4 border-opm-gold pl-3 mb-0">
                  {{ t('medals.emblemRules') }}
                </h2>
                <button @click="showSummary = !showSummary" class="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-opm-gold/10 hover:bg-opm-gold/20 border border-opm-gold/30 rounded-lg text-opm-gold transition-colors whitespace-nowrap self-start sm:self-auto">
                  {{ showSummary ? (locale === 'vi' ? 'Xem Chi Tiết' : 'View Details') : (locale === 'vi' ? 'Xem Tóm Tắt' : 'View Summary') }}
                </button>
              </div>
              
              <!-- Content VI -->
              <div v-if="locale === 'vi'" class="text-gray-300 text-sm leading-relaxed">
                <transition name="fade-fast" mode="out-in">
                  <div v-if="!showSummary" key="detail" class="space-y-4">
                    <!-- Phần 1: Các Quy tắc Chung -->
                <h3 class="font-bold text-white text-base">Các Quy tắc Chung</h3>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">1</span>
                  <span>Đá Huy chương (Emblem Stone) có thể được sử dụng cho tất cả các Huy chương.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">2</span>
                  <span>Đá Thăng hoa Dấu ấn (Mark Ascension Stone) có thể được sử dụng cho tất cả các Dấu ấn.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">3</span>
                  <span>Tính năng Phân giải (Dismantle) sẽ được mở khóa sau khi một Huy chương hoặc Dấu ấn được nâng cấp lên mức tối đa.</span>
                </p>

                <!-- Phần 2: Đào tạo Kỹ năng -->
                <details class="group bg-[#1a1c23]/60 rounded-lg border border-white/5 overflow-hidden transition-all duration-300 mt-4">
                  <summary class="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/5 transition-colors font-bold text-white">
                    Đào tạo Kỹ năng Huy chương Tối thượng Siêu cấp
                    <svg class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </summary>
                  <div class="p-4 border-t border-white/5 space-y-4 bg-black/20">
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">1</span>
                      <span>Sau khi kích hoạt Kỹ năng Huy chương Thường (Normal Emblem Skill), bạn có thể thăng bậc lên Kỹ năng Huy chương Tối thượng Siêu cấp tương ứng. Kỹ năng này được tăng cường dựa trên nền tảng của kỹ năng gốc, và có thể khảm nhiều loại Ngọc (Gems) mang lại các cơ chế chiến đấu vượt trội.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">2</span>
                      <span>Khi một Kỹ năng Huy chương Tối thượng Siêu cấp được thăng bậc, nó sẽ kế thừa cấp độ hiệu ứng cường hóa của Kỹ năng Huy chương Thường. Sau khi thăng bậc thành công, Kỹ năng Tối thượng Siêu cấp sẽ thay thế Kỹ năng Thường.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">3</span>
                      <span>Việc thăng bậc và thăng hoa các kỹ năng này sẽ tiêu hao vật phẩm Kỹ năng Huy chương - Tối thượng (Ultimate - Emblem Skill). Sau khi thăng hoa, các chỉ số thuộc tính của kỹ năng sẽ được gia tăng.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">4</span>
                      <span>Bạn có thể phân giải Kỹ năng Huy chương Tối thượng Siêu cấp thành Tiền Huy chương (Emblem Coins) trong túi đồ, và dùng tiền này để đổi lấy vật phẩm tại Trạm Tiếp tế (Supply Depot).</span>
                    </p>
                  </div>
                </details>

                <!-- Phần 3: Nâng cấp Ngọc -->
                <details class="group bg-[#1a1c23]/60 rounded-lg border border-white/5 overflow-hidden transition-all duration-300 mt-2">
                  <summary class="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/5 transition-colors font-bold text-white">
                    Nâng cấp Ngọc (Gem Upgrades)
                    <svg class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </summary>
                  <div class="p-4 border-t border-white/5 space-y-4 bg-black/20">
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">1</span>
                      <span>Ngọc (Gems) thuộc nhóm trang bị có thể mặc và được chia thành hai loại: Ngọc Thường (General/Normal Gems) và Ngọc Độc quyền (Exclusive Gems) dành cho Kỹ năng Huy chương Tối thượng Siêu cấp.<br/>
                      +) Ngọc Thường có thể khảm vào tất cả các Kỹ năng Huy chương.<br/>
                      +) Ngọc Độc quyền phải được sử dụng với các Kỹ năng Huy chương nhất định mới có hiệu lực và chỉ có thể được khảm dưới các Kỹ năng Huy chương cố định.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">2</span>
                      <span>Các loại Kỹ năng Huy chương Tối thượng Siêu cấp khác nhau sẽ có số lượng khe khảm Ngọc khác nhau. Mỗi loại Ngọc chỉ được khảm một lần duy nhất trên tất cả các Trang Huy chương (Emblem Pages).</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">3</span>
                      <span>Quá trình nâng cấp Ngọc sẽ tiêu hao các viên Ngọc 0-sao. Sau khi thăng hoa, thuộc tính của Ngọc sẽ được cải thiện đáng kể. Bạn cũng có thể phân giải Ngọc thành Tiền Huy chương để đổi vật phẩm tại Trạm Tiếp tế.</span>
                    </p>
                  </div>
                </details>
                  </div>
                  <div v-else key="summary" class="space-y-4 bg-opm-gold/5 border border-opm-gold/20 p-5 rounded-lg text-gray-300 text-sm leading-relaxed">
                    <p><strong>Quy tắc chung:</strong> Đá dùng cho Huy chương/Dấu ấn tương ứng. Đạt cấp tối đa sẽ mở tính năng Phân giải.</p>
                    <p><strong>Kỹ năng Tối thượng Siêu cấp:</strong> Nâng cấp từ Kỹ năng Thường, thay thế và kế thừa cấp độ cũ. Mở khóa khe khảm Ngọc để tăng sức mạnh.</p>
                    <p><strong>Ngọc (Gems):</strong> Gồm Ngọc Thường (khảm mọi kỹ năng) và Ngọc Độc quyền (chỉ khảm kỹ năng cố định). Mỗi loại Ngọc chỉ được khảm 1 lần duy nhất trên tất cả các trang. Dùng Ngọc 0-sao để nâng cấp.</p>
                    <p><strong>Đổi thưởng:</strong> Kỹ năng Tối thượng và Ngọc đều có thể đem Phân giải thành Tiền Huy chương để mua đồ ở Trạm Tiếp tế.</p>
                  </div>
                </transition>
              </div>

              <!-- Content EN -->
              <div v-else class="text-gray-300 text-sm leading-relaxed">
                <transition name="fade-fast" mode="out-in">
                  <div v-if="!showSummary" key="detail" class="space-y-4">
                    <!-- Part 1: General Rules -->
                <h3 class="font-bold text-white text-base">General Rules</h3>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">1</span>
                  <span>Emblem Stone can be used for all Emblems.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">2</span>
                  <span>Mark Ascension Stone can be used for all Marks.</span>
                </p>
                <p class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">3</span>
                  <span>Dismantle feature will be unlocked after an Emblem or Mark is upgraded to the maximum level.</span>
                </p>

                <!-- Part 2: Ultra Ultimate Emblem Skill Training -->
                <details class="group bg-[#1a1c23]/60 rounded-lg border border-white/5 overflow-hidden transition-all duration-300 mt-4">
                  <summary class="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/5 transition-colors font-bold text-white">
                    Ultra Ultimate Emblem Skill Training
                    <svg class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </summary>
                  <div class="p-4 border-t border-white/5 space-y-4 bg-black/20">
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">1</span>
                      <span>After activating the Normal Emblem Skill, you can ascend it to the corresponding Ultra Ultimate Emblem Skill. This skill is enhanced based on the original skill, and can be socketed with various Gems providing superior combat mechanics.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">2</span>
                      <span>When an Ultra Ultimate Emblem Skill is ascended, it inherits the enhancement level of the Normal Emblem Skill. After successful ascension, the Ultra Ultimate Skill will replace the Normal Skill.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">3</span>
                      <span>Ascending and transcending these skills will consume the Ultimate - Emblem Skill item. After ascension, the skill's attributes will be increased.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">4</span>
                      <span>You can dismantle Ultra Ultimate Emblem Skills into Emblem Coins in your inventory, and use them to exchange for items at the Supply Depot.</span>
                    </p>
                  </div>
                </details>

                <!-- Part 3: Gem Upgrades -->
                <details class="group bg-[#1a1c23]/60 rounded-lg border border-white/5 overflow-hidden transition-all duration-300 mt-2">
                  <summary class="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/5 transition-colors font-bold text-white">
                    Gem Upgrades
                    <svg class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </summary>
                  <div class="p-4 border-t border-white/5 space-y-4 bg-black/20">
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">1</span>
                      <span>Gems belong to the wearable equipment category and are divided into two types: General/Normal Gems and Exclusive Gems for Ultra Ultimate Emblem Skills.<br/>
                      +) Normal Gems can be socketed into all Emblem Skills.<br/>
                      +) Exclusive Gems must be used with specific Emblem Skills to take effect and can only be socketed under fixed Emblem Skills.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">2</span>
                      <span>Different Ultra Ultimate Emblem Skills will have varying numbers of Gem slots. Each type of Gem can only be socketed once across all Emblem Pages.</span>
                    </p>
                    <p class="flex items-start gap-3">
                      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-opm-gold/10 border border-opm-gold/30 flex items-center justify-center text-xs font-bold text-opm-gold">3</span>
                      <span>Upgrading Gems will consume 0-star Gems. After ascension, Gem attributes will significantly improve. You can also dismantle Gems into Emblem Coins to exchange for items at the Supply Depot.</span>
                    </p>
                  </div>
                </details>
                  </div>
                  <div v-else key="summary" class="space-y-4 bg-opm-gold/5 border border-opm-gold/20 p-5 rounded-lg text-gray-300 text-sm leading-relaxed">
                    <p><strong>General Rules:</strong> Stones are used for corresponding Emblems/Marks. Reaching max level unlocks Dismantle.</p>
                    <p><strong>Ultra Ultimate Skills:</strong> Ascend from Normal Skills, inheriting their level and replacing them. Unlocks Gem slots for power boost.</p>
                    <p><strong>Gems:</strong> Includes Normal Gems (fit all skills) and Exclusive Gems (fixed skills only). Each Gem type can be socketed only once across all pages. Use 0-star Gems to upgrade.</p>
                    <p><strong>Exchange:</strong> Ultimate Skills and Gems can be dismantled into Emblem Coins to buy items in the Supply Depot.</p>
                  </div>
                </transition>
              </div>
            </div>

            <div class="glass-card p-6">
              <h3 class="text-lg font-bold text-white mb-4">
                {{ locale === 'vi' ? 'Khái niệm Bảng Huy Chương' : 'Emblem Board Concept' }}
              </h3>
              <p class="text-sm text-gray-400 leading-relaxed">
                {{ locale === 'vi' 
                   ? 'Khác với trang bị nhân vật thông thường, hệ thống Huy chương đóng vai trò xây dựng chỉ số nâng cao cho nhân vật. Khảm các Ấn ký (Mark) và Đá quý (Gem) thích hợp để tăng mạnh lực chiến PVP/PVE và kích hoạt các hiệu ứng đặc biệt độc quyền.'
                   : 'Unlike standard character equipment, the Emblem system serves as an advanced stat-builder. Socket the appropriate Marks and Gems to enhance PVP/PVE performance and trigger unique special effects.' }}
              </p>
            </div>
          </div>

          <!-- TAB 2: MIRAGE TRIAL -->
          <div v-else-if="activeTab === 'mirage'" key="mirage" class="space-y-6">
            <div class="glass-card p-6 sm:p-8">
              <h2 class="text-2xl font-black uppercase tracking-wider text-white mb-6 border-l-4 border-opm-gold pl-3">
                {{ t('medals.mirageRules') }}
              </h2>
              
              <div class="bg-opm-gold/5 border border-opm-gold/20 p-4 rounded-lg mb-6 flex flex-col gap-3">
                <div class="flex items-start gap-3">
                  <svg class="w-6 h-6 text-opm-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div class="text-sm text-gray-300 leading-relaxed">
                    <strong class="text-opm-gold block mb-1">
                      {{ locale === 'vi' ? 'Giới hạn ải:' : 'Stage Limits:' }}
                    </strong>
                    {{ locale === 'vi' 
                      ? 'Có tối đa 200 Ải Xanh (Blue Stages) và 20 Ải Vàng (Gold Stages).' 
                      : 'Maximum of 200 Blue Stages and 20 Gold Stages available.' }}
                  </div>
                </div>
                <div class="flex items-start gap-3 border-t border-opm-gold/20 pt-3">
                  <svg class="w-6 h-6 text-opm-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div class="text-sm text-gray-300 leading-relaxed space-y-1">
                    <p>{{ locale === 'vi' ? 'Mỗi khi vượt qua 20 ải xanh sẽ nhận được: 4 vé quay ảo cảnh và 15 Đá Thăng cấp Ấn.' : 'Every 20 Blue Stages cleared: 4 Mirage Tickets & 15 Mark Upgrade Stones.' }}</p>
                    <p>{{ locale === 'vi' ? 'Mỗi khi vượt qua 20 ải Vàng sẽ nhận được: 4 vé quay ảo cảnh và 15 Đá Thăng cấp Ấn.' : 'Every 20 Gold Stages cleared: 4 Mirage Tickets & 15 Mark Upgrade Stones.' }}</p>
                  </div>
                </div>
              </div>

              <h3 class="text-lg font-bold text-white mb-4">
                {{ locale === 'vi' ? 'Shop Bí Ẩn (Mystery Shop Milestones)' : 'Mystery Shop Milestones' }}
              </h3>
              
              <div class="space-y-3">
                <template v-for="item in mirageData" :key="item.stage">
                  <details v-if="item.image" class="group bg-[#1a1c23]/60 rounded-lg border border-white/5 overflow-hidden transition-all duration-300">
                    <summary class="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div class="flex items-center gap-4">
                        <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black text-opm-cyan">
                          {{ locale === 'vi' ? 'Ải' : 'St' }} {{ item.stage }}
                        </span>
                        <span class="text-sm font-bold text-white">
                          {{ locale === 'vi' ? item.itemVi : item.itemEn }}
                        </span>
                      </div>
                      <svg class="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </summary>
                    <div class="p-4 border-t border-white/5 flex justify-center bg-black/30 relative group cursor-pointer" @click="openImageModal(item.image)">
                      <img :src="item.image" class="max-w-full rounded border border-white/10 shadow-lg group-hover:opacity-80 transition-opacity" :alt="item.itemEn" />
                      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                      </div>
                    </div>
                  </details>
                  
                  <div v-else class="bg-[#1a1c23]/60 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black text-opm-cyan">
                        {{ locale === 'vi' ? 'Ải' : 'St' }} {{ item.stage }}
                      </span>
                      <span class="text-sm font-bold text-white">
                        {{ locale === 'vi' ? item.itemVi : item.itemEn }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- TAB 3: SKILL -->
          <div v-else-if="activeTab === 'skill'" key="skill" class="space-y-6">
            <div class="glass-card p-6 sm:p-8">
              <h2 class="text-2xl font-black uppercase tracking-wider text-white mb-6 border-l-4 border-opm-gold pl-3">
                {{ t('medals.skillRules') }}
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
                <!-- Sidebar Select Emblem -->
                <div class="md:col-span-4 space-y-2 md:border-r border-white/5 pr-4">
                  <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    {{ locale === 'vi' ? 'Chọn Bộ Huy Chương' : 'Select Emblem' }}
                  </h3>
                  <button
                    v-for="emb in emblemSkillsData"
                    :key="emb.id"
                    @click="activeEmblemId = emb.id"
                    class="w-full text-left px-4 py-3 rounded-lg border text-sm font-bold uppercase tracking-wider transition-all duration-300"
                    :class="activeEmblemId === emb.id ? 'bg-opm-gold/10 border-opm-gold/50 text-opm-gold' : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'"
                  >
                    {{ locale === 'vi' ? emb.nameVi : emb.nameEn }}
                  </button>
                </div>
                
                <!-- Main Content -->
                <div class="md:col-span-8">
                  <transition name="fade" mode="out-in">
                    <div :key="activeEmblemId">
                      <div class="flex items-center gap-3 mb-6">
                        <h3 class="text-xl font-black text-white uppercase">
                      {{ locale === 'vi' ? activeEmblem.nameVi : activeEmblem.nameEn }}
                    </h3>
                    <span class="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/20" :class="activeEmblem.type === 'Active' ? 'bg-[#ff1a1a]/20 text-[#ff1a1a] border-[#ff1a1a]/30' : 'bg-opm-cyan/20 text-opm-cyan border-opm-cyan/30'">
                      {{ locale === 'vi' ? (activeEmblem.type === 'Active' ? 'Kích hoạt' : 'Bị động') : activeEmblem.type }}
                    </span>
                  </div>

                  <!-- Skill Effect (Only for Passive/Active) -->
                  <div v-if="activeEmblem.skillEffectVi" class="mb-8">
                    <h3 class="text-lg font-black uppercase tracking-wider text-white mb-4 border-b border-white/10 pb-2">
                      {{ locale === 'vi' ? 'Hiệu Ứng Kỹ Năng' : 'Skill Effect' }}
                    </h3>
                    <div class="bg-[#1a1c23]/60 p-4 rounded-lg border border-white/5 text-sm text-gray-300 leading-relaxed">
                      {{ locale === 'vi' ? activeEmblem.skillEffectVi : activeEmblem.skillEffectEn }}
                    </div>
                  </div>

                  <!-- Inlay -->
                  <div class="mb-8">
                    <h3 class="text-lg font-black uppercase tracking-wider text-opm-gold mb-4 flex items-center gap-2">
                      <span class="bg-opm-gold text-black px-2 py-0.5 rounded text-xs">INLAY</span>
                      {{ locale === 'vi' ? 'Khảm Ngọc' : 'Inlay Slots' }}
                    </h3>
                    <details class="group bg-[#1a1c23]/60 rounded-lg border border-white/5">
                      <summary class="p-4 cursor-pointer list-none flex justify-between items-center text-sm text-gray-300">
                        <span>{{ locale === 'vi' ? `Có ${activeEmblem.inlay} lỗ để khảm ngọc.` : `Features ${activeEmblem.inlay} available slots for inlaying gems.` }}</span>
                        <span class="transition-transform group-open:rotate-180">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </span>
                      </summary>
                      <div class="p-4 border-t border-white/5 flex justify-center">
                        <img :src="`/Feature/medals/inlay/${activeEmblem.inlay}_lo.png`" class="max-w-full rounded" />
                      </div>
                    </details>
                  </div>

                  <!-- Enhance -->
                  <div class="mb-8">
                    <h3 class="text-lg font-black uppercase tracking-wider text-opm-cyan mb-4 flex items-center gap-2">
                      <span class="bg-opm-cyan text-black px-2 py-0.5 rounded text-xs">ENHANCE</span>
                      {{ locale === 'vi' ? 'Cường Hóa (Cấp 1 - 4)' : 'Enhance (Level 1 - 4)' }}
                    </h3>
                    <div class="space-y-2">
                      <div v-for="eh in activeEmblem.enhance" :key="eh.level" class="bg-[#1a1c23]/60 p-3 rounded-lg border border-white/5 flex items-center gap-4">
                        <span class="text-opm-cyan font-black text-sm w-10">Lv.{{ eh.level }}</span>
                        <span class="text-sm text-gray-300">{{ locale === 'vi' ? eh.descVi : eh.descEn }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Ascend -->
                  <div v-if="activeEmblem.ascend">
                    <h3 class="text-lg font-black uppercase tracking-wider text-opm-red mb-4 flex items-center gap-2 mt-8">
                      <span class="bg-opm-red text-white px-2 py-0.5 rounded text-xs">ASCEND</span>
                      {{ locale === 'vi' ? 'Thăng Sao (Sao 1 - 5)' : 'Ascend (Star 1 - 5)' }}
                    </h3>
                    <div class="space-y-2">
                      <div v-for="asc in activeEmblem.ascend" :key="asc.star" class="bg-[#1a1c23]/60 p-3 rounded-lg border border-white/5 flex items-center gap-4">
                        <span class="text-opm-red font-black text-sm w-10">★{{ asc.star }}</span>
                        <span class="text-sm text-gray-300">{{ locale === 'vi' ? asc.descVi : asc.descEn }}</span>
                      </div>
                    </div>
                  </div>
                    </div>
                  </transition>
                </div>
              </div>

            </div>
          </div>

          <!-- TAB 4: GEMS -->
          <div v-else-if="activeTab === 'gems'" key="gems" class="space-y-6">
            <div class="glass-card p-6 sm:p-8">
              <h2 class="text-2xl font-black uppercase tracking-wider text-white mb-6 border-l-4 border-opm-gold pl-3">
                {{ t('medals.gemRules') }}
              </h2>
              
              <div class="space-y-4 text-gray-300 text-sm leading-relaxed mb-6">
                <p>
                  {{ locale === 'vi'
                     ? 'Ngọc chia làm hai loại: Ngọc Công (tăng chỉ số sát thương, chuẩn xác, xuyên đỡ đòn...) và Ngọc Thủ (giảm sát thương, kháng hiệu ứng, đỡ đòn...). Mỗi loại Ngọc có tối đa 7 cấp nâng cấp, tiêu hao vàng và Ngọc 0 sao cùng loại để tiến cấp.'
                     : 'Gems are categorized into Offense (increases DMG, Hit, Pierce, etc.) and Defense (reduces DMG, increases Block, Resist, etc.). Each Gem type has up to 7 upgrade levels, costing Gold and 0-star copy Gems to level up.' }}
                </p>
              </div>
            </div>

            <!-- Offense Gems List -->
            <div class="glass-card p-6">
              <h3 class="text-lg font-black uppercase tracking-wider text-opm-red mb-4">
                {{ locale === 'vi' ? 'Hệ Thống Ngọc Công (Offense Gems)' : 'Offense Gems' }}
              </h3>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div v-for="gem in gemsOffense" :key="gem.nameEn" class="bg-[#1a1c23]/60 p-4 rounded-xl border border-white/5 flex flex-col h-full">
                  <!-- Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 bg-black/40 rounded-lg p-2 border border-white/10">
                        <img :src="gem.image" class="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                      </div>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="text-base font-bold text-white leading-tight line-clamp-1" :title="locale === 'vi' ? gem.nameVi : gem.nameEn">
                            {{ locale === 'vi' ? gem.nameVi : gem.nameEn }}
                          </span>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">ATK%</span>
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">DEF%</span>
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">HP%</span>
                        </div>
                        <div>
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-opm-gold/10 text-opm-gold border border-opm-gold/20 inline-block line-clamp-1">
                            {{ locale === 'vi' ? gem.nameVi : gem.nameEn }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="text-[11px] font-medium text-gray-500 shrink-0 mt-1">
                      {{ locale === 'vi' ? 'Cấp 0-7' : 'Level 0-7' }}
                    </div>
                  </div>
                  
                  <!-- Accordion details -->
                  <details class="group bg-black/20 rounded-lg border border-white/5 mt-auto">
                    <summary class="p-3 cursor-pointer list-none flex justify-between items-center text-xs font-bold text-gray-400 hover:text-white transition-colors">
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        {{ locale === 'vi' ? 'Các cấp: chỉ số & chi phí' : 'Levels: Stats & Cost' }}
                      </span>
                    </summary>
                    <div class="border-t border-white/5">
                      <transition-group name="list" tag="div">
                        <div v-for="lvl in getGemDisplayLimit(gem.nameEn)" :key="lvl" class="p-3 border-b border-white/5 last:border-0 text-xs leading-relaxed flex gap-3">
                          <div class="text-gray-400 font-medium whitespace-nowrap pt-0.5">
                            {{ locale === 'vi' ? 'Cấp ' + (lvl-1) : 'Lv ' + (lvl-1) }}
                          </div>
                          <div class="flex-grow flex flex-col gap-1.5 pt-0.5">
                            <!-- Stats -->
                            <div class="text-gray-300 flex flex-col gap-0.5">
                              <div>· {{ locale === 'vi' ? 'Tấn Công' : 'ATK' }} +{{ getGemAtk(lvl-1) }}</div>
                              <div>· {{ locale === 'vi' ? 'Phòng Thủ' : 'DEF' }} +{{ getGemDef(lvl-1) }}</div>
                              <div>· {{ locale === 'vi' ? 'Máu' : 'HP' }} +{{ getGemHp(lvl-1) }}</div>
                              <div>· <span class="text-opm-cyan font-bold">{{ locale === 'vi' ? gem.nameVi : gem.nameEn }} {{ getGemMainStat(gem.stat, lvl-1) }}</span></div>
                            </div>
                            <!-- Cost Row -->
                            <div class="text-opm-gold font-bold mt-1 pt-1.5 border-t border-white/5 text-right w-full">
                              {{ getGemCostStr(lvl-1) }}
                            </div>
                          </div>
                        </div>
                      </transition-group>
                      
                      <!-- Action Buttons -->
                      <div v-if="getGemDisplayLimit(gem.nameEn) > 1 || getGemDisplayLimit(gem.nameEn) < 8" class="p-2 flex justify-center gap-3 border-t border-white/5 bg-black/20 transition-colors">
                        <button v-if="getGemDisplayLimit(gem.nameEn) < 8" @click="showMoreGemLevels(gem.nameEn)" class="text-xs text-opm-cyan font-bold hover:text-white transition-colors py-1 px-4 rounded-full border border-opm-cyan/30 hover:bg-opm-cyan/10">
                          {{ locale === 'vi' ? 'Xem thêm' : 'Show more' }}
                        </button>
                        <button v-if="getGemDisplayLimit(gem.nameEn) > 1" @click="hideAllGemLevels(gem.nameEn)" class="text-xs text-gray-400 font-bold hover:text-white transition-colors py-1 px-4 rounded-full border border-gray-500/30 hover:bg-white/10">
                          {{ locale === 'vi' ? 'Ẩn bớt' : 'Hide' }}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            <!-- Defense Gems List -->
            <div class="glass-card p-6">
              <h3 class="text-lg font-black uppercase tracking-wider text-opm-blue mb-4">
                {{ locale === 'vi' ? 'Hệ Thống Ngọc Thủ (Defense Gems)' : 'Defense Gems' }}
              </h3>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div v-for="gem in gemsDefense" :key="gem.nameEn" class="bg-[#1a1c23]/60 p-4 rounded-xl border border-white/5 flex flex-col h-full">
                  <!-- Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0 bg-black/40 rounded-lg p-2 border border-white/10">
                        <img :src="gem.image" class="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                      </div>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="text-base font-bold text-white leading-tight line-clamp-1" :title="locale === 'vi' ? gem.nameVi : gem.nameEn">
                            {{ locale === 'vi' ? gem.nameVi : gem.nameEn }}
                          </span>
                        </div>
                        <!-- Badges row -->
                        <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">ATK%</span>
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">DEF%</span>
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">HP%</span>
                        </div>
                        <div>
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-opm-gold/10 text-opm-gold border border-opm-gold/20 inline-block line-clamp-1">
                            {{ locale === 'vi' ? gem.nameVi : gem.nameEn }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="text-[11px] font-medium text-gray-500 shrink-0 mt-1">
                      {{ locale === 'vi' ? 'Cấp 0-7' : 'Level 0-7' }}
                    </div>
                  </div>
                  
                  <!-- Accordion details -->
                  <details class="group bg-black/20 rounded-lg border border-white/5 mt-auto">
                    <summary class="p-3 cursor-pointer list-none flex justify-between items-center text-xs font-bold text-gray-400 hover:text-white transition-colors">
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        {{ locale === 'vi' ? 'Các cấp: chỉ số & chi phí' : 'Levels: Stats & Cost' }}
                      </span>
                    </summary>
                    <div class="border-t border-white/5">
                      <transition-group name="list" tag="div">
                        <div v-for="lvl in getGemDisplayLimit(gem.nameEn)" :key="lvl" class="p-3 border-b border-white/5 last:border-0 text-xs leading-relaxed flex gap-3">
                          <div class="text-gray-400 font-medium whitespace-nowrap pt-0.5">
                            {{ locale === 'vi' ? 'Cấp ' + (lvl-1) : 'Lv ' + (lvl-1) }}
                          </div>
                          <div class="flex-grow flex flex-col gap-1.5 pt-0.5">
                            <!-- Stats -->
                            <div class="text-gray-300 flex flex-col gap-0.5">
                              <div>· {{ locale === 'vi' ? 'Tấn Công' : 'ATK' }} +{{ getGemAtk(lvl-1) }}</div>
                              <div>· {{ locale === 'vi' ? 'Phòng Thủ' : 'DEF' }} +{{ getGemDef(lvl-1) }}</div>
                              <div>· {{ locale === 'vi' ? 'Máu' : 'HP' }} +{{ getGemHp(lvl-1) }}</div>
                              <div>· <span class="text-opm-cyan font-bold">{{ locale === 'vi' ? gem.nameVi : gem.nameEn }} {{ getGemMainStat(gem.stat, lvl-1) }}</span></div>
                            </div>
                            <!-- Cost Row -->
                            <div class="text-opm-gold font-bold mt-1 pt-1.5 border-t border-white/5 text-right w-full">
                              {{ getGemCostStr(lvl-1) }}
                            </div>
                          </div>
                        </div>
                      </transition-group>
                      
                      <!-- Action Buttons -->
                      <div v-if="getGemDisplayLimit(gem.nameEn) > 1 || getGemDisplayLimit(gem.nameEn) < 8" class="p-2 flex justify-center gap-3 border-t border-white/5 bg-black/20 transition-colors">
                        <button v-if="getGemDisplayLimit(gem.nameEn) < 8" @click="showMoreGemLevels(gem.nameEn)" class="text-xs text-opm-cyan font-bold hover:text-white transition-colors py-1 px-4 rounded-full border border-opm-cyan/30 hover:bg-opm-cyan/10">
                          {{ locale === 'vi' ? 'Xem thêm' : 'Show more' }}
                        </button>
                        <button v-if="getGemDisplayLimit(gem.nameEn) > 1" @click="hideAllGemLevels(gem.nameEn)" class="text-xs text-gray-400 font-bold hover:text-white transition-colors py-1 px-4 rounded-full border border-gray-500/30 hover:bg-white/10">
                          {{ locale === 'vi' ? 'Ẩn bớt' : 'Hide' }}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: BOUNTY MISSION -->
          <div v-else-if="activeTab === 'bounty'" key="bounty" class="space-y-6">
            <div class="glass-card p-6 sm:p-8">
              <h2 class="text-2xl font-black uppercase tracking-wider text-white mb-6 border-l-4 border-opm-gold pl-3">
                {{ t('medals.bountyRules') }}
              </h2>
              
              <div class="space-y-4 text-gray-300 text-sm leading-relaxed mb-6">
                <p>
                  {{ locale === 'vi' ? 'Mỗi nhiệm vụ có yêu cầu số Team (Đội hình) nhất định. Hoàn thành để tích lũy điểm đổi quà.' : 'Each mission requires a certain number of teams. Complete them to accumulate points for rewards.' }}
                </p>
                
                <ul class="list-disc pl-5 space-y-2">
                  <li><strong>{{ locale === 'vi' ? 'Phẩm Vàng' : 'Gold Quality' }}</strong>: {{ locale === 'vi' ? 'Cần 3 Team' : 'Requires 3 Teams' }}</li>
                  <li><strong>{{ locale === 'vi' ? 'Phẩm Tím' : 'Purple Quality' }}</strong>: {{ locale === 'vi' ? 'Cần 2 Team' : 'Requires 2 Teams' }}</li>
                  <li><strong>{{ locale === 'vi' ? 'Phẩm Xanh' : 'Blue Quality' }}</strong>: {{ locale === 'vi' ? 'Cần 1 Team' : 'Requires 1 Team' }}</li>
                </ul>
                
                <div class="bg-opm-gold/5 border border-opm-gold/20 p-4 rounded-lg mt-4">
                  <h3 class="font-bold text-opm-gold mb-2">{{ locale === 'vi' ? 'Quy tắc Lượt Đánh & Điểm' : 'Attempts & Points Rules' }}</h3>
                  <ul class="list-disc pl-5 space-y-1">
                    <li>{{ locale === 'vi' ? 'Tối đa đánh 6 lượt. Mỗi khi chiến thắng 1 ải sẽ nhận được 4 điểm.' : 'Max 6 attempts. Each cleared stage grants 4 points.' }}</li>
                    <li>{{ locale === 'vi' ? 'Được 4 lượt miễn phí. Có thể mua thêm tối đa 2 lượt bằng kim cương (1 lượt = 150 Kim Cương).' : '4 free attempts. Can purchase up to 2 extra attempts (150 Gems/attempt).' }}</li>
                    <li>{{ locale === 'vi' ? 'Làm mới mỗi Thứ 2 và Thứ 5 hàng tuần.' : 'Resets every Monday and Thursday.' }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Bounty Rewards -->
            <div class="glass-card p-6 sm:p-8">
              <h3 class="text-lg font-black uppercase tracking-wider text-opm-cyan mb-4 flex items-center gap-2">
                <span class="bg-opm-cyan text-black px-2 py-0.5 rounded text-xs">REWARDS</span>
                {{ locale === 'vi' ? 'Phần Quà Tích Lũy' : 'Milestone Rewards' }}
              </h3>
              
              <div class="space-y-3">
                <div class="bg-[#1a1c23]/60 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                  <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black text-opm-cyan">8 Đ</span>
                  <span class="text-sm font-bold text-white text-right">{{ locale === 'vi' ? '10 Đá Thăng cấp Ấn' : '10 Mark Upgrade Stones' }}</span>
                </div>
                <div class="bg-[#1a1c23]/60 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                  <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black text-opm-cyan">12 Đ</span>
                  <span class="text-sm font-bold text-white text-right">{{ locale === 'vi' ? '20 Đá Thăng cấp Ấn' : '20 Mark Upgrade Stones' }}</span>
                </div>
                <div class="bg-[#1a1c23]/60 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                  <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black text-opm-cyan">16 Đ</span>
                  <span class="text-sm font-bold text-white text-right">{{ locale === 'vi' ? '2 Vé quay Huy Chương' : '2 Emblem Draw Tickets' }}</span>
                </div>
                <div class="bg-[#1a1c23]/60 p-4 rounded-lg border border-white/5 flex items-center justify-between">
                  <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-sm font-black text-opm-cyan">20 Đ</span>
                  <span class="text-sm font-bold text-white text-right">{{ locale === 'vi' ? '10 Mảnh Cục Cầu Vồng (Siêu Hiếm)' : '10 Rainbow Core Fragments' }}</span>
                </div>
                <div class="bg-[#ff1a1a]/10 p-4 rounded-lg border border-[#ff1a1a]/30 flex items-center justify-between relative overflow-hidden">
                  <div class="absolute -right-4 -top-4 w-24 h-24 bg-[#ff1a1a]/10 rounded-full blur-xl"></div>
                  <span class="flex-shrink-0 w-12 h-12 rounded-full bg-black/50 border border-[#ff1a1a]/30 flex items-center justify-center text-sm font-black text-[#ff1a1a] shadow-glow">24 Đ</span>
                  <div class="text-right z-10">
                    <span class="text-sm font-bold text-white block">{{ locale === 'vi' ? '4 Cục Rubix (Ưu tiên lấy)' : '4 Rubix Cores (Priority)' }}</span>
                    <span class="text-xs text-[#ff1a1a] mt-1 block font-bold">* {{ locale === 'vi' ? 'Lưu ý: Bắt buộc phải mua thêm 2 lượt để nhận quà này.' : 'Note: Requires purchasing 2 extra attempts.' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </transition>

        </div>

        <!-- Right: Main Illustration Column -->
        <div class="lg:col-span-5 space-y-6">
          <transition name="fade" mode="out-in">
            <div :key="activeTab + '-' + activeEmblemId" class="glass-card p-6 sticky top-24">
              <h3 class="text-lg font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-opm-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {{ locale === 'vi' ? 'Minh Họa Tính Năng' : 'Feature Illustration' }}
              </h3>
              
              <div class="space-y-4">
                <div class="relative w-full aspect-[4/3] rounded-lg overflow-hidden group border border-white/10 shadow-glow-gold bg-black/50" @mouseenter="stopSlider" @mouseleave="startSlider">
                  <div class="absolute inset-0 w-full h-full">
                    <img v-for="(img, idx) in currentIllustrations" :key="img"
                         :src="img" @click="openImageModal(img)" 
                         class="w-full h-full object-contain cursor-pointer transition-opacity duration-700 absolute inset-0" 
                         :class="currentImageIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'"
                         alt="Medals UI" />
                  </div>
                  
                  <!-- Nút Phóng to ảnh -->
                  <button @click.stop="openImageModal(currentIllustrations[currentImageIndex])" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-lg opacity-50 hover:opacity-100 transition-opacity hover:bg-opm-gold z-20 shadow-lg border border-white/20" title="Phóng to">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  </button>

                  <!-- Nút Previous -->
                  <button @click.stop="prevImage" v-if="currentIllustrations.length > 1" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full opacity-50 hover:opacity-100 transition-opacity hover:bg-opm-gold z-20 shadow-lg border border-white/20">
                    <svg class="w-5 h-5 pr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  
                  <!-- Nút Next -->
                  <button @click.stop="nextImage" v-if="currentIllustrations.length > 1" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full opacity-50 hover:opacity-100 transition-opacity hover:bg-opm-gold z-20 shadow-lg border border-white/20">
                    <svg class="w-5 h-5 pl-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                  
                  <!-- Dots -->
                  <div v-if="currentIllustrations.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    <button v-for="(_, idx) in currentIllustrations" :key="idx" @click.stop="currentImageIndex = idx; startSlider()"
                            :class="currentImageIndex === idx ? 'bg-opm-gold w-4' : 'bg-white/50 w-2 hover:bg-white'"
                            class="h-2 rounded-full transition-all duration-300 shadow-sm"></button>
                  </div>
                </div>
                
                <p class="text-xs text-gray-500 text-center leading-relaxed">
                  {{ locale === 'vi' 
                     ? 'Giao diện tính năng Huy Chương trong game, trích xuất từ cộng đồng và wiki.' 
                     : 'In-game Emblem system interface, consisting of outer slots and a central skill.' }}
                </p>
              </div>
            </div>
          </transition>
        </div>

      </div>
    </div>

    <!-- Image Modal -->
    <transition name="fade">
      <div v-if="isImageModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" @click="isImageModalOpen = false">
        <button class="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <img :src="selectedImageForModal" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" @click.stop />
      </div>
    </transition>
  </div>
</template>

<style scoped>
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
</style>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

/* Animations for Gems list (Show more / Hide) */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
.list-leave-active {
  position: absolute;
}

/* Animations for details accordion open */
details[open] summary ~ * {
  animation: slide-down 0.4s ease-out;
}
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
