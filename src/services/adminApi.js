import { invalidateApiCache, isSameOriginApiAvailable } from './apiClient'
import {
  authorizedRequest,
  clearSession,
  getAccessToken,
  hasRole,
  hasValidSession,
  login,
} from './authApi'

export const getAdminToken = getAccessToken
export const hasValidAdminToken = () => hasValidSession() && hasRole('Admin')
export const clearAdminSession = clearSession
export const loginAdmin = login

export const getAdminCharacters = (query = {}) =>
  authorizedRequest('api/admin/characters', {}, query)

const mutateAndInvalidate = async (path, options, cachePrefix) => {
  const result = await authorizedRequest(path, options)
  invalidateApiCache(cachePrefix)
  return result
}

export const createAdminCharacter = (character) =>
  mutateAndInvalidate('api/admin/characters', {
    method: 'POST', body: JSON.stringify(character),
  }, 'api/characters')

export const updateAdminCharacter = (character) =>
  mutateAndInvalidate(`api/admin/characters/${encodeURIComponent(character.id)}`, {
    method: 'PUT', body: JSON.stringify(character),
  }, 'api/characters')

export const deleteAdminCharacter = (id) =>
  mutateAndInvalidate(`api/admin/characters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, 'api/characters')

export const updateAdminKeepsake = (characterId, iconUrl) =>
  mutateAndInvalidate(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, {
    method: 'PUT', body: JSON.stringify({ iconUrl }),
  }, 'api/characters')

export const deleteAdminKeepsake = (characterId) =>
  mutateAndInvalidate(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
  }, 'api/characters')

export const getAdminDashboard = () => authorizedRequest('api/admin/dashboard')
export const getAdminUsers = () => authorizedRequest('api/admin/users')
export const updateAdminUserRole = (id, role) => authorizedRequest(`api/admin/users/${id}/role`, {
  method: 'PUT', body: JSON.stringify({ role }),
})
export const getAdminEvents = () => authorizedRequest('api/admin/events')
export const createAdminEvent = (event) => mutateAndInvalidate('api/admin/events', {
  method: 'POST', body: JSON.stringify(event),
}, 'api/events')
export const updateAdminEvent = (event) => mutateAndInvalidate(`api/admin/events/${encodeURIComponent(event.id)}`, {
  method: 'PUT', body: JSON.stringify(event),
}, 'api/events')
export const deleteAdminEvent = (id) => mutateAndInvalidate(`api/admin/events/${encodeURIComponent(id)}`, {
  method: 'DELETE',
}, 'api/events')
export const getAdminReleases = () => authorizedRequest('api/admin/releases')
export const createAdminRelease = (entry) => mutateAndInvalidate('api/admin/releases', {
  method: 'POST', body: JSON.stringify(entry),
}, 'api/release-schedule')
export const updateAdminRelease = (id, entry) => mutateAndInvalidate(`api/admin/releases/${id}`, {
  method: 'PUT', body: JSON.stringify(entry),
}, 'api/release-schedule')
export const deleteAdminRelease = (id) => mutateAndInvalidate(`api/admin/releases/${id}`, {
  method: 'DELETE',
}, 'api/release-schedule')

export const isAdminApiConfigured = isSameOriginApiAvailable
