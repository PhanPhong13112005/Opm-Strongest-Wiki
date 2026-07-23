<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, required: true },
  roleLabel: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  displayName: { type: String, default: '' },
  username: { type: String, default: '' },
  navigation: { type: Array, default: () => [] },
})

defineEmits(['logout'])

const initials = computed(() => {
  const source = props.displayName || props.username || props.roleLabel
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
})

</script>

<template>
  <main class="role-portal" :class="`role-portal--${role}`">
    <div class="role-portal__glow" aria-hidden="true" />
    <div class="role-portal__wrap">
      <header class="role-portal__header">
        <div class="role-portal__heading">
          <div class="role-portal__mark" aria-hidden="true">
            <span>{{ role === 'admin' ? 'A' : role === 'staff' ? 'S' : 'U' }}</span>
          </div>
          <div>
            <p class="role-portal__eyebrow">{{ roleLabel }}</p>
            <h1>{{ title }}</h1>
            <p class="role-portal__description">{{ description }}</p>
          </div>
        </div>

        <div class="role-portal__account">
          <div class="role-portal__avatar">{{ initials }}</div>
          <div class="role-portal__identity">
            <strong>{{ displayName || username }}</strong>
            <span>{{ username ? `@${username}` : roleLabel }}</span>
          </div>
          <button type="button" class="role-portal__logout" @click="$emit('logout')">
            <span>Đăng xuất</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 8l4 4-4 4M18 12H7M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
            </svg>
          </button>
        </div>
      </header>

      <section class="role-portal__content">
        <slot />
      </section>
    </div>
  </main>
</template>

<style scoped>
.role-portal {
  --portal-accent: #55d8ff;
  --portal-accent-rgb: 85, 216, 255;
  position: relative;
  min-height: calc(100vh - 96px);
  overflow: hidden;
  background:
    linear-gradient(rgba(106, 145, 180, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(106, 145, 180, .035) 1px, transparent 1px),
    #060a11;
  background-size: 52px 52px;
  padding: 34px 22px 72px;
}

.role-portal--staff { --portal-accent: #55e0b5; --portal-accent-rgb: 85, 224, 181; }
.role-portal--admin { --portal-accent: #ffb84d; --portal-accent-rgb: 255, 184, 77; }

.role-portal__glow {
  position: absolute;
  top: -260px;
  right: -180px;
  width: 620px;
  height: 620px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--portal-accent-rgb), .13), transparent 67%);
  pointer-events: none;
}

.role-portal__wrap { position: relative; z-index: 1; width: min(100%, 1460px); margin: 0 auto; }

.role-portal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-height: 156px;
  border: 1px solid rgba(123, 157, 187, .16);
  border-radius: 22px;
  background: linear-gradient(125deg, rgba(14, 25, 39, .96), rgba(8, 14, 23, .92));
  padding: 30px 34px;
  box-shadow: 0 22px 70px rgba(0, 0, 0, .2);
}

.role-portal__heading { display: flex; align-items: center; gap: 22px; min-width: 0; }
.role-portal__mark {
  display: grid;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  place-items: center;
  border: 1px solid rgba(var(--portal-accent-rgb), .4);
  border-radius: 18px;
  background: rgba(var(--portal-accent-rgb), .08);
  color: var(--portal-accent);
  font: 900 27px ui-monospace, SFMono-Regular, Consolas, monospace;
  box-shadow: inset 0 0 28px rgba(var(--portal-accent-rgb), .06);
}

.role-portal__eyebrow {
  margin: 0 0 7px;
  color: var(--portal-accent);
  font: 850 11px ui-monospace, SFMono-Regular, Consolas, monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.role-portal__heading h1 { margin: 0; color: #f5f9ff; font-size: clamp(28px, 3.2vw, 44px); font-weight: 950; line-height: 1.05; letter-spacing: -.04em; }
.role-portal__description { max-width: 680px; margin: 9px 0 0; color: #91a3b5; font-size: 14px; line-height: 1.6; }

.role-portal__account { display: flex; align-items: center; gap: 13px; flex: 0 0 auto; }
.role-portal__avatar { display: grid; width: 46px; height: 46px; place-items: center; border-radius: 50%; background: var(--portal-accent); color: #06101a; font-size: 13px; font-weight: 950; }
.role-portal__identity { display: grid; min-width: 130px; }
.role-portal__identity strong { color: #eef6ff; font-size: 14px; }
.role-portal__identity span { margin-top: 3px; color: #63778b; font-size: 11px; }
.role-portal__logout { display: inline-flex; align-items: center; gap: 8px; height: 42px; border: 1px solid rgba(255, 112, 94, .22); border-radius: 10px; padding: 0 13px; color: #ffa295; font-size: 12px; font-weight: 800; transition: .2s ease; }
.role-portal__logout svg { width: 17px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.role-portal__logout:hover { border-color: rgba(255, 112, 94, .5); background: rgba(255, 112, 94, .08); color: #ffc0b8; }

.role-portal__content { min-width: 0; margin-top: 20px; }

@media (max-width: 1050px) {
  .role-portal__header { align-items: flex-start; flex-direction: column; }
  .role-portal__account { width: 100%; }
  .role-portal__logout { margin-left: auto; }
}

@media (max-width: 640px) {
  .role-portal { min-height: calc(100vh - 74px); padding: 18px 12px 48px; }
  .role-portal__header { min-height: 0; border-radius: 16px; padding: 22px 18px; }
  .role-portal__heading { align-items: flex-start; gap: 14px; }
  .role-portal__mark { width: 50px; height: 50px; flex-basis: 50px; border-radius: 13px; font-size: 20px; }
  .role-portal__description { font-size: 12px; }
  .role-portal__account { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; }
  .role-portal__avatar { width: 42px; height: 42px; }
  .role-portal__identity { min-width: 0; }
  .role-portal__identity strong, .role-portal__identity span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .role-portal__logout span { display: none; }
  .role-portal__logout { width: 42px; justify-content: center; padding: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .role-portal__logout { transition: none; }
}
</style>
