<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const activeTab = ref('basic')
const tabs = computed(() => [
  { key: 'basic', code: '01', label: t('talentsPage.tabs.basic') },
  { key: 'intermediate', code: '02', label: t('talentsPage.tabs.intermediate') },
  { key: 'advanced', code: '03', label: t('talentsPage.tabs.advanced') },
  { key: 'sigils', code: '04', label: t('talentsPage.tabs.sigils') }
])
</script>

<template>
  <main class="talents-page">
    <header class="talents-header">
      <div>
        <p>{{ t('talentsPage.eyebrow') }}</p>
        <h1>{{ t('talentsPage.title') }}</h1>
      </div>
      <p>{{ t('talentsPage.description') }}</p>
    </header>

    <nav class="talent-tabs" role="tablist" :aria-label="t('talentsPage.title')">
      <button v-for="tab in tabs" :id="`talent-tab-${tab.key}`" :key="tab.key" type="button" role="tab" :aria-selected="activeTab === tab.key" :aria-controls="`talent-panel-${tab.key}`" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <small>{{ tab.code }}</small><span>{{ tab.label }}</span>
      </button>
    </nav>

    <section :id="`talent-panel-${activeTab}`" class="talent-panel" role="tabpanel" :aria-labelledby="`talent-tab-${activeTab}`">
      <div class="talent-panel__diagram" aria-hidden="true">
        <span></span><i></i><b></b><em></em>
      </div>
      <div class="talent-panel__copy">
        <span>{{ tabs.find(tab => tab.key === activeTab)?.code }} // {{ tabs.find(tab => tab.key === activeTab)?.label }}</span>
        <h2>{{ t('talentsPage.pending') }}</h2>
        <p>{{ t('talentsPage.pendingDescription') }}</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.talents-page { width: 100%; max-width: 1280px; min-height: 70vh; margin: 0 auto; padding: clamp(2rem, 4vw, 3.5rem) clamp(1rem, 3vw, 2rem) 5rem; color: #f4f7fb; background: #070b12; }
.talents-header { display: grid; grid-template-columns: 1fr minmax(280px, 520px); align-items: end; gap: 2rem; padding-bottom: 2.5rem; border-bottom: 1px solid #263347; }
.talents-header > div > p { color: #59d6ff; font: 800 .72rem/1.2 ui-monospace, monospace; letter-spacing: .2em; }.talents-header h1 { margin-top: .8rem; font-size: clamp(3rem, 7vw, 6rem); line-height: .9; letter-spacing: -.05em; text-transform: uppercase; }.talents-header > p { color: #aeb9c7; font-size: .95rem; line-height: 1.75; }
.talent-tabs { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin: 2rem 0; }.talent-tabs button { display: flex; min-height: 76px; align-items: center; gap: 1rem; padding: 1rem; text-align: left; color: #8d9aac; border: 1px solid #263347; border-radius: 14px; background: #0c121c; transition: border-color .25s, transform .25s, background .25s; }.talent-tabs button:hover { border-color: #4b667f; transform: translateY(-2px); }.talent-tabs button.active { color: #f4f8ff; border-color: #59d6ff; background: linear-gradient(135deg,rgba(89,214,255,.16),#0c121c); box-shadow: 0 0 24px rgba(89,214,255,.08); } .talent-tabs button:focus-visible { outline: 2px solid #59d6ff; outline-offset: 2px; }.talent-tabs small { color: #59d6ff; font: 800 .72rem/1 ui-monospace,monospace; }.talent-tabs span { font-size: .82rem; font-weight: 900; line-height: 1.3; letter-spacing: .05em; text-transform: uppercase; }
.talent-panel { position: relative; display: grid; grid-template-columns: minmax(280px, 42%) 1fr; align-items: center; min-height: 410px; overflow: hidden; border: 1px solid #263347; border-radius: 24px; background: radial-gradient(circle at 20% 50%,rgba(255,179,0,.13),transparent 30%),#0a1019; }.talent-panel::after { content:''; position:absolute; inset:0; pointer-events:none; background-image:linear-gradient(rgba(89,214,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(89,214,255,.05) 1px,transparent 1px); background-size:42px 42px; }.talent-panel__diagram { position:relative; z-index:1; width:260px; height:260px; margin:auto; }.talent-panel__diagram span,.talent-panel__diagram i,.talent-panel__diagram b,.talent-panel__diagram em { position:absolute; border:1px solid rgba(255,179,0,.38); transform:rotate(45deg); }.talent-panel__diagram span { inset:25px; }.talent-panel__diagram i { inset:70px; background:rgba(255,179,0,.08); }.talent-panel__diagram b { left:114px; top:114px; width:32px; height:32px; background:#ffb300; box-shadow:0 0 28px rgba(255,179,0,.75); }.talent-panel__diagram em { inset:0; border-color:rgba(89,214,255,.15); }.talent-panel__copy { position:relative; z-index:1; padding:3rem; }.talent-panel__copy > span { color:#59d6ff; font:800 .7rem/1.2 ui-monospace,monospace; letter-spacing:.13em; text-transform:uppercase; }.talent-panel__copy h2 { margin:1rem 0; font-size:clamp(2rem,5vw,4rem); line-height:1; text-transform:uppercase; }.talent-panel__copy p { max-width:560px; color:#9eabba; line-height:1.8; }
@media (max-width: 900px) { .talents-header { grid-template-columns:1fr; padding-bottom:2rem; }.talent-tabs { grid-template-columns:1fr 1fr; }.talent-panel { min-height:380px; grid-template-columns:1fr; padding-top:1.75rem; }.talent-panel__diagram { width:180px;height:180px; }.talent-panel__diagram b { left:74px;top:74px; }.talent-panel__copy { padding:1.75rem 1.5rem 2.5rem; } }
@media (max-width: 520px) { .talents-page { padding:1.5rem 10px 3.5rem; }.talents-header { gap:1rem; padding-bottom:1.4rem; }.talents-header h1 { font-size:clamp(2.8rem,14vw,3.6rem); }.talents-header > p { font-size:.9rem; line-height:1.6; }.talent-tabs { grid-template-columns:1fr 1fr; gap:8px; margin:1.25rem 0; }.talent-tabs button { min-height:68px; gap:.6rem; padding:.75rem; }.talent-tabs span { font-size:.72rem; }.talent-panel { min-height:0; border-radius:18px; padding-top:1.5rem; }.talent-panel__diagram { width:150px;height:150px; }.talent-panel__diagram span { inset:18px; }.talent-panel__diagram i { inset:48px; }.talent-panel__diagram b { left:59px;top:59px; }.talent-panel__copy { padding:1.5rem 1.15rem 2.25rem; }.talent-panel__copy h2 { margin:.8rem 0; font-size:clamp(1.9rem,10vw,2.5rem); }.talent-panel__copy p { font-size:.9rem; line-height:1.65; } }
@media (prefers-reduced-motion: reduce) { .talent-tabs button { transition:none; } }
</style>
