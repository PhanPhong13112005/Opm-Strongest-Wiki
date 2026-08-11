import { reactive } from 'vue'
import { isSameOriginApiAvailable, requestApi } from './apiClient'

const TOKEN_KEY = 'opmwiki.auth.token'
const SESSION_KEY = 'opmwiki.auth.session'
const AUTH_REQUEST_TIMEOUT_MS = 25_000
const getStorage = () => typeof localStorage !== 'undefined' ? localStorage : (typeof sessionStorage !== 'undefined' ? sessionStorage : null)

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
    const raw = (typeof localStorage !== 'undefined' && localStorage.getItem(SESSION_KEY)) ||
                (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY))
    return JSON.parse(raw || 'null')
  } catch {
    return null
  }
}

export const authState = reactive({ session: readStoredSession() })

export const getAccessToken = () => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
    return localStorage.getItem(TOKEN_KEY)
  }
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(TOKEN_KEY)) {
    return sessionStorage.getItem(TOKEN_KEY)
  }
  return ''
}

export const hasValidSession = () => {
  const token = getAccessToken()
  if (!token) return false
  if (token === 'dev-admin-mock-access-token-12345') {
    if (import.meta.env?.DEV) return Boolean(authState.session)
    clearSession()
    return false
  }
  const payload = decodePayload(token)
  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    clearSession()
    return false
  }
  return Boolean(authState.session)
}

export const clearSession = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('opmwiki.admin.token')
    localStorage.removeItem('opmwiki.admin.user')
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('opmwiki.admin.token')
    sessionStorage.removeItem('opmwiki.admin.user')
  }
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
  getStorage()?.setItem(TOKEN_KEY, result.accessToken)
  getStorage()?.setItem(SESSION_KEY, JSON.stringify(session))
  authState.session = session
  return result
}

export const login = async (username, password) => {
  try {
    return saveSession(await requestApi('api/auth/login', null, {
      method: 'POST',
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }))
  } catch (error) {
    if (import.meta.env?.DEV && String(username).trim().toLowerCase() === 'admin' && (password === 'admin123' || password === 'admin')) {
      return saveSession({
        accessToken: 'dev-admin-mock-access-token-12345',
        userId: 'admin:dev-local-admin',
        username: 'admin',
        displayName: 'Administrator (Local Dev)',
        role: 'Admin',
        balance: 999999,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })
    }
    throw error
  }
}

export const register = async (username, email, password) => saveSession(await requestApi('api/auth/register', null, {
  method: 'POST',
  timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password }),
}))

export const requestPasswordReset = async (email) => requestApi('api/auth/forgot-password', null, {
  method: 'POST',
  timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
})

export const resetPassword = async (token, password) => requestApi('api/auth/reset-password', null, {
  method: 'POST',
  timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, password }),
})

export const requestEmailVerification = async () => authorizedRequest('api/auth/email-verification/request', {
  method: 'POST',
  timeoutMs: 25_000,
})

export const verifyEmail = async (token) => requestApi('api/auth/email-verification/confirm', null, {
  method: 'POST',
  timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
})

export const authorizedRequest = async (path, options = {}, params) => {
  if (!hasValidSession()) {
    const error = new Error('Phiên đăng nhập đã hết hạn.')
    error.status = 401
    throw error
  }
  try {
    return await requestApi(path, params, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
  } catch (error) {
    if (error.status === 401 && !import.meta.env?.DEV) clearSession()
    throw error
  }
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

export const isAuthApiConfigured = isSameOriginApiAvailable
