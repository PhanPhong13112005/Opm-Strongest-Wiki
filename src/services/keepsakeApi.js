import { requestApi } from './apiClient'

const mapKeepsake = (keepsake, localKeepsake = {}) => ({
  ...localKeepsake,
  id: keepsake.id,
  name: keepsake.characterName,
  keepsakeIcon: keepsake.iconUrl,
  tier: keepsake.tier,
  type: keepsake.type,
  faction: keepsake.faction,
  acquisitionType: keepsake.acquisitionType,
  updatedAt: keepsake.updatedAt,
})

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

  if (firstPage.totalPages <= 1) return firstPage.items

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getKeepsakes({
      language,
      page: index + 2,
      pageSize: 100,
      localKeepsakes,
    })),
  )

  const localOrder = new Map(localKeepsakes.map((item, index) => [item.id, index]))
  return [firstPage, ...remainingPages]
    .flatMap(page => page.items)
    .sort((a, b) => (localOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (localOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER))
}

export const getKeepsakeById = async (id, language, localKeepsake) => {
  const result = await requestApi(`api/keepsakes/${encodeURIComponent(id)}`, { language })
  return mapKeepsake(result, localKeepsake)
}
