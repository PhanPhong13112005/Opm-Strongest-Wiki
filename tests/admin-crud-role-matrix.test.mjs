import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

import { adminSeedCounts, initializeAdminSchema } from '../api/_lib/adminDatabase.js'
import { createAdminDataRouteHandler } from '../api/_lib/adminRoutes.js'
import { createCommunityRouteHandler } from '../api/_lib/communityRoutes.js'
import { initializeCommunitySchema } from '../api/_lib/database.js'
import { requireUser } from '../api/_lib/http.js'
import {
  extractSePayPaymentCode,
  processSePayWebhook,
  verifySePaySignature,
} from '../api/_lib/sepayWebhook.js'
import { createAccessToken } from '../api/_lib/security.js'

process.env.ADMINAUTH__JWTSIGNINGKEY = 'automated-role-matrix-key-with-at-least-32-characters'
process.env.BANKTRANSFER__BANKID = '970436'
process.env.BANKTRANSFER__ACCOUNTNUMBER = '1234567890'
process.env.BANKTRANSFER__ACCOUNTNAME = 'OPM WIKI TEST'
process.env.SEPAY__WEBHOOKSECRET = 'sepay-automated-test-secret-with-at-least-32-characters'

const database = new PGlite()
const sql = {
  query: async (statement, params = []) => (await database.query(statement, params)).rows,
}

let initialized
const ensureSchema = () => {
  initialized ||= initializeAdminSchema(sql)
  return initialized
}

const handler = createAdminDataRouteHandler({ ensureSchema, sqlProvider: () => sql })

let communityInitialized
const ensureCommunity = () => {
  communityInitialized ||= (async () => {
    await initializeCommunitySchema(sql)
    await sql.query(
      `INSERT INTO user_accounts
         ("Id", "Username", "NormalizedUsername", "DisplayName", "PasswordHash", "Role", "Balance", "IsActive")
       VALUES
         ('00000000-0000-0000-0000-000000000001', 'user', 'USER', 'User QA', 'test', 'User', 0, true),
         ('00000000-0000-0000-0000-000000000002', 'staff', 'STAFF', 'Staff QA', 'test', 'Staff', 0, true)
       ON CONFLICT ("Id") DO NOTHING`,
    )
  })()
  return communityInitialized
}

const communityHandler = createCommunityRouteHandler({
  ensureSchema: ensureCommunity,
  ensureContentSchema: ensureSchema,
  sqlProvider: () => sql,
})

const tokens = Object.fromEntries(['User', 'Staff', 'Admin'].map((role) => [
  role,
  createAccessToken({
    userId: `00000000-0000-0000-0000-00000000000${role === 'User' ? 1 : role === 'Staff' ? 2 : 3}`,
    username: role.toLowerCase(),
    displayName: `${role} QA`,
    role,
  }).accessToken,
]))

const responseMock = () => ({
  statusCode: 200,
  payload: undefined,
  ended: false,
  headers: {},
  status(code) { this.statusCode = code; return this },
  json(payload) { this.payload = payload; return this },
  end() { this.ended = true; return this },
  setHeader(name, value) { this.headers[name] = value },
})

const invoke = async ({ path, method = 'GET', role, body, query = {} }) => {
  const response = responseMock()
  const headers = role ? { authorization: `Bearer ${tokens[role]}` } : {}
  await handler({ method, headers, body, query, url: `/api${path}` }, response, path)
  return response
}

const invokeCommunity = async ({ path, method = 'GET', role, body, query = {} }) => {
  const response = responseMock()
  const headers = role ? { authorization: `Bearer ${tokens[role]}` } : {}
  await communityHandler({ method, headers, body, query, url: `/api${path}` }, response, path)
  return response
}

