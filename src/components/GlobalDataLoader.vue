<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
const visible = ref(false)
let revealTimer = null

const clearRevealTimer = () => {
  if (revealTimer !== null) {
    globalThis.clearTimeout(revealTimer)
    revealTimer = null
  }
}

watch(() => props.active, (active) => {
  clearRevealTimer()
  if (!active) {
    visible.value = false
    return
  }

  revealTimer = globalThis.setTimeout(() => {
    visible.value = true
    revealTimer = null
  }, 160)
}, { immediate: true })

onBeforeUnmount(clearRevealTimer)
</script>

<template>
  <Teleport to="body">
    <Transition name="data-loader">
      <div
        v-if="visible"
        class="data-loader"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="data-loader__panel">
          <div class="data-loader__radar" aria-hidden="true">
            <span class="data-loader__orbit data-loader__orbit--outer"></span>
            <span class="data-loader__orbit data-loader__orbit--inner"></span>
            <span class="data-loader__sweep"></span>
            <i></i>
          </div>

          <div class="data-loader__copy">
            <span>{{ t('loading.eyebrow') }}</span>
            <h2>{{ t('loading.title') }}</h2>
            <p>{{ t('loading.message') }}</p>
          </div>

          <div class="data-loader__progress" aria-hidden="true"><span></span></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.data-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 50% 42%, rgba(24, 151, 196, .16), transparent 35%),
    rgba(2, 7, 14, .82);
  backdrop-filter: blur(10px);
}

.data-loader__panel {
  width: min(430px, 100%);
  display: grid;
  justify-items: center;
  overflow: hidden;
  border: 1px solid rgba(91, 222, 255, .28);
  border-radius: 20px;
  padding: 30px 30px 0;
  background: linear-gradient(145deg, rgba(12, 24, 39, .98), rgba(5, 12, 22, .98));
  box-shadow: 0 24px 80px rgba(0, 0, 0, .55), 0 0 40px rgba(91, 222, 255, .08);
  text-align: center;
}

.data-loader__radar {
  position: relative;
  width: 78px;
  height: 78px;
  overflow: hidden;
  border: 1px solid rgba(91, 222, 255, .34);
  border-radius: 50%;
  background:
    linear-gradient(rgba(91, 222, 255, .12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(91, 222, 255, .12) 1px, transparent 1px),
    rgba(91, 222, 255, .035);
  background-size: 13px 13px;
  box-shadow: inset 0 0 22px rgba(91, 222, 255, .08), 0 0 22px rgba(91, 222, 255, .12);
}

.data-loader__radar::before,
.data-loader__radar::after {
  content: '';
  position: absolute;
  background: rgba(91, 222, 255, .22);
}

.data-loader__radar::before {
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
}

.data-loader__radar::after {
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
}

.data-loader__orbit {
  position: absolute;
  border: 1px solid rgba(91, 222, 255, .22);
  border-radius: 50%;
}

.data-loader__orbit--outer { inset: 10px; }
.data-loader__orbit--inner { inset: 25px; }

.data-loader__sweep {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0 74%, rgba(91, 222, 255, .55) 98%, transparent 100%);
  animation: data-radar-sweep 1.35s linear infinite;
}

.data-loader__radar i {
  position: absolute;
  z-index: 2;
  left: 55%;
  top: 30%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff6a57;
  box-shadow: 0 0 12px #ff6a57;
  animation: data-signal-pulse 1s ease-in-out infinite;
}

.data-loader__copy { margin: 21px 0 26px; }

.data-loader__copy span {
  color: #5bdeff;
  font: 800 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .18em;
}

.data-loader__copy h2 {
  margin-top: 8px;
  color: #f2f8ff;
  font-size: clamp(22px, 5vw, 28px);
  font-weight: 950;
  letter-spacing: -.03em;
}

.data-loader__copy p {
  margin-top: 8px;
  color: #91a6b8;
  font-size: 13px;
  line-height: 1.65;
}

.data-loader__progress {
  width: calc(100% + 60px);
  height: 3px;
  overflow: hidden;
  background: rgba(91, 222, 255, .08);
}

.data-loader__progress span {
  display: block;
  width: 38%;
  height: 100%;
  background: linear-gradient(90deg, transparent, #5bdeff, #53e6c2, transparent);
  animation: data-progress 1.25s ease-in-out infinite;
}

.data-loader-enter-active,
.data-loader-leave-active { transition: opacity .2s ease; }

.data-loader-enter-active .data-loader__panel,
.data-loader-leave-active .data-loader__panel { transition: transform .2s ease, opacity .2s ease; }

.data-loader-enter-from,
.data-loader-leave-to { opacity: 0; }

.data-loader-enter-from .data-loader__panel {
  opacity: 0;
  transform: translateY(10px) scale(.98);
}

.data-loader-leave-to .data-loader__panel {
  opacity: 0;
  transform: translateY(-5px) scale(.99);
}

@keyframes data-radar-sweep { to { transform: rotate(360deg); } }
@keyframes data-signal-pulse { 50% { opacity: .35; transform: scale(.72); } }
@keyframes data-progress {
  from { transform: translateX(-110%); }
  to { transform: translateX(365%); }
}

@media (max-width: 480px) {
  .data-loader { padding: 16px; }
  .data-loader__panel { border-radius: 16px; padding: 25px 22px 0; }
  .data-loader__progress { width: calc(100% + 44px); }
}

@media (prefers-reduced-motion: reduce) {
  .data-loader__sweep,
  .data-loader__radar i,
  .data-loader__progress span { animation-duration: 3s; }
}
</style>