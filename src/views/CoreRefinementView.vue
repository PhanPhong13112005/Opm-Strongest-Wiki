<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import refinementData from '../data/coreRefinement.json'

const { locale } = useI18n()
const activePageId = ref(refinementData.pages[0].id)
const fromLevel = ref(1)
const toLevel = ref(Math.min(2, refinementData.pages[0].maxLevel))
const lockedCount = ref(0)
const expandedStat = ref('')
const qualityCompareLevel = ref(1)
const refinementDirection = ref('next')

const isEnglish = computed(() => locale.value === 'en')
const copy = computed(() => isEnglish.value ? {
  eyebrow: 'ACCOUNT-WIDE GROWTH FEATURE',
  title: 'Core Refinement',
  subtitle: 'Plan refinement levels, locks and resources before spending in game.',
  requirement: 'Account Lv. 78+',
  branches: '2 independent branches',
  levels: '15 / 20 levels',
  slots: '4 / 5 stat slots',
  tabs: {
    start: 'Overview',
    lock: 'Calculate & Lock',
    rates: 'Stat Quality',
    stats: 'Stat pool',
  },
  beginnerTitle: 'New to Core Refinement? Start here',
  beginnerLead: 'This feature permanently improves your whole account. You reroll stat slots, level the branch and may lock good stats you already own.',
  beginnerSteps: [
    ['Choose a branch', 'Energy is the first branch. Module opens after Energy Refinement reaches Lv. 11.'],
    ['Enter two levels', 'Use the level shown in game, then choose the level you want to reach.'],
    ['Choose stats to keep', 'Pick 0 when starting. Only lock slots that already contain a stat you really want.'],
    ['Prepare resources', 'The result shows the estimated rolls and materials needed for level progress.'],
  ],
  glossaryTitle: 'What do these terms mean?',
  glossary: [
    ['Stat slot', 'One line of ATK, HP, SPD or another bonus on this refinement branch.'],
    ['Lock', 'Keeps the stat type. Its value only changes when the new value is higher.'],
    ['Quality', 'The stat color from White to Red. A higher color allows a stronger value.'],
    ['Pity', 'The maximum number of rolls before the listed quality is guaranteed.'],
  ],
  chooseBranch: 'Choose a refinement branch',
  pageHint: 'If you just unlocked the feature, choose Energy Refinement.',
  opensAt: 'Opens at account Lv. 78',
  unlocksModule: 'Unlocks Module Refinement at Lv. 11',
  maxLevel: 'Max level',
  calculator: 'Resource calculator',
  calculatorHint: 'Follow the three inputs from left to right. Start with 0 locked slots if you do not have a good stat yet.',
  from: '1. Level shown in game',
  fromHelp: 'Your current refinement level.',
  to: '2. Level you want',
  toHelp: 'Try +1 first to understand the cost.',
  locked: '3. Good stat slots to keep',
  lockedHelpNone: '0 means every unlocked stat slot will be rerolled.',
  lockedHelpSome: 'Locked slots keep their stat type and cannot roll a lower value.',
  quickTarget: 'Quick target',
  plusOne: '+1 level',
  plusFive: '+5 levels',
  maximum: 'Maximum',
  resultTitle: 'You should prepare',
  resultNoLock: 'No stat is being kept. Every unlocked slot may change after each roll.',
  resultWithLock: 'You are keeping {count} good stat slot(s). Lock Components are charged on every roll.',
  estimateWarning: 'This calculation estimates level-up resources. It does not guarantee a specific stat or quality.',
  totalExp: 'EXP required',
  rolls: 'Estimated rolls',
  chips: 'Refinement Chips',
  lockParts: 'Lock Components',
  noLockParts: 'No lock component required',
  formula: 'Rolls = required EXP ÷ EXP gained per roll, rounded up.',
  lockTitle: 'How locking works',
  lockIntro: 'A locked slot keeps its stat type and only accepts a higher value. Unlocked slots are rerolled completely and may become weaker.',
  noDuplicates: 'The same stat type cannot appear twice on one refinement page.',
  expPerRoll: 'EXP / roll',
  partsPerRoll: 'parts / roll',
  qualityTitle: 'Stat quality by level',
  qualityHint: 'Each refinement level changes the chance of rolling White through Red values. Compare one level transition at a time.',
  qualityCompare: 'Refinement level',
  qualityMeaning: 'The left value is the current rate; the right value is the rate after reaching the next level.',
  opensAtLevel: 'Unlocks at Lv.',
  current: 'Current',
  target: 'Target',
  pity: 'Pity for the current level',
  pityRolls: 'rolls guarantee',
  noPity: 'No pity threshold recorded for this quality.',
  slotTitle: 'Slot unlock milestones',
  slot: 'Slot',
  level: 'Lv.',
  statTitle: 'Stat pool',
  statHint: 'Tap a stat to see its maximum roll and description. Every stat in the same branch has equal appearance chance.',
  cap: 'Maximum value',
  chance: 'Appearance chance',
  noDescription: 'No additional in-game description is available.',
  sourceNote: 'The calculator and tables are reproduced from the reference logic and client data. This page is an independent implementation for planning purposes.',
} : {
  eyebrow: 'TÍNH NĂNG TĂNG TRƯỞNG TOÀN TÀI KHOẢN',
  title: 'Tinh Luyện Trung Tâm',
  subtitle: 'Tính trước cấp tinh luyện, số ô khóa và nguyên liệu trước khi sử dụng trong game.',
  requirement: 'Tài khoản cấp 78+',
  branches: '2 nhánh độc lập',
  levels: '15 / 20 cấp',
  slots: '4 / 5 ô chỉ số',
  tabs: {
    start: 'Tổng quan',
    lock: 'Tính & Khóa',
    rates: 'Phẩm chất',
    stats: 'Kho chỉ số',
  },
  beginnerTitle: 'Mới chơi? Hãy hiểu 4 bước này trước',
  beginnerLead: 'Tính năng Tinh Luyện Trung Tâm tăng chỉ số vĩnh viễn cho toàn tài khoản. Bạn quay các ô chỉ số, tăng cấp nhánh và có thể khóa những chỉ số tốt đang sở hữu.',
  beginnerSteps: [
    ['Chọn nhánh', 'Người mới bắt đầu bằng Tinh Luyện Năng Lượng. Nhánh Mô-đun mở khi Năng Lượng đạt cấp 11.'],
    ['Nhập hai cấp độ', 'Chọn đúng cấp đang thấy trong game, sau đó chọn cấp bạn muốn đạt tới.'],
    ['Chọn chỉ số muốn giữ', 'Khi mới bắt đầu hãy chọn 0. Chỉ khóa ô khi ô đó đã có chỉ số tốt bạn muốn giữ.'],
    ['Chuẩn bị nguyên liệu', 'Kết quả cho biết số lần tinh luyện và lượng nguyên liệu dự kiến để tăng cấp.'],
  ],
  glossaryTitle: 'Giải thích các từ khó',
  glossary: [
    ['Ô chỉ số', 'Một dòng cộng Tấn Công, HP, Tốc Độ hoặc chỉ số khác trong nhánh tinh luyện.'],
    ['Khóa', 'Giữ nguyên loại chỉ số. Giá trị chỉ thay đổi khi lần quay mới cao hơn.'],
    ['Phẩm chất', 'Màu của chỉ số từ Trắng đến Đỏ. Màu càng cao thì giá trị có thể nhận càng mạnh.'],
    ['Bảo hiểm', 'Số lần quay tối đa trước khi chắc chắn nhận phẩm chất được ghi trong bảng.'],
  ],
  chooseBranch: 'Chọn nhánh tinh luyện',
  pageHint: 'Nếu bạn vừa mở tính năng, hãy chọn Tinh Luyện Năng Lượng.',
  opensAt: 'Mở khi tài khoản đạt cấp 78',
  unlocksModule: 'Mở Tinh Luyện Mô-đun khi đạt cấp 11',
  maxLevel: 'Cấp tối đa',
  calculator: 'Tính nguyên liệu',
  calculatorHint: 'Điền lần lượt ba mục từ trái sang phải. Nếu chưa có chỉ số tốt, hãy để số ô giữ lại bằng 0.',
  from: '1. Cấp đang thấy trong game',
  fromHelp: 'Đây là cấp tinh luyện hiện tại của bạn.',
  to: '2. Cấp bạn muốn đạt',
  toHelp: 'Người mới nên thử tính thêm 1 cấp trước.',
  locked: '3. Số ô chỉ số tốt muốn giữ',
  lockedHelpNone: 'Chọn 0: tất cả ô đã mở đều có thể thay đổi sau mỗi lần quay.',
  lockedHelpSome: 'Ô được khóa giữ nguyên loại chỉ số và không nhận giá trị thấp hơn.',
  quickTarget: 'Chọn nhanh mục tiêu',
  plusOne: '+1 cấp',
  plusFive: '+5 cấp',
  maximum: 'Tối đa',
  resultTitle: 'Bạn cần chuẩn bị',
  resultNoLock: 'Bạn không giữ ô nào. Mọi ô đã mở đều có thể thay đổi sau mỗi lần tinh luyện.',
  resultWithLock: 'Bạn đang giữ {count} ô chỉ số tốt. Linh Kiện Khóa được tính cho từng lần tinh luyện.',
  estimateWarning: 'Đây là ước tính nguyên liệu để tăng cấp, không bảo đảm nhận đúng loại hoặc phẩm chất chỉ số mong muốn.',
  totalExp: 'EXP cần đạt',
  rolls: 'Số lần dự kiến',
  chips: 'Chip Tinh Luyện',
  lockParts: 'Linh Kiện Khóa',
  noLockParts: 'Không cần linh kiện khóa',
  formula: 'Số lần = EXP cần đạt ÷ EXP nhận mỗi lần, làm tròn lên.',
  lockTitle: 'Cơ chế khóa chỉ số',
  lockIntro: 'Ô đã khóa giữ nguyên loại chỉ số và chỉ nhận giá trị mới khi cao hơn. Ô không khóa sẽ quay lại toàn bộ và có thể yếu đi.',
  noDuplicates: 'Một loại chỉ số không thể xuất hiện hai lần trong cùng một nhánh tinh luyện.',
  expPerRoll: 'EXP / lần',
  partsPerRoll: 'linh kiện / lần',
  qualityTitle: 'Phẩm chất chỉ số theo cấp',
  qualityHint: 'Mỗi cấp tinh luyện thay đổi cơ hội nhận giá trị từ Trắng đến Đỏ. Hãy xem lần lượt từng bước tăng cấp.',
  qualityCompare: 'Cấp tinh luyện',
  qualityMeaning: 'Số bên trái là tỷ lệ hiện tại; số bên phải là tỷ lệ sau khi lên cấp tiếp theo.',
  opensAtLevel: 'Mở ở cấp',
  current: 'Hiện tại',
  target: 'Mục tiêu',
  pity: 'Bảo hiểm của cấp hiện tại',
  pityRolls: 'lần chắc chắn nhận',
  noPity: 'Phẩm chất này chưa có mốc bảo hiểm được ghi nhận.',
  slotTitle: 'Mốc mở ô chỉ số',
  slot: 'Ô',
  level: 'Cấp',
  statTitle: 'Nhóm chỉ số có thể nhận',
  statHint: 'Nhấn vào chỉ số để xem giới hạn tối đa và mô tả. Các chỉ số trong cùng nhánh có tỷ lệ xuất hiện ngang nhau.',
  cap: 'Giá trị tối đa',
  chance: 'Tỷ lệ xuất hiện',
  noDescription: 'Chưa có mô tả bổ sung trong dữ liệu game.',
  sourceNote: 'Công thức và bảng dữ liệu được tái hiện từ logic tham chiếu và dữ liệu client. Đây là bản triển khai độc lập để hỗ trợ người chơi tính toán.',
})

