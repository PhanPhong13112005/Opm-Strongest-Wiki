import { createServer } from 'node:http'
import { PGlite } from '@electric-sql/pglite'

import { initializeAdminSchema } from '../../api/_lib/adminDatabase.js'
import { createAdminDataRouteHandler } from '../../api/_lib/adminRoutes.js'
import { createAccessToken, validateAdminCredentials } from '../../api/_lib/security.js'

const host = '127.0.0.1'
const port = 5181

process.env.ADMINAUTH__USERNAME = 'integration-admin'
process.env.ADMINAUTH__PASSWORD = 'integration-password'
process.env.ADMINAUTH__JWTSIGNINGKEY = 'integration-test-signing-key-with-at-least-32-characters'

const database = new PGlite()
const sql = {
  query: async (statement, params = []) => (await database.query(statement, params)).rows,
}

let schemaPromise
const ensureSchema = () => {
  schemaPromise ||= initializeAdminSchema(sql)
  return schemaPromise
}

const handleAdminDataRoute = createAdminDataRouteHandler({
  ensureSchema,
  sqlProvider: () => sql,
})

const readBody = async (request) => {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

const responseAdapter = (response) => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code
    return this
  },
  json(payload) {
    response.statusCode = this.statusCode
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
    return this
  },
  end() {
    response.statusCode = this.statusCode
    response.end()
    return this
  },
  setHeader(name, value) {
    response.setHeader(name, value)
  },
})

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4173')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }

  const url = new URL(request.url, `http://${host}:${port}`)
  const path = `/${url.pathname.replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')}`
  const body = await readBody(request)
  const query = Object.fromEntries(url.searchParams.entries())
  const adaptedResponse = responseAdapter(response)

  try {
    if (path === '/health') {
      adaptedResponse.status(200).json({ status: 'healthy' })
      return
    }

    if (path === '/auth/login' && request.method === 'POST') {
      if (!validateAdminCredentials(body.username, body.password)) {
        adaptedResponse.status(401).json({ message: 'Invalid administrator credentials.' })
        return
      }
      adaptedResponse.status(200).json(createAccessToken({
        userId: 'admin:integration-admin',
        username: 'integration-admin',
        displayName: 'Integration Admin',
        role: 'Admin',
      }))
      return
    }

    const handled = await handleAdminDataRoute({
      method: request.method,
      headers: request.headers,
      body,
      query,
      url: request.url,
    }, adaptedResponse, path)
    if (!handled && !response.writableEnded) {
      adaptedResponse.status(404).json({ message: 'Not found.' })
    }
  } catch (error) {
    console.error(error)
    if (!response.writableEnded) adaptedResponse.status(500).json({ message: error.message })
  }
})

await ensureSchema()
await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(port, host, resolve)
})

let isClosed = false
export const closeIntegrationApiServer = async () => {
  if (isClosed) return
  isClosed = true
  await new Promise((resolve) => server.close(resolve))
  await database.close()
}
