<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  applyCharacterToBuffGearBuilder,
  buffGearCompatibilityAxes,
  buffGearCompatibilityOptionByAxis,
  clearCharacterFromBuffGearBuilder,
  createBuffGearBuilderState,
  getBuffGearMode,
  isBuffGearCompatibilityLocked,
  resetUnlockedTransformationRows,
  setManualBuffGearCompatibility,
} from '../../data/buffGear/builder.js'
import { buffGearSlots } from '../../data/buffGear/slots.js'
import { buffGearConfirmedExample, buffGearProgression, buffGearStructure } from '../../data/buffGear/progression.js'
import { buffGearTermById } from '../../data/buffGear/terminology.js'
import { buffGearWorkbenchLocale } from '../../data/buffGear/workbenchLocale.js'

const emit = defineEmits(['open-skills'])
const { locale, t, mergeLocaleMessage } = useI18n()
for (const [language, messages] of Object.entries(buffGearWorkbenchLocale)) {
  mergeLocaleMessage(language, { buffGear: { workbench: messages } })
}
const state = reactive(createBuffGearBuilderState())
const selectedCharacter = ref(null)
const characterOptions = ref([])
const characterSearch = ref('')
const characterPickerOpen = ref(false)
const characterLoading = ref(false)
const characterLoadError = ref(false)

const mode = computed(() => getBuffGearMode(state))
const characterMode = computed(() => mode.value === 'character')
const compatibilityLocked = computed(() => isBuffGearCompatibilityLocked(state))
const selectedSlot = computed(() => state.slots[state.selectedSlotId])
const selectedSlotData = computed(() => buffGearSlots.find(slot => slot.id === state.selectedSlotId))
const selectedMechanic = computed(() => selectedSlot.value.mechanic)
const advanceStage = buffGearProgression.find(stage => stage.id === 'advance')
const purificationStage = buffGearProgression.find(stage => stage.id === 'purification')
const refineStage = buffGearProgression.find(stage => stage.id === 'refine')
const mechanicIds = ['main', 'transformation', 'ascension', 'advance', 'purification', 'refine']

const normalizeSearch = value => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')

const filteredCharacters = computed(() => {
  const query = normalizeSearch(characterSearch.value.trim())
  if (!query) return characterOptions.value
  return characterOptions.value.filter(character => normalizeSearch([
    character.nameVi,
    character.nameEn,
    character.id,
    character.tier,
  ].join(' ')).includes(query))
})

const compatibilityLabel = (axisId, compatibility) => {
  const item = buffGearCompatibilityOptionByAxis[axisId]?.[compatibility]
  return item?.labels?.[locale.value] || item?.labels?.en || compatibility
}

const selectedCharacterName = computed(() => {
  if (!selectedCharacter.value) return ''
  return locale.value === 'vi' ? selectedCharacter.value.nameVi : selectedCharacter.value.nameEn
})

const loadCharacters = async () => {
  if (characterOptions.value.length || characterLoading.value) return
  characterLoading.value = true
  characterLoadError.value = false
  try {
    const [{ default: charactersVi }, { default: charactersEn }] = await Promise.all([
      import('../../data/characters.json'),
      import('../../data/characters_en.json'),
    ])
    const vietnameseById = new Map(charactersVi.map(character => [character.id, character]))
    characterOptions.value = charactersEn.map((character) => {
      const vietnamese = vietnameseById.get(character.id) || {}
      return {
        id: character.id,
        nameEn: character.name,
        nameVi: vietnamese.name || character.name,
        imageURL: vietnamese.imageURL || character.imageURL,
        tier: character.tier,
        faction: character.faction,
        type: character.type,
        classLevel: character.classLevel,
      }
    })
  } catch {
    characterLoadError.value = true
  } finally {
    characterLoading.value = false
  }
}

const openCharacterPicker = async () => {
  characterPickerOpen.value = true
  characterSearch.value = ''
  await loadCharacters()
}

const chooseCharacter = (character) => {
  applyCharacterToBuffGearBuilder(state, character)
  selectedCharacter.value = character
  characterPickerOpen.value = false
}

const clearCharacter = () => {
  clearCharacterFromBuffGearBuilder(state)
  selectedCharacter.value = null
}

const updateManualCompatibility = (axisId, value) => {
  setManualBuffGearCompatibility(state, axisId, value)
}

const setSelectedMechanic = mechanicId => {
  selectedMechanic.value.activeMechanic = mechanicId
}

const statLabel = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'vi' : 'en'] || id
const statHelp = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'explanationVi' : 'explanationEn'] || ''

const transformationCount = statId => selectedMechanic.value.transformationRows
  .filter(value => value === statId).length

const updateTransformationRow = (index, statId) => {
  const current = selectedMechanic.value.transformationRows[index]
  if (statId && statId !== current && transformationCount(statId) >= buffGearStructure.identicalBonusStatLimit) return
  selectedMechanic.value.transformationRows[index] = statId || null
  if (!statId) selectedMechanic.value.transformationLocks[index] = false
}

