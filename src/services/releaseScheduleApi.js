import fallbackSchedule from '../data/releaseSchedule.json' with { type: 'json' }
import { requestApiCached } from './apiClient.js'
import { loadReleaseScheduleWithFallback } from './releaseSchedulePolicy.js'

export const getReleaseSchedule = async (language = 'vi') => (
  loadReleaseScheduleWithFallback({
    language,
    fallbackRows: fallbackSchedule,
    request: selectedLanguage => requestApiCached(
      'api/release-schedule',
      { language: selectedLanguage, includeMonthPrecision: true },
    ),
  })
)
