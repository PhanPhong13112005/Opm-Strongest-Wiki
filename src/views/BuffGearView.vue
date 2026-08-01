<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const systemCards = computed(() => [
  { code: 'DU', name: t('filters.type.duelist'), alias: locale.value === 'vi' ? 'Duelist' : '', accent: '#ffb300' },
  { code: 'ES', name: t('filters.type.esper'), alias: locale.value === 'vi' ? 'Esper' : '', accent: '#b861ff' },
  { code: 'HT', name: t('filters.type.hi_tech'), alias: locale.value === 'vi' ? 'Hi-Tech' : '', accent: '#00a8ff' },
  { code: 'GP', name: t('filters.type.grappler'), alias: locale.value === 'vi' ? 'Grappler' : '', accent: '#ff4f5e' },
])

const gradeCards = computed(() => [
  { code: 'A', name: 'A', accent: '#60a5fa' },
  { code: 'B', name: 'B', accent: '#34d399' },
  { code: 'C', name: 'C', accent: '#94a3b8' },
  { code: 'S', name: 'S', accent: '#fbbf24' },
  { code: 'DR', name: t('buffGear.dragon'), alias: locale.value === 'vi' ? 'Dragon' : '', accent: '#ff4668' },
  { code: 'DE', name: t('buffGear.demon'), alias: locale.value === 'vi' ? 'Demon' : '', accent: '#a855f7' },
  { code: 'TI', name: t('buffGear.tiger'), alias: locale.value === 'vi' ? 'Tiger' : '', accent: '#f97316' },
])

const factionCards = computed(() => [
  { code: 'HE', name: t('filters.faction.hero'), alias: locale.value === 'vi' ? 'Hero' : '', accent: '#ffc107' },
  { code: 'MO', name: t('filters.faction.monster'), alias: locale.value === 'vi' ? 'Monster' : '', accent: '#ef4444' },
])
</script>

<template>
  <main class="buff-page">
    <section class="buff-hero">
      <div>
        <span class="buff-eyebrow"><i />{{ t('buffGear.eyebrow') }}</span>
        <h1>{{ t('buffGear.title') }}</h1>
        <p>{{ t('buffGear.description') }}</p>
      </div>
      <div class="buff-hero__badge" aria-hidden="true"><span>BUFF</span><strong>BG</strong><small>GEAR</small></div>
    </section>

    <section class="buff-pending" aria-labelledby="buff-pending-title">
      <div class="buff-pending__icon" aria-hidden="true">BG</div>
      <div>
        <span>{{ t('buffGear.pendingStatus') }}</span>
        <h2 id="buff-pending-title">{{ t('buffGear.pendingTitle') }}</h2>
        <p>{{ t('buffGear.pendingDesc') }}</p>
      </div>
    </section>

    <section class="buff-section">
      <header>
        <span>01</span>
        <div><h2>{{ t('buffGear.systemCards') }}</h2><p>{{ t('buffGear.systemCardsDesc') }}</p></div>
      </header>
      <div class="token-grid token-grid--four">
        <article v-for="item in systemCards" :key="item.code" class="gear-token" :style="{ '--accent': item.accent }">
          <span>{{ item.code }}</span>
          <div><strong>{{ item.name }}</strong><small v-if="item.alias">{{ item.alias }}</small></div>
          <b>{{ t('buffGear.plannedStatus') }}</b>
        </article>
      </div>
    </section>

    <section class="buff-section">
      <header>
        <span>02</span>
        <div><h2>{{ t('buffGear.gradeCards') }}</h2><p>{{ t('buffGear.gradeCardsDesc') }}</p></div>
      </header>
      <div class="token-grid token-grid--grade">
        <article v-for="item in gradeCards" :key="item.code" class="gear-token" :style="{ '--accent': item.accent }">
          <span>{{ item.code }}</span>
          <div><strong>{{ item.name }}</strong><small v-if="item.alias">{{ item.alias }}</small></div>
          <b>{{ t('buffGear.plannedStatus') }}</b>
        </article>
      </div>
    </section>

    <section class="buff-section">
      <header>
        <span>03</span>
        <div><h2>{{ t('buffGear.factionCards') }}</h2><p>{{ t('buffGear.factionCardsDesc') }}</p></div>
      </header>
      <div class="token-grid token-grid--faction">
        <article v-for="item in factionCards" :key="item.code" class="gear-token" :style="{ '--accent': item.accent }">
          <span>{{ item.code }}</span>
          <div><strong>{{ item.name }}</strong><small v-if="item.alias">{{ item.alias }}</small></div>
          <b>{{ t('buffGear.plannedStatus') }}</b>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.buff-page {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 34px 24px 100px;
  color: #edf6ff;
}

.buff-hero {
  position: relative;
  display: grid;
  min-height: 320px;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(167, 112, 255, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at 85% 30%, rgba(170, 80, 255, 0.18), transparent 34%),
    radial-gradient(circle at 10% 90%, rgba(41, 192, 255, 0.1), transparent 35%),
    linear-gradient(125deg, #0b1929, #090f1c 62%, #151020);
  padding: 48px 58px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.32);
}

