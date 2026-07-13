<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import charactersDataVi from '../data/characters.json'
import charactersDataEn from '../data/characters_en.json'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const { t, locale } = useI18n()
const charactersData = computed(() => locale.value === 'en' ? charactersDataEn : charactersDataVi)
const character = computed(() => charactersData.value.find(c => c.id === props.id) || null)

const getCharacterImage = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/')) return filename
  return new URL(`../assets/characters/${filename}`, import.meta.url).href
}

const getAccentColor = (tier) => {
  if (tier === 'UR+') return 'text-[color:var(--theme-color)]'
  return 'text-white'
}

const getBgAccentColor = (tier) => {
  if (tier === 'UR+') return 'bg-[color:var(--theme-color)]'
  return 'bg-white'
}

const getBorderAccentColor = (tier) => {
  if (tier === 'UR+') return 'border-[color:var(--theme-color)]'
  return 'border-white'
}

const themeColorHex = computed(() => {
  const t = character.value?.type?.toLowerCase() || ''
  if (t.includes('vũ trang') || t.includes('duelist')) return '#ffb300'
  if (t.includes('giác đấu') || t.includes('grappler')) return '#ff3b3b'
  if (t.includes('tâm linh') || t.includes('esper')) return '#b861ff'
  if (t.includes('công nghệ') || t.includes('hi-tech')) return '#00a8ff'
  return '#ffb300'
})

const typeIcon = computed(() => {
  const t = character.value?.type?.toLowerCase() || ''
  if (t.includes('vũ trang') || t.includes('duelist')) return '/Series/Duelist.png'
  if (t.includes('giác đấu') || t.includes('grappler')) return '/Series/Grappler.png'
  if (t.includes('tâm linh') || t.includes('esper')) return '/Series/Esper.png'
  if (t.includes('công nghệ') || t.includes('hi-tech')) return '/Series/Hi-Tech.png'
  return ''
})

const tierIcon = computed(() => {
  if (character.value?.tier) {
    return `/Quality/${character.value.tier}.png`
  }
  return ''
})

const factionIcon = computed(() => {
  const f = character.value?.faction?.toLowerCase() || ''
  if (f.includes('anh hùng') || f.includes('hero')) return '/Faction/Hero.png'
  if (f.includes('quái vật') || f.includes('quái nhân') || f.includes('monster')) return '/Faction/Monster.png'
  if (f.includes('võ thuật') || f.includes('martial')) return '/Faction/Martial_Artist.png'
  if (f.includes('tội phạm') || f.includes('outlaw')) return '/Faction/Outlaw.png'
  return ''
})

const themeColorRgb = computed(() => {
  const hex = themeColorHex.value
  let r = 0, g = 0, b = 0
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  }
  return `${r}, ${g}, ${b}`
})

const activeSkillTab = ref('basic')

const expandedSkills = ref([])
const toggleSkill = (skillName) => {
  const index = expandedSkills.value.indexOf(skillName)
  if (index > -1) {
    expandedSkills.value.splice(index, 1) // Đóng
  } else {
    expandedSkills.value.push(skillName) // Mở
  }
}

const currentExpandedSkillObj = computed(() => {
  if (!character.value || !character.value.skills) return null
  const lastOpened = expandedSkills.value[expandedSkills.value.length - 1]
  if (!lastOpened) return null
  return character.value.skills.find(s => s.name === lastOpened)
})

