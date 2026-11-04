const detailRequestCache = new Map()

export const loadLocalCharacterDetail = async (id, language = 'vi') => {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null
  const locale = language === 'en' ? 'en' : 'vi'
  // Version only reviewed Gale image mappings and Child payloads.
  const revision = id === '100321-urplus'
    ? (locale === 'vi' ? '?v=gale-owner-exact-history-20261104-vi' : '?v=gale-owner-exact-history-20261104-en')
    : id === '100320-urplus'
      ? (locale === 'vi' ? '?v=child-owner-exact-history-20261104-vi' : '?v=child-owner-exact-history-20261104-en')
    : ''
  const url = `/character-details/${locale}/${encodeURIComponent(id)}.json${revision}`

  if (!detailRequestCache.has(url)) {
    const fetchOptions = import.meta.env?.DEV ? { cache: 'no-cache' } : { cache: 'force-cache' }
    detailRequestCache.set(url, fetch(url, fetchOptions)
      .then(response => response.ok ? response.json() : null)
      .catch(() => null))
  }

  return detailRequestCache.get(url)
}
