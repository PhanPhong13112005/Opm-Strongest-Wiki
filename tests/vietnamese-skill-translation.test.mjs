import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { isNumericSkillBracket, effectTerms } from './helpers/skill-brackets.mjs'

const root = path.resolve(import.meta.dirname, '..')
const viCatalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/characters.json'), 'utf8'))
const enCatalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/characters_en.json'), 'utf8'))
const viById = new Map(viCatalog.map(character => [character.id, character]))

const glossaryMarkdown = fs.readFileSync(
  path.join(root, 'docs/VIET_HOA_HIEU_UNG_VA_TEN_NHAN_VAT_HOAN_CHINH.md'),
  'utf8',
)
const translationScript = fs.readFileSync(
  path.join(root, 'scripts/update-vietnamese-skills-from-english.mjs'),
  'utf8',
)

function readTranslationGlossary() {
  const glossary = new Map()
  const fallbackBlock = translationScript.match(/const FALLBACK_GLOSSARY = new Map\(`([\s\S]*?)`\.trim/)
  assert.ok(fallbackBlock, 'fallback glossary is missing from the translation script')

  for (const line of fallbackBlock[1].trim().split(/\r?\n/)) {
    const separator = line.indexOf('|')
    assert.notEqual(separator, -1, `invalid fallback glossary row: ${line}`)
    glossary.set(
      line.slice(0, separator).trim().toLocaleLowerCase('en'),
      line.slice(separator + 1).trim(),
    )
  }

  for (const line of glossaryMarkdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*\d+\s*\|\s*\[x\]\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/i)
    if (match) glossary.set(match[1].trim().toLocaleLowerCase('en'), match[2].trim())
  }
  return glossary
}

const translationGlossary = readTranslationGlossary()
// Child-only source aliases; no blanket exemption for Child prose.
const childTerms = new Map([
  ['energy reduction', 'Giảm Năng Lượng'],
  ['energy lock', 'Khóa Năng Lượng'],
])

test('Vietnamese descriptions stay aligned with every English skill row', () => {
  assert.equal(viCatalog.length, 180)
  assert.equal(enCatalog.length, viCatalog.length)

  for (const englishCharacter of enCatalog) {
    const vietnameseCharacter = viById.get(englishCharacter.id)
    assert.ok(vietnameseCharacter, `${englishCharacter.id} is missing from the Vietnamese catalog`)
    assert.equal(
      vietnameseCharacter.skills.length,
      englishCharacter.skills.length,
      `${englishCharacter.id} has a mismatched skill count`,
    )
    vietnameseCharacter.skills.forEach((skill, index) => {
      assert.ok(skill.desc.trim(), `${englishCharacter.id}/${index} is missing its Vietnamese description`)
      assert.doesNotMatch(skill.desc, /ZXQOPM/i, `${englishCharacter.id}/${index} contains a translation token`)
      assert.doesNotMatch(skill.desc, /[ÃƒÃ‚Ã¢Ã°]/, `${englishCharacter.id}/${index} contains broken UTF-8`)
    })
  }
})

test('every English effect tag has an explicit Vietnamese glossary entry', () => {
  const missing = []
  for (const character of enCatalog) character.skills.forEach((skill, index) => {
    for (const term of effectTerms(skill.desc)) {
      if (!translationGlossary.has(term.toLocaleLowerCase('en')) &&
          !(character.id === '100320-urplus' && childTerms.has(term.toLowerCase()))) {
        missing.push(`${character.id}/${index}: [${term}]`)
      }
    }
  })
  assert.deepEqual(missing, [], 'NEEDS_OWNER_TRANSLATION_APPROVAL: ' + missing.join('; '))
})

test('numeric progression brackets are not effects, but named and mixed numeric effects still require glossary entries', () => {
  for (const value of ['12000%', '15000%', '85%', '90%', '50%', '55%', '3', '4', '2.5%']) assert.equal(isNumericSkillBracket(value), true, value)
  for (const value of ['Protection', 'Block Rate', 'Base HP Increase', 'Dual Extreme Kill Formation', '4× Max HP Increase', '100% ATK']) assert.equal(isNumericSkillBracket(value), false, value)
  assert.deepEqual(effectTerms('9000% [12000%] [Protection] 45% [50%] [Block Rate] [4× Max HP Increase]'), ['Protection', 'Block Rate', '4× Max HP Increase'])
  assert.equal(translationGlossary.get('block rate'), 'Tỷ Lệ Đỡ Đòn')
  assert.equal(translationGlossary.get('energy shield'), 'Lá Chắn Năng Lượng')
  // A missing real term must remain visible to the strict coverage gate, never filtered as numeric.
  assert.deepEqual(effectTerms('[12000%] [Unapproved Fixture Effect]').filter(term => !translationGlossary.has(term.toLowerCase())), ['Unapproved Fixture Effect'])
})

