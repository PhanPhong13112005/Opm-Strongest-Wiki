const positiveCostOrZero = (cost) => (
  typeof cost === 'number' && Number.isFinite(cost) && cost > 0 ? cost : 0
)

// Numerical upgrades do not establish unlock/star/awakening-stage mappings.
// Keep the source description untouched and format each effect's own chain.
export const getSkillDescriptionForDisplay = (skill) => {
  const description = String(skill?.desc || '')
  const type = String(skill?.type || '').toLocaleLowerCase()
  if (!['thức tỉnh', 'bị động thức tỉnh', 'thức tỉnh 2', 'thức tỉnh 3', 'awaken', 'awakening', 'awakened passive', 'awaken 2', 'awaken 3'].includes(type)) return description

  const pattern = /\d+(?:[.,]\d+)?%?(?:[ \t]+\[\d+(?:[.,]\d+)?%?\])+/gu
  let result = ''
  let copiedUntil = 0
  let match
  while ((match = pattern.exec(description)) !== null) {
    // Safari 14 has no lookbehind. Inspect the preceding Unicode code point
    // without consuming it, so adjacent chains can still both be formatted.
    const prefix = description.slice(Math.max(0, match.index - 2), match.index)
    if (/[\p{L}\p{N}_.]$/u.test(prefix)) {
      // A rejected start can contain a later valid start (e.g. x2,5 [6]).
      // Resume one ASCII digit later, as the original regexp search did.
      pattern.lastIndex = match.index + 1
      continue
    }
    result += description.slice(copiedUntil, match.index)
      + match[0].replace(/[ \t]+\[([^\]]+)\]/g, ' → $1')
    copiedUntil = pattern.lastIndex
  }
  return result + description.slice(copiedUntil)
}

export const getSkillEnergyCost = (skill, skills = []) => {
  if (!skill) return 0
  if (typeof skill.cost === 'number') return positiveCostOrZero(skill.cost)
  if (!Array.isArray(skills)) return 0

  const skillIndex = skills.indexOf(skill)
  if (skillIndex <= 0) return 0

  const previousSkill = skills[skillIndex - 1]
  if (!previousSkill || previousSkill.type !== skill.type) return 0
  return positiveCostOrZero(previousSkill.cost)
}

// Shared passive-state badges, independent of character identity.
export const getPassiveUpgradeTone = (skill) => {
  const type = String(skill?.type || '').toLocaleLowerCase()
  if (!['nội tại', 'bị động', 'passive', 'extreme passive', '5-star passive', 'core'].includes(type)) return ''
  const name = String(skill?.name || '').toLocaleLowerCase()
  if (name.includes('5★ vàng') || name.includes('5★ gold') || name.includes('cực hạn') || name.includes('extreme')) return 'gold'
  if (name.includes('5★ tím') || name.includes('5★ purple') || name.includes('5 sao') || name.includes('5 stars') || name.includes('5 star') || name.includes('5★ passive')) return 'purple'
  if (name === 'bị động' || name === 'passive' || name.endsWith('— base')) return 'base-stars'
  return ''
}