const releaseDates = computed(() => {
  if (!character.value) return null;
  
  const format = (date, month, year) => {
    let newM = month;
    let newY = year;
    while (newM > 12) {
      newM -= 12;
      newY += 1;
    }
    return `${date.toString().padStart(2, '0')}/${newM.toString().padStart(2, '0')}/${newY}`;
  }

  const trungStr = character.value.releaseTrung;
  let tRelease = 'Không xác định';
  let tReturn = 'Không xác định';
  let sRelease = 'Không xác định';
  let sReturn = 'Không xác định';

  if (trungStr) {
    const cleanTrung = trungStr.replace(/\s+/g, '');
    const tParts = cleanTrung.split(/[\/\-]/);
    
    let tm = 0, ty = 0;
    if (tParts.length === 3) {
      const td = parseInt(tParts[0], 10);
      tm = parseInt(tParts[1], 10);
      ty = parseInt(tParts[2], 10);
      tRelease = format(td, tm, ty);
      tReturn = format(15, tm + 2, ty);
    } else if (tParts.length === 2) {
      tm = parseInt(tParts[0], 10);
      ty = parseInt(tParts[1], 10);
      tRelease = format(1, tm, ty);
      tReturn = format(15, tm + 2, ty);
    } else {
      tRelease = trungStr;
    }
  }

  const explicitSea = character.value.releaseDate || character.value.releaseSea;
  if (explicitSea) {
    sRelease = explicitSea;
    const cleanSea = sRelease.replace(/\s+/g, '');
    const sParts = cleanSea.split(/[\/\-]/);
    
    if (sParts.length === 3) {
      const sm = parseInt(sParts[1], 10);
      const sy = parseInt(sParts[2], 10);
      sReturn = format(15, sm + 2, sy);
    } else if (sParts.length === 2) {
      const sm = parseInt(sParts[0], 10);
      const sy = parseInt(sParts[1], 10);
      sRelease = format(1, sm, sy);
      sReturn = format(15, sm + 2, sy);
    } else {
      sReturn = 'Không xác định';
    }
  }

  // If BOTH are completely empty, maybe we shouldn't even show the history block
  if (!trungStr && !explicitSea) {
    return null; // This will hide the LỊCH SỬ block entirely
  }

  return {
    trungRelease: tRelease,
    trungReturn: tReturn,
    seaRelease: sRelease,
    seaReturn: sReturn
  }
})

const getSkillsByType = (category) => {
  if (!character.value || !character.value.skills) return []
  const map = {
    'basic': ['Cơ bản', 'Kỹ năng thường', 'Basic', 'Basic Skill', 'Normal Skill'],
    'ult': ['Tuyệt kĩ', 'Siêu Tuyệt kĩ', 'Tuyệt chiêu', 'Ultimate', 'Super Ultimate'],
    'passive': ['Nội tại', 'Bị động', 'Bị động cực hạn', 'Bị động 5 sao', 'Passive', 'Extreme Passive', '5-Star Passive', 'Core'],
    'awaken': ['Thức tỉnh', 'Bị động thức tỉnh', 'Thức tỉnh 2', 'Thức tỉnh 3', 'Awaken', 'Awakening', 'Awakened Passive', 'Awaken 2', 'Awaken 3']
  }
  const allowed = map[category] || []
  return character.value.skills.filter(s => allowed.includes(s.type))
}

const skillCategories = computed(() => {
  const tabs = [
    { key: 'basic', label: t('detail.skill_tabs.basic') },
    { key: 'ult', label: t('detail.skill_tabs.ult') },
    { key: 'passive', label: t('detail.skill_tabs.passive') },
    { key: 'awaken', label: t('detail.skill_tabs.awaken') }
  ]
  return tabs.filter(tab => getSkillsByType(tab.key).length > 0)
})

const skillTransitionName = ref('fade')
const availableSkillTabsList = ['basic', 'ult', 'passive', 'awaken']

const switchTab = (category) => {
  const oldIndex = availableSkillTabsList.indexOf(activeSkillTab.value)
  const newIndex = availableSkillTabsList.indexOf(category)
  
  if (newIndex > oldIndex) {
    skillTransitionName.value = 'slide-left'
  } else if (newIndex < oldIndex) {
    skillTransitionName.value = 'slide-right'
  } else {
    skillTransitionName.value = 'fade'
  }

  activeSkillTab.value = category
  const skillsInTab = getSkillsByType(category)
  if (skillsInTab.length > 0) {
    expandedSkills.value = [skillsInTab[0].name]
  } else {
    expandedSkills.value = []
  }
}

const chuThichHieuUng = computed(() => {
  if (character.value?.effects && character.value.effects.length > 0) {
    return character.value.effects
  }
  return []
})