const validCharacter = {
  id: 'qa-character-urplus',
  nameVi: 'Nhân vật kiểm thử',
  nameEn: 'QA Character',
  imageUrl: '/Characters/QA/URplus.png',
  tier: 'UR+',
  typeVi: 'Tâm Linh',
  typeEn: 'Esper',
  factionVi: 'Anh Hùng',
  factionEn: 'Hero',
  rolesVi: ['Hỗ trợ'],
  rolesEn: ['Support'],
  duyenVi: 'Kiểm thử',
  duyenEn: 'Testing',
  bioVi: 'Dữ liệu tự động.',
  bioEn: 'Automated fixture.',
  keepsakeIcon: null,
  traitsVi: ['Nhanh'],
  traitsEn: ['Fast'],
  bondListVi: '',
  bondListEn: '',
  classLevel: 'S',
  releaseSea: '2026-09-01',
  releaseChina: '2026-08-01',
  baseStats: { atk: 100, hp: 1000, def: 50, spd: 90 },
  pvpStats: { atk: 200, hp: 2000, def: 100, spd: 95 },
}

const validEvent = {
  id: 'qa-event',
  titleVi: 'Sự kiện kiểm thử',
  titleEn: 'QA Event',
  descriptionVi: 'Mô tả',
  descriptionEn: 'Description',
  category: 'other',
  imageUrl: '/Event/qa.png',
  detailImages: ['/Event/qa-detail.png'],
  sectionsJson: '[{"title":"QA"}]',
  startDate: '2026-09-01',
  endDate: '2026-09-07',
}

const validRelease = {
  server: 'SEA',
  date: '2026-09-01',
  characterId: validCharacter.id,
  bannerImage: '/Characters/Full_Background/qa.png',
  isReturn: false,
  overrideNameVi: '', overrideNameEn: '', overrideTier: '',
  overrideFactionVi: '', overrideFactionEn: '', overrideTypeVi: '', overrideTypeEn: '',
  overrideRoleVi: '', overrideRoleEn: '', sortOrder: 1,
}

test('embedded PostgreSQL schema seeds the canonical wiki data', async () => {
  await ensureSchema()
  const [counts] = await sql.query(
    `SELECT (SELECT COUNT(*)::int FROM characters) AS characters,
            (SELECT COUNT(*)::int FROM character_skills) AS "characterSkills",
            (SELECT COUNT(*)::int FROM character_effects) AS "characterEffects",
            (SELECT COUNT(*)::int FROM events) AS events,
            (SELECT COUNT(*)::int FROM release_schedule) AS releases`,
  )
  assert.deepEqual(counts, adminSeedCounts)
})

test('User, Staff, and Admin authorization matrix matches the portal roles', () => {
  const request = (role) => ({ headers: { authorization: `Bearer ${tokens[role]}` } })
  for (const role of ['User', 'Staff', 'Admin']) {
    assert.equal(requireUser(request(role), responseMock())?.role, role)
  }

  const userAdminResponse = responseMock()
  assert.equal(requireUser(request('User'), userAdminResponse, ['Admin']), null)
  assert.equal(userAdminResponse.statusCode, 403)

  const staffModerationResponse = responseMock()
  assert.equal(requireUser(request('Staff'), staffModerationResponse, ['Staff', 'Admin'])?.role, 'Staff')

  const adminModerationResponse = responseMock()
  assert.equal(requireUser(request('Admin'), adminModerationResponse, ['Staff', 'Admin'])?.role, 'Admin')
})

test('only Admin can access content-management APIs', async () => {
  assert.equal((await invoke({ path: '/admin/characters' })).statusCode, 401)
  assert.equal((await invoke({ path: '/admin/characters', role: 'User' })).statusCode, 403)
  assert.equal((await invoke({ path: '/admin/characters', role: 'Staff' })).statusCode, 403)

  const admin = await invoke({ path: '/admin/characters', role: 'Admin' })
  assert.equal(admin.statusCode, 200)
  assert.equal(admin.payload.totalCount, adminSeedCounts.characters)
})

