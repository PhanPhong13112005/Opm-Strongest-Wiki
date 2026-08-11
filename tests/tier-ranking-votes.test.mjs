import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

import { createCommunityRouteHandler, tierVoteMonthFor, tierVoteResetAt } from '../api/_lib/communityRoutes.js'
import { initializeCommunitySchema } from '../api/_lib/database.js'
import { createAccessToken } from '../api/_lib/security.js'
import { groupCharactersByBand, isCoreCharacter, RANKING_BANDS, RANKING_BASELINE_STATS, VERIFIED_MONTHLY_VOTES_PER_RARITY, baseVotesForCharacter } from '../src/data/tierRankingModel.js'

process.env.ADMINAUTH__JWTSIGNINGKEY = 'tier-ranking-tests-use-a-long-isolated-signing-key'

const database = new PGlite()
const sql = {
  query: async (statement, params = []) => (await database.query(statement, params)).rows,
}

await initializeCommunitySchema(sql)
await sql.query(
  `INSERT INTO user_accounts
     ("Id", "Username", "NormalizedUsername", "DisplayName", "PasswordHash", "Role", "IsActive")
   VALUES
     ('00000000-0000-0000-0000-000000000011', 'voter-one', 'VOTER-ONE', 'Voter One', 'test', 'User', true),
     ('00000000-0000-0000-0000-000000000012', 'voter-two', 'VOTER-TWO', 'Voter Two', 'test', 'User', true)`,
)

let currentVoteMonth = '2026-08'
const handler = createCommunityRouteHandler({
  ensureSchema: async () => {},
  sqlProvider: () => sql,
  voteMonthProvider: () => currentVoteMonth,
})

const tokenFor = (userId, username) => createAccessToken({
  userId,
  username,
  displayName: username,
  role: 'User',
}).accessToken

const tokens = {
  one: tokenFor('00000000-0000-0000-0000-000000000011', 'voter-one'),
  two: tokenFor('00000000-0000-0000-0000-000000000012', 'voter-two'),
}

const responseMock = () => ({
  statusCode: 200,
  payload: undefined,
  headers: {},
  status(code) { this.statusCode = code; return this },
  json(payload) { this.payload = payload; return this },
  end() { return this },
  setHeader(name, value) { this.headers[name] = value },
})

const invoke = async ({ path, method = 'GET', token, body }) => {
  const response = responseMock()
  const headers = token ? { authorization: 'Bearer ' + token } : {}
  await handler({ method, headers, body, query: {}, url: '/api' + path }, response, path)
  return response
}

test('Vietnam month rollover happens exactly at midnight in Asia/Ho_Chi_Minh', () => {
  assert.equal(tierVoteMonthFor(new Date('2026-08-31T16:59:59.999Z')), '2026-08')
  assert.equal(tierVoteMonthFor(new Date('2026-08-31T17:00:00.000Z')), '2026-09')
  assert.equal(tierVoteResetAt('2026-08'), '2026-08-31T17:00:00.000Z')
})

test('existing vote tables upgrade safely to the monthly primary key', async () => {
  const legacyDatabase = new PGlite()
  const legacySql = {
    query: async (statement, params = []) => (await legacyDatabase.query(statement, params)).rows,
  }
  await initializeCommunitySchema(legacySql)
  await legacySql.query('ALTER TABLE tier_ranking_votes DROP CONSTRAINT "PK_tier_ranking_votes_Monthly"')
  await legacySql.query('ALTER TABLE tier_ranking_votes ADD CONSTRAINT "PK_tier_ranking_votes" PRIMARY KEY ("UserId", "CharacterId")')
  await initializeCommunitySchema(legacySql)

  const legacyUserId = '00000000-0000-0000-0000-000000000099'
  await legacySql.query(
    'INSERT INTO user_accounts ("Id", "Username", "NormalizedUsername", "DisplayName", "PasswordHash") VALUES ($1, $2, $3, $4, $5)',
    [legacyUserId, 'legacy-voter', 'LEGACY-VOTER', 'Legacy Voter', 'test'],
  )
  await legacySql.query(
    'INSERT INTO tier_ranking_votes ("UserId", "CharacterId", "VoteMonth", "Rarity", "VoteSlot") VALUES ($1, $2, $3, $4, $5), ($1, $2, $6, $4, $5)',
    [legacyUserId, '100013-urplus', '2026-08', 'UR+', 1, '2026-09'],
  )
  const rows = await legacySql.query('SELECT "VoteMonth" AS "voteMonth" FROM tier_ranking_votes ORDER BY "VoteMonth"')
  assert.deepEqual(rows.map(row => row.voteMonth), ['2026-08', '2026-09'])
  await legacyDatabase.close()
})

