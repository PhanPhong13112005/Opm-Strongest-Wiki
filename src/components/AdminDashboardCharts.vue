<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const number = key => Number(props.stats?.[key] || 0)
const formatNumber = value => Number(value || 0).toLocaleString('vi-VN')

const contentSeries = computed(() => [
  { key: 'characters', label: 'Nhân vật', value: number('characters'), tone: 'gold' },
  { key: 'events', label: 'Sự kiện', value: number('events'), tone: 'violet' },
  { key: 'releaseEntries', label: 'Mốc ra mắt', value: number('releaseEntries'), tone: 'blue' },
])

const communitySeries = computed(() => [
  { key: 'eventComments', label: 'Bình luận sự kiện', value: number('eventComments'), tone: 'green' },
  { key: 'forumTopics', label: 'Chủ đề diễn đàn', value: number('forumTopics'), tone: 'violet' },
  { key: 'forumPosts', label: 'Phản hồi diễn đàn', value: number('forumPosts'), tone: 'blue' },
])

const roleSeries = computed(() => [
  { key: 'users', label: 'Người dùng', value: number('users'), tone: 'blue' },
  { key: 'staff', label: 'Nhân viên', value: number('staff'), tone: 'green' },
  { key: 'admins', label: 'Quản trị viên', value: number('admins'), tone: 'gold' },
])

const totalAccounts = computed(() => roleSeries.value.reduce((sum, item) => sum + item.value, 0))
const totalContent = computed(() => contentSeries.value.reduce((sum, item) => sum + item.value, 0))
const totalCommunity = computed(() => communitySeries.value.reduce((sum, item) => sum + item.value, 0))
const pendingTopUps = computed(() => number('pendingTopUps'))

const widthFor = (series, value) => {
  const max = Math.max(...series.map(item => item.value), 1)
  return value > 0 ? Math.max(5, Math.round((value / max) * 100)) : 0
}

const radius = 42
const circumference = 2 * Math.PI * radius
const roleSegments = computed(() => {
  let offset = 0
  return roleSeries.value.map(item => {
    const length = totalAccounts.value ? (item.value / totalAccounts.value) * circumference : 0
    const segment = {
      ...item,
      dasharray: `${length} ${Math.max(0, circumference - length)}`,
      dashoffset: -offset,
    }
    offset += length
    return segment
  })
})
</script>

