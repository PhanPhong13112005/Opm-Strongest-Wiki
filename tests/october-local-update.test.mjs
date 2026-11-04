import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { currentScheduleMonth, initialScheduleMonth, shiftScheduleMonth } from '../src/utils/homeScheduleMonth.js'
import { calculateCoreMaterials, getMaterialProfile } from '../src/utils/coreMaterialCalculator.js'
const read = path => JSON.parse(fs.readFileSync(new URL(`../${path}`, import.meta.url)))
const profiles = read('src/data/coreMaterialCosts.json').profiles
const hero = read('src/data/coreLab.json').heroes.find(hero => hero.coreHeId === 'he_100320')
const vector = result => profiles[0].materialOrder.map(id => result.totals[id] || 0)

test('Home derives the Vietnam month across UTC month and year boundaries', () => {
  for (const [iso, expected] of [
    ['2026-09-30T16:59:59Z','2026-09'], ['2026-09-30T17:00:00Z','2026-10'],
    ['2026-10-31T17:00:00Z','2026-11'], ['2026-12-31T16:59:59Z','2026-12'],
    ['2026-12-31T17:00:00Z','2027-01'],
  ]) assert.equal(currentScheduleMonth(new Date(iso)), expected)
  assert.equal(shiftScheduleMonth('2026-12', 1), '2027-01')
  assert.equal(shiftScheduleMonth('2027-01', -1), '2026-12')
  assert.equal(initialScheduleMonth('2026-08', new Date('2026-10-12Z')), '2026-08')
  for (const invalid of ['', '2026-13', '2026-1', ['2026-08'], 'invalid']) {
    assert.equal(initialScheduleMonth(invalid, new Date('2026-10-12Z')), '2026-10')
  }
})

test('Child materials match the six required ranges and preserve level-step provenance', () => {
  const cases = [
    [0,1,[65,5,1,1,1,1,1,1,7000]],
    [0,4,[642,50,17,10,9,9,6,6,42000]],
    [4,10,[4270,340,91,60,47,47,31,31,217000]],
    [10,17,[17149,1235,450,300,200,200,109,109,910000]],
    [17,20,[12171,900,450,300,150,150,75,75,630000]],
    [0,20,[34232,2525,1008,670,406,406,221,221,1799000]],
  ]
  for (const [from,to,expected] of cases) {
    const result = calculateCoreMaterials(hero, from, to, profiles)
    assert.equal(result.status, 'VERIFIED')
    assert.deepEqual(vector(result), expected)
    assert.equal(result.steps.length, to - from)
    assert.deepEqual(result.steps.map(step => step.to), Array.from({length:to-from}, (_,i)=>from+i+1))
    assert.ok(result.steps.every(step => step.verificationStatus === 'DERIVED_VERIFIED' && step.source === profiles[0].source))
  }
})

test('all 20 material steps sum exactly once, same-level costs are zero', () => {
  const sums = Object.fromEntries(profiles[0].materialOrder.map(id => [id, 0]))
  for (let from=0; from<20; from++) {
    const step = calculateCoreMaterials(hero, from, from+1, profiles)
    for (const [id, amount] of Object.entries(step.totals)) sums[id] += amount
  }
  assert.deepEqual(sums, calculateCoreMaterials(hero,0,20,profiles).totals)
  for (let lv=0;lv<=20;lv++) {
    const result = calculateCoreMaterials(hero,lv,lv,profiles)
    assert.equal(result.status, 'VERIFIED'); assert.deepEqual(result.totals, {})
  }
})

test('missing, malformed, negative and invalid costs never produce a partial fake total', () => {
  for (const [from,to] of [[-1,4],[4,3],[0,21],[0,NaN],[0,1.5],['0',4]]) {
    assert.equal(calculateCoreMaterials(hero,from,to,profiles).status,'INVALID_RANGE')
  }
  for (const mutation of ['missing','negative','malformed']) {
    const copy = structuredClone(profiles)
    if(mutation==='missing') delete copy[0].cumulative[6]
    if(mutation==='negative') copy[0].cumulative[6][0]=0
    if(mutation==='malformed') copy[0].cumulative[6]=[1]
    const result=calculateCoreMaterials(hero,4,10,copy)
    assert.equal(result.status,'INCOMPLETE'); assert.deepEqual(result.totals,{})
    assert.ok(result.missingLevels.includes(6))
  }
  const other={...hero,characterId:'100045-ur'}
  assert.equal(getMaterialProfile(other,profiles),undefined)
  assert.equal(calculateCoreMaterials(other,0,4,profiles).status,'INCOMPLETE')
})

