import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  isValidReleaseScheduleResponse,
  loadReleaseScheduleWithFallback,
  releaseScheduleKey,
} from '../src/services/releaseSchedulePolicy.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = relativePath => JSON.parse(
  fs.readFileSync(path.join(root, relativePath), 'utf8'),
)

const fixtures = {
  vi: readJson('mobile/test/fixtures/api/release_schedule_api_vi.json'),
  en: readJson('mobile/test/fixtures/api/release_schedule_api_en.json'),
}
const fallback = readJson('src/data/releaseSchedule.json')
const expectedNewKeys = [
  'SEA|2026-09-01|1',
  'CN|2026-09-15|2',
  'SEA|2026-09-15|2',
  'SEA|2026-10-01|1',
  'CN|2026-10-15|2',
  'SEA|2026-10-15|2',
]

for (const language of ['vi', 'en']) {
  test(`release API ${language} fixture is the authoritative 22-row response`, () => {
    const rows = fixtures[language]
    const keys = rows.map(releaseScheduleKey)

    assert.equal(rows.length, 22)
    assert.equal(new Set(keys).size, 22)
    assert.ok(expectedNewKeys.every(key => keys.includes(key)))
    assert.equal(rows.some(row => row.characterId === 'unknown'), false)
    assert.deepEqual(
      rows.find(row => releaseScheduleKey(row) === 'CN|2026-08-01|1'),
      rows.find(row => row.id === 9),
    )
    assert.equal(rows.find(row => row.id === 9).characterId, 'blacksperm-urplus')
    assert.equal(isValidReleaseScheduleResponse(rows), true)
  })
}

test('successful valid API response is returned without bundled JSON merge', async () => {
  const apiRows = fixtures.vi.map(row => ({ ...row }))
  const fallbackWithExtra = [
    ...fallback,
    {
      server: 'CN',
      date: '2099-01-01',
      sortOrder: 1,
      characterId: 'must-not-be-added',
      bannerImage: '/must-not-be-added.png',
      isReturn: false,
    },
  ]

  const result = await loadReleaseScheduleWithFallback({
    language: 'vi',
    fallbackRows: fallbackWithExtra,
    request: async () => apiRows,
  })

  assert.equal(result, apiRows)
  assert.equal(result.length, 22)
  assert.equal(result.some(row => row.characterId === 'must-not-be-added'), false)
})

test('request failure uses the bundled JSON fallback and localizes it', async () => {
  const result = await loadReleaseScheduleWithFallback({
    language: 'en',
    fallbackRows: fallback,
    request: async () => { throw new Error('offline') },
  })

  assert.equal(result.length, fallback.length)
  assert.deepEqual(result.map(releaseScheduleKey), fallback.map(releaseScheduleKey))
  assert.equal(result[0].overrideName, fallback[0].overrideNameEn)
})

test('invalid successful response fails closed to fallback instead of merging', async () => {
  const duplicateRows = [...fixtures.vi, { ...fixtures.vi[0] }]
  const result = await loadReleaseScheduleWithFallback({
    language: 'vi',
    fallbackRows: fallback,
    request: async () => duplicateRows,
  })

  assert.equal(isValidReleaseScheduleResponse(duplicateRows), false)
  assert.equal(result.length, fallback.length)
  assert.equal(new Set(result.map(releaseScheduleKey)).size, fallback.length)
})
