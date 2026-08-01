const LOCAL_ASSET_VERSION = '20260801-1'

const transformPath = (url, transform) => {
  const queryIndex = url.indexOf('?')
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex)
  const query = queryIndex === -1 ? '' : url.slice(queryIndex)
  return transform(pathname) + query
}

export const decodeAssetUrlForLocalServer = (url = '') => (
  transformPath(String(url), pathname => pathname.replace(/%2B/gi, '+'))
)

export const safeAssetUrl = (url) => {
  if (!url) return ''
  const preservedEscapes = []
  const tokenized = String(url).replace(/%[0-9a-f]{2}/gi, (escape) => {
    preservedEscapes.push(escape.toUpperCase())
    return '__OPM_ESCAPE_' + (preservedEscapes.length - 1) + '__'
  })
  let encoded = encodeURI(tokenized).replace(/#/g, '%23')
  encoded = encoded.replace(/__OPM_ESCAPE_(\d+)__/g, (_, index) => preservedEscapes[Number(index)])
  encoded = transformPath(encoded, pathname => pathname.replace(/\+/g, '%2B'))

  if (!encoded.startsWith('/') || encoded.startsWith('//')) return encoded
  if (new RegExp('[?&]v=' + LOCAL_ASSET_VERSION + '(?:&|$)').test(encoded)) return encoded
  return encoded + (encoded.includes('?') ? '&' : '?') + 'v=' + LOCAL_ASSET_VERSION
}
