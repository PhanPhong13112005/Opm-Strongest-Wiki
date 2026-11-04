import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const root = path.resolve(import.meta.dirname, '../..')
const raw = file => fs.readFileSync(path.join(root, file))
const read = file => JSON.parse(raw(file))
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase()
const canonical = value => Array.isArray(value)
  ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object'
    ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}'
    : JSON.stringify(value)
const contract = read('tests/fixtures/owner-93-contract-transitions.json')
for (const [file, evidence] of Object.entries(contract.input_fixtures)) {
  assert.equal(sha(raw(file)), evidence.sha256, 'Independent fixture bytes: ' + file)
}
const reference = read('tests/fixtures/combined-urplus-reference.json')
const history = read('tests/fixtures/owner-exact-character-history.json')
const revision = read('tests/fixtures/urplus-image-revision.json')
const home = read('tests/fixtures/home-octnov-history-review.json')
const correction = read('tests/fixtures/homeless-return-owner-correction.json')
const baselineCache = new Map()
const display = value => value.split('-').reverse().join('/')

export function baselineCatalog(locale) {
  assert.ok(['vi', 'en'].includes(locale))
  if (!baselineCache.has(locale)) {
    const file = 'src/data/' + (locale === 'vi' ? 'characters.json' : 'characters_en.json')
    baselineCache.set(locale, JSON.parse(execFileSync('git', ['show', contract.baseline + ':' + file], {
      cwd: root, maxBuffer: 20 * 1024 * 1024,
    })))
  }
  return structuredClone(baselineCache.get(locale))
}

export function approvedHistoryFields(id) {
  const dates = history.characters[id]
  assert.ok(dates, 'Independent owner history: ' + id)
  return {
    releaseTrung: display(dates.CN.release), returnTrung: display(dates.CN.return),
    releaseSea: display(dates.SEA.release), returnSea: display(dates.SEA.return),
  }
}

export function approvedChildRecord(locale) {
  const child = structuredClone(reference.child_records[locale])
  for (const [field, expected] of Object.entries(approvedHistoryFields('100320-urplus'))) {
    assert.equal(child[field], expected, 'Child independent approved date: ' + field)
  }
  return child
}

export function assertPreservedCoreAndCommunity() {
  for (const [file, expected] of Object.entries(contract.preserved_independent_core_community.sha256)) {
    // These hashes are the original image-review guards, also checked against
    // the independent combined77 checkpoint when the portable fixture was made.
    assert.equal(expected, revision.preserved_parent_files[file], 'Original guard retained: ' + file)
    assert.equal(sha(raw(file)), expected, 'Preserved Core/Community bytes: ' + file)
  }
}

export function assertOriginal179WithApprovedChildHistory(rows, locale) {
  assert.equal(rows.length, 180)
  assert.equal(new Set(rows.map(row => row.id)).size, 180)
  const unrelated = row => !['100320-urplus', '100321-urplus'].includes(row.id)
  assert.deepEqual(rows.filter(unrelated), baselineCatalog(locale).filter(unrelated), 'All 178 baseline records')
  assert.deepEqual(rows.find(row => row.id === '100320-urplus'), approvedChildRecord(locale), 'Full approved Child record')
  const legacy179 = structuredClone(rows.filter(row => row.id !== '100321-urplus'))
  const child = legacy179.find(row => row.id === '100320-urplus')
  const changes = reference.child_history_owner_revision.filter(change => change.language === locale)
  assert.equal(changes.length, 2)
  assert.deepEqual(changes.map(change => change.field).sort(), ['returnSea', 'returnTrung'])
  for (const change of changes) {
    assert.equal(child[change.field], change.after, 'Finite Child date after')
    child[change.field] = change.before
  }
  // Reverse only the two approved date changes and retain the old canonical
  // 179-record hash. No new hash is generated from the current runtime data.
  assert.equal(sha(Buffer.from(canonical(legacy179))), revision.original_179_reference[locale], 'Original 179 guard after finite reversal')
}