test('six source-matched material icons are mapped while milestone mapping remains unverified', () => {
  const profile=profiles[0]
  assert.equal(profile.milestoneIconMappingStatus,'INCONCLUSIVE')
  const components=Object.values(profile.items).filter(item=>item.type==='component')
  assert.equal(components.length,6)
  assert.ok(components.every(item=>item.icon?.includes('/Core_Skill/Child_Emperor_URPlus/Item_21509') && item.iconStatus==='SOURCE_VERIFIED_VISUAL_MATCH'))
  const presentation=read('src/data/characterPresentation.json')['100320-urplus']
  assert.equal(presentation.background,'#000000')
  assert.equal(presentation.keepsakeDetailAvailable,false)
  assert.ok(fs.existsSync(new URL('../public'+presentation.keepsakeIcon,import.meta.url)))
})

test('Home initializes from Vietnam/query month without a live timer or focus rollover', () => {
  const source=fs.readFileSync(new URL('../src/views/HomeView.vue',import.meta.url),'utf8')
  assert.match(source,/scheduleMonthDate\(initialScheduleMonth\(route\.query\.month\)\)/)
  assert.match(source,/watch\(\(\) => route\.query\.month/)
  assert.doesNotMatch(source,/setInterval|clearInterval|monthRefreshTimer|refreshUnselectedMonth/)
  assert.doesNotMatch(source,/(?:add|remove)EventListener\(['"]focus['"]/)
})

test('only Child URplus Core levels 1 and 17 have owner-scoped presentation restrictions', () => {
  const metadata=read('src/data/characterPresentation.json')
  const restricted=Object.entries(metadata).filter(([,entry])=>entry.coreEffectReview)
  assert.deepEqual(restricted.map(([id])=>id),['100320-urplus'])
  assert.deepEqual(metadata['100320-urplus'].coreEffectReview,{
    coreHeId:'he_100320',unverifiedLevels:[1,17],source:'owner-decision',originalDataPreserved:true,
  })
  // Presentation approval is not a correction to the underlying game data.
  for(const language of ['vi','en']) {
    assert.match(hero.levels.find(level=>level.lv===1)[`reward_${language}`],/80/)
    const lv17=hero.levels.find(level=>level.lv===17)
    assert.equal(lv17[`coreName_${language}`],'Eccentric Power IV')
    assert.equal(lv17[`reward_${language}`],'Eccentric Power IV')
    assert.ok(lv17[`coreEffect_${language}`].length>100)
    assert.match(hero.levels.find(level=>level.lv===7)[`reward_${language}`],/80/)
    assert.match(hero.levels.find(level=>level.lv===13)[`reward_${language}`],/80/)
  }
})

test('Core Lab and Detail mask pending effects without removing levels or calculator data', () => {
  for(const view of ['CoreLabView.vue','DetailView.vue']) {
    const source=fs.readFileSync(new URL('../src/views/'+view,import.meta.url),'utf8')
    assert.match(source,/isCoreLevelEffectPending/)
    assert.match(source,/:data-core-level="lvl\.lv"/)
    assert.match(source,/data-core-effect-pending/)
    assert.match(source,/corelab\.effectVerificationPending/)
  }
  assert.equal(read('src/locales/vi.json').corelab.effectVerificationPending,'Thông tin hiệu ứng cấp này đang được xác minh.')
  assert.equal(read('src/locales/en.json').corelab.effectVerificationPending,"This level's effect information is being verified.")
  assert.equal(Object.keys(profiles[0].cumulative).length,20)
  assert.equal(calculateCoreMaterials(hero,0,20,profiles).steps.length,20)
})
