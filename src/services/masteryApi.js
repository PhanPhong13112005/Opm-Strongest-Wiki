import { requestApi } from './apiClient'

export const getMasteryConfig = () => requestApi('api/mastery')
