<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

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

const route = useRoute()

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

const isActive = item => {
  const match = item.match || item.to
  return match === '/'
    ? route.path === match
    : route.path === match || route.path.startsWith(`${match}/`)
}

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

      <nav v-if="navigation.length" class="role-portal__navigation" :aria-label="`Điều hướng ${roleLabel}`">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="role-portal__nav-item"
          :class="{ 'role-portal__nav-item--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <span>{{ item.index }}</span>
          <span class="role-portal__nav-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.hint }}</small>
          </span>
          <i aria-hidden="true">↗</i>
        </RouterLink>
      </nav>

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
    radial-gradient(circle at 15% 20%, rgba(var(--portal-accent-rgb), 0.08), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(147, 51, 234, 0.06), transparent 45%),
    linear-gradient(rgba(106, 145, 180, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(106, 145, 180, .035) 1px, transparent 1px),
    #05080e;
  background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px, 100% 100%;
  padding: 34px 22px 72px;
}

.role-portal--staff { --portal-accent: #55e0b5; --portal-accent-rgb: 85, 224, 181; }
.role-portal--admin { --portal-accent: #ffc700; --portal-accent-rgb: 255, 199, 0; }

.role-portal__glow {
  position: absolute;
  top: -220px;
  right: -140px;
  width: 650px;
  height: 650px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--portal-accent-rgb), .14), transparent 65%);
  pointer-events: none;
  filter: blur(40px);
}

.role-portal__wrap { position: relative; z-index: 1; width: min(100%, 1460px); margin: 0 auto; }

.role-portal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-height: 156px;
  border: 1px solid rgba(var(--portal-accent-rgb), .28);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(16, 26, 42, .92), rgba(6, 12, 22, .95));
  backdrop-filter: blur(16px);
  padding: 30px 34px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, .45), 0 0 30px rgba(var(--portal-accent-rgb), .08);
}

.role-portal__heading { display: flex; align-items: center; gap: 22px; min-width: 0; }
.role-portal__mark {
  display: grid;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  place-items: center;
  border: 1.5px solid rgba(var(--portal-accent-rgb), .5);
  border-radius: 20px;
  background: radial-gradient(circle, rgba(var(--portal-accent-rgb), .16), rgba(var(--portal-accent-rgb), .03));
  color: var(--portal-accent);
  font: 900 28px ui-monospace, SFMono-Regular, Consolas, monospace;
  box-shadow: inset 0 0 30px rgba(var(--portal-accent-rgb), .12), 0 0 20px rgba(var(--portal-accent-rgb), .2);
}

.role-portal__eyebrow {
  margin: 0 0 7px;
  color: var(--portal-accent);
  font: 900 11px ui-monospace, SFMono-Regular, Consolas, monospace;
  letter-spacing: .22em;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(var(--portal-accent-rgb), .4);
}

