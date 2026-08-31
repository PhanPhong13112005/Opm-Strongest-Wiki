<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps({
  role: { type: String, required: true },
  roleLabel: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
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
    <div class="role-portal__wrap">
      <!-- Compact Header Control Bar -->
      <header class="role-portal__topbar">
        <div class="role-portal__brand">
          <span class="role-pill">{{ roleLabel }}</span>
          <h1 class="role-title">{{ title }}</h1>
        </div>

        <div class="role-portal__user">
          <div class="user-badge">
            <span class="avatar-circle">{{ initials }}</span>
            <div class="user-meta hidden sm:block">
              <strong>{{ displayName || username }}</strong>
              <small>{{ username ? `@${username}` : roleLabel }}</small>
            </div>
          </div>
          <button type="button" class="btn-logout" title="Đăng xuất" @click="$emit('logout')">
            <span>Đăng xuất</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 8l4 4-4 4M18 12H7M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Sleek Horizontal Navigation Tab Strip -->
      <nav v-if="navigation.length" class="role-portal__tabstrip" :aria-label="`Điều hướng ${roleLabel}`">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-tab"
          :class="{ 'nav-tab--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <span class="nav-tab__num">{{ item.index }}</span>
          <span class="nav-tab__label">{{ item.label }}</span>
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
  --accent-gold: #ffc700;
  --accent-cyan: #38bdf8;
  position: relative;
  min-height: calc(100vh - 72px);
  background:
    radial-gradient(circle at 10% 10%, rgba(255, 199, 0, 0.03), transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(56, 189, 248, 0.03), transparent 40%),
    #05080e;
  padding: 12px 16px 40px;
}
.role-portal__wrap { max-width: 1440px; margin: 0 auto; }

/* Top Header Bar */
.role-portal__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(12, 19, 32, .95), rgba(6, 10, 18, .98));
}

.role-portal__brand { display: flex; align-items: center; gap: 10px; }
.role-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 199, 0, .12);
  border: 1px solid rgba(255, 199, 0, .3);
  color: #ffc700;
  font-size: 9.5px;
  font-weight: 900;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.role-title { margin: 0; color: #f8fafc; font-size: 15px; font-weight: 900; letter-spacing: -.01em; }

.role-portal__user { display: flex; align-items: center; gap: 10px; }
.user-badge { display: flex; align-items: center; gap: 8px; }
.avatar-circle {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: linear-gradient(135deg, #ffc700, #f59e0b);
  color: #020617;
  font-size: 11px;
  font-weight: 950;
  display: grid;
  place-items: center;
}
.user-meta strong { display: block; color: #f8fafc; font-size: 11.5px; font-weight: 850; line-height: 1.1; }
.user-meta small { color: #64748b; font-size: 9.5px; }

.btn-logout {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(244, 63, 94, .3);
  background: rgba(244, 63, 94, .08);
  color: #fb7185;
  font-size: 11px;
  font-weight: 850;
  transition: all .2s ease;
}
.btn-logout:hover { background: rgba(244, 63, 94, .2); border-color: rgba(244, 63, 94, .6); }
.btn-logout svg { width: 12px; height: 12px; }

/* Tabstrip Navigation */
.role-portal__tabstrip {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  overflow-x: auto;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
  padding-bottom: 6px;
}
.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, .06);
  background: rgba(12, 19, 32, .6);
  color: #8194a6;
  font-size: 13px;
  font-weight: 850;
  text-decoration: none;
  white-space: nowrap;
  transition: all .2s ease;
}
.nav-tab:hover { color: #f8fafc; border-color: rgba(255, 255, 255, .15); background: rgba(15, 23, 42, .8); }
.nav-tab--active {
  background: #ffc700;
  border-color: #ffc700;
  color: #020617;
  box-shadow: 0 0 10px rgba(255, 199, 0, .25);
}
.nav-tab__num {
  font-size: 9.5px;
  font-weight: 900;
  opacity: .7;
}

.role-portal__content { margin-top: 10px; }

@media (max-width: 768px) {
  .role-portal__topbar { flex-direction: column; align-items: flex-start; }
  .role-portal__user { width: 100%; justify-content: space-between; }
}
</style>
