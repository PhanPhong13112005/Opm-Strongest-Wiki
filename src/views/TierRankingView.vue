<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'
import { safeAssetUrl } from '../utils/assetUrl'
import catalog from '../data/tierRankingCatalog.json'
import { groupCharactersByBand, RANKING_BANDS, RANKING_BASELINE_STATS, baseVotesForCharacter } from '../data/tierRankingModel'
import { authState, hasValidSession } from '../services/authApi'
import { getMyTierVotes, getTierRankings, setTierVote } from '../services/communityApi'

const { locale } = useI18n()
const router = useRouter()
const rarities = ['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R']
const tierBands = RANKING_BANDS

const activeRarity = ref('UR+')
const rarityTabsRef = ref(null)
const summary = ref({ totalVoters: 0, totalVotes: 0, votes: [] })
const myVotes = ref(new Set())
const loading = ref(true)
const votingId = ref('')
const errorMessage = ref('')
const pendingVote = ref(null)
const confirmVoteButtonRef = ref(null)
const votePolicy = ref({
  voteMonth: '',
  resetsAt: '',
  maxVotesPerRarity: 1,
  hasVerifiedContact: false,
  emailVerified: false,
  phoneVerified: false,
})

const activeRarityIndex = computed(() => rarities.indexOf(activeRarity.value))
const canGoToPreviousRarity = computed(() => activeRarityIndex.value > 0)
const canGoToNextRarity = computed(() => activeRarityIndex.value < rarities.length - 1)

const selectRarity = async rarity => {
  activeRarity.value = rarity
  await nextTick()
  rarityTabsRef.value?.children?.[rarities.indexOf(rarity)]?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}

const stepRarity = direction => {
  const nextIndex = Math.min(rarities.length - 1, Math.max(0, activeRarityIndex.value + direction))
  if (nextIndex !== activeRarityIndex.value) selectRarity(rarities[nextIndex])
}

const messages = {
  vi: {
    eyebrow: 'COMMUNITY POWER INDEX',
    title: 'Bảng Xếp Hạng Cộng Đồng',
    intro: 'Bình chọn nhân vật bạn đánh giá mạnh. Phiếu cộng đồng sẽ thay đổi thứ hạng mẫu theo thời gian.',
    disclaimerTitle: 'Không phải kết luận tuyệt đối',
    disclaimer: 'Sức mạnh còn phụ thuộc tuổi server, đội hình, tài nguyên và meta. Bảng này dùng thứ tự trong ảnh làm dữ liệu mẫu rồi cộng thêm bình chọn thật.',
    modelTitle: 'Cách tính phiếu xếp hạng',
    modelCopy: 'Nh\u00e2n v\u1eadt C\u1ed1t L\u00f5i \u0111\u01b0\u1ee3c gi\u1eef trong h\u00e0ng ri\u00eang. C\u00e1c nh\u00e2n v\u1eadt c\u00f2n l\u1ea1i t\u1ef1 \u0111\u1ed9ng l\u00ean SS, S, A, B, C ho\u1eb7c D theo phi\u1ebfu n\u1ec1n c\u1ed9ng phi\u1ebfu c\u1ed9ng \u0111\u1ed3ng th\u1eadt.',
    bandLabels: { CORE: 'Nh\u00e2n v\u1eadt C\u1ed1t L\u00f5i', SS: 'Th\u1ed1ng tr\u1ecb', S: 'R\u1ea5t m\u1ea1nh', A: 'M\u1ea1nh', B: '\u1ed4n \u0111\u1ecbnh', C: 'T\u00ecnh hu\u1ed1ng', D: 'C\u1ea7n \u0111\u1ea7u t\u01b0' },
    participants: 'Người tham gia',
    totalVotes: 'Lượt bình chọn',
    confidence: 'Độ tin cậy',
    veryLow: 'Dữ liệu rất ít',
    collecting: 'Đang thu thập',
    useful: 'Đủ để tham khảo',
    sampleOrder: 'Thứ tự ảnh mẫu + bình chọn cộng đồng',
    liveOrder: 'Thứ tự ảnh mẫu + bình chọn cộng đồng',
    votes: 'phiếu xếp hạng',
    communityVotes: 'phiếu cộng đồng',
    voted: 'Đã bình chọn',
    vote: 'Bình chọn',
    voting: 'Đang lưu...',
    confirmTitle: 'Xác nhận bình chọn',
    confirmCopy: 'Bạn có chắc muốn bình chọn cho nhân vật này?',
    confirmWarning: 'Sau khi xác nhận, phiếu này không thể hủy trong tháng hiện tại.',
    cancelVote: 'Không, quay lại',
    confirmVote: 'Có, bình chọn',
    loginToVote: 'Đăng nhập để bình chọn',
    retry: 'Thử tải lại',
    fallback: 'Chưa kết nối được dữ liệu bình chọn. Bạn vẫn có thể xem thứ tự mẫu.',
    rankAria: 'Hạng',
    openDetail: 'Xem nhân vật',
    noCore: 'Phẩm này chưa có nhân vật Core trong dữ liệu.',
    limitReached: 'Đã đủ lượt tháng',
  },
  en: {
    eyebrow: 'COMMUNITY POWER INDEX',
    title: 'Community Tier Ranking',
    intro: 'Vote for the characters you consider strong. Community votes will adjust the sample order over time.',
    disclaimerTitle: 'Not an absolute verdict',
    disclaimer: 'Power still depends on server age, roster, resources and meta. This ranking starts from the reference images and adds real community votes.',
    modelTitle: 'How ranking votes work',
    modelCopy: 'Core characters stay in a separate row. Everyone else automatically moves through SS, S, A, B, C and D based on base votes plus real community votes.',
    bandLabels: { CORE: 'Core specialist', SS: 'Dominant', S: 'Very strong', A: 'Strong', B: 'Solid', C: 'Situational', D: 'Needs investment' },
    participants: 'Participants',
    totalVotes: 'Votes cast',
    confidence: 'Confidence',
    veryLow: 'Very little data',
    collecting: 'Collecting votes',
    useful: 'Useful sample',
    sampleOrder: 'Reference order + community votes',
    liveOrder: 'Reference order + community votes',
    votes: 'ranking votes',
    communityVotes: 'community votes',
    voted: 'Voted',
    vote: 'Vote',
    voting: 'Saving...',
    confirmTitle: 'Confirm your vote',
    confirmCopy: 'Are you sure you want to vote for this character?',
    confirmWarning: 'Once confirmed, this vote cannot be removed during the current month.',
    cancelVote: 'No, go back',
    confirmVote: 'Yes, vote',
    loginToVote: 'Sign in to vote',
    retry: 'Try again',
    fallback: 'Voting data is unavailable. You can still view the sample order.',
    rankAria: 'Rank',
    openDetail: 'View character',
    noCore: 'No Core character is currently available in this rarity.',
    limitReached: 'Monthly limit reached',
  },
}

