import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const VI_FILE = path.join(ROOT, 'src/data/characters.json')
const EN_FILE = path.join(ROOT, 'src/data/characters_en.json')
const GLOSSARY_FILE = path.join(ROOT, 'docs/VIET_HOA_HIEU_UNG_VA_TEN_NHAN_VAT_HOAN_CHINH.md')
const CACHE_FILE = path.join(os.tmpdir(), 'opmwiki-skill-translation-vi-cache.json')
const PLACEHOLDER = /^(?:—|-|updating|description updating|no data|n\/a)$/i
const VI_PLACEHOLDER = 'Đang cập nhật mô tả.'
const TOKEN_PREFIX = 'ZXQOPM'
const TRANSLATE_ALL = process.argv.includes('--all')
const FRESH_TRANSLATION = process.argv.includes('--fresh')
const FALLBACK_GLOSSARY = new Map(`
100%|100%
4|4
4× Max HP Increase|Tăng Max HP 4×
Advanced Effect|Hiệu Ứng Nâng Cao
All DMG Bonus|Tăng Toàn Bộ Sát Thương
Arena DMG|Sát Thương Đấu Trường
Arena DMG Free|Miễn Sát Thương Đấu Trường
Armor Break|Phá Giáp
Armor Penetration|Xuyên Giáp
Basic Effect|Hiệu Ứng Cơ Bản
Berserk DMG|Sát Thương Cuồng Bạo
Black Sperm's Revenge|Sự Trả Thù Của Tinh Trùng Đen
Charge Follow-Up|Truy Kích Tích Lực
Charge Pursuit|Truy Kích Tích Lực
Charged Follow-Up|Truy Kích Tích Lực
Collapse DMG|Sát Thương Sụp Đổ
Collapse Rate|Tỷ Lệ Sụp Đổ
Continuous Explosion DMG|Sát Thương Nổ Liên Tục
Crit Rate|Tỷ Lệ Bạo Kích
Crit Resistance|Kháng Bạo Kích
DMG Ignoration|Bỏ Qua Sát Thương
Defiance Boost|Tăng Cường Phản Kháng
Defiance Guard|Phòng Thủ Phản Kháng
Detonation DMG|Sát Thương Kích Nổ
Detonation DMG Immunity|Miễn Sát Thương Kích Nổ
Disengage|Thoát Ly
DoT DMG Immunity|Miễn Sát Thương Duy Trì
Drone|Máy Bay Không Người Lái
Drones|Máy Bay Không Người Lái
Energy Shield|Lá Chắn Năng Lượng
Enhanced Protection|Bảo Hộ Cường Hóa
Enrage|Cuồng Nộ
Extra DMG|Sát Thương Bổ Sung
Extreme Tenacity|Kiên Cường Cực Hạn
Giant State|Trạng Thái Khổng Lồ
HP Link|Liên Kết HP
Hero / Martial Artist|Anh Hùng / Võ Sĩ
Hit|Chính Xác
Injury Boost|Tăng Cường Trọng Thương
Injury Reduction|Giảm Trọng Thương
Inspire|Khích Lệ
Instant DMG Accuracy|Tỷ Lệ Chính Xác Sát Thương Tức Thời
Instant DMG Hit Rate|Tỷ Lệ Chính Xác Sát Thương Tức Thời
Intimidation|Uy Hiếp
Joint Follow-Up|Truy Kích Liên Hợp
Momentum|Khí Thế
Non-Crit Undying|Bất Khuất Không Bạo Kích
Off-Battle|Rời Trận
Paralyzed|Tê Liệt
Pursuit|Truy Kích
Rampage Pursuit|Truy Kích Cuồng Bạo
Rapid Divinity - Attack|Thần Tốc - Tấn Công
Rapid Divinity - Defend|Thần Tốc - Phòng Thủ
Rebattle|Tái Chiến
Received DMG|Sát Thương Phải Chịu
Require|Yêu Cầu
Revenge Pursuit|Truy Kích Phản Đòn
Roaring Aura Sky Ripping Fist|Bạo Khí Không Liệt Quyền
Shared DMG|Sát Thương Chia Sẻ
Shield Rate|Tỷ Lệ Khiên
Silver State|Trạng Thái Bạc
Special Breakthrough|Đột Phá Đặc Biệt
Special Evasion|Né Tránh Đặc Biệt
Special Stun|Choáng Đặc Biệt
Specialized Bonus DMG|Sát Thương Bổ Sung Chuyên Biệt
Specialized Charge|Tích Lực Chuyên Biệt
Specialized Corrosion|Ăn Mòn Chuyên Biệt
Specialized Counter DMG|Sát Thương Phản Đòn Chuyên Biệt
Specialized Direct Damage|Sát Thương Trực Tiếp Chuyên Biệt
Specialized HP DMG Reduction|Giảm Sát Thương HP Chuyên Biệt
Specialized Hit Rate|Tỷ Lệ Chính Xác Chuyên Biệt
Specialized Resilience Rate|Tỷ Lệ Bền Bỉ Chuyên Biệt
Speed Zone · Defense|Vùng Tốc Độ · Phòng Thủ
Speed Zone · Offense|Vùng Tốc Độ · Tấn Công
Struggle DMG Reduction|Giảm Sát Thương Đối Kháng
Stun-type effect|Hiệu Ứng Choáng
Stun/Silence|Choáng/Câm Lặng
Suppression Boost|Tăng Cường Áp Chế
Suppression Guard|Phòng Thủ Áp Chế
Tank-Top Blackhole|Áo Ba Lỗ Lỗ Đen
Tank-Top Tiger|Áo Ba Lỗ Hổ
Three-legged Crow|Quạ Ba Chân
True DMG Bonus|Tăng Sát Thương Chuẩn
Ultimate Pursuit|Truy Kích Tuyệt Kĩ
`.trim().split('\n').map(line => {
  const separator = line.indexOf('|')
  return [line.slice(0, separator).trim().toLocaleLowerCase('en'), line.slice(separator + 1).trim()]
}))

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'))

