<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  servers: { type: Array, default: () => [] },
  displayDate: { type: String, required: true },
  currentMonth: { type: String, required: true },
  hasPrevious: Boolean,
  hasNext: Boolean,
  transitionName: { type: String, default: 'fade' },
  getCharacterImage: { type: Function, required: true },
  getCharacter: { type: Function, required: true },
})
const emit = defineEmits(['previous', 'next'])
const { t } = useI18n()
const recordCount = computed(() => props.servers.reduce((total, server) => total + server.items.length, 0))
const featuredItem = computed(() => props.servers[0]?.items[0] || null)
const featuredCharacter = computed(() => featuredItem.value ? props.getCharacter(featuredItem.value.id) : {})
const featuredName = computed(() => featuredItem.value?.overrideName || featuredCharacter.value.name || t('home.title'))
const featuredRole = computed(() => featuredItem.value?.overrideRole || featuredCharacter.value.roles?.[0] || featuredCharacter.value.type || '')
const featuredImage = computed(() => featuredItem.value ? props.getCharacterImage(featuredItem.value.bannerImage || featuredCharacter.value.imageURL) : '')
const isReturning = item => item.isReturn || item.tag === t('home.return')
const getTypeAccent = (item) => {
  const character = item ? props.getCharacter(item.id) : {}
  const type = String(item?.overrideType || character.type || '').toLocaleLowerCase('vi')

  if (type.includes('vũ trang') || type.includes('duelist')) return '#ffb300'
  if (type.includes('giác đấu') || type.includes('grappler')) return '#ff3b3b'
  if (type.includes('tâm linh') || type.includes('esper') || type.includes('psychic')) return '#b861ff'
  if (type.includes('công nghệ') || type.includes('hi-tech') || type.includes('hi tech')) return '#00a8ff'
  return '#ffb300'
}
const getTierAccent = (item) => {
  const character = item ? props.getCharacter(item.id) : {}
  const tier = String(item?.overrideTier || character.tier || '').toUpperCase()

  if (tier === 'UR+') return '#ff3366'
  return '#ffffff'
}
const getFactionAccent = (item) => {
  const character = item ? props.getCharacter(item.id) : {}
  const faction = String(item?.overrideFaction || character.faction || '').toLocaleLowerCase('vi')

  if (faction.includes('anh hùng') || faction.includes('hero')) return '#ffc107'
  if (faction.includes('quái nhân') || faction.includes('quái vật') || faction.includes('monster')) return '#ff3b3b'
  if (faction.includes('võ thuật') || faction.includes('martial')) return '#10b981'
  if (faction.includes('tội phạm') || faction.includes('outlaw')) return '#818cf8'
  return '#94a3b8'
}
</script>