const qualityDefinitions = computed(() => [
  { id: 1, vi: 'Trắng', en: 'White', color: '#d5e0e8' },
  { id: 2, vi: 'Lục', en: 'Green', color: '#55d58a' },
  { id: 3, vi: 'Lam', en: 'Blue', color: '#58a9ff' },
  { id: 4, vi: 'Tím', en: 'Purple', color: '#b879ff' },
  { id: 5, vi: 'Cam', en: 'Orange', color: '#ffad3d' },
  { id: 6, vi: 'Đỏ', en: 'Red', color: '#ff5964' },
])

const activePage = computed(() => refinementData.pages.find(page => page.id === activePageId.value) || refinementData.pages[0])
const fromOptions = computed(() => Array.from({ length: activePage.value.maxLevel - 1 }, (_, index) => index + 1))
const toOptions = computed(() => Array.from({ length: activePage.value.maxLevel - fromLevel.value }, (_, index) => fromLevel.value + index + 1))
const lockTier = computed(() => activePage.value.lockTiers.find(tier => tier.lockedCount === lockedCount.value) || activePage.value.lockTiers[0])
const lockCostPerRoll = computed(() => activePage.value.lockCosts.find(item => item.scope === lockedCount.value)?.amount || 0)

const calculation = computed(() => {
  const totalExp = activePage.value.levels
    .filter(row => row.level >= fromLevel.value && row.level < toLevel.value)
    .reduce((sum, row) => sum + row.expToNext, 0)
  const rolls = Math.ceil(totalExp / lockTier.value.expPerRoll)
  return {
    totalExp,
    rolls,
    chips: rolls * activePage.value.rollCost,
    lockComponents: rolls * lockCostPerRoll.value,
  }
})

