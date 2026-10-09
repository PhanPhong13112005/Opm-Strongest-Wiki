import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { getCharacterReleaseDates } from '../src/utils/characterReleaseDates.js'

const read = file => JSON.parse(fs.readFileSync(new URL('../' + file, import.meta.url)))
const id = '100320-urplus'
const schedule = read('src/data/releaseSchedule.json')
const vi = read('src/data/characters.json')
const en = read('src/data/characters_en.json')
const expected = [
  ['CN', '2026-10-01', false], ['CN', '2026-12-01', true],
  ['SEA', '2027-02-01', false], ['SEA', '2027-04-01', true],
]
const validate = (rows, ids) => {
  const keys = new Set(), events = new Set(), errors = []
  for (const row of rows) {
    if (!ids.has(row.characterId)) errors.push('characterId')
    if (!['CN','SEA'].includes(row.server)) errors.push('server')
    const date = new Date(`${row.date}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0,10) !== row.date) errors.push('date')
    if (typeof row.isReturn !== 'boolean' || !Number.isInteger(row.sortOrder)) errors.push('event')
    const key = `${row.server}|${row.date}|${row.sortOrder}`
    const event = `${row.characterId}|${row.server}|${row.date}|${row.isReturn}`
    if (keys.has(key) || events.has(event)) errors.push('duplicate')
    keys.add(key); events.add(event)
  }
  return errors
}

test('history own-property checks work without Object.hasOwn, including null prototypes and shadowed methods', () => {
  // A separate process prevents changing built-ins in other test cases.
  const script = `
    import assert from 'node:assert/strict';
    import { getCharacterReleaseDates as dates } from ${JSON.stringify(new URL('../src/utils/characterReleaseDates.js', import.meta.url).href)};
    Object.hasOwn = undefined;
    const base = { id: 'reference', releaseTrung: '01/10/2026', releaseSea: '01/02/2027' };
    const expected = { trungRelease: '01/10/2026', trungReturn: '15/12/2026', seaRelease: '01/02/2027', seaReturn: '15/04/2027' };
    assert.deepEqual(dates(base), expected);
    assert.deepEqual(dates(Object.assign(Object.create(null), base)), expected);
    assert.deepEqual(dates(Object.assign(Object.create({ returnTrung: 'inherited', returnSea: 'inherited' }), base)), expected);
    for (const object of [{ ...base, returnTrung: '01/12/2026', returnSea: null }, Object.assign(Object.create(null), base, { returnTrung: '01/12/2026', returnSea: null }), { ...base, hasOwnProperty: null, returnTrung: '01/12/2026', returnSea: null }]) {
      assert.deepEqual(dates(object, [], 'Updating'), { ...expected, trungReturn: '01/12/2026', seaReturn: 'Updating' });
    }
    for (const object of [null, undefined, {}, Object.create(null), false, 0, 1, '', 'unexpected', []]) assert.equal(dates(object), null);
    assert.throws(() => dates({ releaseTrung: 42 }), TypeError); // Preserve the existing malformed-field contract.
    console.log('NO_OBJECT_HASOWN_PASS');
  `
  assert.match(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' }), /NO_OBJECT_HASOWN_PASS/)
})

test('canonical release history has valid stable IDs, real ISO dates, servers and unique events', () => {
  assert.deepEqual(validate(schedule,new Set(vi.map(row=>row.id))),[])
  for (const [change,error] of [
    [{characterId:'missing'},'characterId'], [{server:'INVALID'},'server'],
    [{date:'2027-02-30'},'date'], [{date:'01/04/2027'},'date'],
  ]) assert.ok(validate([{...schedule[0],...change}],new Set(vi.map(row=>row.id))).includes(error))
  assert.ok(validate([schedule[0],schedule[0]],new Set(vi.map(row=>row.id))).includes('duplicate'))
})

test('Child four owner-supplied history events remain canonical and consistent across VI/EN payloads', () => {
  const childEvents = schedule.filter(row=>row.characterId===id)
  assert.deepEqual(childEvents.map(row=>[row.server,row.date,row.isReturn]),expected)
  assert.ok(childEvents.every(row=>row.source==='owner' && row.verificationStatus==='owner-confirmed' && row.status==='planned'))
  const dates = {trungRelease:'01/10/2026',trungReturn:'01/12/2026',seaRelease:'01/02/2027',seaReturn:'01/04/2027'}
  for (const [language,catalog] of [['vi',vi],['en',en]]) {
    for (const character of [catalog.find(row=>row.id===id),read(`public/character-details/${language}/${id}.json`)]) {
      assert.deepEqual(getCharacterReleaseDates(character,schedule),dates)
      assert.equal(character.returnSea,dates.seaReturn)
    }
  }
  assert.deepEqual(getCharacterReleaseDates({id},childEvents),dates)
})

test('Home merge retains four history events exactly once including API duplicates', () => {
  const source = fs.readFileSync(new URL('../src/services/releaseScheduleApi.js',import.meta.url),'utf8')
  const implementation = source.replace(/^import .*$/gm,'').split('export const getReleaseSchedule')[0]
  const merge = new Function('fallbackSchedule',implementation+'\nreturn mergeReleaseSchedule')(schedule)
  for (const language of ['vi','en']) {
    const api = schedule.map(row=>({...row}))
    const result = merge(api,language)
    assert.equal(result.length,schedule.length)
    assert.deepEqual(result.filter(row=>row.characterId===id).map(row=>[row.server,row.date,row.isReturn]),expected)
    assert.deepEqual(validate(result,new Set(vi.map(row=>row.id))),[])
  }
  const detail = fs.readFileSync(new URL('../src/views/DetailView.vue',import.meta.url),'utf8')
  const home = fs.readFileSync(new URL('../src/views/HomeView.vue',import.meta.url),'utf8')
  assert.match(detail,/getCharacterReleaseDates/)
  assert.match(detail,/detail\.ownerScheduleNote/)
  assert.match(home,/row\.isReturn/)
  assert.match(home,/home\.planned/)
  for (const language of ['vi','en']) {
    const locale=read(`src/locales/${language}.json`)
    assert.ok(locale.detail.ownerScheduleNote && locale.home.planned)
  }
})

test('bundled Home schedule is synchronously localized and remote success preserves API precedence', async () => {
  const source = fs.readFileSync(new URL('../src/services/releaseScheduleApi.js', import.meta.url), 'utf8')
    .replace(/^import .*$/gm, '').replace(/export const /g, 'const ')
  const create = request => new Function('fallbackSchedule', 'requestApiCached', source + '\nreturn { getBundledReleaseSchedule, getReleaseSchedule }')(schedule, request)
  for (const language of ['vi', 'en']) {
    const fail = create(async () => { throw new Error('simulated unavailable API') })
    const immediate = fail.getBundledReleaseSchedule(language)
    assert.equal(immediate.length, schedule.length)
    assert.equal(immediate.filter(row => row.characterId === id).length, 4)
    assert.equal(new Set(immediate.map(row => `${row.server}|${row.date}|${row.sortOrder}`)).size, immediate.length)
    assert.equal(immediate[0].overrideName, language === 'vi' ? schedule[0].overrideNameVi : schedule[0].overrideNameEn)
    assert.deepEqual(await fail.getReleaseSchedule(language), immediate)
    const remoteRows = schedule.filter(row => row.characterId !== id).map(row => ({ ...row, overrideName: 'Approved API display name' }))
    const remote = await create(async () => remoteRows).getReleaseSchedule(language)
    assert.equal(remote.length, schedule.length)
    assert.equal(remote[0].overrideName, 'Approved API display name')
    assert.equal(remote.filter(row => row.characterId === id).length, 4)
  }
  const home = fs.readFileSync(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8')
  assert.match(home, /releaseScheduleRows\.value = getBundledReleaseSchedule\(locale\.value\)[\s\S]*await getReleaseSchedule/)
  assert.match(home, /requestId === activeScheduleRequest/)
})
