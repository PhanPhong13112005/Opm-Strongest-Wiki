import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import { tierVoteMonthFor, tierVoteResetAt } from '../api/_lib/communityRoutes.js'

const fixture = JSON.parse(fs.readFileSync(
  new URL('../contracts/phase2-api-contract.json', import.meta.url), 'utf8'))
const communityApi = fs.readFileSync(new URL('../src/services/communityApi.js', import.meta.url), 'utf8')
const authApi = fs.readFileSync(new URL('../src/services/authApi.js', import.meta.url), 'utf8')
const adminApi = fs.readFileSync(new URL('../src/services/adminApi.js', import.meta.url), 'utf8')
const tierController = fs.readFileSync(
  new URL('../backend/src/OpmWiki.Api/Controllers/TierRankingsController.cs', import.meta.url), 'utf8')
const emailController = fs.readFileSync(
  new URL('../backend/src/OpmWiki.Api/Controllers/EmailVerificationController.cs', import.meta.url), 'utf8')
const adminTierController = fs.readFileSync(
  new URL('../backend/src/OpmWiki.Api/Controllers/AdminTierRankingController.cs', import.meta.url), 'utf8')
const adminCommunityController = fs.readFileSync(
  new URL('../backend/src/OpmWiki.Api/Controllers/AdminCommunityController.cs', import.meta.url), 'utf8')

test('Node and ASP.NET share the frozen Vietnam month and quota semantics', () => {
  assert.equal(fixture.timeZone, 'Asia/Ho_Chi_Minh')
  assert.deepEqual(fixture.eligibleRarities, ['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R'])
  assert.deepEqual(fixture.quota, { unverified: 1, verified: 8 })
  assert.equal(tierVoteMonthFor(new Date('2026-08-31T16:59:59.999Z')), '2026-08')
  assert.equal(tierVoteMonthFor(new Date('2026-08-31T17:00:00.000Z')), '2026-09')
  assert.equal(tierVoteResetAt('2026-09'), '2026-09-30T17:00:00.000Z')
})

test('frontend and ASP.NET expose every frozen Phase 2 route without split routing', () => {
  for (const route of ['tierPublic', 'tierMine', 'tierVote']) {
    const servicePath = fixture.routes[route].replace('/api/', 'api/').replace('/{characterId}', '')
    assert.ok(communityApi.includes(servicePath), route)
  }
  assert.match(tierController, /\[Route\("api\/tier-rankings"\)\]/)
  assert.match(authApi, /api\/auth\/email-verification\/request/)
  assert.match(authApi, /api\/auth\/email-verification\/confirm/)
  assert.match(emailController, /\[Route\("api\/auth\/email-verification"\)\]/)
  assert.match(adminTierController, /\[Route\("api\/admin\/tier-ranking"\)\]/)
  assert.match(adminCommunityController, /\[Route\("api\/admin\/community"\)\]/)
  assert.match(adminApi, /expectedVersion/)
  assert.match(adminApi, /'If-Match'/)
})

test('verification implementations preserve hashed one-time token semantics', () => {
  const nodeAuth = fs.readFileSync(new URL('../api/_lib/authRoutes.js', import.meta.url), 'utf8')
  const nodeSecurity = fs.readFileSync(new URL('../api/_lib/security.js', import.meta.url), 'utf8')
  const dotnetTokens = fs.readFileSync(
    new URL('../backend/src/OpmWiki.Application/EmailVerification/EmailVerificationTokens.cs', import.meta.url), 'utf8')
  const dotnetRepository = fs.readFileSync(
    new URL('../backend/src/OpmWiki.Infrastructure/Repositories/PostgresEmailVerificationRepository.cs', import.meta.url), 'utf8')

  assert.equal(fixture.verification.tokenBytes, 32)
  assert.equal(fixture.verification.hash, 'SHA-256')
  assert.match(nodeSecurity, /randomBytes\(32\)/)
  assert.match(nodeSecurity, /sha256/)
  assert.match(nodeAuth, /hashPasswordResetToken\(token\)/)
  assert.match(dotnetTokens, /RandomNumberGenerator\.GetBytes\(32\)/)
  assert.match(dotnetTokens, /SHA256\.HashData/)
  assert.match(dotnetRepository, /"EmailVerificationTokenHash" = NULL/)
  assert.doesNotMatch(dotnetRepository, /SET\s+"EmailVerificationTokenHash"\s*=\s*@token\b/)
})