test('public character and event APIs read localized PostgreSQL data with cache headers', async () => {
  const characters = await invoke({
    path: '/characters',
    query: { language: 'en', search: 'Zombieman', page: 1, pageSize: 12, sort: 'release_desc' },
  })
  assert.equal(characters.statusCode, 200)
  assert.ok(characters.payload.totalCount >= 1)
  const zombieman = characters.payload.items.find((character) => character.id === '100013-urplus')
  assert.ok(zombieman)
  assert.equal(zombieman.type, 'Duelist')
  assert.match(characters.headers['Cache-Control'], /s-maxage=300/)

  const character = await invoke({ path: '/characters/100013-urplus', query: { language: 'vi' } })
  assert.equal(character.statusCode, 200)
  assert.equal(character.payload.type, 'Vũ Trang')
  assert.deepEqual(character.payload.baseStats, { atk: 683, hp: 4095, def: 173, spd: 118 })
  assert.ok(character.payload.skills.length > 0)
  assert.ok(character.payload.effects.length > 0)

  const events = await invoke({
    path: '/events', query: { language: 'en', category: 'main', page: 1, pageSize: 100 },
  })
  assert.equal(events.statusCode, 200)
  assert.ok(events.payload.items.length > 0)
  assert.ok(events.payload.items.every((event) => event.category === 'main'))
  assert.match(events.headers['Cache-Control'], /stale-while-revalidate=3600/)

  const event = await invoke({ path: '/events/e3', query: { language: 'en' } })
  assert.equal(event.statusCode, 200)
  assert.equal(event.payload.title, 'Limited Recruitment: UR+ Atomic Samurai')
  assert.ok(Array.isArray(event.payload.sections))
})

test('User can comment, use forum/advisor, and create a top-up request', async () => {
  const comment = await invokeCommunity({
    path: '/events/e3/comments', method: 'POST', role: 'User', body: { content: 'Bình luận QA hợp lệ.' },
  })
  assert.equal(comment.statusCode, 200)
  assert.equal(comment.payload.role, 'User')

  const topic = await invokeCommunity({
    path: '/forum/topics', method: 'POST', role: 'User',
    body: { title: 'Chủ đề QA', content: 'Trao đổi kiểm thử giữa người dùng.' },
  })
  assert.equal(topic.statusCode, 201)
  assert.equal(topic.payload.authorRole, 'User')

  const advisor = await invokeCommunity({
    path: '/advisor/ask', method: 'POST', role: 'User', body: { question: 'Zombieman UR+' },
  })
  assert.equal(advisor.statusCode, 200)
  assert.match(advisor.payload.answer, /Zombieman/i)

  const unsupportedWallet = await invokeCommunity({
    path: '/top-ups', method: 'POST', role: 'User',
    body: { provider: 'Momo', referenceCode: 'QA-TRANSACTION-001', amount: 50000 },
  })
  assert.equal(unsupportedWallet.statusCode, 400)

  const unsupportedProvider = await invokeCommunity({
    path: '/top-ups', method: 'POST', role: 'User',
    body: { provider: 'Unknown wallet', referenceCode: 'QA-INVALID-PROVIDER', amount: 50000 },
  })
  assert.equal(unsupportedProvider.statusCode, 400)

  const invalidAmount = await invokeCommunity({
    path: '/top-ups', method: 'POST', role: 'User',
    body: { provider: 'Momo', referenceCode: 'QA-INVALID-AMOUNT', amount: 55000 },
  })
  assert.equal(invalidAmount.statusCode, 400)

  const couponOrder = await invokeCommunity({
    path: '/top-ups', method: 'POST', role: 'User',
    body: { provider: 'Coupon Order', referenceCode: 'UID:3107453|SID:310170|CP:6|QTY:1|QA', amount: 13000 },
  })
  assert.equal(couponOrder.statusCode, 201)
  assert.equal(couponOrder.payload.provider, 'Coupon Order')

  const invalidCouponPrice = await invokeCommunity({
    path: '/top-ups', method: 'POST', role: 'User',
    body: { provider: 'Coupon Order', referenceCode: 'UID:3107453|SID:310170|CP:6|QTY:2|QA', amount: 13000 },
  })
  assert.equal(invalidCouponPrice.statusCode, 400)
})

