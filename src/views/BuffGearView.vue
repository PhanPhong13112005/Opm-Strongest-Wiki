<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buffGearSlots, buffGearSourceAssets } from '../data/buffGear/slots.js'
import { buffGearStructure, buffGearProgression, buffGearConfirmedExample } from '../data/buffGear/progression.js'
import { buffGearSkills, buffGearSkillCategoryIds, getBuffGearSkillCategories } from '../data/buffGear/skills.js'
import { buffGearTermById } from '../data/buffGear/terminology.js'
import BuffGearWorkbench from '../components/buffGear/BuffGearWorkbench.vue'

const { t, locale } = useI18n()
const activeTab = ref('overview')
const openStage = ref('transformation')
const search = ref('')
const skillCategory = ref('all')
const showAssets = ref(false)
const tabs = ['overview', 'comparison', 'progression', 'skills']
const heroFacts = Object.freeze({
  slots: buffGearSlots.length,
  systems: buffGearProgression.length,
  skills: buffGearSkills.length,
})
const skillStatLimit = buffGearProgression.find(stage => stage.id === 'purification')?.skillLimit ?? 0
const matrixSystems = Object.freeze(['transformation', 'purification', 'refine'])
const statLabel = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'vi' : 'en'] || id
const statHelp = id => buffGearTermById[id]?.[locale.value === 'vi' ? 'explanationVi' : 'explanationEn'] || ''
const slotName = id => t(`buffGear.slots.${id}.name`)
const slotExample = id => t(`buffGear.slots.${id}.example`)
const stageName = id => t(`buffGear.stages.${id}.name`)
const stageTarget = id => t(`buffGear.stages.${id}.target`)
const stageById = id => buffGearProgression.find(stage => stage.id === id)
const formatRange = item => `${item.min.toLocaleString(locale.value)} – ${item.max.toLocaleString(locale.value)}${item.unit === 'percent' ? '%' : ''}`
const skillName = skill => locale.value === 'vi' ? skill.name.vi : skill.name.en
const secondarySkillName = skill => locale.value === 'vi' ? skill.name.en : skill.name.vi
const poolFor = (slot, system) => system === 'purification' ? slot.purificationStats : slot[`${system}Stats`]
const stageMetrics = (stage) => {
  if (stage.id === 'transformation') return [
    [buffGearStructure.transformedBonusStatLimit, 'buffGear.metrics.maxBonus'],
    [buffGearStructure.identicalBonusStatLimit, 'buffGear.metrics.maxIdentical'],
    [buffGearStructure.resetLockLimit, 'buffGear.metrics.maxLocks'],
  ]
  if (stage.id === 'advance') return [[`Lv.${stage.playerLevel}`, 'buffGear.metrics.playerRequirement']]
  if (stage.id === 'purification') return [
    [stage.milestones.join(' / '), 'buffGear.metrics.milestones'],
    [stage.skillLimit, 'buffGear.metrics.skillLimit'],
  ]
  if (stage.id === 'refine') return [[stage.limit, 'buffGear.metrics.refineLimit']]
  return []
}
const filteredSkills = computed(() => {
  const query = search.value.trim().toLocaleLowerCase(locale.value)
  return buffGearSkills.filter((item) => {
    const matchesText = !query || [item.name.vi, item.name.en, item.summaryVi, item.sourceText]
      .some(value => value.toLocaleLowerCase(locale.value).includes(query))
    return matchesText && (skillCategory.value === 'all' || getBuffGearSkillCategories(item).includes(skillCategory.value))
  })
})
const selectStage = async (id) => {
  openStage.value = id
  await nextTick()
  document.querySelector(`#stage-${id}`)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'nearest',
  })
}
const openSkillLibrary = async () => {
  activeTab.value = 'skills'
  await nextTick()
  document.querySelector('#panel-skills')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <main class="buff-page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">{{ t('buffGear.eyebrow') }}</span>
        <h1>{{ t('buffGear.title') }}</h1>
        <p>{{ t('buffGear.description') }}</p>
        <div class="hero-facts" :aria-label="t('buffGear.guide.quickFacts')">
          <span><b>{{ heroFacts.slots }}</b>{{ t('buffGear.heroFacts.slots') }}</span>
          <span><b>{{ heroFacts.systems }}</b>{{ t('buffGear.heroFacts.systems') }}</span>
          <span><b>{{ heroFacts.skills }}</b>{{ t('buffGear.heroFacts.skills') }}</span>
        </div>
      </div>
      <div class="mini-system" aria-hidden="true">
        <span v-for="slot in buffGearSlots" :key="slot.id" :class="`slot--${slot.id}`">{{ slot.code }}</span>
        <i></i><strong>1 + 5 + 1</strong>
      </div>
    </section>

    <BuffGearWorkbench @open-skills="openSkillLibrary" />

    <nav class="tabs" role="tablist" :aria-label="t('buffGear.tabs.label')">
      <button v-for="(tab, index) in tabs" :id="`tab-${tab}`" :key="tab" type="button" role="tab"
        :aria-selected="activeTab === tab" :aria-controls="`panel-${tab}`" :class="{ active: activeTab === tab }"
        @click="activeTab = tab">
        <small>0{{ index + 1 }}</small><span>{{ t(`buffGear.tabs.${tab}`) }}</span>
      </button>
    </nav>

    <section v-if="activeTab === 'overview'" id="panel-overview" class="panel" role="tabpanel" aria-labelledby="tab-overview">
      <header class="section-head">
        <div><span class="eyebrow">01 // {{ t('buffGear.guide.startHere') }}</span><h2>{{ t('buffGear.overview.title') }}</h2></div>
        <p>{{ t('buffGear.overview.intro') }}</p>
      </header>

      <div class="learning-section mental-model">
        <div class="character-map">
          <div class="character-node"><span>{{ t('buffGear.guide.character') }}</span><strong>{{ t('buffGear.guide.characterLoadout') }}</strong><small>{{ t('buffGear.guide.characterHint') }}</small></div>
          <div class="map-connector" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="slot-stack">
            <article v-for="(slot, index) in buffGearSlots" :key="slot.id" :class="['slot-card', `slot--${slot.id}`]">
              <span class="slot-code">{{ slot.code }}</span>
              <div><small>0{{ index + 1 }} · {{ t('buffGear.guide.exampleLabel') }}</small><h3>{{ slotName(slot.id) }}</h3><p>{{ t(`buffGear.slots.${slot.id}.description`) }}</p></div>
              <strong>{{ slotExample(slot.id) }}</strong>
            </article>
          </div>
        </div>
        <aside class="notice compatibility-note"><b>!</b><p>{{ t('buffGear.overview.compatibilityNote') }}</p></aside>
      </div>

      <section class="hp-example">
        <header>
          <div><span class="eyebrow">{{ t('buffGear.example.badge') }}</span><h2>{{ t('buffGear.example.title') }}</h2></div>
          <b>{{ t('buffGear.guide.confirmed') }}</b>
        </header>
        <div class="hp-lines">
          <article v-for="item in buffGearConfirmedExample.slots" :key="item.slot" :class="`slot--${item.slot}`">
            <span>{{ slotName(item.slot) }}</span><strong>{{ item.compatibility }}</strong><em>{{ statLabel(item.stat) }} +{{ item.value }}%</em>
          </article>
        </div>
        <p><b>!</b>{{ t('buffGear.example.warning') }}</p>
      </section>

      <section class="learning-section anatomy">
        <header class="subhead"><span class="eyebrow">{{ t('buffGear.guide.anatomyLabel') }}</span><h2>{{ t('buffGear.guide.anatomyTitle') }}</h2><p>{{ t('buffGear.guide.anatomyIntro') }}</p></header>
        <div class="anatomy-composition">
          <div class="gear-object" aria-hidden="true"><span>MAIN</span><i v-for="index in 5" :key="index">BONUS</i><b>SKILL</b></div>
          <div class="anatomy-list">
            <article><span>01</span><div><small>MAIN</small><h3>{{ t('buffGear.concepts.main.title') }}</h3><p>{{ t('buffGear.concepts.main.description') }}</p></div><b>{{ buffGearStructure.initialMainStats }}</b></article>
            <article><span>02</span><div><small>BONUS</small><h3>{{ t('buffGear.concepts.bonus.title') }}</h3><p>{{ t('buffGear.concepts.bonus.description') }}</p></div><b>{{ buffGearStructure.transformedBonusStatLimit }}</b></article>
            <article><span>03</span><div><small>SKILL</small><h3>{{ t('buffGear.concepts.skill.title') }}</h3><p>{{ t('buffGear.concepts.skill.description') }}</p></div><b>{{ skillStatLimit }}</b></article>
          </div>
        </div>
      </section>

      <section class="asset-audit">
        <header><div><h2>{{ t('buffGear.assets.title') }}</h2><p>{{ t('buffGear.assets.description') }}</p></div>
          <button type="button" :aria-expanded="showAssets" @click="showAssets = !showAssets">{{ t(showAssets ? 'buffGear.assets.hide' : 'buffGear.assets.show') }}</button>
        </header>
        <div v-if="showAssets" class="asset-grid">
          <figure v-for="asset in buffGearSourceAssets" :key="asset.id">
            <img :src="asset.optimized" :alt="`${t('buffGear.assets.unverified')}: ${asset.id}`" width="320" height="320" loading="lazy" decoding="async">
            <figcaption><strong>{{ asset.id }}</strong><span>{{ t('buffGear.assets.unverified') }}</span></figcaption>
          </figure>
        </div>
      </section>
    </section>

    <section v-else-if="activeTab === 'comparison'" id="panel-comparison" class="panel" role="tabpanel" aria-labelledby="tab-comparison">
      <header class="section-head"><div><span class="eyebrow">02 // {{ t('buffGear.tabs.comparison') }}</span><h2>{{ t('buffGear.comparison.title') }}</h2></div><p>{{ t('buffGear.comparison.intro') }}</p></header>
      <div class="comparison-cards">
        <article v-for="slot in buffGearSlots" :key="slot.id" :class="['comparison-card', `slot--${slot.id}`]">
          <header><span>{{ slot.code }}</span><div><small>{{ t('buffGear.guide.exampleLabel') }}</small><h3>{{ slotName(slot.id) }}</h3></div><strong>{{ slotExample(slot.id) }}</strong></header>
          <p>{{ t(`buffGear.slots.${slot.id}.focus`) }}</p>
          <div><small>{{ t('buffGear.comparison.focus') }}</small><span v-for="id in slot.focusStats" :key="id" :title="statHelp(id)">{{ statLabel(id) }}</span></div>
        </article>
      </div>
      <aside class="notice analysis"><b>i</b><p>{{ t('buffGear.comparison.analysisNote') }}</p></aside>
      <details class="stat-matrix">
        <summary><span>{{ t('buffGear.comparison.fullPool') }}</span><small>{{ t('buffGear.comparison.fullPoolHint') }}</small></summary>
        <div class="matrix-content">
          <section v-for="system in matrixSystems" :key="system" class="matrix-system">
            <header><small>{{ stageName(system) }}</small><h3>{{ t(`buffGear.comparison.${system}`) }}</h3></header>
            <div class="matrix-slots">
              <article v-for="slot in buffGearSlots" :key="slot.id" :class="`slot--${slot.id}`">
                <strong>{{ slotName(slot.id) }}</strong>
                <div>
                  <span v-for="item in poolFor(slot, system)" :key="item.id || item" :title="statHelp(item.id || item)">
                    {{ statLabel(item.id || item) }}<em v-if="item.min !== undefined">{{ formatRange(item) }}</em>
                  </span>
                </div>
              </article>
            </div>
          </section>
        </div>
      </details>
    </section>

    <section v-else-if="activeTab === 'progression'" id="panel-progression" class="panel" role="tabpanel" aria-labelledby="tab-progression">
      <header class="section-head"><div><span class="eyebrow">03 // {{ t('buffGear.tabs.progression') }}</span><h2>{{ t('buffGear.progression.title') }}</h2></div><p>{{ t('buffGear.progression.intro') }}</p></header>
      <div class="progression-map">
        <section class="phase phase-orange">
          <header><span>01</span><div><small>{{ t('buffGear.guide.orangePhase') }}</small><h3>{{ t('buffGear.pipeline.start') }}</h3><p>{{ t('buffGear.guide.orangeHint') }}</p></div></header>
          <div class="orange-systems">
            <button v-for="stage in buffGearProgression.slice(0, 3)" :key="stage.id" type="button" :class="{ active: openStage === stage.id }" @click="selectStage(stage.id)">
              <small>0{{ stage.order }}</small><strong>{{ stageName(stage.id) }}</strong><span>{{ stageTarget(stage.id) }}</span>
            </button>
          </div>
        </section>
        <button type="button" class="advance-gate" :class="{ active: openStage === 'advance' }" @click="selectStage('advance')">
          <span>02</span><div><small>{{ t('buffGear.pipeline.redLabel') }}</small><strong>{{ stageName('advance') }}</strong><em>{{ stageTarget('advance') }}</em></div><b>→</b>
        </button>
        <section class="phase phase-red">
          <header><span>03</span><div><small>{{ t('buffGear.guide.redPhase') }}</small><h3>{{ t('buffGear.pipeline.red') }}</h3><p>{{ t('buffGear.guide.independentBranches') }}</p></div></header>
          <div class="red-branches">
            <button v-for="stage in buffGearProgression.slice(3)" :key="stage.id" type="button" :class="{ active: openStage === stage.id }" @click="selectStage(stage.id)">
              <small>{{ t('buffGear.guide.independent') }}</small><strong>{{ stageName(stage.id) }}</strong><span>{{ stageTarget(stage.id) }}</span>
            </button>
          </div>
        </section>
      </div>

      <section class="system-details">
        <header class="subhead"><span class="eyebrow">{{ t('buffGear.guide.systemDetailsLabel') }}</span><h2>{{ t('buffGear.guide.systemDetailsTitle') }}</h2></header>
        <article v-for="stage in buffGearProgression" :id="`stage-${stage.id}`" :key="stage.id" :class="{ open: openStage === stage.id }">
          <button type="button" :aria-expanded="openStage === stage.id" @click="openStage = openStage === stage.id ? '' : stage.id">
            <span>0{{ stage.order }}</span><div><strong>{{ stageName(stage.id) }}</strong><small>{{ stageTarget(stage.id) }}</small></div><b>⌄</b>
          </button>
          <div v-if="openStage === stage.id" class="stage-body">
            <div class="change-summary"><small>{{ t('buffGear.guide.whatChanges') }}</small><p>{{ t(`buffGear.stages.${stage.id}.description`) }}</p></div>
            <div class="stage-metrics">
              <span v-for="metric in stageMetrics(stage)" :key="metric[1]"><b>{{ metric[0] }}</b>{{ t(metric[1]) }}</span>
            </div>
            <ul><li v-for="rule in stage.rules" :key="rule">{{ t(`buffGear.rules.${rule}`) }}</li></ul>
            <p v-if="stage.id === 'purification'" class="unknown-limit">{{ t('buffGear.progression.unknownLimit') }}</p>
          </div>
        </article>
      </section>
    </section>

    <section v-else id="panel-skills" class="panel" role="tabpanel" aria-labelledby="tab-skills">
      <header class="section-head"><div><span class="eyebrow">04 // {{ t('buffGear.tabs.skills') }}</span><h2>{{ t('buffGear.skills.title') }}</h2></div><p>{{ t('buffGear.skills.intro') }}</p></header>
      <div class="skill-tools">
        <label><span>{{ t('buffGear.skills.searchLabel') }}</span><input v-model="search" type="search" :placeholder="t('buffGear.skills.searchPlaceholder')"></label>
        <div class="category-filter" :aria-label="t('buffGear.skills.categoryLabel')">
          <button v-for="item in ['all', ...buffGearSkillCategoryIds]" :key="item" type="button" :class="{ active: skillCategory === item }" @click="skillCategory = item">
            {{ t(`buffGear.skills.categories.${item}`) }}
          </button>
        </div>
      </div>
      <p class="count">{{ t('buffGear.skills.resultCount', { count: filteredSkills.length }) }}</p>
      <div class="skill-grid">
        <article v-for="skill in filteredSkills" :key="skill.id" :class="['skill-card', `skill-card--${skill.confidence}`]">
          <header>
            <div><span v-for="category in getBuffGearSkillCategories(skill)" :key="category">{{ t(`buffGear.skills.categories.${category}`) }}</span></div>
            <b v-if="skill.confidence !== 'confirmed'" class="confidence-badge">{{ t(`buffGear.confidence.${skill.confidence}`) }}</b>
          </header>
          <h3>{{ skillName(skill) }}</h3><small>{{ secondarySkillName(skill) }}</small>
          <p>{{ locale === 'vi' ? skill.summaryVi : skill.sourceText }}</p>
          <details><summary>{{ t('buffGear.skills.technicalDetails') }}</summary><dl><div><dt>{{ t('buffGear.skills.trigger') }}</dt><dd>{{ skill.trigger }}</dd></div></dl><blockquote>{{ skill.sourceText }}</blockquote></details>
        </article>
      </div>
      <div v-if="filteredSkills.length === 0" class="empty">{{ t('buffGear.skills.empty') }}</div>
      <aside class="data-notes"><b>!</b><div><h2>{{ t('buffGear.notes.title') }}</h2><ul><li>{{ t('buffGear.notes.formulas') }}</li><li>{{ t('buffGear.notes.partial') }}</li><li>{{ t('buffGear.notes.server') }}</li></ul></div></aside>
    </section>
  </main>
</template>

<style scoped>
.buff-page{
  --cyan:#59dcf8;--ink:#edf7ff;--muted:#8fa9ba;--surface:#071722;--surface-2:#0a1d2a;
  --line:rgba(105,174,207,.22);--faction:#efbc47;--type:#58d9f5;--level:#ad82ff;
  max-width:1460px;margin:auto;padding:28px clamp(12px,2.2vw,28px) 84px;color:var(--ink)
}
.hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 260px;min-height:218px;align-items:center;overflow:hidden;border:1px solid rgba(97,187,225,.24);border-radius:25px;padding:30px clamp(26px,4.5vw,58px);background:radial-gradient(circle at 88% 20%,rgba(157,92,255,.18),transparent 34%),linear-gradient(118deg,#092332,#07121f 62%,#151127)}
.hero:before{content:"";position:absolute;inset:-50%;background:repeating-radial-gradient(circle at 9% 58%,transparent 0 64px,rgba(91,218,246,.055) 65px 66px);animation:drift 18s ease-in-out infinite alternate}
.hero-copy,.mini-system{position:relative;z-index:1}.eyebrow{color:var(--cyan);font:900 10px/1.3 ui-monospace,monospace;letter-spacing:.17em;text-transform:uppercase}
.hero h1{margin:10px 0 9px;color:#f5f9ff;font-size:clamp(42px,5.3vw,70px);font-weight:950;line-height:.92;letter-spacing:-.055em;text-transform:uppercase}
.hero p{max-width:760px;color:#a8c0d0;font-size:14px;line-height:1.62}
.hero-facts{display:flex;gap:8px;margin-top:18px}.hero-facts span{display:flex;align-items:center;gap:7px;border-radius:10px;background:rgba(3,19,30,.68);padding:8px 11px;color:#839eaf;font-size:9px;font-weight:850;text-transform:uppercase}.hero-facts b{color:var(--cyan);font-size:18px}
.mini-system{display:grid;width:184px;height:148px;grid-template-columns:repeat(3,44px);align-content:center;justify-content:center;gap:12px;justify-self:center}.mini-system:before,.mini-system:after{content:"";position:absolute;inset:12px 0;border:1px solid rgba(102,185,224,.18);border-radius:50%;transform:rotate(-10deg)}.mini-system:after{inset:30px -14px;transform:rotate(14deg)}
.mini-system span{z-index:1;display:grid;width:44px;height:44px;place-items:center;border:1px solid currentColor;border-radius:13px;background:#091927;font-weight:950}.mini-system .slot--faction{color:var(--faction)}.mini-system .slot--type{color:var(--type)}.mini-system .slot--level{color:var(--level)}.mini-system i{position:absolute;left:50%;top:45%;width:7px;height:7px;border-radius:50%;background:#fff;box-shadow:0 0 20px var(--cyan)}.mini-system strong{grid-column:1/-1;color:#b8ccd9;font:800 11px ui-monospace,monospace;text-align:center}
.tabs{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:14px 0;background:rgba(4,15,25,.93);border-radius:15px;padding:6px;backdrop-filter:blur(14px)}
.tabs button{display:flex;min-height:50px;align-items:center;justify-content:center;gap:9px;border:0;border-radius:10px;background:transparent;color:#829aab;font:850 13px inherit;cursor:pointer;transition:background .2s,color .2s,transform .2s}
.tabs button:hover{color:#dff8ff}.tabs button.active{background:#0d2c3c;color:#f2fbff;box-shadow:inset 0 -2px var(--cyan)}.tabs small{color:var(--cyan);font:900 9px ui-monospace,monospace}
.panel{border-radius:22px;background:linear-gradient(150deg,rgba(8,25,37,.96),rgba(4,15,24,.96));padding:clamp(18px,3vw,36px);animation:panel-in .28s ease both}
.section-head{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,520px);align-items:end;gap:24px;margin-bottom:26px}.section-head h2,.subhead h2{margin-top:7px;font-size:clamp(27px,3.8vw,44px);font-weight:930;letter-spacing:-.04em}.section-head>p,.subhead p{color:var(--muted);font-size:13px;line-height:1.7}
.learning-section,.hp-example,.asset-audit,.stat-matrix,.system-details{border-radius:18px;background:rgba(10,29,42,.68)}
.mental-model{padding:22px}.character-map{display:grid;grid-template-columns:minmax(170px,.75fr) 70px minmax(0,1.7fr);align-items:center;gap:18px}
.character-node{display:grid;min-height:175px;align-content:center;border-radius:16px;background:linear-gradient(145deg,#102c3e,#091823);padding:24px}.character-node span{color:var(--cyan);font:900 10px ui-monospace,monospace}.character-node strong{margin:10px 0;font-size:23px;line-height:1.15}.character-node small{color:var(--muted);line-height:1.5}
.map-connector{position:relative;display:grid;gap:32px}.map-connector:before{content:"";position:absolute;left:0;top:50%;width:100%;height:1px;background:var(--line)}.map-connector i{z-index:1;width:9px;height:9px;justify-self:end;border:2px solid #071722;border-radius:50%;background:var(--cyan)}
.slot-stack{display:grid;gap:8px}.slot-card{--accent:var(--cyan);display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:center;gap:15px;border-left:3px solid var(--accent);border-radius:13px;background:rgba(5,19,29,.76);padding:14px 16px}.slot--faction{--accent:var(--faction)}.slot--type{--accent:var(--type)}.slot--level{--accent:var(--level)}
.slot-code{display:grid;width:44px;height:44px;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent);font-weight:950}.slot-card small{color:#69879a;font:800 9px ui-monospace,monospace;text-transform:uppercase}.slot-card h3{margin:3px 0;font-size:17px}.slot-card p{color:#8ea7b7;font-size:11px;line-height:1.45}.slot-card>strong{border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,transparent);padding:7px 11px;color:var(--accent);font-size:11px}
.notice,.data-notes{display:flex;align-items:flex-start;gap:12px;border-radius:13px;background:rgba(255,180,45,.075);padding:14px 16px;color:#d6c49f;font-size:12px;line-height:1.55}.notice>b,.data-notes>b{display:grid;min-width:30px;height:30px;place-items:center;border-radius:9px;background:#ffb529;color:#111722}.compatibility-note{margin-top:12px}
.hp-example{margin-top:14px;padding:20px}.hp-example header,.asset-audit header{display:flex;align-items:center;justify-content:space-between;gap:14px}.hp-example h2,.asset-audit h2{margin-top:5px;font-size:20px}.hp-example header>b{border-radius:999px;background:rgba(69,222,158,.1);padding:6px 10px;color:#53e3a2;font-size:9px}
.hp-lines{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.hp-lines article{--accent:var(--cyan);display:grid;gap:5px;border-top:2px solid var(--accent);border-radius:11px;background:rgba(3,15,24,.7);padding:13px}.hp-lines span{color:#748fa2;font-size:9px}.hp-lines strong{font-size:14px}.hp-lines em{color:var(--accent);font-size:12px;font-style:normal;font-weight:850}.hp-example>p{display:flex;gap:8px;color:#f3c86f;font-size:11px}
.anatomy{display:grid;grid-template-columns:minmax(230px,.7fr) minmax(0,1.4fr);gap:28px;margin-top:14px;padding:25px}.subhead{align-self:center}.anatomy-composition{display:grid;grid-template-columns:200px minmax(0,1fr);align-items:center;gap:20px}
.gear-object{display:grid;grid-template-columns:repeat(5,1fr);overflow:hidden;border-radius:18px;background:#06121c;box-shadow:inset 0 0 0 1px var(--line)}.gear-object span,.gear-object b{grid-column:1/-1;padding:19px;text-align:center}.gear-object span{background:rgba(85,218,248,.14);color:var(--cyan)}.gear-object i{padding:14px 2px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);color:#8b72d0;font:700 7px ui-monospace,monospace;text-align:center}.gear-object b{background:rgba(169,125,255,.13);color:#c4a6ff}
.anatomy-list{display:grid;gap:7px}.anatomy-list article{display:grid;grid-template-columns:30px minmax(0,1fr) 48px;align-items:center;gap:12px;border-radius:11px;background:rgba(4,16,25,.64);padding:11px 13px}.anatomy-list article>span{color:#607e92;font:800 9px ui-monospace,monospace}.anatomy-list small{color:var(--cyan);font:800 8px ui-monospace,monospace}.anatomy-list h3{margin:2px 0;font-size:14px}.anatomy-list p{color:#829dad;font-size:10px;line-height:1.4}.anatomy-list article>b{color:var(--cyan);font-size:24px;text-align:right}
.asset-audit{margin-top:14px;padding:19px}.asset-audit header p{margin-top:4px;color:#7f98aa;font-size:11px}.asset-audit button,.category-filter button{min-height:44px;border:0;border-radius:10px;background:#103246;padding:0 14px;color:var(--cyan);font-weight:850;cursor:pointer}.asset-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:16px}.asset-grid figure{overflow:hidden;border-radius:12px;background:#040e16}.asset-grid img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain}.asset-grid figcaption{padding:8px}.asset-grid figcaption>*{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.asset-grid figcaption strong{font-size:10px}.asset-grid figcaption span{color:#eab257;font-size:8px}
.comparison-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}.comparison-card{--accent:var(--cyan);border-top:3px solid var(--accent);border-radius:15px;background:rgba(9,29,42,.72);padding:18px}.comparison-card header{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px}.comparison-card header>span{display:grid;width:40px;height:40px;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-weight:950}.comparison-card header small,.comparison-card>div>small{color:#708da0;font-size:8px;text-transform:uppercase}.comparison-card h3{font-size:17px}.comparison-card header strong{color:var(--accent);font-size:11px}.comparison-card>p{min-height:58px;margin:16px 0;color:#91a9b8;font-size:11px;line-height:1.55}.comparison-card>div{display:flex;align-items:center;flex-wrap:wrap;gap:5px}.comparison-card>div small{flex-basis:100%}.comparison-card>div span{border-radius:7px;background:color-mix(in srgb,var(--accent) 9%,transparent);padding:5px 7px;color:var(--accent);font-size:9px}.analysis{margin-top:11px;background:rgba(168,125,255,.07);color:#c7b8dd}
.stat-matrix{margin-top:11px;overflow:hidden}.stat-matrix>summary{display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:20px;padding:12px 18px;cursor:pointer}.stat-matrix>summary span{font-weight:900}.stat-matrix>summary small{color:#829aaa;text-align:right}.matrix-content{display:grid;gap:10px;border-top:1px solid var(--line);padding:15px}.matrix-system{border-radius:13px;background:#06131e;padding:15px}.matrix-system>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.matrix-system header small{color:var(--cyan)}.matrix-system h3{font-size:16px}.matrix-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.matrix-slots article{--accent:var(--cyan);border-top:2px solid var(--accent);border-radius:10px;background:#081a26;padding:11px}.matrix-slots article>strong{color:var(--accent);font-size:11px}.matrix-slots article>div{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}.matrix-slots span{display:flex;flex-direction:column;border-radius:6px;background:rgba(255,255,255,.035);padding:5px 6px;color:#adbfca;font-size:8px}.matrix-slots em{margin-top:2px;color:var(--accent);font-style:normal}
.progression-map{display:grid;grid-template-columns:1fr 190px 1fr;align-items:stretch;gap:12px}.phase{border-radius:17px;background:#081c29;padding:18px}.phase>header{display:grid;grid-template-columns:34px 1fr;gap:11px}.phase>header>span,.advance-gate>span{display:grid;width:32px;height:32px;place-items:center;border-radius:9px;background:#123549;color:var(--cyan);font:900 9px ui-monospace,monospace}.phase header small{color:#6d8a9c;font:800 8px ui-monospace,monospace}.phase h3{margin:3px 0;font-size:18px}.phase header p{color:#7895a8;font-size:10px}.orange-systems,.red-branches{display:grid;gap:6px;margin-top:14px}.phase button,.advance-gate{min-height:68px;border:0;border-radius:11px;background:#06141f;padding:12px;color:#91a8b7;text-align:left;cursor:pointer;transition:transform .18s,background .18s}.phase button:hover,.phase button.active,.advance-gate:hover,.advance-gate.active{transform:translateY(-2px);background:#103145;color:#f1faff}.phase button small,.phase button strong,.phase button span{display:block}.phase button small{color:var(--cyan);font:800 8px ui-monospace,monospace}.phase button strong{margin:4px 0;font-size:13px}.phase button span{font-size:9px}.red-branches{grid-template-columns:1fr 1fr}.phase-red{background:linear-gradient(140deg,rgba(97,24,38,.3),rgba(45,28,77,.38))}.phase-red button{border-top:2px solid #ff6478}.advance-gate{display:grid;grid-template-columns:34px 1fr 20px;align-content:center;align-items:center;gap:10px;background:linear-gradient(140deg,rgba(239,184,65,.15),rgba(202,77,91,.13))}.advance-gate small,.advance-gate strong,.advance-gate em{display:block}.advance-gate small{color:#efa943;font-size:8px}.advance-gate strong{margin:5px 0}.advance-gate em{color:#bd9b89;font-size:9px;font-style:normal}.advance-gate b{color:#ffbd53;font-size:20px}
.system-details{margin-top:14px;padding:20px}.system-details>.subhead{margin-bottom:14px}.system-details article{overflow:hidden;border-top:1px solid var(--line)}.system-details article:first-of-type{border-top:0}.system-details article>button{display:grid;width:100%;min-height:66px;grid-template-columns:38px 1fr 24px;align-items:center;gap:12px;border:0;background:transparent;color:var(--ink);text-align:left;cursor:pointer}.system-details article>button>span{display:grid;width:34px;height:34px;place-items:center;border-radius:9px;background:#102b3c;color:var(--cyan);font-size:9px}.system-details article>button strong,.system-details article>button small{display:block}.system-details article>button small{color:#7692a4}.system-details article>button>b{transition:transform .2s}.system-details article.open>button>b{transform:rotate(180deg)}.stage-body{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(240px,.8fr);gap:16px;padding:0 0 18px 50px}.change-summary small{color:var(--cyan);font:800 8px ui-monospace,monospace}.change-summary p{margin-top:6px;color:#9db1bf;font-size:12px;line-height:1.6}.stage-metrics{display:flex;align-content:flex-start;flex-wrap:wrap;gap:6px}.stage-metrics span{display:flex;align-items:center;gap:6px;border-radius:9px;background:#06141f;padding:8px 10px;color:#7f99aa;font-size:9px}.stage-metrics b{color:var(--cyan);font-size:16px}.stage-body ul{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin:0;padding:0;list-style:none}.stage-body li{border-left:2px solid #9c75ec;background:rgba(152,100,255,.055);padding:8px 10px;color:#93a9b7;font-size:10px}.unknown-limit{grid-column:1/-1;color:#f0bc63;font-size:10px}
.skill-tools{display:grid;grid-template-columns:minmax(220px,380px) 1fr;align-items:end;gap:14px}.skill-tools label span{display:block;margin-bottom:6px;color:#7f99ab;font-size:9px;font-weight:900;text-transform:uppercase}.skill-tools input{width:100%;height:46px;border:0;border-radius:11px;background:#0a2231;padding:0 13px;color:var(--ink)}.category-filter{display:flex;flex-wrap:wrap;gap:5px}.category-filter button{min-height:44px;background:#091d2a;color:#8fa7b6;font-size:10px}.category-filter button:hover,.category-filter button.active{background:#124058;color:#eaffff}.count{margin:13px 0;color:#6f8b9f;font-size:10px}
.skill-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.skill-card{display:flex;min-height:225px;flex-direction:column;border-radius:14px;background:#071a27;padding:17px}.skill-card--partial{box-shadow:inset 3px 0 #eeb44e}.skill-card header{display:flex;min-height:25px;align-items:flex-start;justify-content:space-between;gap:8px}.skill-card header>div{display:flex;flex-wrap:wrap;gap:4px}.skill-card header span,.confidence-badge{border-radius:999px;background:#0d3042;padding:4px 7px;color:var(--cyan);font-size:7px;text-transform:uppercase}.confidence-badge{background:rgba(239,178,72,.11);color:#efbc5b}.skill-card h3{margin:11px 0 2px;font-size:17px}.skill-card>small{color:#9d82ed;font-size:9px}.skill-card>p{flex:1;margin-top:10px;color:#9aafbc;font-size:11px;line-height:1.58}.skill-card details{margin-top:11px}.skill-card summary{min-height:44px;color:var(--cyan);font-size:9px;line-height:44px;cursor:pointer}.skill-card dl,.skill-card blockquote{margin:0}.skill-card dl div{display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:9px;color:#7e98a8;font-size:9px}.skill-card dd{color:#c3d0d8}.skill-card blockquote{margin-top:8px;border-left:2px solid #9f77ed;padding-left:9px;color:#7f96a5;font-size:9px;line-height:1.5}.empty{border-radius:13px;background:#06141f;padding:30px;color:#7891a2;text-align:center}.data-notes{margin-top:12px}.data-notes h2{font-size:14px}.data-notes ul{margin:6px 0 0;padding-left:16px;color:#a99e88;font-size:10px}
@keyframes drift{to{transform:translate3d(3%,2%,0) rotate(2deg)}}@keyframes panel-in{from{opacity:.3;transform:translateY(7px)}to{opacity:1;transform:none}}
@media(max-width:980px){
  .hero{grid-template-columns:1fr 200px}.character-map{grid-template-columns:1fr 48px 1.8fr}.anatomy{grid-template-columns:1fr}.comparison-cards{grid-template-columns:1fr}.comparison-card>p{min-height:0}.progression-map{grid-template-columns:1fr 150px 1fr}.skill-tools{grid-template-columns:1fr}.asset-grid{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:680px){
  .buff-page{padding:10px 8px 56px}.hero{min-height:210px;grid-template-columns:1fr;border-radius:19px;padding:23px 20px}.hero h1{font-size:clamp(38px,12vw,54px)}.hero p{max-width:78%;font-size:12px}.hero-facts{gap:5px}.hero-facts span{padding:7px 8px;font-size:7px}.hero-facts b{font-size:15px}.mini-system{position:absolute;right:-30px;bottom:-16px;width:130px;opacity:.55;transform:scale(.75)}
  .tabs{position:static;grid-template-columns:repeat(2,1fr);margin:9px 0}.tabs button{min-height:48px;justify-content:flex-start;padding:0 12px;font-size:11px}.panel{border-radius:16px;padding:17px 12px}.section-head{grid-template-columns:1fr;gap:8px;margin-bottom:18px}.section-head h2,.subhead h2{font-size:27px}
  .mental-model,.hp-example,.anatomy,.asset-audit,.system-details{padding:15px}.character-map{grid-template-columns:1fr;gap:9px}.character-node{min-height:116px;padding:17px}.map-connector{height:28px;grid-template-columns:repeat(3,1fr);gap:0}.map-connector:before{left:50%;top:0;width:1px;height:100%}.map-connector i{align-self:end;justify-self:center}.slot-card{grid-template-columns:44px minmax(0,1fr);gap:10px;padding:12px}.slot-card>strong{grid-column:2;width:max-content}.slot-card p{font-size:10px}.hp-example header{align-items:flex-start;flex-direction:column}.hp-lines{grid-template-columns:1fr}.anatomy-composition{grid-template-columns:1fr}.gear-object{max-width:250px;margin:auto}.anatomy-list article{grid-template-columns:26px minmax(0,1fr) 35px}.asset-audit header{align-items:flex-start;flex-direction:column}.asset-grid{grid-template-columns:repeat(2,1fr)}
  .comparison-card header{grid-template-columns:38px 1fr}.comparison-card header>strong{grid-column:2}.stat-matrix>summary{align-items:flex-start;flex-direction:column;gap:4px}.stat-matrix>summary small{text-align:left}.matrix-slots{grid-template-columns:1fr}.progression-map{grid-template-columns:1fr}.advance-gate{min-height:74px}.advance-gate b{transform:rotate(90deg)}.red-branches{grid-template-columns:1fr}.stage-body{grid-template-columns:1fr;padding:0 0 16px}.stage-body ul{grid-template-columns:1fr}.skill-grid{grid-template-columns:1fr}.category-filter{display:grid;grid-template-columns:repeat(3,1fr)}.category-filter button{padding:0 6px}.skill-card{min-height:210px}
}
@media(prefers-reduced-motion:reduce){.hero:before,.panel{animation:none}.tabs button,.phase button,.advance-gate,.system-details article>button>b{transition:none}}
</style>