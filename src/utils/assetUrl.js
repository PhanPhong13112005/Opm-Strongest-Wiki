const LOCAL_ASSET_VERSION = '20260801-1'

export const safeAssetUrl = (url) => {
  if (!url) return ''
  const preservedEscapes = []
  const tokenized = String(url).replace(/%[0-9a-f]{2}/gi, (escape) => {
    preservedEscapes.push(escape.toUpperCase())
    return `__OPM_ESCAPE_${preservedEscapes.length - 1}__`
  })
  let encoded = encodeURI(tokenized).replace(/#/g, '%23')
  encoded = encoded.replace(/__OPM_ESCAPE_(\d+)__/g, (_, index) => preservedEscapes[Number(index)])

  if (!encoded.startsWith('/') || encoded.startsWith('//')) return encoded
  if (new RegExp(`[?&]v=${LOCAL_ASSET_VERSION}(?:&|$)`).test(encoded)) return encoded
  return `${encoded}${encoded.includes('?') ? '&' : '?'}v=${LOCAL_ASSET_VERSION}`
}