test('Bank QR top-up requires login and lets the backend decide transfer details', async () => {
  assert.equal((await invokeCommunity({
    path: '/top-ups/bank-qr', method: 'POST', body: { amount: 200000 },
  })).statusCode, 401)

  const invalidAmount = await invokeCommunity({
    path: '/top-ups/bank-qr', method: 'POST', role: 'User', body: { amount: 9999 },
  })
  assert.equal(invalidAmount.statusCode, 400)

  const created = await invokeCommunity({
    path: '/top-ups/bank-qr', method: 'POST', role: 'User',
    body: {
      amount: 13000,
      provider: 'Coupon Order',
      referenceCode: 'CLIENT-MUST-NOT-CONTROL-THIS',
    },
  })
  assert.equal(created.statusCode, 201)
  assert.equal(created.payload.topUp.provider, 'Bank transfer')
  assert.equal(created.payload.topUp.amount, 13000)
  assert.match(created.payload.topUp.referenceCode, /^OPM[A-F0-9]{12}$/)
  assert.deepEqual(created.payload.bank, {
    bankId: '970436',
    accountNumber: '1234567890',
    accountName: 'OPM WIKI TEST',
  })

  const qrUrl = new URL(created.payload.qrUrl)
  assert.equal(qrUrl.origin, 'https://img.vietqr.io')
  assert.equal(qrUrl.pathname, '/image/970436-1234567890-compact2.png')
  assert.equal(qrUrl.searchParams.get('amount'), '13000')
  assert.equal(qrUrl.searchParams.get('addInfo'), created.payload.topUp.referenceCode)
  assert.equal(qrUrl.searchParams.get('accountName'), 'OPM WIKI TEST')
  assert.equal(
    new Date(created.payload.expiresAt).getTime() - new Date(created.payload.topUp.createdAt).getTime(),
    5 * 60 * 1000,
  )

  const reloaded = await invokeCommunity({
    path: `/top-ups/${created.payload.topUp.id}/bank-qr`, role: 'User',
  })
  assert.equal(reloaded.statusCode, 200)
  assert.equal(reloaded.payload.topUp.id, created.payload.topUp.id)
  assert.equal(reloaded.payload.qrUrl, created.payload.qrUrl)

  const anotherUser = await invokeCommunity({
    path: `/top-ups/${created.payload.topUp.id}/bank-qr`, role: 'Staff',
  })
  assert.equal(anotherUser.statusCode, 404)

  const cannotSelfConfirm = await invokeCommunity({
    path: `/top-ups/${created.payload.topUp.id}/bank-payment`, method: 'PUT', role: 'User',
    body: { action: 'confirm' },
  })
  assert.equal(cannotSelfConfirm.statusCode, 400)

  const cancellable = await invokeCommunity({
    path: '/top-ups/bank-qr', method: 'POST', role: 'User', body: { amount: 50000 },
  })
  const cancelled = await invokeCommunity({
    path: `/top-ups/${cancellable.payload.topUp.id}/bank-payment`, method: 'PUT', role: 'User',
    body: { action: 'cancel' },
  })
  assert.equal(cancelled.statusCode, 200)
  assert.equal(cancelled.payload.status, 'Cancelled')

  const expiring = await invokeCommunity({
    path: '/top-ups/bank-qr', method: 'POST', role: 'User', body: { amount: 100000 },
  })
  await sql.query(
    `UPDATE top_up_requests SET "CreatedAt" = CURRENT_TIMESTAMP - INTERVAL '6 minutes'
      WHERE "Id" = $1`,
    [expiring.payload.topUp.id],
  )
  const expired = await invokeCommunity({
    path: `/top-ups/${expiring.payload.topUp.id}/bank-qr`, role: 'User',
  })
  assert.equal(expired.statusCode, 200)
  assert.equal(expired.payload.topUp.status, 'Expired')
})

