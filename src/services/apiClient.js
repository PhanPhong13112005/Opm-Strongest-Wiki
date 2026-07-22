const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_BASE_URL = configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:5180' : '')
const REQUEST_TIMEOUT_MS = 8000

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

export const isApiConfigured = () => Boolean(API_BASE_URL)

// Authentication and community APIs are deployed as same-origin Vercel
// Functions in production. Public wiki screens still use their local JSON
// fallback until each read-only .NET endpoint has been migrated.
export const isSameOriginApiAvailable = () => Boolean(
  API_BASE_URL || (typeof globalThis.location?.origin === 'string' && globalThis.location.origin),
)
