import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

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

test('Vietnamese descriptions stay aligned with every English skill row', () => {
  assert.equal(viCatalog.length, 177)
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
  for (const character of enCatalog) {
    character.skills.forEach((skill, index) => {
      for (const match of String(skill.desc || '').matchAll(/\[([^\]]+)\]/g)) {
        const term = match[1].trim()
        assert.ok(
          translationGlossary.has(term.toLocaleLowerCase('en')),
          `${character.id}/${index} is missing a glossary entry for [${term}]`,
        )
      }
    })
  }
})

test('Vietnamese descriptions do not retain translated English effect tags or known bad phrases', () => {
  for (const englishCharacter of enCatalog) {
    const vietnameseCharacter = viById.get(englishCharacter.id)
    englishCharacter.skills.forEach((englishSkill, index) => {
      const vietnameseDescription = vietnameseCharacter.skills[index].desc
      for (const match of String(englishSkill.desc || '').matchAll(/\[([^\]]+)\]/g)) {
        const englishTerm = match[1].trim()
        const vietnameseTerm = translationGlossary.get(englishTerm.toLocaleLowerCase('en'))
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