test('SePay HMAC webhook credits a matching bank order exactly once', async () => {
  const created = await invokeCommunity({
    path: '/top-ups/bank-qr', method: 'POST', role: 'User', body: { amount: 13000 },
  })
  const rawBody = JSON.stringify({
    id: 900001,
    gateway: 'VCB',
    transactionDate: '2026-07-27 10:00:00',
    accountNumber: process.env.BANKTRANSFER__ACCOUNTNUMBER,
    code: null,
    content: `Thanh toan ${created.payload.topUp.referenceCode} tu ung dung ngan hang`,
    transferType: 'in',
    transferAmount: 13000,
    referenceCode: 'BANK-REF-900001',
  })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = `sha256=${createHmac('sha256', process.env.SEPAY__WEBHOOKSECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')}`
  const request = {
    headers: {
      'x-sepay-timestamp': String(timestamp),
      'x-sepay-signature': signature,
    },
  }

  assert.equal(verifySePaySignature({
    rawBody,
    signature,
    timestamp,
    secret: process.env.SEPAY__WEBHOOKSECRET,
  }), true)
  assert.equal(verifySePaySignature({
    rawBody: `${rawBody} `,
    signature,
    timestamp,
    secret: process.env.SEPAY__WEBHOOKSECRET,
  }), false)
  assert.equal(
    extractSePayPaymentCode(JSON.parse(rawBody)),
    created.payload.topUp.referenceCode,
  )
  assert.equal(
    extractSePayPaymentCode({ code: null, content: `X${created.payload.topUp.referenceCode}Y` }),
    '',
  )

  const [before] = await sql.query(
    'SELECT "Balance" AS balance FROM user_accounts WHERE "Username" = $1',
    ['user'],
  )
  const processed = await processSePayWebhook({
    request,
    rawBody,
    sql,
    webhookSecret: process.env.SEPAY__WEBHOOKSECRET,
    receivingAccount: process.env.BANKTRANSFER__ACCOUNTNUMBER,
  })
  assert.equal(processed.statusCode, 200)
  assert.equal(processed.result.credited, true)

  const [paid] = await sql.query(
    `SELECT "Status" AS status, "ExternalTransactionId" AS "externalTransactionId"
       FROM top_up_requests WHERE "Id" = $1`,
    [created.payload.topUp.id],
  )
  assert.equal(paid.status, 'Paid')
  assert.equal(paid.externalTransactionId, '900001')
  const [after] = await sql.query(
    'SELECT "Balance" AS balance FROM user_accounts WHERE "Username" = $1',
    ['user'],
  )
  assert.equal(Number(after.balance), Number(before.balance) + 13000)
  assert.equal(Number((await sql.query(
    'SELECT COUNT(*) AS count FROM balance_ledger WHERE "TopUpRequestId" = $1',
    [created.payload.topUp.id],
  ))[0].count), 1)

  const replayed = await processSePayWebhook({
    request,
    rawBody,
    sql,
    webhookSecret: process.env.SEPAY__WEBHOOKSECRET,
    receivingAccount: process.env.BANKTRANSFER__ACCOUNTNUMBER,
  })
  assert.equal(replayed.statusCode, 200)
  assert.equal(replayed.result.duplicate, true)
  assert.equal(Number((await sql.query(
    'SELECT "Balance" AS balance FROM user_accounts WHERE "Username" = $1',
    ['user'],
  ))[0].balance), Number(after.balance))
})

