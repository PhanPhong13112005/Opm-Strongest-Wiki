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

const ROLE_TRANSLATIONS = new Map([
  ['Universal Support', 'Hỗ Trợ Toàn Năng'],
  ['HP Amplification', 'Tăng Cường HP'],
  ['Enhanced Crit Strikes', 'Tăng Chí Mạng Cường Hóa'],
  ['Strike first', 'Tấn Công Trước'],
  ['HP Conversion', 'Chuyển Đổi HP'],
  ['Battle Momentum', 'Khí Thế Chiến Đấu'],
  ['Infinity Split', 'Phân Chia Vô Hạn'],
  ['One-Man Army', 'Một Người Thành Một Đội Quân'],
  ['Rebirth Recovery', 'Hồi Sinh Hồi Phục'],
  ['Rampage Combo', 'Truy Kích Cuồng Bạo'],
  ['Frontline Suppress', 'Áp Chế Tiền Tuyến'],
  ['Endless Hunt', 'Săn Đuổi Vô Tận'],
  ['Deals powerful direct damage and restrains damage boost', 'Gây Sát Thương Trực Tiếp Mạnh & Giới Hạn Tăng Sát Thương'],
  ['Applies Haste and [Life Link] to the ally full row', 'Tăng Tốc & Liên Kết HP Cùng Hàng'],
  ['Disorder DMG', 'Sát Thương Rối Loạn'],
  ['Rebattle', 'Tái Chiến'],
  ['Balanced Offense and Defense', 'Công Thủ Toàn Diện'],
  ['Energy Conversion', 'Chuyển Đổi Năng Lượng'],
  ['Blindness Control', 'Khống Chế Gây Mù'],
  ['Undying', 'Bất Tử'],
  ['Specialized Shatter', 'Phá Giáp Chuyên Biệt'],
  ['Start of battle Suppression', 'Áp Chế Đầu Trận'],
  ['Internal Injury Bonus', 'Tăng Sát Thương Nội Thương'],
  ['Action Healing', 'Hồi Phục Khi Hành Động'],
  ['Excess Recovery', 'Hồi Phục Dư Thừa'],
  ['Arena Core', 'Hạt Nhân Đấu Trường'],
  ['Focused Rage', 'Tích Lực Nổi Giận'],
  ['Powerful Counterattack', 'Phản Đòn Mạnh Vẽ'],
  ['Tenacious Core', 'Hạt Nhân Kiên Cường'],
  ['Enhanced Block', 'Đỡ Đòn Cường Hóa'],
  ['Charged Attack', 'Tấn Công Tích Lực'],
  ['Team Damage Reflection', 'Phản Sát Thương Toàn Đội'],
  ['Offensive Breakthrough', 'Đột Phá Tấn Công'],
  ['Revenge Follow-Up', 'Truy Kích Phản Đòn'],
  ['Increase speed', 'Tăng Tốc Độ'],
  ['Ultimate Follow-up', 'Truy Kích Tuyệt Kĩ'],
  ['DoT & Guard Recovery', 'Hồi Phục Bảo Hộ & DoT'],
  ['Same Row Speed up', 'Tăng Tốc Cùng Hàng'],
  ['Same Row Speed Up', 'Tăng Tốc Cùng Hàng'],
  ['AOE True DMG', 'Sát Thương Chuẩn Diện Rộng'],
  ['Triggers counterattack on block', 'Phản Đòn Khi Đỡ Đòn'],
  ['Burn', 'Thiêu Đốt'],
  ['ignite', 'Thiêu Đốt'],
  ['inflict true dame', 'Gây Sát Thương Chuẩn'],
  ['Ignite Internal Injury', 'Kích Nổ Nội Thương'],
  ['Group Unyielding', 'Bất Khuất Toàn Đội'],
  ['Extreme captain', 'Đội Trưởng Cực Hạn'],
  ['HP Enhancement', 'Tăng Cường HP'],
  ['Specialized Burn', 'Thiêu Đốt Chuyên Biệt'],
  ['All-out Support', 'Hỗ Trợ Toàn Diện'],
  ['Follow-up Lockdown and Continuous Damage', 'Khóa Truy Kích & Sát Thương Duy Trì'],
  ['Group Healing', 'Hồi Phục Toàn Đội'],
  ['Same Row Nullification', 'Vô Hiệu Cùng Hàng'],
  ['No critical hit no death', 'Bất Khuất Không Bạo Kích'],
  ['ignite and shatter all enemies', 'Thiêu Đốt & Phá Giáp Toàn Địch'],
  ['Specialized Extra and CRIT Aura', 'Hào Quang Chí Mạng & Sát Thương Bổ Sung Chuyên Biệt'],
  ['Mighty Direct Dmg', 'Sát Thương Trực Tiếp Mạnh'],
  ['Momentum DMG Free', 'Miễn Sát Thương Khí Thế'],
  ['Breakthrough Unyielding', 'Đột Phá Bất Khuất'],
  ['Share Damage', 'Chia Sẻ Sát Thương'],
  ['Shield Energy Charge', 'Nạp Năng Lượng Khiên'],
  ['Locked Burst', 'Bộc Phá Khóa Mục Tiêu'],
  ['Spec. Burn', 'Thiêu Đốt Chuyên Biệt'],
  ['Same row speed up in Rapid Divinity', 'Tăng Tốc Cùng Hàng Thần Tốc'],
  ["King's Deterrence", 'Uy Áp Của Vua'],
  ['Control removed', 'Xóa Khống Chế'],
  ['Continuous Follow-up and High Internal Injury', 'Truy Kích Liên Tục & Nội Thương Cao'],
  ['Psychic Barrier Suppression', 'Áp Chế Rào Cản Tâm Linh'],
  ['Combined Detonation', 'Kích Nổ Kết Hợp'],
  ['Specialized Fear', 'Nỗi Sợ Chuyên Biệt'],
  ['Slay Lives', 'Trảm Sát'],
  ['Ultimate DMG Free', 'Miễn Sát Thương Tuyệt Kĩ'],
  ['Instant DMG Evasion', 'Né Sát Thương Tức Thời'],
  ['Combo Support', 'Hỗ Trợ Truy Kích'],
  ['Ignores Unyielding', 'Bỏ Qua Bất Khuất'],
  ['Healing Absorpotion', 'Hấp Thụ Trị Liệu'],
  ['Damage Taker', 'Gánh Sát Thương'],
  ['Out of Control', 'Mất Kiểm Soát'],
  ['Follow-up', 'Truy Kích'],
  ['Damage Reflection', 'Phản Sát Thương'],
  ['Robot Support', 'Hỗ Trợ Robot'],
  ['Follow-up and Heal', 'Truy Kích & Hồi Phục'],
  ['Spec. Corrode', 'Ăn Mòn Chuyên Biệt'],
  ['Column Combo', 'Truy Kích Cùng Cột'],
  ['Drive Knight', 'Hiệp Sĩ Lái Xe'],
  ['Tactical Transformation', 'Biến Hình Chiến Thuật'],
  ['Specialized Acceleration', 'Tăng Tốc Chuyên Biệt'],
  ['Counterattack', 'Phản Đòn'],
  ['Unyielding Breakthrough', 'Đột Phá Bất Khuất'],
  ['Spec. Guard', 'Bảo Hộ Chuyên Biệt'],
  ['Spec. Berserk', 'Cuồng Bạo Chuyên Biệt'],
  ['Survival Core', 'Hạt Nhân Sinh Tồn'],
  ['Column Breakthrough', 'Đột Phá Cùng Cột'],
  ['Spec. DMG Reflect', 'Phản Sát Thương Chuyên Biệt'],
  ['Corrosive Adhesion', 'Kết Dính Ăn Mòn'],
  ['Monster Assist', 'Hỗ Trợ Quái Nhân'],
  ['Addtional Silence', 'Câm Lặng Bổ Sung'],
  ['Energy Blocker', 'Khóa Năng Lượng'],
  ['Resilience Remove', 'Xóa Bền Bỉ'],
  ['Guard Bonus', 'Tăng Cường Phòng Thủ'],
  ['Asists teammates', 'Hỗ Trợ Đồng Minh'],
  ['Stun Immunity', 'Miễn Choáng'],
  ['Constant Follow-up', 'Truy Kích Liền Tay'],
  ['Specialized Reborn', 'Tái Sinh Chuyên Biệt'],
  ['AoE Stun', 'Choáng Diện Rộng'],
  ['Corrosion Immunity', 'Miễn Ăn Mòn'],
  ['Charge Damage', 'Sát Thương Tích Lực'],
  ['Attack Restraint', 'Hạn Chế Tấn Công'],
  ['Tenacity and Resurrection', 'Kiên Cường & Hồi Sinh'],
  ['Enemy off battle', 'Đẩy Kẻ Địch Vẫn Trận'],
  ['ally reborn', 'Hồi Sinh Đồng Minh'],
  ['Specialized Corrode', 'Ăn Mòn Chuyên Biệt'],
  ['Glutton Everything', 'Thôn Phệ Tất Cả'],
  ['Back Row Charm', 'Mê Hoặc Hàng Sau'],
  ['Continuous Rebellion', 'Phản Kháng Liên Tục'],
  ['All Breakthrough', 'Đột Phá Toàn Bộ'],
  ['Enhance Shield', 'Tăng Cường Khiên'],
  ['Group Reflect DMG', 'Phản Sát Thương Toàn Đội'],
  ['Breakthrough and Unyielding', 'Đột Phá & Bất Khuất'],
  ['DMG Reflecion', 'Phản Sát Thương'],
  ['Tactical Combo', 'Truy Kích Chiến Thuật'],
  ['Column Disabler', 'Khống Chế Cùng Cột'],
  ['Encourage Allies', 'Khích Lệ Đồng Minh'],
  ['Same-row acceleration', 'Tăng Tốc Cùng Hàng'],
  ['massive Tenacity', 'Kiên Cường Khổng Lồ'],
  ['consecutive Follow-up', 'Truy Kích Liên Tiếp'],
  ['AoE Shatter', 'Phá Giáp Diện Rộng'],
  ['Strong Follow-up', 'Truy Kích Mạnh Vẽ'],
  ['Core Duelist', 'Hạt Nhân Đấu Sĩ'],
  ['Internal Injury', 'Nội Thương'],
  ['Team Block', 'Đỡ Đòn Đồng Minh'],
  ['Healing Restraint', 'Hạn Chế Trị Liệu'],
  ['Multi-Ally Agility', 'Nhanh Nhẹn Nhiều Đồng Minh'],
  ['Resilience Core', 'Hạt Nhân Bền Bỉ'],
  ['Single-target Attacker', 'Sát Thương Đơn Thể'],
  ['Strongest Burst', 'Bộc Phá Mạnh Nhất'],
  ['Reflect DMG', 'Phản Sát Thương'],
  ['Injury DMG', 'Sát Thương Trọng Thương'],
  ['Stun', 'Choáng'],
  ['Collapse Core', 'Hạt Nhân Sụp Đổ'],
  ['DMG (ATK)', 'Sát Thương (Công)'],
  ['Speed', 'Tốc Độ'],
  ['Support', 'Hỗ Trợ'],
  ['Core', 'Hạt Nhân'],
  ['DMG (HP)', 'Sát Thương (Máu)'],
  ['Accumulated DMG', 'Sát Thương Tích Lũy'],
  ['Increase DoT', 'Tăng Sát Thương Duy Trì'],
  ['Esper & Outlaw Buff', 'Buff Tâm Linh & Tội Phạm'],
  ['Collapse', 'Sụp Đổ'],
  ['Max HP Core', 'Hạt Nhân HP Tối Đa'],
  ['Increase Shield', 'Tăng Khiên'],
  ['Generate Shield', 'Tạo Khiên'],
  ['Single Target DMG', 'Sát Thương Đơn Thể'],
  ['Revive', 'Hồi Sinh'],
  ['Reduce ATK', 'Giảm ATK'],
  ['Splash DMG', 'Sát Thương Lan'],
  ['Reduce Ultimate DMG', 'Giảm Sát Thương Tuyệt Kĩ'],
  ['Share DMG', 'Chia Sẻ Sát Thương'],
  ['Tenacity', 'Kiên Cường'],
  ['AoE Injury', 'Trọng Thương Diện Rộng'],
  ['Armored Gorilla', 'Khối Giác Đấu'],
  ['Grappler Block', 'Đỡ Đòn Giác Đấu'],
  ['Versatile', 'Linh Hoạt'],
  ['Injury', 'Trọng Thương'],
  ['Reduce Crit Res', 'Giảm Kháng Bạo'],
  ['Doctor Genus', 'Tiến Sĩ Genus'],
  ['Berserk Core', 'Hạt Nhân Cuồng Bạo'],
  ['AoE DMG', 'Sát Thương Diện Rộng'],
  ['Corrode', 'Ăn Mòn'],
  ['Increase ATK', 'Tăng ATK'],
  ['Increase DMG', 'Tăng Sát Thương'],
  ['Reduce Extra DMG', 'Giảm Sát Thương Bổ Sung'],
  ['Weaken', 'Suy Yếu']
])

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

    if (enCharacter.roles && enCharacter.roles.length > 0) {
      viCharacter.roles = enCharacter.roles.map(r => ROLE_TRANSLATIONS.get(r) || r)
    }

    if (viCharacter.dacTinh) {
      const isCoreRole = (enCharacter.roles || []).some(r => r.toLowerCase().includes('core'))
      if (!isCoreRole) {
        viCharacter.dacTinh = viCharacter.dacTinh.filter(d => d.toLowerCase() !== 'hạt nhân')
      }
    }

    if (enCharacter.effects && enCharacter.effects.length > 0) {
      const oldEffects = headById.get(enCharacter.id)?.effects || []
      viCharacter.effects = enCharacter.effects.map((eff, effIdx) => {
        const termRaw = eff.term.replace(/^\[|\]$/g, '').trim()
        const translatedTerm = glossary.get(termRaw.toLocaleLowerCase('en')) || termRaw
        const oldDesc = String(oldEffects[effIdx]?.desc || '').trim()
        return {
          term: `[${translatedTerm}]`,
          desc: eff.desc,
          oldDesc,
          rawDesc: eff.desc,
        }
      })
      viCharacter.effects.forEach((eff, effIdx) => {
        const desc = eff.rawDesc
        const oldDesc = eff.oldDesc
        delete eff.rawDesc
        delete eff.oldDesc
        if (desc && (TRANSLATE_ALL || desc !== oldDesc)) {
          jobs.push({ type: 'effect', enCharacter, viCharacter, effIdx, desc })
        } else if (desc) {
          const { protectedText, replacements } = protectText(desc, glossary, characterNames)
          eff.desc = restoreText(protectedText, replacements)
        }
      })
    }

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
      if (job.type === 'effect') {
        const cacheKey = `effect::${job.enCharacter.id}::${job.effIdx}::${job.desc}`
        const { protectedText, replacements } = protectText(job.desc, glossary, characterNames)
        const translated = cache[cacheKey] || await translate(protectedText)
        cache[cacheKey] = translated
        job.viCharacter.effects[job.effIdx].desc = restoreText(translated, replacements)
      } else {
        const key = skillKey(job.enCharacter.id, job.skill, job.index)
        const cacheKey = `${key}::${job.desc}`
        const { protectedText, replacements } = protectText(job.desc, glossary, characterNames)
        const translated = cache[cacheKey] || await translate(protectedText)
        cache[cacheKey] = translated
        job.viCharacter.skills[job.index].desc = restoreText(translated, replacements)
      }
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
