import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const events = JSON.parse(fs.readFileSync(path.join(root, 'src/data/events.json'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/data/eventImageDimensions.json'), 'utf8'))

const referencedImages = new Set()
for (const event of events) {
  if (event.imageUrl) referencedImages.add(event.imageUrl)
  for (const section of event.sections || []) {
    for (const image of section.images || []) referencedImages.add(image)
  }
  for (const image of event.detailImages || []) referencedImages.add(image)
}

test('event image dimension manifest covers every referenced image without stale entries', () => {
  const references = [...referencedImages].sort()
  const manifestImages = Object.keys(manifest.images).sort()

  assert.equal(manifest.version, 1)
  assert.deepEqual(manifestImages, references)

  for (const imageUrl of references) {
    const dimensions = manifest.images[imageUrl]
    assert.ok(Number.isInteger(dimensions.width) && dimensions.width > 0, imageUrl)
    assert.ok(Number.isInteger(dimensions.height) && dimensions.height > 0, imageUrl)

    const relativePath = decodeURIComponent(imageUrl).replace(/^\/+/, '')
    assert.ok(fs.existsSync(path.join(root, 'public', relativePath)), imageUrl)
  }
})

test('event detail reserves image space before images finish loading', () => {
  const view = fs.readFileSync(path.join(root, 'src/views/EventDetailView.vue'), 'utf8')

  assert.match(view, /:width="heroImageDimensions\?\.width"/)
  assert.match(view, /:height="heroImageDimensions\?\.height"/)
  assert.match(view, /:width="getImageDimensions\(img\)\?\.width"/)
  assert.match(view, /:height="getImageDimensions\(img\)\?\.height"/)
})
