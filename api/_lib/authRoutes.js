import { randomUUID } from 'node:crypto'
import { ensureCommunitySchema, getSql } from './database.js'
import { bodyOf, json, methodNotAllowed, requireUser } from './http.js'
import {
  createAccessToken,
  createPasswordHash,
  validateAdminCredentials,
  verifyPasswordHash,
} from './security.js'

const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/

const accountResponse = (row) => ({
  id: row.id,
  username: row.username,
  displayName: row.displayName,
  role: row.role,
  balance: Number(row.balance || 0),
  createdAt: row.createdAt,
})

const findAccountByUsername = async (username) => {
  const sql = getSql()
  const rows = await sql.query(
    `SELECT "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
            "PasswordHash" AS "passwordHash", "Role" AS role, "Balance" AS balance,
            "IsActive" AS "isActive", "CreatedAt" AS "createdAt"
       FROM user_accounts
      WHERE "NormalizedUsername" = $1
      LIMIT 1`,
    [String(username || '').trim().toUpperCase()],
  )
  return rows[0]
}

export const handleAuthRoute = async (request, response, path) => {
  if (!path.startsWith('/auth/') && !path.startsWith('/admin/users')) return false
  await ensureCommunitySchema()

  if (path === '/auth/register') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { username = '', displayName = '', password = '' } = bodyOf(request)
    const errors = {}
    if (!usernamePattern.test(username)) {
      errors.username = ['Tên đăng nhập phải có 3-30 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.']
    }
    if (String(displayName).trim().length < 2 || String(displayName).trim().length > 60) {
      errors.displayName = ['Tên hiển thị phải có 2-60 ký tự.']
    }
    if (String(password).length < 8 || String(password).length > 72) {
      errors.password = ['Mật khẩu phải có 8-72 ký tự.']
    }
    if (Object.keys(errors).length) {
      return json(response, 400, { title: 'One or more validation errors occurred.', errors })
    }

    const sql = getSql()
    try {
      const rows = await sql.query(
        `INSERT INTO user_accounts
          ("Id", "Username", "NormalizedUsername", "DisplayName", "PasswordHash", "Role", "Balance", "IsActive")
         VALUES ($1, $2, $3, $4, $5, 'User', 0, true)
         RETURNING "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
                   "Role" AS role, "Balance" AS balance`,
        [randomUUID(), username.trim(), username.trim().toUpperCase(), displayName.trim(), createPasswordHash(password)],
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
        return json(response, 409, { message: 'Tên đăng nhập đã được sử dụng.' })
      }
      throw error
    }
  }

  if (path === '/auth/login') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const { username = '', password = '' } = bodyOf(request)
    if (!String(username).trim() || !String(password)) {
      return json(response, 401, { message: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
    }

    if (validateAdminCredentials(username, password)) {
      const adminUsername = process.env.ADMINAUTH__USERNAME
      return json(response, 200, createAccessToken({
        userId: `admin:${adminUsername}`,
        username: adminUsername,
        displayName: 'Administrator',
        role: 'Admin',
      }))
    }

    const account = await findAccountByUsername(username)
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
    const user = requireUser(request, response)
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
    const sql = getSql()
    const rows = await sql.query(
      `SELECT "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
              "Role" AS role, "Balance" AS balance, "CreatedAt" AS "createdAt"
         FROM user_accounts WHERE "Id" = $1 AND "IsActive" = true LIMIT 1`,
      [user.userId],
    )
    return rows[0] ? json(response, 200, accountResponse(rows[0])) : json(response, 401, { message: 'Tài khoản không tồn tại.' })
  }

  if (path === '/admin/users') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!requireUser(request, response, ['Admin'])) return true
    const rows = await getSql().query(
      `SELECT "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
              "Role" AS role, "Balance" AS balance, "CreatedAt" AS "createdAt"
         FROM user_accounts ORDER BY "CreatedAt" DESC`,
    )
    return json(response, 200, rows.map(accountResponse))
  }

  const roleMatch = /^\/admin\/users\/([0-9a-f-]{36})\/role$/i.exec(path)
  if (roleMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    if (!requireUser(request, response, ['Admin'])) return true
    const { role } = bodyOf(request)
    if (!['User', 'Staff', 'Admin'].includes(role)) {
      return json(response, 400, { message: 'Vai trò phải là User, Staff hoặc Admin.' })
    }
    const rows = await getSql().query(
      `UPDATE user_accounts SET "Role" = $2, "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1
        RETURNING "Id" AS id, "Username" AS username, "DisplayName" AS "displayName",
                  "Role" AS role, "Balance" AS balance, "CreatedAt" AS "createdAt"`,
      [roleMatch[1], role],
    )
    return rows[0] ? json(response, 200, accountResponse(rows[0])) : json(response, 404, { message: 'Không tìm thấy tài khoản.' })
  }

  return false
}

