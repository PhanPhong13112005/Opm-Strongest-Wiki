import { requestApi } from './apiClient.js'

const mapKeepsake = (keepsake, localKeepsake = {}) => ({
  ...localKeepsake,
  id: keepsake.id,
  name: keepsake.characterName,
  keepsakeIcon: localKeepsake.keepsakeIcon || keepsake.iconUrl,
  tier: keepsake.tier,
  type: keepsake.type,
  faction: keepsake.faction,
  acquisitionType: keepsake.acquisitionType,
  updatedAt: keepsake.updatedAt,
})

export const mergeKeepsakeCatalog = (apiKeepsakes = [], localKeepsakes = []) => {
  const localById = new Map(localKeepsakes.map(item => [item.id, item]))
  const apiById = new Map(apiKeepsakes.map(item => [item.id, item]))
  const merged = localKeepsakes.map(localKeepsake => apiById.get(localKeepsake.id) || localKeepsake)

  for (const apiKeepsake of apiKeepsakes) {
    if (!localById.has(apiKeepsake.id)) merged.push(apiKeepsake)
  }

  return merged
}

export const getKeepsakes = async ({ localKeepsakes = [], ...query }) => {
  const result = await requestApi('api/keepsakes', query)
  const localById = new Map(localKeepsakes.map(item => [item.id, item]))

  return {
    ...result,
    items: result.items.map(item => mapKeepsake(item, localById.get(item.id))),
  }
}

export const getAllKeepsakes = async (language, localKeepsakes = []) => {
  const firstPage = await getKeepsakes({
    language,
    page: 1,
    pageSize: 100,
    localKeepsakes,
  })

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getKeepsakes({
      language,
      page: index + 2,
      pageSize: 100,
      localKeepsakes,
    })),
  )

  const apiKeepsakes = [firstPage, ...remainingPages].flatMap(page => page.items)
  return mergeKeepsakeCatalog(apiKeepsakes, localKeepsakes)
}

export const getKeepsakeById = async (id, language, localKeepsake) => {
  try {
    const result = await requestApi(`api/keepsakes/${encodeURIComponent(id)}`, { language })
    return mapKeepsake(result, localKeepsake)
  } catch (error) {
    if (localKeepsake) return localKeepsake
    throw error
  }
}
