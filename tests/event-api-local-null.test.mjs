import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = path.resolve(process.env.OPMWIKI_QA_SOURCE_ROOT || path.join(import.meta.dirname, '..'))
const dependencyRoot = process.env.OPMWIKI_QA_DEPENDENCY_ROOT || root
const require = createRequire(path.join(dependencyRoot, 'package.json'))
const { build } = require('esbuild')
const fallbackRoot = process.env.OPMWIKI_QA_UNCHANGED_SOURCE_ROOT
const bundled = await build({
  entryPoints: [path.join(root, 'src/services/eventApi.js')],
  bundle: true, platform: 'node', format: 'esm', write: false,
  define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'http://127.0.0.1:5180' }) },
  plugins: fallbackRoot ? [{
    name: 'sparse-reviewed-overlay',
    setup(builder) {
      builder.onResolve({ filter: /^\./ }, args => {
        const missing = path.resolve(args.resolveDir, args.path)
        if ([missing, missing + '.js', missing + '.json'].some(file => fs.existsSync(file))) return
        const relative = path.relative(root, missing)
        if (relative.startsWith('..') || path.isAbsolute(relative)) return
        const original = path.join(fallbackRoot, relative)
        const found = [original, original + '.js', original + '.json'].find(file => fs.existsSync(file))
        if (found) return { path: found }
      })
    },
  }] : [],
})
const { getEventById, getEvents } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'))
const originalFetch = globalThis.fetch
test.after(() => { globalThis.fetch = originalFetch })
let sequence = 0
for (const language of ['vi', 'en']) {
  const suffix = language === 'vi' ? 'Vi' : 'En'
  const opposite = language === 'vi' ? 'En' : 'Vi'
  const makeEvent = id => ({ id, title: 'Independent API title ' + language, description: 'Independent API description ' + language, category: 'qa', imageUrl: '/qa.png', startDate: '2026-11-01', endDate: '2026-11-02', sections: [{ title: 'QA', content: 'Fixture' }], detailImages: ['/qa-detail.png'], updatedAt: '2026-11-01T00:00:00Z' })
  test('API-only event null local payload resolves ' + language, async () => {
    const id = 'qa-only-' + ++sequence, event = makeEvent(id), requests = []
    globalThis.fetch = async url => { requests.push(String(url)); return Response.json(event) }
    const actual = await getEventById(id, language, null)
    assert.equal(actual.id, id)
    assert.equal(actual['title' + suffix], event.title)
    assert.equal(actual['description' + suffix], event.description)
    assert.equal(actual['title' + opposite], undefined)
    assert.deepEqual(actual.sections, event.sections)
    assert.deepEqual(actual.detailImages, event.detailImages)
    assert.equal(actual.updatedAt, event.updatedAt)
    assert.equal(requests.length, 1)
    assert.equal(new URL(requests[0]).searchParams.get('language'), language)
  })
  test('bundled event preserves other locale and local fields ' + language, async () => {
    const id = 'qa-bundled-' + ++sequence, event = makeEvent(id)
    const local = { id, titleVi: 'Local VI', titleEn: 'Local EN', descriptionVi: 'Local description VI', descriptionEn: 'Local description EN', reviewedLocalField: 'preserved' }
    const before = structuredClone(local)
    globalThis.fetch = async () => Response.json(event)
    const actual = await getEventById(id, language, local)
    assert.equal(actual['title' + suffix], event.title)
    assert.equal(actual['description' + suffix], event.description)
    assert.equal(actual['title' + opposite], local['title' + opposite])
    assert.equal(actual['description' + opposite], local['description' + opposite])
    assert.equal(actual.reviewedLocalField, 'preserved')
    assert.deepEqual(local, before)
  })
  test('real API 404 keeps bundled fallback, without retries ' + language, async () => {
    const id = 'qa-fallback-' + ++sequence, local = { id, titleVi: 'VI fallback', titleEn: 'EN fallback' }
    let calls = 0
    globalThis.fetch = async () => { calls++; return Response.json({ message: 'Missing fixture record' }, { status: 404 }) }
    assert.equal(await getEventById(id, language, local), local)
    assert.equal(calls, 1)
  })
  test('real API 404 without local event still rejects ' + language, async () => {
    const id = 'qa-missing-' + ++sequence
    let calls = 0
    globalThis.fetch = async () => { calls++; return Response.json({ message: 'Missing fixture record' }, { status: 404 }) }
    await assert.rejects(getEventById(id, language, null), error => error.status === 404)
    assert.equal(calls, 1)
  })
  test('event listing still merges API-only and bundled records ' + language, async () => {
    const first = makeEvent('qa-list-first-' + ++sequence)
    const second = { ...makeEvent('qa-list-second-' + ++sequence), startDate: '2026-11-03' }
    const local = { id: second.id, titleVi: 'List VI', titleEn: 'List EN' }
    globalThis.fetch = async () => Response.json({ items: [second, first], page: 1, totalCount: 2 })
    const actual = await getEvents({ language, page: ++sequence, localEvents: [local] })
    assert.equal(actual.source, 'api')
    assert.deepEqual(actual.items.map(item => item.id), [first.id, second.id])
    assert.equal(actual.items[1]['title' + opposite], local['title' + opposite])
    assert.equal(actual.items[0]['title' + suffix], first.title)
  })
}