test('Staff can moderate comments/forum but cannot access payment approval or Admin CRUD', async () => {
  const comments = await invokeCommunity({ path: '/moderation/comments', role: 'Staff' })
  assert.equal(comments.statusCode, 200)
  const comment = comments.payload.find((item) => item.content === 'Bình luận QA hợp lệ.')
  assert.ok(comment)
  assert.equal((await invokeCommunity({
    path: `/moderation/comments/${comment.id}`, method: 'DELETE', role: 'Staff',
  })).statusCode, 204)

  const topics = await invokeCommunity({ path: '/forum/topics', role: 'Staff' })
  assert.equal(topics.statusCode, 200)
  const topic = topics.payload.find((item) => item.title === 'Chủ đề QA')
  assert.ok(topic)
  assert.equal((await invokeCommunity({
    path: `/moderation/forum/topics/${topic.id}`, method: 'DELETE', role: 'Staff',
  })).statusCode, 204)

  const staffTopUps = await invokeCommunity({
    path: '/staff/top-ups', role: 'Staff', query: { status: 'Pending' },
  })
  assert.equal(staffTopUps.statusCode, 403)

  const adminTopUps = await invokeCommunity({
    path: '/staff/top-ups', role: 'Admin', query: { status: 'Pending' },
  })
  assert.equal(adminTopUps.statusCode, 200)
  assert.ok(adminTopUps.payload.every((item) => item.provider === 'Coupon Order'))
  const [bank] = await sql.query(
    `SELECT "Id" AS id FROM top_up_requests
      WHERE "Provider" = 'Bank transfer' AND "Status" = 'Pending' LIMIT 1`,
  )
  assert.ok(bank)
  assert.equal((await invokeCommunity({
    path: `/staff/top-ups/${bank.id}/review`, method: 'PUT', role: 'Admin',
    body: { status: 'Approved', staffNote: 'Đã xác nhận giao dịch QA.' },
  })).statusCode, 409)

  const coupon = adminTopUps.payload.find((item) => item.provider === 'Coupon Order')
  assert.ok(coupon)
  assert.equal((await invokeCommunity({
    path: `/staff/top-ups/${coupon.id}/review`, method: 'PUT', role: 'Admin',
    body: { status: 'Approved', staffNote: 'Đã nạp Coupon vào UID.' },
  })).statusCode, 200)
  assert.equal((await invoke({ path: '/admin/events', role: 'Staff' })).statusCode, 403)
})

test('Admin dashboard reports live PostgreSQL counts', async () => {
  const dashboard = await invokeCommunity({ path: '/admin/dashboard', role: 'Admin' })
  assert.equal(dashboard.statusCode, 200)
  assert.equal(dashboard.payload.characters, adminSeedCounts.characters)
  assert.equal(dashboard.payload.events, adminSeedCounts.events)
  assert.equal(dashboard.payload.releaseEntries, adminSeedCounts.releases)
  assert.equal(dashboard.payload.users, 1)
  assert.equal(dashboard.payload.staff, 1)
})