.role-portal__heading h1 { margin: 0; color: #f8fafc; font-size: clamp(28px, 3.2vw, 44px); font-weight: 950; line-height: 1.05; letter-spacing: -.04em; }
.role-portal__description { max-width: 680px; margin: 9px 0 0; color: #94a3b8; font-size: 14.5px; line-height: 1.6; }

.role-portal__account { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; background: rgba(15, 23, 42, .6); padding: 8px 12px 8px 8px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, .08); }
.role-portal__avatar { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; background: linear-gradient(135deg, var(--portal-accent), #f59e0b); color: #020617; font-size: 14px; font-weight: 950; shadow: 0 4px 12px rgba(0,0,0,0.3); }
.role-portal__identity { display: grid; min-width: 120px; }
.role-portal__identity strong { color: #f8fafc; font-size: 13.5px; font-weight: 800; }
.role-portal__identity span { margin-top: 2px; color: #64748b; font-size: 11.5px; font-weight: 600; }
.role-portal__logout { cursor: pointer; display: inline-flex; align-items: center; gap: 8px; height: 40px; border: 1px solid rgba(244, 63, 94, .3); border-radius: 10px; padding: 0 14px; color: #fb7185; font-size: 12.5px; font-weight: 800; background: rgba(244, 63, 94, .06); transition: all .2s ease; }
.role-portal__logout svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.role-portal__logout:hover { border-color: rgba(244, 63, 94, .6); background: rgba(244, 63, 94, .16); color: #fda4af; box-shadow: 0 0 15px rgba(244, 63, 94, .25); }

.role-portal__navigation {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
  margin-top: 16px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 18px;
  background: rgba(10, 16, 26, .92);
  backdrop-filter: blur(12px);
}

.role-portal__nav-item {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 72px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-radius: 13px;
  border: 1px solid transparent;
  background: rgba(15, 23, 42, .4);
  padding: 12px 14px;
  transition: all .2s ease;
}

.role-portal__nav-item:hover {
  background: rgba(var(--portal-accent-rgb), .08);
  border-color: rgba(var(--portal-accent-rgb), .25);
  transform: translateY(-1px);
}

.role-portal__nav-item > span:first-child { color: rgba(var(--portal-accent-rgb), .6); font: 900 10px ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .08em; }
.role-portal__nav-copy { display: grid; min-width: 0; gap: 3px; }
.role-portal__nav-copy strong { overflow: hidden; color: #e2e8f0; font-size: 13px; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; transition: color .2s ease; }
.role-portal__nav-copy small { overflow: hidden; color: #64748b; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.role-portal__nav-item > i { color: #475569; font-size: 11px; font-style: normal; transition: transform .2s ease, color .2s ease; }
.role-portal__nav-item:hover > i { transform: translate(2px, -2px); color: var(--portal-accent); }

.role-portal__nav-item--active {
  background: linear-gradient(135deg, rgba(var(--portal-accent-rgb), .16), rgba(15, 23, 42, .95));
  border-color: rgba(var(--portal-accent-rgb), .4);
  box-shadow: 0 0 20px rgba(var(--portal-accent-rgb), .12);
}
.role-portal__nav-item--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--portal-accent);
  box-shadow: 0 0 8px var(--portal-accent);
  border-radius: 999px;
}
.role-portal__nav-item--active .role-portal__nav-copy strong,
.role-portal__nav-item--active > i,
.role-portal__nav-item--active > span:first-child { color: var(--portal-accent); text-shadow: 0 0 8px rgba(var(--portal-accent-rgb), .3); }

.role-portal__content { min-width: 0; margin-top: 24px; }

@media (max-width: 1180px) {
  .role-portal__navigation { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 1050px) {
  .role-portal__header { align-items: flex-start; flex-direction: column; }
  .role-portal__account { width: 100%; }
  .role-portal__logout { margin-left: auto; }
}

@media (max-width: 640px) {
  .role-portal { min-height: calc(100vh - 74px); padding: 18px 12px 48px; }
  .role-portal__header { min-height: 0; border-radius: 18px; padding: 22px 18px; }
  .role-portal__heading { align-items: flex-start; gap: 14px; }
  .role-portal__mark { width: 52px; height: 52px; flex-basis: 52px; border-radius: 14px; font-size: 22px; }
  .role-portal__description { font-size: 12.5px; }
  .role-portal__account { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; }
  .role-portal__avatar { width: 42px; height: 42px; }
  .role-portal__identity { min-width: 0; }
  .role-portal__identity strong, .role-portal__identity span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .role-portal__logout span { display: none; }
  .role-portal__logout { width: 42px; justify-content: center; padding: 0; }
  .role-portal__navigation {
    display: flex;
    gap: 6px;
    margin-inline: -12px;
    padding-inline: 12px;
    overflow-x: auto;
    border-inline: 0;
    border-radius: 0;
    scrollbar-width: none;
  }
  .role-portal__navigation::-webkit-scrollbar { display: none; }
  .role-portal__nav-item { width: 145px; min-height: 66px; flex: 0 0 145px; padding: 11px 12px; }
  .role-portal__nav-copy small { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .role-portal__logout, .role-portal__nav-item { transition: none; }
}
</style>
