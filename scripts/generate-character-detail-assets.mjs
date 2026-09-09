import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const dataRoot = path.join(root, 'src', 'data')
const publicRoot = path.join(root, 'public')
const detailRoot = path.join(publicRoot, 'character-details')
const characterImageRoot = path.join(publicRoot, 'Characters', 'optimized')
const cardIconRoot = path.join(publicRoot, 'Characters', 'card-icons')
const iconRoot = path.join(publicRoot, 'DetailIcons')
const characterSummaryFile = path.join(dataRoot, 'characterSummaries.json')

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'))
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const writeCharacterBootNames = async (characters) => {
  const indexFile = path.join(root, 'index.html')
  const startMarker = '/* character-boot-names:start */'
  const endMarker = '/* character-boot-names:end */'
  const html = await fs.readFile(indexFile, 'utf8')
  const start = html.indexOf(startMarker)
  const end = html.indexOf(endMarker)
  if (start < 0 || end < start) throw new Error('Character boot name markers are missing from index.html')
  const names = Object.fromEntries(characters.map(character => [safeId(character.id), character.name]))
  const serialized = JSON.stringify(names).replaceAll('<', '\\u003c')
  const replacement = `${startMarker}\n      const characterBootNames = ${serialized}\n      ${endMarker}`
  await fs.writeFile(indexFile, html.slice(0, start) + replacement + html.slice(end + endMarker.length), 'utf8')
}

const safeId = (id) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error(`Unsafe character id: ${id}`)
  return id
}

const publicFile = (url) => path.join(publicRoot, ...decodeURIComponent(url).replace(/^\/+/, '').split('/'))
const publicUrl = (...segments) => `/${segments.map(segment => encodeURIComponent(segment)).join('/')}`

const resolveClassIcon = (character) => {
  if (character.classIcon) return character.classIcon

  const faction = String(character.faction || '').toLowerCase()
  const classLevel = String(character.classLevel || '').toLowerCase()
  if (faction.includes('quái vật') || faction.includes('quái nhân') || faction.includes('monster')) {
    const monsterClass = { dragon: 'Dragon', demon: 'Demon', tiger: 'Tiger' }[classLevel]
    if (monsterClass) return `/Class/${monsterClass}.png`
  }
  if (faction.includes('võ thuật') || faction.includes('martial')) return '/Class/Martial_Artist.png'
  if (faction.includes('tội phạm') || faction.includes('outlaw')) return '/Class/Outlaw.png'
  if (!classLevel) return null

  const tier = String(character.tier || '').toUpperCase()
  if (tier.includes('UR+')) return '/Class/Class_SS.png'
  if (tier.includes('UR')) return '/Class/Class_S.png'
  if (tier.includes('SSR')) return '/Class/A.png'
  if (tier.includes('SR')) return '/Class/B.png'
  if (tier.includes('R')) return '/Class/C.png'
  return '/Class/Villain.png'
}

const resizeCharacterImage = async (character) => {
  const id = safeId(character.id)
  const input = publicFile(character.imageURL)
  const metadata = await sharp(input).metadata()
  if (!metadata.width || !metadata.height) throw new Error(`Image dimensions unavailable for ${id}`)

  const variants = []
  for (const targetWidth of [360, 600]) {
    const output = path.join(characterImageRoot, `${id}-${targetWidth}.webp`)
    const info = await sharp(input)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
      .toFile(output)
    variants.push({ width: info.width, url: publicUrl('Characters', 'optimized', `${id}-${targetWidth}.webp`) })
  }

  const uniqueVariants = [...new Map(variants.map(variant => [variant.width, variant])).values()]
    .sort((left, right) => left.width - right.width)
  const desktop = uniqueVariants.at(-1)
  return {
    imageURL: desktop.url,
    imageSrcset: uniqueVariants.map(variant => `${variant.url} ${variant.width}w`).join(', '),
    imageWidth: metadata.width,
    imageHeight: metadata.height,
  }
}


const optimizeIcon = async ({ input, output, width }) => {
  await sharp(path.join(publicRoot, ...input))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
    .toFile(path.join(iconRoot, output))
}

