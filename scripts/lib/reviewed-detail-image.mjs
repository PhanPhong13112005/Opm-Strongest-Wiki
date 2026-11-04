// Preserve explicitly reviewed detail artwork independently of card portraits.
// No ID-specific branch and no image regeneration for an approved responsive set.
export async function getReviewedDetailImage(character, readMetadata) {
  const fields = ['imageSrcset', 'imageWidth', 'imageHeight']
  if (!fields.some(key => character[key] !== undefined)) return null
  if (!fields.every(key => character[key]) || !character.imageURL) {
    throw new Error(`Incomplete reviewed detail image: ${character.id}`)
  }
  if (![character.imageWidth, character.imageHeight].every(n => Number.isInteger(n) && n > 0)) {
    throw new Error(`Invalid reviewed intrinsic dimensions: ${character.id}`)
  }
  const variants = String(character.imageSrcset).split(',').map(part => {
    const match = part.trim().match(/^(\/Characters\/optimized\/[^\s,?#]+\.webp)\s+(\d+)w$/)
    if (!match || decodeURIComponent(match[1]).split('/').includes('..')) {
      throw new Error(`Invalid reviewed srcset: ${character.id}`)
    }
    return { url: match[1], width: Number(match[2]) }
  })
  if (variants.length < 2 || new Set(variants.map(v => v.width)).size !== variants.length ||
      variants.some((v, i) => v.width <= 0 || (i > 0 && v.width <= variants[i - 1].width))) {
    throw new Error(`Invalid reviewed responsive widths: ${character.id}`)
  }
  const largest = variants.at(-1)
  if (character.imageURL !== largest.url || character.imageWidth !== largest.width) {
    throw new Error(`Reviewed fallback must be the full-size artwork: ${character.id}`)
  }
  for (const variant of variants) {
    const metadata = await readMetadata(variant.url)
    const expectedHeight = variant.width * character.imageHeight / character.imageWidth
    if (metadata.format !== 'webp' || metadata.width !== variant.width ||
        Math.abs(metadata.height - expectedHeight) > 1 ||
        (variant === largest && metadata.height !== character.imageHeight)) {
      throw new Error(`Reviewed artwork dimensions/aspect mismatch: ${character.id}`)
    }
  }
  return Object.fromEntries(['imageURL', ...fields].map(key => [key, character[key]]))
}