test('Admin character and keepsake CRUD preserves the frontend contract', async () => {
  const created = await invoke({ path: '/admin/characters', method: 'POST', role: 'Admin', body: validCharacter })
  assert.equal(created.statusCode, 201)
  assert.equal(created.payload.nameEn, 'QA Character')
  assert.deepEqual(created.payload.baseStats, validCharacter.baseStats)

  const searched = await invoke({
    path: '/admin/characters', role: 'Admin', query: { search: 'qa-character', page: 1, pageSize: 20 },
  })
  assert.equal(searched.payload.totalCount, 1)

  const updated = await invoke({
    path: `/admin/characters/${validCharacter.id}`, method: 'PUT', role: 'Admin',
    body: { ...validCharacter, nameVi: 'Nhân vật đã sửa' },
  })
  assert.equal(updated.statusCode, 200)
  assert.equal(updated.payload.nameVi, 'Nhân vật đã sửa')

  const publicUpdatedCharacter = await invoke({
    path: `/characters/${validCharacter.id}`, query: { language: 'vi' },
  })
  assert.equal(publicUpdatedCharacter.statusCode, 200)
  assert.equal(publicUpdatedCharacter.payload.name, updated.payload.nameVi)

  const keepsake = await invoke({
    path: `/admin/keepsakes/${validCharacter.id}`, method: 'PUT', role: 'Admin',
    body: { iconUrl: '/Keepsake/QA/SSRplus.png' },
  })
  assert.equal(keepsake.statusCode, 200)
  assert.equal(keepsake.payload.keepsakeIcon, '/Keepsake/QA/SSRplus.png')

  assert.equal((await invoke({
    path: `/admin/keepsakes/${validCharacter.id}`, method: 'DELETE', role: 'Admin',
  })).statusCode, 204)
  assert.equal((await invoke({
    path: `/admin/characters/${validCharacter.id}`, method: 'DELETE', role: 'Admin',
  })).statusCode, 204)
})

test('Admin event CRUD validates JSON and dates', async () => {
  const invalid = await invoke({
    path: '/admin/events', method: 'POST', role: 'Admin',
    body: { ...validEvent, id: 'invalid/event', sectionsJson: '{', endDate: '2026-08-31' },
  })
  assert.equal(invalid.statusCode, 400)
  assert.ok(invalid.payload.errors.id)
  assert.ok(invalid.payload.errors.sectionsJson)
  assert.ok(invalid.payload.errors.date)

  const created = await invoke({ path: '/admin/events', method: 'POST', role: 'Admin', body: validEvent })
  assert.equal(created.statusCode, 201)
  assert.equal(created.payload.sectionsJson, validEvent.sectionsJson)

  const updated = await invoke({
    path: `/admin/events/${validEvent.id}`, method: 'PUT', role: 'Admin',
    body: { ...validEvent, titleEn: 'Updated QA Event' },
  })
  assert.equal(updated.statusCode, 200)
  assert.equal(updated.payload.titleEn, 'Updated QA Event')
  const publicUpdatedEvent = await invoke({ path: `/events/${validEvent.id}`, query: { language: 'en' } })
  assert.equal(publicUpdatedEvent.statusCode, 200)
  assert.equal(publicUpdatedEvent.payload.title, 'Updated QA Event')
  assert.equal((await invoke({
    path: `/admin/events/${validEvent.id}`, method: 'DELETE', role: 'Admin',
  })).statusCode, 204)
})

test('release schedule CRUD is public-read/admin-write and bilingual', async () => {
  const publicList = await invoke({ path: '/release-schedule', query: { language: 'en' } })
  assert.equal(publicList.statusCode, 200)
  assert.equal(publicList.payload.length, adminSeedCounts.releases)
  const mystery = publicList.payload.find((item) => item.characterId === 'unknown')
  assert.equal(mystery.overrideName, 'Mystery Character')

  assert.equal((await invoke({ path: '/admin/releases', method: 'POST', role: 'Staff', body: validRelease })).statusCode, 403)
  const created = await invoke({ path: '/admin/releases', method: 'POST', role: 'Admin', body: validRelease })
  assert.equal(created.statusCode, 201)
  assert.equal(created.payload.server, 'SEA')

  const updated = await invoke({
    path: `/admin/releases/${created.payload.id}`, method: 'PUT', role: 'Admin',
    body: { ...validRelease, isReturn: true, overrideNameVi: 'Nhân vật QA' },
  })
  assert.equal(updated.statusCode, 200)
  assert.equal(updated.payload.isReturn, true)
  assert.equal(updated.payload.overrideName, 'Nhân vật QA')
  assert.equal((await invoke({
    path: `/admin/releases/${created.payload.id}`, method: 'DELETE', role: 'Admin',
  })).statusCode, 204)
})

test.after(async () => {
  await database.close()
})
