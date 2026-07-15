<script setup>
import { computed } from 'vue'

const props = defineProps({
  character: {
    type: Object,
    required: true
  }
})

const safeUrl = (url) => {
  if (!url) return ''
  return encodeURI(url).replace(/\+/g, '%2B').replace(/#/g, '%23')
}

const resolvedImage = computed(() => {
  const filename = props.character.avatarURL || props.character.imageURL
  if (!filename) return ''
  if (filename.startsWith('/')) return safeUrl(filename)
  return safeUrl(new URL(`../assets/characters/${filename}`, import.meta.url).href)
})

// Frame background based on tier
const frameBg = computed(() => {
  const tier = props.character.tier || ''
  if (tier.includes('UR')) return '/Characters/frame/bg-ur.png'
  if (tier.includes('SSR')) return '/Characters/frame/bg-ssr.png'
  if (tier.includes('SR')) return '/Characters/frame/bg-sr.png'
  if (tier.includes('R')) return '/Characters/frame/bg-r.png'
  return '/Characters/frame/bg-n.png'
})

// Foreground Frame overlay
const foregroundFrame = computed(() => {
  const tier = props.character.tier || ''
  if (tier.includes('UR')) return '/Characters/frame/frame-ur.png'
  if (tier.includes('SSR')) return '/Characters/frame/frame-ssr.png'
  return ''
})

// Tier image icon
const tierIcon = computed(() => {
  if (props.character.tier) return `/Quality/${props.character.tier}.png`
  return ''
})

const typeIcon = computed(() => {
  const t = props.character.type?.toLowerCase() || ''
  if (t.includes('vũ trang') || t.includes('duelist')) return '/Series/Duelist.png'
  if (t.includes('giác đấu') || t.includes('grappler')) return '/Series/Grappler.png'
  if (t.includes('tâm linh') || t.includes('esper')) return '/Series/Esper.png'
  if (t.includes('công nghệ') || t.includes('hi-tech')) return '/Series/Hi-Tech.png'
  return ''
})

const typeBgColor = computed(() => {
  const t = props.character.type?.toLowerCase() || ''
  if (t.includes('vũ trang') || t.includes('duelist')) return 'bg-yellow-500'
  if (t.includes('giác đấu') || t.includes('grappler')) return 'bg-red-600'
  if (t.includes('tâm linh') || t.includes('esper')) return 'bg-purple-600'
  if (t.includes('công nghệ') || t.includes('hi-tech')) return 'bg-blue-600'
  return 'bg-black'
})

const factionIcon = computed(() => {
  const f = props.character.faction?.toLowerCase() || ''
  if (f.includes('anh hùng') || f.includes('hero')) return '/Faction/Hero.png'
  if (f.includes('quái vật') || f.includes('quái nhân') || f.includes('monster')) return '/Faction/Monster.png'
  if (f.includes('võ thuật') || f.includes('martial')) return '/Faction/Martial_Artist.png'
  if (f.includes('tội phạm') || f.includes('outlaw')) return '/Faction/Outlaw.png'
  return ''
})

const factionBgColor = computed(() => {
  const f = props.character.faction?.toLowerCase() || ''
  if (f.includes('anh hùng') || f.includes('hero')) return 'bg-yellow-500'
  if (f.includes('quái vật') || f.includes('quái nhân') || f.includes('monster')) return 'bg-red-600'
  if (f.includes('võ thuật') || f.includes('martial')) return 'bg-emerald-600'
  if (f.includes('tội phạm') || f.includes('outlaw')) return 'bg-indigo-600'
  return 'bg-black'
})

const classIcon = computed(() => {
  if (props.character.classIcon) return props.character.classIcon
  
  const f = props.character.faction?.toLowerCase() || ''
  const isMonster = f.includes('quái vật') || f.includes('quái nhân') || f.includes('monster')
  const isMartialArtist = f.includes('võ thuật') || f.includes('martial')
  const isOutlaw = f.includes('tội phạm') || f.includes('outlaw')
  
  if (isMonster && props.character.classLevel && ['dragon', 'demon', 'tiger'].includes(props.character.classLevel.toLowerCase())) {
    return `/Class/${props.character.classLevel}.png`
  }
  
  if (isMartialArtist) return '/Class/Martial_Artist.png'
  if (isOutlaw) return '/Class/Outlaw.png'
  
  // Fallback for Heroes and others
  const tier = props.character.tier?.toUpperCase() || ''
  if (tier.includes('UR+')) return '/Class/Class_SS.png'
  if (tier.includes('UR')) return '/Class/Class_S.png'
  if (tier.includes('SSR')) return '/Class/A.png'
  if (tier.includes('SR')) return '/Class/B.png'
  if (tier.includes('R')) return '/Class/C.png'
  return '/Class/Villain.png'
})

const keepsakeIcon = computed(() => {
  return props.character.keepsakeIcon || null
})
</script>

<template>
  <div class="relative group cursor-pointer w-full bg-[#161719] border border-white/5 rounded-xl p-2 transition-transform duration-300 hover:scale-[1.03] hover:border-white/10 hover:shadow-xl">
    
    <div class="flex gap-2">
      <!-- Left side: Avatar with frame -->
      <div class="flex-1 relative aspect-square rounded-md overflow-hidden bg-transparent flex items-center justify-center">
        <!-- Frame background (z-0) -->
        <img 
          v-if="frameBg"
          :src="frameBg"
          class="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
          alt="Frame Background"
        />
        
        <!-- Character Avatar (z-10) wrapped to prevent zoom spill -->
        <div class="absolute w-[88%] h-[88%] overflow-hidden rounded-sm z-10">
          <img 
            :src="resolvedImage" 
            :alt="character.name" 
            class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
            onerror="this.src='https://placehold.co/400x400/222/555?text=OPM'"
          />
        </div>
        
        <!-- Foreground Frame overlay (z-20) -->
        <img 
          v-if="foregroundFrame"
          :src="foregroundFrame"
          class="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
          alt="Frame Overlay"
        />
      </div>

      <!-- Right side: Icons Stack -->
      <div class="w-[50px] flex flex-col items-center justify-start space-y-2 py-1 shrink-0 z-20">
        <!-- Tier Image -->
        <img v-if="tierIcon" :src="tierIcon" class="w-[110%] h-auto object-contain drop-shadow-md mb-1" :alt="character.tier" />
        
        <!-- Icons (with dynamic backgrounds like screenshot) -->
        <div :class="['w-10 h-10 rounded-lg p-0.5 flex items-center justify-center border border-white/10', typeBgColor]">
          <img v-if="typeIcon" :src="typeIcon" class="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title="Hệ" />
        </div>
        <div :class="['w-10 h-10 rounded-lg p-0.5 flex items-center justify-center border border-white/10', factionBgColor]">
          <img v-if="factionIcon" :src="factionIcon" class="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title="Phe phái" />
        </div>
        <div class="w-10 h-10 bg-black rounded-lg p-1 flex items-center justify-center border border-white/10">
          <img v-if="classIcon" :src="classIcon" class="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title="Class (Lớp)" />
        </div>
        <div class="w-10 h-10 bg-black rounded-lg p-1.5 flex items-center justify-center border border-white/10">
          <img v-if="keepsakeIcon" :src="keepsakeIcon" class="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" title="Kỷ vật (Keepsake)" />
        </div>
      </div>
    </div>

    <!-- Character Name (Bottom) -->
    <div class="mt-3 px-1 pb-1">
      <h3 class="text-white group-hover:text-opm-gold transition-colors duration-300 font-extrabold text-lg truncate">{{ character.name }}</h3>
    </div>
  </div>
</template>

<style scoped>
</style>