.buff-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(139, 133, 223, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 133, 223, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

.buff-hero > * {
  position: relative;
  z-index: 1;
}

.buff-eyebrow {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(196, 125, 255, 0.28);
  border-radius: 999px;
  background: rgba(171, 82, 255, 0.08);
  padding: 7px 12px;
  color: #d29aff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.buff-eyebrow i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ca82ff;
  box-shadow: 0 0 14px #ca82ff;
}

.buff-hero h1 {
  margin-top: 20px;
  color: #fff;
  font-size: clamp(48px, 7vw, 88px);
  font-weight: 950;
  line-height: 0.9;
  letter-spacing: -0.065em;
  text-transform: uppercase;
}

.buff-hero p {
  max-width: 690px;
  margin-top: 23px;
  color: #9daec0;
  font-size: 15px;
  line-height: 1.75;
}

.buff-hero__badge {
  display: grid;
  width: 180px;
  height: 180px;
  place-content: center;
  justify-self: center;
  border: 1px solid rgba(211, 145, 255, 0.38);
  border-radius: 50%;
  background: rgba(23, 13, 38, 0.72);
  text-align: center;
  box-shadow: 0 0 70px rgba(171, 75, 255, 0.18), inset 0 0 35px rgba(171, 75, 255, 0.09);
}

.buff-hero__badge span,
.buff-hero__badge small {
  color: #d29aff;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.24em;
}

.buff-hero__badge strong {
  margin: 6px 0;
  font-size: 48px;
  font-weight: 950;
  line-height: 1;
}

.buff-pending {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  gap: 20px;
  margin-top: 18px;
  border: 1px solid rgba(202, 130, 255, .25);
  border-radius: 22px;
  background:
    linear-gradient(120deg, rgba(171, 82, 255, .09), transparent 45%),
    rgba(9, 20, 33, .9);
  padding: 24px;
}

.buff-pending__icon {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border: 1px solid rgba(202, 130, 255, .34);
  border-radius: 22px;
  background: rgba(171, 82, 255, .1);
  color: #d29aff;
  font-size: 20px;
  font-weight: 950;
  box-shadow: inset 0 0 24px rgba(171, 82, 255, .08);
}

.buff-pending span {
  color: #d29aff;
  font: 900 9px/1.4 ui-monospace, monospace;
  letter-spacing: .16em;
}

.buff-pending h2 {
  margin-top: 5px;
  color: #f5efff;
  font-size: 21px;
  font-weight: 950;
}

.buff-pending p {
  margin-top: 5px;
  color: #91a4b6;
  font-size: 13px;
}
.buff-section {
  margin-top: 18px;
  border: 1px solid rgba(105, 159, 195, 0.16);
  border-radius: 22px;
  background: rgba(9, 20, 33, 0.82);
  padding: 24px;
}

.buff-section > header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 19px;
}

.buff-section > header > span {
  display: grid;
  width: 44px;
  height: 44px;
  flex: none;
  place-items: center;
  border-radius: 13px;
  background: #10283b;
  color: #65def9;
  font: 900 11px ui-monospace, monospace;
}

.buff-section h2 {
  color: #f1f7fc;
  font-size: 19px;
  font-weight: 950;
}

.buff-section header p {
  margin-top: 3px;
  color: #71879a;
  font-size: 12px;
}

.token-grid {
  display: grid;
  gap: 10px;
}

.token-grid--four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.token-grid--grade { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.token-grid--faction { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.gear-token {
  --accent: #64e1ff;
  display: grid;
  min-height: 92px;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 11px;
  border: 1px solid color-mix(in srgb, var(--accent) 18%, rgba(100, 150, 185, 0.1));
  border-radius: 15px;
  background: linear-gradient(130deg, color-mix(in srgb, var(--accent) 7%, #0a1724), #09131e);
  padding: 13px;
  transition: 0.25s;
}

.gear-token:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.gear-token > span {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: 11px;
  font-weight: 950;
}

.gear-token strong {
  display: block;
  color: #eaf2f9;
  font-size: 12px;
  font-weight: 900;
}

.gear-token small {
  display: block;
  margin-top: 2px;
  color: #71879a;
  font-size: 9px;
}

.gear-token > b {
  grid-column: 1 / -1;
  color: #526a7e;
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.token-grid--grade .gear-token {
  grid-template-columns: 34px 1fr;
  padding: 10px;
}

.token-grid--grade .gear-token > span {
  width: 34px;
  height: 34px;
  font-size: 9px;
}

.token-grid--grade .gear-token strong { font-size: 11px; }

@media (max-width: 1050px) {
  .token-grid--four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .token-grid--grade { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .buff-page { padding: 18px 12px 70px; }
  .buff-hero { min-height: 440px; grid-template-columns: 1fr; align-items: start; padding: 32px 24px; }
  .buff-hero h1 { font-size: 52px; }
  .buff-hero__badge { position: absolute; right: 22px; bottom: 20px; width: 130px; height: 130px; opacity: 0.62; }
  .buff-hero__badge strong { font-size: 34px; }
  .token-grid--grade { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 480px) {
  .buff-hero h1 { font-size: 43px; }
  .buff-hero p { font-size: 13px; }
  .buff-pending {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .buff-section { padding: 17px; }
  .token-grid--four,
  .token-grid--faction { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .gear-token { transition: none; }
}
</style>