<template>
  <main class="home-stage">
    <div class="ambient ambient-one" /><div class="ambient ambient-two" />

    <section class="release-hero" :style="{ '--hero-accent': getTypeAccent(featuredItem) }">
      <div class="release-hero__content">
        <span class="hero-pill"><i />{{ t('home.eyebrow') }}</span>
        <h1>{{ featuredName }}</h1>
        <p>{{ featuredRole }}</p>
        <div class="hero-stats">
          <div><strong>{{ displayDate }}</strong><span>{{ t('home.overview') }}</span></div>
          <div><strong>{{ recordCount }}</strong><span>{{ t('home.records') }}</span></div>
          <div><strong>{{ servers.length }}</strong><span>Máy chủ</span></div>
        </div>
      </div>
      <component
        :is="featuredItem?.id === 'unknown' ? 'div' : RouterLink"
        v-if="featuredItem"
        :to="featuredItem.id === 'unknown' ? undefined : `/character/${featuredItem.id}`"
        class="release-hero__visual"
        :aria-label="featuredItem.id === 'unknown' ? undefined : `${t('home.viewDetails')}: ${featuredName}`"
      >
        <div class="energy-ring ring-one" /><div class="energy-ring ring-two" />
        <span class="visual-code">FEATURED // {{ featuredItem.id }}</span>
        <img :src="featuredImage" :alt="featuredName" onerror="this.style.display='none'" />
        <span v-if="featuredItem.id !== 'unknown'" class="visual-action">{{ t('home.viewDetails') }} →</span>
        <div class="visual-glow" />
      </component>
      <div class="hero-scan" />
    </section>

    <section class="month-switcher" aria-label="Điều hướng tháng">
      <button :disabled="!hasPrevious" @click="emit('previous')"><span>←</span>{{ t('home.previousMonth') }}</button>
      <div><small>LỊCH RA MẮT</small><strong>{{ displayDate }}</strong></div>
      <button :disabled="!hasNext" @click="emit('next')">{{ t('home.nextMonth') }}<span>→</span></button>
    </section>

    <transition :name="transitionName" mode="out-in">
      <div :key="currentMonth" class="release-content">
        <div v-if="servers.length === 0" class="release-empty">
          <div>!</div><h2>{{ t('home.noBannerData', { date: displayDate }) }}</h2><p>{{ t('home.comeBackLater') }}</p>
        </div>

        <section v-for="serverGroup in servers" v-else :key="serverGroup.server" class="server-section" :data-server="serverGroup.server">
          <header class="server-heading">
            <span>{{ serverGroup.server }}</span>
            <div><small>SERVER TIMELINE</small><h2>{{ serverGroup.serverName }}</h2></div>
            <b>{{ serverGroup.items.length }} nhân vật</b>
          </header>

          <div class="release-grid">
            <component
              :is="item.id === 'unknown' ? 'article' : RouterLink"
              v-for="(item, index) in serverGroup.items"
              :key="`${item.id}-${index}`"
              :to="item.id === 'unknown' ? undefined : `/character/${item.id}`"
              class="release-card"
              :class="{ 'is-return': isReturning(item) }"
              :style="{ '--delay': `${index * 90}ms`, '--accent': getTypeAccent(item), '--tier-accent': getTierAccent(item), '--faction-accent': getFactionAccent(item) }"
            >
              <div class="card-light" />
              <div class="release-card__copy">
                <div class="card-meta"><span>{{ item.tag }}</span><b>{{ item.period }} · {{ item.date }}</b></div>
                <div class="card-title"><i>{{ item.overrideTier || getCharacter(item.id).tier }}</i><h3>{{ item.overrideName || getCharacter(item.id).name }}</h3></div>
                <p>{{ item.overrideRole || getCharacter(item.id).roles?.[0] || getCharacter(item.id).type }}</p>
                <div class="card-tags"><span>{{ item.overrideFaction || getCharacter(item.id).faction }}</span><span>{{ item.overrideType || getCharacter(item.id).type }}</span></div>
                <div v-if="item.id !== 'unknown'" class="card-link">{{ t('home.viewDetails') }} <b>→</b></div>
              </div>
              <div class="release-card__image">
                <img :src="getCharacterImage(item.bannerImage || getCharacter(item.id).imageURL)" :alt="item.overrideName || getCharacter(item.id).name" onerror="this.style.display='none'" />
              </div>
              <div class="card-shine" />
            </component>
          </div>
        </section>
      </div>
    </transition>
  </main>
</template>

