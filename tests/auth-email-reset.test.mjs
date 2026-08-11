import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

import { createAuthRouteHandler } from '../api/_lib/authRoutes.js'
import { initializeCommunitySchema } from '../api/_lib/database.js'

process.env.NODE_ENV = 'test'
process.env.PUBLIC_APP_URL = 'http://localhost:5173'
process.env.ADMINAUTH__JWTSIGNINGKEY = 'auth-email-test-signing-key-with-at-least-32-characters'

const database = new PGlite()
const sql = {
  query: async (statement, params = []) => (await database.query(statement, params)).rows,
}

let initialized
const ensureSchema = () => {
  initialized ||= initializeCommunitySchema(sql)
  return initialized
}

const handler = createAuthRouteHandler({
  ensureSchema,
  sqlProvider: () => sql,
})

const responseMock = () => ({
  statusCode: 200,
  payload: undefined,
  headers: {},
  status(code) { this.statusCode = code; return this },
  json(payload) { this.payload = payload; return this },
  end() { return this },
  setHeader(name, value) { this.headers[name] = value },
})

const invoke = async (path, body, { token = '', method = 'POST' } = {}) => {
  const response = responseMock()
  await handler({
    method,
    headers: {
      host: 'localhost:5173',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body,
    query: {},
    url: `/api${path}`,
  }, response, path)
  return response
}

test('registration requires a unique Gmail and login accepts Gmail', async () => {
  const invalid = await invoke('/auth/register', {
    username: 'email-user-invalid',
    email: 'user@example.com',
    password: 'initial-password',
  })
  assert.equal(invalid.statusCode, 400)
  assert.ok(invalid.payload.errors.email)

  const registered = await invoke('/auth/register', {
    username: 'email-user',
    email: 'Email.User@gmail.com',
    displayName: 'Email User',
    password: 'initial-password',
  })
  assert.equal(registered.statusCode, 201)
  assert.equal(registered.payload.username, 'email-user')
  assert.equal(registered.payload.displayName, 'email-user')
  assert.equal(registered.payload.role, 'User')

  const duplicate = await invoke('/auth/register', {
    username: 'another-user',
    email: 'emailuser+another@gmail.com',
    password: 'initial-password',
  })
  assert.equal(duplicate.statusCode, 409)

  const login = await invoke('/auth/login', {
    username: 'email.user@gmail.com',
    password: 'initial-password',
  })
  assert.equal(login.statusCode, 200)
  assert.equal(login.payload.username, 'email-user')
})

test('email verification uses a hashed expiring one-time token', async () => {
  const registered = await invoke('/auth/register', {
    username: 'verification-user',
    email: 'verification.user@gmail.com',
    password: 'initial-password',
  })
  assert.equal(registered.statusCode, 201)

  const requested = await invoke('/auth/email-verification/request', {}, {
    token: registered.payload.accessToken,
  })
  assert.equal(requested.statusCode, 200)
  assert.equal(requested.payload.verified, false)
  assert.match(requested.payload.verificationUrl, /^http:\/\/localhost:5173\/verify-email\?token=/)

  const token = new URL(requested.payload.verificationUrl).searchParams.get('token')
  const [stored] = await sql.query(
    `SELECT "EmailVerificationTokenHash" AS hash,
            "EmailVerificationExpiresAt" AS "expiresAt",
            "EmailVerified" AS "emailVerified"
       FROM user_accounts WHERE "NormalizedEmail" = $1`,
    ['verificationuser@gmail.com'],
  )
  assert.ok(stored.hash)
  assert.notEqual(stored.hash, token)
  assert.ok(stored.expiresAt)
  assert.equal(stored.emailVerified, false)

  const throttled = await invoke('/auth/email-verification/request', {}, {
    token: registered.payload.accessToken,
  })
  assert.equal(throttled.statusCode, 429)

  const confirmed = await invoke('/auth/email-verification/confirm', { token })
  assert.equal(confirmed.statusCode, 200)
  assert.equal(confirmed.payload.verified, true)

  const [verified] = await sql.query(
    `SELECT "EmailVerified" AS "emailVerified",
            "EmailVerificationTokenHash" AS hash,
            "EmailVerificationExpiresAt" AS "expiresAt"
       FROM user_accounts WHERE "NormalizedEmail" = $1`,
    ['verificationuser@gmail.com'],
  )
  assert.equal(verified.emailVerified, true)
  assert.equal(verified.hash, null)
  assert.equal(verified.expiresAt, null)

  const replay = await invoke('/auth/email-verification/confirm', { token })
  assert.equal(replay.statusCode, 400)

  const requestedAgain = await invoke('/auth/email-verification/request', {}, {
    token: registered.payload.accessToken,
  })
  assert.equal(requestedAgain.statusCode, 200)
  assert.equal(requestedAgain.payload.verified, true)
})
test('password reset token is hashed, expires and can only be used once', async () => {
  const forgot = await invoke('/auth/forgot-password', { email: 'email.user@gmail.com' })
  assert.equal(forgot.statusCode, 200)
  assert.match(forgot.payload.message, /Nếu Gmail tồn tại/)
  assert.match(forgot.payload.resetUrl, /^http:\/\/localhost:5173\/reset-password\?token=/)

  const token = new URL(forgot.payload.resetUrl).searchParams.get('token')
  assert.ok(token)
  const [stored] = await sql.query(
    `SELECT "PasswordResetTokenHash" AS hash FROM user_accounts WHERE "NormalizedEmail" = $1`,
    ['emailuser@gmail.com'],
  )
  assert.ok(stored.hash)
  assert.notEqual(stored.hash, token)

  const reset = await invoke('/auth/reset-password', {
    token,
    password: 'replacement-password',
  })
  assert.equal(reset.statusCode, 200)
  const [verifiedAccount] = await sql.query(
    `SELECT "EmailVerified" AS "emailVerified" FROM user_accounts WHERE "NormalizedEmail" = $1`,
    ['emailuser@gmail.com'],
  )
  assert.equal(verifiedAccount.emailVerified, true, 'using the emailed token verifies Gmail ownership')


  const replay = await invoke('/auth/reset-password', {
    token,
    password: 'another-password',
  })
  assert.equal(replay.statusCode, 400)

  const oldLogin = await invoke('/auth/login', {
    username: 'email-user',
    password: 'initial-password',
  })
  assert.equal(oldLogin.statusCode, 401)

  const newLogin = await invoke('/auth/login', {
    username: 'email-user',
    password: 'replacement-password',
  })
  assert.equal(newLogin.statusCode, 200)
})

test('forgot password response does not reveal unknown Gmail accounts', async () => {
  const unknown = await invoke('/auth/forgot-password', { email: 'unknown.account@gmail.com' })
  assert.equal(unknown.statusCode, 200)
  assert.match(unknown.payload.message, /Nếu Gmail tồn tại/)
  assert.equal(unknown.payload.resetUrl, undefined)
})
