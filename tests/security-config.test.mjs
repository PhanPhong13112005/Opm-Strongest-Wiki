import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createAccessToken,
  validateAdminCredentials,
} from '../api/_lib/security.js'
import {
  getDotnetEnvironmentChecklist,
  getNodeConfigurationChecklist,
} from '../api/_lib/runtimeConfig.js'

const withEnvironment = (overrides, action) => {
  const names = Object.keys(overrides)
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]))

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }

  try {
    return action()
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]
      else process.env[name] = previous[name]
    }
  }
}

test('production Node authentication fails closed when explicit secrets are missing', { concurrency: false }, () => {
  withEnvironment({
    NODE_ENV: 'production',
    VERCEL_ENV: undefined,
    ADMINAUTH__JWTSIGNINGKEY: undefined,
    JWT_SIGNING_KEY: undefined,
    ADMINAUTH__USERNAME: undefined,
    ADMINAUTH__PASSWORD: undefined,
  }, () => {
    assert.throws(() => createAccessToken({ subject: 'test', role: 'Admin' }), /JWTSIGNINGKEY/)
    assert.throws(() => validateAdminCredentials('candidate', 'candidate'), /USERNAME.*PASSWORD/)
  })
})

test('production Node authentication accepts explicitly configured test credentials', { concurrency: false }, () => {
  withEnvironment({
    NODE_ENV: 'production',
    VERCEL_ENV: undefined,
    ADMINAUTH__JWTSIGNINGKEY: 'test-only-signing-key-that-is-long-enough',
    ADMINAUTH__USERNAME: 'test-admin',
    ADMINAUTH__PASSWORD: 'test-password',
  }, () => {
    assert.equal(validateAdminCredentials('test-admin', 'test-password'), true)
    assert.equal(validateAdminCredentials('test-admin', 'wrong'), false)
    const result = createAccessToken({ subject: 'test', role: 'Admin' })
    assert.match(result.accessToken, /^[^.]+\.[^.]+\.[^.]+$/)
  })
})

test('configuration checklist exposes names and status but never environment values', () => {
  const marker = 'must-not-appear-in-checklist-output'
  const environment = {
    DATABASE_URL: `postgresql://${marker}`,
    ADMINAUTH__JWTSIGNINGKEY: marker.repeat(2),
    ADMINAUTH__USERNAME: marker,
    ADMINAUTH__PASSWORD: marker,
    PUBLIC_APP_URL: `https://${marker}.invalid`,
    ConnectionStrings__OpmWiki: `Host=${marker}`,
  }

  const serialized = JSON.stringify([
    getNodeConfigurationChecklist(environment),
    getDotnetEnvironmentChecklist(environment),
  ])

  assert.equal(serialized.includes(marker), false)
  assert.match(serialized, /DATABASE_URL/)
  assert.match(serialized, /ConnectionStrings__OpmWiki/)
})
