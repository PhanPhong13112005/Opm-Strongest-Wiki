export const safeAssetUrl = (url) => {
  if (!url) return ''
  return encodeURI(url).replace(/#/g, '%23')
}
