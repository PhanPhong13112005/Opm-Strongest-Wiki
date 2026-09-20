<template>
  <div class="equipment-route-skeleton" role="status" aria-label="Đang tải dữ liệu trang bị">
    <section class="equipment-route-skeleton__hero">
      <span></span>
      <strong></strong>
      <i></i>
    </section>
    <section class="equipment-route-skeleton__workbench">
      <span v-for="index in 4" :key="index"></span>
    </section>
  </div>
</template>

<style scoped>
.equipment-route-skeleton { min-height: calc(100svh - 181px); }
.equipment-route-skeleton__hero {
  display: grid;
  min-height: 250px;
  align-content: center;
  gap: 14px;
  border: 1px solid rgba(79, 209, 255, .14);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(10, 25, 37, .94), rgba(6, 12, 20, .96));
  padding: clamp(28px, 5vw, 58px);
}
.equipment-route-skeleton__hero span,
.equipment-route-skeleton__hero strong,
.equipment-route-skeleton__hero i,
.equipment-route-skeleton__workbench span {
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(100deg, rgba(90, 128, 151, .08) 25%, rgba(101, 220, 255, .16) 45%, rgba(90, 128, 151, .08) 65%);
  background-size: 220% 100%;
  animation: equipment-route-pulse 1.4s linear infinite;
}
.equipment-route-skeleton__hero span { width: 150px; height: 14px; }
.equipment-route-skeleton__hero strong { width: min(520px, 82%); height: 58px; }
.equipment-route-skeleton__hero i { width: min(660px, 94%); height: 18px; }
.equipment-route-skeleton__workbench { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
.equipment-route-skeleton__workbench span { height: 74px; border-radius: 14px; }
@keyframes equipment-route-pulse { to { background-position: -220% 0; } }
@media (max-width: 640px) {
  .equipment-route-skeleton__hero { min-height: 220px; }
  .equipment-route-skeleton__workbench { grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .equipment-route-skeleton__hero span,
  .equipment-route-skeleton__hero strong,
  .equipment-route-skeleton__hero i,
  .equipment-route-skeleton__workbench span { animation: none; }
}
</style>
