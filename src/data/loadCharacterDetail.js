const detailRequestCache = new Map()

export const loadLocalCharacterDetail = async (id, language = 'vi') => {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null
  const locale = language === 'en' ? 'en' : 'vi'
  const url = `/character-details/${locale}/${encodeURIComponent(id)}.json`

  if (!detailRequestCache.has(url)) {
    detailRequestCache.set(url, fetch(url, { cache: 'force-cache' })
      .then(response => response.ok ? response.json() : null)
      .catch(() => null))
  }

  return detailRequestCache.get(url)
}