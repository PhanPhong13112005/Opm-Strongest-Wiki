import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { getReleaseSchedule } from '../src/services/releaseScheduleApi.js'
import { isValidReleaseScheduleResponse } from '../src/services/releaseSchedulePolicy.js'

const fixture = JSON.parse(fs.readFileSync(new URL(
  '../mobile/test/fixtures/api/release_schedule_api_vi.json', import.meta.url), 'utf8'))
const child = {
  id: 23, server: 'CN', date: '2026-10', datePrecision: 'month', characterId: '100320-urplus',
  bannerImage: '/Characters/Child Emperor (UR)/UR.png', isReturn: false, sortOrder: 1,
}

test('actual frontend service opts into month precision and does not merge fallback', async () => {
  const previousFetch = globalThis.fetch
  const previousLocation = globalThis.location
  const requests = []
  globalThis.location = { origin: 'http://127.0.0.1:5189' }
  globalThis.fetch = async url => {
    requests.push(new URL(url))
    return new Response(JSON.stringify([...fixture, child]), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const rows = await getReleaseSchedule('vi')
    assert.equal(requests.length, 1)
    assert.equal(requests[0].pathname, '/api/release-schedule')
    assert.equal(requests[0].searchParams.get('includeMonthPrecision'), 'true')
    assert.equal(requests[0].searchParams.get('language'), 'vi')
    assert.equal(rows.length, 23)
    assert.equal(rows.filter(row => row.characterId === child.characterId).length, 1)
    assert.equal(rows.find(row => row.characterId === child.characterId).date, '2026-10')
    assert.equal(isValidReleaseScheduleResponse(rows), true)
  } finally {
    globalThis.fetch = previousFetch
    if (previousLocation === undefined) delete globalThis.location
    else globalThis.location = previousLocation
  }
})

test('month-only rows require explicit precision and unique composite keys', () => {
  assert.equal(isValidReleaseScheduleResponse([...fixture, { ...child, datePrecision: undefined }]), false)
  assert.equal(isValidReleaseScheduleResponse([...fixture, child, child]), false)
  assert.equal(isValidReleaseScheduleResponse(fixture), true)
  for (const date of ['2026-00', '2026-13', '0000-10', '2026-10-01']) {
    assert.equal(isValidReleaseScheduleResponse([...fixture, { ...child, date }]), false)
  }
})
