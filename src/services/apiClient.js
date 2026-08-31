import { readonly, ref } from 'vue'

const configuredBaseUrl = (import.meta.env?.VITE_API_BASE_URL || '').trim()
const API_BASE_URL = configuredBaseUrl || (import.meta.env?.DEV ? 'http://localhost:5180' : '')
const REQUEST_TIMEOUT_MS = 15_000
const RETRY_DELAY_MS = 400
const DEFAULT_CACHE_TTL_MS = 60_000
const responseCache = new Map()
const pendingApiRequestCount = ref(0)

export const pendingApiRequests = readonly(pendingApiRequestCount)

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

const wait = milliseconds => new Promise(resolve => globalThis.setTimeout(resolve, milliseconds))
const shouldRetryRequest = error => (
  error?.name === 'TypeError' ||
  error?.status === 408 ||
  error?.status === 429 ||
  error?.status === 502 ||
  error?.status === 503 ||
  error?.status === 504
)

export const requestApi = async (path, params, options = {}) => {
  const url = buildUrl(path, params)
  if (!url) throw new Error('API is not configured.')

  const {
    trackLoading = true,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retryCount,
    retryDelayMs = RETRY_DELAY_MS,
    ...fetchOptions
  } = options
  const headers = new Headers(fetchOptions.headers || {})
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  const method = String(fetchOptions.method || 'GET').toUpperCase()
  const retries = Math.max(0, Number(retryCount ?? (method === 'GET' ? 1 : 0)) || 0)
  const shouldTrackLoading = trackLoading && method === 'GET'
  if (shouldTrackLoading) pendingApiRequestCount.value += 1

  try {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController()
      const timeout = globalThis.setTimeout(
        () => controller.abort(),
        Math.max(1000, Number(timeoutMs) || REQUEST_TIMEOUT_MS),
      )

      try {
        const response = await fetch(url, {
          ...fetchOptions,
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
      } catch (error) {
        const requestError = error?.name === 'AbortError'
          ? Object.assign(new Error('Máy chủ đang khởi động hoặc phản hồi quá lâu. Vui lòng chờ vài giây rồi thử lại.'), { status: 408 })
          : error
        if (attempt < retries && shouldRetryRequest(requestError)) {
          await wait(Math.max(0, Number(retryDelayMs) || 0))
          continue
        }
        if (requestError?.name === 'TypeError') {
          throw Object.assign(new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.'), { status: 503 })
        }
        throw requestError
      } finally {
        globalThis.clearTimeout(timeout)
      }
    }
  } finally {
    if (shouldTrackLoading) {
      pendingApiRequestCount.value = Math.max(0, pendingApiRequestCount.value - 1)
    }
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

export const requestApiCached = async (path, params, {
  ttlMs = DEFAULT_CACHE_TTL_MS,
  trackLoading = true,
  ...requestOptions
} = {}) => {
  const key = cacheKey(path, params)
  const now = Date.now()
  const cached = responseCache.get(key)
  if (cached?.value !== undefined && cached.expiresAt > now) return cached.value
  if (cached?.promise) return cached.promise

  const promise = requestApi(path, params, { trackLoading, ...requestOptions })
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

// Final production uses one configured ASP.NET origin via VITE_API_BASE_URL.
// Same-origin Vercel Functions remain transitional only. Public services may
// keep their explicitly designed bundled JSON fallback; dynamic writes do not.
export const isSameOriginApiAvailable = () => Boolean(
  API_BASE_URL || (typeof globalThis.location?.origin === 'string' && globalThis.location.origin),
)