const toggleTransformationLock = (index) => {
  const mechanic = selectedMechanic.value
  if (!mechanic.transformationRows[index]) return
  const lockedCount = mechanic.transformationLocks.filter(Boolean).length
  if (!mechanic.transformationLocks[index] && lockedCount >= buffGearStructure.resetLockLimit) return
  mechanic.transformationLocks[index] = !mechanic.transformationLocks[index]
}

const resetTransformation = () => resetUnlockedTransformationRows(selectedMechanic.value)

const previewRarity = rarity => {
  selectedMechanic.value.rarity = rarity
  if (rarity === 'gold') {
    selectedMechanic.value.purificationRows.forEach((row) => {
      row.statId = null
      row.locked = false
    })
    selectedMechanic.value.refineStatId = null
    selectedMechanic.value.refineLevel = 0
  }
}

const updatePurificationRow = (index, statId) => {
  selectedMechanic.value.purificationRows[index].statId = statId || null
  if (!statId) selectedMechanic.value.purificationRows[index].locked = false
}

const togglePurificationLock = index => {
  const row = selectedMechanic.value.purificationRows[index]
  if (row.statId) row.locked = !row.locked
}

const confirmedExample = computed(() => buffGearConfirmedExample.slots.find(
  item => item.slot === state.selectedSlotId,
))
</script>