test('Vietnamese descriptions do not retain translated English effect tags or known bad phrases', () => {
  for (const englishCharacter of enCatalog) {
    const vietnameseCharacter = viById.get(englishCharacter.id)
    englishCharacter.skills.forEach((englishSkill, index) => {
      const vietnameseDescription = vietnameseCharacter.skills[index].desc
      for (const match of String(englishSkill.desc || '').matchAll(/\[([^\]]+)\]/g)) {
        const englishTerm = match[1].trim()
        const vietnameseTerm = translationGlossary.get(englishTerm.toLocaleLowerCase('en')) ||
          (englishCharacter.id === '100320-urplus' ? childTerms.get(englishTerm.toLowerCase()) : undefined)
        if (vietnameseTerm && vietnameseTerm !== englishTerm) {
          assert.ok(
            !vietnameseDescription.includes(`[${englishTerm}]`),
            `${englishCharacter.id}/${index} retains untranslated [${englishTerm}]`,
          )
        }
      }
      assert.doesNotMatch(
        vietnameseDescription,
        /với giá \d+% ATK|Tuyệt Kĩ Skill|\bUltimate\b|Tối thượng|chiêu cuối|DMG (?:đã )?lấy|S\.Stun|Non-crit DMG|advanced DMG Boost|DMG Res|\bFollow-Up\b|Split (?:Black Sperm|Tinh Trùng Đen)/i,
        `${englishCharacter.id}/${index} contains a known bad translation`,
      )
      assert.doesNotMatch(vietnameseDescription, /\batk\b/, `${englishCharacter.id}/${index} contains lowercase atk`)
    })
  }
})
test('Black Sperm descriptions use the approved Vietnamese effect glossary', () => {
  const blackSperm = viById.get('blacksperm-urplus')
  assert.match(blackSperm.skills[1].desc, /\[Sát Thương Trực Tiếp Chuyên Biệt\]/)
  assert.match(blackSperm.skills[1].desc, /\[Khả Năng Né Tránh Chuyên Biệt\]/)
  assert.match(blackSperm.skills[3].desc, /\[Giảm Sát Thương Không Bạo Kích\]/)
  assert.doesNotMatch(blackSperm.skills[1].desc, /\bUltimate\b|Tối thượng|chiêu cuối/i)
})

test('skill translation changes descriptions without changing skill media metadata', () => {
  for (const englishCharacter of enCatalog) {
    const vietnameseCharacter = viById.get(englishCharacter.id)
    englishCharacter.skills.forEach((englishSkill, index) => {
      const vietnameseSkill = vietnameseCharacter.skills[index]
      for (const field of ['icon', 'animation', 'cost']) {
        if (field in englishSkill && field in vietnameseSkill) {
          assert.deepEqual(
            vietnameseSkill[field],
            englishSkill[field],
            `${englishCharacter.id}/${index} changed ${field}`,
          )
        }
      }
    })
  }
})


test('owner-approved editorial effect translations are synchronized without resolving pending gameplay', () => {
  const mapping = new Map([['Protection', 'Bảo Hộ'], ['Base HP Increase', 'Tăng HP Cơ Bản'], ['Dual Extreme Kill Formation', 'Song Cực Sát Trận']])
  const vi = viById.get('100321-urplus')
  const en = enCatalog.find(character => character.id === vi.id)
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'public/character-details/vi/100321-urplus.json'), 'utf8'))
  assert.deepEqual(payload, vi)
  assert.match(glossaryMarkdown, /OWNER_APPROVED_EDITORIAL/)
  assert.match(glossaryMarkdown, /Không ghi nhận là bản dịch chính thức của trò chơi/)
  for (const [english, vietnamese] of mapping) {
    assert.equal(translationGlossary.get(english.toLowerCase()), vietnamese)
    assert.ok(vi.skills.some(skill => skill.desc.includes('[' + vietnamese + ']')))
    assert.ok(en.skills.some(skill => skill.desc.includes('[' + english + ']')))
    for (const skill of vi.skills) assert.ok(!skill.desc.includes('[' + english + ']'))
  }
  assert.equal(vi.effects[0].term, '[Bảo Hộ]')
  assert.match(vi.effects[0].desc, /PENDING/)
  assert.equal(vi.provenance.protectionDamageStatus, 'PENDING_OWNER_CONFIRMED_DO_NOT_SELECT_EITHER_SOURCE')
  assert.equal(vi.provenance.protectionDefinitionStatus, 'PENDING_SUBJECT_AND_DAMAGE_SOURCE_RECONCILIATION')
  assert.equal(vi.provenance.licenseStatus, 'LICENSE_UNVERIFIED')
  assert.deepEqual(vi.skills.map(skill => skill.type), ['Basic', 'Ultimate', 'Ultimate', 'Passive', 'Awakening'])
})

test('owner-approved VI payload cache revision changes reviewed Gale VI/EN only, preserving unrelated URLs', async () => {
  const previous = globalThis.fetch, seen = []
  try {
    globalThis.fetch = async url => { seen.push(url); return {ok:true, json:async()=>({id:'fixture'})} }
    const {loadLocalCharacterDetail} = await import('../src/data/loadCharacterDetail.js?owner-approved-vi-glossary-contract')
    for (const [id, locale] of [['100321-urplus','vi'],['100321-urplus','en'],['100320-urplus','vi'],['100320-urplus','en'],['100189-ur','vi']]) await loadLocalCharacterDetail(id, locale)
    assert.deepEqual(seen, ['/character-details/vi/100321-urplus.json?v=gale-owner-exact-history-20261104-vi', '/character-details/en/100321-urplus.json?v=gale-owner-exact-history-20261104-en', '/character-details/vi/100320-urplus.json?v=child-owner-exact-history-20261104-vi', '/character-details/en/100320-urplus.json?v=child-owner-exact-history-20261104-en', '/character-details/vi/100189-ur.json'])
    await loadLocalCharacterDetail('100321-urplus', 'vi')
    assert.equal(seen.length, 5)
  } finally { globalThis.fetch = previous }
})