<template>
  <section class="dashboard-visuals">
    <header class="dashboard-visuals__header">
      <div>
        <span>Dữ liệu trực tiếp</span>
        <h2>Tình hình hiện tại</h2>
        <p>Các biểu đồ giúp so sánh nhanh quy mô dữ liệu và hoạt động cộng đồng.</p>
      </div>
      <p class="system-status"><i /> Hệ thống đang hoạt động</p>
    </header>

    <div class="summary-grid" aria-label="Chỉ số tổng quan">
      <article>
        <span>Tổng tài khoản</span>
        <strong>{{ loading ? '—' : formatNumber(totalAccounts) }}</strong>
        <small>User, Staff và Admin</small>
      </article>
      <article>
        <span>Nội dung đang quản lý</span>
        <strong>{{ loading ? '—' : formatNumber(totalContent) }}</strong>
        <small>Nhân vật, sự kiện và lịch ra mắt</small>
      </article>
      <article>
        <span>Tương tác cộng đồng</span>
        <strong>{{ loading ? '—' : formatNumber(totalCommunity) }}</strong>
        <small>Bình luận, chủ đề và phản hồi</small>
      </article>
      <article :class="{ 'summary-alert': pendingTopUps > 0 }">
        <span>Coupon cần xử lý</span>
        <strong>{{ loading ? '—' : formatNumber(pendingTopUps) }}</strong>
        <small>{{ pendingTopUps ? 'Đang chờ quản trị viên' : 'Không có đơn tồn đọng' }}</small>
      </article>
    </div>

    <div class="chart-grid">
      <article class="chart-panel">
        <header>
          <div><span>Dữ liệu Wiki</span><h3>Quy mô nội dung</h3></div>
          <small>So sánh trong nhóm</small>
        </header>
        <div
          class="bar-chart"
          role="img"
          :aria-label="`Biểu đồ nội dung: ${contentSeries.map(item => `${item.label} ${item.value}`).join(', ')}`"
        >
          <div v-for="item in contentSeries" :key="item.key" class="bar-row">
            <div class="bar-row__label"><span>{{ item.label }}</span><strong>{{ formatNumber(item.value) }}</strong></div>
            <div class="bar-track">
              <i :class="`bar-fill bar-fill--${item.tone}`" :style="{ width: `${widthFor(contentSeries, item.value)}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="chart-panel">
        <header>
          <div><span>Cộng đồng</span><h3>Mức độ hoạt động</h3></div>
          <small>So sánh trong nhóm</small>
        </header>
        <div
          class="bar-chart"
          role="img"
          :aria-label="`Biểu đồ cộng đồng: ${communitySeries.map(item => `${item.label} ${item.value}`).join(', ')}`"
        >
          <div v-for="item in communitySeries" :key="item.key" class="bar-row">
            <div class="bar-row__label"><span>{{ item.label }}</span><strong>{{ formatNumber(item.value) }}</strong></div>
            <div class="bar-track">
              <i :class="`bar-fill bar-fill--${item.tone}`" :style="{ width: `${widthFor(communitySeries, item.value)}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="chart-panel chart-panel--roles">
        <header>
          <div><span>Quyền truy cập</span><h3>Phân bố vai trò</h3></div>
          <small>{{ formatNumber(totalAccounts) }} tài khoản</small>
        </header>
        <div class="role-chart">
          <svg
            viewBox="0 0 112 112"
            role="img"
            :aria-label="`Biểu đồ vai trò: ${roleSeries.map(item => `${item.label} ${item.value}`).join(', ')}`"
          >
            <circle class="role-chart__track" cx="56" cy="56" :r="radius" />
            <circle
              v-for="item in roleSegments"
              :key="item.key"
              class="role-chart__segment"
              :class="`role-chart__segment--${item.tone}`"
              cx="56"
              cy="56"
              :r="radius"
              :stroke-dasharray="item.dasharray"
              :stroke-dashoffset="item.dashoffset"
            />
            <text x="56" y="52" text-anchor="middle">{{ formatNumber(totalAccounts) }}</text>
            <text class="role-chart__caption" x="56" y="67" text-anchor="middle">tài khoản</text>
          </svg>
          <dl class="role-legend">
            <div v-for="item in roleSeries" :key="item.key">
              <dt><i :class="`legend-dot legend-dot--${item.tone}`" />{{ item.label }}</dt>
              <dd>{{ formatNumber(item.value) }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-visuals {
  overflow: hidden;
  border: 1px solid rgba(120, 152, 181, .2);
  border-radius: 20px;
  background: rgba(8, 14, 23, .94);
}

.dashboard-visuals__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid rgba(120, 152, 181, .12);
  padding: 24px 26px;
}

.dashboard-visuals__header > div > span,
.chart-panel > header span {
  color: #ffc66b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.dashboard-visuals__header h2 {
  margin: 5px 0 0;
  color: #f4f8fc;
  font-size: 25px;
  font-weight: 920;
  letter-spacing: -.02em;
}

.dashboard-visuals__header > div > p {
  margin: 8px 0 0;
  color: #91a3b3;
  font-size: 14px;
  line-height: 1.5;
}

.system-status {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #91a3b3;
  font-size: 12px;
  font-weight: 750;
}

.system-status i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #55e0b5;
  box-shadow: 0 0 12px rgba(85, 224, 181, .7);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  background: rgba(120, 152, 181, .1);
}

.summary-grid article {
  min-height: 142px;
  background: #09111b;
  padding: 22px;
}

.summary-grid article > span {
  display: block;
  min-height: 34px;
  color: #9aabba;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
}

.summary-grid article > strong {
  display: block;
  margin-top: 8px;
  color: #f2f7fb;
  font-size: 34px;
  font-weight: 950;
  line-height: 1;
}

.summary-grid article > small {
  display: block;
  margin-top: 11px;
  color: #718598;
  font-size: 11px;
  line-height: 1.4;
}

