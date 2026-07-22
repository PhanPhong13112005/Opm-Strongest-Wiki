import { isSameOriginApiAvailable } from './apiClient'
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

export const createAdminCharacter = (character) =>
  authorizedRequest('api/admin/characters', { method: 'POST', body: JSON.stringify(character) })

export const updateAdminCharacter = (character) =>
  authorizedRequest(`api/admin/characters/${encodeURIComponent(character.id)}`, {
    method: 'PUT', body: JSON.stringify(character),
  })

export const deleteAdminCharacter = (id) =>
  authorizedRequest(`api/admin/characters/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const updateAdminKeepsake = (characterId, iconUrl) =>
  authorizedRequest(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, {
    method: 'PUT', body: JSON.stringify({ iconUrl }),
  })

export const deleteAdminKeepsake = (characterId) =>
  authorizedRequest(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, { method: 'DELETE' })

export const getAdminDashboard = () => authorizedRequest('api/admin/dashboard')
export const getAdminUsers = () => authorizedRequest('api/admin/users')
export const updateAdminUserRole = (id, role) => authorizedRequest(`api/admin/users/${id}/role`, {
  method: 'PUT', body: JSON.stringify({ role }),
})
export const getAdminEvents = () => authorizedRequest('api/admin/events')
export const createAdminEvent = (event) => authorizedRequest('api/admin/events', {
  method: 'POST', body: JSON.stringify(event),
})
export const updateAdminEvent = (event) => authorizedRequest(`api/admin/events/${encodeURIComponent(event.id)}`, {
  method: 'PUT', body: JSON.stringify(event),
})
export const deleteAdminEvent = (id) => authorizedRequest(`api/admin/events/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})
export const getAdminReleases = () => authorizedRequest('api/admin/releases')
export const createAdminRelease = (entry) => authorizedRequest('api/admin/releases', {
  method: 'POST', body: JSON.stringify(entry),
})
export const updateAdminRelease = (id, entry) => authorizedRequest(`api/admin/releases/${id}`, {
  method: 'PUT', body: JSON.stringify(entry),
})
export const deleteAdminRelease = (id) => authorizedRequest(`api/admin/releases/${id}`, {
  method: 'DELETE',
})

export const isAdminApiConfigured = isSameOriginApiAvailable
