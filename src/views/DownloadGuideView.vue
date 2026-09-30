<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { opmWikiApkRelease } from '../data/opmWikiApkRelease'

// Visual evidence imports
import evidenceVn from '@/assets/images/download/evidence-vn.png'
import evidenceSea from '@/assets/images/download/evidence-sea.png'
import evidenceCn from '@/assets/images/download/evidence-cn.png'

const lastUpdated = '25/09/2026'
const activeTab = ref('vn')

const tabs = [
  { id: 'vn', flag: '🇻🇳', label: 'Việt Nam' },
  { id: 'sea', flag: '🌏', label: 'SEA' },
  { id: 'cn', flag: '🇨🇳', label: 'Trung Quốc' },
  { id: 'compare', flag: '⚖️', label: 'VN vs SEA' },
  { id: 'apk', flag: '📱', label: 'OpmWiki App' },
]

const apkReady = computed(() => opmWikiApkRelease.status === 'ready' && Boolean(opmWikiApkRelease.url))
const apkValue = value => value || 'Chưa công bố'

let previousTitle = ''
let descriptionElement = null
let previousDescription = null

onMounted(() => {
  previousTitle = document.title
  document.title = 'Hướng dẫn tải One Punch Man: The Strongest | OpmWiki'
  descriptionElement = document.querySelector('meta[name="description"]')
  if (descriptionElement) {
    previousDescription = descriptionElement.getAttribute('content')
    descriptionElement.setAttribute('content', 'Chọn và tải đúng bản One Punch Man: The Strongest cho Việt Nam, SEA hoặc Trung Quốc từ nguồn chính thức.')
  }
})

onBeforeUnmount(() => {
  document.title = previousTitle
  if (descriptionElement && previousDescription !== null) {
    descriptionElement.setAttribute('content', previousDescription)
  }
})

function handleTabKeydown(e, index) {
  let newIndex = index
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    newIndex = (index + 1) % tabs.length
    e.preventDefault()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    newIndex = (index - 1 + tabs.length) % tabs.length
    e.preventDefault()
  }

  if (newIndex !== index) {
    activeTab.value = tabs[newIndex].id
    const nextTab = document.getElementById(`tab-${tabs[newIndex].id}`)
    if (nextTab) nextTab.focus()
  }
}
</script>

