<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CouponTopUpView from './CouponTopUpView.vue'
import TopUpView from './TopUpView.vue'

const route = useRoute()
const router = useRouter()
const tabs = [
  { id: 'coupon', code: 'CP', label: 'Nạp Coupon', hint: 'Nạp vào tài khoản game' },
  { id: 'bank', code: 'BK', label: 'Nạp bằng ngân hàng', hint: 'Cộng số dư thành viên' },
]

const activeTab = computed(() => route.query.tab === 'bank' ? 'bank' : 'coupon')

const selectTab = async (tab) => {
  if (tab === activeTab.value) return
  const query = { ...route.query }
  if (tab === 'bank') query.tab = 'bank'
  else delete query.tab
  await router.replace({ path: '/top-up', query })
}
</script>

<template>
  <div class="topup-hub">
    <nav class="topup-hub__tabs" role="tablist" aria-label="Phương thức nạp">
      <button
        v-for="tab in tabs"
        :id="`topup-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`topup-panel-${tab.id}`"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="selectTab(tab.id)"
      >
        <span>{{ tab.code }}</span>
        <div><strong>{{ tab.label }}</strong><small>{{ tab.hint }}</small></div>
      </button>
    </nav>

    <section
      :id="`topup-panel-${activeTab}`"
      role="tabpanel"
      :aria-labelledby="`topup-tab-${activeTab}`"
    >
      <CouponTopUpView v-if="activeTab === 'coupon'" />
      <TopUpView v-else />
    </section>
  </div>
</template>

<style scoped>
.topup-hub {
  min-height: calc(100vh - 96px);
  background: #050a11;
  font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.topup-hub__tabs {
  display: grid;
  width: min(calc(100% - 52px), 1050px);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 auto;
  padding-top: 26px;
}

.topup-hub__tabs button {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(105, 148, 181, .17);
  border-radius: 13px;
  background: rgba(7, 14, 23, .92);
  padding: 13px 15px;
  color: #75899a;
  text-align: left;
  transition: border-color .2s ease, background .2s ease, transform .2s ease;
}

.topup-hub__tabs button:hover {
  border-color: rgba(85, 224, 181, .32);
  transform: translateY(-1px);
}

.topup-hub__tabs button.is-active {
  border-color: rgba(85, 224, 181, .65);
  background: linear-gradient(120deg, rgba(85, 224, 181, .11), rgba(7, 14, 23, .94));
  color: #eaf7f3;
}

.topup-hub__tabs button > span {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 9px;
  background: rgba(85, 224, 181, .08);
  color: #55e0b5;
  font: 900 10px ui-monospace, SFMono-Regular, Consolas, monospace;
}

.topup-hub__tabs strong,
.topup-hub__tabs small {
  display: block;
}

.topup-hub__tabs strong {
  font-size: 15px;
  font-weight: 850;
  line-height: 1.3;
}

.topup-hub__tabs small {
  margin-top: 4px;
  color: #8a9eaf;
  font-size: 11px;
  line-height: 1.4;
}

@media (max-width: 600px) {
  .topup-hub__tabs {
    width: calc(100% - 24px);
    gap: 7px;
    padding-top: 12px;
  }

  .topup-hub__tabs button {
    min-width: 0;
    gap: 8px;
    padding: 10px;
  }

  .topup-hub__tabs button > span {
    width: 32px;
    height: 32px;
    flex-basis: 32px;
  }

  .topup-hub__tabs strong {
    font-size: 14px;
  }

  .topup-hub__tabs small {
    display: none;
  }
}
</style>