const formatSkillDesc = (desc) => {
  if (!desc) return ''
  return desc.replace(/\[(.*?)\]/g, (match, p1) => {
    const safeTerm = p1.replace(/'/g, "\\'")
    return `<a href="javascript:void(0)" class="text-[color:var(--theme-color)] font-bold hover:text-white transition-colors cursor-pointer border-b border-[color:var(--theme-color)] border-dashed" onclick="event.preventDefault(); event.stopPropagation(); if(window.scrollToEffectDetail) window.scrollToEffectDetail('${safeTerm}')">[${p1}]</a>`
  })
}

const dacTinh = computed(() => {
  return character.value?.dacTinh || []
})

const getProgress = (value, max) => {
  if (!value || !max) return '0%'
  return Math.min((value / max) * 100, 100) + '%'
}

watch(() => character.value, (newChar) => {
  if (newChar) {
    activeSkillTab.value = 'basic'
    const skillsInTab = getSkillsByType('basic')
    if (skillsInTab.length > 0) {
      expandedSkills.value = [skillsInTab[0].name]
    } else {
      expandedSkills.value = []
    }
  }
}, { immediate: true })

onMounted(() => {
  if (!character.value) {
    router.push('/')
  }
  
  window.scrollToEffectDetail = (rawTerm) => {
    const cleanSearch = rawTerm.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    let el = document.getElementById('effect-' + cleanSearch)
    
    if (!el) {
      const allEffects = document.querySelectorAll('[id^="effect-"]')
      const searchWords = rawTerm.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4)
      
      let bestMatch = Array.from(allEffects).find(e => {
        const titleSpan = e.querySelector('span:first-child')
        if (!titleSpan) return false
        const titleText = titleSpan.innerText.toLowerCase()
        return searchWords.some(w => titleText.includes(w))
      })
      
      if (!bestMatch) {
         const prefix = cleanSearch.substring(0, 4)
         if (prefix.length >= 4) {
             bestMatch = Array.from(allEffects).find(e => e.id.replace('effect-', '').startsWith(prefix))
         }
      }
      el = bestMatch
    }
    
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center'})
      el.classList.remove('flash-highlight')
      void el.offsetWidth
      el.classList.add('flash-highlight')
    }
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 bg-[#0b0c10] min-h-screen text-white font-sans overflow-x-hidden transition-colors duration-500" :style="{ '--theme-color': themeColorHex, '--theme-color-rgb': themeColorRgb }">
    <div v-if="!character" class="text-center text-white text-xl mt-20 font-mono tracking-widest animate-pulse">
      Đang tải dữ liệu lưu trữ...
    </div>

    <!-- HEADER HERO SECTION -->
    <div v-if="character" class="relative w-full rounded-2xl overflow-hidden mb-8 border border-white/5 bg-gradient-to-br from-[#12131a] to-[#0b0c10] shadow-2xl pb-16 pt-8 pl-10 pr-10">
      
      <!-- Background Character Image -->
      <img 
        :src="getCharacterImage(character.imageURL)" 
        class="absolute right-0 bottom-0 h-[90%] max-w-[60%] lg:max-w-[50%] object-contain object-right-bottom opacity-60 z-0 pointer-events-none drop-shadow-2xl"
        style="mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%), linear-gradient(to left, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%); mask-composite: intersect; -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 90%, rgba(0,0,0,0) 100%), linear-gradient(to left, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%); -webkit-mask-composite: source-in;"
        alt="Hero Background"
      />
      <!-- Gradient overlay for text readability -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/80 to-transparent z-0 pointer-events-none"></div>

      <div class="relative z-10 w-full md:w-2/3 lg:w-1/2 flex flex-col justify-start">
        
        <!-- TÊN NHÂN VẬT -->
        <h1 class="text-5xl lg:text-7xl font-black tracking-tight text-white drop-shadow-2xl uppercase mt-6 mb-2">
          {{ character.name }}
        </h1>
        
        <p class="text-[color:var(--theme-color)] font-bold text-xl drop-shadow-lg mb-4">{{ character.type }}</p>
        
        <!-- Rarity Badge -->
        <div class="mb-4 animate-pulse">
          <img v-if="tierIcon" :src="tierIcon" :alt="character.tier" class="h-8 w-auto object-contain drop-shadow-[0_0_15px_rgba(var(--theme-color-rgb),0.8)]" />
        </div>

        <div class="flex flex-col space-y-4 mb-10">
          <div class="flex items-center space-x-4">
            <span class="bg-[color:var(--theme-color)] text-[#000000] font-black text-xs tracking-widest px-3 py-1 rounded shadow-sm w-[84px] text-center antialiased flex items-center justify-center leading-none" style="font-family: Arial, sans-serif;">{{ t("detail.typeLabel") }}</span>
            <div class="flex items-center gap-2.5">
              <img v-if="typeIcon" :src="typeIcon" class="h-6 w-6 object-contain drop-shadow-md" />
              <span class="text-white font-bold text-lg drop-shadow-md">{{ character.type }}</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="bg-[color:var(--theme-color)] text-[#000000] font-black text-xs tracking-widest px-3 py-1 rounded shadow-sm w-[84px] text-center antialiased flex items-center justify-center leading-none" style="font-family: Arial, sans-serif;">{{ t("detail.factionLabel") }}</span>
            <div class="flex items-center gap-2.5">
              <img v-if="factionIcon" :src="factionIcon" class="h-6 w-6 object-contain drop-shadow-md" />
              <span class="text-white font-bold text-lg drop-shadow-md">{{ character.faction }}</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <span class="bg-[color:var(--theme-color)] text-[#000000] font-black text-xs tracking-widest px-3 py-1 rounded shadow-sm w-[84px] text-center antialiased flex items-center justify-center leading-none" style="font-family: Arial, sans-serif;">{{ t("detail.roleLabel") }}</span>
            <span class="text-white font-bold text-lg drop-shadow-md">{{ character.roles?.join(', ') || character.type }}</span>
          </div>
        </div>

        <!-- ĐẶC TÍNH -->
        <div class="mb-10" v-if="dacTinh && dacTinh.length > 0">
          <p class="text-[color:var(--theme-color)] font-extrabold text-[13px] tracking-widest uppercase mb-4 drop-shadow-md">{{ t("detail.traitsLabel") }}</p>
          <div class="flex flex-wrap gap-2">
            <div v-for="dt in dacTinh" :key="dt" class="border border-[color:var(--theme-color)]/50 text-[color:var(--theme-color)] font-bold text-[12px] px-3 py-1 rounded-md uppercase tracking-wider bg-[#161821] shadow-sm">
              {{ dt }}
            </div>
          </div>
        </div>

        <!-- DUYÊN -->
        <div class="mb-8 flex flex-col gap-3">
          <div>
            <p class="text-[color:var(--theme-color)] font-extrabold text-[13px] tracking-widest uppercase mb-3 drop-shadow-md">{{ t('detail.bond') }}</p>
            
            <div v-if="character.bondList" class="flex items-center gap-2 border border-gray-600 rounded-full px-3 py-1 bg-[#12131a] w-max mb-5">
              <svg class="w-3.5 h-3.5 text-[#00d8b6] fill-current flex-shrink-0" viewBox="0 0 24 24" style="transform: rotate(90deg);"><path d="M12 2L22 7.77V16.23L12 22L2 16.23V7.77L12 2Z"/></svg>
              <span class="text-white text-[12px] font-bold">{{ character.bondList }}</span>
            </div>

            <div class="inline-block bg-[color:var(--theme-color)] text-[#000000] font-black text-[12px] px-5 py-1 skew-x-[-12deg] shadow-lg mb-1" style="font-family: Arial, sans-serif; font-weight: 900;">
              <span class="inline-block skew-x-[12deg] tracking-wide">{{ character.duyen || t('detail.none') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS & BIO SECTION -->
    <div class="flex flex-col xl:flex-row gap-6 mb-12">
      <!-- 3 STAT PANELS -->
      <div class="w-full xl:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- BASE STATS -->
        <div class="bg-[#12131a] rounded-xl border border-gray-800 p-6 flex flex-col">
          <div class="flex items-center mb-6">
            <span class="text-[#ffb300] font-bold text-xs tracking-widest uppercase">{{ t('detail.baseStats') }}</span>
            <div class="flex-grow h-px bg-gray-800 ml-4"></div>
          </div>
          
          <div class="space-y-4">
            <div>
              <div class="flex justify-between items-end mb-1">
                <span class="text-white text-sm font-bold flex items-center gap-2">
                  <span class="text-[#ffb300]">⚔️</span> {{ t('detail.atk') }}
                </span>
                <span class="text-white font-black text-lg">{{ character.baseStats?.atk?.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#ffb300] h-full" :style="{ width: getProgress(character.baseStats?.atk, 1500) }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-end mb-1">
                <span class="text-white text-sm font-bold flex items-center gap-2">
                  <span class="text-[#00d8b6]">💖</span> {{ t('detail.hp') }}
                </span>
                <span class="text-white font-black text-lg">{{ character.baseStats?.hp?.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#ffb300] h-full" :style="{ width: getProgress(character.baseStats?.hp, 6000) }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-end mb-1">
                <span class="text-white text-sm font-bold flex items-center gap-2">
                  <span class="text-blue-400">🛡️</span> {{ t('detail.def') }}
                </span>
                <span class="text-white font-black text-lg">{{ character.baseStats?.def?.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#ffb300] h-full" :style="{ width: getProgress(character.baseStats?.def, 300) }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-end mb-1">
                <span class="text-white text-sm font-bold flex items-center gap-2">
                  <span class="text-green-400">👟</span> {{ t('detail.spd') }}
                </span>
                <span class="text-white font-black text-lg">{{ character.baseStats?.spd?.toLocaleString() }}</span>
              </div>
              <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#ffb300] h-full" :style="{ width: getProgress(character.baseStats?.spd, 200) }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- HISTORY (LICH SU) -->
        <div class="bg-[#12131a] rounded-xl border border-gray-800 p-6 flex flex-col" v-if="releaseDates">
          <div class="flex items-center mb-6">
            <span class="text-[#ffb300] font-bold text-xs tracking-widest uppercase">{{ t('detail.history') }}</span>
            <div class="flex-grow h-px bg-gray-800 ml-4"></div>
          </div>
          
          <div class="flex flex-col gap-4">
            <!-- TRUNG -->
            <div>
              <div class="text-[#ef4444] font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]"></span> {{ t('detail.serverTrung') }}
              </div>
              <div class="flex flex-col gap-3 pl-4 border-l-2 border-[#ef4444]/30 ml-1">
                <div class="flex justify-between items-center gap-2">
                  <span class="text-gray-400 font-bold text-xs uppercase tracking-widest whitespace-nowrap flex-shrink-0">{{ t('detail.releaseDate') }}</span>
                  <span class="text-white font-black text-sm lg:text-base tracking-widest text-right">{{ releaseDates.trungRelease }}</span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-gray-400 font-bold text-xs uppercase tracking-widest whitespace-nowrap flex-shrink-0">{{ t('detail.returnDate') }}</span>
                  <span class="text-white font-black text-sm lg:text-base tracking-widest text-right">{{ releaseDates.trungReturn }}</span>
                </div>
              </div>
            </div>

            <div class="h-px w-full bg-gray-800/50 my-1"></div>

            <!-- SEA -->
            <div>
              <div class="text-[#3b82f6] font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]"></span> {{ t('detail.serverSea') }}
              </div>
              <div class="flex flex-col gap-3 pl-4 border-l-2 border-[#3b82f6]/30 ml-1">
                <div class="flex justify-between items-center gap-2">
                  <span class="text-gray-400 font-bold text-xs uppercase tracking-widest whitespace-nowrap flex-shrink-0">{{ t('detail.releaseDate') }}</span>
                  <span class="text-white font-black text-sm lg:text-base tracking-widest text-right">{{ releaseDates.seaRelease }}</span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-gray-400 font-bold text-xs uppercase tracking-widest whitespace-nowrap flex-shrink-0">Trở Lại</span>
                  <span class="text-white font-black text-sm lg:text-base tracking-widest text-right">{{ releaseDates.seaReturn }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PVP STATS -->
        <div class="bg-[#12131a] rounded-xl border border-gray-800 p-6 flex flex-col">
          <div class="flex items-center mb-6">
            <span class="text-[#ffb300] font-bold text-xs tracking-widest uppercase">{{ t("detail.pvpStatsLabel") }}</span>
            <div class="flex-grow h-px bg-gray-800 ml-4"></div>
          </div>
          <div class="grid grid-cols-4 gap-2 mb-6">
            <div class="border border-gray-700 rounded-lg p-2 text-center">
              <span class="text-white font-black text-xl lg:text-2xl block">{{ character.pvpStats?.atk || 30 }}</span>
              <span class="text-gray-400 text-[11px] font-bold tracking-widest uppercase">ATK</span>
            </div>
            <div class="border border-gray-700 rounded-lg p-2 text-center">
              <span class="text-white font-black text-xl lg:text-2xl block">{{ character.pvpStats?.hp || 30 }}</span>
              <span class="text-gray-400 text-[11px] font-bold tracking-widest uppercase">HP</span>
            </div>
            <div class="border border-gray-700 rounded-lg p-2 text-center">
              <span class="text-white font-black text-xl lg:text-2xl block">{{ character.pvpStats?.def || 30 }}</span>
              <span class="text-gray-400 text-[11px] font-bold tracking-widest uppercase">DEF</span>
            </div>
            <div class="border border-gray-700 rounded-lg p-2 text-center">
              <span class="text-white font-black text-xl lg:text-2xl block">{{ character.pvpStats?.spd || 1 }}</span>
              <span class="text-gray-400 text-[11px] font-bold tracking-widest uppercase">SPD</span>
            </div>
          </div>
          <router-link to="/mastery" class="block border border-gray-600 rounded-lg p-2 text-center text-gray-300 text-xs font-bold tracking-widest uppercase hover:border-[#ffb300] hover:text-[#ffb300] transition-colors">
            ◆ TINH THÔNG →
          </router-link>
        </div>
      </div>

      <!-- BIO PANEL -->
      <div class="w-full xl:w-1/4 bg-[#12131a] rounded-xl border border-gray-800 p-6">
        <div class="flex items-center mb-6">
          <span class="text-[#ffb300] font-bold text-xs tracking-widest uppercase">{{ t("detail.bioLabel") }}</span>
          <div class="flex-grow h-px bg-gray-800 ml-4"></div>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{{ character.bio }}</p>
      </div>
    </div>

    <!-- SKILLS SECTION WITH TABS AND ANIMATION -->
    <div class="mb-16">
      <div class="flex items-center mb-6">
        <span class="text-[#ffb300] font-bold text-xs tracking-widest uppercase">{{ t("detail.skillsLabel") }}</span>
        <div class="flex-grow h-px bg-gray-800 ml-4"></div>
      </div>

      <!-- TABS HEADER -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button 
          v-for="category in skillCategories" 
          :key="category.key"
          @click="switchTab(category.key)"
          class="px-6 py-3 rounded-lg font-bold text-xs tracking-widest uppercase transition-all duration-300 border"
          :class="activeSkillTab === category.key 
            ? 'bg-gradient-to-r from-[color:var(--theme-color)] to-yellow-600 text-black border-[color:var(--theme-color)] shadow-[0_0_15px_rgba(var(--theme-color-rgb),0.4)]' 
            : 'bg-[#12131a] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'"
        >
          {{ category.label }}
        </button>
      </div>

      <!-- TAB CONTENT -->
      <transition :name="skillTransitionName" mode="out-in">
        <div :key="activeSkillTab" class="grid grid-cols-1 lg:grid-cols-5 gap-8 bg-[#0d0e14] p-6 rounded-2xl border border-gray-800 shadow-inner">
        
        <!-- LEFT: ANIMATION PLAYER -->
        <div class="lg:col-span-2 relative w-full aspect-video bg-[#05060a] rounded-xl border border-gray-800 overflow-hidden shadow-2xl flex items-center justify-center group">
          
          <template v-if="currentExpandedSkillObj?.animation">
            <video v-if="currentExpandedSkillObj.animation.endsWith('.mp4')" :src="currentExpandedSkillObj.animation.startsWith('/') ? currentExpandedSkillObj.animation : getCharacterImage(currentExpandedSkillObj.animation)" autoplay loop muted class="absolute inset-0 w-full h-full object-cover z-0"></video>
            <img v-else :src="currentExpandedSkillObj.animation.startsWith('/') ? currentExpandedSkillObj.animation : getCharacterImage(currentExpandedSkillObj.animation)" class="absolute inset-0 w-full h-full object-cover z-0" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
          </template>
          <template v-else>
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
            <div class="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent group-hover:opacity-40 transition-opacity duration-700"></div>
            
            <div class="z-20 text-center px-4">
              <span class="text-4xl block mb-2 opacity-50">🎬</span>
              <span class="text-[color:var(--theme-color)] font-bold text-lg mb-1 block">{{ currentExpandedSkillObj?.name || t('detail.selectSkill') }}</span>
              <span class="text-gray-500 font-bold text-xs tracking-widest uppercase">{{ t("detail.animUpdatingSmall") }}</span>
            </div>
          </template>

          <div class="absolute inset-0 border border-[color:var(--theme-color)]/20 rounded-xl z-30 pointer-events-none shadow-[inset_0_0_20px_rgba(var(--theme-color-rgb),0.1)]"></div>
        </div>

        <!-- RIGHT: SKILL CARDS LIST -->
        <div class="lg:col-span-3 flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <template v-if="getSkillsByType(activeSkillTab).length > 0">
            <div 
              v-for="skill in getSkillsByType(activeSkillTab)" 
              :key="skill.name" 
              class="border border-gray-800 rounded-lg flex flex-col relative overflow-hidden transition-all duration-300 cursor-pointer flex-shrink-0"
              :class="expandedSkills.includes(skill.name) ? 'bg-gradient-to-br from-[#161821] to-[#12131a] border-gray-600' : 'bg-[#12131a] hover:bg-[#161821]'"
              @click="toggleSkill(skill.name)"
            >
              
              <!-- Skill Header -->
              <div class="p-4 flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 flex-shrink-0 rounded-full border-2 border-[color:var(--theme-color)] flex items-center justify-center bg-gray-900 shadow-[0_0_10px_rgba(var(--theme-color-rgb),0.3)] overflow-hidden">
                    <img v-if="skill.icon" :src="skill.icon" class="w-full h-full object-cover transform scale-110" />
                    <span v-else class="text-2xl opacity-80">💥</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-bold text-lg transition-colors" :class="expandedSkills.includes(skill.name) ? 'text-[color:var(--theme-color)]' : 'text-gray-300'">{{ skill.name }}</h3>
                    
                    <!-- KEEPSAKE BADGE -->
                    <router-link v-if="skill.keepsakeIcon" :to="`/keepsake/${character.id}`" class="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-900/80 to-red-600/50 border border-red-500/50 rounded-full ml-2 shadow-[0_0_10px_rgba(255,0,0,0.4)] cursor-pointer hover:scale-105 hover:shadow-[0_0_15px_rgba(255,0,0,0.6)] transition-all duration-300">
                      <span class="text-xs text-red-100 uppercase tracking-wider font-bold">{{ t("detail.unlockedBy") }}</span>
                      <img :src="skill.keepsakeIcon" class="h-10 w-auto object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] animate-pulse" alt="Keepsake" title="Xem chi tiết Vũ Khí Duyên" />
                    </router-link>

                    <!-- Stars for Extreme Passives -->
                    <div v-if="['bị động', 'passive'].includes(skill.name.toLowerCase())" class="inline-flex items-center gap-3 bg-yellow-900/30 border border-yellow-500/50 rounded-full px-4 py-1.5"><span class="text-xs text-yellow-100 uppercase tracking-wider font-bold">{{ t("detail.unlockedBy") }}</span><div class="text-[#ffb300] text-xs drop-shadow-[0_0_5px_rgba(255,179,0,0.8)]">★★</div></div>
                    <div v-if="skill.name.toLowerCase().includes('cực hạn') || skill.name.toLowerCase().includes('extreme')" class="inline-flex items-center gap-3 bg-yellow-900/30 border border-yellow-500/50 rounded-full px-4 py-1.5"><span class="text-xs text-yellow-100 uppercase tracking-wider font-bold">{{ t("detail.unlockedBy") }}</span><div class="text-[#ffb300] text-xs drop-shadow-[0_0_5px_rgba(255,179,0,0.8)]">★★★★★</div></div>
                    <div v-if="skill.name.toLowerCase().includes('5 sao') || skill.name.toLowerCase().includes('5 stars') || skill.name.toLowerCase().includes('5 star')" class="inline-flex items-center gap-3 bg-purple-900/30 border border-purple-500/50 rounded-full px-4 py-1.5"><span class="text-xs text-purple-100 uppercase tracking-wider font-bold">{{ t("detail.unlockedBy") }}</span><div class="text-purple-400 text-xs drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">★★★★★</div></div>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <div v-if="skill.cost !== null && skill.cost !== undefined && skill.cost !== 0" class="bg-[#1a2235] border border-blue-500/30 text-blue-300 text-xs font-bold px-3 py-1 rounded flex items-center gap-1.5 shadow-[0_0_8px_rgba(59,130,246,0.3)] flex-shrink-0">
                    <svg class="w-3 h-3 fill-current text-blue-400" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.5 2C11.5 2 4.5 10.5 4.5 15.5C4.5 19.642 7.858 23 12 23C16.142 23 19.5 19.642 19.5 15.5C19.5 10.5 12.5 2 12.5 2H11.5ZM12 4.886C13.084 7.234 17.5 12.544 17.5 15.5C17.5 18.538 15.038 21 12 21C8.962 21 6.5 18.538 6.5 15.5C6.5 12.544 10.916 7.234 12 4.886Z"/>
                    </svg>
                    {{ skill.cost }}
                  </div>
                  <div class="text-gray-500 transform transition-transform duration-300" :class="expandedSkills.includes(skill.name) ? 'rotate-180' : ''">
                    ▼
                  </div>
                </div>
              </div>

              <!-- Skill Description (Expandable) -->
              <div 
                class="overflow-hidden transition-all duration-300"
                :class="expandedSkills.includes(skill.name) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'"
              >
                <div class="p-4 pt-0 border-t border-gray-800/50 mt-2">
                  <p class="text-sm text-gray-300 leading-relaxed mt-4" v-html="formatSkillDesc(skill.desc)"></p>
                </div>
              </div>

            </div>
          </template>
          
          <template v-else>
            <div class="h-full flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest py-16">
              {{ t("detail.noData") }}
            </div>
          </template>
        </div>

      </div>
    </transition>
    </div>
  
    <!-- EFFECT GLOSSARY -->
    <div class="mb-16" v-if="chuThichHieuUng && chuThichHieuUng.length > 0">
      <div class="flex items-center mb-6">
        <span class="text-[color:var(--theme-color)] font-bold text-xs tracking-widest uppercase">{{ t("detail.effectsLabel") }}</span>
        <div class="flex-grow h-px bg-gray-800 ml-4"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="effect in chuThichHieuUng" 
          :key="effect.term"
          :id="'effect-' + effect.term.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()"
          class="bg-[#12131a] p-4 rounded-xl border border-gray-800 transition-colors duration-500"
        >
          <span class="text-[color:var(--theme-color)] font-bold mb-2 block">{{ effect.term }}</span>
          <span class="text-gray-400 text-sm leading-relaxed">{{ effect.desc }}</span>
        </div>
      </div>
    </div>
</main>
</template>

<style scoped>
.flash-highlight {
  animation: flash 1s ease-out;
}
@keyframes flash {
  0% { background-color: rgba(255, 179, 0, 0.5); }
  100% { background-color: transparent; }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #0b0c10;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}

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
