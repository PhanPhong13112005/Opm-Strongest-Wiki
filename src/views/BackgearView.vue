<script setup>
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import backgearData from '../data/backgear.json'
import backgearChibis from '../data/backgearChibis.json'

const SpineFigure = defineAsyncComponent(() => import('../components/SpineFigure.vue'))

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const activeTab = ref('gears')
const selectedId = ref(backgearData.gears[0]?.id || '')
const previewLevel = ref(1)
const selectedCharacterId = ref(backgearChibis.some(character => character.heid === route.query.character) ? route.query.character : '')
const failedCharacters = ref(new Set())
const isEnglish = computed(() => locale.value === 'en')
const selectedGear = computed(() => backgearData.gears.find(gear => gear.id === selectedId.value) || backgearData.gears[0])
const previewCharacters = computed(() => backgearChibis.filter(character => !failedCharacters.value.has(character.heid)))
const selectedCharacter = computed(() => backgearChibis.find(character => character.heid === selectedCharacterId.value) || null)
const gearName = gear => isEnglish.value ? gear.nameEn : gear.nameVi
const gearRarity = gear => isEnglish.value ? gear.rarity : gear.rarityVi
const acquisition = gear => isEnglish.value ? gear.acquireEn : gear.acquireVi
const effectName = effect => isEnglish.value ? effect.en : effect.vi
const levelCost = level => isEnglish.value ? level.costEn : level.costVi
const currentImage = computed(() => {
  const gear = selectedGear.value
  if (!gear) return ''
  return gear.changeLevel && previewLevel.value >= gear.changeLevel ? gear.seniorIcon : gear.icon
})
const firstLevel = computed(() => selectedGear.value?.levels[0])
const lastLevel = computed(() => selectedGear.value?.levels.at(-1))
const summaryLevels = computed(() => firstLevel.value === lastLevel.value ? [firstLevel.value] : [firstLevel.value, lastLevel.value])
const handleSpineFail = () => {
  if (!selectedCharacter.value) return
  failedCharacters.value = new Set([...failedCharacters.value, selectedCharacter.value.heid])
  selectedCharacterId.value = ''
}

