import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto'

const ISSUER = 'OpmWiki.Api'
const AUDIENCE = 'OpmWiki.Web'
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

const encode = (value) => Buffer.from(value).toString('base64url')
const decodeJson = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))

const signingKey = () => {
  const key = process.env.ADMINAUTH__JWTSIGNINGKEY || process.env.JWT_SIGNING_KEY
  if (!key || key.length < 32) throw new Error('ADMINAUTH__JWTSIGNINGKEY must contain at least 32 characters.')
  return key
}

const fixedTimeEquals = (left, right) => {
  const leftHash = createHmac('sha256', 'opmwiki-credential-check').update(String(left || '')).digest()
  const rightHash = createHmac('sha256', 'opmwiki-credential-check').update(String(right || '')).digest()
  return timingSafeEqual(leftHash, rightHash)
}

export const validateAdminCredentials = (username, password) => {
  const expectedUsername = process.env.ADMINAUTH__USERNAME
  const expectedPassword = process.env.ADMINAUTH__PASSWORD
  return Boolean(expectedUsername && expectedPassword) &&
    fixedTimeEquals(username, expectedUsername) &&
    fixedTimeEquals(password, expectedPassword)
}

export const createPasswordHash = (password) => {
  const iterations = 120_000
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256')
  return `v1.${iterations}.${salt.toString('base64')}.${hash.toString('base64')}`
}

export const verifyPasswordHash = (password, encoded) => {
  try {
    const [version, iterationsText, saltText, expectedText] = String(encoded || '').split('.')
    const iterations = Number(iterationsText)
    if (version !== 'v1' || !Number.isInteger(iterations) || iterations < 1) return false
    const salt = Buffer.from(saltText, 'base64')
    const expected = Buffer.from(expectedText, 'base64')
    const actual = pbkdf2Sync(password, salt, iterations, expected.length, 'sha256')
    return expected.length > 0 && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export const createAccessToken = ({
  userId,
  username,
  displayName,
  role,
  balance = 0,
}) => {
  const now = Math.floor(Date.now() / 1000)
  const lifetime = Math.min(1440, Math.max(5, Number(process.env.ADMINAUTH__TOKENLIFETIMEMINUTES || 60)))
  const expiresAtSeconds = now + lifetime * 60
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = encode(JSON.stringify({
    sub: userId,
    [ID_CLAIM]: userId,
    name: username,
    [NAME_CLAIM]: username,
    display_name: displayName,
    role,
    [ROLE_CLAIM]: role,
    jti: randomUUID().replaceAll('-', ''),
    iss: ISSUER,
    aud: AUDIENCE,
    nbf: now,
    iat: now,
    exp: expiresAtSeconds,
  }))
  const unsigned = `${header}.${payload}`
  const signature = createHmac('sha256', signingKey()).update(unsigned).digest('base64url')
  return {
    accessToken: `${unsigned}.${signature}`,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
    userId,
    username,
    displayName,
    role,
    balance: Number(balance || 0),
  }
}

export const verifyAccessToken = (token) => {
  try {
    const [headerText, payloadText, signatureText] = String(token || '').split('.')
    if (!headerText || !payloadText || !signatureText) return null
    const header = decodeJson(headerText)
    const payload = decodeJson(payloadText)
    if (header.alg !== 'HS256' || payload.iss !== ISSUER || payload.aud !== AUDIENCE) return null
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null
    const expected = createHmac('sha256', signingKey())
      .update(`${headerText}.${payloadText}`)
      .digest()
    const supplied = Buffer.from(signatureText, 'base64url')
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null
    return {
      userId: payload.sub || payload[ID_CLAIM] || '',
      username: payload.name || payload[NAME_CLAIM] || '',
      displayName: payload.display_name || payload.name || payload[NAME_CLAIM] || '',
      role: payload.role || payload[ROLE_CLAIM] || '',
    }
  } catch {
    return null
  }
}

