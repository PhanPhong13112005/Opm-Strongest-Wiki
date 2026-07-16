<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'

const { t, locale } = useI18n()
const route = useRoute()

const subTab = ref('phe') // 'phe', 'he', 'cap'
const masteryTransition = ref('fade')
const subTabOrder = ['phe', 'he', 'cap']

const switchSubTab = (tab) => {
  const oldIdx = subTabOrder.indexOf(subTab.value)
  const newIdx = subTabOrder.indexOf(tab)
  if (newIdx > oldIdx) {
    masteryTransition.value = 'slide-left'
  } else if (newIdx < oldIdx) {
    masteryTransition.value = 'slide-right'
  } else {
    masteryTransition.value = 'fade'
  }
  subTab.value = tab
}

const fromTier = ref(0)
const toTier = ref(1)

const showCharModal = ref(false)
const modalTarget = ref('main')
const searchQuery = ref('')

const defaultChar = charactersDataVi.find(c => c.name.includes('Zombieman') && c.tier === 'UR+') || charactersDataVi[0]
const selectedChar = ref(charactersDataVi.find(c => c.id === route.query.character) || defaultChar)
const supportChar = ref(null)

watch(() => route.query.character, (characterId) => {
  if (!characterId) return
  const character = charactersDataVi.find(c => c.id === characterId)
  if (!character) return
  selectedChar.value = character
  supportChar.value = null
})

const getLocalizedCharacter = (character) => {
  if (!character || locale.value !== 'en') return character
  return charactersDataEn.find(c => c.id === character.id) || character
}

const getCharacterName = (character) => getLocalizedCharacter(character)?.name || ''
const getFactionName = (faction) => ({
  'Anh Hùng': t('filters.faction.hero'),
  'Quái Nhân': t('filters.faction.monster'),
  'Võ Thuật': t('filters.faction.martial_artist'),
  'Tội Phạm': t('filters.faction.outlaw'),
  'Ác Nhân': t('filters.faction.villain')
}[faction] || faction)
const getTypeName = (type) => ({
  'Vũ Trang': t('filters.type.duelist'),
  'Giác Đấu': t('filters.type.grappler'),
  'Tâm Linh': t('filters.type.esper'),
  'Công Nghệ': t('filters.type.hi_tech')
}[type] || type)

const filteredChars = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  
  let list = charactersDataVi
  if (modalTarget.value === 'support' && selectedChar.value) {
    list = list.filter(c => c.faction === selectedChar.value.faction && !['N', 'R'].includes(c.tier))
  }

  if (!query) return list
  return list.filter(c => getCharacterName(c).toLowerCase().includes(query))
})

const openModal = (target) => {
  modalTarget.value = target
  showCharModal.value = true
}

const selectCharacter = (char) => {
  if (modalTarget.value === 'main') {
    selectedChar.value = char
    if (supportChar.value && supportChar.value.faction !== char.faction) {
      supportChar.value = null
    }
  } else {
    supportChar.value = char
  }
  showCharModal.value = false
}

const supportCharDisplay = computed(() => {
  if (supportChar.value) {
    return {
      name: getCharacterName(supportChar.value),
      imageURL: supportChar.value.imageURL,
      tier: '≥ SR',
      awaken: 5,
      color: t('mastery.colorPurple')
    }
  }
  return {
    name: t('mastery.factionChar', { faction: getFactionName(selectedChar.value.faction || '') }),
    imageURL: null,
    tier: '≥ SR',
    awaken: 5,
    color: t('mastery.colorPurple')
  }
})

const tierDiff = computed(() => Math.max(0, toTier.value - fromTier.value))

const statsData = {
  phe_he: [
    { atk: 0, hp: 0 },
    { atk: 0, hp: 0 },
    { atk: 840, hp: 5040 },
    { atk: 1680, hp: 10080 },
    { atk: 2520, hp: 15120 },
    { atk: 3360, hp: 20160 },
    { atk: 4200, hp: 25200 },
    { atk: 5040, hp: 30240 },
    { atk: 6720, hp: 40320 },
    { atk: 10080, hp: 60480 },
    { atk: 17220, hp: 103320 }
  ],
  cap: [
    { atk: 0, hp: 0 },
    { atk: 0, hp: 0 },
    { atk: 600, hp: 3600 },
    { atk: 1200, hp: 7200 },
    { atk: 1800, hp: 10800 },
    { atk: 2400, hp: 14400 },
    { atk: 3000, hp: 18000 },
    { atk: 3600, hp: 21600 },
    { atk: 4800, hp: 28800 },
    { atk: 7200, hp: 43200 },
    { atk: 8600, hp: 51600 }
  ]
}

