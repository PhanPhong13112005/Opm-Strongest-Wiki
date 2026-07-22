<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const copy = computed(() => locale.value === 'vi'
  ? {
      eyebrow: 'Hồ sơ dự án',
      title: 'Minh bạch & thay đổi',
      history: 'Lịch sử phiên bản',
      historyHint: 'Các mốc phát triển',
      privacy: 'Bảo mật & bản quyền',
      privacyHint: 'Dữ liệu và quyền sở hữu'
    }
  : {
      eyebrow: 'Project dossier',
      title: 'Transparency & changes',
      history: 'Version history',
      historyHint: 'Development milestones',
      privacy: 'Privacy & copyright',
      privacyHint: 'Data and ownership'
    })
</script>

<template>
  <nav class="dossier-nav" :aria-label="copy.title">
    <div class="dossier-nav__identity">
      <span class="dossier-nav__signal" aria-hidden="true"></span>
      <div>
        <span>{{ copy.eyebrow }}</span>
        <strong>{{ copy.title }}</strong>
      </div>
    </div>

    <div class="dossier-nav__tabs">
      <RouterLink to="/history" class="dossier-nav__tab">
        <span class="dossier-nav__index">01</span>
        <span>
          <strong>{{ copy.history }}</strong>
          <small>{{ copy.historyHint }}</small>
        </span>
      </RouterLink>
      <RouterLink to="/privacy" class="dossier-nav__tab">
        <span class="dossier-nav__index">02</span>
        <span>
          <strong>{{ copy.privacy }}</strong>
          <small>{{ copy.privacyHint }}</small>
        </span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.dossier-nav {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid rgba(107, 151, 190, .18);
  background: rgba(5, 13, 23, .84);
  padding: .55rem;
  box-shadow: 0 22px 70px rgba(0, 0, 0, .22);
  backdrop-filter: blur(16px);
}

.dossier-nav__identity {
  display: flex;
  min-width: 230px;
  align-items: center;
  gap: .8rem;
  padding: .7rem 1rem;
}

.dossier-nav__signal {
  width: 3px;
  height: 34px;
  background: #5bdeff;
  box-shadow: 0 0 18px rgba(91, 222, 255, .7);
}

.dossier-nav__identity span:not(.dossier-nav__signal) {
  display: block;
  color: #617a94;
  font: 800 .58rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .19em;
  text-transform: uppercase;
}

.dossier-nav__identity strong {
  display: block;
  margin-top: .35rem;
  color: #eaf7ff;
  font-size: .86rem;
  letter-spacing: .055em;
}

.dossier-nav__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .45rem;
  width: min(100%, 600px);
}

.dossier-nav__tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: .75rem;
  min-height: 62px;
  border: 1px solid rgba(111, 146, 179, .14);
  background: rgba(10, 22, 36, .65);
  padding: .7rem .85rem;
  color: #8298ae;
  transition: border-color .2s ease, background .2s ease, transform .2s ease;
}

.dossier-nav__tab::after {
  content: '';
  position: absolute;
  right: .8rem;
  bottom: 0;
  left: .8rem;
  height: 2px;
  transform: scaleX(0);
  background: #5bdeff;
  box-shadow: 0 0 14px rgba(91, 222, 255, .75);
  transition: transform .2s ease;
}

.dossier-nav__tab:hover {
  border-color: rgba(91, 222, 255, .32);
  background: rgba(91, 222, 255, .065);
  transform: translateY(-1px);
}

.dossier-nav__tab.router-link-active {
  border-color: rgba(91, 222, 255, .38);
  background: linear-gradient(135deg, rgba(91, 222, 255, .13), rgba(91, 222, 255, .025));
  color: #f0fbff;
}

.dossier-nav__tab.router-link-active::after { transform: scaleX(1); }

.dossier-nav__index {
  display: grid;
  height: 30px;
  min-width: 30px;
  place-items: center;
  border: 1px solid rgba(91, 222, 255, .25);
  color: #5bdeff;
  font: 800 .65rem ui-monospace, SFMono-Regular, Menlo, monospace;
}

.dossier-nav__tab strong {
  display: block;
  font-size: .78rem;
  letter-spacing: .035em;
}

.dossier-nav__tab small {
  display: block;
  margin-top: .25rem;
  color: #5f748a;
  font-size: .65rem;
}

@media (max-width: 760px) {
  .dossier-nav { display: block; }
  .dossier-nav__identity { min-width: 0; padding: .6rem .7rem .9rem; }
  .dossier-nav__tabs { width: 100%; }
}

@media (max-width: 470px) {
  .dossier-nav__tab { gap: .55rem; min-height: 58px; padding: .6rem; }
  .dossier-nav__tab small { display: none; }
}
</style>
