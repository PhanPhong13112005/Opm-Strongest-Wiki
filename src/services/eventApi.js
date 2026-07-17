import { requestApi } from './apiClient'

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
  const result = await requestApi('api/events', query)
  const localById = new Map(localEvents.map((event) => [event.id, event]))

  return {
    ...result,
    items: result.items
      .map((event) => mergeLocalizedEvent(event, localById.get(event.id), query.language))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
  }
}

export const getEventById = async (id, language, localEvent) => {
  const result = await requestApi(`api/events/${encodeURIComponent(id)}`, { language })
  return {
    ...mergeLocalizedEvent(result, localEvent, language),
    detailImages: result.detailImages || [],
    sections: Array.isArray(result.sections) ? result.sections : [],
    updatedAt: result.updatedAt,
  }
}