<template>
  <main class="download-guide">
    <div class="tabs-nav" role="tablist" aria-label="Phiên bản trò chơi">
      <button
        v-for="(tab, index) in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeTab === tab.id ? 0 : -1"
        :class="['tab-button', { 'is-active': activeTab === tab.id }]"
        @click="activeTab = tab.id"
        @keydown="handleTabKeydown($event, index)"
      >
        <span class="tab-flag" aria-hidden="true">{{ tab.flag }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <div class="panels-container">
      <!-- VN TAB -->
      <article
        v-show="activeTab === 'vn'"
        id="panel-vn"
        class="tab-panel"
        role="tabpanel"
        aria-labelledby="tab-vn"
        tabindex="0"
      >
        <div class="decision-card">
          <h2>Bạn đang ở Việt Nam? Chọn bản này.</h2>
          <ul>
            <li>Dành cho người chơi tại Việt Nam.</li>
            <li>Dễ tiếp cận nhất cho người dùng Việt.</li>
            <li>Có bản phát hành riêng cho thị trường Việt Nam.</li>
          </ul>
        </div>

        <div class="download-section">
          <h3>ANDROID</h3>
          <a class="primary-cta" href="https://play.google.com/store/apps/details?id=com.onepunchman.ggplay.sea.cbt" target="_blank" rel="noopener noreferrer">Google Play Việt Nam</a>
        </div>
        <div class="download-section">
          <h3>IOS</h3>
          <a class="primary-cta" href="https://apps.apple.com/vn/app/one-punch-man-k%E1%BA%BB-m%E1%BA%A1nh-nh%E1%BA%A5t/id6749569333" target="_blank" rel="noopener noreferrer">App Store Việt Nam</a>
        </div>

        <div class="verification-info">
          <h4>Thông tin nhà phát hành</h4>
          <p><strong>SOLAPLAY.VIETNAM</strong></p>
          <details>
            <summary>Xem ảnh xác minh phiên bản</summary>
            <img :src="evidenceVn" alt="Ảnh minh chứng listing VN" class="evidence-img" loading="lazy" />
          </details>
          <a class="secondary-link" href="https://onepunchman-anime.net/news/archives/7317" target="_blank" rel="noopener noreferrer">Thông báo tái phát hành chính thức ↗</a>
        </div>
      </article>

      <!-- SEA TAB -->
      <article
        v-show="activeTab === 'sea'"
        id="panel-sea"
        class="tab-panel"
        role="tabpanel"
        aria-labelledby="tab-sea"
        tabindex="0"
      >
        <div class="decision-card">
          <h2>Chọn SEA nếu bạn muốn chơi bản Đông Nam Á / quốc tế.</h2>
          <p>Dành cho người dùng đặc biệt tìm kiếm bản SEA (FingerFun).</p>
        </div>

        <div class="download-section">
          <h3>ANDROID</h3>
          <a class="primary-cta" href="https://www.taptap.io/vn/app/192982" target="_blank" rel="noopener noreferrer">Tải bản SEA qua TapTap</a>
          <a class="secondary-cta" href="https://play.google.com/store/apps/details?id=com.onepunchman.ggplay.sea" target="_blank" rel="noopener noreferrer">Google Play SEA</a>
        </div>
        <div class="download-section">
          <h3>IOS</h3>
          <a class="primary-cta" href="https://apps.apple.com/sg/app/one-punch-man-the-strongest/id1491275510" target="_blank" rel="noopener noreferrer">Mở App Store Singapore</a>
          <details class="apple-help">
            <summary>Không thấy game trên App Store?</summary>
            <div class="apple-help-content">
              <p>Hướng dẫn đổi vùng sang Singapore (Dựa trên Apple):</p>
              <ol>
                <li>Vào <strong>Cài đặt (Settings)</strong> → Tên bạn / Apple Account.</li>
                <li><strong>Phương tiện & Mục mua</strong> → <strong>Xem tài khoản</strong>.</li>
                <li><strong>Quốc gia/Vùng</strong> → <strong>Thay đổi quốc gia hoặc vùng</strong>.</li>
                <li>Chọn <strong>Singapore</strong> và làm theo hướng dẫn của Apple.</li>
              </ol>
              <p><em>Lưu ý: Bạn có thể cần dùng hết số dư tài khoản, chờ gói đăng ký hết hạn, hoặc có phương thức thanh toán hợp lệ.</em></p>
              <a href="https://support.apple.com/vi-vn/118283" target="_blank" rel="noopener noreferrer">Xem hướng dẫn của Apple ↗</a>
            </div>
          </details>
        </div>

        <div class="verification-info">
          <h4>Thông tin nhà phát hành</h4>
          <p><strong>FingerFun Limited</strong></p>
          <details>
            <summary>Xem ảnh xác minh phiên bản</summary>
            <img :src="evidenceSea" alt="Ảnh minh chứng listing SEA" class="evidence-img" loading="lazy" />
          </details>
          <a class="secondary-link" href="https://onepunchman.fingerfun.com" target="_blank" rel="noopener noreferrer">Website FingerFun ↗</a>
        </div>
      </article>

      <!-- CN TAB -->
      <article
        v-show="activeTab === 'cn'"
        id="panel-cn"
        class="tab-panel cn-tab"
        role="tabpanel"
        aria-labelledby="tab-cn"
        tabindex="0"
      >
        <div class="decision-card warning-card">
          <h2>Chỉ chọn bản này nếu bạn muốn chơi phiên bản Trung Quốc.</h2>
          <ul>
            <li>Sử dụng tiếng Trung.</li>
            <li>Hệ sinh thái và máy chủ hoàn toàn riêng biệt.</li>
          </ul>
        </div>

        <div class="download-section">
          <h3>ANDROID</h3>
          <a class="primary-cta" href="https://www.taptap.cn/app/136604" target="_blank" rel="noopener noreferrer">TapTap chính thức (TapTap CN)</a>
        </div>
        <div class="download-section">
          <h3>IOS</h3>
          <a class="primary-cta" href="https://apps.apple.com/cn/app/%E4%B8%80%E6%8B%B3%E8%B6%85%E4%BA%BA-%E6%9C%80%E5%BC%BA%E4%B9%8B%E7%94%B7/id1449688300" target="_blank" rel="noopener noreferrer">App Store China</a>
        </div>

        <div class="verification-info">
          <h4>Thông tin nhà phát hành</h4>
          <p class="cn-text"><strong>Beijing TIANMASHIKONG Network Technology Co., Ltd (天马时空)</strong></p>
          <details>
            <summary>Xem ảnh xác minh phiên bản</summary>
            <img :src="evidenceCn" alt="Ảnh minh chứng listing CN" class="evidence-img" loading="lazy" />
          </details>
        </div>
      </article>

      <!-- VN VS SEA COMPARE TAB -->
      <article
        v-show="activeTab === 'compare'"
        id="panel-compare"
        class="tab-panel"
        role="tabpanel"
        aria-labelledby="tab-compare"
        tabindex="0"
      >
        <div class="comparison-cards">
          <div class="compare-card">
            <h3>CHỌN VIỆT NAM NẾU:</h3>
            <ul>
              <li>Bạn chủ yếu chơi tại Việt Nam.</li>
              <li>Ưu tiên trải nghiệm thuận tiện cho người dùng Việt.</li>
              <li>Muốn dùng store Việt Nam.</li>
            </ul>
          </div>
          <div class="compare-card">
            <h3>CHỌN SEA NẾU:</h3>
            <ul>
              <li>Bạn chủ động muốn bản Đông Nam Á.</li>
              <li>Muốn hệ SEA / bản FingerFun.</li>
              <li>Chấp nhận việc iOS có thể cần App Store Singapore.</li>
            </ul>
          </div>
        </div>

        <div class="comparison-details">
          <div class="compare-row">
            <h4>Phiên bản</h4>
            <div class="compare-item"><strong>🇻🇳 VN:</strong> Bản dành cho Việt Nam</div>
            <div class="compare-item"><strong>🌏 SEA:</strong> Bản quốc tế / Đông Nam Á</div>
          </div>
          <div class="compare-row">
            <h4>Nhà phát hành (Publisher)</h4>
            <div class="compare-item"><strong>🇻🇳 VN:</strong> SOLAPLAY.VIETNAM</div>
            <div class="compare-item"><strong>🌏 SEA:</strong> FingerFun Limited</div>
          </div>
          <div class="compare-row">
            <h4>Ngôn ngữ</h4>
            <div class="compare-item"><strong>🇻🇳 VN:</strong> Tiếng Việt (chủ yếu)</div>
            <div class="compare-item"><strong>🌏 SEA:</strong> EN, ID, Trung, Thái...</div>
          </div>
          <div class="compare-row">
            <h4>Android Store</h4>
            <div class="compare-item"><strong>🇻🇳 VN:</strong> Google Play VN</div>
            <div class="compare-item"><strong>🌏 SEA:</strong> TapTap SEA / Google Play</div>
          </div>
          <div class="compare-row">
            <h4>iOS Store</h4>
            <div class="compare-item"><strong>🇻🇳 VN:</strong> App Store Việt Nam</div>
            <div class="compare-item"><strong>🌏 SEA:</strong> App Store Singapore</div>
          </div>
        </div>
      </article>

      <!-- OPMWIKI APP TAB -->
      <article
        v-show="activeTab === 'apk'"
        id="panel-apk"
        class="tab-panel"
        role="tabpanel"
        aria-labelledby="tab-apk"
        tabindex="0"
      >
        <div class="decision-card info-card">
          <h2>{{ apkReady ? 'OpmWiki cho Android' : 'OpmWiki App - Chưa phát hành' }}</h2>
          <p v-if="apkReady">Bản APK OpmWiki chính thức đã sẵn sàng cho Android. Đây <strong>không phải game One Punch Man chính thức</strong>.</p>
          <p v-else>Bản APK OpmWiki đang được chuẩn bị. Nút tải sẽ được mở khi bản phát hành chính thức sẵn sàng. Đây <strong>không phải game One Punch Man chính thức</strong>.</p>
        </div>

        <div class="download-section">
          <a v-if="apkReady" class="primary-cta" :href="opmWikiApkRelease.url" target="_blank" rel="noopener noreferrer">Tải OpmWiki cho Android</a>
          <button v-else class="primary-cta is-disabled" type="button" disabled>APK chưa sẵn sàng</button>

          <div class="apk-meta">
            <p><strong>Phiên bản:</strong> {{ apkValue(opmWikiApkRelease.version) }}</p>
            <p><strong>Build:</strong> {{ apkValue(opmWikiApkRelease.build) }}</p>
            <p><strong>Yêu cầu:</strong> {{ apkValue(opmWikiApkRelease.minAndroid) }}</p>
            <p><strong>Kích thước file:</strong> {{ apkValue(opmWikiApkRelease.size) }}</p>
            <p class="apk-hash"><strong>SHA-256:</strong> <code>{{ apkValue(opmWikiApkRelease.sha256) }}</code></p>
          </div>

          <p class="installation-note">Android có thể yêu cầu cho phép cài ứng dụng từ trình duyệt hoặc trình quản lý tệp bạn dùng để mở APK. Chỉ cấp quyền cho ứng dụng bạn đang sử dụng và đọc kỹ cảnh báo hệ thống trước khi tiếp tục.</p>
        </div>
      </article>
    </div>
  </main>
</template>

<style scoped>
.download-guide {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  color: #dce7f5;
  background-color: #07101b;
  min-height: 100vh;
}

.cn-text {
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

.tabs-nav {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  background: #0a1726;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #1a2c42;
}
.tabs-nav::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.tab-button {
  flex: 0 0 auto;
  min-height: 48px;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #8ca2b5;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}

.tab-button:hover {
  color: #dce7f5;
}

.tab-button.is-active {
  color: #5bdeff;
  border-bottom-color: #5bdeff;
}

.panels-container {
  padding: 1.5rem 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.decision-card {
  background: #112236;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #5bdeff;
}
.decision-card.warning-card {
  border-left-color: #ff6a57;
  background: #2a1617;
}
.decision-card.info-card {
  border-left-color: #ffc969;
}

.decision-card h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: #fff;
  line-height: 1.4;
}

.decision-card p, .decision-card ul {
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
  color: #b0c4d9;
}
.decision-card ul {
  padding-left: 1.25rem;
}
.decision-card li {
  margin-bottom: 0.25rem;
}

.download-section {
  margin-bottom: 1.5rem;
}

.download-section h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: #8ca2b5;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
}

.primary-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  background: #238636;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  border-radius: 6px;
  text-decoration: none;
  margin-bottom: 0.75rem;
  transition: background 0.2s;
  border: none;
}
.primary-cta:hover {
  background: #2ea043;
}
.primary-cta.is-disabled {
  background: #21262d;
  color: #8b949e;
  cursor: not-allowed;
  border: 1px solid #30363d;
}

.secondary-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  background: #1f2937;
  color: #d1d5db;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  border: 1px solid #374151;
  margin-bottom: 0.5rem;
}

