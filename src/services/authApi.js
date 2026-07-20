import { reactive } from 'vue'
import { isApiConfigured, requestApi } from './apiClient'

const TOKEN_KEY = 'opmwiki.auth.token'
const SESSION_KEY = 'opmwiki.auth.session'
const storage = () => typeof sessionStorage === 'undefined' ? null : sessionStorage

const decodePayload = (token) => {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}

const readStoredSession = () => {
  try {
    return JSON.parse(storage()?.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export const authState = reactive({ session: readStoredSession() })

export const getAccessToken = () => storage()?.getItem(TOKEN_KEY) || ''

export const hasValidSession = () => {
  const token = getAccessToken()
  const payload = token ? decodePayload(token) : null
  if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
    clearSession()
    return false
  }
  return Boolean(authState.session)
}

export const clearSession = () => {
  storage()?.removeItem(TOKEN_KEY)
  storage()?.removeItem(SESSION_KEY)
  storage()?.removeItem('opmwiki.admin.token')
  storage()?.removeItem('opmwiki.admin.user')
  authState.session = null
}

const saveSession = (result) => {
  const session = {
    userId: result.userId,
    username: result.username,
    displayName: result.displayName,
    role: result.role,
    balance: result.balance,
    expiresAt: result.expiresAt,
  }
  storage()?.setItem(TOKEN_KEY, result.accessToken)
  storage()?.setItem(SESSION_KEY, JSON.stringify(session))
  authState.session = session
  return result
}

export const login = async (username, password) => saveSession(await requestApi('api/auth/login', null, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
}))

export const register = async (username, displayName, password) => saveSession(await requestApi('api/auth/register', null, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, displayName, password }),
}))

export const authorizedRequest = async (path, options = {}, params) => {
  if (!hasValidSession()) {
    const error = new Error('Phiên đăng nhập đã hết hạn.')
    error.status = 401
    throw error
  }
  return requestApi(path, params, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
}

export const refreshSession = async () => {
  const account = await authorizedRequest('api/auth/me')
  if (authState.session) {
    authState.session = { ...authState.session, ...account }
    storage()?.setItem(SESSION_KEY, JSON.stringify(authState.session))
  }
  return account
}

export const hasRole = (...roles) => hasValidSession() && roles.includes(authState.session?.role)

export const getPortalPath = (role = authState.session?.role) => {
  if (role === 'Admin') return '/admin/dashboard'
  if (role === 'Staff') return '/staff'
  return '/account'
}

export const isAuthApiConfigured = isApiConfigured
