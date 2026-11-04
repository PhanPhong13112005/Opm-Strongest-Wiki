import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { getReviewedDetailImage } from '../scripts/lib/reviewed-detail-image.mjs'
const root = path.resolve(import.meta.dirname, '..')
const rows = JSON.parse(fs.readFileSync(path.join(root, 'src/data/characters.json'), 'utf8'))
const gale = rows.find(c => c.id === '100321-urplus')
const metadata = url => sharp(path.join(root, 'public', decodeURIComponent(url))).metadata()
test('reviewed wide detail artwork keeps exact dimensions, responsive sources and portrait separation', async () => {
  const image = await getReviewedDetailImage(gale, metadata)
  assert.deepEqual(image, {imageURL:'/Characters/optimized/100321-urplus-artwork-1200.webp', imageSrcset:'/Characters/optimized/100321-urplus-artwork-600.webp 600w, /Characters/optimized/100321-urplus-artwork-1200.webp 1200w', imageWidth:1200, imageHeight:607})
  assert.equal(gale.avatarURL, '/Characters/optimized/100321-urplus-600.webp')
  const portrait = await metadata(gale.avatarURL)
  assert.equal(portrait.width, 600)
  assert.notEqual(portrait.height, image.imageHeight)
  for (const c of rows.filter(c => c.id !== gale.id)) assert.equal(await getReviewedDetailImage(c, metadata), null, c.id)
})
test('reviewed artwork rejects incomplete, missing, wrong-size, wrong-aspect or unsafe responsive files', async () => {
  for (const changed of [{imageWidth:1199}, {imageHeight:100}, {imageSrcset:''}, {imageSrcset:'/Characters/optimized/../outside.webp 600w, /Characters/optimized/100321-urplus-artwork-1200.webp 1200w'}]) {
    await assert.rejects(getReviewedDetailImage({...gale,...changed}, metadata))
  }
  await assert.rejects(getReviewedDetailImage(gale, async () => {throw new Error('missing image')}), /missing image/)
  await assert.rejects(getReviewedDetailImage(gale, async () => ({format:'png',width:600,height:304})), /mismatch/)
})
test('generator retains reviewed artwork inputs and renderer retains eager loading and list portrait fallback', () => {
  const read = f => fs.readFileSync(path.join(root,f),'utf8')
  const generator = read('scripts/generate-character-detail-assets.mjs')
  assert.match(generator, /if \(reviewed\) return reviewed/)
  assert.doesNotMatch(generator, /fs\.rm\(characterImageRoot/)
  assert.match(read('src/components/CharacterCard.vue'), /avatarURL \|\| props\.character\.imageURL/)
  const view = read('src/views/DetailView.vue')
  for (const expected of [':srcset="character.imageSrcset || undefined"', ':width="character.imageWidth || 600"', ':height="character.imageHeight || 720"', 'loading="eager"', 'fetchpriority="high"', 'decoding="async"']) assert.ok(view.includes(expected), expected)
})
