export const getMaterialProfile = (hero, profiles = []) => profiles.find(profile =>
  profile.characterId === hero?.characterId && profile.coreHeId === hero?.coreHeId,
)

// Destination-level costs: 4 -> 10 pays steps 5..10, never the Lv0 effect.
// Missing/malformed data invalidates the total instead of becoming zero.
export const calculateCoreMaterials = (hero, from, to, profiles = []) => {
  const empty = { totals: {}, steps: [], missingLevels: [] }
  if (!hero || !Number.isInteger(from) || !Number.isInteger(to) ||
    from < 0 || to < from || to > hero.maxLv) return { ...empty, status: 'INVALID_RANGE' }
  if (from === to) return { ...empty, status: 'VERIFIED' }
  const profile = getMaterialProfile(hero, profiles)
  const steps = [], missingLevels = [], totals = {}
  for (let lv = from + 1; lv <= to; lv++) {
    let cost
    if (profile) {
      const current = profile.cumulative[lv]
      const previous = lv === 1 ? profile.materialOrder.map(() => 0) : profile.cumulative[lv - 1]
      const valid = vector => Array.isArray(vector) && vector.length === profile.materialOrder.length &&
        vector.every(value => Number.isSafeInteger(value) && value >= 0)
      if (profile.quantityStatus === 'SOURCE_VERIFIED' && valid(current) && valid(previous)) {
        cost = profile.materialOrder.map((id, index) => [id, current[index] - previous[index]])
      }
    } else {
      const level = hero.levels?.find(entry => entry.lv === lv)
      if (Array.isArray(level?.cost) && Array.isArray(level?.comp)) cost = [...level.cost, ...level.comp]
    }
    if (!cost?.length || cost.some(entry => !Array.isArray(entry) || entry.length !== 2 ||
      typeof entry[0] !== 'string' || !Number.isSafeInteger(entry[1]) || entry[1] < 0)) {
      missingLevels.push(lv)
      continue
    }
    steps.push({ from: lv - 1, to: lv, cost, source: profile?.source || 'coreLab.json',
      verificationStatus: profile ? 'DERIVED_VERIFIED' : 'EXISTING_DATA' })
    for (const [id, amount] of cost) totals[id] = (totals[id] || 0) + amount
  }
  return missingLevels.length
    ? { status: 'INCOMPLETE', totals: {}, steps, missingLevels }
    : { status: 'VERIFIED', totals, steps, missingLevels }
}