.apple-help {
  background: #1e293b;
  border-radius: 6px;
  margin-top: 0.5rem;
}
.apple-help summary {
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
}
.apple-help-content {
  padding: 0 1rem 1rem 1rem;
  font-size: 0.9rem;
  color: #cbd5e1;
  line-height: 1.5;
}
.apple-help-content ol {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}
.apple-help-content a {
  color: #5bdeff;
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  margin-top: 0.5rem;
}

.verification-info {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #1a2c42;
}
.verification-info h4 {
  font-size: 0.9rem;
  color: #8ca2b5;
  margin: 0 0 0.25rem 0;
}
.verification-info p {
  font-size: 1.05rem;
  color: #e2e8f0;
  margin: 0 0 1rem 0;
}
.verification-info details {
  margin-bottom: 1rem;
}
.verification-info summary {
  color: #5bdeff;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}
.evidence-img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  margin-top: 0.75rem;
  border: 1px solid #334155;
}

.secondary-link {
  color: #5bdeff;
  text-decoration: none;
  font-size: 0.95rem;
  display: inline-block;
}

/* Compare Tab */
.comparison-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.compare-card {
  background: #112236;
  border-radius: 8px;
  padding: 1.25rem;
}
.compare-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #5bdeff;
}
.compare-card ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #b0c4d9;
  font-size: 0.95rem;
  line-height: 1.5;
}

.comparison-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.compare-row {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 1rem;
}
.compare-row h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #94a3b8;
  text-transform: uppercase;
}
.compare-item {
  font-size: 1rem;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
}
.compare-item strong {
  color: #cbd5e1;
  display: inline-block;
  width: 60px;
}

/* APK Tab */
.apk-meta {
  margin-top: 1.5rem;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 1rem;
}
.apk-meta p {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #cbd5e1;
}
.apk-meta p:last-child {
  margin: 0;
}
.apk-meta strong {
  color: #94a3b8;
}
.apk-hash code {
  color: #dce7f5;
  overflow-wrap: anywhere;
}
.installation-note {
  margin: 1rem 0 0;
  max-width: 720px;
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (min-width: 640px) {
  .comparison-cards {
    flex-direction: row;
  }
  .compare-card {
    flex: 1;
  }
  .primary-cta, .secondary-cta {
    width: auto;
    display: inline-flex;
    padding: 0 2rem;
  }
}
</style>