.summary-grid .summary-alert { background: linear-gradient(145deg, rgba(255, 105, 124, .12), #09111b 68%); }
.summary-grid .summary-alert > strong { color: #ff8998; }

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  border-top: 1px solid rgba(120, 152, 181, .1);
  padding: 18px;
}

.chart-panel {
  min-width: 0;
  border: 1px solid rgba(120, 152, 181, .15);
  border-radius: 15px;
  background: rgba(4, 10, 17, .48);
  padding: 18px;
}

.chart-panel > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chart-panel > header h3 {
  margin: 5px 0 0;
  color: #eaf2f8;
  font-size: 18px;
  font-weight: 900;
}

.chart-panel > header > small {
  color: #6f8496;
  font-size: 11px;
  text-align: right;
}

.bar-chart { display: grid; gap: 20px; margin-top: 24px; }
.bar-row { display: grid; gap: 8px; }
.bar-row__label { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bar-row__label span { color: #a9b8c4; font-size: 13px; font-weight: 750; }
.bar-row__label strong { color: #eef5fa; font-size: 14px; font-weight: 900; }
.bar-track { height: 10px; overflow: hidden; border-radius: 999px; background: rgba(120, 152, 181, .12); }
.bar-fill { display: block; height: 100%; border-radius: inherit; background: #55d8ff; }
.bar-fill--gold { background: #ffb84d; }
.bar-fill--violet { background: #b281ff; }
.bar-fill--green { background: #55e0b5; }
.bar-fill--blue { background: #55d8ff; }

.role-chart { display: grid; grid-template-columns: minmax(138px, .8fr) minmax(130px, 1fr); align-items: center; gap: 16px; margin-top: 16px; }
.role-chart svg { width: 100%; max-width: 170px; margin: 0 auto; overflow: visible; }
.role-chart__track, .role-chart__segment { fill: none; stroke-width: 12; }
.role-chart__track { stroke: rgba(120, 152, 181, .12); }
.role-chart__segment { transform: rotate(-90deg); transform-origin: 50% 50%; stroke-linecap: butt; }
.role-chart__segment--blue { stroke: #55d8ff; }
.role-chart__segment--green { stroke: #55e0b5; }
.role-chart__segment--gold { stroke: #ffb84d; }
.role-chart text { fill: #f3f8fc; font-size: 17px; font-weight: 950; }
.role-chart .role-chart__caption { fill: #718598; font-size: 8px; font-weight: 700; }
.role-legend { display: grid; gap: 4px; margin: 0; }
.role-legend > div { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(120, 152, 181, .09); padding: 10px 0; }
.role-legend > div:last-child { border-bottom: 0; }
.role-legend dt { display: flex; align-items: center; gap: 8px; color: #a6b5c1; font-size: 12px; }
.role-legend dd { margin: 0; color: #eef5fa; font-size: 14px; font-weight: 900; }
.legend-dot { width: 9px; height: 9px; border-radius: 3px; background: #55d8ff; }
.legend-dot--green { background: #55e0b5; }
.legend-dot--gold { background: #ffb84d; }

@media (max-width: 1120px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chart-panel--roles { grid-column: span 2; }
  .role-chart { grid-template-columns: minmax(160px, .6fr) minmax(220px, 1fr); }
}

@media (max-width: 680px) {
  .dashboard-visuals__header { align-items: flex-start; flex-direction: column; padding: 20px; }
  .dashboard-visuals__header h2 { font-size: 22px; }
  .system-status { align-self: flex-start; }
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .summary-grid article { min-height: 132px; padding: 18px; }
  .summary-grid article > strong { font-size: 30px; }
  .chart-grid { grid-template-columns: 1fr; padding: 12px; }
  .chart-panel--roles { grid-column: auto; }
  .role-chart { grid-template-columns: minmax(120px, .8fr) minmax(120px, 1fr); }
}

@media (max-width: 420px) {
  .summary-grid { grid-template-columns: 1fr; }
  .summary-grid article { min-height: 0; }
  .role-chart { grid-template-columns: 1fr; }
  .role-chart svg { max-width: 155px; }
}
</style>
