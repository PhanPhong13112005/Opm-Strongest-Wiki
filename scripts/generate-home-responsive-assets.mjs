import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = path.join(root, 'public', 'Characters', 'Full_Background')
const outputRoot = path.join(sourceRoot, 'optimized')
const widths = [320, 640, 960, 1600, 2400]
const webpOptions = {
  quality: 90,
  alphaQuality: 100,
  smartSubsample: true,
  effort: 4,
}
const characters = [
  { slug: 'homeless-emperor-urplus', source: 'Homeless_Emperor_URplus.png' },
  { slug: 'zombieman-urplus', source: 'ZombIeMan_URplus.png' },
  { slug: 'bang-bomb-urplus', source: 'Bang&Bomb_Urplus.png' },
  { slug: 'atomic-samurai-urplus', source: 'Atomic Samurai_URplus.png' },
]

const sourceFiles = characters.map(character => path.join(sourceRoot, character.source))
const missingSources = []
for (const sourceFile of sourceFiles) {
  try {
    await fs.access(sourceFile)
  } catch {
    missingSources.push(path.relative(root, sourceFile))
  }
}
if (missingSources.length) {
  throw new Error(`Missing Home master image(s): ${missingSources.join(', ')}`)
}

await fs.mkdir(outputRoot, { recursive: true })

const generated = []
for (const character of characters) {
  const sourceFile = path.join(sourceRoot, character.source)
  for (const width of widths) {
    const outputFile = path.join(outputRoot, `${character.slug}-${width}.webp`)
    const info = await sharp(sourceFile)
      .resize({ width, withoutEnlargement: true })
      .webp(webpOptions)
      .toFile(outputFile)

    generated.push({
      file: path.relative(root, outputFile).replaceAll('\\', '/'),
      width: info.width,
      height: info.height,
      bytes: info.size,
    })
  }
}

if (generated.length !== characters.length * widths.length) {
  throw new Error(`Expected 20 Home variants, generated ${generated.length}`)
}

console.log(JSON.stringify({ generated }, null, 2))
