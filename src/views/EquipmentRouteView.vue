<script setup>
import { defineAsyncComponent } from 'vue'
import EquipmentRouteSkeleton from '../components/EquipmentRouteSkeleton.vue'

const loadEquipmentContent = (retries = 2) => import('./GearCatalogView.vue').catch((error) => {
  if (retries <= 0) throw error
  return new Promise(resolve => globalThis.setTimeout(resolve, 800))
    .then(() => loadEquipmentContent(retries - 1))
})

const EquipmentContent = defineAsyncComponent({
  loader: () => loadEquipmentContent(),
  loadingComponent: EquipmentRouteSkeleton,
  delay: 0,
  timeout: 30_000,
})
</script>

<template>
  <main class="equipment-page">
    <EquipmentContent />
  </main>
</template>

<style scoped>
.equipment-page {
  width: min(1240px, 100%);
  min-height: calc(100svh - 77px);
  margin: 0 auto;
  padding: 24px clamp(12px, 2.4vw, 30px) 80px;
  color: #edf7fb;
}
@media (max-width: 639px) {
  .equipment-page {
    min-height: calc(100svh - 73px);
    padding: 14px 9px 56px;
  }
}
</style>
