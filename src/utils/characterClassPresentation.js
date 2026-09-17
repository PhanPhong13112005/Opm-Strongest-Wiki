const DISASTER_LEVELS = new Map([
  ['tiger', { canonical: 'Tiger', vi: 'Hổ', en: 'Tiger', icon: '/Class/Tiger.png' }],
  ['demon', { canonical: 'Demon', vi: 'Quỷ', en: 'Demon', icon: '/Class/Demon.png' }],
  ['dragon', { canonical: 'Dragon', vi: 'Rồng', en: 'Dragon', icon: '/Class/Dragon.png' }],
  ['god', { canonical: 'God', vi: 'Thần', en: 'God', icon: '' }],
  ['wolf', { canonical: 'Wolf', vi: 'Sói', en: 'Wolf', icon: '' }],
])

const isMonsterFaction = (value) => {
  const faction = String(value || '').trim().toLocaleLowerCase('vi')
  return faction === 'monster' || faction === 'quái nhân' || faction === 'quái vật'
}

const disasterLevelFor = (classLevel, faction) => {
  if (!isMonsterFaction(faction)) return null
  return DISASTER_LEVELS.get(String(classLevel || '').trim().toLowerCase()) || null
}

export const resolveCharacterClassPresentation = (character = {}, language = 'vi') => {
  const classLevel = String(character.classLevel || '').trim()
  const disasterLevel = disasterLevelFor(classLevel, character.faction)

  if (!disasterLevel) {
    return {
      classLevel,
      label: classLevel,
      icon: character.classIcon || character.cardClassIcon || '',
      classIcon: character.classIcon,
      cardClassIcon: character.cardClassIcon,
    }
  }

  const icon = disasterLevel.icon
  return {
    classLevel: disasterLevel.canonical,
    label: String(language || 'vi').toLowerCase() === 'vi'
      ? disasterLevel.vi
      : disasterLevel.en,
    icon,
    classIcon: icon || undefined,
    cardClassIcon: icon || undefined,
  }
}

export const resolveMergedCharacterClass = (character = {}, localCharacter = {}, language = 'vi') => {
  const classLevel = String(character.classLevel || localCharacter.classLevel || '').trim()
  const faction = character.faction || localCharacter.faction
  const presentation = resolveCharacterClassPresentation({
    classLevel,
    faction,
    classIcon: localCharacter.classIcon || character.classIcon,
    cardClassIcon: localCharacter.cardClassIcon || character.cardClassIcon,
  }, language)

  return {
    classLevel: presentation.classLevel,
    classIcon: presentation.classIcon,
    cardClassIcon: presentation.cardClassIcon,
  }
}
