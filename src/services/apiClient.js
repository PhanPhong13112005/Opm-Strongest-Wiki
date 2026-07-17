const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
const API_BASE_URL = configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:5180' : '')
const REQUEST_TIMEOUT_MS = 3000

const buildUrl = (path, params = {}) => {
  if (!API_BASE_URL) return null

  const url = new URL(path, `${API_BASE_URL.replace(/\/$/, '')}/`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url
}

export const requestApi = async (path, params) => {
  const url = buildUrl(path, params)
  if (!url) throw new Error('API is not configured.')

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) throw new Error(`API returned ${response.status}.`)
    return await response.json()
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

export const isApiConfigured = () => Boolean(API_BASE_URL)
