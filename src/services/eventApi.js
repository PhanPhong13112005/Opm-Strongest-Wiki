import { requestApiCached } from './apiClient'

const mergeLocalizedEvent = (event, localEvent = {}, language = 'vi') => ({
  ...localEvent,
  id: event.id,
  titleVi: language === 'vi' ? event.title : localEvent.titleVi,
  titleEn: language === 'en' ? event.title : localEvent.titleEn,
  descriptionVi: language === 'vi' ? event.description : localEvent.descriptionVi,
  descriptionEn: language === 'en' ? event.description : localEvent.descriptionEn,
  category: event.category,
  imageUrl: event.imageUrl,
  startDate: event.startDate,
  endDate: event.endDate,
})

export const getEvents = async ({ localEvents = [], ...query }) => {
  try {
    const result = await requestApiCached('api/events', query)
    const localById = new Map(localEvents.map((event) => [event.id, event]))
    return {
      ...result,
      source: 'api',
      items: result.items
        .map((event) => mergeLocalizedEvent(event, localById.get(event.id), query.language))
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    }
  } catch {
    const filtered = localEvents
      .filter((event) => !query.category || event.category === query.category)
      .filter((event) => !query.from || event.endDate >= query.from)
      .filter((event) => !query.to || event.startDate <= query.to)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.max(1, Number(query.pageSize) || 20)
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

export const getEventById = async (id, language, localEvent) => {
  try {
    const result = await requestApiCached(`api/events/${encodeURIComponent(id)}`, { language })
    return {
      ...mergeLocalizedEvent(result, localEvent, language),
      detailImages: result.detailImages || [],
      sections: Array.isArray(result.sections) ? result.sections : [],
      updatedAt: result.updatedAt,
    }
  } catch (error) {
    if (localEvent) return localEvent
    throw error
  }
}
