import { verifyAccessToken } from './security.js'

export const json = (response, status, payload) => response.status(status).json(payload)

export const noContent = (response) => response.status(204).end()

export const methodNotAllowed = (response, methods) => {
  response.setHeader('Allow', methods.join(', '))
  return json(response, 405, { message: 'Phương thức không được hỗ trợ.' })
}

export const bodyOf = (request) => {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body
  try {
    return JSON.parse(request.body)
  } catch {
    return {}
  }
}

export const getBearerToken = (request) => {
  const header = String(request.headers.authorization || '')
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
}

export const requireUser = (request, response, roles = []) => {
  const user = verifyAccessToken(getBearerToken(request))
  if (!user) {
    json(response, 401, { message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' })
    return null
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    json(response, 403, { message: 'Tài khoản không có quyền thực hiện thao tác này.' })
    return null
  }
  return user
}

export const routePath = (request) => {
  const queryPath = Array.isArray(request.query?.path)
    ? request.query.path.join('/')
    : request.query?.path
  if (queryPath) return `/${String(queryPath).replace(/^\/+|\/+$/g, '')}`

  const pathname = new URL(request.url, 'http://localhost').pathname
  return `/${pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')}`
}

export const parseId = (value) => /^\d+$/.test(String(value || '')) ? Number(value) : null