const optimizeCardIcon = async ({ inputUrl, output }) => {
  await sharp(publicFile(inputUrl))
    .resize({ width: 64, height: 64, fit: 'contain', withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 100, smartSubsample: true })
    .toFile(path.join(cardIconRoot, output))
}

const characterSummary = (character) => {
  const id = safeId(character.id)
  const classIcon = resolveClassIcon(character)
  return {
    id,
    name: character.name,
    imageURL: publicUrl('Characters', 'optimized', `${id}-360.webp`),
    tier: character.tier,
    type: character.type,
    faction: character.faction,
    roles: character.roles,
    classLevel: character.classLevel,
    classIcon: character.classIcon,
    keepsakeIcon: character.keepsakeIcon,
    cardClassIcon: classIcon ? publicUrl('Characters', 'card-icons', `${id}-class.webp`) : null,
    cardKeepsakeIcon: character.keepsakeIcon
      ? publicUrl('Characters', 'card-icons', `${id}-keepsake.webp`)
      : null,
    releaseSea: character.releaseSea,
    releaseTrung: character.releaseTrung,
  }
}

await fs.rm(detailRoot, { recursive: true, force: true })
await fs.rm(characterImageRoot, { recursive: true, force: true })
await fs.rm(cardIconRoot, { recursive: true, force: true })
await fs.rm(iconRoot, { recursive: true, force: true })
await Promise.all([
  fs.mkdir(path.join(detailRoot, 'vi'), { recursive: true }),
  fs.mkdir(path.join(detailRoot, 'en'), { recursive: true }),
  fs.mkdir(characterImageRoot, { recursive: true }),
  fs.mkdir(cardIconRoot, { recursive: true }),
  fs.mkdir(iconRoot, { recursive: true }),
])

const [charactersVi, charactersEn] = await Promise.all([
  readJson(path.join(dataRoot, 'characters.json')),
  readJson(path.join(dataRoot, 'characters_en.json')),
])
const englishById = new Map(charactersEn.map(character => [character.id, character]))
await writeCharacterBootNames(charactersVi)
for (const characterVi of charactersVi) {
  const characterEn = englishById.get(characterVi.id)
  if (!characterEn) throw new Error(`English character missing: ${characterVi.id}`)
  const image = await resizeCharacterImage(characterVi)
  await Promise.all([
    writeJson(path.join(detailRoot, 'vi', `${safeId(characterVi.id)}.json`), { ...characterVi, ...image }),
    writeJson(path.join(detailRoot, 'en', `${safeId(characterVi.id)}.json`), { ...characterEn, ...image }),
  ])
}

const iconJobs = [
  ...['Duelist', 'Grappler', 'Esper', 'Hi-Tech'].map(name => ({ input: ['Series', `${name}.png`], output: `series-${name.toLowerCase()}.webp`, width: 64 })),
  ...['Hero', 'Monster', 'Martial_Artist', 'Outlaw', 'Other'].map(name => ({ input: ['Faction', `${name}.png`], output: `faction-${name.toLowerCase()}.webp`, width: 64 })),
  ...['URplus', 'UR', 'SSRplus', 'SSR', 'SR', 'R', 'N'].map(name => ({ input: ['Quality', `${name === 'SSRplus' ? 'SSR+' : name}.png`], output: `quality-${name}.webp`, width: 160 })),
]
await Promise.all(iconJobs.map(optimizeIcon))

const cardIconJobs = charactersVi.flatMap(character => {
  const id = safeId(character.id)
  const jobs = []
  const classIcon = resolveClassIcon(character)
  if (classIcon) jobs.push({ inputUrl: classIcon, output: `${id}-class.webp` })
  if (character.keepsakeIcon) {
    jobs.push({ inputUrl: character.keepsakeIcon, output: `${id}-keepsake.webp` })
  }
  return jobs
})
await Promise.all(cardIconJobs.map(optimizeCardIcon))

await writeJson(characterSummaryFile, {
  vi: charactersVi.map(characterSummary),
  en: charactersEn.map(characterSummary),
})

console.log(`Generated ${charactersVi.length} localized character detail pairs, list summaries, and responsive assets.`)
