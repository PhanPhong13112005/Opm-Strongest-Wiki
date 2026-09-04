import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import indexHandler from '../api/index.js'
import migrateHandler from '../api/migrate.js'
import sePayHandler from '../api/sepay-webhook.js'
import {
  enforceApiWriterFence,
  isMutationCapableApiRequest,
  isWriterFenceEnabled,
  writerFenceSurfaces,
} from '../api/_lib/writerFence.js'

const responseMock = () => ({
  statusCode: 200,
  payload: undefined,
  headers: {},
  status(code) { this.statusCode = code; return this },
  json(payload) { this.payload = payload; return this },
  setHeader(name, value) { this.headers[name] = value },
})

const explicitSurfaces = [
  ['POST', '/auth/register'],
  ['POST', '/auth/email-verification/request'],
  ['POST', '/auth/email-verification/confirm'],
  ['POST', '/auth/forgot-password'],
  ['POST', '/auth/reset-password'],
  ['PUT', '/admin/users/1/role'],
  ['PUT', '/admin/users/1/status'],
  ['PUT', '/tier-rankings/votes/character-id'],
  ['POST', '/events/event-id/comments'],
  ['DELETE', '/moderation/comments/1'],
  ['POST', '/forum/topics'],
  ['POST', '/forum/topics/1/posts'],
  ['DELETE', '/moderation/forum/topics/1'],
  ['DELETE', '/moderation/forum/posts/1'],
  ['GET', '/top-ups/mine'],
  ['PUT', '/top-ups/1/bank-payment'],
  ['PUT', '/top-ups/1/coupon-order'],
  ['GET', '/top-ups/1/bank-qr'],
  ['POST', '/top-ups/bank-qr'],
  ['POST', '/top-ups'],
  ['PUT', '/admin/top-ups/1/review'],
  ['PUT', '/staff/top-ups/1/review'],
  ['POST', '/sepay-webhook'],
  ['POST', '/webhooks/sepay'],
  ['POST', '/admin/characters'],
  ['PUT', '/admin/characters/character-id'],
  ['DELETE', '/admin/characters/character-id'],
  ['PUT', '/admin/keepsakes/keepsake-id'],
  ['DELETE', '/admin/keepsakes/keepsake-id'],
  ['POST', '/admin/events'],
  ['PUT', '/admin/events/event-id'],
  ['DELETE', '/admin/events/event-id'],
  ['POST', '/admin/releases'],
  ['PUT', '/admin/releases/1'],
  ['DELETE', '/admin/releases/1'],
  ['POST', '/migrate'],
]

test('writer fence inventory remains exactly 39 unique persistent write surfaces', () => {
  assert.equal(writerFenceSurfaces.length, 39)
  assert.equal(new Set(writerFenceSurfaces).size, 39)
  assert.equal(explicitSurfaces.length, 36)
})

test('all 36 explicit route actions and three implicit initializer surfaces are fenced', () => {
  for (const [method, path] of explicitSurfaces) {
    assert.equal(isMutationCapableApiRequest(method, path), true, `${method} ${path}`)
  }
  assert.equal(isMutationCapableApiRequest('GET', '/auth/me'), true)
  assert.equal(isMutationCapableApiRequest('GET', '/admin/users'), true)
  assert.equal(isMutationCapableApiRequest('GET', '/admin/characters'), true)
  assert.equal(isMutationCapableApiRequest('GET', '/admin/dashboard'), true)
})

test('fence off preserves dispatch and fence on blocks before route execution', () => {
  const request = { method: 'POST' }
  const offResponse = responseMock()
  assert.equal(isWriterFenceEnabled({}), false)
  assert.equal(enforceApiWriterFence(request, offResponse, '/auth/register', {}), false)
  assert.equal(offResponse.statusCode, 200)

  const onResponse = responseMock()
  assert.equal(enforceApiWriterFence(
    request,
    onResponse,
    '/auth/register',
    { OPMWIKI_WRITER_FENCE: '1' },
  ), true)
  assert.equal(onResponse.statusCode, 503)
  assert.equal(onResponse.headers['Retry-After'], '60')
})

test('public read paths remain available while mutation-capable reads are fenced', async () => {
  const previous = process.env.OPMWIKI_WRITER_FENCE
  process.env.OPMWIKI_WRITER_FENCE = '1'
  try {
    for (const path of ['/health', '/health/database', '/characters', '/events', '/release-schedule', '/tier-rankings']) {
      assert.equal(isMutationCapableApiRequest('GET', path), false, path)
    }

    const response = responseMock()
    await indexHandler({ method: 'GET', url: '/api/health', query: {} }, response)
    assert.equal(response.statusCode, 200)
    assert.equal(response.payload.status, 'healthy')
  } finally {
    if (previous === undefined) delete process.env.OPMWIKI_WRITER_FENCE
    else process.env.OPMWIKI_WRITER_FENCE = previous
  }
})

test('standalone migration and both SePay provider paths return retryable 503 while fenced', async () => {
  const previous = process.env.OPMWIKI_WRITER_FENCE
  process.env.OPMWIKI_WRITER_FENCE = '1'
  try {
    const migrationResponse = responseMock()
    await migrateHandler({ method: 'POST', headers: {} }, migrationResponse)
    assert.equal(migrationResponse.statusCode, 503)

    for (const url of ['/api/sepay-webhook', '/api/webhooks/sepay']) {
      const response = responseMock()
      await sePayHandler({ method: 'POST', url, headers: {} }, response)
      assert.equal(response.statusCode, 503)
      assert.deepEqual(response.payload, { success: false })
      assert.equal(response.headers['Retry-After'], '60')
    }
  } finally {
    if (previous === undefined) delete process.env.OPMWIKI_WRITER_FENCE
    else process.env.OPMWIKI_WRITER_FENCE = previous
  }
})

test('Vercel provider callback rewrite targets the fenced raw-body handler', async () => {
  const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.ok(vercel.rewrites.some(({ source, destination }) =>
    source === '/api/webhooks/sepay' && destination === '/api/sepay-webhook'))
  assert.ok(Object.hasOwn(vercel.functions, 'api/sepay-webhook.js'))
})
