<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { statsGlossary, statsGlossaryEntryCount } from '../data/statsGlossary.js'

const { t, locale } = useI18n()
const query = ref('')
const activeSection = ref('all')

const language = computed(() => (locale.value === 'en' ? 'en' : 'vi'))
const normalize = value => value
  .toLocaleLowerCase(language.value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')

const filteredSections = computed(() => {
  const needle = normalize(query.value.trim())

  return statsGlossary
    .filter(section => activeSection.value === 'all' || section.id === activeSection.value)
    .map(section => ({
      ...section,
      entries: section.entries.filter(item => {
        if (!needle) return true
        return normalize([
          item.term.vi,
          item.term.en,
          item.description.vi,
          item.description.en,
        ].join(' ')).includes(needle)
      }),
    }))
    .filter(section => section.entries.length > 0)
})

const resultCount = computed(() => filteredSections.value.reduce((sum, section) => sum + section.entries.length, 0))
</script>

<template>
  <main class="stats-page">
    <section class="stats-hero" aria-labelledby="stats-title">
      <div class="stats-hero__grid" aria-hidden="true"></div>
      <div class="stats-hero__content">
        <p class="stats-hero__eyebrow">{{ t('statsPage.eyebrow') }}</p>
        <h1 id="stats-title">{{ t('statsPage.title') }}</h1>
        <div class="stats-hero__status">
          <span aria-hidden="true"></span>
          {{ statsGlossaryEntryCount }} {{ t('statsPage.verifiedEntries') }}
        </div>
        <p class="stats-hero__description">{{ t('statsPage.description') }}</p>
      </div>
      <div class="stats-hero__readout" aria-hidden="true">
        <b>ATK</b><b>DEF</b><b>HP</b><b>SPD</b>
      </div>
    </section>

    <section class="stats-library" :aria-label="t('statsPage.libraryLabel')">
      <div class="stats-toolbar">
        <label class="stats-search">
          <span class="sr-only">{{ t('statsPage.searchLabel') }}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" /></svg>
          <input v-model="query" type="search" :placeholder="t('statsPage.searchPlaceholder')" autocomplete="off">
        </label>
        <p class="stats-result-count" aria-live="polite">
          <strong>{{ resultCount }}</strong>/{{ statsGlossaryEntryCount }} {{ t('statsPage.entries') }}
        </p>
      </div>

      <div class="stats-filters" :aria-label="t('statsPage.filterLabel')">
        <button
          type="button"
          :class="{ active: activeSection === 'all' }"
          :aria-pressed="activeSection === 'all'"
          @click="activeSection = 'all'"
        >
          {{ t('statsPage.all') }}
          <span>{{ statsGlossaryEntryCount }}</span>
        </button>
        <button
          v-for="section in statsGlossary"
          :key="section.id"
          type="button"
          :class="{ active: activeSection === section.id }"
          :aria-pressed="activeSection === section.id"
          @click="activeSection = section.id"
        >
          {{ section.title[language] }}
          <span>{{ section.entries.length }}</span>
        </button>
      </div>

      <div v-if="filteredSections.length" class="stats-sections">
        <section
          v-for="(section, sectionIndex) in filteredSections"
          :key="section.id"
          class="stats-section"
          :style="{ '--section-index': sectionIndex }"
        >
          <header>
            <p>{{ t('statsPage.category') }}</p>
            <h2>{{ section.title[language] }}</h2>
            <span>{{ section.entries.length }} {{ t('statsPage.entries') }}</span>
          </header>
          <TransitionGroup name="stat-list" tag="dl" class="stats-grid">
            <div v-for="(item, itemIndex) in section.entries" :key="item.id" class="stat-card" :style="{ '--item-index': itemIndex % 10 }">
              <dt>
                {{ item.term[language] }}
                <small v-if="language === 'vi'">{{ item.term.en }}</small>
              </dt>
              <dd>{{ item.description[language] }}</dd>
            </div>
          </TransitionGroup>
        </section>
      </div>
      <div v-else class="stats-empty" role="status">
        <strong>{{ t('statsPage.noResults') }}</strong>
        <p>{{ t('statsPage.noResultsHint') }}</p>
      </div>

      <footer class="stats-source">
        <span aria-hidden="true">✓</span>
        <p><strong>{{ t('statsPage.sourceLabel') }}</strong> {{ t('statsPage.sourceText') }}</p>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.stats-page {
  min-height: 68vh;
  padding: clamp(1.25rem, 3vw, 2.5rem) clamp(.75rem, 2vw, 1.5rem) 5rem;
  color: #f4f7fb;
  background: #070b12;
  font-family: 'Be Vietnam Pro', 'Inter', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.stats-hero,
.stats-library {
  max-width: 1180px;
  margin-inline: auto;
}

.stats-hero {
  position: relative;
  min-height: 330px;
  overflow: hidden;
  border: 1px solid #263347;
  border-radius: 26px;
  background: radial-gradient(circle at 84% 35%, rgba(65, 205, 255, .16), transparent 30%), linear-gradient(135deg, #0c1927, #090c14 68%);
  box-shadow: 0 22px 60px rgba(0, 0, 0, .3);
  animation: hero-enter .65s cubic-bezier(.2, .8, .2, 1) both;
}

.stats-hero::after {
  content: '';
  position: absolute;
  inset: auto -15% -55% 45%;
  height: 260px;
  border-radius: 50%;
  background: rgba(88, 212, 255, .09);
  filter: blur(70px);
  animation: glow-breathe 5s ease-in-out infinite;
}

.stats-hero__grid {
  position: absolute;
  inset: -48px;
  opacity: .25;
  background-image: linear-gradient(rgba(77, 203, 245, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(77, 203, 245, .12) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(90deg, #000, transparent 85%);
  animation: grid-drift 18s linear infinite;
}

.stats-hero__content {
  position: relative;
  z-index: 2;
  width: min(720px, 100%);
  padding: clamp(2.4rem, 5vw, 4rem);
}

.stats-hero__eyebrow {
  margin: 0;
  color: #67d9ff;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .76rem;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: .16em;
}

h1 {
  margin: .75rem 0 1rem;
  font-size: clamp(3.1rem, 7vw, 5.5rem);
  font-weight: 800;
  line-height: .98;
  letter-spacing: -.045em;
  text-transform: uppercase;
}

.stats-hero__status {
  display: inline-flex;
  align-items: center;
  gap: .55rem;
  padding: .65rem .9rem;
  border: 1px solid rgba(84, 229, 184, .38);
  border-radius: 999px;
  color: #72e9c2;
  background: rgba(84, 229, 184, .07);
  font-size: .75rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.stats-hero__status span {
  width: .5rem;
  height: .5rem;
  border-radius: 50%;
  background: #65e6bc;
  box-shadow: 0 0 13px #65e6bc;
  animation: status-pulse 2.2s ease-in-out infinite;
}

.stats-hero__description {
  max-width: 620px;
  margin: 1.2rem 0 0;
  color: #bac5d5;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.75;
}

.stats-hero__readout {
  position: absolute;
  z-index: 1;
  right: 6%;
  top: 50%;
  display: grid;
  grid-template-columns: repeat(2, 85px);
  gap: 10px;
  transform: translateY(-50%) rotate(-5deg);
  opacity: .48;
  animation: readout-float 6s ease-in-out infinite;
}

.stats-hero__readout b {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(88, 212, 255, .35);
  border-radius: 18px;
  color: #76ddff;
  background: rgba(7, 16, 27, .58);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 1.15rem;
  font-weight: 700;
}

.stats-library {
  padding-top: 1.4rem;
  animation: library-enter .6s .12s ease-out both;
}

.stats-toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stats-search {
  display: flex;
  flex: 1;
  align-items: center;
  gap: .7rem;
  min-height: 54px;
  padding: 0 1rem;
  border: 1px solid #334056;
  border-radius: 14px;
  background: #101720;
  box-shadow: inset 0 1px rgba(255, 255, 255, .025);
  transition: border-color .2s, box-shadow .2s, transform .2s;
}

.stats-search:focus-within {
  border-color: #58d4ff;
  box-shadow: 0 0 0 3px rgba(88, 212, 255, .12), 0 12px 30px rgba(0, 0, 0, .18);
  transform: translateY(-1px);
}

.stats-search svg {
  width: 21px;
  flex: 0 0 auto;
  fill: none;
  stroke: #93a1b4;
  stroke-width: 2;
  stroke-linecap: round;
}

.stats-search input {
  width: 100%;
  border: 0;
  outline: 0;
  color: #f4f7fb;
  background: transparent;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.stats-search input::placeholder { color: #8290a4; }

.stats-result-count {
  flex: 0 0 auto;
  margin: 0;
  color: #92a0b4;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .82rem;
  font-weight: 600;
  line-height: 1.4;
}

.stats-result-count strong { color: #67d9ff; }

.stats-filters {
  display: flex;
  gap: .55rem;
  margin: .9rem 0 1.8rem;
  overflow-x: auto;
  padding: 2px 1px 7px;
  scrollbar-width: thin;
  scroll-snap-type: x proximity;
  overscroll-behavior-inline: contain;
}

.stats-filters button {
  display: flex;
  min-height: 44px;
  flex: 0 0 auto;
  align-items: center;
  gap: .55rem;
  padding: .65rem .85rem;
  border: 1px solid #334056;
  border-radius: 11px;
  color: #b6c0cf;
  background: #0d141e;
  font-family: inherit;
  font-size: .79rem;
  font-weight: 650;
  line-height: 1.3;
  cursor: pointer;
  scroll-snap-align: start;
  transition: color .2s, border-color .2s, background .2s, transform .2s, box-shadow .2s;
}

.stats-filters button:focus-visible {
  outline: 2px solid #58d4ff;
  outline-offset: 2px;
}

.stats-filters button.active {
  border-color: #d99e22;
  color: #ffd263;
  background: rgba(255, 181, 25, .1);
  box-shadow: 0 6px 18px rgba(0, 0, 0, .16);
}

.stats-filters button span {
  padding: .18rem .44rem;
  border-radius: 999px;
  color: #929fb1;
  background: rgba(255, 255, 255, .065);
  font-size: .7rem;
}

.stats-filters button.active span {
  color: #ffda80;
  background: rgba(255, 194, 61, .13);
}

.stats-sections {
  display: grid;
  gap: 1.5rem;
}

.stats-section {
  overflow: hidden;
  border: 1px solid #29364a;
  border-radius: 20px;
  background: #0b121c;
  box-shadow: 0 14px 40px rgba(0, 0, 0, .16);
  content-visibility: auto;
  contain-intrinsic-size: auto 520px;
  animation: section-enter .55s calc(var(--section-index) * 80ms) ease-out both;
}

.stats-section > header {
  position: relative;
  display: flex;
  align-items: end;
  gap: .85rem;
  padding: 1.4rem 1.5rem 1.2rem;
  border-bottom: 1px solid #263146;
  background: linear-gradient(90deg, rgba(88, 212, 255, .08), transparent 62%);
}

.stats-section > header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 22%;
  bottom: 22%;
  width: 3px;
  background: #58d4ff;
  box-shadow: 0 0 12px rgba(88, 212, 255, .6);
}

.stats-section header p {
  position: absolute;
  top: .55rem;
  margin: 0;
  color: #8291a6;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .64rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.stats-section h2 {
  margin: .55rem 0 0;
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  font-weight: 750;
  line-height: 1.35;
  letter-spacing: -.02em;
}

.stats-section header > span {
  margin-left: auto;
  color: #91a0b3;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .72rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.stat-card {
  position: relative;
  min-width: 0;
  padding: 1.3rem 1.4rem;
  border-bottom: 1px solid #202c3d;
  background: linear-gradient(120deg, rgba(255, 255, 255, .012), transparent 65%);
  transition: background .2s, transform .2s, box-shadow .2s;
  animation: card-enter .45s calc(var(--item-index) * 35ms) ease-out both;
}

.stat-card:nth-child(odd) { border-right: 1px solid #202c3d; }
.stat-card:nth-last-child(-n+2) { border-bottom: 0; }

.stat-card dt {
  color: #f2f7fc;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: -.01em;
  overflow-wrap: anywhere;
}

.stat-card dt small {
  display: block;
  margin-top: .3rem;
  color: #69d7fb;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: .7rem;
  font-weight: 600;
  line-height: 1.55;
  letter-spacing: .02em;
}

.stat-card dd {
  margin: .65rem 0 0;
  color: #b6c1d0;
  font-size: .91rem;
  font-weight: 400;
  line-height: 1.78;
  overflow-wrap: anywhere;
}

.stat-list-enter-active,
.stat-list-leave-active { transition: opacity .2s, transform .2s; }
.stat-list-enter-from { opacity: 0; transform: translateY(8px); }
.stat-list-leave-to { opacity: 0; transform: scale(.98); }

.stats-empty {
  padding: 4rem 1rem;
  border: 1px dashed #3b495e;
  border-radius: 18px;
  text-align: center;
  color: #a1adbd;
  animation: card-enter .35s ease-out both;
}

.stats-empty strong { color: #eef7ff; font-size: 1.15rem; font-weight: 700; }
.stats-empty p { margin: .5rem 0 0; line-height: 1.65; }

.stats-source {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-top: 1.1rem;
  padding: 1rem;
  border: 1px solid rgba(84, 229, 184, .2);
  border-radius: 13px;
  color: #9eabba;
  background: rgba(84, 229, 184, .04);
  font-size: .8rem;
  line-height: 1.6;
}

.stats-source > span {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #65e6bc;
  background: rgba(84, 229, 184, .12);
  font-weight: 800;
}

.stats-source p { margin: 0; }
.stats-source strong { color: #c2ccd9; font-weight: 650; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes hero-enter {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes library-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes section-enter {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes grid-drift {
  to { transform: translate3d(48px, 48px, 0); }
}

@keyframes glow-breathe {
  50% { opacity: .55; transform: scale(1.12); }
}

@keyframes readout-float {
  50% { transform: translateY(calc(-50% - 8px)) rotate(-3deg); }
}

@keyframes status-pulse {
  50% { opacity: .55; transform: scale(.78); box-shadow: 0 0 5px #65e6bc; }
}

@media (hover: hover) {
  .stats-filters button:hover {
    border-color: #52647e;
    color: #fff;
    transform: translateY(-2px);
  }

  .stat-card:hover {
    z-index: 1;
    background: linear-gradient(120deg, rgba(88, 212, 255, .075), rgba(255, 255, 255, .012));
    box-shadow: inset 3px 0 #58d4ff, 0 8px 24px rgba(0, 0, 0, .18);
    transform: translateY(-2px);
  }
}

@media (max-width: 820px) {
  .stats-hero__readout { right: -35px; opacity: .2; }
  .stats-hero__content { padding-right: 2rem; }
  .stats-grid { grid-template-columns: 1fr; }
  .stat-card,
  .stat-card:nth-child(odd),
  .stat-card:nth-last-child(-n+2) { border-right: 0; border-bottom: 1px solid #202c3d; }
  .stat-card:last-child { border-bottom: 0; }
}

@media (max-width: 560px) {
  .stats-page {
    padding: .75rem 10px calc(3.5rem + env(safe-area-inset-bottom));
  }

  .stats-hero {
    min-height: 0;
    border-radius: 18px;
  }

  .stats-hero__content {
    padding: 1.8rem 1.2rem 1.9rem;
  }

  .stats-hero__eyebrow {
    font-size: .67rem;
    letter-spacing: .12em;
  }

  h1 {
    margin-top: .6rem;
    font-size: clamp(2.65rem, 14vw, 3.65rem);
    line-height: 1;
  }

  .stats-hero__status {
    padding: .55rem .72rem;
    font-size: .66rem;
    letter-spacing: .045em;
  }

  .stats-hero__description {
    margin-top: 1rem;
    font-size: .92rem;
    line-height: 1.7;
  }

  .stats-hero__readout { display: none; }
  .stats-library { padding-top: 1rem; }

  .stats-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: .55rem;
  }

  .stats-search {
    min-height: 52px;
    border-radius: 12px;
  }

  .stats-search input { font-size: 16px; }
  .stats-result-count { align-self: flex-end; padding-right: 2px; }

  .stats-filters {
    width: calc(100% + 20px);
    margin: .7rem -10px 1.15rem;
    padding: 2px 10px 9px;
  }

  .stats-filters button {
    min-height: 46px;
    padding-inline: .78rem;
    font-size: .76rem;
  }

  .stats-sections { gap: 1rem; }
  .stats-section { border-radius: 14px; contain-intrinsic-size: auto 620px; }

  .stats-section > header {
    align-items: flex-start;
    flex-direction: column;
    gap: .35rem;
    padding: 1.35rem 1.05rem .95rem;
  }

  .stats-section h2 {
    margin-top: .45rem;
    padding-right: .25rem;
    font-size: 1.2rem;
  }

  .stats-section header > span {
    margin-left: 0;
    font-size: .68rem;
  }

  .stat-card { padding: 1.05rem; }
  .stat-card dt { font-size: .96rem; line-height: 1.45; }
  .stat-card dt small { font-size: .68rem; }
  .stat-card dd { margin-top: .55rem; font-size: .88rem; line-height: 1.72; }

  .stats-source {
    align-items: flex-start;
    padding: .85rem;
    font-size: .75rem;
  }
}

@media (max-width: 360px) {
  .stats-hero__content { padding-inline: 1rem; }
  .stats-hero__status { max-width: 100%; }
  .stats-section > header,
  .stat-card { padding-inline: .9rem; }
}

@media (prefers-reduced-motion: reduce) {
  .stats-hero,
  .stats-library,
  .stats-section,
  .stat-card,
  .stats-hero__grid,
  .stats-hero::after,
  .stats-hero__readout,
  .stats-hero__status span {
    animation: none !important;
  }

  .stat-list-enter-active,
  .stat-list-leave-active,
  .stats-search,
  .stats-filters button,
  .stat-card { transition: none !important; }
}
</style>
