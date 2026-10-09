import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { getPassiveUpgradeTone, getSkillDescriptionForDisplay } from '../src/utils/skillPresentation.js'
import { resolveCharacterClassPresentation } from '../src/utils/characterClassPresentation.js'
import { getCharacterReleaseDates } from '../src/utils/characterReleaseDates.js'

const read = file => JSON.parse(fs.readFileSync(new URL('../' + file, import.meta.url)))
const referenceIds = ['100045-ssr', '100045-ssrplus', '100045-ur', '100010-ssrplus', 'blacksperm-urplus', '100314-urplus', 'homeless-emperor-urplus']

test('shared eight-rule character workflow records independent progression and the history gate', () => {
  const rules = fs.readFileSync(new URL('../src/data/README.md', import.meta.url), 'utf8')
  assert.deepEqual([...rules.matchAll(/^### (\d)\./gm)].map(match => Number(match[1])), [1,2,3,4,5,6,7,8])
  assert.match(rules, /CHARACTER_HISTORY_SYNC=PASS\/FAIL/)
  assert.match(rules, /ENERGY_MINUS_2_VERIFIED=NO/)
  assert.match(rules, /92% \[95%\] \[98%\]/)
  assert.match(rules, /92% → 95% → 98%/)
  assert.match(rules, /3 → 4/)
  assert.match(rules, /tiến trình giá trị số/)
  assert.match(rules, /không tạo card A1\/A2\/A3/i)
  assert.match(rules, /Siêu tuyệt kỹ \/ Super Ultimate: 7000% sát thương, giảm \*\*4\*\* lần Tái Chiến/)
})

test('generic awakening descriptions show each numerical chain independently without changing source or assigning stages', () => {
  for (const type of ['Awakening', 'Thức tỉnh', 'Awakened Passive']) {
    const skill = { type, desc: 'Gain 3 [4] Energy per turn; grant 92% [95%] [98%] [True DMG Reduction].' }
    const original = JSON.stringify(skill)
    assert.equal(getSkillDescriptionForDisplay(skill), 'Gain 3 → 4 Energy per turn; grant 92% → 95% → 98% [True DMG Reduction].')
    assert.equal(JSON.stringify(skill), original)
    assert.doesNotMatch(getSkillDescriptionForDisplay(skill), /Awaken [123]|A[123]|unlock|★/)
  }
  assert.equal(getSkillDescriptionForDisplay({type:'Awakening',desc:'2.5% [3.5%] [Energy Lock] and 1 [2] times.'}), '2.5% → 3.5% [Energy Lock] and 1 → 2 times.')
  assert.equal(getSkillDescriptionForDisplay({type:'Awakening',desc:'92% [Updating] [98%]'}), '92% [Updating] [98%]')
  assert.equal(getSkillDescriptionForDisplay({type:'Awakening',desc:'95% [True DMG Reduction]'}), '95% [True DMG Reduction]')
  for (const type of ['Passive','Ultimate','Basic','Core']) {
    const skill = {type,desc:'80% [85%] [90%] and 3 [4]'}
    assert.equal(getSkillDescriptionForDisplay(skill), skill.desc)
  }
  assert.equal(getSkillDescriptionForDisplay(null), '')
})

test('Safari-target awakening formatting preserves Unicode boundaries and legacy lookbehind semantics', () => {
  // Node-only oracle: never imported into the browser bundle.
  const originalPattern = /(?<![\p{L}\p{N}_.])\d+(?:[.,]\d+)?%?(?:[ \t]+\[\d+(?:[.,]\d+)?%?\])+/gu
  const oracle = text => text.replace(originalPattern, chain => chain.replace(/[ \t]+\[([^\]]+)\]/g, ' → $1'))
  const cases = [
    '', 'Nhận 3 [4] Năng Lượng; giảm 92% [95%] [98%] [Sát Thương Chuẩn].',
    'Gain 3 [4] Energy; grant 92% [95%] [98%] [True DMG Reduction].',
    '80 [85]90 [95]', '80 [85][90 [95]]', '2,5%\t[3,5%] 1.25 [2.75]',
    '92%\n[95%]', '92%\u00a0[95%]', '92% [Updating] [98%]',
    '<b>92% [95%]</b> & 3 [4]', '-3 [4] +3 [4] (3 [4])',
    'abc80 [85] _80 [85] .80 [85] 80. [85] 80% [85%].',
  ]
  const prefixes = ['', ' ', '\t', '\n', '.', '_', '%', ',', '-', '+', '(', ']', 'a', 'Đ', '界', '𝒜', '𐐀', '𝟠', 'Ⅷ', '²', '🙂', '\u0301', '\ud800', '\udc00']
  const chains = ['80 [85] [90]', '92% [95%] [98%]', '3\t[4]', '2.5 [3.5]', '2,5% [3,5%]', '80 [85]90 [95]', '1.80 [85]', '80 [85 [90]]']
  for (const prefix of prefixes) for (const chain of chains) {
    cases.push(prefix + chain, 'x' + prefix + chain + prefix + chain)
  }
  // Deterministic mixed strings exercise global matching and adjacent chains.
  let seed = 1729
  for (let i = 0; i < 2000; i++) {
    let text = ''
    for (let j = 0; j < 4; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      text += prefixes[seed % prefixes.length] + chains[(seed >>> 8) % chains.length]
    }
    cases.push(text)
  }
  for (const desc of cases) {
    assert.equal(getSkillDescriptionForDisplay({ type: 'Thức tỉnh', desc }), oracle(desc), JSON.stringify(desc))
    assert.equal(getSkillDescriptionForDisplay({ type: 'Passive', desc }), desc)
  }
  const helper = fs.readFileSync(new URL('../src/utils/skillPresentation.js', import.meta.url), 'utf8')
  assert.doesNotMatch(helper, /\(\?<[/=!]/)
})

test('reference characters and Child use the same passive-state badge resolver in VI and EN', () => {
  for (const language of ['vi', 'en']) {
    const rows = read('src/data/characters' + (language === 'en' ? '_en' : '') + '.json')
    for (const id of [...referenceIds, '100320-urplus']) {
      const skills = rows.find(row => row.id === id).skills
      const states = skills.filter(skill => ['Nội tại', 'Passive'].includes(skill.type))
      assert.equal(states.length, 3, id)
      assert.deepEqual(states.map(getPassiveUpgradeTone), ['base-stars', 'gold', 'purple'], id)
      assert.equal(new Set(states.map(skill => skill.icon)).size, 1, id)
      assert.ok(states.every(skill => !skill.progression && !skill.effectProgressions), id)
      for (const skill of skills.filter(skill => ['Thức tỉnh', 'Awakening'].includes(skill.type))) {
        assert.equal(getPassiveUpgradeTone(skill), '', id)
      }
    }
  }
})

test('Class_SS uses SS and the existing icon for all Child variants, not an ID override', () => {
  const rows = read('src/data/characters.json')
  for (const id of ['100045-ssr', '100045-ssrplus', '100045-ur', '100320-urplus']) {
    const character = rows.find(row => row.id === id)
    for (const language of ['vi', 'en']) {
      const result = resolveCharacterClassPresentation(character, language)
      assert.equal(result.classLevel, 'Class_SS')
      assert.equal(result.label, 'SS')
      assert.equal(result.icon, '/Class/Class_SS.png')
    }
  }
  assert.equal(resolveCharacterClassPresentation({classLevel:'Class_S'}).label, 'Class_S')
  assert.equal(resolveCharacterClassPresentation({classLevel:'Dragon',faction:'Monster'}, 'vi').label, 'Rồng')
})

test('shared timeline preserves legacy dates and applies explicit returns without character identity', () => {
  const character = {id:'any-character',releaseTrung:'01/04/2024',releaseSea:'01/08/2024'}
  const original = {trungRelease:'01/04/2024',trungReturn:'15/06/2024',seaRelease:'01/08/2024',seaReturn:'15/10/2024'}
  assert.deepEqual(getCharacterReleaseDates(character), original)
  assert.deepEqual(getCharacterReleaseDates({...character,returnTrung:'01/06/2024',returnSea:null}, [], 'Updating'), {...original,trungReturn:'01/06/2024',seaReturn:'Updating'})
  assert.equal(getCharacterReleaseDates(null), null)
  assert.equal(getCharacterReleaseDates({}), null)
  assert.equal(getCharacterReleaseDates(character,[{characterId:'any-character',server:'CN',date:'2024-06-01',isReturn:true}]).trungReturn, '01/06/2024')
})

test('Detail and Core use data capabilities instead of Child-ID renderer branches', () => {
  for (const file of ['src/views/DetailView.vue','src/views/CoreLabView.vue']) {
    const source = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /100320-urplus|effectProgressions|child-passive-progression/)
    assert.doesNotMatch(source, /corelab\.level/)
  }
})
