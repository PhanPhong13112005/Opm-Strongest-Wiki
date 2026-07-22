import assert from 'node:assert/strict'
import test from 'node:test'

import { bodyOf, routePath } from '../api/_lib/http.js'
import {
  createAccessToken,
  createPasswordHash,
  validateAdminCredentials,
  verifyAccessToken,
  verifyPasswordHash,
} from '../api/_lib/security.js'

const withAuthEnvironment = (callback) => {
  const previous = {
    username: process.env.ADMINAUTH__USERNAME,
    password: process.env.ADMINAUTH__PASSWORD,
    key: process.env.ADMINAUTH__JWTSIGNINGKEY,
  }
  process.env.ADMINAUTH__USERNAME = 'admin'
  process.env.ADMINAUTH__PASSWORD = 'strong-test-password'
  process.env.ADMINAUTH__JWTSIGNINGKEY = 'test-signing-key-with-more-than-32-characters'
  try {
    callback()
  } finally {
    if (previous.username === undefined) delete process.env.ADMINAUTH__USERNAME
    else process.env.ADMINAUTH__USERNAME = previous.username
    if (previous.password === undefined) delete process.env.ADMINAUTH__PASSWORD
    else process.env.ADMINAUTH__PASSWORD = previous.password
    if (previous.key === undefined) delete process.env.ADMINAUTH__JWTSIGNINGKEY
    else process.env.ADMINAUTH__JWTSIGNINGKEY = previous.key
  }
}

test('serverless password hashes stay compatible with the .NET PBKDF2 format', () => {
  const encoded = createPasswordHash('correct horse battery staple')
  assert.match(encoded, /^v1\.120000\.[^.]+\.[^.]+$/)
  assert.equal(verifyPasswordHash('correct horse battery staple', encoded), true)
  assert.equal(verifyPasswordHash('wrong password', encoded), false)
})

test('serverless JWT includes role and validates its signature', () => {
  withAuthEnvironment(() => {
    const result = createAccessToken({
      userId: '13fb7093-e535-4636-933f-9018dfece0a5',
      username: 'tester',
      displayName: 'Test User',
      role: 'Staff',
      balance: 12000,
    })
    const user = verifyAccessToken(result.accessToken)
    assert.equal(user.userId, '13fb7093-e535-4636-933f-9018dfece0a5')
    assert.equal(user.role, 'Staff')
    assert.equal(result.balance, 12000)
    assert.equal(verifyAccessToken(`${result.accessToken}broken`), null)
  })
})

test('admin credentials use configured secrets', () => {
  withAuthEnvironment(() => {
    assert.equal(validateAdminCredentials('admin', 'strong-test-password'), true)
    assert.equal(validateAdminCredentials('admin', 'wrong'), false)
  })
})

test('API rewrite path and request bodies are normalized', () => {
  assert.equal(routePath({ query: { path: 'forum/topics/12' }, url: '/api' }), '/forum/topics/12')
  assert.equal(routePath({ query: {}, url: '/api/auth/login' }), '/auth/login')
  assert.deepEqual(bodyOf({ body: '{"username":"tester"}' }), { username: 'tester' })
})
