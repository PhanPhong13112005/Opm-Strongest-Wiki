export const safeAssetUrl = (url) => {
  if (!url) return ''
  // In a URL path, `+` is a valid literal character. Encoding it as `%2B`
  // makes Vite/Vercel miss public files whose real names contain `SSR+`.
  return encodeURI(url).replace(/#/g, '%23')
}
