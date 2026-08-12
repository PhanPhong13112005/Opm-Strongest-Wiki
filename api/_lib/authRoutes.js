import { randomUUID } from 'node:crypto'
import { ensureCommunitySchema, getSql } from './database.js'
import { bodyOf, json, methodNotAllowed, requireCurrentUser } from './http.js'
import {
  buildEmailVerificationUrl,
  buildPasswordResetUrl,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from './passwordResetEmail.js'
import {
  createAccessToken,
  createPasswordHash,
  createPasswordResetToken,
  hashPasswordResetToken,
  validateAdminCredentials,
  verifyPasswordHash,
} from './security.js'

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/
const gmailPattern = /^[a-z0-9._%+-]+@gmail\.com$/i
const normalizeGmail = (email) => {
  const local = String(email || '').trim().toLowerCase().split('@')[0]
  return `${local.split('+')[0].replaceAll('.', '')}@gmail.com`
}
const passwordResetMessage = 'Nếu Gmail tồn tại, liên kết đặt lại mật khẩu đã được gửi.'

const accountResponse = (row) => ({
  id: row.id,
  username: row.username,
  displayName: row.displayName,
  role: row.role,
  balance: Number(row.balance || 0),
  isActive: row.isActive !== false,
  emailVerified: row.emailVerified === true,
  phoneVerified: row.phoneVerified === true,
  createdAt: row.createdAt,
})

const accountLookupSelect = `SELECT "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
       "PasswordHash" AS "passwordHash", "Role" AS role, "Balance" AS balance,
       "IsActive" AS "isActive", "CreatedAt" AS "createdAt"
  FROM user_accounts`

const findAccountByIdentifier = async (sql, identifier) => {
  const value = String(identifier || '').trim()
  const normalizedEmail = gmailPattern.test(value) ? normalizeGmail(value) : ''
  const rows = await sql.query(
    `${accountLookupSelect}
      WHERE "NormalizedUsername" = $1 OR ($2 <> '' AND "NormalizedEmail" = $2)
      LIMIT 1`,
    [value.toUpperCase(), normalizedEmail],
  )
  if (rows[0] || !normalizedEmail) return rows[0]

  // Compatibility for verified accounts created before NormalizedEmail was populated.
  const legacyRows = await sql.query(
    `${accountLookupSelect}
      WHERE "EmailVerified" = true AND LOWER(BTRIM("Email")) = LOWER(BTRIM($1))
      LIMIT 1`,
    [value],
  )
  return legacyRows[0]
}

export const createAuthRouteHandler = ({
  ensureSchema = ensureCommunitySchema,
  sqlProvider = getSql,
} = {}) => async (request, response, path) => {
  if (!path.startsWith('/auth/') && !path.startsWith('/admin/users')) return false
  await ensureSchema()

  if (path === '/auth/register') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { username = '', email = '', password = '' } = bodyOf(request)
    const errors = {}
    if (!usernamePattern.test(username)) {
      errors.username = ['Tên đăng nhập phải có 3-30 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.']
    }
    if (!gmailPattern.test(String(email).trim())) {
      errors.email = ['Vui lòng sử dụng địa chỉ Gmail hợp lệ có đuôi @gmail.com.']
    }
    if (String(password).length < 8 || String(password).length > 72) {
      errors.password = ['Mật khẩu phải có 8-72 ký tự.']
    }
    if (Object.keys(errors).length) {
      return json(response, 400, { title: 'One or more validation errors occurred.', errors })
    }

    const sql = sqlProvider()
    try {
      const rows = await sql.query(
        `INSERT INTO user_accounts
          ("Id", "Username", "NormalizedUsername", "Email", "NormalizedEmail",
           "DisplayName", "PasswordHash", "Role", "Balance", "IsActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'User', 0, true)
         RETURNING "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
                   "Role" AS role, "Balance" AS balance`,
        [
          randomUUID(),
          username.trim(),
          username.trim().toUpperCase(),
          email.trim().toLowerCase(),
          normalizeGmail(email),
          username.trim(),
          createPasswordHash(password),
        ],
      )
      const account = rows[0]
      return json(response, 201, createAccessToken({
        userId: account.id,
        username: account.username,
        displayName: account.displayName,
        role: account.role,
        balance: account.balance,
      }))
    } catch (error) {
      if (error?.code === '23505') {
        return json(response, 409, { message: 'Tên đăng nhập hoặc Gmail đã được sử dụng.' })
      }
      throw error
    }
  }

  if (path === '/auth/email-verification/request') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const sql = sqlProvider()
    const user = await requireCurrentUser(request, response, sql, ['User', 'Staff'])
    if (!user) return true

    const accounts = await sql.query(
      `SELECT "Id" AS id, "Email" AS email, "EmailVerified" AS "emailVerified"
         FROM user_accounts
        WHERE "Id" = $1 AND "IsActive" = true
        LIMIT 1`,
      [user.userId],
    )
    const account = accounts[0]
    if (!account) return json(response, 401, { message: 'Tài khoản không tồn tại hoặc đã bị khóa.' })
    if (account.emailVerified) {
      return json(response, 200, { verified: true, message: 'Gmail của bạn đã được xác minh.' })
    }

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const lifetime = Math.min(60, Math.max(10, Number(process.env.EMAILVERIFICATION__TOKENLIFETIMEMINUTES || 30)))
    const updated = await sql.query(
      `UPDATE user_accounts
          SET "EmailVerificationTokenHash" = $2,
              "EmailVerificationExpiresAt" = CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute'),
              "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1
          AND "EmailVerified" = false
          AND (
            "EmailVerificationExpiresAt" IS NULL
            OR "EmailVerificationExpiresAt" < CURRENT_TIMESTAMP + (($3 - 1) * INTERVAL '1 minute')
          )
        RETURNING "Id" AS id, "Email" AS email`,
      [account.id, tokenHash, lifetime],
    )
    if (!updated[0]) {
      return json(response, 429, { message: 'Email xác minh vừa được gửi. Vui lòng chờ một phút trước khi gửi lại.' })
    }

    let verificationUrl
    try {
      verificationUrl = buildEmailVerificationUrl(request, token)
      await sendEmailVerificationEmail({
        email: updated[0].email,
        verificationUrl,
        idempotencyKey: `email-verification-${updated[0].id}-${tokenHash.slice(0, 20)}`,
        lifetimeMinutes: lifetime,
      })
    } catch (error) {
      console.error('Email verification delivery failed', { message: error?.message })
      await sql.query(
        `UPDATE user_accounts
            SET "EmailVerificationTokenHash" = NULL,
                "EmailVerificationExpiresAt" = NULL,
                "UpdatedAt" = CURRENT_TIMESTAMP
          WHERE "Id" = $1 AND "EmailVerificationTokenHash" = $2`,
        [account.id, tokenHash],
      )
      return json(response, 503, { message: 'Chưa thể gửi email xác minh. Vui lòng thử lại sau.' })
    }

    return json(response, 200, {
      verified: false,
      message: 'Đã gửi liên kết xác minh. Vui lòng kiểm tra Gmail của bạn.',
      ...(process.env.NODE_ENV !== 'production' ? { verificationUrl } : {}),
    })
  }

  if (path === '/auth/email-verification/confirm') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { token = '' } = bodyOf(request)
    if (String(token).length < 32 || String(token).length > 200) {
      return json(response, 400, { message: 'Liên kết xác minh Gmail không hợp lệ hoặc đã hết hạn.' })
    }
    const rows = await sqlProvider().query(
      `UPDATE user_accounts
          SET "EmailVerified" = true,
              "EmailVerificationTokenHash" = NULL,
              "EmailVerificationExpiresAt" = NULL,
              "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "EmailVerificationTokenHash" = $1
          AND "EmailVerificationExpiresAt" > CURRENT_TIMESTAMP
          AND "IsActive" = true
        RETURNING "Id" AS id`,
      [hashPasswordResetToken(token)],
    )
    return rows[0]
      ? json(response, 200, { verified: true, message: 'Gmail đã được xác minh thành công.' })
      : json(response, 400, { message: 'Liên kết xác minh Gmail không hợp lệ hoặc đã hết hạn.' })
  }
  if (path === '/auth/forgot-password') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { email = '' } = bodyOf(request)
    const suppliedEmail = String(email).trim().toLowerCase()
    if (!gmailPattern.test(suppliedEmail)) {
      return json(response, 400, { message: 'Vui lòng nhập địa chỉ Gmail hợp lệ.' })
    }
    const normalizedEmail = normalizeGmail(suppliedEmail)

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const lifetime = Math.min(60, Math.max(5, Number(process.env.PASSWORDRESET__TOKENLIFETIMEMINUTES || 15)))
    const rows = await sqlProvider().query(
      `UPDATE user_accounts
          SET "PasswordResetTokenHash" = $2,
              "PasswordResetExpiresAt" = CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute'),
              "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "NormalizedEmail" = $1 AND "IsActive" = true
        RETURNING "Id" AS id, "Email" AS email`,
      [normalizedEmail, tokenHash, lifetime],
    )

    let resetUrl
    if (rows[0]) {
      resetUrl = buildPasswordResetUrl(request, token)
      try {
        await sendPasswordResetEmail({
          email: rows[0].email,
          resetUrl,
          idempotencyKey: `password-reset-${rows[0].id}-${tokenHash.slice(0, 20)}`,
          lifetimeMinutes: lifetime,
        })
      } catch (error) {
        console.error('Password reset email failed', { message: error?.message })
      }
    }

    return json(response, 200, {
      message: passwordResetMessage,
      ...(process.env.NODE_ENV !== 'production' && resetUrl ? { resetUrl } : {}),
    })
  }

  if (path === '/auth/reset-password') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { token = '', password = '' } = bodyOf(request)
    if (String(token).length < 32 || String(token).length > 200) {
      return json(response, 400, { message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' })
    }
    if (String(password).length < 8 || String(password).length > 72) {
      return json(response, 400, { message: 'Mật khẩu phải có 8-72 ký tự.' })
    }

    const rows = await sqlProvider().query(
      `UPDATE user_accounts
          SET "PasswordHash" = $2,
              "PasswordResetTokenHash" = NULL,
              "PasswordResetExpiresAt" = NULL,
              "EmailVerified" = true,
              "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "PasswordResetTokenHash" = $1
          AND "PasswordResetExpiresAt" > CURRENT_TIMESTAMP
          AND "IsActive" = true
        RETURNING "Id" AS id`,
      [hashPasswordResetToken(token), createPasswordHash(password)],
    )
    return rows[0]
      ? json(response, 200, { message: 'Mật khẩu đã được cập nhật. Bạn có thể đăng nhập ngay.' })
      : json(response, 400, { message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' })
  }

  if (path === '/auth/login') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { username = '', password = '' } = bodyOf(request)
    const normalizedName = String(username).trim().toLowerCase()
    if (!normalizedName || !String(password)) {
      return json(response, 401, { message: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
    }

    const configuredAdminUsername = String(process.env.ADMINAUTH__USERNAME || 'admin').trim().toLowerCase()
    const isAdminUser = normalizedName === 'admin' || normalizedName === configuredAdminUsername

    if (isAdminUser) {
      if (validateAdminCredentials(username, password)) {
        const adminUsername = process.env.ADMINAUTH__USERNAME || username || 'admin'
        return json(response, 200, createAccessToken({
          userId: `admin:${adminUsername}`,
          username: adminUsername,
          displayName: 'Administrator',
          role: 'Admin',
        }))
      }
    }

    const account = await findAccountByIdentifier(sqlProvider(), username)
    if (!account?.isActive || !verifyPasswordHash(password, account.passwordHash)) {
      return json(response, 401, { message: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
    }
    return json(response, 200, createAccessToken({
      userId: account.id,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      balance: account.balance,
    }))
  }

  if (path === '/auth/me') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const user = await requireCurrentUser(request, response, sqlProvider())
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 200, {
        id: user.userId,
        username: user.username,
        displayName: user.displayName || 'Administrator',
        role: 'Admin',
        balance: 0,
        createdAt: new Date().toISOString(),
      })
    }
    const sql = sqlProvider()
    const rows = await sql.query(
      `SELECT "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
              "Role" AS role, "Balance" AS balance, "IsActive" AS "isActive",
              "EmailVerified" AS "emailVerified", "PhoneVerified" AS "phoneVerified",
              "CreatedAt" AS "createdAt"
         FROM user_accounts WHERE "Id" = $1 AND "IsActive" = true LIMIT 1`,
      [user.userId],
    )
    return rows[0] ? json(response, 200, accountResponse(rows[0])) : json(response, 401, { message: 'Tài khoản không tồn tại.' })
  }

  if (path === '/admin/users') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const sql = sqlProvider()
    if (!await requireCurrentUser(request, response, sql, ['Admin'])) return true
    const rows = await sql.query(
      `SELECT "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
              "Role" AS role, "Balance" AS balance, "IsActive" AS "isActive",
              "EmailVerified" AS "emailVerified", "PhoneVerified" AS "phoneVerified",
              "CreatedAt" AS "createdAt"
         FROM user_accounts ORDER BY "CreatedAt" DESC`,
    )
    return json(response, 200, rows.map(accountResponse))
  }

  const roleMatch = /^\/admin\/users\/([^/]+)\/role$/i.exec(path)
  if (roleMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const sql = sqlProvider()
    const admin = await requireCurrentUser(request, response, sql, ['Admin'])
    if (!admin) return true
    if (String(admin.userId).toLowerCase() === roleMatch[1].toLowerCase()) {
      return json(response, 409, { message: 'Bạn không thể tự thay đổi vai trò của mình.' })
    }
    const { role } = bodyOf(request)
    if (!['User', 'Staff', 'Admin'].includes(role)) {
      return json(response, 400, { message: 'Vai trò phải là User, Staff hoặc Admin.' })
    }
    const rows = await sql.query(
      `UPDATE user_accounts SET "Role" = $2, "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1
        RETURNING "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
                  "Role" AS role, "Balance" AS balance, "IsActive" AS "isActive",
              "EmailVerified" AS "emailVerified", "PhoneVerified" AS "phoneVerified",
                  "CreatedAt" AS "createdAt"`,
      [roleMatch[1], role],
    )
    return rows[0] ? json(response, 200, accountResponse(rows[0])) : json(response, 404, { message: 'Không tìm thấy tài khoản.' })
  }

  const statusMatch = /^\/admin\/users\/([^/]+)\/status$/i.exec(path)
  if (statusMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const sql = sqlProvider()
    const admin = await requireCurrentUser(request, response, sql, ['Admin'])
    if (!admin) return true
    if (String(admin.userId).toLowerCase() === statusMatch[1].toLowerCase()) {
      return json(response, 409, { message: 'Bạn không thể tự vô hiệu hóa tài khoản của mình.' })
    }
    const { isActive } = bodyOf(request)
    if (typeof isActive !== 'boolean') {
      return json(response, 400, { message: 'Trạng thái tài khoản phải là true hoặc false.' })
    }
    const rows = await sql.query(
      `UPDATE user_accounts SET "IsActive" = $2, "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1
        RETURNING "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
                  "Role" AS role, "Balance" AS balance, "IsActive" AS "isActive",
              "EmailVerified" AS "emailVerified", "PhoneVerified" AS "phoneVerified",
                  "CreatedAt" AS "createdAt"`,
      [statusMatch[1], isActive],
    )
    return rows[0]
      ? json(response, 200, accountResponse(rows[0]))
      : json(response, 404, { message: 'Không tìm thấy tài khoản.' })
  }

  return false
}

export const handleAuthRoute = createAuthRouteHandler()

