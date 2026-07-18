import { isApiConfigured, requestApi } from './apiClient'

const TOKEN_KEY = 'opmwiki.admin.token'
const USER_KEY = 'opmwiki.admin.user'

const storage = () => typeof sessionStorage === 'undefined' ? null : sessionStorage

const decodePayload = (token) => {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}

export const getAdminToken = () => storage()?.getItem(TOKEN_KEY) || ''

export const hasValidAdminToken = () => {
  const token = getAdminToken()
  const payload = token ? decodePayload(token) : null
  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    clearAdminSession()
    return false
  }
  return true
}

export const clearAdminSession = () => {
  storage()?.removeItem(TOKEN_KEY)
  storage()?.removeItem(USER_KEY)
}

export const loginAdmin = async (username, password) => {
  const result = await requestApi('api/admin/auth/login', null, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  storage()?.setItem(TOKEN_KEY, result.accessToken)
  storage()?.setItem(USER_KEY, result.username)
  return result
}

const adminRequest = async (path, options = {}, params) => {
  if (!hasValidAdminToken()) {
    const error = new Error('Phiên quản trị đã hết hạn.')
    error.status = 401
    throw error
  }

  const result = await requestApi(path, params, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${getAdminToken()}`,
    },
  })
  return result
}

export const getAdminCharacters = (query = {}) =>
  adminRequest('api/admin/characters', {}, query)

export const createAdminCharacter = (character) =>
  adminRequest('api/admin/characters', {
    method: 'POST',
    body: JSON.stringify(character),
  })

export const updateAdminCharacter = (character) =>
  adminRequest(`api/admin/characters/${encodeURIComponent(character.id)}`, {
    method: 'PUT',
    body: JSON.stringify(character),
  })

export const deleteAdminCharacter = (id) =>
  adminRequest(`api/admin/characters/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const updateAdminKeepsake = (characterId, iconUrl) =>
  adminRequest(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, {
    method: 'PUT',
    body: JSON.stringify({ iconUrl }),
  })

export const deleteAdminKeepsake = (characterId) =>
  adminRequest(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, { method: 'DELETE' })

export const isAdminApiConfigured = isApiConfigured
