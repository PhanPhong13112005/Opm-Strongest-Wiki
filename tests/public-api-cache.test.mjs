import assert from 'node:assert/strict'
import test from 'node:test'

const originalFetch = globalThis.fetch
const originalLocation = globalThis.location

globalThis.location = { origin: 'https://wiki.test' }

const { invalidateApiCache, pendingApiRequests, requestApi, requestApiCached } = await import('../src/services/apiClient.js')

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
test('global GET loading counter covers success and failure without getting stuck', async () => {
  let resolveFetch
  globalThis.fetch = () => new Promise(resolve => {
    resolveFetch = resolve
  })

  const pendingRequest = requestApi('api/loading-test')
  await Promise.resolve()
  assert.equal(pendingApiRequests.value, 1)

  resolveFetch(new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
  await pendingRequest
  assert.equal(pendingApiRequests.value, 0)

  let failedAttempts = 0
  globalThis.fetch = async () => {
    failedAttempts += 1
    throw new TypeError('Network unavailable')
  }
  await assert.rejects(
    requestApi('api/loading-error', null, { retryDelayMs: 0 }),
    /Không thể kết nối máy chủ/,
  )
  assert.equal(failedAttempts, 2, 'safe GET requests retry once after a network failure')
  assert.equal(pendingApiRequests.value, 0)
})

test('mutating requests are not retried unless the caller explicitly opts in', async () => {
  let attempts = 0
  globalThis.fetch = async () => {
    attempts += 1
    throw new TypeError('Network unavailable')
  }

  await assert.rejects(
    requestApi('api/login-test', null, { method: 'POST', retryDelayMs: 0 }),
    /Không thể kết nối máy chủ/,
  )
  assert.equal(attempts, 1)

  await assert.rejects(
    requestApi('api/idempotent-vote-test', null, { method: 'PUT', retryCount: 1, retryDelayMs: 0 }),
    /Không thể kết nối máy chủ/,
  )
  assert.equal(attempts, 3)
})
test('cached background GET can opt out of the global loading overlay', async () => {
  let resolveFetch
  globalThis.fetch = () => new Promise(resolve => {
    resolveFetch = resolve
  })
  invalidateApiCache('api/background-refresh')

  const pendingRequest = requestApiCached(
    'api/background-refresh',
    {},
    { trackLoading: false },
  )
  await Promise.resolve()
  assert.equal(pendingApiRequests.value, 0)

  resolveFetch(new Response(JSON.stringify({ items: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
  await pendingRequest
  assert.equal(pendingApiRequests.value, 0)
})