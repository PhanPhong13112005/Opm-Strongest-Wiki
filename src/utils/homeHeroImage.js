import { safeAssetUrl } from './assetUrl.js'

// Shared by the pre-JavaScript hint and the rendered hero. Do not preload raw
// multi-megabyte artwork when a verified responsive image is not available.
const responsiveImages = new Map([
  ['/Characters/Full_Background/Homeless_Emperor_URplus.png', { slug: 'homeless-emperor-urplus', width: 2400, height: 1473 }],
  ['/Characters/Full_Background/ZombIeMan_URplus.png', { slug: 'zombieman-urplus', width: 2400, height: 1584 }],
  ['/Characters/Full_Background/Bang&Bomb_Urplus.png', { slug: 'bang-bomb-urplus', width: 2400, height: 1023 }],
  ['/Characters/Full_Background/Atomic Samurai_URplus.png', { slug: 'atomic-samurai-urplus', width: 2400, height: 1023 }],
])

export const featuredImageSizes = {
  CN: '(max-width: 430px) 70vw, (max-width: 700px) 78vw, (max-width: 1100px) 60vw, min(52vw, 750px)',
  SEA: '(max-width: 430px) 70vw, (max-width: 700px) 78vw, (max-width: 1100px) 66vw, min(58vw, 850px)',
}

// Discover the built entry CSS before the synchronous month-aware image hint.
// Keep the real stylesheet in place: a preload starts its fetch without making
// that hint wait for stylesheet completion. Preserve its CORS/media attributes.
export const entryStylesheetPreloads = html => {
  const seen = new Set()
  const hints = []
  for (const match of html.matchAll(/<link\b[^>]*\brel=(["'])stylesheet\1[^>]*>/gi)) {
    const tag = match[0]
    const href = tag.match(/\bhref=(["'])(.*?)\1/i)?.[2]
    if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) || !/\.css(?:[?#]|$)/i.test(href) || seen.has(href)) continue
    seen.add(href)
    hints.push(tag.replace(/\brel=(["'])stylesheet\1/i, 'rel="preload" as="style" fetchpriority="high"'))
  }
  return hints.length ? `${hints.join('\n')}\n` : ''
}

export const getResponsiveHomeImage = (filename, widths = [320, 640, 960, 1600, 2400]) => {
  if (filename === '/Characters/Full_Background/Child_URplus.png') {
    return {
      src: safeAssetUrl('/Characters/optimized/100320-urplus-600.webp'),
      srcset: [360, 600].map(width => `${safeAssetUrl(`/Characters/optimized/100320-urplus-${width}.webp`)} ${width}w`).join(', '),
      width: 1298,
      height: 1212,
    }
  }
  if (filename === '/Characters/optimized/100321-urplus-artwork-1200.webp') {
    // Use the approved181842-byte asset on Home, preserving the500KB preload limit.
    return {
      src: safeAssetUrl('/Characters/optimized/100321-urplus-artwork-600.webp'),
      srcset: `${safeAssetUrl('/Characters/optimized/100321-urplus-artwork-600.webp')} 600w`,
      width: 1200, height: 607,
    }
  }
  const image = responsiveImages.get(filename)
  if (!image) return null
  const basePath = `/Characters/Full_Background/optimized/${image.slug}`
  return {
    src: safeAssetUrl(`${basePath}-960.webp`),
    srcset: widths.map(width => `${safeAssetUrl(`${basePath}-${width}.webp`)} ${width}w`).join(', '),
    width: image.width,
    height: image.height,
  }
}

export const homeHeroPreloadManifest = rows => {
  rows = rows.filter(row => row.datePrecision !== 'month')
  const manifest = {}
  for (const month of new Set(rows.map(row => String(row.date).slice(0, 7)))) {
    // Same CN/SEA priority, sort order and initial-before-return selection as
    // HomeView/HomeRadar. An unknown first spotlight must not preload another.
    for (const server of ['CN', 'SEA']) {
      const events = rows.filter(row => row.server === server && String(row.date).startsWith(`${month}-`))
        .sort((a, b) => a.sortOrder - b.sortOrder)
      if (!events.length) continue
      const row = events.find(event => !event.isReturn) || events[0]
      const image = row.characterId !== 'unknown' && getResponsiveHomeImage(row.bannerImage)
      if (image) manifest[month] = { characterId: row.characterId, server, ...image, sizes: featuredImageSizes[server] }
      break
    }
  }
  return manifest
}

// Keep an actual Image alive until the boot shell hands over to Vue. A completed
// link preload may be fetched again under no-store/cache-disabled conditions;
// the visible boot image retains the same available-image reuse as the base.
export const homeHeroPreloadScript = rows => `(() => {
  if (location.pathname !== '/') return;
  const manifest = ${JSON.stringify(homeHeroPreloadManifest(rows)).replace(/</g, '\\u003c')};
  const requested = new URLSearchParams(location.search).get('month');
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const month = /^[1-9]\\d{3}-(0[1-9]|1[0-2])$/.test(requested || '') ? requested : parts.find(p => p.type === 'year').value + '-' + parts.find(p => p.type === 'month').value;
  const hero = manifest[month];
  if (!hero) return;
  const image = new Image();
  image.width = hero.width;
  image.height = hero.height;
  image.alt = '';
  image.loading = 'eager';
  image.decoding = 'async';
  image.setAttribute('fetchpriority', 'high');
  image.setAttribute('data-home-hero-preload', month);
  image.sizes = hero.sizes;
  image.srcset = hero.srcset;
  window.__opmHomeHeroImage = image;
  image.src = hero.src;
})();`