function readHeadEnglishCatalog() {
  try {
    return JSON.parse(execFileSync('git', ['show', 'HEAD:src/data/characters_en.json'], {
      cwd: ROOT,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024
    }))
  } catch {
    return []
  }
}

function parseGlossary(markdown) {
  const map = new Map(FALLBACK_GLOSSARY)
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*\d+\s*\|\s*\[x\]\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/i)
    if (match) map.set(match[1].trim().toLocaleLowerCase('en'), match[2].trim())
  }
  return map
}

function skillKey(characterId, skill, index) {
  return `${characterId}::${index}::${skill.name || ''}`
}

function protectText(text, glossary, characterNames) {
  const replacements = []
  const reserve = value => {
    const token = `${TOKEN_PREFIX}${String(replacements.length).padStart(4, '0')}QXZ`
    replacements.push(value)
    return token
  }

  let protectedText = text.replace(/\[([^\]]+)\]/g, (_, term) => {
    const translated = glossary.get(term.trim().toLocaleLowerCase('en')) || term.trim()
    return reserve(`[${translated}]`)
  })

  const possessiveNames = [...characterNames]
    .filter(([english, vietnamese]) => english && vietnamese && english !== vietnamese)
    .sort((a, b) => b[0].length - a[0].length)
  for (const [english, vietnamese] of possessiveNames) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    protectedText = protectedText.replace(
      new RegExp(`\\b${escaped}['’]s (original )?Max HP\\b`, 'gi'),
      (_, original) => reserve(`${original ? 'HP tối đa ban đầu' : 'HP tối đa'} của ${vietnamese}`)
    )
  }
  const phrases = [
    ['Ultimate Skill', 'Tuyệt Kĩ'],
    ['Split Black Sperm', 'Phân Thân Tinh Trùng Đen'],
    ['follower slots', 'vị trí đơn vị hỗ trợ'],
    ['Follow-Up', 'Truy Kích'],
    ['Max HP', 'HP tối đa'],
    ['base Attack', 'ATK cơ bản'],
    ['Non-Crit DMG Immunity', 'Miễn Sát Thương Không Bạo Kích'],
    ['Non-CRIT DMG immunity', 'Miễn Sát Thương Không Bạo Kích'],
    ['Non-Crit DMG Free', 'Miễn Sát Thương Không Bạo Kích'],
    ['Non-Crit DMG RED', 'Giảm Sát Thương Không Bạo Kích'],
    ['Non-crit DMG reduction', 'Giảm Sát Thương Không Bạo Kích'],
    ['fatal DMG', 'sát thương kết liễu'],
    ['Direct DMG', 'Sát Thương Trực Tiếp'],
    ['incoming DMG', 'DMG nhận vào'],
    ['DMG taken', 'DMG phải chịu'],
    ['Heal Rate', 'Tỷ Lệ Hồi Phục'],
    ['Shield Rate', 'Tỷ Lệ Khiên'],
    ['DoT increase', 'Tăng Sát Thương Duy Trì'],
    ['advanced DMG Boost', 'Tăng Sát Thương Nâng Cao'],
    ['unaffected by Hit', 'không bị ảnh hưởng bởi Chính Xác'],
    ['DMG Immunity', 'Miễn Sát Thương'],
    ['DMG Reduction', 'Giảm Sát Thương'],
    ['DMG Boost', 'Tăng Sát Thương'],
    ['DMG RED', 'Giảm Sát Thương'],
    ['DMG Res', 'Kháng Sát Thương'],
    ['S.Stun', 'Choáng Chuyên Biệt']
  ]
  for (const [english, vietnamese] of phrases) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    protectedText = protectedText.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), () => reserve(vietnamese))
  }
  protectedText = protectedText.replace(/(\d+(?:\.\d+)?%)\s+Attack\b/gi, (_, amount) => `${amount} ${reserve('ATK')}`)
  const names = [...characterNames]
    .filter(([english, vietnamese]) => english && vietnamese && english !== vietnamese)
    .sort((a, b) => b[0].length - a[0].length)

  for (const [english, vietnamese] of names) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    protectedText = protectedText.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), () => reserve(vietnamese))
  }

  protectedText = protectedText.replace(/\b(?:ATK|HP|DEF|SPD|DMG|DoT|PvP|PvE|CRIT|ULT|EXTRA)\b/gi, match => reserve(match))
  return { protectedText, replacements }
}

