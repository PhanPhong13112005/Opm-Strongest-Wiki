import rankingConfig from '../../BANG_XEP_HANG_NHAN_VAT.json' with { type: 'json' }

export const POWER_BANDS = ['SS', 'S', 'A', 'B', 'C', 'D']
export const RANKING_BANDS = ['CORE', ...POWER_BANDS]
export const VERIFIED_MONTHLY_VOTES_PER_RARITY = 8

const BAND_CUTOFF_RATIOS = [0.12, 0.30, 0.55, 0.75, 0.90, 1]
const CONFIG_BY_ID = new Map(rankingConfig.characters.map(character => [character.id, character]))
const normalizedVotes = value => {
  const votes = Number(value)
  return Number.isFinite(votes) ? Math.max(0, Math.round(votes)) : 0
}
const baselineVoteCounts = rankingConfig.characters.map(character => normalizedVotes(character.baseVotes))
const baselineVotesByRarity = rankingConfig.characters.reduce((totals, character) => {
  const rarity = String(character.rarity || '')
  totals.set(rarity, (totals.get(rarity) || 0) + normalizedVotes(character.baseVotes))
  return totals
}, new Map())
const minimumParticipantsByRarity = Math.max(
  0,
  ...[...baselineVotesByRarity.values()].map(votes => Math.ceil(votes / VERIFIED_MONTHLY_VOTES_PER_RARITY)),
)
const minimumParticipants = Math.max(0, ...baselineVoteCounts, minimumParticipantsByRarity)
const configuredParticipants = normalizedVotes(rankingConfig.sampleParticipants)

export const RANKING_BASELINE_STATS = Object.freeze({
  totalParticipants: Math.max(minimumParticipants, configuredParticipants),
  totalVotes: baselineVoteCounts.reduce((total, votes) => total + votes, 0),
})

export const rankingConfigForCharacter = character => CONFIG_BY_ID.get(character?.id)

export const isCoreCharacter = character => rankingConfigForCharacter(character)?.isCore === true

export const baseVotesForCharacter = character => {
  return normalizedVotes(rankingConfigForCharacter(character)?.baseVotes)
}

export const groupCharactersByBand = (characters) => {
  const groups = Object.fromEntries(RANKING_BANDS.map(band => [band, []]))
  const coreCharacters = characters.filter(isCoreCharacter)
  const powerCharacters = characters.filter(character => !isCoreCharacter(character))
  const cutoffs = BAND_CUTOFF_RATIOS.map(ratio => Math.ceil(powerCharacters.length * ratio))

  groups.CORE.push(...coreCharacters)
  powerCharacters.forEach((character, index) => {
    const bandIndex = cutoffs.findIndex(cutoff => index < cutoff)
    groups[POWER_BANDS[Math.max(0, bandIndex)]].push(character)
  })

  return groups
}