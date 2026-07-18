import { requestApi } from './apiClient'

export const createLocalInsigniaCatalog = (source) => {
  const guidesById = new Map((source.guides || []).map(guide => [guide.id, guide]))
  return (source.items || []).map(item => ({
    ...item,
    guides: (item.guideIds || []).map(id => guidesById.get(id)).filter(Boolean),
  }))
}

const mergeLocalizedName = (target, name, language) => ({
  ...target,
  ...(language === 'en' ? { nameEn: name } : { nameVi: name }),
})

const mergeSummary = (insignia, language, local = {}) => mergeLocalizedName({
  ...local,
  id: insignia.id,
  classLevel: insignia.classLevel,
  imageUrl: insignia.imageUrl,
  sortOrder: insignia.sortOrder,
}, insignia.name, language)

const mergeDetail = (insignia, language, local = {}) => {
  const localGuides = new Map((local.guides || []).map(guide => [guide.id, guide]))
  const guides = (insignia.guides || []).map(guide => ({
    ...(localGuides.get(guide.id) || {}),
    id: guide.id,
    images: guide.images || [],
    ...(language === 'en'
      ? { titleEn: guide.title, descriptionEn: guide.description }
      : { titleVi: guide.title, descriptionVi: guide.description }),
  }))

  return {
    ...mergeSummary(insignia, language, local),
    guides,
    updatedAt: insignia.updatedAt,
  }
}

export const getInsignias = async ({ localInsignias = [], ...query }) => {
  const result = await requestApi('api/insignias', query)
  const localById = new Map(localInsignias.map(insignia => [insignia.id, insignia]))
  return {
    ...result,
    items: result.items.map(insignia => mergeSummary(
      insignia,
      query.language,
      localById.get(insignia.id),
    )),
  }
}

export const getAllInsignias = async (language, localInsignias = []) => {
  const result = await getInsignias({
    language,
    page: 1,
    pageSize: 100,
    localInsignias,
  })
  return result.items
}

export const getInsigniaById = async (id, language, localInsignia) => {
  const result = await requestApi(`api/insignias/${encodeURIComponent(id)}`, { language })
  return mergeDetail(result, language, localInsignia)
}