const text = computed(() => messages[locale.value === 'en' ? 'en' : 'vi'])
const isAuthenticated = computed(() => Boolean(authState.session) && hasValidSession())
const voteMap = computed(() => new Map(summary.value.votes.map(item => [item.characterId, Number(item.votes || 0)])))
const activeRarityCharacterIds = computed(() => new Set(
  catalog.filter(character => character.tier === activeRarity.value).map(character => character.id),
))
const selectedInActiveRarity = computed(() => [...myVotes.value].filter(
  characterId => activeRarityCharacterIds.value.has(characterId),
).length)
const applyVotePolicy = result => {
  votePolicy.value = {
    voteMonth: String(result?.voteMonth || ''),
    resetsAt: String(result?.resetsAt || ''),
    maxVotesPerRarity: Math.max(0, Number(result?.maxVotesPerRarity ?? 1)),
    hasVerifiedContact: result?.hasVerifiedContact === true,
    emailVerified: result?.emailVerified === true,
    phoneVerified: result?.phoneVerified === true,
  }
}
const voteResetLabel = computed(() => {
  const date = new Date(votePolicy.value.resetsAt)
  if (!votePolicy.value.resetsAt || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
})
const votePolicyMessage = computed(() => {
  const month = votePolicy.value.voteMonth || '--'
  const limit = votePolicy.value.maxVotesPerRarity
  if (locale.value === 'en') {
    return votePolicy.value.hasVerifiedContact
      ? `Month ${month}: verified account, up to ${limit} picks per rarity. Resets at ${voteResetLabel.value}.`
      : `Month ${month}: verify Gmail or phone to increase the limit from ${limit} to 8 picks per rarity. Resets at ${voteResetLabel.value}.`
  }
  return votePolicy.value.hasVerifiedContact
    ? `Tháng ${month}: tài khoản đã xác minh, tối đa ${limit} nhân vật mỗi phẩm. Tự đặt lại lúc ${voteResetLabel.value}.`
    : `Tháng ${month}: xác minh Gmail hoặc SĐT để tăng từ ${limit} lên 8 nhân vật mỗi phẩm. Tự đặt lại lúc ${voteResetLabel.value}.`
})
const displayedParticipants = computed(() => RANKING_BASELINE_STATS.totalParticipants + summary.value.totalVoters)
const displayedTotalVotes = computed(() => RANKING_BASELINE_STATS.totalVotes + summary.value.totalVotes)
const confidenceLabel = computed(() => {
  if (displayedParticipants.value < 5) return text.value.veryLow
  if (displayedParticipants.value < 20) return text.value.collecting
  return text.value.useful
})
const confidenceLevel = computed(() => displayedParticipants.value < 5 ? 'low' : displayedParticipants.value < 20 ? 'medium' : 'good')
const rankedCharacters = computed(() => catalog
  .filter(character => character.tier === activeRarity.value)
  .map(character => {
    const communityVotes = voteMap.value.get(character.id) || 0
    const baseVotes = baseVotesForCharacter(character)
    return {
      ...character,
      communityVotes,
      baseVotes,
      votes: baseVotes + communityVotes,
    }
  })
  .sort((left, right) => right.votes - left.votes || left.baseOrder - right.baseOrder || left.id.localeCompare(right.id)))
const leadingVotes = computed(() => Math.max(1, ...rankedCharacters.value.map(character => character.votes)))
const bandedCharacters = computed(() => groupCharactersByBand(rankedCharacters.value))
const localizedName = character => locale.value === 'en' ? character.nameEn : character.nameVi
const localizedType = character => locale.value === 'en' ? character.typeEn : character.typeVi
const localizedFaction = character => locale.value === 'en' ? character.factionEn : character.factionVi
const localizedBand = band => band === 'CORE' && locale.value !== 'en' ? 'CỐT LÕI' : band
const votePercent = character => Math.round((character.votes / leadingVotes.value) * 100)

const scrollBand = (direction, event) => {
  const scroller = event.currentTarget.closest('.tier-row')?.querySelector('.tier-row__cards')
  if (!scroller) return

  const distance = Math.max(150, Math.floor(scroller.clientWidth * 0.82))
  scroller.scrollBy({ left: direction * distance, behavior: 'smooth' })
}
const loadRanking = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const publicResult = await getTierRankings()
    summary.value = publicResult
    votePolicy.value = { ...votePolicy.value, voteMonth: publicResult.voteMonth || '', resetsAt: publicResult.resetsAt || '' }
    if (isAuthenticated.value) {
      const mine = await getMyTierVotes()
      myVotes.value = new Set(mine.characterIds || [])
      applyVotePolicy(mine)
    } else {
      myVotes.value = new Set()
    }
  } catch (error) {
    errorMessage.value = error?.status ? (error.message || text.value.fallback) : text.value.fallback
    summary.value = { totalVoters: 0, totalVotes: 0, votes: [] }
    myVotes.value = new Set()
  } finally {
    loading.value = false
  }
}

const requestVote = async character => {
  if (!isAuthenticated.value) {
    await router.push({ name: 'login', query: { redirect: '/tier-ranking' } })
    return
  }
  if (votingId.value || myVotes.value.has(character.id)) return
  pendingVote.value = character
  await nextTick()
  confirmVoteButtonRef.value?.focus()
}

const closeVoteConfirmation = () => {
  if (!votingId.value) pendingVote.value = null
}

const confirmVote = async () => {
  const character = pendingVote.value
  if (!character || votingId.value || myVotes.value.has(character.id)) return
  votingId.value = character.id
  errorMessage.value = ''
  try {
    const result = await setTierVote(character.id)
    const nextMyVotes = new Set(myVotes.value)
    nextMyVotes.add(character.id)
    myVotes.value = nextMyVotes

    const nextVotes = summary.value.votes.filter(item => item.characterId !== character.id)
    if (result.votes > 0) nextVotes.push({ characterId: character.id, votes: result.votes })
    summary.value = {
      totalVotes: result.totalVotes,
      totalVoters: result.totalVoters,
      votes: nextVotes,
    }
    applyVotePolicy(result)
    pendingVote.value = null
  } catch (error) {
    errorMessage.value = error?.message || text.value.fallback
    pendingVote.value = null
  } finally {
    votingId.value = ''
  }
}


onMounted(loadRanking)
</script>

