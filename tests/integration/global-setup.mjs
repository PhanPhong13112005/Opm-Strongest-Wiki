import { createServer as createViteServer } from 'vite'
import { closeIntegrationApiServer } from './test-api-server.mjs'

const apiUrl = 'http://127.0.0.1:5181'

export default async function globalSetup() {
  process.env.VITE_API_BASE_URL = apiUrl
  const vite = await createViteServer({
    logLevel: 'error',
    server: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },
  })
  await vite.listen()

  return async () => {
    await vite.close()
    await closeIntegrationApiServer()
  }
}