const qualityLevels = computed(() => Array.from({ length: activePage.value.maxLevel - 1 }, (_, index) => index + 1))
const currentRates = computed(() => activePage.value.quality.rates[String(qualityCompareLevel.value)] || {})
const targetRates = computed(() => activePage.value.quality.rates[String(qualityCompareLevel.value + 1)] || {})
const currentPity = computed(() => activePage.value.pityByLevel[String(qualityCompareLevel.value)] || [])
const qualityDelta = quality => Number(targetRates.value[quality] || 0) - Number(currentRates.value[quality] || 0)
const isQualityUnlocked = quality => qualityCompareLevel.value >= Number(activePage.value.quality.unlock[String(quality)] || 1)
const qualityUnlockLevel = quality => Number(activePage.value.quality.unlock[String(quality)] || 1)
const lockGuidance = computed(() => lockedCount.value === 0 ? copy.value.lockedHelpNone : copy.value.lockedHelpSome)
const resultSummary = computed(() => (lockedCount.value === 0 ? copy.value.resultNoLock : copy.value.resultWithLock)
  .replace('{count}', lockedCount.value))

const localizedPageName = page => isEnglish.value ? page.nameEn : page.nameVi
const localizedStatName = stat => isEnglish.value ? stat.nameEn : stat.nameVi
const localizedStatDescription = stat => (isEnglish.value ? stat.descEn : stat.descVi) || copy.value.noDescription
const qualityName = quality => isEnglish.value ? quality.en : quality.vi
const formatNumber = value => Number(value).toLocaleString(isEnglish.value ? 'en-US' : 'vi-VN')
const formatPercent = value => `${(Number(value || 0) * 100).toLocaleString(isEnglish.value ? 'en-US' : 'vi-VN', { maximumFractionDigits: 2 })}%`
const formatCap = stat => stat.percent ? formatPercent(stat.cap) : formatNumber(stat.cap)

const setTargetOffset = offset => {
  toLevel.value = offset === 'max' ? activePage.value.maxLevel : Math.min(fromLevel.value + offset, activePage.value.maxLevel)
}

const selectPage = page => {
  if (page.id === activePageId.value) return
  const currentIndex = refinementData.pages.findIndex(item => item.id === activePageId.value)
  const nextIndex = refinementData.pages.findIndex(item => item.id === page.id)
  refinementDirection.value = nextIndex >= currentIndex ? 'next' : 'previous'
  activePageId.value = page.id
  fromLevel.value = 1
  toLevel.value = Math.min(2, page.maxLevel)
  lockedCount.value = 0
  qualityCompareLevel.value = 1
  expandedStat.value = ''
}

watch(fromLevel, value => {
  if (toLevel.value <= value) toLevel.value = Math.min(value + 1, activePage.value.maxLevel)
})
</script>

