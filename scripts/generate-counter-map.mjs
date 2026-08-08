/**
 * Counter Relationship Generator
 * Analyzes character skills to determine counter relationships.
 *
 * Logic:
 * - Characters with "Purify/Dispel" counter debuff-heavy characters
 * - Characters with "Shield/Tenacity" counter burst DPS characters
 * - Characters with "Silence/Seal" counter healer/support characters
 * - Characters with anti-heal counter healers
 * - Characters with high burst counter squishy/low-HP characters
 * - Characters with CC (stun/freeze) counter DPS without CC-immunity
 * - Type advantage: Giác Đấu > Công Nghệ > Tâm Linh > Vũ Trang > Giác Đấu
 */

import { readFileSync, writeFileSync } from 'fs'

const characters = JSON.parse(readFileSync('./src/data/characters.json', 'utf-8'))

// Only consider SSR+ tier and above for meaningful counter data
const highTierChars = characters.filter(c =>
  ['UR+', 'UR', 'SSR+', 'SSR'].includes(c.tier)
)

// Skill keyword tags for classification
const TAGS = {
  burst:     /sát thương trực tiếp|gây [\d]+% atk.*dmg|tuyệt kĩ|siêu tuyệt|bỏ qua.*phòng|xuyên qua.*bất khuất/i,
  heal:      /hồi phục|hồi máu|hồi hp|chữa trị|phục hồi|heal/i,
  shield:    /khiên|lá chắn|giáp|shield|hấp thụ sát thương/i,
  cc:        /choáng|đóng băng|câm lặng|khống chế|stun|freeze|silence|đông cứng|trói|immobilize/i,
  antiheal:  /cấm hồi|giảm hồi phục|chống hồi|anti.?heal|giảm.*chữa trị/i,
  dispel:    /tẩy|xua tan|giải trừ|dispel|purify|loại bỏ.*buff|loại bỏ.*hiệu ứng/i,
  debuff:    /giảm tốc|giảm phòng|giảm atk|burn|thiêu đốt|đốt cháy|trúng độc|nhiễm độc|poison|bleed|chảy máu/i,
  tenacity:  /bất khuất|tenacity|không thể bị giết|miễn tử|hồi sinh|revive/i,
  dodge:     /né tránh|né.*chuyên biệt|dodge|evasion|flash|lẩn tránh/i,
  aoe:       /tất cả.*kẻ địch|toàn bộ.*kẻ địch|all enem|tất cả mục tiêu|hàng sau|hàng trước/i,
  support:   /tăng atk|tăng.*đồng đội|buff.*đồng đội|cộng dồn|hỗ trợ.*đồng minh|năng lượng.*đồng đội/i,
  immunity:  /miễn.*khống chế|miễn.*choáng|miễn.*câm lặng|miễn dịch|immune|không bị.*khống/i,
}

function classifyCharacter(char) {
  const allText = (char.skills || []).map(s => s.desc || '').join(' ')
    + ' ' + (char.effects || []).map(e => e.desc || '').join(' ')

  const tags = new Set()
  for (const [tag, regex] of Object.entries(TAGS)) {
    if (regex.test(allText)) tags.add(tag)
  }
  return tags
}

// Type advantage wheel
const TYPE_ADVANTAGE = {
  'Giác Đấu': 'Công Nghệ',
  'Công Nghệ': 'Tâm Linh',
  'Tâm Linh': 'Vũ Trang',
  'Vũ Trang': 'Giác Đấu',
}

function computeCounters(targetChar, allChars) {
  const targetTags = classifyCharacter(targetChar)
  const scores = []

  for (const candidate of allChars) {
    if (candidate.id === targetChar.id) continue
    const candidateTags = classifyCharacter(candidate)
    let score = 0
    const reasons = []

    // Type advantage
    if (TYPE_ADVANTAGE[candidate.type] === targetChar.type) {
      score += 3
      reasons.push('type')
    }

    // Dispel counters debuff-heavy
    if (targetTags.has('debuff') && candidateTags.has('dispel')) {
      score += 2
      reasons.push('dispel-vs-debuff')
    }

    // Anti-heal counters healers
    if (targetTags.has('heal') && candidateTags.has('antiheal')) {
      score += 3
      reasons.push('antiheal-vs-heal')
    }

    // CC counters burst DPS without immunity
    if (targetTags.has('burst') && !targetTags.has('immunity') && candidateTags.has('cc')) {
      score += 2
      reasons.push('cc-vs-burst')
    }

    // Shield/tenacity counters burst
    if (targetTags.has('burst') && (candidateTags.has('shield') || candidateTags.has('tenacity'))) {
      score += 2
      reasons.push('tank-vs-burst')
    }

    // Burst counters healers/support
    if ((targetTags.has('heal') || targetTags.has('support')) && candidateTags.has('burst')) {
      score += 2
      reasons.push('burst-vs-support')
    }

    // CC immunity counters CC
    if (targetTags.has('cc') && candidateTags.has('immunity')) {
      score += 2
      reasons.push('immune-vs-cc')
    }

    // Dodge counters AoE
    if (targetTags.has('aoe') && candidateTags.has('dodge')) {
      score += 1
      reasons.push('dodge-vs-aoe')
    }

    // Higher tier bonus
    const tierOrder = ['SSR', 'SSR+', 'UR', 'UR+']
    const candidateTierIdx = tierOrder.indexOf(candidate.tier)
    const targetTierIdx = tierOrder.indexOf(targetChar.tier)
    if (candidateTierIdx > targetTierIdx) score += 1

    if (score >= 2) {
      scores.push({ id: candidate.id, score, reasons })
    }
  }

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, 5).map(s => s.id)
}

// Build counter map
const counterMap = {}
for (const char of highTierChars) {
  const counters = computeCounters(char, highTierChars)
  if (counters.length > 0) {
    counterMap[char.id] = counters
  }
}

// Also ensure characters without computed counters still have entries
// by giving them type-advantage picks
for (const char of highTierChars) {
  if (!counterMap[char.id] || counterMap[char.id].length === 0) {
    const typeCounters = highTierChars
      .filter(c => c.id !== char.id && TYPE_ADVANTAGE[c.type] === char.type)
      .sort((a, b) => {
        const tierOrder = ['SSR', 'SSR+', 'UR', 'UR+']
        return tierOrder.indexOf(b.tier) - tierOrder.indexOf(a.tier)
      })
      .slice(0, 3)
      .map(c => c.id)
    if (typeCounters.length) counterMap[char.id] = typeCounters
  }
}

console.log(`Generated counters for ${Object.keys(counterMap).length} characters`)
console.log('Sample:', JSON.stringify(Object.entries(counterMap).slice(0, 3), null, 2))

writeFileSync('./src/data/counterMap.json', JSON.stringify(counterMap, null, 2))
console.log('Written to src/data/counterMap.json')