<template>
  <main class="tier-page">
    <section class="tier-hero">
      <div class="tier-hero__copy">
        <p class="tier-eyebrow">{{ text.eyebrow }}</p>
        <h1>{{ text.title }}</h1>
        <p class="tier-intro">{{ text.intro }}</p>
        <div class="tier-stats tier-stats--hero" aria-label="Ranking statistics">
          <article><strong>{{ displayedParticipants }}</strong><span>{{ text.participants }}</span></article>
          <article><strong>{{ displayedTotalVotes }}</strong><span>{{ text.totalVotes }}</span></article>
          <article :class="'confidence-' + confidenceLevel"><strong>{{ confidenceLabel }}</strong><span>{{ text.confidence }}</span></article>
        </div>
      </div>
      <div class="tier-hero__side">
        <aside class="tier-disclaimer">
          <span aria-hidden="true">!</span>
          <div><strong>{{ text.disclaimerTitle }}</strong><p>{{ text.disclaimer }}</p></div>
        </aside>
        <div class="ranking-model ranking-model--hero">
          <span aria-hidden="true">100+</span>
          <div><strong>{{ text.modelTitle }}</strong><p>{{ text.modelCopy }}</p></div>
        </div>
        <div v-if="isAuthenticated" class="tier-vote-policy tier-vote-policy--hero" role="status">
          <strong>{{ activeRarity }} · {{ selectedInActiveRarity }}/{{ votePolicy.maxVotesPerRarity }}</strong>
          <span>{{ votePolicyMessage }}</span>
          <RouterLink
            v-if="!votePolicy.hasVerifiedContact"
            to="/account"
            class="tier-vote-policy__verify"
          >
            Xác minh Gmail
          </RouterLink>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="tier-error" role="status">
      <span>{{ errorMessage }}</span>
      <button type="button" @click="loadRanking">{{ text.retry }}</button>
    </div>

    <section class="tier-board">
      <header class="tier-board__header">
        <div class="rarity-nav">
          <button
            type="button"
            class="rarity-nav__arrow"
            :aria-label="locale === 'en' ? 'Previous rarity' : 'Phẩm chất trước'"
            :disabled="!canGoToPreviousRarity"
            @click="stepRarity(-1)"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div ref="rarityTabsRef" class="rarity-tabs" role="tablist" aria-label="Character rarity">
            <button
              v-for="rarity in rarities"
              :key="rarity"
              type="button"
              role="tab"
              :data-rarity="rarity"
              :aria-selected="activeRarity === rarity"
              :class="{ active: activeRarity === rarity }"
              @click="selectRarity(rarity)"
            >
              {{ rarity }}
              <small>{{ catalog.filter(character => character.tier === rarity).length }}</small>
            </button>
          </div>
          <button
            type="button"
            class="rarity-nav__arrow"
            :aria-label="locale === 'en' ? 'Next rarity' : 'Phẩm chất tiếp theo'"
            :disabled="!canGoToNextRarity"
            @click="stepRarity(1)"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <p class="is-sample">
          <span class="status-pulse" />{{ text.sampleOrder }}
        </p>
      </header>

      <Transition name="tier-board-swap" mode="out-in">
      <div v-if="loading" key="loading" class="tier-skeletons" aria-label="Loading">
        <div v-for="index in 8" :key="index" class="tier-skeleton" />
      </div>

      <div v-else :key="activeRarity" class="tier-list">
        <section
          v-for="band in tierBands"
          :key="band"
          class="tier-row"
          :class="'tier-row--' + band.toLowerCase()"
        :style="{ '--tier-index': tierBands.indexOf(band) }">
          <header class="tier-row__label" :data-band-label="localizedBand(band)">
            <strong>{{ localizedBand(band) }}</strong>
            <div v-if="bandedCharacters[band].length > 1" class="tier-row__arrows">
              <button
                type="button"
                class="tier-row__arrow"
                :aria-label="(locale === 'en' ? 'Previous characters in tier ' : 'Nh\u00e2n v\u1eadt tr\u01b0\u1edbc trong h\u1ea1ng ') + band"
                @click="scrollBand(-1, $event)"
              >
                &#8592;
              </button>
              <button
                type="button"
                class="tier-row__arrow"
                :aria-label="(locale === 'en' ? 'Next characters in tier ' : 'Nh\u00e2n v\u1eadt ti\u1ebfp theo trong h\u1ea1ng ') + band"
                @click="scrollBand(1, $event)"
              >
                &#8594;
              </button>
            </div>
          </header>

          <TransitionGroup name="rank-list" tag="ol" class="tier-row__cards" appear>
            <li
              v-if="!bandedCharacters[band].length"
              :key="'empty-' + band"
              class="tier-empty"
            >
              <span aria-hidden="true">◇</span>
              {{ text.noCore }}
            </li>
            <li
              v-for="(character, characterIndex) in bandedCharacters[band]"
              :key="character.id"
              class="rank-card"
            :style="{ '--card-index': characterIndex, animationDelay: (characterIndex * 45) + 'ms' }">
              <RouterLink :to="'/character/' + character.id" class="rank-portrait" :aria-label="text.openDetail + ': ' + localizedName(character)">
                <img :src="safeAssetUrl(character.imageURL)" :alt="localizedName(character)" width="160" height="160" loading="lazy" decoding="async">
                <span :data-rarity="character.tier">{{ character.tier }}</span>
                <Transition name="score-pop" mode="out-in">
                  <b :key="character.votes" class="rank-score" :title="character.votes + ' ' + text.votes">{{ character.votes }}</b>
                </Transition>
              </RouterLink>
              <div class="rank-info">
                <RouterLink :to="'/character/' + character.id">{{ localizedName(character) }}</RouterLink>
                <p class="rank-meta">
                  <span class="rank-meta__tag rank-meta__tag--type">{{ localizedType(character) }}</span>
                  <span class="rank-meta__tag rank-meta__tag--faction">{{ localizedFaction(character) }}</span>
                </p>
                <div class="vote-meter" aria-hidden="true"><span :style="{ width: votePercent(character) + '%' }" /></div>
                <small>{{ character.votes }} {{ text.votes }}<b> · +{{ character.communityVotes }} {{ text.communityVotes }}</b></small>
              </div>
              <button
                type="button"
                class="vote-button"
                :class="{ active: myVotes.has(character.id) }"
                :aria-pressed="myVotes.has(character.id)"
                :disabled="Boolean(votingId) || myVotes.has(character.id) || selectedInActiveRarity >= votePolicy.maxVotesPerRarity"
                :title="myVotes.has(character.id) ? text.confirmWarning : ''"
                @click="requestVote(character)"
              >
                <span aria-hidden="true">{{ myVotes.has(character.id) ? '✓' : '▲' }}</span>
                {{ votingId === character.id ? text.voting : myVotes.has(character.id) ? text.voted : (!myVotes.has(character.id) && selectedInActiveRarity >= votePolicy.maxVotesPerRarity) ? text.limitReached : isAuthenticated ? text.vote : (locale === 'en' ? 'Sign in' : '\u0110\u0103ng nh\u1eadp') }}
              </button>
            </li>
          </TransitionGroup>
        </section>
      </div>
      </Transition>
    </section>
  <Teleport to="body">
    <Transition name="vote-confirm-dialog">
      <div
        v-if="pendingVote"
        class="vote-confirm-backdrop"
        role="presentation"
        @click.self="closeVoteConfirmation"
        @keydown.esc="closeVoteConfirmation"
      >
        <section class="vote-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="vote-confirm-title" aria-describedby="vote-confirm-description">
          <span class="vote-confirm-dialog__icon" aria-hidden="true">!</span>
          <p class="vote-confirm-dialog__eyebrow">{{ pendingVote.tier }} · {{ text.vote }}</p>
          <h2 id="vote-confirm-title">{{ text.confirmTitle }}</h2>
          <div class="vote-confirm-character">
            <img :src="safeAssetUrl(pendingVote.imageURL)" :alt="localizedName(pendingVote)" width="76" height="76">
            <div>
              <strong>{{ localizedName(pendingVote) }}</strong>
              <span>{{ localizedType(pendingVote) }} · {{ localizedFaction(pendingVote) }}</span>
            </div>
          </div>
          <p id="vote-confirm-description">{{ text.confirmCopy }}</p>
          <div class="vote-confirm-warning"><span aria-hidden="true">🔒</span>{{ text.confirmWarning }}</div>
          <footer>
            <button type="button" class="vote-confirm-cancel" :disabled="Boolean(votingId)" @click="closeVoteConfirmation">{{ text.cancelVote }}</button>
            <button ref="confirmVoteButtonRef" type="button" class="vote-confirm-submit" :disabled="Boolean(votingId)" @click="confirmVote">
              {{ votingId ? text.voting : text.confirmVote }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
  </main>
</template>

<style scoped>
.tier-page{width:min(1440px,100%);margin:0 auto;padding:clamp(1rem,3vw,2.5rem) clamp(1rem,3vw,2.5rem) 4rem;color:#edf7ff}
.tier-hero{position:relative;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr);gap:2rem;padding:clamp(1.5rem,4vw,3.5rem);overflow:hidden;border:1px solid #1d4154;border-radius:28px;background:linear-gradient(135deg,rgba(5,28,42,.98),rgba(14,18,34,.98))}
.tier-hero:before{content:"";position:absolute;inset:-50%;background:repeating-radial-gradient(circle at 25% 50%,transparent 0 70px,rgba(83,218,250,.045) 72px 73px);animation:radar-spin 80s linear infinite;pointer-events:none}
.tier-hero>*{position:relative;z-index:1}.tier-eyebrow{color:#5addfa;font:800 .72rem/1.2 ui-monospace,monospace;letter-spacing:.25em}.tier-hero h1{max-width:760px;margin:.65rem 0 .75rem;font-size:clamp(2.2rem,5vw,4.7rem);font-weight:950;line-height:.96;letter-spacing:-.045em}.tier-intro{max-width:700px;color:#a9c2d2;font-size:clamp(1rem,1.5vw,1.18rem);line-height:1.7}
.tier-disclaimer{align-self:center;display:flex;gap:1rem;padding:1.25rem;border:1px solid rgba(255,190,61,.35);border-radius:18px;background:rgba(255,183,38,.07)}.tier-disclaimer>span{display:grid;place-items:center;flex:0 0 40px;height:40px;border-radius:12px;background:#ffb526;color:#07111a;font-weight:950}.tier-disclaimer strong{color:#ffd26f;font-size:1rem}.tier-disclaimer p{margin:.35rem 0 0;color:#b8c7d0;font-size:.9rem;line-height:1.55}
.tier-control-panel{display:grid;grid-template-columns:1.2fr .8fr;gap:1rem;margin:1.25rem 0}.ranking-model{display:flex;align-items:center;gap:1rem;padding:1.1rem 1.25rem;border:1px solid #1b3a4d;border-radius:20px;background:#061520}.ranking-model>span{display:grid;place-items:center;flex:0 0 62px;height:62px;border:1px solid #f2bd57;border-radius:16px;background:rgba(242,189,87,.09);color:#ffd166;font-size:1.15rem;font-weight:950}.ranking-model strong{color:#edf7ff}.ranking-model p{margin:.35rem 0 0;color:#8da7b8;font-size:.82rem;line-height:1.55}
.tier-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}.tier-stats article{display:flex;flex-direction:column;justify-content:center;min-height:92px;padding:1rem;border:1px solid #1b3a4d;border-radius:18px;background:#061520}.tier-stats strong{color:#5addfa;font-size:clamp(1.2rem,2vw,1.8rem)}.tier-stats span{margin-top:.25rem;color:#829bad;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.tier-stats .confidence-low strong{color:#ff8b68}.tier-stats .confidence-medium strong{color:#ffd166}.tier-stats .confidence-good strong{color:#69e5a4}
.tier-error{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:1rem 0;padding:1rem 1.2rem;border:1px solid rgba(255,193,82,.38);border-radius:14px;background:rgba(255,193,82,.08);color:#ffe09a}.tier-error button{padding:.55rem .9rem;border:1px solid currentColor;border-radius:10px;font-weight:800}
.tier-board{border:1px solid #1b3a4d;border-radius:24px;background:linear-gradient(180deg,#061722,#040d15);overflow:hidden}.tier-board__header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;border-bottom:1px solid #19384a}.rarity-tabs{display:flex;gap:.5rem;overflow:auto;scrollbar-width:none}.rarity-tabs button{display:flex;align-items:center;gap:.55rem;min-width:82px;padding:.8rem 1rem;border:1px solid #274355;border-radius:12px;color:#8da7b8;font-weight:950;transition:.2s}.rarity-tabs button.active{border-color:#5addfa;background:#0d3343;color:#fff;box-shadow:0 0 18px rgba(90,221,250,.12)}.rarity-tabs small{display:grid;place-items:center;min-width:24px;height:20px;padding:0 .35rem;border-radius:999px;background:#132b39;color:#5addfa;font-size:.68rem}.tier-board__header>p{display:flex;align-items:center;gap:.5rem;color:#7e9aab;font-size:.78rem}.tier-board__header>p.is-sample{color:#f2bd57}.status-pulse{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.tier-vote-policy{display:flex;align-items:center;gap:.75rem;padding:.8rem 1.2rem;border-bottom:1px solid #19384a;background:rgba(90,221,250,.055);color:#89a9bb;font-size:.78rem}.tier-vote-policy strong{flex:0 0 auto;color:#5addfa;font-size:.82rem}.tier-vote-policy span{line-height:1.45}.tier-vote-policy__verify{flex:0 0 auto;margin-left:auto;border:1px solid rgba(90,221,250,.35);border-radius:.5rem;padding:.42rem .65rem;color:#5addfa;font-size:.7rem;font-weight:900;white-space:nowrap;transition:background .18s ease,color .18s ease}.tier-vote-policy__verify:hover{background:#5addfa;color:#041019}
.ranking-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;padding:1.2rem;list-style:none}.rank-card{position:relative;display:grid;grid-template-columns:50px 112px minmax(0,1fr) auto;align-items:center;gap:1rem;min-height:138px;padding:1rem;border:1px solid #183748;border-radius:18px;background:rgba(7,23,33,.88);transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}.rank-card:hover{transform:translateY(-3px);border-color:#39738c;box-shadow:0 16px 36px rgba(0,0,0,.25)}.rank-card--podium{border-color:rgba(255,190,61,.42);background:linear-gradient(115deg,rgba(255,185,48,.08),rgba(7,23,33,.9) 38%)}.rank-number{font:950 1.35rem/1 ui-monospace,monospace;color:#5addfa;text-align:center}.rank-card--podium .rank-number{color:#ffd166}.rank-portrait{position:relative;display:block;width:112px;height:112px;overflow:hidden;border:1px solid #31566a;border-radius:14px;background:#0e1b25}.rank-portrait img{width:100%;height:100%;object-fit:contain}.rank-portrait span{position:absolute;right:.35rem;top:.35rem;padding:.18rem .38rem;border-radius:6px;background:rgba(3,9,15,.86);color:#ffcf5a;font-size:.7rem;font-weight:950}.rank-info{min-width:0}.rank-info>a{display:block;overflow:hidden;color:#fff;font-size:1.08rem;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.rank-info p{display:flex;align-items:center;gap:.45rem;margin:.35rem 0;color:#8ca8b9;font-size:.78rem}.rank-info p i{width:3px;height:3px;border-radius:50%;background:#4a6b7c}.vote-meter{height:5px;margin:.8rem 0 .4rem;overflow:hidden;border-radius:999px;background:#102b39}.vote-meter span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#45ccec,#9170ff);transition:width .4s ease}.rank-info small{color:#79a0b4}.rank-info small b{color:#b9d7e6}.vote-button{display:flex;align-items:center;justify-content:center;gap:.45rem;min-width:128px;padding:.75rem .85rem;border:1px solid #2a596f;border-radius:12px;color:#b7d7e5;font-size:.78rem;font-weight:900;transition:.2s}.vote-button:hover:not(:disabled){border-color:#5addfa;background:#0e3444;color:#fff}.vote-button.active{border-color:#70e1a8;background:rgba(66,204,135,.13);color:#7aefb5}.vote-button:disabled{cursor:not-allowed;opacity:.6}.vote-button.active:disabled{cursor:default;opacity:1}
.tier-skeletons{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;padding:1.2rem}.tier-skeleton{height:138px;border-radius:18px;background:linear-gradient(90deg,#081b27 25%,#102b3a 50%,#081b27 75%);background-size:200% 100%;animation:skeleton 1.4s infinite}
.tier-list{display:grid;gap:1px;background:#173647}.tier-row{display:grid;grid-template-columns:116px minmax(0,1fr);min-height:180px;background:#06131d}.tier-row__label{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.45rem;padding:1rem;text-align:center;border-right:1px solid rgba(255,255,255,.1)}.tier-row__label strong{font-size:2rem;font-weight:950;line-height:1}.tier-row__label span{font-size:.7rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em;opacity:.85}.tier-row--ss .tier-row__label{background:#7f1d3f;color:#ffd8e6}.tier-row--s .tier-row__label{background:#922f4f;color:#ffe0e9}.tier-row--a .tier-row__label{background:#b4533d;color:#fff0db}.tier-row--b .tier-row__label{background:#9a6a22;color:#fff1b8}.tier-row--c .tier-row__label{background:#376f67;color:#d9fff8}.tier-row--d .tier-row__label{background:#43546a;color:#e4efff}.tier-row__cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:.7rem;padding:.8rem;list-style:none}.tier-row .rank-card{grid-template-columns:86px minmax(0,1fr);align-items:center;gap:.75rem;min-height:150px;padding:.75rem}.tier-row .rank-portrait{width:86px;height:104px}.tier-row .rank-info>a{font-size:.95rem}.tier-row .vote-button{grid-column:1/3;width:100%;min-width:0;padding:.58rem .7rem}.rank-list-enter-active,.rank-list-leave-active,.rank-list-move{transition:all .35s ease}.rank-list-enter-from,.rank-list-leave-to{opacity:0;transform:translateY(14px)}
@keyframes radar-spin{to{transform:rotate(360deg)}}@keyframes skeleton{to{background-position:-200% 0}}
@media(max-width:1050px){.tier-hero,.tier-control-panel{grid-template-columns:1fr}.ranking-grid{grid-template-columns:1fr}}
@media(max-width:680px){.tier-page{padding:1rem .75rem 3rem}.tier-hero{padding:1.35rem;border-radius:20px}.tier-disclaimer{padding:1rem}.ranking-model{align-items:flex-start;padding:1rem}.ranking-model>span{flex-basis:52px;height:52px}.tier-stats{gap:.45rem}.tier-stats article{min-height:78px;padding:.7rem}.tier-stats strong{font-size:1.05rem}.tier-stats span{font-size:.6rem}.tier-board__header{align-items:flex-start;flex-direction:column}.tier-board__header>p{padding-left:.2rem}.ranking-grid,.tier-skeletons{grid-template-columns:1fr;padding:.7rem}.rank-card{grid-template-columns:34px 82px minmax(0,1fr);gap:.7rem;min-height:128px;padding:.75rem}.rank-portrait{width:82px;height:96px}.rank-number{font-size:1rem}.rank-info>a{font-size:.95rem}.rank-info p{align-items:flex-start;flex-direction:column;gap:.15rem}.rank-info p i{display:none}.vote-button{grid-column:2/4;width:100%;min-width:0}.rarity-tabs{width:100%}.rarity-tabs button{flex:1;justify-content:center;min-width:78px;padding:.7rem .65rem}}
@media(max-width:680px){.tier-row{grid-template-columns:1fr}.tier-row__label{align-items:center;flex-direction:row;justify-content:flex-start;min-height:58px;padding:.8rem 1rem;border-right:0;border-bottom:1px solid rgba(255,255,255,.1);text-align:left}.tier-row__label strong{font-size:1.45rem}.tier-row__cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;padding:.55rem}.tier-row .rank-card{display:flex;flex-direction:column;align-items:stretch;gap:.55rem;min-width:0;padding:.55rem}.tier-row .rank-portrait{width:100%;height:auto;aspect-ratio:1/1}.tier-row .rank-info>a{font-size:.82rem}.tier-row .rank-info p{font-size:.67rem}.tier-row .vote-button{font-size:.68rem}.tier-row .rank-info small{font-size:.63rem}}
/* Classic tier-board presentation: compact portraits, strong tier colors and horizontal mobile rows. */
.tier-hero{isolation:isolate;border-color:#285267;background:radial-gradient(circle at 12% 5%,rgba(65,211,246,.18),transparent 36%),radial-gradient(circle at 92% 100%,rgba(147,84,255,.2),transparent 38%),linear-gradient(135deg,#061c2a 0%,#090d1c 65%,#171025 100%);box-shadow:0 28px 80px rgba(0,0,0,.28)}
.tier-hero:after{content:"CORE  SS  S  A  B  C  D";position:absolute;right:-1rem;bottom:-1.5rem;z-index:0;color:rgba(255,255,255,.035);font:950 clamp(3.5rem,8vw,8rem)/1 sans-serif;letter-spacing:-.08em;white-space:nowrap;pointer-events:none}
.tier-board{border-color:#285267;background:linear-gradient(180deg,rgba(7,25,37,.98),rgba(3,12,20,.99));box-shadow:0 28px 80px rgba(0,0,0,.25)}
.tier-board__header{background:rgba(4,17,27,.92)}
.rarity-tabs button{position:relative;overflow:hidden}.rarity-tabs button:after{content:"";position:absolute;right:0;bottom:0;left:0;height:3px;background:#5addfa;transform:scaleX(0);transition:transform .25s ease}.rarity-tabs button.active:after{transform:scaleX(1)}
.tier-list{display:grid;gap:.75rem;padding:.75rem;background:transparent}
.tier-row{--tier-accent:#6c8297;display:grid;grid-template-columns:120px minmax(0,1fr);min-height:0;overflow:hidden;border:1px solid color-mix(in srgb,var(--tier-accent) 58%,#19384a);border-radius:18px;background:linear-gradient(100deg,color-mix(in srgb,var(--tier-accent) 11%,#06131d),#06131d 30%);box-shadow:0 10px 28px rgba(0,0,0,.18)}
.tier-row--ss{--tier-accent:#ff4778}.tier-row--s{--tier-accent:#ff715b}.tier-row--a{--tier-accent:#ffb638}.tier-row--b{--tier-accent:#e1d64b}.tier-row--c{--tier-accent:#48c9a8}.tier-row--d{--tier-accent:#6f8ba7}
.tier-row__label{position:relative;isolation:isolate;gap:.55rem;overflow:hidden;border:0;border-right:1px solid rgba(255,255,255,.14);background:linear-gradient(145deg,color-mix(in srgb,var(--tier-accent) 88%,#fff 4%),color-mix(in srgb,var(--tier-accent) 58%,#07121b));color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.35)}
.tier-row__label:before{content:"";position:absolute;inset:-35%;z-index:-1;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.18) 50%,transparent 65%);transform:translateX(-60%) rotate(12deg);transition:transform .55s ease}.tier-row:hover .tier-row__label:before{transform:translateX(60%) rotate(12deg)}
.tier-row__label:after{content:"TIER";position:absolute;right:-.2rem;bottom:-.5rem;z-index:-1;color:rgba(255,255,255,.12);font:950 2.5rem/1 sans-serif;transform:rotate(-90deg)}
.tier-row__label strong{font-size:clamp(2rem,3vw,3.1rem);letter-spacing:-.08em}.tier-row__label span{max-width:94px;color:rgba(255,255,255,.9);font-size:.66rem;line-height:1.35}
.tier-row__cards{display:grid;grid-template-columns:repeat(auto-fill,146px);gap:.7rem;align-items:start;min-width:0;padding:.75rem;overflow-x:auto;scrollbar-color:var(--tier-accent) #0b202c;scrollbar-width:thin}
.tier-row .rank-card{display:flex;flex-direction:column;gap:.42rem;width:146px;min-height:238px;padding:.42rem;overflow:hidden;border:1px solid #28485a;border-radius:13px;background:linear-gradient(180deg,#102633,#07141d);box-shadow:0 8px 18px rgba(0,0,0,.2);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
.tier-row .rank-card:hover{z-index:2;transform:translateY(-5px);border-color:var(--tier-accent);box-shadow:0 14px 28px rgba(0,0,0,.35),0 0 0 1px color-mix(in srgb,var(--tier-accent) 45%,transparent)}
.tier-row .rank-portrait{flex:0 0 auto;width:100%;height:auto;aspect-ratio:1/1;overflow:hidden;border:1px solid color-mix(in srgb,var(--tier-accent) 48%,#31566a);border-radius:9px;background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--tier-accent) 18%,#142a37),#08131c 70%)}
.tier-row .rank-portrait:after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent 28%,transparent 72%,rgba(0,0,0,.32));pointer-events:none}
.tier-row .rank-portrait img{object-fit:contain;transition:transform .3s ease}.tier-row .rank-card:hover .rank-portrait img{transform:scale(1.045)}
.tier-row .rank-portrait>span{top:.32rem;right:auto;left:.32rem;z-index:2;border:1px solid rgba(255,255,255,.16);background:rgba(3,9,15,.78);backdrop-filter:blur(5px)}
.rank-score{position:absolute;right:.34rem;bottom:.34rem;z-index:2;display:flex;align-items:center;justify-content:center;min-width:38px;height:28px;padding:0 .42rem;border:1px solid color-mix(in srgb,var(--tier-accent) 75%,#fff);border-radius:999px;background:rgba(2,9,15,.88);color:#fff;font:950 .77rem/1 ui-monospace,monospace;box-shadow:0 4px 14px rgba(0,0,0,.35)}
.rank-score:before{content:"▲";margin-right:.2rem;color:var(--tier-accent);font-size:.58rem}
.tier-row .rank-info{display:flex;flex:1;flex-direction:column;min-height:0;padding:.08rem .15rem}.tier-row .rank-info>a{font-size:.84rem;line-height:1.25}.tier-row .rank-info p{display:block;overflow:hidden;margin:.2rem 0;color:#83a3b4;font-size:.65rem;text-overflow:ellipsis;white-space:nowrap}.tier-row .rank-info p i{display:none}.tier-row .vote-meter{height:3px;margin:auto 0 .25rem}.tier-row .vote-meter span{background:linear-gradient(90deg,var(--tier-accent),#63dcff)}.tier-row .rank-info small{display:flex;justify-content:space-between;gap:.25rem;color:#d6e8f1;font-size:.62rem;white-space:nowrap}.tier-row .rank-info small b{overflow:hidden;color:var(--tier-accent);text-overflow:ellipsis}
.tier-row .vote-button{grid-column:auto;width:100%;min-width:0;min-height:34px;padding:.42rem .35rem;border-color:color-mix(in srgb,var(--tier-accent) 48%,#2a596f);border-radius:8px;background:color-mix(in srgb,var(--tier-accent) 8%,transparent);font-size:.65rem;line-height:1.15}.tier-row .vote-button:hover:not(:disabled){border-color:var(--tier-accent);background:color-mix(in srgb,var(--tier-accent) 18%,#07141d)}.tier-row .vote-button.active{border-color:#70e1a8;background:rgba(66,204,135,.16)}
.rank-list-enter-active,.rank-list-leave-active,.rank-list-move{transition:opacity .35s ease,transform .35s cubic-bezier(.22,1,.36,1)}.rank-list-enter-from{opacity:0;transform:translateX(20px) scale(.96)}.rank-list-leave-to{opacity:0;transform:translateY(-10px) scale(.94)}
@media(max-width:680px){.tier-page{padding:.65rem .55rem 2.5rem}.tier-hero{padding:1.2rem;border-radius:18px}.tier-hero h1{font-size:clamp(2rem,11vw,3rem)}.tier-control-panel{margin:.8rem 0}.tier-board{border-radius:17px}.tier-board__header{gap:.7rem;padding:.75rem}.tier-board__header>p{font-size:.68rem}.rarity-tabs button{min-width:70px;padding:.66rem .58rem}.tier-list{gap:.48rem;padding:.48rem}.tier-row{grid-template-columns:58px minmax(0,1fr);border-radius:12px}.tier-row__label{min-height:0;padding:.55rem .25rem;border-right:1px solid rgba(255,255,255,.14);border-bottom:0}.tier-row__label strong{font-size:1.55rem}.tier-row__label span{max-height:74px;font-size:.55rem;line-height:1.1;writing-mode:vertical-rl;transform:rotate(180deg)}.tier-row__label:after{display:none}.tier-row__cards{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:128px;gap:.48rem;padding:.5rem;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x proximity}.tier-row .rank-card{width:128px;min-height:222px;padding:.38rem;scroll-snap-align:start}.tier-row .rank-info>a{font-size:.76rem}.tier-row .rank-info p{font-size:.58rem}.tier-row .rank-info small{font-size:.56rem}.tier-row .vote-button{min-height:36px;font-size:.59rem;white-space:normal}.rank-score{height:25px;min-width:34px;font-size:.68rem}}
/* Compact pass: remove text overflow and keep every tier row scan-friendly. */
.tier-row{grid-template-columns:104px minmax(0,1fr)}
.tier-row__label strong{font-size:clamp(1.9rem,2.6vw,2.7rem)}
.tier-row__cards{grid-template-columns:repeat(auto-fill,136px);gap:.6rem;padding:.62rem}
.tier-row .rank-card{width:136px;min-height:216px;padding:.38rem;gap:.34rem;border-radius:12px}
.tier-row .rank-portrait{border-radius:8px}
.tier-row .rank-info{box-sizing:border-box;width:100%;min-width:0;padding:.05rem .12rem}
.tier-row .rank-info>a{display:-webkit-box;width:100%;min-height:2.3em;overflow:hidden;font-size:.79rem;line-height:1.15;text-align:left;text-overflow:ellipsis;white-space:normal;word-break:break-word;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.tier-row .rank-info p{width:100%;margin:.14rem 0;font-size:.59rem;text-align:left}
.tier-row .rank-info small{display:none}
.tier-row .vote-meter{width:100%;height:3px;margin:auto 0 .1rem}
.tier-row .vote-button{min-height:31px;padding:.36rem .3rem;font-size:.62rem;white-space:normal}
@media(max-width:680px){.tier-row{grid-template-columns:50px minmax(0,1fr)}.tier-row__label{padding:.45rem .18rem}.tier-row__label strong{font-size:1.35rem}.tier-row__label span{max-height:64px;font-size:.5rem}.tier-row__cards{grid-auto-columns:116px;gap:.42rem;padding:.42rem}.tier-row .rank-card{width:116px;min-height:194px;padding:.34rem}.tier-row .rank-info>a{font-size:.69rem}.tier-row .rank-info p{display:none}.tier-row .vote-button{min-height:31px;font-size:.56rem}.rank-score{right:.25rem;bottom:.25rem;height:23px;min-width:31px;padding:0 .32rem;font-size:.64rem}}
/* CORE is a role category, not a raw-power tier. */
.tier-row--core{--tier-accent:#f3c84b;background:linear-gradient(100deg,rgba(243,200,75,.12),#06131d 30%)}
.tier-row--core .tier-row__label{background:linear-gradient(145deg,#ffe58a,#c99218);color:#171407;text-shadow:none}
.tier-row--core .tier-row__label strong{font-size:1.05rem;line-height:1.15;letter-spacing:.04em}
.tier-row--core .tier-row__label:after{content:attr(data-band-label);color:rgba(23,20,7,.13)}
.tier-empty{display:flex;grid-column:span 3;align-items:center;gap:.7rem;min-height:92px;width:min(390px,100%);padding:1rem 1.1rem;border:1px dashed color-mix(in srgb,var(--tier-accent) 48%,#31566a);border-radius:12px;background:color-mix(in srgb,var(--tier-accent) 7%,#07141d);color:#93adbb;font-size:.78rem;line-height:1.5;list-style:none}
.tier-empty>span{display:grid;place-items:center;flex:0 0 34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--tier-accent) 18%,#102633);color:var(--tier-accent);font-size:1.15rem}
@media(max-width:680px){.tier-row--core .tier-row__label strong{font-size:.68rem;letter-spacing:.03em}.tier-empty{grid-column:auto;width:230px;min-height:82px;padding:.8rem;font-size:.69rem}}
/* Motion system: directional tab swap, staggered dealing and immediate vote feedback. */
.tier-list{transform-origin:50% 0;perspective:900px}
.tier-board-swap-enter-active{animation:tier-board-enter .48s cubic-bezier(.16,1,.3,1) both}
.tier-board-swap-leave-active{animation:tier-board-leave .18s ease-in both}
.tier-board-swap-enter-active .tier-row{animation:tier-row-enter .52s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--tier-index) * 55ms)}
.rank-list-enter-active{animation:rank-card-deal .52s cubic-bezier(.16,1,.3,1) both}
.rank-list-enter-from{opacity:0;filter:blur(5px);transform:translateX(30px) rotateY(-10deg) scale(.9)}
.rank-list-leave-active{position:absolute;transition:opacity .18s ease,transform .18s ease}
.rank-list-leave-to{opacity:0;transform:translateY(-12px) scale(.92)}
.rank-list-move{transition:transform .58s cubic-bezier(.16,1,.3,1)}
.rarity-tabs button.active{animation:rarity-activate .38s cubic-bezier(.16,1,.3,1)}
.rarity-tabs button.active:before{content:"";position:absolute;inset:50%;border-radius:999px;background:rgba(90,221,250,.2);animation:tab-ripple .55s ease-out both;pointer-events:none}
.tier-row__label strong{animation:tier-label-glow 3.4s ease-in-out infinite}
.status-pulse{animation:status-breathe 1.8s ease-in-out infinite}
.tier-row .rank-portrait:before{content:"";position:absolute;top:-40%;bottom:-40%;left:-75%;z-index:2;width:34%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.24),transparent);transform:skewX(-18deg);transition:left .55s ease;pointer-events:none}.tier-row .rank-card:hover .rank-portrait:before{left:135%}
.score-pop-enter-active{animation:score-burst .42s cubic-bezier(.16,1,.3,1)}.score-pop-leave-active{position:absolute;opacity:0}
.vote-button.active{animation:vote-confirm .45s cubic-bezier(.16,1,.3,1)}.vote-button.active span{animation:vote-icon .7s ease}
@keyframes rank-card-deal{from{opacity:0;filter:blur(5px);transform:translateX(30px) rotateY(-10deg) scale(.9)}to{opacity:1;filter:blur(0);transform:none}}
@keyframes tier-board-enter{from{opacity:0;filter:blur(6px);transform:translateX(34px) scale(.985)}to{opacity:1;filter:blur(0);transform:none}}
@keyframes tier-board-leave{to{opacity:0;filter:blur(3px);transform:translateX(-22px) scale(.99)}}
@keyframes tier-row-enter{from{opacity:0;transform:translateY(22px) rotateX(-4deg)}to{opacity:1;transform:none}}
@keyframes rarity-activate{0%{transform:scale(.95)}65%{transform:scale(1.045)}100%{transform:scale(1)}}
@keyframes tab-ripple{from{inset:50%;opacity:1}to{inset:-20%;opacity:0}}
@keyframes tier-label-glow{0%,100%{filter:drop-shadow(0 0 0 transparent);transform:translateY(0)}50%{filter:drop-shadow(0 0 9px rgba(255,255,255,.3));transform:translateY(-2px)}}
@keyframes status-breathe{0%,100%{opacity:.55;transform:scale(.8);box-shadow:0 0 0 0 currentColor}50%{opacity:1;transform:scale(1);box-shadow:0 0 0 5px transparent}}
@keyframes score-burst{0%{opacity:0;transform:scale(.45) rotate(-12deg)}65%{transform:scale(1.22) rotate(3deg)}100%{opacity:1;transform:scale(1)}}
@keyframes vote-confirm{0%{transform:scale(.96)}55%{transform:scale(1.04);box-shadow:0 0 0 5px rgba(112,225,168,.13)}100%{transform:scale(1);box-shadow:none}}
@keyframes vote-icon{0%,100%{transform:none}35%{transform:translateY(-4px) rotate(-8deg)}65%{transform:translateY(1px) rotate(5deg)}}
.tier-row__arrows{display:none}
.tier-row__arrow{display:grid;place-items:center;border:1px solid rgba(255,255,255,.24);background:rgba(3,12,20,.22);color:inherit;font-weight:950}
/* Final phone layout: compact summary, readable tier headers and thumb-friendly horizontal cards. */
@media(max-width:680px){
  .tier-page{padding:.5rem .45rem 2.5rem}
  .tier-hero{gap:.75rem;padding:1rem;border-radius:16px}
  .tier-eyebrow{font-size:.58rem;letter-spacing:.18em}
  .tier-hero h1{margin:.42rem 0 .5rem;font-size:clamp(1.75rem,9vw,2.2rem);line-height:1.02}
  .tier-intro{font-size:.82rem;line-height:1.5}
  .tier-disclaimer{gap:.65rem;padding:.72rem;border-radius:12px}
  .tier-disclaimer>span{flex-basis:30px;height:30px;border-radius:8px;font-size:.75rem}
  .tier-disclaimer strong{font-size:.78rem}
  .tier-disclaimer p{margin:.18rem 0 0;font-size:.7rem;line-height:1.42}
  .tier-control-panel{gap:.5rem;margin:.6rem 0}
  .ranking-model{gap:.65rem;padding:.72rem;border-radius:14px}
  .ranking-model>span{flex-basis:42px;height:42px;border-radius:11px;font-size:.78rem}
  .ranking-model strong{font-size:.78rem}
  .ranking-model p{margin:.18rem 0 0;font-size:.68rem;line-height:1.4}
  .tier-stats{gap:.35rem}
  .tier-stats article{min-height:64px;padding:.5rem;border-radius:12px}
  .tier-stats strong{font-size:1rem}
  .tier-stats span{font-size:.5rem;line-height:1.25;letter-spacing:.045em}
  .tier-board{border-radius:15px}
  .tier-board__header{gap:.5rem;padding:.6rem}
  .tier-board__header>p{margin:0;padding:0;font-size:.61rem;line-height:1.35}
  .rarity-tabs{gap:.34rem}
  .rarity-tabs button{min-width:70px;min-height:44px;gap:.3rem;padding:.52rem .42rem;border-radius:10px;font-size:.78rem}
  .rarity-tabs small{min-width:20px;height:18px;padding:0 .25rem;font-size:.58rem}
  .tier-list{gap:.55rem;padding:.42rem}
  .tier-row{grid-template-columns:minmax(0,1fr);border-radius:13px}
  .tier-row__label{align-items:center;flex-direction:row;justify-content:flex-start;gap:.55rem;min-height:46px;padding:.5rem .72rem;border-right:0;border-bottom:1px solid rgba(255,255,255,.14);text-align:left}
  .tier-row__label strong{font-size:1.35rem;letter-spacing:-.04em}
  .tier-row__label span{max-width:none;max-height:none;font-size:.58rem;line-height:1.2;writing-mode:horizontal-tb;transform:none}
  .tier-row__label:after{display:none}
  .tier-row__arrows{display:flex;flex:0 0 auto;gap:.35rem;margin-left:auto}
  .tier-row__arrow{width:40px;height:40px;border-radius:10px;font-size:1rem;line-height:1;touch-action:manipulation;transition:transform .18s ease,background .18s ease}
  .tier-row__arrow:active{transform:scale(.92);background:rgba(3,12,20,.4)}
  .tier-row--core .tier-row__label strong{font-size:.92rem;letter-spacing:.07em}
  .tier-row__cards{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:158px;gap:.48rem;padding:.5rem;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;scroll-padding-inline:.5rem;touch-action:pan-x;-webkit-overflow-scrolling:touch}
  .tier-row .rank-card{width:100%;min-height:238px;gap:.4rem;padding:.42rem;border-radius:11px;scroll-snap-align:start}
  .tier-row .rank-info{padding:.08rem .14rem}
  .tier-row .rank-info>a{min-height:2.25em;font-size:.78rem;line-height:1.14}
  .tier-row .rank-info p{display:block;margin:.12rem 0;font-size:.58rem}
  .tier-row .vote-meter{margin:auto 0 .15rem}
  .tier-row .vote-button{flex:0 0 44px;height:44px;min-height:44px;padding:.48rem .35rem;font-size:.64rem;line-height:1.2}
  .rank-score{right:.28rem;bottom:.28rem;height:25px;min-width:34px;padding:0 .36rem;font-size:.66rem}
  .tier-empty{width:min(78vw,270px);min-height:78px;padding:.72rem;font-size:.68rem;scroll-snap-align:start}
}
@media(max-width:370px){
  .tier-page{padding-inline:.35rem}
  .tier-hero{padding:.85rem}
  .tier-row__cards{grid-auto-columns:152px}
  .rarity-tabs button{min-width:66px;padding-inline:.32rem}
}
@media(max-width:680px){.tier-vote-policy{align-items:flex-start;flex-direction:column;gap:.3rem;padding:.7rem .75rem}.tier-vote-policy strong{font-size:.76rem}.tier-vote-policy span{font-size:.68rem}.tier-vote-policy__verify{margin:4px 0 0;font-size:.66rem}}
/* Keep the ranking totals visible in the first viewport. */
.tier-hero{align-items:center;padding:clamp(1.25rem,2.7vw,2.4rem)}
.tier-hero__copy{min-width:0}
.tier-hero h1{font-size:clamp(2.2rem,4.2vw,4.15rem)}
.tier-intro{line-height:1.55}
.tier-stats--hero{max-width:720px;margin-top:1rem;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem}
.tier-stats--hero article{min-height:68px;padding:.7rem .85rem;border-color:rgba(90,221,250,.22);background:rgba(4,17,27,.68);backdrop-filter:blur(8px)}
.tier-control-panel{grid-template-columns:1fr;margin:.85rem 0}
@media(max-width:680px){.tier-stats--hero{margin-top:.75rem}.tier-stats--hero article{min-height:58px;padding:.45rem}}/* Keep confidence descriptive without competing with the numeric totals. */
.tier-stats--hero article[class^="confidence-"] strong{font-size:clamp(1rem,1.45vw,1.35rem);line-height:1.15;letter-spacing:-.02em;text-wrap:balance}
.tier-stats--hero article:not([class]) strong{font-variant-numeric:tabular-nums;line-height:1}
@media(max-width:680px){.tier-stats--hero{grid-template-columns:repeat(2,minmax(0,1fr))}.tier-stats--hero article[class^="confidence-"]{grid-column:1/-1;min-height:54px}.tier-stats--hero article[class^="confidence-"] strong{font-size:1rem}}
/* Readable, distinct Type and Faction badges on every character card. */
.tier-row .rank-info .rank-meta{display:flex;flex-wrap:wrap;align-content:flex-start;gap:.25rem;width:100%;min-height:2.15rem;margin:.25rem 0 .35rem;overflow:visible;white-space:normal}
.rank-meta__tag{display:inline-flex;align-items:center;min-height:22px;max-width:100%;padding:.2rem .4rem;border:1px solid rgba(255,255,255,.13);border-radius:6px;font-size:.67rem;font-weight:850;line-height:1.15;letter-spacing:.01em}
.rank-meta__tag--type{border-color:rgba(90,221,250,.34);background:rgba(90,221,250,.1);color:#93edff}
.rank-meta__tag--faction{border-color:rgba(255,201,92,.34);background:rgba(255,201,92,.1);color:#ffe19b}
@media(max-width:680px){.tier-row .rank-info .rank-meta{display:flex;gap:.22rem;min-height:2rem;margin:.2rem 0 .28rem}.rank-meta__tag{min-height:21px;padding:.18rem .34rem;font-size:.63rem}}
/* Surface the monthly vote allowance in the first viewport. */
.tier-hero__side{align-self:center;display:grid;gap:.85rem;min-width:0}
.tier-vote-policy--hero{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.5rem .8rem;padding:1rem 1.1rem;border:1px solid rgba(90,221,250,.3);border-radius:16px;background:linear-gradient(115deg,rgba(8,47,63,.9),rgba(7,24,36,.92));color:#b9d7e5;font-size:.78rem;box-shadow:0 12px 30px rgba(0,0,0,.2)}
.tier-vote-policy--hero strong{padding:.38rem .55rem;border-radius:9px;background:rgba(90,221,250,.11);color:#67e4ff;font-size:.84rem;white-space:nowrap}
.tier-vote-policy--hero span{line-height:1.5}
.tier-vote-policy--hero .tier-vote-policy__verify{margin:0;border-color:rgba(90,221,250,.48);border-radius:.6rem;padding:.55rem .75rem;font-size:.72rem;transition:background .18s ease,color .18s ease,transform .18s ease}
.tier-vote-policy--hero .tier-vote-policy__verify:hover{transform:translateY(-1px)}
@media(max-width:680px){.tier-hero__side{gap:.55rem}.tier-vote-policy--hero{grid-template-columns:1fr;gap:.4rem;padding:.75rem;border-radius:12px}.tier-vote-policy--hero strong{justify-self:start;font-size:.76rem}.tier-vote-policy--hero span{font-size:.68rem}.tier-vote-policy--hero .tier-vote-policy__verify{justify-self:stretch;margin-top:.1rem;text-align:center;font-size:.68rem}}
@media(prefers-reduced-motion:reduce){.tier-hero:before,.tier-skeleton,.tier-board-swap-enter-active,.tier-board-swap-leave-active,.tier-board-swap-enter-active .tier-row,.rarity-tabs button.active,.rarity-tabs button.active:before,.tier-row__label strong,.status-pulse,.score-pop-enter-active,.rank-list-enter-active,.vote-button.active,.vote-button.active span{animation:none}.rank-card,.rank-list-enter-active,.rank-list-leave-active,.rank-list-move,.vote-meter span{transition:none}}
/* Rarity navigation arrows keep SR and R reachable on narrow screens. */
.rarity-nav{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.4rem;min-width:0}
.rarity-tabs::-webkit-scrollbar{display:none}
.rarity-nav__arrow{display:grid;place-items:center;width:38px;height:38px;border:1px solid #31566a;border-radius:10px;background:#0b2837;color:#71e5ff;font-size:1.5rem;font-weight:950;line-height:1;transition:transform .18s ease,border-color .18s ease,background .18s ease,opacity .18s ease}
.rarity-nav__arrow:hover:not(:disabled){transform:translateY(-1px);border-color:#5addfa;background:#104052}
.rarity-nav__arrow:active:not(:disabled){transform:scale(.92)}
.rarity-nav__arrow:disabled{cursor:default;opacity:.3}
@media(max-width:680px){.rarity-nav{width:100%;gap:.3rem}.rarity-nav__arrow{width:38px;height:44px;border-radius:10px;font-size:1.45rem;touch-action:manipulation}.rarity-tabs{width:100%;scroll-snap-type:x proximity}.rarity-tabs button{scroll-snap-align:center}}
@media(prefers-reduced-motion:reduce){.rarity-nav__arrow{transition:none}}
.tier-row__label:after{display:none}
.rarity-tabs button[data-rarity^="UR"],.tier-row .rank-portrait>span[data-rarity^="UR"]{color:#ff5b5b;text-shadow:0 0 10px rgba(255,91,91,.35)}
.rarity-tabs button[data-rarity^="SSR"],.tier-row .rank-portrait>span[data-rarity^="SSR"]{color:#ffd45a;text-shadow:0 0 10px rgba(255,212,90,.3)}
.rarity-tabs button[data-rarity="SR"],.tier-row .rank-portrait>span[data-rarity="SR"]{color:#c783ff;text-shadow:0 0 10px rgba(199,131,255,.35)}
.rarity-tabs button[data-rarity="R"],.tier-row .rank-portrait>span[data-rarity="R"]{color:#5aaeff;text-shadow:0 0 10px rgba(90,174,255,.35)}
.tier-hero__side{gap:.45rem}
.tier-hero__side .tier-vote-policy--hero{align-items:start;gap:.7rem 1rem;padding:1.15rem 1.25rem;font-size:.95rem}
.tier-hero__side .tier-vote-policy--hero strong{padding:.48rem .68rem;font-size:1rem}
.tier-hero__side .tier-vote-policy--hero span{font-size:.95rem;line-height:1.65}
.tier-hero__side .tier-vote-policy--hero .tier-vote-policy__verify{align-self:center;font-size:.82rem}
@media(max-width:680px){.tier-hero__side{gap:.4rem}.tier-hero__side .tier-vote-policy--hero{gap:.55rem;padding:.9rem}.tier-hero__side .tier-vote-policy--hero strong{font-size:.9rem}.tier-hero__side .tier-vote-policy--hero span{font-size:.82rem;line-height:1.55}.tier-hero__side .tier-vote-policy--hero .tier-vote-policy__verify{font-size:.76rem}}
.ranking-model--hero{align-items:center;padding:1rem 1.1rem;border-color:rgba(242,189,87,.38);border-radius:16px;background:linear-gradient(115deg,rgba(52,43,18,.82),rgba(7,24,36,.94))}
.ranking-model--hero>span{flex-basis:58px;height:58px;font-size:1rem}
.ranking-model--hero strong{font-size:1.05rem}
.ranking-model--hero p{font-size:.9rem;line-height:1.55}
@media(max-width:680px){.ranking-model--hero{padding:.85rem}.ranking-model--hero>span{flex-basis:48px;height:48px;font-size:.84rem}.ranking-model--hero strong{font-size:.92rem}.ranking-model--hero p{font-size:.78rem;line-height:1.5}}
.vote-confirm-backdrop{position:fixed;z-index:2000;inset:0;display:grid;place-items:center;padding:1rem;background:rgba(1,7,12,.82);backdrop-filter:blur(9px)}
.vote-confirm-dialog{position:relative;width:min(100%,480px);overflow:hidden;border:1px solid rgba(255,190,61,.48);border-radius:22px;background:linear-gradient(145deg,#0b1c28,#071019);box-shadow:0 28px 90px rgba(0,0,0,.58);padding:1.45rem;color:#eaf7ff}
.vote-confirm-dialog:before{position:absolute;inset:0;background:radial-gradient(circle at 100% 0,rgba(255,190,61,.12),transparent 38%);content:"";pointer-events:none}
.vote-confirm-dialog>*{position:relative}
.vote-confirm-dialog__icon{display:grid;width:44px;height:44px;place-items:center;border-radius:13px;background:#ffb526;color:#07111a;font-size:1.15rem;font-weight:950}
.vote-confirm-dialog__eyebrow{margin:1rem 0 .35rem;color:#ffd166;font:850 .7rem/1.3 ui-monospace,monospace;letter-spacing:.13em;text-transform:uppercase}
.vote-confirm-dialog h2{margin:0;font-size:clamp(1.45rem,5vw,2rem);font-weight:950;letter-spacing:-.03em}
.vote-confirm-character{display:flex;align-items:center;gap:.85rem;margin:1.1rem 0;padding:.7rem;border:1px solid #234355;border-radius:14px;background:#081722}
.vote-confirm-character img{width:76px;height:76px;object-fit:contain;border-radius:10px;background:#040a10}
.vote-confirm-character div{display:grid;gap:.25rem}
.vote-confirm-character strong{font-size:1.05rem}
.vote-confirm-character span{color:#8eacbd;font-size:.78rem}
.vote-confirm-dialog>p:not(.vote-confirm-dialog__eyebrow){margin:.7rem 0;color:#b4cbd8;line-height:1.6}
.vote-confirm-warning{display:flex;align-items:flex-start;gap:.6rem;border:1px solid rgba(255,128,102,.34);border-radius:12px;background:rgba(255,101,76,.08);padding:.75rem;color:#ffd2c8;font-size:.83rem;font-weight:750;line-height:1.5}
.vote-confirm-dialog footer{display:grid;grid-template-columns:1fr 1.35fr;gap:.65rem;margin-top:1.2rem}
.vote-confirm-dialog footer button{min-height:46px;border-radius:11px;font-size:.82rem;font-weight:900;transition:transform .18s ease,background .18s ease,border-color .18s ease}
.vote-confirm-cancel{border:1px solid #365363;color:#b9d0dc}
.vote-confirm-submit{border:1px solid #ffd166;background:#ffd166;color:#101014}
.vote-confirm-dialog footer button:hover:not(:disabled){transform:translateY(-1px)}
.vote-confirm-dialog footer button:disabled{cursor:wait;opacity:.65}
.vote-confirm-dialog-enter-active,.vote-confirm-dialog-leave-active{transition:opacity .22s ease}
.vote-confirm-dialog-enter-active .vote-confirm-dialog,.vote-confirm-dialog-leave-active .vote-confirm-dialog{transition:transform .28s cubic-bezier(.16,1,.3,1),opacity .22s ease}
.vote-confirm-dialog-enter-from,.vote-confirm-dialog-leave-to{opacity:0}
.vote-confirm-dialog-enter-from .vote-confirm-dialog{opacity:0;transform:translateY(18px) scale(.96)}
.vote-confirm-dialog-leave-to .vote-confirm-dialog{opacity:0;transform:translateY(8px) scale(.98)}
@media(max-width:480px){.vote-confirm-dialog{padding:1.1rem;border-radius:18px}.vote-confirm-dialog footer{grid-template-columns:1fr}.vote-confirm-character img{width:66px;height:66px}.vote-confirm-cancel{order:2}}
@media(prefers-reduced-motion:reduce){.vote-confirm-dialog-enter-active,.vote-confirm-dialog-leave-active,.vote-confirm-dialog-enter-active .vote-confirm-dialog,.vote-confirm-dialog-leave-active .vote-confirm-dialog,.vote-confirm-dialog footer button{transition:none}}
</style>
