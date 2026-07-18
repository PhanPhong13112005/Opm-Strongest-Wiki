import { isApiConfigured, requestApi } from './apiClient'

const formatLegacyDate = (value) => {
  if (!value) return value
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

export const mapCharacterSummary = (character) => ({
  id: character.id,
  name: character.name,
  imageURL: character.imageUrl,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: character.roles || [],
  classLevel: character.classLevel,
  keepsakeIcon: character.keepsakeIcon,
  releaseSea: formatLegacyDate(character.releaseSea),
  releaseTrung: formatLegacyDate(character.releaseChina),
})

export const mergeCharacterDetail = (character, localCharacter = {}) => ({
  ...localCharacter,
  id: character.id,
  name: character.name,
  imageURL: character.imageUrl,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: character.roles || [],
  duyen: character.duyen,
  bio: character.bio,
  keepsakeIcon: character.keepsakeIcon,
  dacTinh: character.traits || [],
  bondList: character.bondList,
  classLevel: character.classLevel,
  releaseSea: formatLegacyDate(character.releaseSea) || localCharacter.releaseSea,
  releaseTrung: formatLegacyDate(character.releaseChina) || localCharacter.releaseTrung,
  baseStats: character.baseStats,
  pvpStats: character.pvpStats,
  skills: (character.skills || []).map((skill) => ({
    ...(localCharacter.skills?.[skill.sortOrder] || {}),
    name: skill.name,
    desc: skill.description,
    type: skill.type,
    icon: skill.iconUrl,
    animation: skill.animationUrl,
    keepsakeIcon: skill.keepsakeIconUrl,
  })),
  effects: (character.effects || []).map((effect) => ({
    term: effect.term,
    desc: effect.description,
  })),
  updatedAt: character.updatedAt,
})

export const getCharacters = async ({ localCharacters = [], ...query }) => {
  const result = await requestApi('api/characters', query)
  const localById = new Map(localCharacters.map((character) => [character.id, character]))
  return {
    ...result,
    items: result.items.map((character) => ({
      ...(localById.get(character.id) || {}),
      ...mapCharacterSummary(character),
    })),
  }
}

export const getAllCharacters = async (language, localCharacters = []) => {
  const firstPage = await getCharacters({
    language,
    page: 1,
    pageSize: 100,
    localCharacters,
  })

  if (firstPage.totalPages <= 1) return firstPage.items

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getCharacters({
      language,
      page: index + 2,
      pageSize: 100,
      localCharacters,
    })),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.items)
}

export const getCharacterById = async (id, language, localCharacter) => {
  const result = await requestApi(`api/characters/${encodeURIComponent(id)}`, { language })
  return mergeCharacterDetail(result, localCharacter)
}

export const isCharacterApiConfigured = isApiConfigured