const currentStats = computed(() => {
  const arr = subTab.value === 'cap' ? statsData.cap : statsData.phe_he
  return arr[fromTier.value] || arr[arr.length - 1]
})

const targetStats = computed(() => {
  const arr = subTab.value === 'cap' ? statsData.cap : statsData.phe_he
  return arr[toTier.value] || arr[arr.length - 1]
})

const requirementsData = [
  [],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '2★ vàng', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ: Đột Phá ', highlight: '3★ (vàng)', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '3★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '2★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Đột Phá ', highlight: '3★ (vàng)', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '3★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '3★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Đột Phá ', highlight: '4★ (vàng)', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '4★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '3★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '2★ (tím)', color: 'text-purple-400' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '4★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '4★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '2★ (tím)', color: 'text-purple-400' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '5★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '4★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '3★ (tím)', color: 'text-purple-400' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '5★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '5★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '3★ (tím)', color: 'text-purple-400' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '6★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '5★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '4★ (tím)', color: 'text-purple-400' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '6★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '6★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '4★ (tím)', color: 'text-purple-400' }
  ],
  [
    { text: 'Bản thân đột phá đạt ', highlight: '7★ vàng', color: 'text-[#eab308]' },
    { text: 'Huy Hiệu của bản thân đạt ', highlight: '6★', color: 'text-white' },
    { text: 'Nhân vật hỗ trợ: Thức Tỉnh ', highlight: '5★ (tím)', color: 'text-purple-400' }
  ]
]

const heRequirementsData = [
  [],
  [
    { text: 'Cần ', highlight: '2 nhân vật {TYPE} đạt 3★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 45', color: 'text-white' }
  ],
  [
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt 3★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 50', color: 'text-white' },
    { text: 'Cần ', highlight: '2 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 2', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 1', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt 4★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 55', color: 'text-white' },
    { text: 'Cần ', highlight: '3 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 2', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 2', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 1', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '4 nhân vật {TYPE} đạt 4★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 60', color: 'text-white' },
    { text: 'Cần ', highlight: '3 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 3', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 2', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 2', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '4 nhân vật {TYPE} đạt 5★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 65', color: 'text-white' },
    { text: 'Cần ', highlight: '4 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 3', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 3', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 2', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '5 nhân vật {TYPE} đạt 5★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 70', color: 'text-white' },
    { text: 'Cần ', highlight: '4 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 4', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 3', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 3', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '5 nhân vật {TYPE} đạt 6★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 75', color: 'text-white' },
    { text: 'Cần ', highlight: '5 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 4', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 4', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 3', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '6 nhân vật {TYPE} đạt 6★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 80', color: 'text-white' },
    { text: 'Cần ', highlight: '5 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 5', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 4', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 4', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '6 nhân vật {TYPE} đạt 7★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 85', color: 'text-white' },
    { text: 'Cần ', highlight: '5 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 6', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 5', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 4', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '7 nhân vật {TYPE} đạt 7★ vàng', color: 'text-[#eab308]' },
    { text: 'Training Center · ', highlight: 'lv trung bình đạt 90', color: 'text-white' },
    { text: 'Cần ', highlight: '5 nhân vật phe {FACTION} đạt tinh thông phe (thủ) tier 7', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Huy Hiệu Lv 5', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Huy Hiệu Lv 5', color: 'text-[#eab308]' }
  ]
]

