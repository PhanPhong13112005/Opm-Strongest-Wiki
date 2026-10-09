const detailRequestCache = new Map()

export const loadLocalCharacterDetail = async (id, language = 'vi') => {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null
  const locale = language === 'en' ? 'en' : 'vi'
  // Refresh only the revised Child payload; preserve other characters' cache keys.
  const revision = id === '100320-urplus' ? '?v=child-skill-rules-20261008' : ''
  const url = `/character-details/${locale}/${encodeURIComponent(id)}.json${revision}`

  if (!detailRequestCache.has(url)) {
    const fetchOptions = import.meta.env?.DEV ? { cache: 'no-cache' } : { cache: 'force-cache' }
    detailRequestCache.set(url, fetch(url, fetchOptions)
      .then(response => response.ok ? response.json() : null)
      .catch(() => null))
  }

  return detailRequestCache.get(url)
}
