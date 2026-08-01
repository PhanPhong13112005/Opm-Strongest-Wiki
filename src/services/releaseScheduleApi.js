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
  const localRows = fallbackSchedule.map(row => localize(row, language))
  const localByKey = new Map(localRows.map(row => [scheduleKey(row), row]))
  const apiKeys = new Set(apiRows.map(scheduleKey))
  const merged = apiRows.map(row => {
    const localRow = localByKey.get(scheduleKey(row))
    const placeholderWasRevealed = localRow &&
      row.characterId === 'unknown' &&
      localRow.characterId !== 'unknown'
    return placeholderWasRevealed ? { ...row, ...localRow } : row
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
    return fallbackSchedule.map((row) => localize(row, language))
  }
}
