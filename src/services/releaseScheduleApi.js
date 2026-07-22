import fallbackSchedule from '../data/releaseSchedule.json'
import { requestApiCached } from './apiClient'

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

export const getReleaseSchedule = async (language = 'vi') => {
  try {
    return await requestApiCached('api/release-schedule', { language })
  } catch {
    return fallbackSchedule.map((row) => localize(row, language))
  }
}