<style scoped>
.home-stage{position:relative;width:100%;max-width:1440px;margin:0 auto;overflow:hidden;padding:34px 24px 100px}.ambient{position:absolute;z-index:-1;border-radius:50%;filter:blur(90px);pointer-events:none}.ambient-one{left:-140px;top:180px;height:420px;width:420px;background:rgba(52,205,255,.12);animation:ambientDrift 9s ease-in-out infinite alternate}.ambient-two{right:-120px;top:560px;height:360px;width:360px;background:rgba(255,85,113,.1);animation:ambientDrift 11s ease-in-out 1s infinite alternate-reverse}.release-hero{position:relative;display:grid;min-height:430px;grid-template-columns:minmax(0,1fr) minmax(320px,44%);overflow:hidden;border:1px solid rgba(117,159,195,.18);border-radius:26px;background:linear-gradient(120deg,#0b1b2c 0%,#091421 58%,#15101a 100%);box-shadow:0 32px 80px rgba(0,0,0,.34)}.release-hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(113,163,201,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(113,163,201,.055) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(90deg,black,transparent 82%)}.release-hero__content{position:relative;z-index:3;display:flex;flex-direction:column;justify-content:center;padding:55px 20px 48px 58px}.hero-pill{display:flex;width:max-content;align-items:center;gap:9px;border:1px solid rgba(96,221,255,.2);border-radius:999px;background:rgba(96,221,255,.06);padding:7px 12px;color:#78e5ff;font-size:10px;font-weight:900;letter-spacing:.13em}.hero-pill i{height:7px;width:7px;border-radius:50%;background:#58e3ff;box-shadow:0 0 14px #58e3ff;animation:pulseDot 1.7s ease-in-out infinite}.release-hero h1{max-width:730px;margin-top:18px;color:#f5f9ff;font-size:clamp(50px,7vw,94px);font-weight:950;line-height:.9;letter-spacing:-.065em;text-transform:uppercase;text-shadow:0 7px 28px rgba(0,0,0,.3)}.release-hero__content>p{max-width:610px;margin-top:23px;color:#a4b4c5;font-size:15px;line-height:1.75}.hero-stats{display:flex;gap:34px;margin-top:33px}.hero-stats div{border-left:2px solid rgba(89,223,255,.32);padding-left:13px}.hero-stats strong{display:block;color:#f1f7ff;font-size:21px;font-weight:900}.hero-stats span{display:block;margin-top:5px;color:#71879b;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.release-hero__visual{position:relative;z-index:2;overflow:hidden;color:inherit;text-decoration:none;cursor:pointer}.release-hero__visual::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,#0a1827 0%,transparent 38%)}.release-hero__visual img{position:absolute;right:-2%;bottom:-2%;z-index:2;height:105%;width:112%;object-fit:contain;object-position:right bottom;filter:drop-shadow(0 10px 30px rgba(0,0,0,.55));animation:heroFloat 5s ease-in-out infinite;transition:filter .3s ease,transform .3s ease}.release-hero__visual[href]:hover img{filter:drop-shadow(0 12px 36px rgba(88,227,255,.3)) brightness(1.08)}.visual-code{position:absolute;right:25px;top:24px;z-index:4;color:rgba(167,202,226,.55);font:700 8px ui-monospace,monospace;letter-spacing:.12em}.visual-action{position:absolute;right:24px;bottom:22px;z-index:6;border:1px solid rgba(88,227,255,.3);border-radius:999px;background:rgba(5,15,25,.78);padding:8px 12px;color:#7ce7ff;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;backdrop-filter:blur(8px);transition:transform .25s ease,background .25s ease}.release-hero__visual:hover .visual-action{transform:translateX(4px);background:rgba(12,37,52,.9)}.visual-glow{position:absolute;right:5%;bottom:-25%;height:85%;width:85%;border-radius:50%;background:rgba(255,92,115,.16);filter:blur(55px);animation:glowPulse 4s ease-in-out infinite}.energy-ring{position:absolute;right:5%;top:12%;height:310px;width:310px;border:1px solid rgba(255,115,133,.16);border-radius:50%;animation:slowSpin 14s linear infinite}.energy-ring::before{content:"";position:absolute;left:50%;top:-4px;height:8px;width:8px;border-radius:50%;background:#ff7185;box-shadow:0 0 15px #ff7185}.ring-two{right:13%;top:23%;height:220px;width:220px;border-color:rgba(88,227,255,.16);animation-direction:reverse;animation-duration:10s}.ring-two::before{background:#58e3ff;box-shadow:0 0 15px #58e3ff}.hero-scan{position:absolute;inset:0;z-index:5;pointer-events:none;background:linear-gradient(110deg,transparent 42%,rgba(112,229,255,.055) 50%,transparent 58%);transform:translateX(-120%);animation:heroScan 7s ease-in-out infinite}
.month-switcher{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin:24px 0 42px;border:1px solid rgba(111,153,190,.14);border-radius:18px;background:rgba(8,17,29,.74);padding:10px}.month-switcher button{display:flex;align-items:center;gap:11px;border-radius:12px;padding:10px 12px;color:#a3b3c3;font-size:13px;font-weight:800;transition:.2s}.month-switcher button:last-child{justify-content:flex-end}.month-switcher button span{display:grid;height:34px;width:34px;place-items:center;border-radius:10px;background:#132437;color:#6edff8;font-size:17px}.month-switcher button:hover:not(:disabled){background:rgba(95,221,255,.06);color:white}.month-switcher button:disabled{cursor:not-allowed;opacity:.3}.month-switcher div{text-align:center}.month-switcher small{display:block;color:#687e92;font-size:9px;font-weight:900;letter-spacing:.16em}.month-switcher strong{display:block;margin-top:4px;color:#f2f7fc;font-size:20px;font-weight:950;letter-spacing:.1em}.release-content{display:grid;gap:54px}.server-section{--accent:#59ddf8}.server-section[data-server="SEA"]{--accent:#ff647c}.server-heading{display:flex;align-items:center;gap:14px;margin-bottom:18px}.server-heading>span{display:grid;height:50px;width:50px;place-items:center;border-radius:15px;background:var(--accent);color:#071019;font-size:13px;font-weight:950;box-shadow:0 8px 25px color-mix(in srgb,var(--accent) 22%,transparent)}.server-heading small{display:block;color:#647c91;font-size:8px;font-weight:900;letter-spacing:.15em}.server-heading h2{margin-top:3px;color:var(--accent);font-size:17px;font-weight:950;letter-spacing:.06em}.server-heading>b{margin-left:auto;border-radius:999px;background:rgba(111,153,190,.08);padding:7px 11px;color:#7f93a5;font-size:10px}.release-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.release-card{position:relative;display:block;min-height:300px;overflow:hidden;border:1px solid rgba(111,153,190,.16);border-radius:22px;background:linear-gradient(105deg,#0b1725 0%,#08111d 66%,#10101a 100%);box-shadow:0 20px 46px rgba(0,0,0,.25);animation:cardReveal .65s both;animation-delay:var(--delay);transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}.release-card:hover{transform:translateY(-7px);border-color:color-mix(in srgb,var(--accent) 48%,transparent);box-shadow:0 28px 70px rgba(0,0,0,.4),0 0 0 1px color-mix(in srgb,var(--accent) 10%,transparent)}.release-card__copy{position:relative;z-index:4;display:flex;min-height:300px;width:65%;flex-direction:column;padding:30px}.card-meta{display:flex;align-items:center;gap:11px}.card-meta span{border-radius:9px;background:var(--accent);padding:7px 10px;color:#071019;font-size:10px;font-weight:950;letter-spacing:.09em}.card-meta b{color:#91a4b5;font-size:10px;line-height:1.4}.card-title{display:flex;align-items:center;gap:9px;margin-top:36px}.card-title i{border-radius:7px;background:rgba(255,255,255,.09);padding:5px 7px;color:var(--accent);font-size:10px;font-weight:950}.card-title h3{overflow:hidden;color:#f4f8fc;font-size:clamp(27px,3.4vw,42px);font-weight:950;letter-spacing:-.045em;text-overflow:ellipsis;white-space:nowrap}.release-card__copy>p{margin-top:7px;color:#a3b1bf;font-size:14px}.card-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.card-tags span{border:1px solid rgba(145,170,191,.15);border-radius:999px;background:rgba(4,10,17,.35);padding:5px 8px;color:#8194a5;font-size:9px;font-weight:800;text-transform:uppercase}.card-link{display:flex;align-items:center;gap:8px;margin-top:auto;color:var(--accent);font-size:11px;font-weight:900}.card-link b{transition:transform .25s}.release-card:hover .card-link b{transform:translateX(5px)}.release-card__image{position:absolute;inset:0 0 0 auto;width:58%;overflow:hidden}.release-card__image::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0a1624 2%,transparent 55%)}.release-card__image img{position:absolute;right:-3%;bottom:-2%;height:105%;width:108%;object-fit:contain;object-position:right bottom;filter:saturate(.88) contrast(1.05);transition:transform .65s cubic-bezier(.2,.8,.2,1),filter .4s}.release-card:hover .release-card__image img{transform:scale(1.055) translateX(-5px);filter:saturate(1) contrast(1.08)}.card-light{position:absolute;right:6%;top:12%;height:170px;width:170px;border-radius:50%;background:color-mix(in srgb,var(--accent) 17%,transparent);filter:blur(52px);animation:glowPulse 4s ease-in-out infinite}.card-shine{position:absolute;inset:0;z-index:6;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.09) 48%,transparent 61%);transform:translateX(-130%)}.release-card:hover .card-shine{animation:cardShine .9s ease}.release-empty{border:1px solid rgba(111,153,190,.16);border-radius:22px;background:rgba(8,17,29,.7);padding:70px;text-align:center}.release-empty div{display:grid;height:52px;width:52px;margin:auto;place-items:center;border-radius:50%;background:#ff647c;color:#16050a;font-size:22px;font-weight:950}.release-empty h2{margin-top:16px;color:white;font-size:24px;font-weight:900}.release-empty p{margin-top:8px;color:#7b8fa2}
.server-section[data-server="CN"]{--accent:#ff4d64}.server-section[data-server="SEA"]{--accent:#4ed8ff}.release-card.is-return .card-meta span{background:var(--accent)}.release-card.is-return .card-link{color:#fff}
.release-card .card-title i{min-width:45px;border-radius:9px;padding:8px 10px;color:var(--tier-accent,#fff);background:color-mix(in srgb,var(--tier-accent,#fff) 12%,transparent);font-size:14px;font-style:normal;line-height:1;text-align:center;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tier-accent,#fff) 24%,transparent)}
.release-card .release-card__copy>p{font-size:17px;font-weight:650;line-height:1.5}.release-card .card-tags{gap:9px;margin-top:15px}.release-card .card-tags span{display:inline-flex;align-items:center;gap:7px;border-radius:9px;padding:8px 12px;font-size:12px;font-weight:900;letter-spacing:.045em}.release-card .card-tags span::before{content:"";height:7px;width:7px;flex:none;border-radius:50%;background:currentColor;box-shadow:0 0 9px currentColor}.release-card .card-tags span:first-child{border-color:color-mix(in srgb,var(--faction-accent) 38%,transparent);background:color-mix(in srgb,var(--faction-accent) 15%,rgba(4,10,17,.7));color:var(--faction-accent)}.release-card .card-tags span:last-child{border-color:color-mix(in srgb,var(--accent) 38%,transparent);background:color-mix(in srgb,var(--accent) 15%,rgba(4,10,17,.7));color:var(--accent)}
.release-card .card-link{width:max-content;gap:10px;border:0;background:transparent;padding:5px 0;color:#fff;font-size:14px;line-height:1;letter-spacing:.025em;box-shadow:none}.release-card:hover .card-link{background:transparent;color:#fff;box-shadow:none}.release-card .card-link b{font-size:17px}
.release-hero{--hero-accent:#ffc107}.release-hero .hero-pill{border-color:color-mix(in srgb,var(--hero-accent) 35%,transparent);background:color-mix(in srgb,var(--hero-accent) 9%,transparent);color:var(--hero-accent)}.release-hero .hero-pill i{background:var(--hero-accent);box-shadow:0 0 14px var(--hero-accent)}.release-hero .hero-stats div{border-left-color:color-mix(in srgb,var(--hero-accent) 42%,transparent)}.release-hero .visual-action{border-color:color-mix(in srgb,var(--hero-accent) 38%,transparent);color:var(--hero-accent)}.release-hero .visual-glow{background:color-mix(in srgb,var(--hero-accent) 19%,transparent)}.release-hero .energy-ring{border-color:color-mix(in srgb,var(--hero-accent) 22%,transparent)}.release-hero .energy-ring::before{background:var(--hero-accent);box-shadow:0 0 15px var(--hero-accent)}.release-hero__visual[href]:hover img{filter:drop-shadow(0 12px 36px color-mix(in srgb,var(--hero-accent) 34%,transparent)) brightness(1.08)}
.release-hero .visual-action{right:26px;bottom:24px;border:0;background:transparent;padding:6px 0;color:#fff;font-size:13px;line-height:1;letter-spacing:.045em;box-shadow:none;backdrop-filter:none}.release-hero__visual:hover .visual-action{background:transparent;color:#fff;box-shadow:none}
@keyframes ambientDrift{to{transform:translate(80px,70px) scale(1.15)}}@keyframes pulseDot{50%{opacity:.35;transform:scale(.75)}}@keyframes heroFloat{50%{transform:translateY(-10px) scale(1.01)}}@keyframes glowPulse{50%{opacity:.55;transform:scale(1.12)}}@keyframes slowSpin{to{transform:rotate(360deg)}}@keyframes heroScan{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}@keyframes cardReveal{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@keyframes cardShine{to{transform:translateX(130%)}}
@media(max-width:1000px){.release-hero{min-height:390px;grid-template-columns:minmax(0,1fr) 42%}.release-hero__content{padding:42px 10px 40px 40px}.release-hero h1{font-size:60px}.release-grid{grid-template-columns:1fr}.release-card{min-height:280px}.release-card__copy{min-height:280px}.card-title h3{font-size:38px}}
@media(max-width:700px){.home-stage{padding:18px 12px 70px}.release-hero{min-height:510px;grid-template-columns:1fr;border-radius:20px}.release-hero__content{justify-content:flex-start;padding:30px 22px}.release-hero h1{font-size:47px}.release-hero__content>p{font-size:13px}.hero-stats{gap:17px;margin-top:24px}.hero-stats strong{font-size:17px}.release-hero__visual{position:absolute;right:0;bottom:0;left:0;height:48%;opacity:.65}.release-hero__visual::before{background:linear-gradient(180deg,#0a1827 0%,transparent 42%)}.release-hero__visual img{right:-10%;height:104%;width:105%}.month-switcher{margin:16px 0 34px}.month-switcher button{font-size:0}.month-switcher button span{font-size:17px}.month-switcher small{font-size:7px}.month-switcher strong{font-size:16px}.server-heading>b{display:none}.release-card{min-height:320px;border-radius:18px}.release-card__copy{min-height:320px;width:78%;padding:24px}.release-card__image{width:66%;opacity:.65}.card-title{margin-top:42px}.card-title h3{font-size:31px;white-space:normal}.card-meta{align-items:flex-start;flex-direction:column}.card-tags{position:relative;z-index:3}}
@media(max-width:700px){.visual-code{display:none}.hero-stats{position:relative;z-index:4;padding:10px 0;background:linear-gradient(90deg,rgba(9,20,33,.84),rgba(9,20,33,.15))}}
@media(max-width:430px){.release-hero{min-height:500px}.release-hero__content{padding:25px 20px}.hero-pill{padding:6px 9px;font-size:8px;letter-spacing:.08em}.release-hero h1{margin-top:15px;font-size:36px;line-height:1}.release-hero__content>p{margin-top:18px;font-size:12px;line-height:1.65}.hero-stats{gap:8px;margin-top:20px}.hero-stats div{padding-left:8px}.hero-stats strong{font-size:15px}.hero-stats span{font-size:7px;letter-spacing:.04em}.release-hero__visual{height:46%}.release-hero__visual img{right:-16%;width:116%}}
@media(prefers-reduced-motion:reduce){.ambient,.hero-pill i,.release-hero__visual img,.energy-ring,.hero-scan,.card-light,.release-card{animation:none!important}.release-card,.release-card__image img{transition:none!important}}
</style>
