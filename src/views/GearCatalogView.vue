<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="equipment-page">
    <section class="equipment-hero">
      <div class="equipment-hero__copy">
        <span class="equipment-eyebrow"><i />{{ t('equipmentCatalog.eyebrow') }}</span>
        <h1>{{ t('equipmentCatalog.title') }}</h1>
        <p>{{ t('equipmentCatalog.description') }}</p>
      </div>

      <div class="equipment-hero__visual" aria-hidden="true">
        <span class="equipment-ring equipment-ring--outer" />
        <span class="equipment-ring equipment-ring--inner" />
        <div class="equipment-core"><span>GEAR</span><strong>GR</strong><small>DATABASE</small></div>
      </div>
    </section>

    <section class="equipment-pending" aria-labelledby="equipment-pending-title">
      <div class="equipment-pending__icon" aria-hidden="true">GR</div>
      <span>{{ t('equipmentCatalog.pendingStatus') }}</span>
      <h2 id="equipment-pending-title">{{ t('equipmentCatalog.pendingTitle') }}</h2>
      <p>{{ t('equipmentCatalog.pendingDesc') }}</p>
      <div class="equipment-pending__lines" aria-hidden="true"><i /><i /><i /></div>
    </section>
  </main>
</template>

<style scoped>
.equipment-page {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 34px 24px 100px;
  color: #edf6ff;
}

.equipment-hero {
  position: relative;
  display: grid;
  min-height: 350px;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 38%);
  overflow: hidden;
  border: 1px solid rgba(105, 185, 228, 0.2);
  border-radius: 28px;
  background:
    radial-gradient(circle at 82% 20%, rgba(50, 190, 255, 0.14), transparent 34%),
    linear-gradient(125deg, #0b1a2a, #07111d 58%, #13101c);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.32);
}

.equipment-hero::before,
.equipment-pending::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(111, 188, 230, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(111, 188, 230, 0.055) 1px, transparent 1px);
  background-size: 40px 40px;
}

.equipment-hero__copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 52px 58px;
}

.equipment-eyebrow {
  display: flex;
  width: max-content;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(87, 219, 255, 0.23);
  border-radius: 999px;
  background: rgba(87, 219, 255, 0.06);
  padding: 7px 12px;
  color: #67e1ff;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.15em;
}

.equipment-eyebrow i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #67e1ff;
  box-shadow: 0 0 14px #67e1ff;
}

.equipment-hero h1 {
  margin-top: 20px;
  font-size: clamp(54px, 8vw, 104px);
  font-weight: 950;
  line-height: 0.86;
  letter-spacing: -0.07em;
  text-transform: uppercase;
}

.equipment-hero__copy p {
  max-width: 670px;
  margin-top: 24px;
  color: #9eb0c1;
  font-size: 15px;
  line-height: 1.75;
}

.equipment-hero__visual {
  position: relative;
  display: grid;
  place-items: center;
}

.equipment-core {
  position: relative;
  z-index: 2;
  display: grid;
  width: 180px;
  height: 180px;
  place-content: center;
  border: 1px solid rgba(105, 225, 255, 0.35);
  border-radius: 38px;
  background: rgba(7, 22, 34, 0.72);
  text-align: center;
  box-shadow: 0 0 70px rgba(58, 203, 255, 0.14), inset 0 0 35px rgba(58, 203, 255, 0.07);
  transform: rotate(4deg);
  backdrop-filter: blur(10px);
}

.equipment-core span,
.equipment-core small {
  color: #67e1ff;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.25em;
}

.equipment-core strong {
  margin: 8px 0;
  color: #fff;
  font-size: 46px;
  font-weight: 950;
  line-height: 1;
}

.equipment-ring {
  position: absolute;
  z-index: 1;
  width: 260px;
  height: 260px;
  border: 1px solid rgba(96, 219, 255, 0.18);
  border-radius: 50%;
  animation: equipment-spin 16s linear infinite;
}

.equipment-ring::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #6ce5ff;
  box-shadow: 0 0 15px #6ce5ff;
}

.equipment-ring--outer {
  width: 330px;
  height: 330px;
  border-color: rgba(255, 94, 135, 0.13);
  animation-direction: reverse;
  animation-duration: 21s;
}

.equipment-pending {
  position: relative;
  display: flex;
  min-height: 390px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: 24px;
  border: 1px dashed rgba(112, 164, 198, 0.25);
  border-radius: 24px;
  background: linear-gradient(140deg, rgba(10, 25, 39, 0.9), rgba(8, 16, 27, 0.9));
  padding: 50px;
  text-align: center;
}

.equipment-pending > * {
  position: relative;
}

.equipment-pending__icon {
  display: grid;
  width: 90px;
  height: 90px;
  place-items: center;
  border: 1px solid rgba(105, 218, 255, 0.25);
  border-radius: 27px;
  background: rgba(79, 207, 246, 0.08);
  color: #69dfff;
  font-size: 24px;
  font-weight: 950;
}

.equipment-pending > span {
  margin-top: 22px;
  color: #62ddfa;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.equipment-pending h2 {
  margin-top: 8px;
  color: #fff;
  font-size: 36px;
  font-weight: 950;
}

.equipment-pending p {
  max-width: 620px;
  margin-top: 13px;
  color: #8498aa;
  font-size: 14px;
  line-height: 1.7;
}

.equipment-pending__lines {
  display: flex;
  gap: 6px;
  margin-top: 28px;
}

.equipment-pending__lines i {
  width: 32px;
  height: 3px;
  border-radius: 99px;
  background: #193246;
}

.equipment-pending__lines i:first-child {
  background: #58dcfa;
}

@keyframes equipment-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .equipment-page { padding: 18px 12px 70px; }
  .equipment-hero { min-height: 430px; grid-template-columns: 1fr; }
  .equipment-hero__copy { justify-content: flex-start; padding: 32px 24px; }
  .equipment-hero h1 { font-size: 57px; }
  .equipment-hero__visual { position: absolute; right: -30px; bottom: -60px; width: 310px; height: 260px; opacity: 0.58; }
  .equipment-core { width: 130px; height: 130px; border-radius: 30px; }
  .equipment-core strong { font-size: 34px; }
  .equipment-ring { width: 200px; height: 200px; }
  .equipment-ring--outer { width: 260px; height: 260px; }
  .equipment-pending { min-height: 340px; padding: 35px 22px; }
  .equipment-pending h2 { font-size: 29px; }
}

@media (prefers-reduced-motion: reduce) {
  .equipment-ring { animation: none; }
}
</style>
