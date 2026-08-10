import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const workspaceRoot = process.cwd()
const eventsPath = path.join(workspaceRoot, 'src', 'data', 'events.json')
const outputPath = path.join(workspaceRoot, 'src', 'data', 'eventImageDimensions.json')
const publicRoot = path.join(workspaceRoot, 'public')

const events = JSON.parse(await fs.readFile(eventsPath, 'utf8'))
const referencedImages = new Set()

for (const event of events) {
  if (event.imageUrl) referencedImages.add(event.imageUrl)
  for (const section of event.sections || []) {
    for (const image of section.images || []) referencedImages.add(image)
  }
  for (const image of event.detailImages || []) referencedImages.add(image)
}

const images = {}
const missing = []

for (const imageUrl of [...referencedImages].sort((left, right) => left.localeCompare(right))) {
  if (!imageUrl.startsWith('/')) continue
  const relativePath = decodeURIComponent(imageUrl.split(/[?#]/, 1)[0]).replace(/^\/+/, '')
  const sourcePath = path.resolve(publicRoot, relativePath)
  if (!sourcePath.startsWith(`${publicRoot}${path.sep}`)) {
    throw new Error(`Event image escapes public directory: ${imageUrl}`)
  }

  try {
    const metadata = await sharp(sourcePath).metadata()
    if (!metadata.width || !metadata.height) throw new Error('missing dimensions')
    images[imageUrl] = { width: metadata.width, height: metadata.height }
  } catch {
    missing.push(imageUrl)
  }
}

if (missing.length) {
  throw new Error(`Missing event image metadata for ${missing.length} file(s): ${missing.join(', ')}`)
}

await fs.writeFile(outputPath, `${JSON.stringify({ version: 1, images }, null, 2)}\n`, 'utf8')
console.log(`Generated ${Object.keys(images).length} event image dimensions.`)
