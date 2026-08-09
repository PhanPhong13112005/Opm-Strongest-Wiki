<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GearCatalogWorkbench from '../components/GearCatalogWorkbench.vue'

const { t, locale } = useI18n()
const heroStats = computed(() => locale.value === 'en' ? [
  ['20', 'Gear sets'],
  ['80', 'Catalog pieces'],
  ['4', 'Evolution paths'],
] : [
  ['20', 'Bộ trang bị'],
  ['80', 'Món dữ liệu'],
  ['4', 'Nhánh tiến hóa'],
])
</script>

<template>
  <main class="equipment-page">
    <section class="equipment-hero">
      <div class="equipment-hero__copy">
        <span class="equipment-eyebrow"><i />{{ t('equipmentCatalog.eyebrow') }}</span>
        <h1>{{ t('equipmentCatalog.title') }}</h1>
        <p>{{ t('equipmentCatalog.description') }}</p>
      </div>

      <div class="equipment-hero__visual" aria-label="Gear database summary">
        <div class="equipment-metrics">
          <article v-for="stat in heroStats" :key="stat[1]">
            <strong>{{ stat[0] }}</strong>
            <span>{{ stat[1] }}</span>
          </article>
        </div>
      </div>
    </section>

    <GearCatalogWorkbench />
  </main>
</template>

<style scoped>
.equipment-page {
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 24px clamp(12px, 2.4vw, 30px) 80px;
  color: #edf7fb;
}

.equipment-hero {
  position: relative;
  display: grid;
  min-height: 230px;
  grid-template-columns: minmax(0, 1.35fr) minmax(270px, .65fr);
  overflow: hidden;
  border: 1px solid rgba(107, 202, 237, .22);
  border-radius: 22px;
  background:
    radial-gradient(circle at 82% 18%, rgba(93, 220, 250, .15), transparent 33%),
    linear-gradient(125deg, #0b2231 0%, #07131e 58%, #15111c 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, .28);
  animation: equipment-hero-in .48s cubic-bezier(.2, .75, .25, 1) both;
}

.equipment-hero::before {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background-image:
    linear-gradient(rgba(111, 188, 230, .045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(111, 188, 230, .045) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(90deg, #000 0%, rgba(0, 0, 0, .7) 65%, transparent 100%);
  animation: equipment-grid-drift 12s linear infinite;
}

.equipment-hero::after {
  position: absolute;
  top: -52px;
  right: 2%;
  width: 280px;
  height: 280px;
  content: '';
  pointer-events: none;
  border: 2px dashed rgba(103, 225, 255, .24);
  border-radius: 50%;
  box-shadow: inset 0 0 38px rgba(103, 225, 255, .06), 0 0 48px rgba(103, 225, 255, .08);
  animation: equipment-orbit-spin 18s linear infinite;
}

.equipment-hero__copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px 38px;
}

.equipment-eyebrow {
  display: inline-flex;
  width: max-content;
  align-items: center;
  gap: 9px;
  padding: 7px 12px;
  color: #71e4fb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .15em;
  border: 1px solid rgba(103, 225, 255, .28);
  border-radius: 999px;
  background: rgba(103, 225, 255, .07);
}

.equipment-eyebrow i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #67e1ff;
  box-shadow: 0 0 13px #67e1ff;
  animation: equipment-signal-pulse 1.8s ease-in-out infinite;
}

.equipment-hero h1 {
  max-width: 780px;
  margin-top: 17px;
  color: #f7fbff;
  font-size: clamp(42px, 5.2vw, 66px);
  font-weight: 950;
  line-height: .94;
  letter-spacing: -.055em;
  text-transform: uppercase;
}

.equipment-hero__copy p {
  max-width: 680px;
  margin-top: 15px;
  color: #a8bac7;
  font-size: 15px;
  line-height: 1.7;
}

.equipment-hero__visual {
  position: relative;
  z-index: 2;
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 28px 30px 28px 0;
}

.equipment-metrics {
  display: grid;
  width: min(310px, 100%);
  gap: 8px;
}

.equipment-metrics article {
  display: grid;
  min-height: 56px;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 9px 13px;
  border: 1px solid rgba(103, 225, 255, .2);
  border-radius: 12px;
  background: rgba(7, 24, 36, .78);
  backdrop-filter: blur(8px);
}

.equipment-metrics strong {
  color: #75e6fb;
  font-size: 27px;
  font-weight: 950;
  line-height: 1;
  text-align: center;
}

.equipment-metrics span {
  color: #d6e5eb;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

@media (max-width: 760px) {
  .equipment-page { padding: 14px 9px 56px; }
  .equipment-hero { min-height: 0; grid-template-columns: 1fr; border-radius: 18px; }
  .equipment-hero__copy { justify-content: flex-start; padding: 22px 17px 14px; }
  .equipment-hero h1 { max-width: 100%; margin-top: 14px; font-size: clamp(35px, 11vw, 46px); line-height: .96; }
  .equipment-hero__copy p { max-width: 100%; margin-top: 12px; font-size: 13px; line-height: 1.6; }
  .equipment-hero__visual { padding: 0 17px 18px; }
  .equipment-metrics { width: 100%; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .equipment-metrics article { min-height: 70px; grid-template-columns: 1fr; gap: 4px; padding: 9px 6px; text-align: center; }
  .equipment-metrics strong { font-size: 23px; }
  .equipment-metrics span { font-size: 9px; line-height: 1.3; }
}

@keyframes equipment-hero-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes equipment-grid-drift {
  from { background-position: 0 0, 0 0; }
  to { background-position: 42px 42px, 42px 42px; }
}

@keyframes equipment-orbit-spin {
  to { transform: rotate(360deg); }
}

@keyframes equipment-signal-pulse {
  0%, 100% { opacity: .55; transform: scale(.86); }
  50% { opacity: 1; transform: scale(1.22); }
}

@media (prefers-reduced-motion: reduce) {
  .equipment-hero,
  .equipment-hero::before,
  .equipment-hero::after,
  .equipment-eyebrow i { animation: none; }
}
</style>