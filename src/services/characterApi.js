import { isApiConfigured, requestApiCached } from './apiClient.js'
import characterNameAliases from '../data/characterNameAliases.js'

const formatLegacyDate = (value) => {
  if (!value) return value
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

const legacyNamesById = new Map(
  Object.entries(characterNameAliases).map(([id, names]) => [id, new Set(names)]),
)

const normalizeSearchText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi')

export const matchesCharacterSearch = (character, search, alternateCharacter = {}) => {
  const query = normalizeSearchText(search).trim()
  if (!query) return true

  return [
    character?.id,
    character?.name,
    alternateCharacter?.name,
    ...(legacyNamesById.get(character?.id) || []),
  ].some(value => normalizeSearchText(value).includes(query))
}

const resolveCharacterName = (character, localCharacter, language = 'vi') => {
  const apiName = String(character?.name || '').trim()
  const localName = String(localCharacter?.name || '').trim()
  if (String(language || 'vi').toLowerCase() !== 'vi') return apiName || localName
  if (!apiName || legacyNamesById.get(character?.id)?.has(apiName)) return localName || apiName
  return apiName
}

export const mapCharacterSummary = (character, localCharacter = {}, language = 'vi') => ({
  id: character.id,
  name: resolveCharacterName(character, localCharacter, language),
  imageURL: localCharacter.imageURL || character.imageUrl,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: localCharacter.roles?.length ? localCharacter.roles : (character.roles || []),
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

const mapApiEffect = (effect) => ({
  term: effect.term,
  desc: effect.description,
})

const mergeCharacterEffects = (characterEffects, localEffects) => {
  const apiEffects = Array.isArray(characterEffects) ? characterEffects : []
  const fallbackEffects = Array.isArray(localEffects) ? localEffects : []

  if (fallbackEffects.length === 0) return apiEffects.map(mapApiEffect)

  const apiBySortOrder = new Map(
    apiEffects.map((effect, index) => [
      Number.isInteger(effect.sortOrder) ? effect.sortOrder : index,
      effect,
    ]),
  )
  const usedApiEffects = new Set()
  const merged = fallbackEffects.map((localEffect, index) => {
    const apiEffect = apiBySortOrder.get(index)
    if (apiEffect) usedApiEffects.add(apiEffect)
    return {
      ...(apiEffect ? mapApiEffect(apiEffect) : {}),
      ...localEffect,
    }
  })

  for (const apiEffect of apiEffects) {
    if (!usedApiEffects.has(apiEffect)) merged.push(mapApiEffect(apiEffect))
  }

  return merged
}

export const mergeCharacterDetail = (character, localCharacter = {}, language = 'vi') => ({
  ...localCharacter,
  id: character.id,
  name: resolveCharacterName(character, localCharacter, language),
  imageURL: localCharacter.imageURL || character.imageUrl,
  tier: character.tier,
  type: character.type,
  faction: character.faction,
  roles: localCharacter.roles?.length ? localCharacter.roles : (character.roles || []),
  duyen: character.duyen,
  bio: character.bio,
  keepsakeIcon: localCharacter.keepsakeIcon || character.keepsakeIcon,
  dacTinh: localCharacter.dacTinh !== undefined ? localCharacter.dacTinh : (character.traits || []),
  bondList: character.bondList,
  classLevel: character.classLevel,
  releaseSea: formatLegacyDate(character.releaseSea) || localCharacter.releaseSea,
  releaseTrung: formatLegacyDate(character.releaseChina) || localCharacter.releaseTrung,
  baseStats: character.baseStats,
  pvpStats: character.pvpStats,
  skills: mergeCharacterSkills(character.skills, localCharacter.skills),
  effects: mergeCharacterEffects(character.effects, localCharacter.effects),
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

const fallbackCharacters = (localCharacters, query, searchCharacters = []) => {
  const alternateById = new Map(searchCharacters.map(character => [character.id, character]))
  return localCharacters
    .filter((character) => {
      if (!matchesCharacterSearch(character, query.search, alternateById.get(character.id))) return false
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

export const reconcileCharacterPage = (apiResult, localCharacters, query, searchCharacters = []) => {
  const localMatches = fallbackCharacters(localCharacters, query, searchCharacters)
  const apiTotalCount = Math.max(0, Number(apiResult?.totalCount) || 0)
  if (apiTotalCount >= localMatches.length) return apiResult

  const page = Math.max(1, Number(apiResult?.page || query.page) || 1)
  const pageSize = Math.max(1, Number(apiResult?.pageSize || query.pageSize) || 12)
  const apiById = new Map((apiResult?.items || []).map(character => [character.id, character]))
  const localPage = localMatches.slice((page - 1) * pageSize, page * pageSize)

  return {
    ...apiResult,
    items: localPage.map(character => apiById.get(character.id) || character),
    page,
    pageSize,
    totalCount: localMatches.length,
    totalPages: Math.max(1, Math.ceil(localMatches.length / pageSize)),
    source: 'hybrid',
  }
}

export const getCharacters = async ({ localCharacters = [], searchCharacters = [], ...query }, requestOptions) => {
  try {
    const result = await requestApiCached('api/characters', query, requestOptions)
    const localById = new Map(localCharacters.map((character) => [character.id, character]))
    const mappedResult = {
      ...result,
      source: 'api',
      items: result.items.map((character) => {
        const localCharacter = localById.get(character.id) || {}
        return { ...localCharacter, ...mapCharacterSummary(character, localCharacter, query.language) }
      }),
    }
    return reconcileCharacterPage(mappedResult, localCharacters, query, searchCharacters)
  } catch {
    const filtered = fallbackCharacters(localCharacters, query, searchCharacters)
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

export const getAllCharacters = async (language, localCharacters = [], requestOptions) => {
  const firstPage = await getCharacters({
    language,
    page: 1,
    pageSize: 100,
    localCharacters,
  }, requestOptions)

  if (firstPage.source === 'fallback') return fallbackCharacters(localCharacters, { sort: 'release_desc' })
  if (firstPage.totalPages <= 1) return firstPage.items

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getCharacters({
      language,
      page: index + 2,
      pageSize: 100,
      localCharacters,
    }, requestOptions)),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.items)
}

export const getCharacterById = async (id, language, localCharacter, requestOptions) => {
  const localCharacterPromise = Promise.resolve(localCharacter)
  try {
    const [result, resolvedLocalCharacter] = await Promise.all([
      requestApiCached(`api/characters/${encodeURIComponent(id)}`, { language }, requestOptions),
      localCharacterPromise,
    ])
    return mergeCharacterDetail(result, resolvedLocalCharacter, language)
  } catch (error) {
    const resolvedLocalCharacter = await localCharacterPromise
    if (resolvedLocalCharacter) return resolvedLocalCharacter
    throw error
  }
}

export const isCharacterApiConfigured = isApiConfigured