const capRequirementsData = [
  [],
  [
    { text: 'Cần ', highlight: '3 nhân vật hạng S đạt 1★ tím', color: 'text-purple-400' },
    { text: 'Kỷ Vật đạt ', highlight: '2★', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Kỷ Vật đạt ', highlight: '2★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '2 nhân vật {TYPE} đạt tinh thông hệ (công) tier 2', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 1', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '4 nhân vật hạng S đạt 2★ tím', color: 'text-purple-400' },
    { text: 'Kỷ Vật đạt ', highlight: '3★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '2 nhân vật {TYPE} đạt tinh thông hệ (công) tier 3', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 2', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 1', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Kỷ Vật đạt ', highlight: '3★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '2 nhân vật {TYPE} đạt tinh thông hệ (công) tier 3', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 2', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 2', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '4 nhân vật hạng S đạt 3★ tím', color: 'text-purple-400' },
    { text: 'Kỷ Vật đạt ', highlight: '4★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '2 nhân vật {TYPE} đạt tinh thông hệ (công) tier 4', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 3', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 2', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Kỷ Vật đạt ', highlight: '4★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt tinh thông hệ (công) tier 4', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 3', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 3', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '5 nhân vật hạng S đạt 4★ tím', color: 'text-purple-400' },
    { text: 'Kỷ Vật đạt ', highlight: '5★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt tinh thông hệ (công) tier 5', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 4', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 3', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Kỷ Vật đạt ', highlight: '5★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt tinh thông hệ (công) tier 5', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 4', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 4', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Cần ', highlight: '5 nhân vật hạng S đạt 5★ tím', color: 'text-purple-400' },
    { text: 'Kỷ Vật đạt ', highlight: '6★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt tinh thông hệ (công) tier 6', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 5', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 4', color: 'text-[#eab308]' }
  ],
  [
    { text: 'Kỷ Vật đạt ', highlight: '6★', color: 'text-[#eab308]' },
    { text: 'Cần ', highlight: '3 nhân vật {TYPE} đạt tinh thông hệ (công) tier 6', color: 'text-[#3b82f6]' },
    { text: 'Nhân vật hỗ trợ 1: ', highlight: 'Kỷ Vật Lv 5', color: 'text-[#eab308]' },
    { text: 'Nhân vật hỗ trợ 2: ', highlight: 'Kỷ Vật Lv 5', color: 'text-[#eab308]' }
  ]
]

const translateRequirement = (condition) => {
  if (locale.value !== 'en') return condition

  const translate = (value) => value
    .replace('Bản thân đột phá đạt ', 'Self breakthrough reaches ')
    .replace('Huy Hiệu của bản thân đạt ', 'Own Insignia reaches ')
    .replace('Nhân vật hỗ trợ: Đột Phá ', 'Support character: Breakthrough ')
    .replace('Nhân vật hỗ trợ: Thức Tỉnh ', 'Support character: Awaken ')
    .replace('Nhân vật hỗ trợ 1: ', 'Support character 1: ')
    .replace('Nhân vật hỗ trợ 2: ', 'Support character 2: ')
    .replace('Cần ', 'Require ')
    .replace('Kỷ Vật đạt ', 'Keepsake reaches ')
    .replace(/(\d+) nhân vật hạng S đạt (\d+★) tím/, '$1 S-rank characters reach $2 Purple')
    .replace(/(\d+) nhân vật (.+) đạt (\d+★) vàng/, '$1 $2 characters reach $3 Gold')
    .replace(/lv trung bình đạt (\d+)/, 'average level reaches $1')
    .replace(/(\d+) nhân vật phe (.+) đạt tinh thông phe \(thủ\) tier (\d+)/, '$1 $2 characters reach Faction Mastery (DEF) Tier $3')
    .replace(/(\d+) nhân vật (.+) đạt tinh thông hệ \(công\) tier (\d+)/, '$1 $2 characters reach Type Mastery (ATK) Tier $3')
    .replace('Huy Hiệu Lv ', 'Insignia Lv ')
    .replace('Kỷ Vật Lv ', 'Keepsake Lv ')
    .replaceAll(' vàng', ' Gold')
    .replaceAll('(vàng)', '(Gold)')
    .replaceAll(' tím', ' Purple')
    .replaceAll('(tím)', '(Purple)')

  return { ...condition, text: translate(condition.text), highlight: translate(condition.highlight) }
}

const targetRequirement = computed(() => {
  if (tierDiff.value === 0) return null
  
  const typeStr = getTypeName(selectedChar.value.type || 'Khác')
  const factionStr = getFactionName(selectedChar.value.faction || 'Khác')
  
  const replacePlaceholders = (cond) => {
    return {
      ...cond,
      highlight: cond.highlight.replace('{TYPE}', typeStr).replace('{FACTION}', factionStr)
    }
  }
  
  if (subTab.value === 'he' && heRequirementsData[toTier.value]) {
    return heRequirementsData[toTier.value].map(replacePlaceholders).map(translateRequirement)
  } else if (subTab.value === 'cap' && capRequirementsData[toTier.value]) {
    return capRequirementsData[toTier.value].map(replacePlaceholders).map(translateRequirement)
  } else if (subTab.value === 'phe' && requirementsData[toTier.value]) {
    return requirementsData[toTier.value].map(translateRequirement)
  }
  
  return null
})

const materialData = {
  phe: [
    {}, // 0
    { vatlieu: 0, chungchi: 1, the_plus_plus: 0, the_plus: 2, the: 9, vang: 1000 },
    { vatlieu: 240, chungchi: 2, the_plus_plus: 0, the_plus: 5, the: 1, vang: 6000 },
    { vatlieu: 444, chungchi: 4, the_plus_plus: 0, the_plus: 8, the: 6, vang: 7000 },
    { vatlieu: 565, chungchi: 8, the_plus_plus: 1, the_plus: 5, the: 0, vang: 12000 },
    { vatlieu: 871, chungchi: 10, the_plus_plus: 2, the_plus: 7, the: 0, vang: 13000 },
    { vatlieu: 1235, chungchi: 14, the_plus_plus: 4, the_plus: 9, the: 0, vang: 18000 },
    { vatlieu: 1605, chungchi: 17, the_plus_plus: 9, the_plus: 3, the: 0, vang: 19000 },
    { vatlieu: 1980, chungchi: 21, the_plus_plus: 17, the_plus: 13, the: 0, vang: 24000 },
    { vatlieu: 2254, chungchi: 26, the_plus_plus: 20, the_plus: 11, the: 0, vang: 25000 },
    { vatlieu: 2472, chungchi: 32, the_plus_plus: 25, the_plus: 29, the: 0, vang: 30000 }
  ],
  he: [
    {}, // 0
    { sotay: 0, chungnhan: 1, the_he_he: 2, vatlieu: 0, the: 2, vang: 1000 },
    { sotay: 75, chungnhan: 2, the_he_he: 3, vatlieu: 0, the: 6, vang: 6000 },
    { sotay: 156, chungnhan: 4, the_he_he: 4, vatlieu: 0, the: 7, vang: 7000 },
    { sotay: 282, chungnhan: 6, the_he_he: 6, vatlieu: 0, the: 8, vang: 12000 },
    { sotay: 438, chungnhan: 8, the_he_he: 3, vatlieu: 1, the: 0, vang: 13000 },
    { sotay: 663, chungnhan: 8, the_he_he: 3, vatlieu: 2, the: 0, vang: 18000 },
    { sotay: 886, chungnhan: 10, the_he_he: 5, vatlieu: 4, the: 0, vang: 19000 },
    { sotay: 1096, chungnhan: 10, the_he_he: 3, vatlieu: 8, the: 0, vang: 24000 },
    { sotay: 1262, chungnhan: 12, the_he_he: 18, vatlieu: 10, the: 0, vang: 25000 },
    { sotay: 1423, chungnhan: 12, the_he_he: 16, vatlieu: 14, the: 0, vang: 30000 }
  ],
  cap: [
    {}, // 0
    { sotay: 8, manh: 1, chungchi: 0, vang: 1000 },
    { sotay: 12, manh: 1, chungchi: 0, vang: 1000 },
    { sotay: 15, manh: 2, chungchi: 2, vang: 2000 },
    { sotay: 18, manh: 3, chungchi: 0, vang: 2000 },
    { sotay: 22, manh: 3, chungchi: 2, vang: 3000 },
    { sotay: 25, manh: 4, chungchi: 0, vang: 3000 },
    { sotay: 29, manh: 5, chungchi: 0, vang: 4000 },
    { sotay: 33, manh: 6, chungchi: 3, vang: 4000 },
    { sotay: 36, manh: 7, chungchi: 0, vang: 5000 },
    { sotay: 39, manh: 8, chungchi: 3, vang: 5000 }
  ]
}

const getMaterialList = computed(() => {
  if (tierDiff.value === 0) return []
  
  const faction = selectedChar.value.faction || 'Khác'
  const type = selectedChar.value.type || 'Khác'
  const tier = selectedChar.value.tier || 'SSR'

  let pheSuffix = 'Khac'
  if (faction === 'Anh Hùng') pheSuffix = 'Ah'
  if (faction === 'Quái Nhân') pheSuffix = 'Qn'

  let heSuffix = 'VuTrang'
  if (type === 'Giác Đấu') heSuffix = 'Gdau'
  if (type === 'Tâm Linh') heSuffix = 'TamLinh'
  if (type === 'Công Nghệ') heSuffix = 'CNghe'

  const manhPrefix = faction === 'Anh Hùng' ? 'manh_ah' : 'manh_qn'
  let manhSuffix = 'sr'
  if (tier.includes('SSR')) manhSuffix = 'Ssr'
  if (tier.includes('UR')) manhSuffix = 'Ur'

  const sumPhe = { vatlieu: 0, chungchi: 0, the_plus: 0, the_plus_plus: 0, the: 0, vang: 0 }
  const sumHe = { sotay: 0, chungnhan: 0, the_he_he: 0, vatlieu: 0, the: 0, vang: 0 }
  const sumCap = { sotay: 0, manh: 0, chungchi: 0, vang: 0 }

  for (let i = fromTier.value + 1; i <= toTier.value; i++) {
    const p = materialData.phe[i]
    if (p) {
      sumPhe.vatlieu += p.vatlieu; sumPhe.chungchi += p.chungchi; sumPhe.the_plus += p.the_plus; sumPhe.the_plus_plus += p.the_plus_plus; sumPhe.the += p.the; sumPhe.vang += p.vang
    }
    const h = materialData.he[i]
    if (h) {
      sumHe.sotay += h.sotay; sumHe.chungnhan += h.chungnhan; sumHe.the_he_he += h.the_he_he; sumHe.vatlieu += h.vatlieu; sumHe.the += h.the; sumHe.vang += h.vang
    }
    const c = materialData.cap[i]
    if (c) {
      sumCap.sotay += c.sotay; sumCap.manh += c.manh; sumCap.chungchi += c.chungchi; sumCap.vang += c.vang
    }
  }

  if (subTab.value === 'phe') {
    return [
      { name: t('mastery.materialFactionCard'), icon: `/Mastery/The-Phe-${pheSuffix}1.png`, count: sumPhe.the },
      { name: t('mastery.materialFactionCardPlus'), icon: `/Mastery/The-Phe-${pheSuffix}2.png`, count: sumPhe.the_plus },
      { name: t('mastery.materialFactionCardPlusPlus'), icon: `/Mastery/The-Phe-${pheSuffix}3.png`, count: sumPhe.the_plus_plus },
      { name: t('mastery.materialFactionCertificate'), icon: '/Mastery/Chung_nhan_phe.png', count: sumPhe.chungchi },
      { name: t('mastery.materialFactionEssence'), icon: '/Mastery/Vat_Lieu_tinh_thong_phe.png', count: sumPhe.vatlieu },
      { name: t('mastery.gold'), icon: '/Mastery/ico_large_gold.png', count: sumPhe.vang }
    ].filter(i => i.count > 0).map(i => ({ ...i, count: formatNum(i.count) }))
  } else if (subTab.value === 'he') {
    return [
      { name: t('mastery.materialTypeBook'), icon: '/Mastery/so_tay_he.png', count: sumHe.sotay },
      { name: t('mastery.materialTypeCertificate'), icon: '/Mastery/Chung_chi_he.png', count: sumHe.chungnhan },
      { name: t('mastery.materialTypeCardByType'), icon: `/Mastery/the_he_${heSuffix}3.png`, count: sumHe.the_he_he },
      { name: t('mastery.materialTypeEssence'), icon: `/Mastery/the_he_${heSuffix}2.png`, count: sumHe.vatlieu },
      { name: t('mastery.materialTypeCard'), icon: `/Mastery/the_he_${heSuffix}1.png`, count: sumHe.the },
      { name: t('mastery.gold'), icon: '/Mastery/ico_large_gold.png', count: sumHe.vang }
    ].filter(i => i.count > 0).map(i => ({ ...i, count: formatNum(i.count) }))
  } else if (subTab.value === 'cap') {
    return [
      { name: t('mastery.materialTierBook'), icon: '/Mastery/so_tay_cap.png', count: sumCap.sotay },
      { name: t('mastery.materialTierFragment', { faction: getFactionName(faction), tier }), icon: `/Mastery/${manhPrefix}_${manhSuffix}.png`, count: sumCap.manh },
      { name: t('mastery.materialTierCertificate'), icon: '/Mastery/Chung_chi_Cap.png', count: sumCap.chungchi },
      { name: t('mastery.gold'), icon: '/Mastery/ico_large_gold.png', count: sumCap.vang }
    ].filter(i => i.count > 0).map(i => ({ ...i, count: formatNum(i.count) }))
  }
  return []
})

const formatNum = (num) => new Intl.NumberFormat('en-US').format(num)

const getFactionIcon = computed(() => {
  const map = {
    'Anh Hùng': 'Hero',
    'Quái Nhân': 'Monster',
    'Võ Thuật': 'Martial_Artist',
    'Tội Phạm': 'Outlaw'
  }
  const f = map[selectedChar.value.faction] || 'Other'
  return `/Faction/${f}.png`
})

const getTypeIcon = computed(() => {
  const map = {
    'Vũ Trang': 'Duelist',
    'Giác Đấu': 'Grappler',
    'Tâm Linh': 'Esper',
    'Công Nghệ': 'Hi-Tech'
  }
  const t = map[selectedChar.value.type] || 'Duelist'
  return `/Series/${t}.png`
})

const getTierIcon = computed(() => {
  return `/Class/${selectedChar.value.classLevel || 'Class_S'}.png`
})

const getCharacterImage = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/')) return filename
  return new URL(`../assets/characters/${filename}`, import.meta.url).href
}

</script>

<template>
  <main class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
    <div class="text-center mb-12">
      <h3 class="text-gray-400 uppercase tracking-widest text-xs mb-2">{{ t('mastery.featureTitle') }}</h3>
      <h1 class="text-4xl font-black text-white mb-2">{{ t('mastery.title') }}</h1>
      <p class="text-gray-400">{{ t('mastery.desc') }}</p>
    </div>
    
    <!-- Tài nguyên nâng cấp -->
    <div class="space-y-6">
      <!-- Character Select Box -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div class="flex items-center space-x-4 sm:space-x-6">
          <div @click="openModal('main')" class="w-24 h-32 rounded-lg border border-[#ef4444] overflow-hidden relative cursor-pointer hover:scale-105 transition-transform bg-[#0b0c10]">
            <img :src="getCharacterImage(selectedChar.imageURL)" class="w-full h-full object-cover object-top" onerror="this.style.display='none'"/>
            <div class="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[10px] font-bold text-center py-1 border-t border-[#ef4444]">
              <span class="text-gray-400 mr-1">🔄</span>{{ t('mastery.changeChar') }}
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-black text-white mb-2">{{ getCharacterName(selectedChar) }}</h2>
            <div class="flex gap-2">
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ selectedChar.tier }}</span>
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ getFactionName(selectedChar.faction) }}</span>
              <span class="px-2 py-0.5 bg-[#12131a] text-gray-300 rounded-full text-xs border border-gray-700 font-bold">{{ getTypeName(selectedChar.type) }}</span>
            </div>
          </div>
        </div>
        
        <div @click="openModal('support')" class="w-full md:w-auto flex items-center space-x-3 bg-[#0b0c10] border border-gray-800 rounded-xl p-4 border-dashed border-[#f97316]/50 cursor-pointer hover:bg-[#12131a] transition-colors">
          <div v-if="!supportCharDisplay.imageURL" class="w-8 h-8 rounded bg-[#1f2937] flex items-center justify-center border border-gray-700 shrink-0">
            <span class="text-[#ef4444] font-bold">+</span>
          </div>
          <div v-else class="w-8 h-8 rounded bg-[#1f2937] overflow-hidden border border-gray-700 flex items-center justify-center">
            <img :src="getCharacterImage(supportCharDisplay.imageURL)" class="w-full h-full object-cover object-top" onerror="this.style.display='none'"/>
          </div>
          <div>
            <div class="text-white font-bold text-sm">{{ supportCharDisplay.name }}</div>
            <div class="text-gray-400 text-xs">{{ t('mastery.sameFaction') }} · {{ supportCharDisplay.tier }}</div>
            <div class="text-[#eab308] text-xs">→ {{ t('mastery.awaken') }} {{ supportCharDisplay.awaken }}★ ({{ supportCharDisplay.color }})</div>
          </div>
        </div>
      </div>

      <!-- Sub Tabs -->
      <div class="grid grid-cols-3 gap-2 pb-2">
        <button 
          @click="switchSubTab('phe')"
          class="py-2 sm:py-3 rounded-lg font-bold transition-colors flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'phe' ? 'bg-[#12131a] border-[#f97316] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getFactionIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabFaction') }}</span>
        </button>
        <button 
          @click="switchSubTab('he')"
          class="py-2 sm:py-3 rounded-lg font-bold transition-colors flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'he' ? 'bg-[#12131a] border-[#00d8b6] text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getTypeIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabType') }}</span>
        </button>
        <button 
          @click="switchSubTab('cap')"
          class="py-2 sm:py-3 rounded-lg font-bold transition-colors flex flex-col lg:flex-row items-center justify-center gap-1 sm:gap-2 border text-[11px] sm:text-sm text-center leading-tight"
          :class="subTab === 'cap' ? 'bg-[#12131a] border-gray-500 text-white' : 'border-gray-800 bg-[#0b0c10] text-gray-500 hover:text-white'"
        >
          <img :src="getTierIcon" class="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
          <span>{{ t('mastery.tabTier') }}</span>
        </button>
      </div>

      <!-- Content Area -->
      <transition :name="masteryTransition" mode="out-in">
        <div :key="subTab" class="bg-[#12131a] border border-gray-800 rounded-lg p-6">
        <div class="flex items-center space-x-3 mb-8 pb-4 border-b border-gray-800">
          <img :src="subTab === 'phe' ? getFactionIcon : subTab === 'he' ? getTypeIcon : getTierIcon" class="w-12 h-12 object-contain drop-shadow-lg" />
          <div>
            <h3 class="text-white font-bold text-lg">
              {{ subTab === 'phe' ? t('mastery.tabFaction') : subTab === 'he' ? t('mastery.tabType') : t('mastery.tabTier') }}
            </h3>
            <div class="text-[#ef4444] text-xs font-bold">
              {{ subTab === 'phe' ? getFactionName(selectedChar.faction) : subTab === 'he' ? getTypeName(selectedChar.type) : selectedChar.tier }}
            </div>
          </div>
        </div>

        <!-- Tier Selectors -->
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div class="text-gray-500 text-xs mb-2">{{ t('mastery.fromTier') }}</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="fromTier = Math.max(0, fromTier - 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <span class="text-white font-bold text-sm">{{ fromTier === 0 ? t('mastery.notOpened') : 'Tier ' + fromTier }}</span>
              <button @click="fromTier = Math.min(toTier - 1, fromTier + 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-xs mb-2">{{ t('mastery.toTier') }}</div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded p-1">
              <button @click="toTier = Math.max(fromTier + 1, toTier - 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">-</button>
              <span class="text-white font-bold text-sm">Tier {{ toTier }}</span>
              <button @click="toTier = Math.min(10, toTier + 1)" class="w-8 h-8 rounded bg-[#1f2937] text-white font-bold hover:bg-gray-700">+</button>
            </div>
          </div>
        </div>

        <!-- Stats Gained -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.statsGained') }}</h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">ATK</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ formatNum(currentStats.atk) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.atk) }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">DEF</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ formatNum(currentStats.atk) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.atk) }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between bg-[#0b0c10] border border-gray-800 rounded-lg px-4 py-3">
              <span class="text-[#ef4444] font-bold text-sm">HP</span>
              <div class="flex items-center space-x-2 text-sm font-mono">
                <span class="text-gray-500">{{ formatNum(currentStats.hp) }}</span>
                <span class="text-[#ef4444]">→</span>
                <span class="text-white font-bold">{{ formatNum(targetStats.hp) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Materials -->
        <div class="mb-8">
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.materials') }}</h4>
          <div v-if="tierDiff === 0" class="text-gray-500 text-sm">{{ t('mastery.materialsHint') }}</div>
          <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="mat in getMaterialList" :key="mat.name" class="bg-[#0b0c10] border border-gray-800 rounded-lg p-3 flex flex-col justify-center items-center text-center hover:border-gray-600 transition-colors">
              <img :src="mat.icon" :alt="mat.name" class="w-14 h-14 object-contain mb-2 drop-shadow-lg" onerror="this.src='/placeholder.png'"/>
              <div class="text-gray-400 text-[10px] leading-tight min-h-[24px] flex items-center">{{ mat.name }}</div>
              <div class="text-white font-bold text-sm mt-1" :class="mat.name === t('mastery.gold') ? 'text-[#eab308]' : ''">×{{ mat.count }}</div>
            </div>
          </div>
        </div>

        <!-- Requirements -->
        <div>
          <h4 class="text-gray-500 text-xs uppercase tracking-widest mb-4">{{ t('mastery.requirements') }}</h4>
          <div v-if="!targetRequirement" class="text-gray-500 text-sm">{{ t('mastery.requirementsHint') }}</div>
          <div v-else class="bg-gradient-to-r from-[#1a1c23] to-[#0b0c10] border border-[#f97316]/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-[#f97316]"></div>
            <div class="flex items-center justify-between mb-4 border-b border-gray-800/50 pb-3">
              <div class="flex items-center space-x-2">
                <div class="w-6 h-6 rounded-full bg-[#f97316]/20 flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
                </div>
                <h3 class="text-white font-black text-lg">{{ t('mastery.targetTier') }} {{ toTier }}</h3>
              </div>
              <span class="text-[10px] uppercase tracking-wider text-gray-500 bg-black/40 px-2 py-1 rounded border border-gray-800 hidden sm:block">{{ t('mastery.mergedConditions') }}</span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="(cond, index) in targetRequirement" :key="index" class="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-gray-800/50 hover:border-gray-600 transition-colors">
                <div class="text-[#f97316] mt-0.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="text-sm text-gray-300 leading-tight">
                  {{ cond.text }}<strong :class="cond.color">{{ cond.highlight }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </transition>
    </div>

    <!-- Character Selection Modal -->
    <div v-if="showCharModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="showCharModal = false">
      <div class="bg-[#12131a] border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh]">
        <div class="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0b0c10] rounded-t-xl">
          <h3 class="text-xl font-bold text-white">{{ t('mastery.selectChar') }}</h3>
          <button @click="showCharModal = false" class="text-gray-400 hover:text-white transition-colors p-2 text-2xl leading-none">&times;</button>
        </div>
        <div class="p-4 bg-[#0b0c10]">
          <input type="text" v-model="searchQuery" :placeholder="t('mastery.searchChar')" class="w-full bg-[#12131a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-opm-gold focus:outline-none transition-colors" />
        </div>
        <div class="flex-1 overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 content-start">
          <div 
            v-for="char in filteredChars" 
            :key="char.id"
            @click="selectCharacter(char)"
            class="cursor-pointer border border-transparent hover:border-opm-gold rounded-lg bg-[#0b0c10] p-2 flex flex-col items-center transition-all hover:scale-105"
          >
            <div class="w-14 h-14 rounded-full border-2 overflow-hidden mb-2" :class="char.tier.includes('UR') ? 'border-red-500' : char.tier.includes('SSR') ? 'border-yellow-500' : 'border-gray-500'">
              <img :src="getCharacterImage(char.imageURL)" class="w-full h-full object-cover object-top" onerror="this.style.display='none'"/>
            </div>
            <span class="text-[11px] text-center text-white font-bold leading-tight line-clamp-2 w-full">{{ getCharacterName(char) }}</span>
            <span class="text-[10px] text-gray-500 mt-1 font-mono">{{ char.tier }}</span>
          </div>
          
          <div v-if="filteredChars.length === 0" class="col-span-full py-10 text-center text-gray-500">
            {{ t('mastery.noCharFound') }}
          </div>
        </div>
      </div>
    </div>

  </main>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