export function approvedGaleWithoutIcons(locale) {
  const expected = structuredClone(revision.newcomer_without_icons[locale])
  const changes = contract.gale_exact_transitions[locale].changes
  const allowed = ['provenance.releaseSource', 'provenance.releaseStatus', 'releaseSea', 'releaseTrung', 'returnSea', 'returnTrung']
  assert.deepEqual(changes.map(change => change.field).sort(), allowed)
  for (const change of changes) {
    const keys = change.field.split('.')
    const key = keys.pop()
    const target = keys.reduce((value, field) => value[field], expected)
    assert.equal(Object.hasOwn(target, key), change.before_present, 'Finite Gale field presence: ' + change.field)
    if (change.before_present) assert.deepEqual(target[key], change.before, 'Finite Gale before: ' + change.field)
    target[key] = change.after
  }
  for (const [field, date] of Object.entries(approvedHistoryFields('100321-urplus'))) {
    assert.equal(expected[field], date, 'Gale exact independent owner date: ' + field)
  }
  assert.equal(expected.provenance.releaseStatus, 'OWNER_CONFIRMED_EXACT_DATES_2026_11_04')
  return expected
}

const identity = row => JSON.stringify([row.characterId, row.server, row.isReturn])
const changedFields = (before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])]
  .filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]))

function applyFiniteTransitions(rows, transitions, allowedIds, allowedFields) {
  const byKey = new Map()
  for (const transition of transitions) {
    assert.ok(allowedIds.includes(transition.before.characterId), 'Allowed transition character')
    assert.equal(identity(transition.before), identity(transition.after), 'Stable transition identity')
    assert.ok(!byKey.has(identity(transition.before)), 'No duplicate transition')
    assert.ok(changedFields(transition.before, transition.after).every(field => allowedFields.includes(field)), 'Finite transition fields')
    byKey.set(identity(transition.before), transition)
  }
  let applied = 0
  const result = rows.map(row => {
    const transition = byKey.get(identity(row))
    if (!transition) return structuredClone(row)
    assert.deepEqual(row, transition.before, 'Exact historical before event')
    applied++
    return structuredClone(transition.after)
  })
  assert.equal(applied, transitions.length, 'Each transition applies once')
  return result
}

export function assertScheduleTransitionChain(actual, actualBytes) {
  const oldBytes = Buffer.from(contract.schedule.legacy_raw_base64, 'base64')
  assert.equal(sha(oldBytes), revision.preserved_parent_files['src/data/releaseSchedule.json'], 'Original schedule guard retained')
  assert.equal(sha(oldBytes), contract.schedule.legacy_sha256)
  const old = JSON.parse(oldBytes)
  assert.equal(old.length, 27)
  const transitions = contract.schedule.exact_history_transitions
  assert.equal(transitions.length, 8)
  const exact = applyFiniteTransitions(old, transitions, ['100320-urplus', '100321-urplus'],
    ['date', 'sortOrder', 'yearMonth', 'datePrecision', 'confirmedOn'])
  for (const event of exact.filter(row => history.characters[row.characterId])) {
    assert.equal(event.date, history.characters[event.characterId][event.server][event.isReturn ? 'return' : 'release'], 'Independent exact owner date')
  }
  assert.deepEqual(exact, home.previousSchedule, 'Frozen exact-history snapshot')
  assert.equal(home.additions.length, 5)
  const expected92 = exact.concat(home.additions)
  const bytes92 = Buffer.from(contract.schedule.snapshot92_raw_base64, 'base64')
  assert.equal(sha(bytes92), contract.schedule.snapshot92_sha256, 'Frozen 92 raw bytes')
  assert.deepEqual(JSON.parse(bytes92), expected92, 'Old schedule -> eight date transitions -> five additions -> 92')
  assert.equal(correction.transitions.length, 2)
  assert.deepEqual(correction.transitions.map(item => item.before.server).sort(), ['CN', 'SEA'])
  assert.equal(correction.independentPublisherVerification, false)
  for (const transition of correction.transitions) {
    assert.equal(transition.before.isReturn, true)
    assert.equal(transition.after.date, transition.before.server === 'CN' ? '2026-11-15' : '2027-03-15')
  }
  const expected93 = applyFiniteTransitions(expected92, correction.transitions, ['homeless-emperor-urplus'],
    ['date', 'sortOrder', 'source', 'verificationStatus', 'status', 'confirmedOn', 'confirmationNote'])
  assert.equal(expected93.length, 32)
  assert.equal(new Set(expected93.map(row => JSON.stringify([row.server, row.date, row.sortOrder]))).size, 32)
  assert.deepEqual(actual, expected93, 'Exact 93 schedule transition chain; all other events preserved')
  if (actualBytes !== undefined) assert.equal(sha(actualBytes), contract.schedule.snapshot93_sha256, 'Frozen 93 raw bytes; EOL conversion is not waived')
}
