import assert from 'node:assert/strict'
import test from 'node:test'

const originalFetch = globalThis.fetch
const originalLocation = globalThis.location

globalThis.location = { origin: 'https://wiki.test' }

const { invalidateApiCache, requestApiCached } = await import('../src/services/apiClient.js')

test.after(() => {
  globalThis.fetch = originalFetch
  if (originalLocation === undefined) delete globalThis.location
  else globalThis.location = originalLocation
})

test('public GET cache deduplicates requests and can be invalidated', async () => {
  let requestCount = 0
  globalThis.fetch = async () => {
    requestCount += 1
    return new Response(JSON.stringify({ items: [{ id: '100013-urplus' }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  invalidateApiCache()
  const params = { language: 'vi', page: 1 }
  const [first, second] = await Promise.all([
    requestApiCached('api/characters', params),
    requestApiCached('api/characters', { page: 1, language: 'vi' }),
  ])

  assert.deepEqual(first, second)
  assert.equal(requestCount, 1)

  await requestApiCached('api/characters', params)
  assert.equal(requestCount, 1)

  invalidateApiCache('api/characters')
  await requestApiCached('api/characters', params)
  assert.equal(requestCount, 2)
})
