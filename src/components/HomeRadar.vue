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
  getCharacterImageSet: { type: Function, required: true },
  getCharacterImage: { type: Function, required: true },
  getCharacter: { type: Function, required: true },
})
const emit = defineEmits(['previous', 'next'])
const { t } = useI18n()
const recordCount = computed(() => props.servers.reduce((total, server) => total + server.items.length, 0))
const featuredItems = computed(() => ['CN', 'SEA'].map((serverCode) => {
  const serverGroup = props.servers.find(server => server.server === serverCode)
  if (!serverGroup?.items.length) return null

  const item = serverGroup.items.find(candidate => candidate.tag !== t('home.return')) || serverGroup.items[0]
  const character = props.getCharacter(item.id)

  return {
    server: serverCode,
    serverName: serverGroup.serverName,
    item,
    character,
    name: item.overrideName || character.name || t('home.title'),
    role: item.overrideRole || character.roles?.[0] || character.type || '',
    image: props.getCharacterImageSet(item.bannerImage || character.imageURL),
  }
}).filter(Boolean))

const featuredImageSizes = {
  CN: '(max-width: 430px) 70vw, (max-width: 700px) 78vw, (max-width: 1100px) 60vw, min(52vw, 750px)',
  SEA: '(max-width: 430px) 70vw, (max-width: 700px) 78vw, (max-width: 1100px) 66vw, min(58vw, 850px)',
}
const releaseImageSizes = '(max-width: 700px) 66vw, (max-width: 1000px) 58vw, min(29vw, 405px)'
const getReleaseImage = item => props.getCharacterImageSet(
  item.bannerImage || props.getCharacter(item.id).imageURL,
)

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

  if (tier.includes('UR+')) return '#ff3366'
  if (tier.includes('UR')) return '#ff4d4d'
  if (tier.includes('SSR+')) return '#ffb300'
  if (tier.includes('SSR')) return '#f59e0b'
  if (tier.includes('SR')) return '#a855f7'
  if (tier.includes('R')) return '#3b82f6'
  return '#94a3b8'
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

    <transition :name="transitionName" mode="out-in">
    <section :key="`hero-${currentMonth}`" class="release-hero featured-stage">
      <h1 class="sr-only">{{ t('home.eyebrow') }} · {{ displayDate }}</h1>
      <div class="featured-overview">
        <span>{{ t('home.eyebrow') }}</span>
        <div><strong>{{ displayDate }}</strong><i>{{ recordCount }} {{ t('home.records') }} · {{ servers.length }} {{ t('home.servers') }}</i></div>
      </div>
      <div class="featured-grid">
        <component
          :is="feature.item.id === 'unknown' ? 'article' : RouterLink"
          v-for="(feature, featureIndex) in featuredItems"
          :key="`${feature.server}-${feature.item.id}`"
          :to="feature.item.id === 'unknown' ? undefined : `/character/${feature.item.id}`"
          class="featured-card"
          :data-server="feature.server"
          :data-character="feature.item.id"
          :style="{ '--hero-accent': getTypeAccent(feature.item), '--tier-accent': getTierAccent(feature.item), '--faction-accent': getFactionAccent(feature.item) }"
          :aria-label="feature.item.id === 'unknown' ? undefined : `${t('home.viewDetails')}: ${feature.name}`"
        >
          <div class="featured-card__copy">
            <div class="featured-server"><b>{{ feature.server }}</b><span>{{ feature.serverName }}</span></div>
            <span class="hero-pill"><i />{{ feature.item.tag }} · {{ feature.item.date }}</span>
            <h2>{{ feature.name }}</h2>
            <p>{{ feature.role }}</p>
            <div class="featured-meta">
              <b v-if="feature.character.tier" class="featured-tier">{{ feature.character.tier }}</b>
              <span v-if="feature.character.type" class="featured-type">{{ feature.character.type }}</span>
              <span v-if="feature.character.faction" class="featured-faction">{{ feature.character.faction }}</span>
            </div>
            <span v-if="feature.item.id !== 'unknown'" class="visual-action">{{ t('home.viewDetails') }} →</span>
          </div>
          <div class="featured-card__visual" aria-hidden="true">
            <div class="energy-ring ring-one" /><div class="energy-ring ring-two" />
            <span class="visual-code">{{ feature.server }} // {{ feature.item.id }}</span>
            <img
              class="hero-float-img"
              :src="feature.image.src"
              :srcset="feature.image.srcset || undefined"
              :sizes="feature.image.srcset ? featuredImageSizes[feature.server] : undefined"
              :width="feature.image.width"
              :height="feature.image.height"
              :alt="feature.name"
              loading="eager"
              :fetchpriority="featureIndex === 0 ? 'high' : 'low'"
              decoding="async"
              onerror="this.style.display='none'"
            />
            <div class="visual-glow" />
          </div>
        </component>
      </div>
      <div class="hero-scan" />
    </section>
    </transition>

    <section class="month-switcher" aria-label="Điều hướng tháng">
      <button :disabled="!hasPrevious" @click="emit('previous')"><span>←</span>{{ t('home.previousMonth') }}</button>
      <div><small>{{ t('home.releaseSchedule') }}</small><strong>{{ displayDate }}</strong></div>
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
            <b>{{ t('home.characterCount', { count: serverGroup.items.length }) }}</b>
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
                <img class="card-float-img" :src="getReleaseImage(item).src" :srcset="getReleaseImage(item).srcset || undefined" :sizes="getReleaseImage(item).srcset ? releaseImageSizes : undefined" :width="getReleaseImage(item).width" :height="getReleaseImage(item).height" :alt="item.overrideName || getCharacter(item.id).name" loading="lazy" fetchpriority="low" decoding="async" onerror="this.style.display='none'" />
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
.home-stage{position:relative;width:100%;max-width:1440px;margin:0 auto;overflow:hidden;padding:34px 24px 100px}.ambient{position:absolute;z-index:-1;border-radius:50%;filter:blur(90px);pointer-events:none}.ambient-one{left:-140px;top:180px;height:420px;width:420px;background:rgba(52,205,255,.12);animation:ambientDrift 9s ease-in-out infinite alternate}.ambient-two{right:-120px;top:560px;height:360px;width:360px;background:rgba(255,85,113,.1);animation:ambientDrift 11s ease-in-out 1s infinite alternate-reverse}.release-hero{position:relative;display:grid;min-height:430px;grid-template-columns:minmax(0,1fr) minmax(320px,44%);overflow:hidden;border:1px solid rgba(117,159,195,.18);border-radius:26px;background:linear-gradient(120deg,#0b1b2c 0%,#091421 58%,#15101a 100%);box-shadow:0 32px 80px rgba(0,0,0,.34)}.release-hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(113,163,201,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(113,163,201,.055) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(90deg,black,transparent 82%)}.release-hero__content{position:relative;z-index:3;display:flex;flex-direction:column;justify-content:center;padding:55px 20px 48px 58px}.hero-pill{display:flex;width:max-content;align-items:center;gap:9px;border:1px solid rgba(96,221,255,.2);border-radius:999px;background:rgba(96,221,255,.06);padding:7px 12px;color:#78e5ff;font-size:10px;font-weight:900;letter-spacing:.13em}.hero-pill i{height:7px;width:7px;border-radius:50%;background:#58e3ff;box-shadow:0 0 14px #58e3ff;animation:pulseDot 1.7s ease-in-out infinite}.release-hero h1{max-width:730px;margin-top:18px;color:#f5f9ff;font-size:clamp(50px,7vw,94px);font-weight:950;line-height:.9;letter-spacing:-.065em;text-transform:uppercase;text-shadow:0 7px 28px rgba(0,0,0,.3)}.release-hero__content>p{max-width:610px;margin-top:23px;color:#a4b4c5;font-size:15px;line-height:1.75}.hero-stats{display:flex;gap:34px;margin-top:33px}.hero-stats div{border-left:2px solid rgba(89,223,255,.32);padding-left:13px}.hero-stats strong{display:block;color:#f1f7ff;font-size:21px;font-weight:900}.hero-stats span{display:block;margin-top:5px;color:#71879b;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.release-hero__visual{position:relative;z-index:2;overflow:hidden;color:inherit;text-decoration:none;cursor:pointer}.release-hero__visual::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,#0a1827 0%,transparent 38%)}.release-hero__visual img{position:absolute;right:-2%;bottom:-2%;z-index:2;height:105%;width:112%;object-fit:contain;object-position:right bottom;filter:drop-shadow(0 10px 30px rgba(0,0,0,.55));transition:filter .3s ease}
.hero-float-img{will-change:transform;animation:heroFloat 5s ease-in-out infinite!important}
.release-card__image img{position:absolute;right:-3%;bottom:-2%;height:105%;width:108%;object-fit:contain;object-position:right bottom;filter:saturate(.88) contrast(1.05);transition:transform .65s cubic-bezier(.2,.8,.2,1),filter .4s}
.card-float-img{will-change:transform;animation:cardFloat 4s ease-in-out infinite!important;animation-delay:calc(var(--delay,0s) + 0.3s)!important}
@keyframes heroFloat{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-18px) rotate(-1deg) scale(1.025)}}
@keyframes cardFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-7px) scale(1.01)}}
.visual-code{position:absolute;right:25px;top:24px;z-index:4;color:rgba(167,202,226,.55);font:700 8px ui-monospace,monospace;letter-spacing:.12em}.visual-action{position:absolute;right:24px;bottom:22px;z-index:6;border:1px solid rgba(88,227,255,.3);border-radius:999px;background:rgba(5,15,25,.78);padding:8px 12px;color:#7ce7ff;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;backdrop-filter:blur(8px);transition:transform .25s ease,background .25s ease}.release-hero__visual:hover .visual-action{transform:translateX(4px);background:rgba(12,37,52,.9)}.visual-glow{position:absolute;right:5%;bottom:-25%;height:85%;width:85%;border-radius:50%;background:rgba(255,92,115,.16);filter:blur(55px);animation:glowPulse 4s ease-in-out infinite}.energy-ring{position:absolute;right:5%;top:12%;z-index:2;height:310px;width:310px;border:1px solid rgba(255,115,133,.22);border-radius:50%;transform-origin:50% 50%;will-change:transform;animation:slowSpin 14s linear infinite}.energy-ring::before,.energy-ring::after{content:"";position:absolute;left:50%;top:-5px;height:10px;width:10px;border-radius:50%;background:#ff7185;box-shadow:0 0 18px #ff7185}.energy-ring::after{left:18%;top:auto;bottom:8%;height:6px;width:6px;opacity:.7}.ring-two{right:13%;top:23%;height:220px;width:220px;border-color:rgba(88,227,255,.22);animation-direction:reverse;animation-duration:10s}.ring-two::before,.ring-two::after{background:#58e3ff;box-shadow:0 0 18px #58e3ff}.hero-scan{position:absolute;inset:0;z-index:5;pointer-events:none;background:linear-gradient(110deg,transparent 42%,rgba(112,229,255,.055) 50%,transparent 58%);transform:translateX(-120%);animation:heroScan 7s ease-in-out infinite}
.month-switcher{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin:24px 0 42px;border:1px solid rgba(111,153,190,.14);border-radius:18px;background:rgba(8,17,29,.74);padding:10px}.month-switcher button{display:flex;align-items:center;gap:11px;border-radius:12px;padding:10px 12px;color:#a3b3c3;font-size:13px;font-weight:800;transition:.2s}.month-switcher button:last-child{justify-content:flex-end}.month-switcher button span{display:grid;height:34px;width:34px;place-items:center;border-radius:10px;background:#132437;color:#6edff8;font-size:17px}.month-switcher button:hover:not(:disabled){background:rgba(95,221,255,.06);color:white}.month-switcher button:disabled{cursor:not-allowed;opacity:.3}.month-switcher div{text-align:center}.month-switcher small{display:block;color:#687e92;font-size:9px;font-weight:900;letter-spacing:.16em}.month-switcher strong{display:block;margin-top:4px;color:#f2f7fc;font-size:20px;font-weight:950;letter-spacing:.1em}.release-content{display:grid;gap:54px}.server-section{--accent:#59ddf8}.server-section[data-server="SEA"]{--accent:#ff647c}.server-heading{display:flex;align-items:center;gap:14px;margin-bottom:18px}.server-heading>span{display:grid;height:50px;width:50px;place-items:center;border-radius:15px;background:var(--accent);color:#071019;font-size:13px;font-weight:950;box-shadow:0 8px 25px color-mix(in srgb,var(--accent) 22%,transparent)}.server-heading small{display:block;color:#647c91;font-size:8px;font-weight:900;letter-spacing:.15em}.server-heading h2{margin-top:3px;color:var(--accent);font-size:17px;font-weight:950;letter-spacing:.06em}.server-heading>b{margin-left:auto;border-radius:999px;background:rgba(111,153,190,.08);padding:7px 11px;color:#7f93a5;font-size:10px}.release-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.release-card{position:relative;display:block;min-height:300px;overflow:hidden;border:1px solid rgba(111,153,190,.16);border-radius:22px;background:linear-gradient(105deg,#0b1725 0%,#08111d 66%,#10101a 100%);box-shadow:0 20px 46px rgba(0,0,0,.25);animation:cardReveal .65s both;animation-delay:var(--delay);transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}.release-card:hover{transform:translateY(-7px);border-color:color-mix(in srgb,var(--accent) 48%,transparent);box-shadow:0 28px 70px rgba(0,0,0,.4),0 0 0 1px color-mix(in srgb,var(--accent) 10%,transparent)}.release-card__copy{position:relative;z-index:4;display:flex;min-height:300px;width:65%;flex-direction:column;padding:30px}.card-meta{display:flex;align-items:center;gap:11px}.card-meta span{border-radius:9px;background:var(--accent);padding:7px 10px;color:#071019;font-size:10px;font-weight:950;letter-spacing:.09em}.card-meta b{color:#91a4b5;font-size:10px;line-height:1.4}.card-title{display:flex;align-items:center;gap:9px;margin-top:36px}.card-title i{border-radius:7px;background:rgba(255,255,255,.09);padding:5px 7px;color:var(--accent);font-size:10px;font-weight:950}.card-title h3{overflow:hidden;color:#f4f8fc;font-size:clamp(27px,3.4vw,42px);font-weight:950;letter-spacing:-.045em;text-overflow:ellipsis;white-space:nowrap}.release-card__copy>p{margin-top:7px;color:#a3b1bf;font-size:14px}.card-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.card-tags span{border:1px solid rgba(145,170,191,.15);border-radius:999px;background:rgba(4,10,17,.35);padding:5px 8px;color:#8194a5;font-size:9px;font-weight:800;text-transform:uppercase}.card-link{display:flex;align-items:center;gap:8px;margin-top:auto;color:var(--accent);font-size:11px;font-weight:900}.card-link b{transition:transform .25s}.release-card:hover .card-link b{transform:translateX(5px)}.release-card__image{position:absolute;inset:0 0 0 auto;width:58%;overflow:hidden}.release-card__image::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0a1624 2%,transparent 55%)}.release-card:hover .release-card__image img{transform:scale(1.055) translateX(-5px);filter:saturate(1) contrast(1.08)}.card-light{position:absolute;right:6%;top:12%;height:170px;width:170px;border-radius:50%;background:color-mix(in srgb,var(--accent) 17%,transparent);filter:blur(52px);animation:glowPulse 4s ease-in-out infinite}.card-shine{position:absolute;inset:0;z-index:6;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.09) 48%,transparent 61%);transform:translateX(-130%)}.release-card:hover .card-shine{animation:cardShine .9s ease}.release-empty{border:1px solid rgba(111,153,190,.16);border-radius:22px;background:rgba(8,17,29,.7);padding:70px;text-align:center}.release-empty div{display:grid;height:52px;width:52px;margin:auto;place-items:center;border-radius:50%;background:#ff647c;color:#16050a;font-size:22px;font-weight:950}.release-empty h2{margin-top:16px;color:white;font-size:24px;font-weight:900}.release-empty p{margin-top:8px;color:#7b8fa2}
.server-section + .server-section{content-visibility:auto;contain-intrinsic-size:auto 380px}
.server-section[data-server="CN"]{--accent:#ff4d64}.server-section[data-server="SEA"]{--accent:#4ed8ff}.release-card.is-return .card-meta span{background:var(--accent)}.release-card.is-return .card-link{color:#fff}
.release-card .card-title i{min-width:45px;border-radius:9px;padding:8px 10px;color:var(--tier-accent,#fff);background:color-mix(in srgb,var(--tier-accent,#fff) 12%,transparent);font-size:14px;font-style:normal;line-height:1;text-align:center;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tier-accent,#fff) 24%,transparent)}
.release-card .release-card__copy>p{font-size:17px;font-weight:650;line-height:1.5}.release-card .card-tags{gap:9px;margin-top:15px}.release-card .card-tags span{display:inline-flex;align-items:center;gap:7px;border-radius:9px;padding:8px 12px;font-size:12px;font-weight:900;letter-spacing:.045em}.release-card .card-tags span::before{content:"";height:7px;width:7px;flex:none;border-radius:50%;background:currentColor;box-shadow:0 0 9px currentColor}.release-card .card-tags span:first-child{border-color:color-mix(in srgb,var(--faction-accent) 38%,transparent);background:color-mix(in srgb,var(--faction-accent) 15%,rgba(4,10,17,.7));color:var(--faction-accent)}.release-card .card-tags span:last-child{border-color:color-mix(in srgb,var(--accent) 38%,transparent);background:color-mix(in srgb,var(--accent) 15%,rgba(4,10,17,.7));color:var(--accent)}
.release-card .card-link{width:max-content;gap:10px;border:0;background:transparent;padding:5px 0;color:#fff;font-size:14px;line-height:1;letter-spacing:.025em;box-shadow:none}.release-card:hover .card-link{background:transparent;color:#fff;box-shadow:none}.release-card .card-link b{font-size:17px}
.release-hero{--hero-accent:#ffc107}.release-hero .hero-pill{border-color:color-mix(in srgb,var(--hero-accent) 35%,transparent);background:color-mix(in srgb,var(--hero-accent) 9%,transparent);color:var(--hero-accent)}.release-hero .hero-pill i{background:var(--hero-accent);box-shadow:0 0 14px var(--hero-accent)}.release-hero .hero-stats div{border-left-color:color-mix(in srgb,var(--hero-accent) 42%,transparent)}.release-hero .visual-action{border-color:color-mix(in srgb,var(--hero-accent) 38%,transparent);color:var(--hero-accent)}.release-hero .visual-glow{background:color-mix(in srgb,var(--hero-accent) 19%,transparent)}.release-hero .energy-ring{border-color:color-mix(in srgb,var(--hero-accent) 22%,transparent)}.release-hero .energy-ring::before,.release-hero .energy-ring::after{background:var(--hero-accent);box-shadow:0 0 18px var(--hero-accent)}.release-hero__visual[href]:hover img{filter:drop-shadow(0 12px 36px color-mix(in srgb,var(--hero-accent) 34%,transparent)) brightness(1.08)}
.release-hero .visual-action{right:26px;bottom:24px;border:0;background:transparent;padding:6px 0;color:#fff;font-size:13px;line-height:1;letter-spacing:.045em;box-shadow:none;backdrop-filter:none}.release-hero__visual:hover .visual-action{background:transparent;color:#fff;box-shadow:none}
.release-hero.featured-stage{display:block;min-height:0;padding:20px;background:linear-gradient(120deg,#081725 0%,#07111c 52%,#13101a 100%)}
.release-hero .sr-only{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.featured-overview{position:relative;z-index:7;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 4px 16px}.featured-overview>span{color:#8ea3b7;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.featured-overview>div{display:flex;align-items:center;gap:13px}.featured-overview strong{color:#eef7ff;font-size:15px;font-weight:900;letter-spacing:.09em}.featured-overview i{color:#70869a;font-size:9px;font-style:normal;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
.featured-grid{position:relative;z-index:4;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.featured-card{--server-accent:#ff4d64;position:relative;display:block;min-width:0;min-height:400px;overflow:hidden;border:1px solid color-mix(in srgb,var(--server-accent) 25%,rgba(117,159,195,.18));border-radius:20px;background:linear-gradient(125deg,#0b1b2c 0%,#09131f 55%,#15101a 100%);color:inherit;text-decoration:none;box-shadow:0 20px 50px rgba(0,0,0,.28);isolation:isolate;transition:transform .35s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .3s}
.featured-card[data-server="SEA"]{--server-accent:#4ed8ff}
.featured-card::before{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(90deg,rgba(7,18,29,.98) 0%,rgba(7,18,29,.86) 38%,rgba(7,18,29,.23) 70%,transparent 100%);pointer-events:none}
.featured-card::after{content:"";position:absolute;inset:0;z-index:5;border-radius:inherit;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--server-accent) 7%,transparent);pointer-events:none}
.featured-card__copy{position:absolute;inset:0;z-index:6;display:flex;width:67%;min-width:0;flex-direction:column;padding:25px 0 24px 25px}
.featured-server{display:flex;align-items:center;gap:9px;color:var(--server-accent)}.featured-server b{display:grid;min-width:39px;height:29px;place-items:center;border-radius:8px;background:var(--server-accent);color:#061019;font-size:11px;font-weight:950;letter-spacing:.06em}.featured-server span{overflow:hidden;font-size:9px;font-weight:900;letter-spacing:.1em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}
.featured-card .hero-pill{margin-top:12px;padding:6px 9px;font-size:8px;letter-spacing:.065em;white-space:nowrap}.featured-card h2{max-width:100%;margin-top:auto;color:#f5f9ff;font-size:clamp(35px,3.7vw,54px);font-weight:950;line-height:.92;letter-spacing:-.055em;text-transform:uppercase;text-shadow:0 7px 28px rgba(0,0,0,.5);overflow-wrap:anywhere}.featured-card__copy>p{display:-webkit-box;max-width:460px;margin-top:13px;overflow:hidden;color:#b0becb;font-size:13px;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:2}.featured-card .visual-action{position:static;align-self:flex-start;margin-top:17px;padding:5px 0;color:#fff;font-size:11px;font-weight:900;letter-spacing:.045em;text-transform:uppercase;transition:color .25s,transform .25s}
.featured-card__visual{position:absolute;inset:0;z-index:1;overflow:hidden}.featured-card__visual img{position:absolute;right:-10%;bottom:-2%;z-index:2;height:93%;width:83%;object-fit:contain;object-position:right bottom;filter:drop-shadow(0 12px 28px rgba(0,0,0,.58));transition:filter .35s,transform .5s cubic-bezier(.2,.8,.2,1)}.featured-card .visual-code{right:17px;top:15px;font-size:7px}.featured-card .energy-ring{right:-2%;top:13%;height:250px;width:250px}.featured-card .ring-two{right:7%;top:24%;height:178px;width:178px}.featured-card .visual-glow{right:-4%;bottom:-30%;height:92%;width:80%;background:color-mix(in srgb,var(--server-accent) 16%,transparent)}
.featured-card[href]:hover{transform:translateY(-6px);border-color:color-mix(in srgb,var(--server-accent) 58%,transparent);box-shadow:0 28px 66px rgba(0,0,0,.4),0 0 30px color-mix(in srgb,var(--server-accent) 9%,transparent)}.featured-card[href]:hover .featured-card__visual img{filter:drop-shadow(0 15px 34px color-mix(in srgb,var(--server-accent) 28%,rgba(0,0,0,.55))) brightness(1.08);transform:scale(1.035) translateX(-4px)}.featured-card[href]:hover .visual-action{color:var(--server-accent);transform:translateX(4px)}
.fade-enter-active,.fade-leave-active,.slide-left-enter-active,.slide-left-leave-active,.slide-right-enter-active,.slide-right-leave-active{will-change:opacity,transform,filter;transition:opacity .46s ease,transform .46s cubic-bezier(.2,.8,.2,1),filter .46s ease}
.fade-enter-from,.fade-leave-to{opacity:0;filter:blur(6px);transform:translateY(12px) scale(.985)}
.slide-left-enter-from{opacity:0;filter:blur(7px);transform:translateX(72px) scale(.985)}.slide-left-leave-to{opacity:0;filter:blur(7px);transform:translateX(-72px) scale(.985)}
.slide-right-enter-from{opacity:0;filter:blur(7px);transform:translateX(-72px) scale(.985)}.slide-right-leave-to{opacity:0;filter:blur(7px);transform:translateX(72px) scale(.985)}@keyframes ambientDrift{to{transform:translate(80px,70px) scale(1.15)}}@keyframes pulseDot{50%{opacity:.35;transform:scale(.75)}}@keyframes glowPulse{50%{opacity:.55;transform:scale(1.12)}}@keyframes slowSpin{to{transform:rotate(360deg)}}@keyframes heroScan{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}@keyframes cardReveal{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}@keyframes cardShine{to{transform:translateX(130%)}}
@media(max-width:1000px){.release-hero{min-height:390px;grid-template-columns:minmax(0,1fr) 42%}.release-hero__content{padding:42px 10px 40px 40px}.release-hero h1{font-size:60px}.release-grid{grid-template-columns:1fr}.release-card{min-height:280px}.release-card__copy{min-height:280px}.card-title h3{font-size:38px}}
@media(max-width:700px){.home-stage{padding:18px 12px 70px}.release-hero{min-height:510px;grid-template-columns:1fr;border-radius:20px}.release-hero__content{justify-content:flex-start;padding:30px 22px}.release-hero h1{font-size:47px}.release-hero__content>p{font-size:13px}.hero-stats{gap:17px;margin-top:24px}.hero-stats strong{font-size:17px}.release-hero__visual{position:absolute;right:0;bottom:0;left:0;height:48%;opacity:.65}.release-hero__visual::before{background:linear-gradient(180deg,#0a1827 0%,transparent 42%)}.release-hero__visual img{right:-10%;height:104%;width:105%}.month-switcher{margin:16px 0 34px}.month-switcher button{font-size:0}.month-switcher button span{font-size:17px}.month-switcher small{font-size:7px}.month-switcher strong{font-size:16px}.server-heading>b{display:none}.release-card{min-height:320px;border-radius:18px}.release-card__copy{min-height:320px;width:78%;padding:24px}.release-card__image{width:66%;opacity:.65}.card-title{margin-top:42px}.card-title h3{font-size:31px;white-space:normal}.card-meta{align-items:flex-start;flex-direction:column}.card-tags{position:relative;z-index:3}}
@media(max-width:700px){.server-section + .server-section{contain-intrinsic-size:auto 760px}}
@media(max-width:700px){.visual-code{display:none}.hero-stats{position:relative;z-index:4;padding:10px 0;background:linear-gradient(90deg,rgba(9,20,33,.84),rgba(9,20,33,.15))}}
@media(max-width:430px){.release-hero{min-height:500px}.release-hero__content{padding:25px 20px}.hero-pill{padding:6px 9px;font-size:8px;letter-spacing:.08em}.release-hero h1{margin-top:15px;font-size:36px;line-height:1}.release-hero__content>p{margin-top:18px;font-size:12px;line-height:1.65}.hero-stats{gap:8px;margin-top:20px}.hero-stats div{padding-left:8px}.hero-stats strong{font-size:15px}.hero-stats span{font-size:7px;letter-spacing:.04em}.release-hero__visual{height:46%}.release-hero__visual img{right:-16%;width:116%}}
@media(max-width:1000px){.featured-card{min-height:360px}.featured-card__copy{width:70%;padding:22px 0 22px 22px}.featured-card h2{font-size:clamp(32px,4.6vw,45px)}.featured-card__visual img{right:-14%;width:91%}}
@media(max-width:700px){.release-hero.featured-stage{padding:14px;border-radius:20px}.featured-overview{align-items:flex-start;padding:2px 2px 13px}.featured-overview>span{max-width:52%;font-size:8px;line-height:1.5}.featured-overview>div{align-items:flex-end;flex-direction:column;gap:2px}.featured-overview strong{font-size:13px}.featured-overview i{font-size:7px}.featured-grid{grid-template-columns:1fr;gap:12px}.featured-card{min-height:340px;border-radius:16px}.featured-card__copy{width:68%;padding:19px 0 19px 19px}.featured-card h2{font-size:clamp(34px,10vw,48px)}.featured-card__visual img{right:-7%;height:94%;width:78%}.featured-card .energy-ring{height:220px;width:220px}.featured-card .ring-two{height:155px;width:155px}.featured-card .visual-action{font-size:10px}.month-switcher{margin-top:16px}}
@media(max-width:430px){.release-hero.featured-stage{min-height:0;padding:10px}.featured-overview{padding:4px 3px 11px}.featured-overview i{display:none}.featured-card{min-height:320px}.featured-card__copy{width:74%;padding:16px 0 16px 16px}.featured-server b{min-width:35px;height:26px;font-size:10px}.featured-server span{font-size:8px}.featured-card .hero-pill{max-width:100%;overflow:hidden;text-overflow:ellipsis}.featured-card h2{font-size:clamp(30px,10vw,40px);line-height:.96}.featured-card__copy>p{margin-top:10px;font-size:12px}.featured-card .visual-action{margin-top:13px}.featured-card__visual img{right:-13%;width:91%}}

/* One full-stage diagonal: CN owns the upper-left triangle, SEA the lower-right. */
.featured-grid{position:relative;display:block;height:560px;overflow:hidden;border:1px solid rgba(117,159,195,.22);border-radius:20px;background:#071824;isolation:isolate}
.featured-grid::before{display:none}
.featured-grid::after{content:"";position:absolute;inset:0;z-index:8;background:linear-gradient(90deg,rgba(100,207,251,.28),#e6f8ff 50%,rgba(181,125,255,.32));clip-path:polygon(99.68% 0,100% 0,.32% 100%,0 100%);filter:drop-shadow(0 0 8px rgba(115,215,255,.55));pointer-events:none}
.featured-card{position:absolute;inset:0;z-index:2;min-height:560px;overflow:hidden;border:0;border-radius:0;box-shadow:none;isolation:isolate;transition:filter .35s ease}
.featured-card[data-server="CN"]{--server-accent:var(--hero-accent,#ffb300);--server-label-accent:#ff4d64;background:radial-gradient(circle at 70% 25%,color-mix(in srgb,var(--hero-accent) 22%,transparent),transparent 34%),linear-gradient(125deg,#0a1725 0%,color-mix(in srgb,var(--hero-accent) 8%,#151827) 60%,#17130d 100%);clip-path:polygon(0 0,100% 0,0 100%)}
.featured-card[data-server="SEA"]{--server-accent:var(--hero-accent,#ffb300);--server-label-accent:#4ed8ff;background:radial-gradient(circle at 33% 68%,color-mix(in srgb,var(--hero-accent) 19%,transparent),transparent 34%),linear-gradient(125deg,#07111c 0%,color-mix(in srgb,var(--hero-accent) 7%,#082131) 55%,#11160e 100%);clip-path:polygon(100% 0,100% 100%,0 100%)}
.featured-card::before{inset:0;z-index:3;width:auto;pointer-events:none}
.featured-card[data-server="CN"]::before{background:linear-gradient(90deg,rgba(6,16,27,.97) 0%,rgba(6,16,27,.82) 27%,rgba(6,16,27,.18) 58%,transparent 78%)}
.featured-card[data-server="SEA"]::before{background:linear-gradient(270deg,rgba(6,16,27,.97) 0%,rgba(6,16,27,.82) 27%,rgba(6,16,27,.18) 58%,transparent 78%)}
.featured-card::after{display:none}
.featured-card[href]:hover{transform:none;border-color:transparent;box-shadow:none;filter:brightness(1.08) saturate(1.06)}
.featured-card[href]:focus-visible{outline:3px solid var(--server-accent);outline-offset:-6px}
.featured-card__copy{z-index:6;width:46%;height:auto;padding:0}
.featured-card[data-server="CN"] .featured-card__copy{inset:28px auto 43% 28px;align-items:flex-start;text-align:left}
.featured-card[data-server="SEA"] .featured-card__copy{inset:49% 28px 28px auto;align-items:flex-end;text-align:right}
.featured-card[data-server="SEA"] .featured-server{flex-direction:row-reverse}
.featured-card h2{max-width:100%;margin-top:auto;font-size:clamp(45px,4.4vw,72px);line-height:.9;text-shadow:0 9px 32px rgba(0,0,0,.78),0 0 24px color-mix(in srgb,var(--hero-accent) 11%,transparent)}
.featured-card__copy>p{display:block;max-width:100%;margin-top:14px;overflow:visible;color:#c4d0dc;font-size:14px;font-weight:560;line-height:1.5;text-shadow:0 3px 14px rgba(0,0,0,.92);-webkit-line-clamp:unset}
.featured-card[data-server="SEA"] .featured-card__copy>p{margin-left:auto}
.featured-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.featured-card[data-server="SEA"] .featured-meta{justify-content:flex-end}.featured-meta b,.featured-meta span{border:1px solid rgba(137,174,201,.2);border-radius:999px;background:rgba(5,15,25,.72);padding:5px 9px;color:#aec0cf;font-size:8px;font-weight:850;letter-spacing:.065em;text-transform:uppercase;backdrop-filter:blur(8px)}.featured-meta .featured-tier{border-color:color-mix(in srgb,var(--tier-accent) 42%,transparent);background:color-mix(in srgb,var(--tier-accent) 11%,rgba(5,15,25,.76));color:var(--tier-accent)}.featured-meta .featured-type{border-color:color-mix(in srgb,var(--hero-accent) 52%,transparent);background:color-mix(in srgb,var(--hero-accent) 14%,rgba(5,15,25,.76));color:var(--hero-accent);box-shadow:0 0 14px color-mix(in srgb,var(--hero-accent) 9%,transparent)}.featured-meta .featured-faction{border-color:color-mix(in srgb,var(--faction-accent) 38%,transparent);background:color-mix(in srgb,var(--faction-accent) 10%,rgba(5,15,25,.76));color:var(--faction-accent)}
.featured-card .featured-server{color:var(--server-label-accent)}.featured-card .featured-server b{background:var(--server-label-accent)}
.featured-card[data-server="SEA"] .visual-action{align-self:flex-end}
.featured-card__visual{inset:0;z-index:1}
.featured-card[data-server="CN"] .featured-card__visual img{inset:-3% 4% auto auto;height:82%;width:54%;object-fit:contain;object-position:center top;filter:drop-shadow(0 14px 30px rgba(0,0,0,.55)) brightness(1.05) saturate(1.05)}
.featured-card[data-server="SEA"] .featured-card__visual img{inset:auto auto -2% 7%;height:76%;width:61%;object-fit:contain;object-position:left bottom;filter:drop-shadow(0 14px 30px rgba(0,0,0,.55)) brightness(1.04) saturate(1.03)}
.featured-card[data-server="CN"] .energy-ring{right:15%;left:auto;top:1%}.featured-card[data-server="CN"] .ring-two{right:23%;left:auto;top:12%}
.featured-card[data-server="SEA"] .energy-ring{right:auto;left:17%;top:43%}.featured-card[data-server="SEA"] .ring-two{right:auto;left:25%;top:54%}
.featured-card[data-server="CN"] .visual-code{right:18px;left:auto;top:16px}.featured-card[data-server="SEA"] .visual-code{right:auto;left:18px;top:auto;bottom:16px}
.featured-card[data-server="CN"] .visual-glow{right:9%;left:auto;bottom:28%}.featured-card[data-server="SEA"] .visual-glow{right:auto;left:9%;bottom:-22%}
.featured-grid::after{will-change:opacity,filter;animation:diagonalCharge 3.8s ease-in-out infinite}
.featured-card__visual::after{content:"";position:absolute;inset:-38%;z-index:4;background:linear-gradient(105deg,transparent 42%,color-mix(in srgb,var(--server-accent) 15%,transparent) 49%,rgba(255,255,255,.14) 50%,transparent 58%);mix-blend-mode:screen;opacity:0;pointer-events:none;transform:translateX(-55%);animation:featuredSweep 7.5s ease-in-out infinite}
.featured-card[data-server="SEA"] .featured-card__visual::after{animation-delay:1.1s;transform:translateX(55%) rotate(180deg)}
.featured-card[data-server="CN"] .featured-card__copy{animation:featuredCopyLeft .72s cubic-bezier(.18,.82,.24,1) both}
.featured-card[data-server="SEA"] .featured-card__copy{animation:featuredCopyRight .82s .08s cubic-bezier(.18,.82,.24,1) both}
.featured-card .hero-float-img{scale:1;transition:scale .55s cubic-bezier(.18,.82,.24,1),filter .35s;animation:heroFloat 5s ease-in-out infinite,featuredFigureReveal .8s cubic-bezier(.18,.82,.24,1) both!important}
.featured-card[data-server="SEA"] .hero-float-img{animation-delay:0s,.08s!important}
.featured-card[href]:hover .hero-float-img{scale:1.035}.featured-card[href]:hover .energy-ring{filter:brightness(1.35);opacity:.9}.featured-card[href]:hover .featured-meta b,.featured-card[href]:hover .featured-meta span{border-color:color-mix(in srgb,var(--server-accent) 48%,transparent);background:color-mix(in srgb,var(--server-accent) 9%,rgba(5,15,25,.68))}
@keyframes diagonalCharge{0%,100%{opacity:.72;filter:drop-shadow(0 0 5px rgba(115,215,255,.38))}50%{opacity:1;filter:drop-shadow(0 0 10px rgba(115,215,255,.8)) drop-shadow(0 0 24px rgba(181,125,255,.28))}}
@keyframes featuredSweep{0%,58%{opacity:0;transform:translateX(-55%)}68%{opacity:.7}82%,100%{opacity:0;transform:translateX(55%)}}
@keyframes featuredCopyLeft{from{opacity:0;transform:translateX(-22px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}
@keyframes featuredCopyRight{from{opacity:0;transform:translateX(22px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}
@keyframes featuredFigureReveal{from{opacity:0;filter:blur(8px) brightness(.72)}to{opacity:1}}

@media(max-width:1100px){.featured-grid{height:500px}.featured-card{min-height:500px}.featured-card__copy{width:49%}.featured-card[data-server="CN"] .featured-card__copy{inset:22px auto 42% 22px}.featured-card[data-server="SEA"] .featured-card__copy{inset:48% 22px 22px auto}.featured-card h2{font-size:clamp(38px,5.1vw,58px)}.featured-card__copy>p{font-size:13px}.featured-card[data-server="CN"] .featured-card__visual img{right:1%;width:59%}.featured-card[data-server="SEA"] .featured-card__visual img{left:3%;width:65%}}
@media(max-width:700px){.featured-grid{display:grid;height:auto;grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(350px,auto));border-radius:16px;background:#07131e}.featured-grid::after{z-index:8;clip-path:polygon(0 49.25%,100% 46.25%,100% 46.85%,0 49.85%)}.featured-card{position:relative;inset:auto;min-height:350px;clip-path:none!important}.featured-card[data-server="CN"]{grid-row:1;background:radial-gradient(circle at 74% 30%,color-mix(in srgb,var(--hero-accent) 20%,transparent),transparent 30%),linear-gradient(130deg,#071421,#17150e)}.featured-card[data-server="SEA"]{grid-row:2;background:radial-gradient(circle at 25% 70%,color-mix(in srgb,var(--hero-accent) 18%,transparent),transparent 31%),linear-gradient(130deg,#07121d,#13170e)}.featured-card[data-server="CN"]::before{background:linear-gradient(90deg,rgba(6,16,27,.96),rgba(6,16,27,.67) 48%,transparent 80%)}.featured-card[data-server="SEA"]::before{background:linear-gradient(270deg,rgba(6,16,27,.96),rgba(6,16,27,.67) 48%,transparent 80%)}.featured-card__copy{width:63%;height:calc(100% - 32px)}.featured-card[data-server="CN"] .featured-card__copy{inset:16px auto 16px 16px}.featured-card[data-server="SEA"] .featured-card__copy{inset:16px 16px 16px auto}.featured-card h2{font-size:clamp(32px,9vw,46px)}.featured-card__copy>p{font-size:12px}.featured-card[data-server="CN"] .featured-card__visual img{inset:0 -7% 0 auto;height:100%;width:78%;object-position:right bottom}.featured-card[data-server="SEA"] .featured-card__visual img{inset:0 auto 0 -7%;height:100%;width:78%;object-position:left bottom}.featured-card[data-server="CN"] .energy-ring{right:-2%;top:8%}.featured-card[data-server="SEA"] .energy-ring{left:-2%;top:8%}.featured-card[data-server="CN"] .visual-code{right:12px;top:12px}.featured-card[data-server="SEA"] .visual-code{left:12px;top:12px;bottom:auto}.featured-meta{gap:5px;margin-top:9px}.featured-meta b,.featured-meta span{padding:4px 7px;font-size:7px}.featured-card .visual-action{margin-top:11px}}
@media(max-width:430px){.featured-grid{grid-template-rows:repeat(2,minmax(330px,auto))}.featured-card{min-height:330px}.featured-card__copy{width:69%;height:calc(100% - 26px)}.featured-card[data-server="CN"] .featured-card__copy{inset:13px auto 13px 13px}.featured-card[data-server="SEA"] .featured-card__copy{inset:13px 13px 13px auto}.featured-card h2{font-size:clamp(29px,9vw,39px)}.featured-card .hero-pill{margin-top:8px}.featured-card__copy>p{font-size:11px}.featured-card .visual-action{font-size:9px}}
@media(min-width:701px){.featured-card[data-server="CN"][data-character="blacksperm-urplus"] .featured-card__visual img{inset:-18% 18% auto auto;height:80%;width:50%;object-position:center top}}
@media(prefers-reduced-motion:reduce){.ambient,.hero-pill i,.hero-scan,.card-light,.featured-grid::after,.featured-card__copy,.featured-card__visual::after,.featured-card .hero-float-img{animation:none!important}.release-card{animation-duration:.01s!important}.release-card,.release-card__image img,.featured-card,.featured-card .hero-float-img{transition:none!important}.featured-card[href]:hover .hero-float-img{scale:1}.fade-enter-active,.fade-leave-active,.slide-left-enter-active,.slide-left-leave-active,.slide-right-enter-active,.slide-right-leave-active{transition:opacity .16s linear!important}.fade-enter-from,.fade-leave-to,.slide-left-enter-from,.slide-left-leave-to,.slide-right-enter-from,.slide-right-leave-to{opacity:0;filter:none;transform:none}}
</style>
