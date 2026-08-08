<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="stats-page">
    <section class="stats-hero" aria-labelledby="stats-title">
      <div class="stats-hero__grid" aria-hidden="true"></div>
      <div class="stats-hero__signal" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="stats-hero__content">
        <p>{{ t('statsPage.eyebrow') }}</p>
        <h1 id="stats-title">{{ t('statsPage.title') }}</h1>
        <div class="stats-hero__status" role="status">
          <i aria-hidden="true"></i>
          {{ t('statsPage.status') }}
        </div>
        <p class="stats-hero__description">{{ t('statsPage.description') }}</p>
      </div>
      <div class="stats-hero__visual" aria-hidden="true">
        <span class="stats-orbit stats-orbit--outer"></span>
        <span class="stats-orbit stats-orbit--inner"></span>
        <strong>ATK</strong><b>HP</b><em>SPD</em>
      </div>
    </section>
  </main>
</template>

<style scoped>
.stats-page { min-height: 68vh; padding: clamp(1.5rem, 4vw, 3rem) clamp(.65rem, 2vw, 1.5rem) 4.5rem; color: #f3f7ff; background: #070b12; }
.stats-hero { position: relative; max-width: 1180px; min-height: 480px; margin: 0 auto; overflow: hidden; border: 1px solid #263347; border-radius: 28px; background: radial-gradient(circle at 82% 42%, rgba(77, 203, 245, .15), transparent 30%), linear-gradient(135deg, #0b1725, #090c14 65%); box-shadow: 0 24px 70px rgba(0,0,0,.35); }
.stats-hero__grid { position: absolute; inset: 0; opacity: .3; background-image: linear-gradient(rgba(77,203,245,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(77,203,245,.12) 1px, transparent 1px); background-size: 54px 54px; mask-image: linear-gradient(90deg,#000,transparent 80%); }
.stats-hero__content { position: relative; z-index: 2; width: min(630px, 100%); padding: clamp(3rem, 6vw, 5rem); }
.stats-hero__content > p:first-child { color: #58d4ff; font: 800 .78rem/1.3 ui-monospace, monospace; letter-spacing: .2em; }
h1 { margin: 1.2rem 0; font-size: clamp(3.5rem, 8vw, 6.25rem); line-height: .88; letter-spacing: -.055em; text-transform: uppercase; }
.stats-hero__status { display: inline-flex; align-items: center; gap: .7rem; padding: .75rem 1rem; border: 1px solid rgba(255,179,0,.45); border-radius: 999px; color: #ffbf2f; background: rgba(255,179,0,.08); font-size: .8rem; font-weight: 900; letter-spacing: .14em; }
.stats-hero__status i { width: .55rem; height: .55rem; border-radius: 50%; background: #ffb300; box-shadow: 0 0 14px #ffb300; animation: pulse 2s ease-in-out infinite; }
.stats-hero__description { max-width: 560px; margin-top: 1.5rem; color: #a8b4c7; font-size: 1rem; line-height: 1.8; }
.stats-hero__visual { position: absolute; right: 4%; top: 50%; width: 330px; height: 330px; transform: translateY(-50%); }
.stats-orbit { position: absolute; inset: 0; border: 1px solid rgba(88,212,255,.24); border-radius: 50%; animation: orbit 28s linear infinite; }
.stats-orbit::after { content: ''; position: absolute; top: 14%; right: 13%; width: 10px; height: 10px; border-radius: 50%; background: #58d4ff; box-shadow: 0 0 20px #58d4ff; }
.stats-orbit--inner { inset: 58px; animation-duration: 20s; animation-direction: reverse; border-color: rgba(255,179,0,.25); }
.stats-orbit--inner::after { background: #ffb300; box-shadow: 0 0 20px #ffb300; }
.stats-hero__visual strong,.stats-hero__visual b,.stats-hero__visual em { position: absolute; font: 900 1.1rem/1 ui-monospace, monospace; color: #e8f8ff; font-style: normal; }
.stats-hero__visual strong { left: 42%; top: 44%; font-size: 2rem; }.stats-hero__visual b { left: 20%; top: 18%; }.stats-hero__visual em { right: 12%; bottom: 21%; }
@keyframes orbit { to { transform: rotate(360deg); } } @keyframes pulse { 50% { opacity: .45; transform: scale(.75); } }
@media (max-width: 800px) { .stats-page { padding-top: 1rem; } .stats-hero { min-height: 430px; border-radius: 22px; } .stats-hero__content { padding: 2.5rem 1.5rem; } .stats-hero__visual { right: -90px; bottom: -120px; top: auto; width: 250px; height: 250px; transform: none; opacity: .3; } }
@media (max-width: 480px) { .stats-page { padding-inline: 10px; padding-bottom: 3.5rem; } .stats-hero { min-height: 410px; border-radius: 18px; } .stats-hero__content { padding: 2.15rem 1.25rem; } h1 { margin: 1rem 0; font-size: clamp(3rem, 15vw, 3.75rem); line-height: .92; } .stats-hero__status { gap: .5rem; padding: .65rem .8rem; font-size: .72rem; letter-spacing: .08em; } .stats-hero__description { margin-top: 1.2rem; font-size: .9rem; line-height: 1.65; } .stats-hero__visual { right: -75px; bottom: -95px; width: 210px; height: 210px; } }
@media (prefers-reduced-motion: reduce) { .stats-orbit,.stats-hero__status i { animation: none; } }
</style>
