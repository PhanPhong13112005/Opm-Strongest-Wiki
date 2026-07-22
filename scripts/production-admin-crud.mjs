import { randomBytes } from 'node:crypto'

const DEFAULT_PRODUCTION_URL = 'https://opmts-wiki.vercel.app'
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3

const baseUrl = String(process.env.OPMWIKI_PRODUCTION_URL || DEFAULT_PRODUCTION_URL)
  .trim()
  .replace(/\/$/, '')
const username = String(process.env.ADMINAUTH__USERNAME || '').trim()
const password = String(process.env.ADMINAUTH__PASSWORD || '')

if (!username || !password) {
  console.error([
    'Missing Production Admin credentials.',
    'Set ADMINAUTH__USERNAME and ADMINAUTH__PASSWORD in the current terminal, then run:',
    'npm run test:production:admin-crud',
  ].join('\n'))
  process.exit(2)
}

const parsedBaseUrl = new URL(baseUrl)
if (parsedBaseUrl.protocol !== 'https:' && parsedBaseUrl.hostname !== 'localhost') {
  throw new Error(`Refusing to send credentials over a non-HTTPS connection: ${baseUrl}`)
}

const delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds))

const request = async (path, { expected, token, ...options } = {}) => {
  const url = new URL(path.replace(/^\//, ''), `${baseUrl}/`)
  let response

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) break
    await response.arrayBuffer()
    await delay(500 * attempt)
  }

  const body = response.status === 204
    ? null
    : await response.json().catch(() => null)
  const expectedStatuses = Array.isArray(expected) ? expected : [expected]

  if (!expectedStatuses.includes(response.status)) {
    const message = body?.message || body?.title || response.statusText || 'Unknown response'
    throw new Error(`${options.method || 'GET'} ${url.pathname}: expected ${expectedStatuses.join('/')}, received ${response.status} (${message})`)
  }

  return { response, body }
}

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

const suffix = `${Date.now()}-${randomBytes(3).toString('hex')}`
const characterId = `e2e-admin-crud-${suffix}`
const createdName = `E2E Admin CRUD ${suffix}`
const updatedName = `${createdName} Updated`
let token = ''
let recordCreated = false
let flowSucceeded = false

const createdPayload = {
  id: characterId,
  nameVi: createdName,
  nameEn: createdName,
  imageUrl: '',
  tier: 'SSR',
  typeVi: 'Vũ Trang',
  typeEn: 'Duelist',
  factionVi: 'Anh Hùng',
  factionEn: 'Hero',
  rolesVi: ['Kiểm thử tự động'],
  rolesEn: ['Automated test'],
  duyenVi: '',
  duyenEn: '',
  bioVi: 'Bản ghi tạm thời của smoke test Production.',
  bioEn: 'Temporary Production smoke-test record.',
  keepsakeIcon: null,
  traitsVi: [],
  traitsEn: [],
  bondListVi: '',
  bondListEn: '',
  classLevel: '',
  releaseSea: null,
  releaseChina: null,
  baseStats: { atk: 101, hp: 202, def: 303, spd: 404 },
  pvpStats: { atk: 505, hp: 606, def: 707, spd: 808 },
}

try {
  console.log(`[1/7] Logging in to ${parsedBaseUrl.hostname} as ${username}...`)
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    expected: 200,
  })
  token = login.body?.accessToken || ''
  assertEqual(login.body?.role, 'Admin', 'Authenticated role')
  if (!token) throw new Error('Login succeeded but no access token was returned.')

  console.log(`[2/7] Creating temporary character ${characterId}...`)
  const created = await request('/api/admin/characters', {
    method: 'POST', token, body: JSON.stringify(createdPayload), expected: 201,
  })
  recordCreated = true
  assertEqual(created.body?.id, characterId, 'Created character id')
  assertEqual(created.body?.nameVi, createdName, 'Created character name')

  console.log('[3/7] Reading the created character...')
  const readCreated = await request(`/api/admin/characters/${encodeURIComponent(characterId)}`, {
    token, expected: 200,
  })
  assertEqual(readCreated.body?.nameVi, createdName, 'Persisted created name')
  assertEqual(readCreated.body?.baseStats?.atk, 101, 'Persisted created ATK')

  console.log('[4/7] Updating the same character...')
  const updatedPayload = {
    ...createdPayload,
    nameVi: updatedName,
    nameEn: updatedName,
    bioVi: 'Bản ghi đã được cập nhật bởi smoke test Production.',
    bioEn: 'Record updated by the Production smoke test.',
    baseStats: { ...createdPayload.baseStats, atk: 999 },
  }
  const updated = await request(`/api/admin/characters/${encodeURIComponent(characterId)}`, {
    method: 'PUT', token, body: JSON.stringify(updatedPayload), expected: 200,
  })
  assertEqual(updated.body?.nameVi, updatedName, 'Updated character name')
  assertEqual(updated.body?.baseStats?.atk, 999, 'Updated character ATK')

  console.log('[5/7] Reading the updated character...')
  const readUpdated = await request(`/api/admin/characters/${encodeURIComponent(characterId)}`, {
    token, expected: 200,
  })
  assertEqual(readUpdated.body?.nameVi, updatedName, 'Persisted updated name')
  assertEqual(readUpdated.body?.baseStats?.atk, 999, 'Persisted updated ATK')

  console.log('[6/7] Deleting the temporary character...')
  await request(`/api/admin/characters/${encodeURIComponent(characterId)}`, {
    method: 'DELETE', token, expected: 204,
  })
  recordCreated = false

  console.log('[7/7] Confirming the character no longer exists...')
  await request(`/api/admin/characters/${encodeURIComponent(characterId)}`, {
    token, expected: 404,
  })

  flowSucceeded = true
  console.log('PASS: Production Admin login and Create -> Read -> Update -> Read -> Delete -> Verify flow succeeded.')
} finally {
  if (recordCreated && token) {
    console.warn(`Cleanup: deleting temporary character ${characterId} after an interrupted/failed flow...`)
    try {
      await request(`/api/admin/characters/${encodeURIComponent(characterId)}`, {
        method: 'DELETE', token, expected: [204, 404],
      })
      console.warn('Cleanup completed.')
    } catch (cleanupError) {
      console.error(`CLEANUP FAILED for ${characterId}: ${cleanupError.message}`)
      process.exitCode = 1
    }
  }

  if (!flowSucceeded) process.exitCode = 1
}
