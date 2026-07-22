import { getDatabaseUrl, getSql } from './_lib/database.js'
import { handleAuthRoute } from './_lib/authRoutes.js'
import { handleCommunityRoute } from './_lib/communityRoutes.js'
import { json, routePath } from './_lib/http.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  const path = routePath(request)

  try {
    if (path === '/health') {
      if (request.method !== 'GET') return json(response, 405, { message: 'Phương thức không được hỗ trợ.' })
      return json(response, 200, {
        status: 'healthy',
        service: 'opmwiki-vercel-api',
        databaseConfigured: Boolean(getDatabaseUrl()),
        utc: new Date().toISOString(),
      })
    }

    if (path === '/health/database') {
      if (request.method !== 'GET') return json(response, 405, { message: 'Phương thức không được hỗ trợ.' })
      await getSql().query('SELECT 1')
      return json(response, 200, { status: 'healthy', database: 'connected' })
    }

    if (await handleAuthRoute(request, response, path)) return
    if (await handleCommunityRoute(request, response, path)) return
    return json(response, 404, { message: 'API endpoint chưa được chuyển sang Vercel Functions.' })
  } catch (error) {
    console.error('API request failed', { path, message: error?.message, code: error?.code })
    return json(response, 500, {
      message: process.env.NODE_ENV === 'production'
        ? 'Máy chủ gặp lỗi khi xử lý yêu cầu.'
        : error?.message || 'Internal server error.',
    })
  }
}