<template>
  <main class="refinement-page" :class="[`refinement-page--${activePage.theme}`, `refinement-page--${refinementDirection}`]">
    <section class="refinement-hero">
      <div>
        <p class="section-kicker">{{ copy.eyebrow }}</p>
        <h1>{{ copy.title }}</h1>
        <p class="refinement-hero__lead">{{ copy.subtitle }}</p>
      </div>
      <div class="refinement-hero__facts" aria-label="Feature summary">
        <span>{{ copy.requirement }}</span>
        <span>{{ copy.branches }}</span>
        <span>{{ copy.levels }}</span>
        <span>{{ copy.slots }}</span>
      </div>
    </section>

    <div id="refinement-overview" class="refinement-content-block">

    <section class="beginner-guide" aria-labelledby="beginner-title">
      <header>
        <span class="beginner-guide__badge">START HERE</span>
        <div>
          <h2 id="beginner-title">{{ copy.beginnerTitle }}</h2>
          <p>{{ copy.beginnerLead }}</p>
        </div>
      </header>
      <ol>
        <li v-for="(step, index) in copy.beginnerSteps" :key="step[0]">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div><strong>{{ step[0] }}</strong><p>{{ step[1] }}</p></div>
        </li>
      </ol>
      <details class="glossary">
        <summary>{{ copy.glossaryTitle }} <span>+</span></summary>
        <dl>
          <div v-for="term in copy.glossary" :key="term[0]">
            <dt>{{ term[0] }}</dt>
            <dd>{{ term[1] }}</dd>
          </div>
        </dl>
      </details>
    </section>

    <section class="refinement-section branch-section" aria-labelledby="branch-title">
      <header class="section-heading">
        <div>
          <p class="section-kicker">01 // SELECT</p>
          <h2 id="branch-title">{{ copy.chooseBranch }}</h2>
        </div>
        <p>{{ copy.pageHint }}</p>
      </header>

      <div class="branch-grid">
        <button
          v-for="(page, index) in refinementData.pages"
          :key="page.id"
          type="button"
          class="branch-card"
          :class="[{ 'is-active': page.id === activePage.id }, `branch-card--${page.theme}`]"
          :aria-pressed="page.id === activePage.id"
          @click="selectPage(page)"
        >
          <span class="branch-card__art" aria-hidden="true">
            <img
              :src="refinementData.assets.pageCard[page.id]"
              :alt="localizedPageName(page)"
              width="360"
              height="565"
              :loading="index === 0 ? 'eager' : 'lazy'"
              decoding="async"
            >
          </span>
          <span class="branch-card__body">
            <small>{{ page.id }}</small>
            <strong>{{ localizedPageName(page) }}</strong>
            <span>{{ copy.maxLevel }} {{ page.maxLevel }} · {{ page.slotCount }} {{ copy.slot.toLowerCase() }}</span>
            <span>{{ copy.opensAt }}</span>
            <em v-if="page.unlocksPageId">{{ copy.unlocksModule }}</em>
          </span>
          <span class="branch-card__status">{{ page.id === activePage.id ? 'ACTIVE' : 'SELECT' }}</span>
        </button>
      </div>
    </section>
    </div>

    <div id="refinement-calculator" class="refinement-content-block">
    <section class="refinement-section calculator-section" aria-labelledby="calculator-title">
      <header class="section-heading">
        <div>
          <p class="section-kicker">02 // CALCULATOR</p>
          <h2 id="calculator-title">{{ copy.calculator }}</h2>
        </div>
        <p>{{ copy.calculatorHint }}</p>
      </header>

      <div class="calculator-controls">
        <label for="refinement-from">
          <span>{{ copy.from }}</span>
          <select id="refinement-from" v-model.number="fromLevel" data-testid="refinement-from">
            <option v-for="level in fromOptions" :key="level" :value="level">Lv. {{ level }}</option>
          </select>
          <small>{{ copy.fromHelp }}</small>
        </label>
        <label for="refinement-to">
          <span>{{ copy.to }}</span>
          <select id="refinement-to" v-model.number="toLevel" data-testid="refinement-to">
            <option v-for="level in toOptions" :key="level" :value="level">Lv. {{ level }}</option>
          </select>
          <small>{{ copy.toHelp }}</small>
        </label>
        <label for="refinement-locks">
          <span>{{ copy.locked }}</span>
          <select id="refinement-locks" v-model.number="lockedCount" data-testid="refinement-locks">
            <option v-for="tier in activePage.lockTiers" :key="tier.lockedCount" :value="tier.lockedCount">
              {{ tier.lockedCount }} / {{ activePage.slotCount }}
            </option>
          </select>
          <small>{{ lockGuidance }}</small>
        </label>
      </div>

      <div class="quick-targets">
        <span>{{ copy.quickTarget }}</span>
        <button type="button" :class="{ 'is-active': toLevel === Math.min(fromLevel + 1, activePage.maxLevel) }" @click="setTargetOffset(1)">{{ copy.plusOne }}</button>
        <button type="button" @click="setTargetOffset(5)">{{ copy.plusFive }}</button>
        <button type="button" :class="{ 'is-active': toLevel === activePage.maxLevel }" @click="setTargetOffset('max')">{{ copy.maximum }}</button>
      </div>

      <Transition name="refinement-fade" mode="out-in">
      <div :key="'summary-' + activePage.id + '-' + fromLevel + '-' + toLevel + '-' + lockedCount" class="result-summary" aria-live="polite">
        <span>✓</span>
        <div><strong>{{ copy.resultTitle }}</strong><p>{{ resultSummary }}</p></div>
      </div>

      </Transition>

      <Transition name="refinement-fade" mode="out-in">
      <div :key="`${activePage.id}-${fromLevel}-${toLevel}-${lockedCount}`" class="calculation-grid" aria-live="polite">
        <article>
          <span>EXP</span>
          <strong data-testid="total-exp">{{ formatNumber(calculation.totalExp) }}</strong>
          <small>{{ copy.totalExp }}</small>
        </article>
        <article>
          <span>ROLL</span>
          <strong data-testid="roll-count">{{ formatNumber(calculation.rolls) }}</strong>
          <small>{{ copy.rolls }} · {{ lockTier.expPerRoll }} {{ copy.expPerRoll }}</small>
        </article>
        <article class="resource-card">
          <img :src="refinementData.assets.chip" alt="" width="64" height="64" loading="lazy" decoding="async">
          <strong data-testid="chip-count">{{ formatNumber(calculation.chips) }}</strong>
          <small>{{ copy.chips }}</small>
        </article>
        <article class="resource-card" :class="{ 'is-muted': !calculation.lockComponents }">
          <img :src="refinementData.assets.lockComponent" alt="" width="64" height="64" loading="lazy" decoding="async">
          <strong data-testid="lock-component-count">{{ formatNumber(calculation.lockComponents) }}</strong>
          <small>{{ calculation.lockComponents ? copy.lockParts : copy.noLockParts }}</small>
        </article>
      </div>
      </Transition>
      <p class="formula-note">{{ copy.formula }}</p>
      <p class="estimate-warning">{{ copy.estimateWarning }}</p>
    </section>
    <section class="refinement-section lock-section" aria-labelledby="lock-title">
      <header class="section-heading">
        <div>
          <p class="section-kicker">03 // LOCK</p>
          <h2 id="lock-title">{{ copy.lockTitle }}</h2>
        </div>
        <p>{{ copy.lockIntro }}</p>
      </header>
      <div class="logic-alert"><span>!</span><p>{{ copy.noDuplicates }}</p></div>
      <Transition name="refinement-fade" mode="out-in">
      <div :key="activePage.id + '-' + lockedCount" class="lock-ladder">
        <button
          v-for="tier in activePage.lockTiers"
          :key="tier.lockedCount"
          type="button"
          :class="{ 'is-active': lockedCount === tier.lockedCount }"
          @click="lockedCount = tier.lockedCount"
        >
          <strong>{{ tier.lockedCount }} / {{ activePage.slotCount }}</strong>
          <span>{{ tier.expPerRoll }} {{ copy.expPerRoll }}</span>
          <small>{{ (activePage.lockCosts.find(item => item.scope === tier.lockedCount)?.amount || 0) }} {{ copy.partsPerRoll }}</small>
        </button>
      </div>
      </Transition>
    </section>
    </div>

    <div id="refinement-quality" class="refinement-content-block">
    <section class="refinement-section quality-section">
      <header class="quality-header">
        <div>
          <p class="section-kicker">04 // QUALITY</p>
          <h2>{{ copy.qualityTitle }}</h2>
          <p>{{ copy.qualityHint }}</p>
        </div>
        <label class="quality-level-picker" for="quality-level">
          <span>{{ copy.qualityCompare }}</span>
          <select id="quality-level" v-model.number="qualityCompareLevel" data-testid="quality-level">
            <option v-for="level in qualityLevels" :key="level" :value="level">Lv. {{ level }} → {{ level + 1 }}</option>
          </select>
        </label>
      </header>

      <div class="quality-explainer">
        <strong>Lv. {{ qualityCompareLevel }} → {{ qualityCompareLevel + 1 }}</strong>
        <p>{{ copy.qualityMeaning }}</p>
      </div>

      <div class="disclosure-body">

      <Transition name="refinement-fade" mode="out-in">
      <div :key="`${activePage.id}-${qualityCompareLevel}`" class="quality-bars" role="table" aria-label="Quality rates">
        <div
          v-for="quality in qualityDefinitions"
          :key="quality.id"
          class="quality-bar"
          :class="{ 'is-locked': !isQualityUnlocked(quality.id) }"
          :style="{ '--quality-color': quality.color }"
          role="row"
        >
          <strong class="quality-bar__name" role="cell">{{ qualityName(quality) }}</strong>
          <template v-if="isQualityUnlocked(quality.id)">
            <span class="quality-bar__values" role="cell">
              <b>{{ formatPercent(currentRates[quality.id]) }}</b>
              <i aria-hidden="true">→</i>
              <b>{{ formatPercent(targetRates[quality.id]) }}</b>
            </span>
            <span class="quality-bar__delta" :class="{ 'is-down': qualityDelta(quality.id) < 0 }" role="cell">
              {{ qualityDelta(quality.id) < 0 ? '▼' : '▲' }} {{ formatPercent(Math.abs(qualityDelta(quality.id))) }}
            </span>
          </template>
          <span v-else class="quality-bar__locked" role="cell">▣ {{ copy.opensAtLevel }} {{ qualityUnlockLevel(quality.id) }}</span>
        </div>
      </div>

      </Transition>

      <div class="pity-panel">
        <h3>{{ copy.pity }}</h3>
        <div v-if="currentPity.length" class="pity-list">
          <span v-for="entry in currentPity" :key="`${entry.quality}-${entry.rolls}`" :style="{ '--pity-color': qualityDefinitions.find(item => item.id === entry.quality)?.color }">
            <b>{{ qualityName(qualityDefinitions.find(item => item.id === entry.quality)) }}</b>
            ≤ {{ formatNumber(entry.rolls) }}
          </span>
        </div>
        <p v-else>{{ copy.noPity }}</p>
      </div>
      </div>
    </section>

    <details class="refinement-section disclosure-section slot-section">
      <summary class="disclosure-summary">
        <div>
          <p class="section-kicker">05 // SLOTS</p>
          <h2>{{ copy.slotTitle }}</h2>
        </div>
        <span aria-hidden="true">+</span>
      </summary>
      <div class="disclosure-body">
      <ol class="slot-timeline">
        <li v-for="slot in activePage.slots" :key="slot.slotIndex">
          <span>{{ String(slot.slotIndex).padStart(2, '0') }}</span>
          <strong>{{ copy.slot }} {{ slot.slotIndex }}</strong>
          <small>{{ copy.level }} {{ slot.openAtLevel }}</small>
        </li>
      </ol>
      </div>
    </details>
    </div>

    <div id="refinement-stats" class="refinement-content-block">
    <details class="refinement-section disclosure-section stat-section">
      <summary class="disclosure-summary">
        <div>
          <p class="section-kicker">06 // ATTRIBUTES</p>
          <h2>{{ copy.statTitle }}</h2>
        </div>
        <span aria-hidden="true">+</span>
      </summary>
      <div class="disclosure-body">
        <p class="disclosure-intro">{{ copy.statHint }}</p>

      <div class="stat-tiers">
        <article v-for="tier in activePage.pool" :key="tier.tier" class="stat-tier" :class="`stat-tier--${tier.tier.toLowerCase()}`">
          <header><strong>{{ tier.tier }}</strong><span>{{ tier.stats.length }} STATS</span></header>
          <div class="stat-list">
            <button
              v-for="stat in tier.stats"
              :key="stat.attr"
              type="button"
              class="stat-item"
              :class="{ 'is-open': expandedStat === `${activePage.id}-${stat.attr}` }"
              :aria-expanded="expandedStat === `${activePage.id}-${stat.attr}`"
              @click="expandedStat = expandedStat === `${activePage.id}-${stat.attr}` ? '' : `${activePage.id}-${stat.attr}`"
            >
              <span class="stat-item__summary">
                <strong>{{ localizedStatName(stat) }}</strong>
                <small>{{ copy.cap }}: {{ formatCap(stat) }}</small>
                <b>+</b>
              </span>
              <span v-if="expandedStat === `${activePage.id}-${stat.attr}`" class="stat-item__detail">
                {{ localizedStatDescription(stat) }}
                <em>{{ copy.chance }}: {{ formatPercent(stat.appear) }}</em>
              </span>
            </button>
          </div>
        </article>
      </div>
      </div>
    </details>
    </div>

    <p class="source-note">{{ copy.sourceNote }}</p>
  </main>
