const positiveCostOrZero = (cost) => (
  typeof cost === 'number' && Number.isFinite(cost) && cost > 0 ? cost : 0
)

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