function restoreText(text, replacements) {
  let result = text
  replacements.forEach((value, index) => {
    const token = `${TOKEN_PREFIX}${String(index).padStart(4, '0')}QXZ`
    result = result.replaceAll(token, value)
    result = result.replaceAll(token.toLowerCase(), value)
  })
  return result
    .replace(/K\u1ef9 n\u0103ng t\u1ed1i th\u01b0\u1ee3ng/gi, 'Tuy\u1ec7t K\u0129')
    .replace(/Si\u00eau t\u1ed1i th\u01b0\u1ee3ng/gi, 'Si\u00eau Tuy\u1ec7t K\u0129')
    .replace(/T\u1ed1i th\u01b0\u1ee3ng/gi, 'Tuy\u1ec7t K\u0129')
    .replace(/chi\u00eau cu\u1ed1i/gi, 'Tuy\u1ec7t K\u0129')
    .replace(/\bUltimate\b/gi, 'Tuy\u1ec7t K\u0129')
    .replace(/Tuyệt Kĩ\s+Skill/gi, 'Tuyệt Kĩ')
    .replace(/với giá (?=\d+(?:[.,]\d+)?%)/gi, 'với tổng sát thương bằng ')
    .replace(/DMG (?:đã )?lấy(?: vào)?/gi, 'DMG nhận vào')
    .replace(/\batk\b/gi, 'ATK')
    .replace(/\bcrit\b/gi, 'CRIT')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

async function translate(text) {
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'en')
  url.searchParams.set('tl', 'vi')
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)

  let lastError
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body = await response.json()
      return body[0].map(part => part[0]).join('')
    } catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, 400 * attempt))
    }
  }
  throw lastError
}

async function main() {
  const [viCatalog, enCatalog, glossaryMarkdown] = await Promise.all([
    readJson(VI_FILE),
    readJson(EN_FILE),
    fs.readFile(GLOSSARY_FILE, 'utf8')
  ])
  const headCatalog = readHeadEnglishCatalog()
  const glossary = parseGlossary(glossaryMarkdown)
  const viById = new Map(viCatalog.map(character => [character.id, character]))
  const headById = new Map(headCatalog.map(character => [character.id, character]))
  const characterNames = new Map(enCatalog.map(character => [character.name, viById.get(character.id)?.name || character.name]))

  let cache = {}
  if (!FRESH_TRANSLATION) {
    try { cache = await readJson(CACHE_FILE) } catch { /* first run */ }
  }

  const jobs = []
  for (const enCharacter of enCatalog) {
    const viCharacter = viById.get(enCharacter.id)
    if (!viCharacter) throw new Error(`Missing Vietnamese character: ${enCharacter.id}`)
    if (viCharacter.skills.length !== enCharacter.skills.length) {
      throw new Error(`Skill count mismatch: ${enCharacter.id}`)
    }
    const oldSkills = headById.get(enCharacter.id)?.skills || []
    enCharacter.skills.forEach((skill, index) => {
      const desc = String(skill.desc || '').trim()
      const oldDesc = String(oldSkills[index]?.desc || '').trim()
      if (!desc) throw new Error(`Missing English skill description: ${enCharacter.id} #${index + 1}`)
      if (PLACEHOLDER.test(desc)) {
        viCharacter.skills[index].desc = VI_PLACEHOLDER
        return
      }
      if (!TRANSLATE_ALL && desc === oldDesc) return
      jobs.push({ enCharacter, viCharacter, skill, index, desc })
    })
  }

  let completed = 0
  const workers = Array.from({ length: 6 }, async () => {
    while (jobs.length) {
      const job = jobs.shift()
      const key = skillKey(job.enCharacter.id, job.skill, job.index)
      const cacheKey = `${key}::${job.desc}`
      const { protectedText, replacements } = protectText(job.desc, glossary, characterNames)
      const translated = cache[cacheKey] || await translate(protectedText)
      cache[cacheKey] = translated
      job.viCharacter.skills[job.index].desc = restoreText(translated, replacements)
      completed += 1
      if (completed % 25 === 0) {
        await fs.writeFile(CACHE_FILE, `${JSON.stringify(cache)}\n`, 'utf8')
        process.stdout.write(`Translated ${completed}\n`)
      }
    }
  })

  await Promise.all(workers)
  await fs.writeFile(VI_FILE, `${JSON.stringify(viCatalog, null, 2)}\n`, 'utf8')
  await fs.writeFile(CACHE_FILE, `${JSON.stringify(cache)}\n`, 'utf8')
  console.log(JSON.stringify({
    translated: completed,
    glossaryTerms: glossary.size,
    translateAll: TRANSLATE_ALL,
    fresh: FRESH_TRANSLATION
  }, null, 2))
}

await main()