</template>

<style scoped>
.refinement-page {
  --accent: #51d5f5;
  --accent-soft: rgba(81, 213, 245, 0.14);
  --panel: rgba(7, 20, 31, 0.88);
  --line: rgba(130, 174, 201, 0.23);
  position: relative;
  min-height: 100vh;
  overflow: clip;
  isolation: isolate;
  padding: 38px clamp(16px, 4vw, 64px) 72px;
  color: #eaf5fb;
  background:
    radial-gradient(circle at 12% 12%, rgba(36, 169, 210, 0.14), transparent 27rem),
    radial-gradient(circle at 88% 28%, rgba(56, 101, 187, 0.12), transparent 31rem),
    #030b13;
}
.refinement-page::before {
  position: absolute;
  z-index: 0;
  top: 74px;
  right: -118px;
  width: 410px;
  height: 410px;
  content: '';
  pointer-events: none;
  border: 2px dashed color-mix(in srgb, var(--accent) 24%, transparent);
  border-radius: 50%;
  box-shadow: inset 0 0 72px color-mix(in srgb, var(--accent) 7%, transparent), 0 0 80px color-mix(in srgb, var(--accent) 6%, transparent);
  animation: refinement-orbit 22s linear infinite;
}
.refinement-page > * { position: relative; z-index: 1; }
.refinement-page--purple { --accent: #aa80ff; --accent-soft: rgba(170, 128, 255, 0.15); }
.refinement-hero, .beginner-guide, .refinement-section, .source-note { width: min(1120px, 100%); margin-inline: auto; }
.refinement-hero { position: relative; display: flex; overflow: hidden; animation: refinement-rise-in .62s cubic-bezier(.2, .75, .25, 1) both; justify-content: space-between; align-items: center; gap: 32px; margin-bottom: 20px; padding: 26px 28px; border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(125deg, rgba(8, 31, 47, .96), rgba(6, 13, 23, .92)); box-shadow: 0 20px 60px rgba(0, 0, 0, .24); }
.refinement-hero::before { position: absolute; z-index: 0; top: -35%; bottom: -35%; left: -38%; width: 28%; content: ''; pointer-events: none; transform: skewX(-18deg); background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 15%, transparent), transparent); animation: refinement-scan 5.5s ease-in-out infinite; }
.refinement-hero > * { position: relative; z-index: 1; }
.refinement-hero h1 { margin: 8px 0 12px; font-size: clamp(2.15rem, 4.2vw, 3.8rem); line-height: .98; letter-spacing: -.04em; text-transform: uppercase; }
.refinement-hero__lead { max-width: 650px; color: #a9bdca; font-size: 1.02rem; line-height: 1.7; }
.refinement-hero__facts { display: grid; grid-template-columns: repeat(2, minmax(145px, 1fr)); min-width: min(100%, 390px); overflow: hidden; border: 1px solid var(--line); border-radius: 12px; }
.refinement-hero__facts span { padding: 14px 16px; color: #c4d7e2; font-size: .78rem; font-weight: 800; text-transform: uppercase; border: 1px solid rgba(130, 174, 201, .12); }
.beginner-guide { animation: refinement-rise-in .62s .08s cubic-bezier(.2, .75, .25, 1) both; margin-bottom: 20px; padding: clamp(18px, 3vw, 28px); border: 1px solid rgba(81, 213, 245, .42); border-radius: 16px; background: linear-gradient(120deg, rgba(14, 51, 67, .94), rgba(6, 19, 29, .94)); }
.beginner-guide > header { display: flex; gap: 16px; align-items: start; margin-bottom: 20px; }
.beginner-guide__badge { flex: 0 0 auto; padding: 7px 9px; color: #021019; font-size: .64rem; font-weight: 950; letter-spacing: .08em; background: var(--accent); }
.beginner-guide h2 { margin-bottom: 7px; font-size: clamp(1.3rem, 3vw, 1.8rem); }
.beginner-guide header p, .beginner-guide li p { color: #a9bdca; line-height: 1.55; }
.beginner-guide ol { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 0; padding: 0; list-style: none; }
.beginner-guide li { display: flex; gap: 11px; min-height: 118px; padding: 15px; border: 1px solid var(--line); border-radius: 11px; background: rgba(3, 13, 21, .66); }
.beginner-guide li > span { color: var(--accent); font-size: .72rem; font-weight: 950; }
.beginner-guide li strong { display: block; margin-bottom: 7px; font-size: .9rem; }
.beginner-guide li p { font-size: .78rem; }
.glossary { margin-top: 12px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: rgba(3, 13, 21, .6); }
.glossary summary { display: flex; justify-content: space-between; padding: 13px 15px; cursor: pointer; font-size: .82rem; font-weight: 850; list-style: none; }
.glossary summary::-webkit-details-marker, .disclosure-summary::-webkit-details-marker { display: none; }
.glossary dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 15px 15px; }
.glossary dl > div { padding: 12px; border-left: 2px solid var(--accent); background: rgba(255,255,255,.025); }
.glossary dt { margin-bottom: 4px; color: var(--accent); font-size: .78rem; font-weight: 850; }
.glossary dd { color: #9eb5c1; font-size: .76rem; line-height: 1.5; }
.section-kicker { color: var(--accent); font-size: .72rem; font-weight: 900; letter-spacing: .16em; }
.refinement-section { margin-bottom: 20px; padding: clamp(18px, 3vw, 28px); border: 1px solid var(--line); border-radius: 16px; background: var(--panel); box-shadow: 0 18px 50px rgba(0, 0, 0, .18); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 28px; margin-bottom: 24px; }
.section-heading h2 { margin-top: 6px; font-size: clamp(1.4rem, 3vw, 2rem); line-height: 1.12; }
.section-heading > p { max-width: 570px; color: #8fa8b7; line-height: 1.65; }
.compact-heading { margin-bottom: 18px; }
.branch-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.branch-card { position: relative; display: grid; grid-template-columns: 98px 1fr; min-height: 164px; border-radius: 12px; padding: 0; overflow: hidden; color: inherit; text-align: left; border: 1px solid var(--line); background: #07131e; transition: border-color .3s ease, transform .3s ease, background .3s ease, box-shadow .3s ease; }
.branch-section { animation: refinement-rise-in .62s .14s cubic-bezier(.2, .75, .25, 1) both; }
.branch-card:hover { transform: translateY(-2px); border-color: rgba(81, 213, 245, .65); }
.branch-card.is-active { border-color: var(--accent); background: linear-gradient(115deg, var(--accent-soft), #07131e 64%); transform: translateY(-2px); box-shadow: inset 3px 0 var(--accent); }
.branch-card__art { display: grid; place-items: end center; height: 164px; overflow: hidden; background: linear-gradient(180deg, rgba(255,255,255,.04), transparent); }
.branch-card__art img { width: 100%; height: 100%; object-fit: cover; object-position: center top; transition: transform .35s cubic-bezier(.2, .8, .2, 1), filter .35s ease; }
.branch-card.is-active .branch-card__art img { transform: scale(1.025); filter: brightness(1.08); }
.branch-card__body { display: flex; flex-direction: column; justify-content: center; gap: 7px; padding: 20px; }
.branch-card__body small, .branch-card__body span { color: #8da6b5; font-size: .78rem; }
.branch-card__body strong { font-size: 1.18rem; }
.branch-card__body em { color: var(--accent); font-size: .72rem; font-style: normal; font-weight: 800; }
.branch-card__status { position: absolute; top: 12px; right: 12px; padding: 5px 8px; color: var(--accent); font-size: .62rem; font-weight: 900; letter-spacing: .1em; border: 1px solid currentColor; background: rgba(3, 11, 19, .82); }
.calculator-controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
.calculator-controls label { display: grid; gap: 8px; color: #93abba; font-size: .78rem; font-weight: 800; text-transform: uppercase; }
.calculator-controls label > small { min-height: 2.9em; color: #718d9d; font-weight: 500; line-height: 1.45; text-transform: none; }
.calculator-controls select { width: 100%; padding: 13px 14px; color: #edf8fc; border: 1px solid var(--line); border-radius: 9px; background: #071723; outline: none; }
.calculator-controls select:focus-visible { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.quick-targets { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
.quick-targets > span { margin-right: 4px; color: #7f9aaa; font-size: .72rem; font-weight: 800; text-transform: uppercase; }
.quick-targets button { padding: 8px 12px; color: #b9cbd4; font-size: .74rem; font-weight: 800; border: 1px solid var(--line); background: #071723; }
.quick-targets button { transition: color .18s ease, border-color .18s ease, background .18s ease, transform .18s ease; }
.quick-targets button:hover, .quick-targets button.is-active { transform: translateY(-1px); color: #effbff; border-color: var(--accent); background: var(--accent-soft); }
.result-summary { position: relative; display: flex; align-items: center; gap: 13px; margin-bottom: 12px; padding: 14px 16px; overflow: hidden; border: 1px solid rgba(81, 213, 245, .34); background: rgba(81, 213, 245, .075); }
.result-summary > * { position: relative; z-index: 1; }
.result-summary > span { display: grid; place-items: center; flex: 0 0 32px; height: 32px; color: #021019; font-weight: 950; background: var(--accent); }
.result-summary strong { display: block; margin-bottom: 3px; font-size: .84rem; text-transform: uppercase; }
.result-summary p { color: #a6bdc8; font-size: .8rem; line-height: 1.45; }
.calculation-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.calculation-grid article { position: relative; display: grid; align-content: center; min-height: 126px; padding: 18px; border: 1px solid var(--line); border-radius: 11px; background: rgba(4, 13, 22, .72); }
.calculation-grid article > span { position: absolute; top: 12px; right: 12px; color: var(--accent); font-size: .65rem; font-weight: 900; }
.calculation-grid strong { font-size: clamp(1.45rem, 3vw, 2.15rem); }
.calculation-grid small { color: #8ca4b3; line-height: 1.4; }
.calculation-grid .resource-card { grid-template-columns: 52px 1fr; column-gap: 11px; }
.resource-card img { grid-row: 1 / 3; width: 48px; height: 48px; object-fit: contain; }
.resource-card.is-muted { opacity: .62; }
.formula-note { margin-top: 13px; color: #748f9f; font-size: .78rem; }
.estimate-warning { margin-top: 7px; color: #cfb881; font-size: .76rem; line-height: 1.5; }
.disclosure-section { padding: 0; overflow: hidden; }
.disclosure-summary { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 20px clamp(18px, 3vw, 30px); cursor: pointer; list-style: none; }
.disclosure-summary:hover { background: rgba(255,255,255,.025); }
.disclosure-summary h2 { margin-top: 5px; font-size: clamp(1.16rem, 2.5vw, 1.55rem); }
.disclosure-summary > span { color: var(--accent); font-size: 1.6rem; transition: transform .2s ease; }
.disclosure-section[open] .disclosure-summary > span { transform: rotate(45deg); }
.disclosure-body { padding: 0 clamp(18px, 3vw, 30px) clamp(18px, 3vw, 30px); }
.disclosure-section[open] > .disclosure-body { animation: refinement-detail-in .4s ease-out both; }
.disclosure-intro { max-width: 760px; margin: -2px 0 16px; color: #8fa8b7; font-size: .84rem; line-height: 1.6; }
.logic-alert { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 13px 15px; color: #c9e9f3; border: 1px solid rgba(81, 213, 245, .28); background: rgba(81, 213, 245, .07); }
.logic-alert span { display: grid; place-items: center; flex: 0 0 28px; height: 28px; color: #021019; font-weight: 950; background: var(--accent); }
.lock-ladder { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.lock-ladder button { display: grid; gap: 5px; padding: 14px 10px; color: #a6bbc7; text-align: left; border: 1px solid var(--line); background: #06121c; transition: color .3s ease, border-color .3s ease, background .3s ease, transform .3s ease, box-shadow .3s ease; }
.lock-ladder button:hover, .lock-ladder button.is-active { color: #edfaff; border-color: var(--accent); background: var(--accent-soft); }
.lock-ladder button.is-active { transform: translateY(-2px); box-shadow: inset 0 0 24px color-mix(in srgb, var(--accent) 12%, transparent), 0 0 18px color-mix(in srgb, var(--accent) 12%, transparent); }
.lock-ladder strong { color: var(--accent); font-size: 1.04rem; }
.lock-ladder span, .lock-ladder small { font-size: .7rem; }
.quality-header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
.quality-header h2 { margin: 5px 0 7px; font-size: clamp(1.45rem, 3vw, 2rem); }
.quality-header p { max-width: 650px; color: #91aaba; line-height: 1.55; }
.quality-level-picker { display: grid; gap: 7px; flex: 0 0 min(240px, 100%); color: #91aaba; font-size: .72rem; font-weight: 850; text-transform: uppercase; }
.quality-level-picker span { color: var(--accent); }
.quality-level-picker select { width: 100%; padding: 12px 14px; color: #f2fbff; font-size: .92rem; font-weight: 850; border: 1px solid var(--accent); border-radius: 9px; background: #071723; }
.quality-explainer { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; padding: 13px 15px; border: 1px solid var(--line); background: rgba(255,255,255,.025); }
.quality-explainer strong { flex: 0 0 auto; color: var(--accent); font-size: .88rem; }
.quality-explainer p { color: #a4b9c5; font-size: .8rem; line-height: 1.45; }
.quality-bars { display: grid; gap: 8px; }
.quality-bar { position: relative; display: grid; grid-template-columns: minmax(90px, .7fr) minmax(180px, 1fr) auto; gap: 16px; align-items: center; min-height: 52px; padding: 12px 16px; overflow: hidden; border-radius: 9px; color: #f7fbfd; border: 1px solid color-mix(in srgb, var(--quality-color) 72%, white 8%); background: linear-gradient(90deg, color-mix(in srgb, var(--quality-color) 55%, #101822), color-mix(in srgb, var(--quality-color) 38%, #07131e)); }
.quality-bar::before { position: absolute; inset: 0; content: ''; background: linear-gradient(90deg, rgba(255,255,255,.08), transparent 55%); pointer-events: none; }
.quality-bar > * { position: relative; z-index: 1; }
.quality-bar__name { font-size: 1rem; }
.quality-bar__values { display: flex; align-items: center; gap: 13px; font-size: .93rem; font-variant-numeric: tabular-nums; }
.quality-bar__values i { color: rgba(255,255,255,.7); font-style: normal; }
.quality-bar__delta { color: #8dffba; font-size: .82rem; font-weight: 900; white-space: nowrap; }
.quality-bar__delta.is-down { color: #ffaea5; }
.quality-bar:first-child:not(.is-locked) { color: #101b24; }
.quality-bar:first-child:not(.is-locked) .quality-bar__values i { color: rgba(16, 27, 36, .65); }
.quality-bar:first-child:not(.is-locked) .quality-bar__delta.is-down { color: #9b2119; }
.quality-bar.is-locked { grid-template-columns: minmax(90px, .7fr) 1fr; color: #8fa4b2; border-color: #394754; background: #1a232c; }
.quality-bar__locked { justify-self: end; font-size: .78rem; }
.pity-panel { margin-top: 14px; padding: 15px; border: 1px solid var(--line); border-radius: 10px; background: #06121c; }
.pity-panel h3 { margin-bottom: 10px; font-size: .78rem; text-transform: uppercase; }
.pity-panel p { color: #829dac; font-size: .82rem; }
.pity-list { display: flex; flex-wrap: wrap; gap: 8px; }
.pity-list span { position: relative; display: flex; align-items: center; gap: 7px; padding: 8px 11px 8px 16px; color: #d4e4eb; font-size: .78rem; border: 1px solid color-mix(in srgb, var(--pity-color) 68%, #263945); background: color-mix(in srgb, var(--pity-color) 13%, #07131e); }
.pity-list span::before { position: absolute; inset: 0 auto 0 0; width: 4px; content: ''; background: var(--pity-color); }
.slot-timeline { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; list-style: none; }
.slot-timeline li { display: grid; gap: 4px; padding: 15px; border: 1px solid var(--line); background: #06121c; }
.slot-timeline li > span { color: var(--accent); font-size: .7rem; font-weight: 900; }
.slot-timeline small { color: #86a0af; }
.stat-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: start; }
.stat-tier { --tier: #7ea6bc; border: 1px solid var(--line); background: #06121c; }
.stat-tier--ssr { --tier: #ffad3d; }
.stat-tier--sr { --tier: #b879ff; }
.stat-tier--r { --tier: #58a9ff; }
.stat-tier > header { display: flex; justify-content: space-between; padding: 13px 14px; color: var(--tier); border-bottom: 1px solid var(--line); background: rgba(255,255,255,.025); }
.stat-tier > header span { font-size: .65rem; font-weight: 900; }
.stat-list { display: grid; }
.stat-item { width: 100%; padding: 0; color: #dfeef4; text-align: left; border: 0; border-bottom: 1px solid rgba(130, 174, 201, .12); background: transparent; }
.stat-item:last-child { border-bottom: 0; }
.stat-item:hover, .stat-item.is-open { background: rgba(255,255,255,.035); }
.stat-item__summary { display: grid; grid-template-columns: 1fr auto 18px; gap: 8px; align-items: center; padding: 12px 13px; }
.stat-item__summary strong { font-size: .82rem; }
.stat-item__summary small { color: #83a0af; font-size: .68rem; }
.stat-item__summary b { color: var(--tier); font-size: 1.05rem; transition: transform .2s ease; }
.stat-item.is-open .stat-item__summary b { transform: rotate(45deg); }
.stat-item__detail { display: grid; animation: refinement-detail-in .4s ease-out both; gap: 9px; padding: 0 13px 13px; color: #a7bdc8; font-size: .76rem; line-height: 1.55; }
.stat-item__detail em { color: var(--tier); font-size: .7rem; font-style: normal; font-weight: 800; }
.source-note { padding: 8px 4px 0; color: #627f90; font-size: .72rem; line-height: 1.6; }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
@media (max-width: 980px) {
  .refinement-hero { align-items: stretch; flex-direction: column; }
  .refinement-hero__facts { min-width: 0; }
  .beginner-guide ol { grid-template-columns: repeat(2, 1fr); }
  .calculation-grid { grid-template-columns: repeat(2, 1fr); }
  .lock-ladder { grid-template-columns: repeat(3, 1fr); }
  .stat-tiers { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .refinement-page { padding: 20px 12px 52px; }
  .refinement-hero, .beginner-guide, .refinement-section { padding: 18px; }
  .refinement-hero__facts, .branch-grid, .calculator-controls { grid-template-columns: 1fr; }
  .beginner-guide > header { flex-direction: column; }
  .beginner-guide ol, .glossary dl { grid-template-columns: 1fr; }
  .beginner-guide li { min-height: 0; }
  .section-heading { align-items: start; flex-direction: column; gap: 10px; }
  .branch-card { grid-template-columns: 88px 1fr; min-height: 160px; }
  .branch-card__art { height: 160px; }
.branch-card__body { padding: 16px 12px; }
  .branch-card__status { display: none; }
  .calculation-grid { grid-template-columns: 1fr 1fr; }
  .calculation-grid article { min-height: 112px; padding: 14px; }
  .calculation-grid .resource-card { grid-column: span 2; }
  .calculator-controls label > small { min-height: 0; }
  .disclosure-section { padding: 0; }
  .lock-ladder { grid-template-columns: repeat(2, 1fr); }
  .quality-header { align-items: stretch; flex-direction: column; gap: 14px; }
  .quality-level-picker { flex-basis: auto; }
  .quality-explainer { align-items: start; flex-direction: column; gap: 5px; }
  .quality-bar { grid-template-columns: minmax(58px, .55fr) 1fr auto; gap: 8px; padding-inline: 11px; }
  .quality-bar.is-locked { grid-template-columns: minmax(58px, .55fr) 1fr; }
  .slot-timeline { grid-template-columns: repeat(2, 1fr); }
}
.refinement-fade-enter-active {
  will-change: opacity, transform, filter;
  transition: opacity .48s ease, transform .48s cubic-bezier(.16, 1, .3, 1), filter .42s ease;
}
.refinement-fade-leave-active {
  will-change: opacity, transform, filter;
  transition: opacity .22s ease, transform .22s ease, filter .18s ease;
}
.refinement-fade-enter-from {
  opacity: 0;
  transform: translateY(26px) scale(.975);
  filter: blur(7px);
}
.refinement-page--next .refinement-fade-enter-from { transform: translateX(72px) scale(.975); }
.refinement-page--previous .refinement-fade-enter-from { transform: translateX(-72px) scale(.975); }
.refinement-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(.99);
  filter: blur(3px);
}

.branch-card.is-active {
  animation: refinement-branch-activate .5s cubic-bezier(.16, 1, .3, 1);
}
.branch-card.is-active::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(105deg, transparent 15%, rgba(255,255,255,.14) 48%, transparent 78%);
  transform: translateX(-115%);
  animation: refinement-card-sweep .68s ease-out;
}
.branch-card.is-active .branch-card__status { animation: refinement-status-pop .46s cubic-bezier(.16, 1, .3, 1); }
.calculation-grid article,
.lock-ladder button,
.quality-bar { animation: refinement-row-enter .46s cubic-bezier(.16, 1, .3, 1) both; }
.calculation-grid article:nth-child(2),
.lock-ladder button:nth-child(2),
.quality-bar:nth-child(2) { animation-delay: .045s; }
.calculation-grid article:nth-child(3),
.lock-ladder button:nth-child(3),
.quality-bar:nth-child(3) { animation-delay: .09s; }
.calculation-grid article:nth-child(4),
.lock-ladder button:nth-child(4),
.quality-bar:nth-child(4) { animation-delay: .135s; }
.lock-ladder button:nth-child(5),
.quality-bar:nth-child(5) { animation-delay: .18s; }
.lock-ladder button:nth-child(6),
.quality-bar:nth-child(6) { animation-delay: .225s; }

@keyframes refinement-branch-activate {
  0% { transform: translateY(-2px) scale(.975); box-shadow: inset 3px 0 var(--accent), 0 0 0 rgba(81, 213, 245, 0); }
  58% { transform: translateY(-4px) scale(1.012); box-shadow: inset 3px 0 var(--accent), 0 0 28px var(--accent-soft); }
  100% { transform: translateY(-2px) scale(1); box-shadow: inset 3px 0 var(--accent); }
}
@keyframes refinement-card-sweep {
  to { transform: translateX(115%); }
}
@keyframes refinement-status-pop {
  0% { opacity: 0; transform: translateY(-8px) scale(.86); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes refinement-row-enter {
  from { opacity: 0; transform: translateY(18px) scale(.97); filter: blur(5px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes refinement-orbit {
  to { transform: rotate(360deg); }
}
@keyframes refinement-scan {
  0%, 15% { left: -38%; opacity: 0; }
  35%, 55% { opacity: 1; }
  78%, 100% { left: 112%; opacity: 0; }
}
@keyframes refinement-rise-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes refinement-detail-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .branch-card,
  .stat-item__summary b,
  .quick-targets button { transition: none; }
  .refinement-fade-enter-active,
  .refinement-fade-leave-active { transition-duration: .18s; transition-property: opacity; }
  .refinement-fade-enter-from,
  .refinement-page--next .refinement-fade-enter-from,
  .refinement-page--previous .refinement-fade-enter-from,
  .refinement-fade-leave-to { transform: none; filter: none; }
  .refinement-page::before,
  .refinement-hero::before,
  .refinement-hero,
  .beginner-guide,
  .branch-section,
  .branch-card.is-active,
  .branch-card.is-active::after,
  .branch-card.is-active .branch-card__status,
  .calculation-grid article,
  .lock-ladder button,
  .quality-bar,
  .stat-item__detail,
  .disclosure-section[open] > .disclosure-body { animation: none; }
}
</style>
