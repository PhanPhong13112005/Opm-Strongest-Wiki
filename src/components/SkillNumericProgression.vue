<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { numericSkillDescription, numericIndependentDescription } from '../utils/skillNumericView.js'

const props = defineProps({
  view: { type: Object, required: true },
  id: { type: String, required: true },
  formatDescription: { type: Function, required: true },
})
const { t } = useI18n()
const selected = ref(0)
const tabButtons = []
watch(() => props.view.description, () => { selected.value = 0 })
const description = computed(() => numericSkillDescription(props.view, selected.value))
const selectWithKeyboard = event => {
  let index = selected.value
  if (event.key === 'ArrowRight') index = (index + 1) % props.view.values.length
  else if (event.key === 'ArrowLeft') index = (index + props.view.values.length - 1) % props.view.values.length
  else if (event.key === 'Home') index = 0
  else if (event.key === 'End') index = props.view.values.length - 1
  else return
  event.preventDefault()
  selected.value = index
  tabButtons[index]?.focus()
}
</script>

<template>
  <div class="mt-4 min-w-0 font-sans" data-skill-numeric-progression @click.stop>
    <div role="tablist" :aria-label="t('detail.numericProgression')" class="flex gap-2 mb-4" @keydown.stop="selectWithKeyboard">
      <button
        v-for="(value, index) in view.values"
        :id="`${id}-tab-${index}`" :key="value" :ref="element => tabButtons[index] = element"
        type="button" role="tab" :aria-selected="selected === index"
        :aria-controls="`${id}-panel`" :tabindex="selected === index ? 0 : -1"
        class="flex flex-1 flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 min-w-0 min-h-[44px] px-2 py-2 rounded-lg border text-xs font-bold tracking-widest uppercase transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-opm-gold"
        :class="selected === index ? 'bg-gradient-to-r from-[color:var(--theme-color)] to-yellow-600 text-black border-[color:var(--theme-color)] shadow-[0_0_15px_rgba(var(--theme-color-rgb),0.4)]' : 'bg-[#12131a] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'"
        @click="selected = index"
      >
        <span class="whitespace-nowrap">{{ view.stageLabels?.[index] || t('detail.numericState', { level: index + 1 }) }}</span>
        <span class="tracking-normal">{{ value }}</span>
      </button>
    </div>
    <div :id="`${id}-panel`" role="tabpanel" :aria-labelledby="`${id}-tab-${selected}`" tabindex="0">
      <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line" data-numeric-skill-description v-html="formatDescription(description)"></p>
    </div>
    <section v-for="effect in view.independentEffects" :key="effect.label" class="mt-4 p-3 rounded-lg border border-gray-800 bg-[#12131a]" data-independent-skill-effect>
      <h4 class="text-xs font-bold tracking-wider uppercase text-opm-gold mb-2">{{ effect.label }}</h4>
      <p class="text-sm text-gray-300 leading-relaxed" data-selected-independent-effect v-html="formatDescription(numericIndependentDescription(effect, selected))"></p>
      <p v-if="effect.stageValues" class="text-xs text-gray-400 leading-relaxed mt-2" data-source-progression>{{ t('detail.numericSourceProgression', { values: effect.sourceSequence.replace(/ \[([^\]]+)\]/g, ' → $1') }) }}</p>
      <p v-if="effect.stageMapping === 'INCONCLUSIVE'" class="text-xs text-gray-400 leading-relaxed mt-2" data-stage-mapping-note>{{ t('detail.independentMappingUnknown') }}</p>
    </section>
    <p v-if="view.unlockConditionsStatus === 'INCONCLUSIVE'" class="mt-3 text-xs text-gray-400 leading-relaxed" data-stage-unlock-note>{{ t('detail.communityAwakeningSource') }}</p>
  </div>
</template>
