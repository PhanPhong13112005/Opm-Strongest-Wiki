const fenceOffValues = new Set(['', '0', 'false', 'off', 'disabled', 'no'])

export const writerFenceSurfaces = Object.freeze([
  'POST /api/auth/register',
  'POST /api/auth/email-verification/request',
  'POST /api/auth/email-verification/confirm',
  'POST /api/auth/forgot-password',
  'POST /api/auth/reset-password',
  'PUT /api/admin/users/:id/role',
  'PUT /api/admin/users/:id/status',
  'PUT /api/tier-rankings/votes/:characterId',
  'POST /api/events/:eventId/comments',
  'DELETE /api/moderation/comments/:id',
  'POST /api/forum/topics',
  'POST /api/forum/topics/:topicId/posts',
  'DELETE /api/moderation/forum/topics/:id',
  'DELETE /api/moderation/forum/posts/:id',
  'GET /api/top-ups/mine',
  'PUT /api/top-ups/:id/bank-payment',
  'PUT /api/top-ups/:id/coupon-order',
  'GET /api/top-ups/:id/bank-qr',
  'POST /api/top-ups/bank-qr',
  'POST /api/top-ups',
  'PUT /api/admin/top-ups/:id/review',
  'PUT /api/staff/top-ups/:id/review',
  'POST /api/sepay-webhook',
  'POST /api/webhooks/sepay',
  'POST /api/admin/characters',
  'PUT /api/admin/characters/:id',
  'DELETE /api/admin/characters/:id',
  'PUT /api/admin/keepsakes/:id',
  'DELETE /api/admin/keepsakes/:id',
  'POST /api/admin/events',
  'PUT /api/admin/events/:id',
  'DELETE /api/admin/events/:id',
  'POST /api/admin/releases',
  'PUT /api/admin/releases/:id',
  'DELETE /api/admin/releases/:id',
  'POST /api/migrate',
  'AUTH_AND_ADMIN_USERS_SCHEMA_INITIALIZER',
  'ADMIN_CONTENT_SCHEMA_INITIALIZER',
  'COMMUNITY_WRITE_AND_DASHBOARD_SCHEMA_INITIALIZER',
])

const mutationCapableGetPaths = [
  /^\/auth(?:\/|$)/,
  /^\/admin\/users(?:\/|$)/,
  /^\/admin\/(?:characters|keepsakes|events|releases)(?:\/|$)/,
  /^\/admin\/dashboard$/,
  /^\/top-ups\/mine$/,
  /^\/top-ups\/[^/]+\/bank-qr$/,
]

export const isWriterFenceEnabled = (environment = process.env) => {
  const value = String(environment.OPMWIKI_WRITER_FENCE ?? '').trim().toLowerCase()
  return !fenceOffValues.has(value)
}

export const isMutationCapableApiRequest = (method, path) => {
  const normalizedMethod = String(method || '').trim().toUpperCase()
  const normalizedPath = String(path || '').trim()
  if (normalizedMethod !== 'GET') return true
  return mutationCapableGetPaths.some(pattern => pattern.test(normalizedPath))
}

const sendFencedResponse = (response, { provider = false } = {}) => {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Retry-After', '60')
  response.setHeader('X-OpmWiki-Writer-Fence', 'active')
  return response.status(503).json(provider
    ? { success: false }
    : { message: 'Hệ thống đang tạm ngừng ghi dữ liệu để bảo trì.' })
}

export const enforceApiWriterFence = (
  request,
  response,
  path,
  environment = process.env,
) => {
  if (!isWriterFenceEnabled(environment) ||
      !isMutationCapableApiRequest(request.method, path)) return false
  sendFencedResponse(response)
  return true
}

export const enforceStandaloneWriterFence = (
  response,
  { provider = false, environment = process.env } = {},
) => {
  if (!isWriterFenceEnabled(environment)) return false
  sendFencedResponse(response, { provider })
  return true
}
