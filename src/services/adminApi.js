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

export const getAdminDashboard = async () => {
  try {
    return await authorizedRequest('api/admin/dashboard')
  } catch (error) {
    if (import.meta.env?.DEV) {
      return {
        characters: 154,
        events: 18,
        releaseEntries: 12,
        eventComments: 45,
        forumTopics: 28,
        forumPosts: 92,
        users: 120,
        staff: 5,
        admins: 2,
        pendingTopUps: 0,
      }
    }
    throw error
  }
}

export const getAdminUsers = async () => {
  try {
    return await authorizedRequest('api/admin/users')
  } catch (error) {
    if (import.meta.env?.DEV) {
      return [
        { id: '1', username: 'admin', displayName: 'Quản Trị Viên (Dev)', role: 'Admin', balance: 999999, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', username: 'staff1', displayName: 'Kiểm Duyệt Viên 1', role: 'Staff', balance: 50000, isActive: true, createdAt: '2026-02-15T00:00:00Z' },
        { id: '3', username: 'user_qa', displayName: 'Người Dùng QA', role: 'User', balance: 10000, isActive: true, createdAt: '2026-03-20T00:00:00Z' },
      ]
    }
    throw error
  }
}
export const updateAdminUserRole = (id, role) => authorizedRequest(`api/admin/users/${id}/role`, {
  method: 'PUT', body: JSON.stringify({ role }),
})
export const updateAdminUserStatus = (id, isActive) => authorizedRequest(`api/admin/users/${id}/status`, {
  method: 'PUT', body: JSON.stringify({ isActive }),
})
export const getAdminTopUps = (status = '') =>
  authorizedRequest('api/admin/top-ups', {}, { status })
export const reviewAdminTopUp = (id, status, staffNote = '') =>
  authorizedRequest(`api/admin/top-ups/${encodeURIComponent(id)}/review`, {
    method: 'PUT', body: JSON.stringify({ status, staffNote }),
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