<template>
  <section class="buff-workbench" data-testid="buff-gear-workbench">
    <header :class="['mode-banner', `mode-banner--${mode}`]">
      <div class="mode-symbol" aria-hidden="true">{{ characterMode ? 'C' : 'M' }}</div>
      <div class="mode-copy">
        <span>{{ t(`buffGear.workbench.mode.${mode}.badge`) }}</span>
        <h2>{{ t(`buffGear.workbench.mode.${mode}.title`) }}</h2>
        <p>{{ t(`buffGear.workbench.mode.${mode}.description`) }}</p>
      </div>
      <div class="mode-actions">
        <button type="button" class="primary-action" @click="openCharacterPicker">
          {{ t(characterMode ? 'buffGear.workbench.character.change' : 'buffGear.workbench.character.choose') }}
        </button>
        <button v-if="characterMode" type="button" class="quiet-action" @click="clearCharacter">
          {{ t('buffGear.workbench.character.clear') }}
        </button>
      </div>
    </header>

    <div class="workbench-stage">
      <section class="workbench-controls" :aria-label="t('buffGear.workbench.compatibility.title')">
        <div v-if="selectedCharacter" class="selected-character">
          <img v-if="selectedCharacter.imageURL" :src="selectedCharacter.imageURL" :alt="selectedCharacterName" width="72" height="72">
          <div><small>{{ t('buffGear.workbench.character.selected') }}</small><strong>{{ selectedCharacterName }}</strong><span>{{ selectedCharacter.tier }}</span></div>
        </div>
        <div v-else class="manual-character-placeholder">
          <span aria-hidden="true">+</span>
          <div><strong>{{ t('buffGear.workbench.character.none') }}</strong><small>{{ t('buffGear.workbench.character.noneHint') }}</small></div>
        </div>

        <header class="control-heading">
          <span>01 // {{ t('buffGear.workbench.compatibility.eyebrow') }}</span>
          <h3>{{ t('buffGear.workbench.compatibility.title') }}</h3>
        </header>

        <div class="compatibility-controls">
          <label v-for="axis in buffGearCompatibilityAxes" :key="axis.id" :class="[`axis--${axis.id}`, { locked: compatibilityLocked }]">
            <span><b>{{ t(`buffGear.slots.${axis.id}.name`) }}</b><em v-if="compatibilityLocked">⌑ {{ t('buffGear.workbench.compatibility.locked') }}</em></span>
            <select
              :data-testid="`compatibility-${axis.id}`"
              :value="state.slots[axis.id].compatibility"
              :disabled="compatibilityLocked"
              :aria-label="t(`buffGear.slots.${axis.id}.name`)"
              @change="updateManualCompatibility(axis.id, $event.target.value)"
            >
              <option v-for="item in axis.options" :key="item.id" :value="item.id">{{ item.labels[locale] }}</option>
            </select>
            <small>{{ compatibilityLocked ? t('buffGear.workbench.compatibility.characterSource') : t('buffGear.workbench.compatibility.manualSource') }}</small>
          </label>
        </div>
      </section>

      <section class="loadout-preview" :aria-label="t('buffGear.workbench.preview.title')">
        <header class="control-heading">
          <span>02 // LIVE PREVIEW</span>
          <h3>{{ t('buffGear.workbench.preview.title') }}</h3>
          <p>{{ t('buffGear.workbench.preview.hint') }}</p>
        </header>
        <div class="slot-orbit">
          <button
            v-for="axis in buffGearCompatibilityAxes"
            :key="axis.id"
            type="button"
            :class="[`preview-slot`, `preview-slot--${axis.id}`, { active: state.selectedSlotId === axis.id, red: state.slots[axis.id].mechanic.rarity === 'red' }]"
            :aria-pressed="state.selectedSlotId === axis.id"
            :data-testid="`slot-${axis.id}`"
            @click="state.selectedSlotId = axis.id"
          >
            <span>{{ axis.id.charAt(0).toUpperCase() }}</span>
            <small>{{ t(`buffGear.slots.${axis.id}.name`) }}</small>
            <strong>{{ compatibilityLabel(axis.id, state.slots[axis.id].compatibility) }}</strong>
            <em>{{ t(`buffGear.workbench.rarity.${state.slots[axis.id].mechanic.rarity}`) }}</em>
          </button>
          <div class="orbit-core" aria-hidden="true"><b>3</b><span>BUFF<br>GEAR</span></div>
        </div>
        <div class="identity-note">
          <b>{{ characterMode ? t('buffGear.workbench.mode.character.badge') : t('buffGear.workbench.mode.manual.badge') }}</b>
          <span>{{ t('buffGear.workbench.preview.identityOnly') }}</span>
        </div>
      </section>
    </div>

    <section class="mechanic-inspector" data-testid="mechanic-inspector">
      <header class="inspector-heading">
        <div>
          <span>03 // {{ t('buffGear.workbench.inspector.eyebrow') }}</span>
          <h2>{{ compatibilityLabel(state.selectedSlotId, selectedSlot.compatibility) }}</h2>
          <p>{{ t('buffGear.workbench.inspector.description', { slot: t(`buffGear.slots.${state.selectedSlotId}.name`) }) }}</p>
        </div>
        <div :class="['rarity-state', { red: selectedMechanic.rarity === 'red' }]">
          <small>{{ t('buffGear.workbench.inspector.state') }}</small>
          <strong>{{ t(`buffGear.workbench.rarity.${selectedMechanic.rarity}`) }}</strong>
        </div>
      </header>

      <nav class="mechanic-nav" :aria-label="t('buffGear.workbench.inspector.mechanics')">
        <button
          v-for="mechanicId in mechanicIds"
          :key="mechanicId"
          type="button"
          :class="{ active: selectedMechanic.activeMechanic === mechanicId }"
          :aria-pressed="selectedMechanic.activeMechanic === mechanicId"
          :data-testid="`mechanic-${mechanicId}`"
          @click="setSelectedMechanic(mechanicId)"
        >
          {{ t(`buffGear.workbench.mechanics.${mechanicId}`) }}
          <i v-if="['purification', 'refine'].includes(mechanicId) && selectedMechanic.rarity !== 'red'" aria-hidden="true">⌑</i>
        </button>
      </nav>

      <Transition name="mechanic-panel" mode="out-in">
        <div :key="`${state.selectedSlotId}-${selectedMechanic.activeMechanic}`" class="mechanic-panel">
          <template v-if="selectedMechanic.activeMechanic === 'main'">
            <div class="mechanic-explainer"><span>MAIN</span><div><h3>{{ t('buffGear.workbench.main.title') }}</h3><p>{{ t('buffGear.workbench.main.description') }}</p></div></div>
            <div class="confirmed-example">
              <small>{{ t('buffGear.workbench.main.confirmedExample') }}</small>
              <strong>{{ confirmedExample.compatibility }}</strong>
              <span>{{ statLabel(confirmedExample.stat) }} +{{ confirmedExample.value }}%</span>
              <p>{{ t('buffGear.workbench.main.noFormula') }}</p>
            </div>
          </template>

          <template v-else-if="selectedMechanic.activeMechanic === 'transformation'">
            <div class="mechanic-explainer"><span>BONUS</span><div><h3>{{ t('buffGear.workbench.transformation.title') }}</h3><p>{{ t('buffGear.workbench.transformation.description') }}</p></div></div>
            <div class="transform-editor">
              <div v-for="(row, index) in selectedMechanic.transformationRows" :key="index" class="transform-row">
                <b>0{{ index + 1 }}</b>
                <select :value="row || ''" :aria-label="t('buffGear.workbench.transformation.row', { row: index + 1 })" @change="updateTransformationRow(index, $event.target.value)">
                  <option value="">{{ t('buffGear.workbench.transformation.empty') }}</option>
                  <option
                    v-for="statId in selectedSlotData.transformationStats"
                    :key="statId"
                    :value="statId"
                    :disabled="statId !== row && transformationCount(statId) >= buffGearStructure.identicalBonusStatLimit"
                  >{{ statLabel(statId) }}</option>
                </select>
                <button type="button" :disabled="!row" :class="{ active: selectedMechanic.transformationLocks[index] }" @click="toggleTransformationLock(index)">
                  {{ selectedMechanic.transformationLocks[index] ? '▣' : '□' }} {{ t('buffGear.workbench.transformation.lock') }}
                </button>
              </div>
            </div>
            <div class="mechanic-actions">
              <button type="button" class="danger-action" @click="resetTransformation">{{ t('buffGear.workbench.transformation.reset') }}</button>
              <span>{{ t('buffGear.workbench.transformation.rules', { identical: buffGearStructure.identicalBonusStatLimit, locks: buffGearStructure.resetLockLimit }) }}</span>
            </div>
          </template>

          <template v-else-if="selectedMechanic.activeMechanic === 'ascension'">
            <div class="mechanic-explainer"><span>↑</span><div><h3>{{ t('buffGear.workbench.ascension.title') }}</h3><p>{{ t('buffGear.workbench.ascension.description') }}</p></div></div>
            <button type="button" class="impact-toggle" :class="{ active: selectedMechanic.ascensionPreview }" @click="selectedMechanic.ascensionPreview = !selectedMechanic.ascensionPreview">
              <span>MAIN STAT</span><b>{{ selectedMechanic.ascensionPreview ? t('buffGear.workbench.ascension.highlighted') : t('buffGear.workbench.ascension.showImpact') }}</b>
            </button>
            <p class="data-boundary">{{ t('buffGear.workbench.ascension.unknown') }}</p>
          </template>

          <template v-else-if="selectedMechanic.activeMechanic === 'advance'">
            <div class="mechanic-explainer"><span>→</span><div><h3>{{ t('buffGear.workbench.advance.title') }}</h3><p>{{ t('buffGear.workbench.advance.description', { level: advanceStage.playerLevel }) }}</p></div></div>
            <div class="advance-preview">
              <button type="button" :class="{ active: selectedMechanic.rarity === 'gold' }" @click="previewRarity('gold')"><span>01</span><strong>{{ t('buffGear.workbench.rarity.gold') }}</strong></button>
              <i>→</i>
              <button type="button" :class="{ active: selectedMechanic.rarity === 'red' }" @click="previewRarity('red')"><span>02</span><strong>{{ t('buffGear.workbench.rarity.red') }}</strong></button>
            </div>
            <ul class="inheritance-list"><li>{{ t('buffGear.workbench.advance.inheritTransformation') }}</li><li>{{ t('buffGear.workbench.advance.inheritAscension') }}</li><li>{{ t('buffGear.workbench.advance.unlockRed') }}</li></ul>
          </template>

          <template v-else-if="selectedMechanic.activeMechanic === 'purification'">
            <div class="mechanic-explainer"><span>P</span><div><h3>{{ t('buffGear.workbench.purification.title') }}</h3><p>{{ t('buffGear.workbench.purification.description') }}</p></div></div>
            <div v-if="selectedMechanic.rarity !== 'red'" class="red-lock">
              <b>⌑</b><div><strong>{{ t('buffGear.workbench.redOnly.title') }}</strong><p>{{ t('buffGear.workbench.redOnly.description') }}</p></div>
              <button type="button" @click="previewRarity('red')">{{ t('buffGear.workbench.redOnly.preview') }}</button>
            </div>
            <template v-else>
              <div class="purification-editor">
                <div v-for="(row, index) in selectedMechanic.purificationRows" :key="row.milestone" class="purification-row">
                  <b>×{{ row.milestone }}</b>
                  <select :value="row.statId || ''" @change="updatePurificationRow(index, $event.target.value)">
                    <option value="">{{ t('buffGear.workbench.purification.empty') }}</option>
                    <option v-for="item in selectedSlotData.purificationStats" :key="item.id" :value="item.id">{{ statLabel(item.id) }} · {{ item.min.toLocaleString(locale) }}–{{ item.max.toLocaleString(locale) }}{{ item.unit === 'percent' ? '%' : '' }}</option>
                  </select>
                  <button type="button" :disabled="!row.statId" :class="{ active: row.locked }" @click="togglePurificationLock(index)">{{ row.locked ? '▣' : '□' }} {{ t('buffGear.workbench.purification.lock') }}</button>
                </div>
              </div>
              <div class="subfeature-card">
                <div><small>TRANSFER</small><strong>{{ t('buffGear.workbench.transfer.title') }}</strong><p>{{ t('buffGear.workbench.transfer.description') }}</p></div>
                <button type="button" :aria-expanded="selectedMechanic.transferHelpOpen" @click="selectedMechanic.transferHelpOpen = !selectedMechanic.transferHelpOpen">{{ t('buffGear.workbench.transfer.action') }}</button>
                <p v-if="selectedMechanic.transferHelpOpen" class="data-boundary">{{ t('buffGear.workbench.transfer.boundary') }}</p>
              </div>
              <button type="button" class="library-link" @click="emit('open-skills')">{{ t('buffGear.workbench.purification.openSkills', { count: purificationStage.skillLimit }) }}</button>
            </template>
          </template>

          <template v-else>
            <div class="mechanic-explainer"><span>R</span><div><h3>{{ t('buffGear.workbench.refine.title') }}</h3><p>{{ t('buffGear.workbench.refine.description') }}</p></div></div>
            <div v-if="selectedMechanic.rarity !== 'red'" class="red-lock">
              <b>⌑</b><div><strong>{{ t('buffGear.workbench.redOnly.title') }}</strong><p>{{ t('buffGear.workbench.redOnly.description') }}</p></div>
              <button type="button" @click="previewRarity('red')">{{ t('buffGear.workbench.redOnly.preview') }}</button>
            </div>
            <template v-else>
              <div class="refine-editor">
                <label><span>{{ t('buffGear.workbench.refine.stat') }}</span><select v-model="selectedMechanic.refineStatId"><option :value="null">{{ t('buffGear.workbench.refine.empty') }}</option><option v-for="statId in selectedSlotData.refineStats" :key="statId" :value="statId" :title="statHelp(statId)">{{ statLabel(statId) }}</option></select></label>
                <label><span>{{ t('buffGear.workbench.refine.level') }} <b>{{ selectedMechanic.refineLevel }}/{{ refineStage.limit }}</b></span><input v-model.number="selectedMechanic.refineLevel" type="range" min="0" :max="refineStage.limit" step="1"></label>
              </div>
              <div class="subfeature-card">
                <div><small>CLARIFY</small><strong>{{ t('buffGear.workbench.clarify.title') }}</strong><p>{{ t('buffGear.workbench.clarify.description') }}</p></div>
                <button type="button" :aria-expanded="selectedMechanic.clarifyHelpOpen" @click="selectedMechanic.clarifyHelpOpen = !selectedMechanic.clarifyHelpOpen">{{ t('buffGear.workbench.clarify.action') }}</button>
                <p v-if="selectedMechanic.clarifyHelpOpen" class="data-boundary">{{ t('buffGear.workbench.clarify.boundary') }}</p>
              </div>
              <p class="data-boundary">{{ t('buffGear.workbench.refine.noFormula') }}</p>
            </template>
          </template>
        </div>
      </Transition>
    </section>

    <Teleport to="body">
      <div v-if="characterPickerOpen" class="buff-character-overlay" @click.self="characterPickerOpen = false" @keydown.esc="characterPickerOpen = false">
        <section class="buff-character-dialog" role="dialog" aria-modal="true" :aria-label="t('buffGear.workbench.character.dialogTitle')">
          <header><div><span>CHARACTER MODE</span><h2>{{ t('buffGear.workbench.character.dialogTitle') }}</h2><p>{{ t('buffGear.workbench.character.dialogDescription') }}</p></div><button type="button" :aria-label="t('buffGear.workbench.character.close')" @click="characterPickerOpen = false">×</button></header>
          <label class="character-search"><span>{{ t('buffGear.workbench.character.searchLabel') }}</span><input v-model="characterSearch" type="search" autofocus :placeholder="t('buffGear.workbench.character.searchPlaceholder')"></label>
          <div v-if="characterLoading" class="picker-status">{{ t('buffGear.workbench.character.loading') }}</div>
          <div v-else-if="characterLoadError" class="picker-status picker-status--error"><span>{{ t('buffGear.workbench.character.loadError') }}</span><button type="button" @click="loadCharacters">{{ t('buffGear.workbench.character.retry') }}</button></div>
          <div v-else class="character-picker-grid">
            <button v-for="character in filteredCharacters" :key="character.id" type="button" @click="chooseCharacter(character)">
              <img v-if="character.imageURL" :src="character.imageURL" :alt="locale === 'vi' ? character.nameVi : character.nameEn" width="84" height="84" loading="lazy" decoding="async">
              <div><strong>{{ locale === 'vi' ? character.nameVi : character.nameEn }}</strong><span>{{ character.tier }}</span><small>{{ compatibilityLabel('faction', character.faction) }} · {{ compatibilityLabel('type', character.type) }} · {{ compatibilityLabel('level', character.classLevel) }}</small></div>
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.buff-workbench{--wb-cyan:#59dcf8;--wb-gold:#efbc47;--wb-red:#ff6579;--wb-violet:#ae82ff;margin:22px 0 28px;border:1px solid rgba(89,220,248,.26);border-radius:24px;background:linear-gradient(145deg,rgba(7,25,37,.98),rgba(5,14,24,.98));overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.2)}
.mode-banner{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:18px;align-items:center;padding:20px 24px;border-bottom:1px solid rgba(89,220,248,.18);background:linear-gradient(90deg,rgba(89,220,248,.12),transparent 62%)}
.mode-banner--character{background:linear-gradient(90deg,rgba(174,130,255,.16),transparent 62%)}.mode-symbol{display:grid;place-items:center;width:52px;height:52px;border:1px solid var(--wb-cyan);border-radius:16px;color:var(--wb-cyan);font:900 22px/1 ui-monospace,monospace;background:rgba(89,220,248,.08)}.mode-banner--character .mode-symbol{border-color:var(--wb-violet);color:var(--wb-violet);background:rgba(174,130,255,.1)}
.mode-copy>span,.control-heading>span,.inspector-heading>div>span,.buff-character-dialog header span{color:var(--wb-cyan);font:900 10px/1.3 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase}.mode-copy h2,.control-heading h3,.inspector-heading h2{margin:5px 0 3px;color:#f4f9ff}.mode-copy h2{font-size:clamp(20px,2vw,29px)}.mode-copy p,.control-heading p,.inspector-heading p{margin:0;color:#9ab2c2;line-height:1.55}.mode-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.mode-actions button,.mechanic-actions button,.red-lock button,.subfeature-card button,.library-link{min-height:42px;border-radius:11px;padding:0 15px;font-weight:800;cursor:pointer}.primary-action{border:1px solid var(--wb-cyan);background:var(--wb-cyan);color:#05131c}.quiet-action{border:1px solid rgba(255,255,255,.2);background:transparent;color:#dbe9f2}
.workbench-stage{display:grid;grid-template-columns:minmax(320px,.88fr) minmax(460px,1.12fr);gap:0;border-bottom:1px solid rgba(89,220,248,.18)}.workbench-controls,.loadout-preview{padding:24px}.workbench-controls{border-right:1px solid rgba(89,220,248,.18)}
.selected-character,.manual-character-placeholder{display:flex;align-items:center;gap:13px;min-height:88px;margin-bottom:22px;padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:17px;background:rgba(255,255,255,.025)}.selected-character img{width:68px;height:68px;object-fit:cover;border-radius:13px;background:#030a10}.selected-character div,.manual-character-placeholder div{display:flex;min-width:0;flex-direction:column}.selected-character small,.manual-character-placeholder small{color:#7893a4}.selected-character strong,.manual-character-placeholder strong{color:#fff;font-size:18px}.selected-character span{color:var(--wb-gold);font-weight:900}.manual-character-placeholder>span{display:grid;place-items:center;width:54px;height:54px;border:1px dashed rgba(89,220,248,.45);border-radius:14px;color:var(--wb-cyan);font-size:26px}.control-heading{margin-bottom:15px}.control-heading h3{font-size:22px}
.compatibility-controls{display:grid;gap:10px}.compatibility-controls label{display:grid;gap:7px;padding:13px;border:1px solid rgba(255,255,255,.1);border-left:3px solid var(--axis-color,var(--wb-cyan));border-radius:13px;background:rgba(255,255,255,.025)}.compatibility-controls label>span{display:flex;align-items:center;justify-content:space-between;gap:10px}.compatibility-controls b{color:#eef7ff}.compatibility-controls em{color:var(--wb-violet);font:800 10px/1.2 ui-monospace,monospace;text-transform:uppercase}.compatibility-controls small{color:#718b9b}.compatibility-controls select,.transform-row select,.purification-row select,.refine-editor select{width:100%;min-height:42px;border:1px solid rgba(89,220,248,.22);border-radius:9px;padding:0 12px;background:#071824;color:#eef7ff;font-weight:750}.compatibility-controls select:disabled{cursor:not-allowed;border-style:dashed;color:#eef7ff;opacity:1;background:rgba(174,130,255,.08)}.axis--faction{--axis-color:var(--wb-gold)}.axis--type{--axis-color:var(--wb-cyan)}.axis--level{--axis-color:var(--wb-violet)}
.slot-orbit{position:relative;display:grid;grid-template-columns:repeat(2,minmax(150px,1fr));grid-template-areas:"faction type" "level level";gap:14px;max-width:620px;margin:24px auto 17px}.preview-slot{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr) auto;grid-template-rows:auto auto;gap:2px 12px;align-items:center;min-height:100px;padding:14px;border:1px solid rgba(255,255,255,.13);border-radius:17px;text-align:left;background:rgba(255,255,255,.025);color:#fff;cursor:pointer;transition:border-color .2s,transform .2s,background .2s}.preview-slot:hover{transform:translateY(-2px);border-color:rgba(89,220,248,.48)}.preview-slot.active{border-color:var(--wb-cyan);background:rgba(89,220,248,.09);box-shadow:0 0 0 1px rgba(89,220,248,.18)}.preview-slot.red{border-color:rgba(255,101,121,.56);background:linear-gradient(135deg,rgba(255,101,121,.12),rgba(255,255,255,.02))}.preview-slot>span{grid-row:1/3;display:grid;place-items:center;width:44px;height:44px;border:1px solid currentColor;border-radius:13px;color:var(--wb-cyan);font:900 18px/1 ui-monospace,monospace}.preview-slot small{color:#7893a4}.preview-slot strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.preview-slot em{grid-column:3;grid-row:1/3;align-self:center;border:1px solid rgba(239,188,71,.45);border-radius:999px;padding:5px 8px;color:var(--wb-gold);font:900 10px/1 ui-monospace,monospace;text-transform:uppercase}.preview-slot.red em{border-color:rgba(255,101,121,.6);color:#ff8796}.preview-slot--faction{grid-area:faction}.preview-slot--type{grid-area:type}.preview-slot--level{grid-area:level;justify-self:center;width:calc(50% - 7px)}.orbit-core{position:absolute;left:50%;top:50%;display:none;transform:translate(-50%,-50%)}.identity-note{display:flex;align-items:center;gap:10px;border:1px dashed rgba(89,220,248,.22);border-radius:12px;padding:10px 13px;color:#8ba4b4}.identity-note b{color:var(--wb-cyan);white-space:nowrap}
.mechanic-inspector{padding:24px}.inspector-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.inspector-heading h2{font-size:30px}.rarity-state{display:flex;min-width:130px;flex-direction:column;border:1px solid rgba(239,188,71,.4);border-radius:13px;padding:10px 13px;text-align:right}.rarity-state small{color:#7f96a5}.rarity-state strong{color:var(--wb-gold)}.rarity-state.red{border-color:rgba(255,101,121,.55)}.rarity-state.red strong{color:#ff8796}.mechanic-nav{display:flex;gap:7px;margin:20px 0;padding-bottom:4px;overflow-x:auto;scrollbar-width:thin}.mechanic-nav button{flex:1 0 auto;min-height:45px;border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:0 14px;background:rgba(255,255,255,.025);color:#91a7b6;font-weight:850;cursor:pointer}.mechanic-nav button.active{border-color:var(--wb-cyan);background:rgba(89,220,248,.1);color:#eefbff}.mechanic-nav i{margin-left:5px;color:#697f8d}.mechanic-panel{min-height:230px;border:1px solid rgba(89,220,248,.18);border-radius:18px;padding:20px;background:#06131d}.mechanic-explainer{display:flex;gap:15px;align-items:flex-start;margin-bottom:18px}.mechanic-explainer>span{display:grid;place-items:center;min-width:58px;height:48px;border:1px solid rgba(89,220,248,.42);border-radius:12px;color:var(--wb-cyan);font:900 11px/1 ui-monospace,monospace}.mechanic-explainer h3{margin:0 0 4px;color:#f4f9ff;font-size:21px}.mechanic-explainer p{margin:0;color:#94aebb;line-height:1.55}.confirmed-example{display:grid;grid-template-columns:auto 1fr auto;gap:8px 15px;align-items:center;border-left:3px solid var(--wb-gold);padding:13px 16px;background:rgba(239,188,71,.07)}.confirmed-example small{grid-column:1/-1;color:var(--wb-gold);font-weight:850;text-transform:uppercase}.confirmed-example strong{color:#fff}.confirmed-example span{color:var(--wb-gold);font-weight:900}.confirmed-example p{grid-column:1/-1;margin:2px 0 0;color:#819aaa}.transform-editor,.purification-editor{display:grid;gap:8px}.transform-row,.purification-row{display:grid;grid-template-columns:40px minmax(180px,1fr) 135px;gap:9px;align-items:center}.transform-row>b,.purification-row>b{color:var(--wb-cyan);font:900 12px/1 ui-monospace,monospace}.transform-row button,.purification-row button{min-height:42px;border:1px solid rgba(255,255,255,.13);border-radius:9px;background:transparent;color:#8ca4b3;font-weight:800;cursor:pointer}.transform-row button.active,.purification-row button.active{border-color:var(--wb-violet);color:var(--wb-violet);background:rgba(174,130,255,.09)}.transform-row button:disabled,.purification-row button:disabled{cursor:not-allowed;opacity:.45}.mechanic-actions{display:flex;gap:12px;align-items:center;margin-top:14px}.mechanic-actions span{color:#7f98a8}.danger-action{border:1px solid rgba(255,101,121,.48);background:rgba(255,101,121,.08);color:#ff8796}.impact-toggle{display:flex;width:100%;justify-content:space-between;align-items:center;min-height:72px;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:15px;background:rgba(255,255,255,.025);color:#8ea8b8;cursor:pointer}.impact-toggle.active{border-color:var(--wb-gold);background:rgba(239,188,71,.08);box-shadow:inset 4px 0 var(--wb-gold)}.impact-toggle span{font:900 11px/1 ui-monospace,monospace}.impact-toggle b{color:#fff}.data-boundary{margin:13px 0 0;border:1px dashed rgba(255,255,255,.13);border-radius:10px;padding:10px 12px;color:#849cab}.advance-preview{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center}.advance-preview button{min-height:88px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:rgba(255,255,255,.02);color:#8fa6b5;cursor:pointer}.advance-preview button.active:first-child{border-color:var(--wb-gold);color:var(--wb-gold);background:rgba(239,188,71,.08)}.advance-preview button.active:last-child{border-color:var(--wb-red);color:var(--wb-red);background:rgba(255,101,121,.09)}.advance-preview button span{display:block;margin-bottom:5px;font:900 11px/1 ui-monospace,monospace}.advance-preview button strong{font-size:18px}.advance-preview>i{color:#657c8b;font-size:24px}.inheritance-list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 0;padding:0;list-style:none}.inheritance-list li{border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:11px;color:#a5bac7}.red-lock{display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:13px;align-items:center;border:1px solid rgba(255,101,121,.3);border-radius:14px;padding:14px;background:rgba(255,101,121,.06)}.red-lock>b{display:grid;place-items:center;width:42px;height:42px;border-radius:11px;background:rgba(255,101,121,.12);color:var(--wb-red)}.red-lock strong{color:#fff}.red-lock p{margin:3px 0 0;color:#8fa5b4}.red-lock button{border:1px solid var(--wb-red);background:transparent;color:#ff8796}.subfeature-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 15px;align-items:center;margin-top:14px;border:1px solid rgba(174,130,255,.25);border-radius:14px;padding:14px;background:rgba(174,130,255,.05)}.subfeature-card small{color:var(--wb-violet);font:900 10px/1 ui-monospace,monospace}.subfeature-card strong{display:block;margin:3px 0;color:#fff}.subfeature-card p{margin:0;color:#8fa7b6}.subfeature-card button,.library-link{border:1px solid rgba(174,130,255,.5);background:transparent;color:#c5aaff}.subfeature-card>.data-boundary{grid-column:1/-1}.library-link{margin-top:12px}.refine-editor{display:grid;grid-template-columns:1fr 1fr;gap:14px}.refine-editor label{display:grid;gap:8px}.refine-editor label>span{display:flex;justify-content:space-between;color:#9ab1bf;font-weight:750}.refine-editor input{width:100%;accent-color:var(--wb-violet)}
.mechanic-panel-enter-active,.mechanic-panel-leave-active{transition:opacity .18s,transform .18s}.mechanic-panel-enter-from{opacity:0;transform:translateY(10px)}.mechanic-panel-leave-to{opacity:0;transform:translateY(-6px)}
.buff-character-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(0,7,12,.82);backdrop-filter:blur(8px)}.buff-character-dialog{display:flex;flex-direction:column;width:min(920px,100%);max-height:min(84vh,820px);overflow:hidden;border:1px solid rgba(89,220,248,.3);border-radius:22px;background:#071621;color:#eef7ff;box-shadow:0 28px 90px rgba(0,0,0,.5)}.buff-character-dialog>header{display:flex;justify-content:space-between;gap:18px;padding:20px;border-bottom:1px solid rgba(89,220,248,.18)}.buff-character-dialog h2{margin:5px 0;font-size:26px}.buff-character-dialog header p{margin:0;color:#8fa7b6}.buff-character-dialog header button{align-self:flex-start;width:42px;height:42px;border:1px solid rgba(255,255,255,.15);border-radius:11px;background:transparent;color:#fff;font-size:24px;cursor:pointer}.character-search{display:grid;gap:6px;padding:14px 20px;border-bottom:1px solid rgba(89,220,248,.14)}.character-search span{color:#8ba3b2;font-weight:800}.character-search input{min-height:45px;border:1px solid rgba(89,220,248,.25);border-radius:11px;padding:0 14px;background:#041019;color:#fff}.character-picker-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;overflow-y:auto;padding:14px 20px 20px}.character-picker-grid>button{display:grid;grid-template-columns:70px minmax(0,1fr);gap:11px;align-items:center;min-height:90px;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:9px;background:rgba(255,255,255,.025);color:#fff;text-align:left;cursor:pointer}.character-picker-grid>button:hover{border-color:var(--wb-cyan);background:rgba(89,220,248,.07)}.character-picker-grid img{width:70px;height:70px;object-fit:cover;border-radius:10px;background:#02090d}.character-picker-grid div{display:flex;min-width:0;flex-direction:column;gap:3px}.character-picker-grid strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.character-picker-grid span{color:var(--wb-gold);font-weight:900}.character-picker-grid small{color:#8099a9;line-height:1.35}.picker-status{display:grid;place-items:center;min-height:230px;color:#8fa7b6}.picker-status--error{gap:12px;color:#ff8796}.picker-status button{min-height:40px;border:1px solid var(--wb-cyan);border-radius:10px;padding:0 14px;background:transparent;color:var(--wb-cyan)}
@media(max-width:900px){.mode-banner{grid-template-columns:48px 1fr}.mode-actions{grid-column:1/-1;justify-content:flex-start}.workbench-stage{grid-template-columns:1fr}.workbench-controls{border-right:0;border-bottom:1px solid rgba(89,220,248,.18)}.character-picker-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.inheritance-list{grid-template-columns:1fr}.refine-editor{grid-template-columns:1fr}}
@media(max-width:600px){.buff-workbench{margin-inline:0;border-radius:18px}.mode-banner,.workbench-controls,.loadout-preview,.mechanic-inspector{padding:16px}.mode-banner{grid-template-columns:42px 1fr;gap:12px}.mode-symbol{width:42px;height:42px;border-radius:12px}.mode-actions{display:grid;grid-template-columns:1fr}.mode-actions button{width:100%;min-height:44px}.slot-orbit{display:grid;grid-template-columns:1fr;grid-template-areas:"faction" "type" "level"}.preview-slot--level{width:100%}.identity-note{align-items:flex-start;flex-direction:column}.inspector-heading{align-items:stretch;flex-direction:column}.rarity-state{text-align:left}.mechanic-nav{margin-inline:-16px;padding-inline:16px}.mechanic-nav button{min-height:46px}.mechanic-panel{padding:15px}.transform-row,.purification-row{grid-template-columns:34px minmax(0,1fr)}.transform-row button,.purification-row button{grid-column:2}.mechanic-actions{align-items:stretch;flex-direction:column}.confirmed-example{grid-template-columns:1fr}.confirmed-example p,.confirmed-example small{grid-column:1}.advance-preview{gap:7px}.red-lock{grid-template-columns:42px 1fr}.red-lock button{grid-column:1/-1}.subfeature-card{grid-template-columns:1fr}.character-picker-grid{grid-template-columns:1fr;padding-inline:14px}.buff-character-overlay{padding:8px}.buff-character-dialog{max-height:94vh;border-radius:16px}}
@media(prefers-reduced-motion:reduce){.preview-slot,.mechanic-panel-enter-active,.mechanic-panel-leave-active{transition:none!important}}
</style>
