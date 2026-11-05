import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.env.OPMWIKI_QA_SOURCE_ROOT || path.join(import.meta.dirname, '..'))
const source = fs.readFileSync(path.join(root, 'src/views/DetailView.vue'), 'utf8')
const begin = source.includes('const hasCompleteLocalGaleDetail') ? source.indexOf('const hasCompleteLocalGaleDetail') : source.indexOf('const loadCharacter =')
const end = source.indexOf('watch([() => props.id, locale]', begin)
assert(begin >= 0 && end > begin, 'Read the actual DetailView request lifecycle, not a duplicate implementation')
const lifecycle = source.slice(begin, end)
const galeId = '100321-urplus'
// Independent contract fixture; no gameplay numbers or source-derived expected values.
const complete = () => ({
  id: galeId, tier: 'UR+', name: 'QA local Gale', imageURL: '/qa-artwork.webp', type: 'Duelist', faction: 'Monster',
  skills: ['Basic', 'Ultimate', 'Passive', 'Awakening'].map(type => ({ type, desc: 'QA reviewed description', icon: '/qa-' + type + '.png' })),
})
function setup(id, language, loader, api = async () => ({ id, name: 'QA server detail' })) {
  const props = { id }, locale = { value: language }, localCharacter = { value: null }, apiCharacter = { value: null }, calls = [], redirects = []
  const factory = new Function('props', 'locale', 'localCharacter', 'apiCharacter', 'loadLocalCharacterDetail', 'getCharacterById', 'router', 'let activeDetailRequest = 0;\n' + lifecycle + '\nreturn loadCharacter')
  const load = factory(props, locale, localCharacter, apiCharacter, loader, async (...args) => { calls.push(args); return api(...args) }, { push: route => redirects.push(route) })
  return { load, props, locale, localCharacter, apiCharacter, calls, redirects }
}
for (const language of ['vi', 'en']) {
  test('complete reviewed local Gale avoids the missing API record ' + language, async () => {
    const local = complete(), run = setup(galeId, language, async () => local)
    await run.load()
    assert.equal(run.calls.length, 0)
    assert.equal(run.localCharacter.value, local)
    assert.equal(run.apiCharacter.value, null)
    assert.deepEqual(run.redirects, [])
  })
  for (const [label, payload] of [
    ['missing', null], ['wrong ID', { ...complete(), id: '100320-urplus' }],
    ['missing skill', { ...complete(), skills: complete().skills.slice(0, 3) }],
    ['missing image', { ...complete(), imageURL: '' }],
    ['missing description', { ...complete(), skills: complete().skills.map(skill => ({ ...skill, desc: '' })) }],
  ]) test(label + ' local Gale retains API lookup ' + language, async () => {
    const server = { id: galeId, name: 'QA server fallback' }
    const run = setup(galeId, language, async () => payload, async () => server)
    await run.load()
    assert.equal(run.calls.length, 1)
    assert.equal(run.calls[0][0], galeId)
    assert.equal(run.calls[0][1], language)
    assert.deepEqual(run.calls[0][3], { trackLoading: false })
    assert.equal(run.apiCharacter.value, server)
  })
  for (const id of ['100320-urplus', '100023-ur']) test('other character keeps server lookup: ' + id + ' ' + language, async () => {
    const local = { ...complete(), id }, run = setup(id, language, async () => local)
    await run.load()
    assert.equal(run.calls.length, 1)
    assert.equal(run.calls[0][0], id)
    assert.equal(run.apiCharacter.value.name, 'QA server detail')
  })
  test('404 with partial local Gale retains local fallback ' + language, async () => {
    const local = { id: galeId, name: 'Partial local' }
    const run = setup(galeId, language, async () => local, async () => { throw Object.assign(new Error('Missing API record'), { status: 404 }) })
    await run.load()
    assert.equal(run.calls.length, 1)
    assert.equal(run.localCharacter.value, local)
    assert.deepEqual(run.redirects, [])
  })
  test('404 without local data preserves unavailable route handling ' + language, async () => {
    const run = setup(galeId, language, async () => null, async () => { throw Object.assign(new Error('Missing API record'), { status: 404 }) })
    await run.load()
    assert.deepEqual(run.redirects, ['/'])
  })

}
test('late first local payload is ignored after a newer route completes', async () => {
  let resolveFirst
  const run = setup(galeId, 'vi', id => id === galeId ? new Promise(resolve => { resolveFirst = resolve }) : Promise.resolve({ id, name: 'Other local' }))
  const first = run.load()
  run.props.id = '100320-urplus'
  await run.load()
  const current = run.apiCharacter.value
  resolveFirst(complete())
  await first
  assert.equal(run.calls.length, 1)
  assert.equal(run.localCharacter.value.id, '100320-urplus')
  assert.equal(run.apiCharacter.value, current)
})
