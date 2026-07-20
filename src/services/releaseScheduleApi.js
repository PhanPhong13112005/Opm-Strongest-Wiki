import { requestApi } from './apiClient'

export const getReleaseSchedule = (language = 'vi') =>
  requestApi('api/release-schedule', { language })
