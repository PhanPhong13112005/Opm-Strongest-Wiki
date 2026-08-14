export const BUFF_GEAR_MAX_STARS = 6

// Verified against the public game-config used by the reference simulator.
// The active Buff Gear catalog resolves to quality 5; index 0 is intentionally empty.
export const buffGearGoldStarCosts = Object.freeze([
  null,
  { gold: 20000, ascensionCards: 4, crystalS: 300, crystalCore: 150 },
  { gold: 30000, ascensionCards: 8, crystalS: 600, crystalCore: 300 },
  { gold: 40000, ascensionCards: 16, crystalS: 1000, crystalCore: 500 },
  { gold: 50000, ascensionCards: 24, crystalS: 1500, crystalCore: 800 },
  { gold: 60000, ascensionCards: 32, crystalS: 2000, crystalCore: 1200 },
  { gold: 70000, ascensionCards: 32, crystalS: 2000, crystalCore: 1200 },
])

export const buffGearPurpleStarCosts = Object.freeze([
  null,
  { gold: 100000, refinementCards: 2 },
  { gold: 100000, refinementCards: 4 },
  { gold: 100000, refinementCards: 6 },
  { gold: 100000, refinementCards: 8 },
  { gold: 100000, refinementCards: 12 },
  { gold: 100000, refinementCards: 16 },
])

const add = (target, source) => {
  for (const [key, value] of Object.entries(source || {})) target[key] = (target[key] || 0) + value
}

const cumulative = (costs, level) => {
  const total = {}
  for (let star = 1; star <= level; star += 1) add(total, costs[star])
  return total
}

export const setBuffGearGoldStars = (mechanic, requested) => {
  const next = Math.max(0, Math.min(BUFF_GEAR_MAX_STARS, Number(requested) || 0))
  mechanic.goldStars = mechanic.goldStars === next ? Math.max(0, next - 1) : next
  mechanic.purpleStars = Math.min(mechanic.purpleStars, mechanic.goldStars)
  mechanic.refineLevel = Math.min(mechanic.refineLevel, mechanic.purpleStars)
  return mechanic
}

export const setBuffGearPurpleStars = (mechanic, requested) => {
  const next = Math.max(0, Math.min(mechanic.goldStars, Number(requested) || 0))
  mechanic.purpleStars = mechanic.purpleStars === next ? Math.max(0, next - 1) : next
  mechanic.refineLevel = mechanic.purpleStars
  return mechanic
}

export const getBuffGearMechanicCost = mechanic => {
  const total = cumulative(buffGearGoldStarCosts, mechanic.goldStars)
  add(total, cumulative(buffGearPurpleStarCosts, mechanic.purpleStars))
  return total
}

export const getBuffGearLoadoutCost = state => {
  const total = { gold: 0, ascensionCards: 0, crystalS: 0, crystalCore: 0, refinementCards: 0 }
  for (const slot of Object.values(state.slots)) add(total, getBuffGearMechanicCost(slot.mechanic))
  return total
}

export const getBuffGearMainStatValue = mechanic => 5 * (mechanic.goldStars + 1)
