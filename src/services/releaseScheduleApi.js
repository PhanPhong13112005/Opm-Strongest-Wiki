import fallbackSchedule from '../data/releaseSchedule.json'
import { requestApiCached } from './apiClient.js'

const localize = (row, language) => {
  const english = language === 'en'
  return {
    ...row,
    overrideName: english ? row.overrideNameEn : row.overrideNameVi,
    overrideFaction: english ? row.overrideFactionEn : row.overrideFactionVi,
    overrideType: english ? row.overrideTypeEn : row.overrideTypeVi,
    overrideRole: english ? row.overrideRoleEn : row.overrideRoleVi,
  }
}

const scheduleKey = (row) => `${row.server}|${row.date}|${row.sortOrder}`

const mergeReleaseSchedule = (apiRows, language) => {
  // A daily calendar must not invent a day for owner-confirmed month-only history.
  apiRows = apiRows.filter(row => row.datePrecision !== 'month')
  const localRows = fallbackSchedule.filter(row => row.datePrecision !== 'month').map(row => localize(row, language))
  // Replace a stale API date by the owner's event identity, not by its old date.
  const eventKey = row => `${row.characterId}|${row.server}|${row.isReturn}`
  const approvedEvents = new Map(localRows.filter(row => row.source === 'owner').map(row => [eventKey(row), row]))
  apiRows = [...new Map(apiRows.map(row => {
    const approved = approvedEvents.get(eventKey(row))
    const resolved = approved ? { ...row, ...approved } : row
    return [scheduleKey(resolved), resolved]
  })).values()]
  const localByKey = new Map(localRows.map(row => [scheduleKey(row), row]))
  const apiKeys = new Set(apiRows.map(scheduleKey))
  const merged = apiRows.map(row => {
    const localRow = localByKey.get(scheduleKey(row))
    const placeholderWasRevealed = localRow &&
      row.characterId === 'unknown' &&
      localRow.characterId !== 'unknown'
    if (placeholderWasRevealed) return { ...row, ...localRow }
    if (localRow?.characterId === row.characterId && localRow.bannerImage) {
      return {
        ...row, bannerImage: localRow.bannerImage,
        ...(localRow.source === 'owner' ? {
          source: localRow.source, verificationStatus: localRow.verificationStatus, status: localRow.status,
        } : {}),
      }
    }
    return row
  })

  for (const localRow of localRows) {
    if (!apiKeys.has(scheduleKey(localRow))) merged.push(localRow)
  }

  return merged
}

export const getReleaseSchedule = async (language = 'vi') => {
  try {
    const rows = await requestApiCached('api/release-schedule', { language })
    return mergeReleaseSchedule(rows, language)
  } catch {
    return getBundledReleaseSchedule(language)
  }
}

export const getBundledReleaseSchedule = (language = 'vi') => (
  fallbackSchedule.filter(row => row.datePrecision !== 'month').map(row => localize(row, language))
)
