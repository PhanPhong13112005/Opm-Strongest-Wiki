<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const copy = computed(() => locale.value === 'en'
  ? {
      eyebrow: 'SERVICE STATUS',
      title: 'Top-up is under maintenance',
      description: 'We are reviewing our provider and payment process to make transactions safer and more reliable.',
      notice: 'Please do not create an order or make a transfer for the top-up service. The page will reopen when the system is ready.',
      backHome: 'Back to home',
      viewCharacters: 'Browse characters',
    }
  : {
      eyebrow: 'TRẠNG THÁI DỊCH VỤ',
      title: 'Nạp thẻ đang bảo trì',
      description: 'Chúng tôi đang kiểm tra lại nhà cung cấp và quy trình thanh toán để bảo đảm giao dịch an toàn, chính xác hơn.',
      notice: 'Tạm thời không tạo đơn hoặc chuyển khoản cho dịch vụ nạp thẻ. Chúng tôi sẽ mở lại trang khi hệ thống sẵn sàng.',
      backHome: 'Về trang chủ',
      viewCharacters: 'Xem thư viện nhân vật',
    })
</script>

<template>
  <main class="maintenance-page">
    <section class="maintenance-card" aria-labelledby="topup-maintenance-title">
      <div class="maintenance-visual" aria-hidden="true">
        <span class="maintenance-visual__orbit"></span>
        <span class="maintenance-visual__tool">⚙</span>
      </div>

      <div class="maintenance-copy" role="status" aria-live="polite">
        <p class="maintenance-eyebrow">{{ copy.eyebrow }}</p>
        <h1 id="topup-maintenance-title">{{ copy.title }}</h1>
        <p class="maintenance-description">{{ copy.description }}</p>

        <div class="maintenance-notice">
          <span aria-hidden="true">!</span>
          <p>{{ copy.notice }}</p>
        </div>

        <div class="maintenance-actions">
          <RouterLink class="maintenance-action maintenance-action--primary" to="/">
            {{ copy.backHome }}
          </RouterLink>
          <RouterLink class="maintenance-action" to="/characters">
            {{ copy.viewCharacters }}
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.maintenance-page {
  display: grid;
  min-height: calc(100vh - 96px);
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 18%, rgba(83, 217, 255, .09), transparent 34%),
    radial-gradient(circle at 86% 80%, rgba(255, 179, 71, .08), transparent 32%),
    #050a11;
  padding: clamp(24px, 6vw, 72px) 18px;
  font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.maintenance-card {
  position: relative;
  display: grid;
  width: min(100%, 920px);
  grid-template-columns: minmax(220px, .72fr) minmax(0, 1.28fr);
  align-items: center;
  gap: clamp(28px, 6vw, 72px);
  overflow: hidden;
  border: 1px solid rgba(110, 163, 198, .2);
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(11, 25, 38, .98), rgba(7, 13, 22, .98));
  box-shadow: 0 28px 80px rgba(0, 0, 0, .34);
  padding: clamp(30px, 6vw, 68px);
}

.maintenance-card::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(89, 205, 238, .035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(89, 205, 238, .035) 1px, transparent 1px);
  background-size: 42px 42px;
  content: "";
  pointer-events: none;
}

.maintenance-visual,
.maintenance-copy {
  position: relative;
  z-index: 1;
}

.maintenance-visual {
  display: grid;
  width: min(100%, 220px);
  aspect-ratio: 1;
  place-items: center;
  justify-self: center;
  border: 1px solid rgba(83, 217, 255, .22);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(83, 217, 255, .12), rgba(83, 217, 255, .025) 62%, transparent 63%);
}

.maintenance-visual__orbit {
  position: absolute;
  inset: 16px;
  border: 2px dashed rgba(83, 217, 255, .34);
  border-radius: 50%;
  animation: maintenance-orbit 18s linear infinite;
}

.maintenance-visual__orbit::after {
  position: absolute;
  top: -7px;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #53d9ff;
  box-shadow: 0 0 20px rgba(83, 217, 255, .9);
  content: "";
  transform: translateX(-50%);
}

.maintenance-visual__tool {
  color: #f4f9fc;
  font-size: clamp(64px, 10vw, 96px);
  line-height: 1;
  filter: drop-shadow(0 0 22px rgba(83, 217, 255, .28));
}

.maintenance-eyebrow {
  margin: 0 0 12px;
  color: #53d9ff;
  font: 900 11px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.maintenance-copy h1 {
  max-width: 580px;
  margin: 0;
  color: #f4f8fb;
  font-size: clamp(34px, 5.4vw, 58px);
  font-weight: 950;
  letter-spacing: -.045em;
  line-height: 1.02;
}

.maintenance-description {
  max-width: 590px;
  margin: 20px 0 0;
  color: #9db0bf;
  font-size: clamp(15px, 2vw, 17px);
  line-height: 1.75;
}

.maintenance-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  border: 1px solid rgba(255, 179, 71, .24);
  border-radius: 13px;
  background: rgba(255, 179, 71, .07);
  padding: 14px 15px;
}

.maintenance-notice span {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border-radius: 7px;
  background: #ffb347;
  color: #171006;
  font-weight: 950;
}

.maintenance-notice p {
  margin: 1px 0 0;
  color: #e6c58e;
  font-size: 13px;
  line-height: 1.6;
}

.maintenance-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.maintenance-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(113, 159, 190, .27);
  border-radius: 11px;
  padding: 11px 18px;
  color: #b8c8d4;
  font-size: 13px;
  font-weight: 850;
  text-decoration: none;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease;
}

.maintenance-action:hover {
  border-color: rgba(83, 217, 255, .5);
  color: #eefaff;
  transform: translateY(-1px);
}

.maintenance-action--primary {
  border-color: #53d9ff;
  background: #53d9ff;
  color: #041018;
}

.maintenance-action--primary:hover {
  background: #7be3ff;
  color: #041018;
}

@keyframes maintenance-orbit {
  to { transform: rotate(360deg); }
}

@media (max-width: 720px) {
  .maintenance-page {
    min-height: calc(100vh - 72px);
    align-items: start;
    padding: 20px 12px 36px;
  }

  .maintenance-card {
    grid-template-columns: 1fr;
    gap: 24px;
    border-radius: 18px;
    padding: 28px 20px;
  }

  .maintenance-visual {
    width: 142px;
  }

  .maintenance-copy {
    text-align: center;
  }

  .maintenance-description {
    margin-top: 16px;
  }

  .maintenance-notice {
    text-align: left;
  }

  .maintenance-actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .maintenance-visual__orbit {
    animation: none;
  }

  .maintenance-action {
    transition: none;
  }
}
</style>
