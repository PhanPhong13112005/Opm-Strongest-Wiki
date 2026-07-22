const configuredBaseUrl = (import.meta.env?.VITE_API_BASE_URL || '').trim()
const API_BASE_URL = configuredBaseUrl || (import.meta.env?.DEV ? 'http://localhost:5180' : '')
const REQUEST_TIMEOUT_MS = 8000
const DEFAULT_CACHE_TTL_MS = 60_000
const responseCache = new Map()

const buildUrl = (path, params = {}) => {
  const sameOrigin = typeof globalThis.location?.origin === 'string' ? globalThis.location.origin : ''
  const baseUrl = API_BASE_URL || sameOrigin
  if (!baseUrl) return null

  const url = new URL(path, `${baseUrl.replace(/\/$/, '')}/`)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url
}

export const requestApi = async (path, params, options = {}) => {
  const url = buildUrl(path, params)
  if (!url) throw new Error('API is not configured.')

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const headers = new Headers(options.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      let message = `API returned ${response.status}.`
      try {
        const payload = await response.json()
        message = payload.message || payload.title || message
      } catch {
        // Keep the status-based message when the server has no JSON body.
      }
      const error = new Error(message)
      error.status = response.status
      throw error
    }
    if (response.status === 204) return null
    return await response.json()
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

const cacheKey = (path, params = {}) => {
  const query = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query ? `${path}?${query}` : path
}

export const requestApiCached = async (path, params, { ttlMs = DEFAULT_CACHE_TTL_MS } = {}) => {
  const key = cacheKey(path, params)
  const now = Date.now()
  const cached = responseCache.get(key)
  if (cached?.value !== undefined && cached.expiresAt > now) return cached.value
  if (cached?.promise) return cached.promise

  const promise = requestApi(path, params)
    .then((value) => {
      responseCache.set(key, { value, expiresAt: Date.now() + Math.max(0, ttlMs) })
      return value
    })
    .catch((error) => {
      responseCache.delete(key)
      throw error
    })

  responseCache.set(key, { promise, expiresAt: now + Math.max(0, ttlMs) })
  return promise
}

export const invalidateApiCache = (pathPrefix = '') => {
  for (const key of responseCache.keys()) {
    if (!pathPrefix || key.startsWith(pathPrefix)) responseCache.delete(key)
  }
}

export const isApiConfigured = () => Boolean(API_BASE_URL)

// Authentication, community and public read APIs are deployed as same-origin
// Vercel Functions in production. Public services keep their bundled JSON as
// an offline fallback when the API or database is unavailable.
export const isSameOriginApiAvailable = () => Boolean(
  API_BASE_URL || (typeof globalThis.location?.origin === 'string' && globalThis.location.origin),
)