watch(selectedId, () => { previewLevel.value = 1 })
watch(selectedCharacterId, character => {
  const query = { ...route.query }
  if (character) query.character = character
  else delete query.character
  router.replace({ query })
})
onMounted(() => {
  for (const gear of backgearData.gears) {
    const image = new Image()
    image.decoding = 'async'
    image.src = gear.icon
  }
})
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
    <header class="mb-8 max-w-3xl">
      <p class="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-opm-gold">{{ t('backgear.title') }}</p>
      <h1 class="text-4xl font-black text-white">{{ t('backgear.title') }}</h1>
      <p class="mt-3 leading-relaxed text-gray-400">{{ t('backgear.description', { gears: backgearData.gears.length, sets: backgearData.sets.length }) }}</p>
    </header>

    <div class="mb-6 inline-flex rounded-xl border border-gray-800 bg-[#12131a] p-1" role="tablist">
      <button
        class="rounded-lg px-5 py-2.5 text-sm font-black transition"
        :class="activeTab === 'gears' ? 'bg-opm-gold text-black' : 'text-gray-400 hover:text-white'"
        role="tab"
        :aria-selected="activeTab === 'gears'"
        @click="activeTab = 'gears'"
      >{{ t('backgear.gearsTab') }}</button>
      <button
        class="rounded-lg px-5 py-2.5 text-sm font-black transition"
        :class="activeTab === 'sets' ? 'bg-opm-gold text-black' : 'text-gray-400 hover:text-white'"
        role="tab"
        :aria-selected="activeTab === 'sets'"
        @click="activeTab = 'sets'"
      >{{ t('backgear.setsTab') }}</button>
    </div>

    <section v-if="activeTab === 'gears'" class="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
      <div class="grid grid-cols-2 gap-3 lg:sticky lg:top-24">
        <button
          v-for="gear in backgearData.gears"
          :key="gear.id"
          class="group overflow-hidden rounded-xl border bg-[#12131a] text-left transition hover:-translate-y-0.5"
          :class="gear.id === selectedId ? 'border-opm-gold shadow-[0_0_18px_rgba(255,193,7,0.12)]' : 'border-gray-800 hover:border-gray-600'"
          @click="selectedId = gear.id"
        >
          <div class="aspect-[16/10] overflow-hidden bg-black/30">
            <img :src="gear.thumbnail || gear.icon" :alt="gearName(gear)" loading="eager" decoding="async" class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          </div>
          <p class="truncate px-3 py-2 text-xs font-bold text-gray-200">{{ gearName(gear) }}</p>
        </button>
      </div>

      <article v-if="selectedGear" class="overflow-hidden rounded-2xl border border-gray-800 bg-[#12131a]">
        <div class="backgear-scene relative aspect-[16/9] overflow-hidden bg-black/30" :data-theme="selectedGear.theme">
          <Transition name="cover" mode="out-in" type="transition" :duration="200">
            <img :key="currentImage" :src="currentImage" :alt="gearName(selectedGear)" class="backgear-background h-full w-full object-cover" />
          </Transition>
          <div class="backgear-light pointer-events-none absolute inset-0" />
          <div class="backgear-particles pointer-events-none absolute inset-0" />
          <Transition name="character">
            <div
              v-if="selectedCharacter"
              :key="selectedCharacter.heid"
              class="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto h-[82%] w-[52%] drop-shadow-[0_12px_18px_rgba(0,0,0,0.75)]"
            >
              <SpineFigure :src="selectedCharacter.json" @fail="handleSpineFail" />
            </div>
          </Transition>
          <span class="absolute left-4 top-4 z-20 rounded-full bg-opm-gold px-3 py-1 text-xs font-black text-black">{{ gearRarity(selectedGear) }}</span>
          <span v-if="selectedGear.changeLevel" class="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white">
            {{ t('backgear.artChanges', { level: selectedGear.changeLevel }) }}
          </span>
        </div>

        <div class="space-y-6 p-5 md:p-7">
          <label class="block">
            <span class="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">{{ t('backgear.characterPreview') }}</span>
            <select v-model="selectedCharacterId" class="w-full rounded-xl border border-gray-800 bg-[#0b0c10] px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-opm-gold">
              <option value="">{{ t('backgear.noCharacter') }}</option>
              <option v-for="character in previewCharacters" :key="character.heid" :value="character.heid">
                {{ character.label }} · {{ character.tier }}
              </option>
            </select>
          </label>

          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 class="text-2xl font-black text-white">{{ gearName(selectedGear) }}</h2>
              <p class="mt-2 inline-flex rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-sm text-sky-300">
                <strong class="mr-1">{{ t('backgear.obtain') }}:</strong> {{ acquisition(selectedGear) }}
              </p>
            </div>
            <div v-if="selectedGear.levelMax > 1" class="min-w-52">
              <div class="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                <span>{{ t('backgear.previewLevel') }}</span><span class="text-opm-gold">L{{ previewLevel }}</span>
              </div>
              <input v-model.number="previewLevel" type="range" min="1" :max="selectedGear.levelMax" step="1" class="w-full accent-yellow-400" />
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="summary in summaryLevels" :key="summary.level" class="rounded-xl border p-4" :class="summary === lastLevel ? 'border-opm-gold/30 bg-opm-gold/5' : 'border-gray-800 bg-[#0b0c10]'">
              <p class="mb-3 text-xs font-black uppercase tracking-widest" :class="summary === lastLevel ? 'text-opm-gold' : 'text-gray-500'">L{{ summary.level }}</p>
              <div class="space-y-2">
                <div v-for="effect in summary.effects" :key="effect.type" class="flex items-center justify-between gap-4 text-sm">
                  <span class="text-gray-400">{{ effectName(effect) }}</span>
                  <strong class="tabular-nums text-white">{{ effect.text }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border border-gray-800">
            <table class="w-full min-w-[620px] text-sm">
              <thead class="bg-white/[0.03] text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                <tr><th class="px-4 py-3">{{ t('backgear.level') }}</th><th class="px-4 py-3">{{ t('backgear.stats') }}</th><th class="px-4 py-3 text-right">{{ t('backgear.upgradeCost') }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="level in selectedGear.levels" :key="level.level" class="border-t border-gray-800 align-top">
                  <td class="px-4 py-4 font-black text-opm-gold">L{{ level.level }} <span v-if="level.senior" class="text-violet-400">★</span></td>
                  <td class="space-y-1.5 px-4 py-4">
                    <div v-for="effect in level.effects" :key="effect.type" class="flex max-w-sm items-center justify-between gap-4">
                      <span class="text-gray-400">{{ effectName(effect) }}</span><strong class="tabular-nums text-white">{{ effect.text }}</strong>
                    </div>
                  </td>
                  <td class="whitespace-nowrap px-4 py-4 text-right text-gray-400">{{ levelCost(level) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="selectedGear.changeLevel" class="text-xs text-gray-500">★ {{ t('backgear.seniorNote', { level: selectedGear.changeLevel }) }}</p>
        </div>
      </article>
    </section>

    <section v-else class="space-y-5">
      <p class="max-w-3xl text-sm leading-relaxed text-gray-400">{{ t('backgear.setDescription') }}</p>
      <article v-for="set in backgearData.sets" :key="set.id" class="overflow-hidden rounded-2xl border border-gray-800 border-l-4 border-l-opm-gold bg-[#12131a] p-5 md:p-7">
        <div class="mb-6 flex flex-wrap items-center gap-3">
          <span class="rounded-full bg-opm-gold px-3 py-1 text-xs font-black text-black">{{ isEnglish ? set.rarity : set.rarityVi }}</span>
          <h2 class="text-2xl font-black text-white">{{ isEnglish ? set.nameEn : set.nameVi }}</h2>
        </div>

        <h3 class="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">{{ t('backgear.requires') }}</h3>
        <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="need in set.needs" :key="need.id" class="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0b0c10] p-2.5">
            <img :src="need.icon" :alt="isEnglish ? need.nameEn : need.nameVi" class="h-14 w-20 rounded-lg object-cover" />
            <div class="min-w-0"><p class="truncate text-sm font-bold text-white">{{ isEnglish ? need.nameEn : need.nameVi }}</p><p class="text-xs text-gray-500">×{{ need.count }}</p></div>
          </div>
        </div>

        <div class="mb-6 flex items-center gap-4 rounded-xl border border-opm-gold/30 bg-opm-gold/5 p-3">
          <img :src="set.rewardIcon" :alt="isEnglish ? set.rewardEn : set.rewardVi" class="h-16 w-24 rounded-lg object-cover" />
          <div><p class="text-xs font-black uppercase tracking-widest text-opm-gold">{{ t('backgear.setReward') }}</p><p class="mt-1 font-bold text-white">{{ isEnglish ? set.rewardEn : set.rewardVi }}</p></div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-800">
          <table class="w-full min-w-[520px] text-sm">
            <thead class="bg-white/[0.03] text-left text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th class="px-4 py-3">{{ t('backgear.setLevel') }}</th><th class="px-4 py-3">{{ t('backgear.teamBonus') }}</th></tr></thead>
            <tbody><tr v-for="level in set.levels" :key="level.setLevel" class="border-t border-gray-800"><td class="px-4 py-4 font-black text-opm-gold">{{ level.setLevel }}</td><td class="px-4 py-4"><div v-for="effect in level.effects" :key="effect.type" class="flex max-w-md items-center justify-between gap-4 py-1"><span class="text-gray-400">{{ effectName(effect) }}</span><strong class="text-white">{{ effect.text }}</strong></div></td></tr></tbody>
          </table>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.cover-enter-active, .cover-leave-active { transition: opacity .2s ease; }
.cover-enter-from, .cover-leave-to { opacity: 0; }
.character-enter-active, .character-leave-active { transition: opacity .2s ease, transform .25s ease; }
.character-enter-from, .character-leave-to { opacity: 0; transform: translateY(12px) scale(.98); }

.backgear-scene {
  --scene-glow: 255, 193, 7;
  isolation: isolate;
}

.backgear-scene[data-theme="spring"] { --scene-glow: 255, 146, 190; }
.backgear-scene[data-theme="autumn"] { --scene-glow: 255, 165, 55; }
.backgear-scene[data-theme="winter"] { --scene-glow: 118, 203, 255; }
.backgear-scene[data-theme="DJ booth"],
.backgear-scene[data-theme="cyber"],
.backgear-scene[data-theme="pixel city"] { --scene-glow: 92, 119, 255; }
.backgear-scene[data-theme="stage"] { --scene-glow: 255, 83, 45; }
.backgear-scene[data-theme="sports"] { --scene-glow: 79, 220, 128; }
.backgear-scene[data-theme="racing"] { --scene-glow: 255, 68, 156; }

.backgear-background {
  animation: backgear-drift 14s ease-in-out infinite alternate;
  transform-origin: 50% 58%;
  will-change: transform, filter;
}

.backgear-light {
  z-index: 1;
  background:
    radial-gradient(circle at 18% 22%, rgba(var(--scene-glow), .22), transparent 34%),
    radial-gradient(circle at 78% 66%, rgba(var(--scene-glow), .14), transparent 30%);
  mix-blend-mode: screen;
  animation: backgear-light-drift 9s ease-in-out infinite alternate;
}

.backgear-particles {
  z-index: 2;
  opacity: .48;
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, .9) 0 1px, transparent 1.8px),
    radial-gradient(circle, rgba(var(--scene-glow), .8) 0 1.5px, transparent 2.2px),
    radial-gradient(circle, rgba(255, 255, 255, .55) 0 1px, transparent 1.8px);
  background-position: 12% 94%, 64% 104%, 88% 92%;
  background-size: 95px 120px, 150px 175px, 210px 230px;
  animation: backgear-particles-rise 12s linear infinite;
  mask-image: linear-gradient(to top, #000 5%, rgba(0, 0, 0, .85) 55%, transparent 100%);
}

@keyframes backgear-drift {
  0% { transform: scale(1.035) translate3d(-.6%, .2%, 0); filter: saturate(1) brightness(.98); }
  50% { filter: saturate(1.08) brightness(1.03); }
  100% { transform: scale(1.09) translate3d(.8%, -.7%, 0); filter: saturate(1.03) brightness(1.01); }
}

@keyframes backgear-light-drift {
  from { transform: translate3d(-4%, -2%, 0) scale(1); opacity: .55; }
  to { transform: translate3d(5%, 3%, 0) scale(1.08); opacity: .95; }
}

@keyframes backgear-particles-rise {
  from { background-position: 12% 110%, 64% 118%, 88% 106%; }
  to { background-position: 18% -20%, 58% -28%, 82% -18%; }
}

@media (prefers-reduced-motion: reduce) {
  .backgear-background,
  .backgear-light,
  .backgear-particles { animation: none; }
}
</style>
