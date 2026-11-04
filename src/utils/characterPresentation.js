import presentations from '../data/characterPresentation.json'

export const getCharacterPresentation = character => presentations[character?.id] || {}

// Owner-scoped presentation restriction; never rewrite Core data or costs.
export const isCoreLevelEffectPending = (hero, level) => {
  const review = presentations[hero?.characterId]?.coreEffectReview
  return !!review && review.coreHeId === hero?.coreHeId && review.unverifiedLevels.includes(level?.lv)
}

export const getCharacterBackground = character => {
  const background = getCharacterPresentation(character).background
  return /^#[\da-f]{6}$/i.test(background || '') ? background : undefined
}

export const getCharacterKeepsakeIcon = character => (
  character?.keepsakeIcon || getCharacterPresentation(character).keepsakeIcon || ''
)

export const getSkillKeepsakeUnlock = (skill, character) => {
  const superUltimate = /siêu|super\s*ultimate/i.test(skill?.name || '')
  const presentation = getCharacterPresentation(character)
  if (presentation.keepsakeImageReview?.unlockCondition === 'PENDING') {
    if (!superUltimate) return null
    const review = presentation.superUltimateUpgradeReview
    return { status: 'PENDING', detailAvailable: false, itemId: null,
      icon: review?.imageIdentity === 'OWNER_CONFIRMED_AND_COMMUNITY_SUPER_HEADER_MATCH' ? getCharacterKeepsakeIcon(character) : '' }
  }
  const icon = skill?.keepsakeIcon || (superUltimate ? getCharacterKeepsakeIcon(character) : '')
  if (!icon) return null
  return { icon, detailAvailable: getCharacterPresentation(character).keepsakeDetailAvailable !== false }
}
