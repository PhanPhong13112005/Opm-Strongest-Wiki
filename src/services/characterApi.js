import { isApiConfigured, requestApiCached } from './apiClient.js'

const formatLegacyDate = (value) => {
  if (!value) return value
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

export const mapCharacterSummary = (character, localCharacter = {}) => ({
  id: character.id,
  name: character.name,
  imageURL: localCharacter.imageURL || character.imageUrl,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: character.roles || [],
  classLevel: character.classLevel,
  keepsakeIcon: localCharacter.keepsakeIcon || character.keepsakeIcon,
  releaseSea: formatLegacyDate(character.releaseSea),
  releaseTrung: formatLegacyDate(character.releaseChina),
})

const mapApiSkill = (skill) => ({
  name: skill.name,
  desc: skill.description,
  type: skill.type,
  icon: skill.iconUrl,
  animation: skill.animationUrl,
  keepsakeIcon: skill.keepsakeIconUrl,
})

const mergeCharacterSkills = (characterSkills, localSkills) => {
  const apiSkills = Array.isArray(characterSkills) ? characterSkills : []
  const fallbackSkills = Array.isArray(localSkills) ? localSkills : []

  if (fallbackSkills.length === 0) return apiSkills.map(mapApiSkill)

  const apiBySortOrder = new Map(
    apiSkills.map((skill, index) => [
      Number.isInteger(skill.sortOrder) ? skill.sortOrder : index,
      skill,
    ]),
  )
  const usedApiSkills = new Set()
  const merged = fallbackSkills.map((localSkill, index) => {
    const apiSkill = apiBySortOrder.get(index)
    if (apiSkill) usedApiSkills.add(apiSkill)
    return {
      ...(apiSkill ? mapApiSkill(apiSkill) : {}),
      ...localSkill,
    }
  })

  for (const apiSkill of apiSkills) {
    if (!usedApiSkills.has(apiSkill)) merged.push(mapApiSkill(apiSkill))
  }

  return merged
}

export const mergeCharacterDetail = (character, localCharacter = {}) => ({
  ...localCharacter,
  id: character.id,
  name: character.name,
  imageURL: localCharacter.imageURL || character.imageUrl,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: character.roles || [],
  duyen: character.duyen,
  bio: character.bio,
  keepsakeIcon: localCharacter.keepsakeIcon || character.keepsakeIcon,
  dacTinh: character.traits || [],
  bondList: character.bondList,
  classLevel: character.classLevel,
  releaseSea: formatLegacyDate(character.releaseSea) || localCharacter.releaseSea,
  releaseTrung: formatLegacyDate(character.releaseChina) || localCharacter.releaseTrung,
  baseStats: character.baseStats,
  pvpStats: character.pvpStats,
  skills: mergeCharacterSkills(character.skills, localCharacter.skills),
  effects: character.effects?.length ? character.effects.map((effect) => ({
    term: effect.term,
    desc: effect.description,
  })) : (localCharacter.effects || []),
  updatedAt: character.updatedAt,
})

const releaseTime = (character) => {
  const value = character.releaseSea || character.releaseDate || character.releaseTrung
  if (!value) return null
  const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  if (legacy) return Date.UTC(Number(legacy[3]), Number(legacy[2]) - 1, Number(legacy[1]))
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

const fallbackCharacters = (localCharacters, query) => {
  const search = String(query.search || '').trim().toLowerCase()
  return localCharacters
    .filter((character) => {
      if (search && !String(character.name || '').toLowerCase().includes(search)) return false
      if (query.tier && character.tier !== query.tier) return false
      if (query.type && character.type !== query.type) return false
      if (query.faction && character.faction !== query.faction) return false
      return true
    })
    .sort((left, right) => {
      if (query.sort === 'name_asc') return left.name.localeCompare(right.name)
      const leftRelease = releaseTime(left)
      const rightRelease = releaseTime(right)
      if (leftRelease === null && rightRelease !== null) return 1
      if (leftRelease !== null && rightRelease === null) return -1
      if (leftRelease !== rightRelease) return rightRelease - leftRelease
      return left.name.localeCompare(right.name)
    })
}

export const getCharacters = async ({ localCharacters = [], ...query }) => {
  try {
    const result = await requestApiCached('api/characters', query)
    const localById = new Map(localCharacters.map((character) => [character.id, character]))
    return {
      ...result,
      source: 'api',
      items: result.items.map((character) => {
        const localCharacter = localById.get(character.id) || {}
        return { ...localCharacter, ...mapCharacterSummary(character, localCharacter) }
      }),
    }
  } catch {
    const filtered = fallbackCharacters(localCharacters, query)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.max(1, Number(query.pageSize) || 12)
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      source: 'fallback',
    }
  }
}

export const getAllCharacters = async (language, localCharacters = []) => {
  const firstPage = await getCharacters({
    language,
    page: 1,
    pageSize: 100,
    localCharacters,
  })

  if (firstPage.source === 'fallback') return fallbackCharacters(localCharacters, { sort: 'release_desc' })
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
  try {
    const result = await requestApiCached(`api/characters/${encodeURIComponent(id)}`, { language })
    return mergeCharacterDetail(result, localCharacter)
  } catch (error) {
    if (localCharacter) return localCharacter
    throw error
  }
}

export const isCharacterApiConfigured = isApiConfigured