test('tier votes use one shared ranking and remain idempotent per account', async () => {
  const characterId = '100013-urplus'

  let response = await invoke({ path: '/tier-rankings' })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.payload, {
    voteMonth: currentVoteMonth,
    resetsAt: tierVoteResetAt(currentVoteMonth),
    totalVotes: 0,
    totalVoters: 0,
    votes: [],
  })

  response = await invoke({
    path: '/tier-rankings/votes/' + characterId,
    method: 'PUT',
    body: { active: true },
  })
  assert.equal(response.statusCode, 401)

  response = await invoke({
    path: '/tier-rankings/votes/' + characterId,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 200)
  assert.equal(response.payload.votes, 1)
  assert.equal(response.payload.totalVoters, 1)

  response = await invoke({
    path: '/tier-rankings/votes/' + characterId,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.payload.votes, 1, 'repeating the same vote must not increment the count')

  response = await invoke({
    path: '/tier-rankings/votes/' + characterId,
    method: 'PUT',
    token: tokens.two,
    body: { active: true },
  })
  assert.equal(response.payload.votes, 2)
  assert.equal(response.payload.totalVoters, 2)

  response = await invoke({
    path: '/tier-rankings/mine',
    token: tokens.one,
  })
  assert.deepEqual(response.payload.characterIds, [characterId])

  response = await invoke({ path: '/tier-rankings' })
  assert.equal(response.payload.totalVoters, 2)
  assert.equal(response.payload.totalVotes, 2)

  response = await invoke({
    path: '/tier-rankings/votes/' + characterId,
    method: 'PUT',
    token: tokens.one,
    body: { active: false },
  })
  assert.equal(response.payload.votes, 1)
  assert.equal(response.payload.totalVotes, 1)

  response = await invoke({
    path: '/tier-rankings/votes/not-a-character',
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 400)

  response = await invoke({
    path: '/tier-rankings/votes/' + characterId,
    method: 'PUT',
    token: tokens.one,
    body: { active: 'yes' },
  })
  assert.equal(response.statusCode, 400)

  const characterCatalog = JSON.parse(fs.readFileSync(new URL('../src/data/characters.json', import.meta.url), 'utf8'))
  const urPlusIds = characterCatalog.filter(character => character.tier === 'UR+').map(character => character.id)
  const firstUnverifiedPick = urPlusIds.find(id => id !== characterId)
  response = await invoke({
    path: '/tier-rankings/votes/' + firstUnverifiedPick,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 200)
  assert.equal(response.payload.maxVotesPerRarity, 1)
  assert.equal(response.payload.hasVerifiedContact, false)

  const blockedUnverifiedPick = urPlusIds.find(id => id !== characterId && id !== firstUnverifiedPick)
  response = await invoke({
    path: '/tier-rankings/votes/' + blockedUnverifiedPick,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 409)
  assert.equal(response.payload.maxVotesPerRarity, 1)

  response = await invoke({
    path: '/tier-rankings/votes/100029-sr',
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 200, 'an unverified account still gets one pick in another rarity')

  await sql.query('UPDATE user_accounts SET "PhoneVerified" = true WHERE "Id" = $1',
    ['00000000-0000-0000-0000-000000000012'])
  response = await invoke({ path: '/tier-rankings/mine', token: tokens.two })
  assert.equal(response.payload.maxVotesPerRarity, 8, 'a verified phone independently unlocks eight picks')
  assert.equal(response.payload.hasVerifiedContact, true)
  await sql.query('UPDATE user_accounts SET "EmailVerified" = true WHERE "Id" = $1',
    ['00000000-0000-0000-0000-000000000011'])
  const remainingVerifiedPicks = urPlusIds
    .filter(id => id !== firstUnverifiedPick)
    .slice(0, 7)
  for (const id of remainingVerifiedPicks) {
    response = await invoke({
      path: '/tier-rankings/votes/' + id,
      method: 'PUT',
      token: tokens.one,
      body: { active: true },
    })
    assert.equal(response.statusCode, 200, id)
    assert.equal(response.payload.maxVotesPerRarity, 8)
    assert.equal(response.payload.hasVerifiedContact, true)
  }

  const ninthPick = urPlusIds.find(id =>
    id !== firstUnverifiedPick && !remainingVerifiedPicks.includes(id))
  response = await invoke({
    path: '/tier-rankings/votes/' + ninthPick,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 409, 'verified accounts stop at eight picks per rarity')

  currentVoteMonth = '2026-09'
  response = await invoke({
    path: '/tier-rankings/votes/' + ninthPick,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 200, 'a new month resets the rarity allowance')
  assert.equal(response.payload.voteMonth, currentVoteMonth)
  assert.equal(response.payload.resetsAt, '2026-09-30T17:00:00.000Z')

  response = await invoke({
    path: '/tier-rankings/votes/' + firstUnverifiedPick,
    method: 'PUT',
    token: tokens.one,
    body: { active: true },
  })
  assert.equal(response.statusCode, 200, 'the same character can be selected again in a new month')

  response = await invoke({ path: '/tier-rankings/mine', token: tokens.one })
  assert.deepEqual(new Set(response.payload.characterIds), new Set([ninthPick, firstUnverifiedPick]))
  assert.equal(response.payload.maxVotesPerRarity, 8)
  assert.equal(response.payload.resetsAt, '2026-09-30T17:00:00.000Z')

  const historyRows = await sql.query(
    'SELECT "VoteMonth" AS "voteMonth" FROM tier_ranking_votes WHERE "UserId" = $1 AND "CharacterId" = $2 ORDER BY "VoteMonth"',
    ['00000000-0000-0000-0000-000000000011', firstUnverifiedPick],
  )
  assert.deepEqual(historyRows.map(row => row.voteMonth), ['2026-08', '2026-09'])

  response = await invoke({ path: '/tier-rankings' })
  assert.equal(response.payload.totalVoters, 1)
  assert.equal(response.payload.totalVotes, 2, 'only votes from the new month count after rollover')
})

test('editable base votes automatically promote characters through SS-D', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/tierRankingCatalog.json', import.meta.url), 'utf8'))
  const config = JSON.parse(fs.readFileSync(new URL('../BANG_XEP_HANG_NHAN_VAT.json', import.meta.url), 'utf8'))
  const catalogById = new Map(catalog.map(character => [character.id, character]))
  const configById = new Map(config.characters.map(character => [character.id, character]))
  const configIds = config.characters.map(character => character.id)
  const configuredVoteTotal = config.characters.reduce((total, character) => total + character.baseVotes, 0)
  const maximumCharacterVotes = Math.max(...config.characters.map(character => character.baseVotes))
  const minimumParticipantsByRarity = Math.max(...['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R'].map(rarity => {
    const rarityVotes = config.characters
      .filter(character => character.rarity === rarity)
      .reduce((total, character) => total + character.baseVotes, 0)
    return Math.ceil(rarityVotes / VERIFIED_MONTHLY_VOTES_PER_RARITY)
  }))

  assert.equal(RANKING_BASELINE_STATS.totalVotes, configuredVoteTotal)
  assert.equal(RANKING_BASELINE_STATS.totalParticipants, config.sampleParticipants)
  assert.ok(config.sampleParticipants >= maximumCharacterVotes, 'sample participants cannot be lower than one character vote count')
  assert.ok(config.sampleParticipants >= minimumParticipantsByRarity, 'sample participants must cover at most eight votes per rarity for each participant')

  assert.equal(config.characters.length, catalog.length)
  assert.equal(new Set(configIds).size, configIds.length, 'config character IDs must be unique')
  assert.deepEqual(new Set(configIds), new Set(catalog.map(character => character.id)))

  for (const entry of config.characters) {
    assert.equal(typeof entry.isCore, 'boolean', entry.id + ' must declare isCore')
    assert.ok(Number.isInteger(entry.baseVotes) && entry.baseVotes >= 0, entry.id + ' has invalid baseVotes')
    assert.equal(entry.rarity, catalogById.get(entry.id)?.tier, entry.id + ' has a mismatched rarity')
  }

  for (const rarity of ['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R']) {
    const rows = catalog
      .filter(character => character.tier === rarity)
      .map(character => ({ ...character, votes: baseVotesForCharacter(character) }))
      .sort((a, b) => b.votes - a.votes || a.baseOrder - b.baseOrder || a.id.localeCompare(b.id))
    const grouped = groupCharactersByBand(rows)
    const flattened = RANKING_BANDS.flatMap(band => grouped[band])
    const coreRows = rows.filter(isCoreCharacter)
    const powerRows = rows.filter(row => !isCoreCharacter(row))

    assert.equal(flattened.length, rows.length)
    assert.equal(new Set(flattened.map(row => row.id)).size, rows.length, rarity + ' must not duplicate characters')
    assert.deepEqual(grouped.CORE.map(row => row.id), coreRows.map(row => row.id))
    assert.equal(grouped.SS[0].id, powerRows[0].id)
    assert.ok(RANKING_BANDS.slice(1).every(band => grouped[band].length > 0), rarity + ' must render all SS-D rows')

    for (const row of rows) {
      const entry = configById.get(row.id)
      assert.equal(baseVotesForCharacter(row), entry.baseVotes)
      assert.equal(isCoreCharacter(row), entry.isCore)
    }

    const promoted = { ...powerRows.at(-1), votes: powerRows[0].votes + 1000 }
    const reranked = rows
      .filter(row => row.id !== promoted.id)
      .concat(promoted)
      .sort((a, b) => b.votes - a.votes || a.baseOrder - b.baseOrder || a.id.localeCompare(b.id))
    assert.equal(groupCharactersByBand(reranked).SS[0].id, promoted.id, rarity + ' highest vote must move to SS')
  }
})
