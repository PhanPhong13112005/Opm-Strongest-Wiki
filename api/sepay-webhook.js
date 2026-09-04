import { ensureCommunitySchema, getSql } from './_lib/database.js'
import { processSePayWebhook, readRawBody } from './_lib/sepayWebhook.js'
import { enforceStandaloneWriterFence } from './_lib/writerFence.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ success: false })
  }

  if (enforceStandaloneWriterFence(response, { provider: true })) return

  const webhookSecret = String(process.env.SEPAY__WEBHOOKSECRET || '').trim()
  const receivingAccount = String(process.env.BANKTRANSFER__ACCOUNTNUMBER || '').trim()
  if (webhookSecret.length < 32 || !receivingAccount) {
    return response.status(503).json({ success: false })
  }

  try {
    const rawBody = await readRawBody(request)
    await ensureCommunitySchema()
    const result = await processSePayWebhook({
      request,
      rawBody,
      sql: getSql(),
      webhookSecret,
      receivingAccount,
    })
    return response.status(result.statusCode).json(result.payload)
  } catch (error) {
    console.error('SePay webhook failed', { message: error?.message, code: error?.code })
    return response.status(error?.statusCode || 500).json({ success: false })
  }
}
