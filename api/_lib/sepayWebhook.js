import { createHmac, timingSafeEqual } from 'node:crypto'

const maximumTimestampSkewSeconds = 5 * 60
const maximumPayloadBytes = 64 * 1024
const paymentCodePattern = /^OPM[A-F0-9]{12}$/
const paymentCodeInContentPattern = /(?:^|[^A-Z0-9])(OPM[A-F0-9]{12})(?![A-Z0-9])/i

const headerOf = (request, name) => String(
  request.headers?.[name] ?? request.headers?.[name.toLowerCase()] ?? '',
)

export const readRawBody = async request => {
  if (typeof request.rawBody === 'string') {
    if (Buffer.byteLength(request.rawBody, 'utf8') > maximumPayloadBytes) {
      const error = new Error('Webhook payload is too large.')
      error.statusCode = 413
      throw error
    }
    return request.rawBody
  }
  if (Buffer.isBuffer(request.rawBody)) {
    if (request.rawBody.length > maximumPayloadBytes) {
      const error = new Error('Webhook payload is too large.')
      error.statusCode = 413
      throw error
    }
    return request.rawBody.toString('utf8')
  }

  const chunks = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maximumPayloadBytes) {
      const error = new Error('Webhook payload is too large.')
      error.statusCode = 413
      throw error
    }
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export const verifySePaySignature = ({
  rawBody,
  signature,
  timestamp,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
}) => {
  const timestampNumber = Number(timestamp)
  if (!Number.isInteger(timestampNumber) ||
      Math.abs(nowSeconds - timestampNumber) > maximumTimestampSkewSeconds ||
      typeof secret !== 'string' ||
      secret.length < 32) {
    return false
  }

  const expected = `sha256=${createHmac('sha256', secret)
    .update(`${timestampNumber}.${rawBody}`, 'utf8')
    .digest('hex')}`
  const actualBytes = Buffer.from(String(signature), 'ascii')
  const expectedBytes = Buffer.from(expected, 'ascii')
  return actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
}

const transactionTime = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(value || ''))
  if (!match) return null
  const [, year, month, day, hour, minute, second] = match
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const extractSePayPaymentCode = payload => {
  const code = String(payload?.code || '').trim().toUpperCase()
  if (paymentCodePattern.test(code)) return code

  const match = paymentCodeInContentPattern.exec(String(payload?.content || ''))
  return match?.[1]?.toUpperCase() || ''
}

export const processSePayWebhook = async ({
  request,
  rawBody,
  sql,
  webhookSecret,
  receivingAccount,
}) => {
  if (!verifySePaySignature({
    rawBody,
    signature: headerOf(request, 'x-sepay-signature'),
    timestamp: headerOf(request, 'x-sepay-timestamp'),
    secret: webhookSecret,
  })) {
    return { statusCode: 401, payload: { success: false } }
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return { statusCode: 400, payload: { success: false } }
  }

  const externalTransactionId = String(payload?.id ?? '')
  if (!/^\d+$/.test(externalTransactionId) || externalTransactionId === '0') {
    return { statusCode: 200, payload: { success: true } }
  }

  const paymentCode = extractSePayPaymentCode(payload)
  const amount = Number(payload.transferAmount)
  if (payload.transferType !== 'in' ||
      String(payload.accountNumber || '').trim() !== receivingAccount ||
      !paymentCodePattern.test(paymentCode) ||
      !Number.isInteger(amount) ||
      amount <= 0) {
    return { statusCode: 200, payload: { success: true } }
  }

  const rows = await sql.query(
    `WITH matching_order AS (
       SELECT t."Id", t."UserId", t."Status", t."Amount"
         FROM top_up_requests t
        WHERE t."Provider" = 'Bank transfer'
          AND t."ReferenceCode" = $2
          AND t."Amount" = $3
        ORDER BY t."CreatedAt" DESC
        LIMIT 1
     ), recorded AS (
       INSERT INTO payment_transactions (
         "Provider", "ExternalTransactionId", "TopUpRequestId", "Gateway",
         "AccountNumber", "PaymentCode", "Amount", "TransferType",
         "BankReferenceCode", "Status", "PayloadJson", "TransactionAt"
       )
       SELECT 'SePay', $1, m."Id", $4, $5, $2, $3, 'in', $6,
              CASE WHEN m."Id" IS NULL THEN 'Unmatched' ELSE 'Received' END,
              $7::jsonb, $8::timestamptz
         FROM (SELECT 1) seed
         LEFT JOIN matching_order m ON true
       ON CONFLICT ("Provider", "ExternalTransactionId") DO NOTHING
       RETURNING *
     ), claimed_order AS (
       UPDATE top_up_requests t
          SET "Status" = 'Paid',
              "PaidAt" = CURRENT_TIMESTAMP,
              "ExternalTransactionId" = $1,
              "UpdatedAt" = CURRENT_TIMESTAMP
         FROM recorded r
        WHERE t."Id" = r."TopUpRequestId"
          AND r."Status" = 'Received'
          AND t."Status" NOT IN ('Paid', 'Approved')
       RETURNING t."Id", t."UserId", t."Amount"
     ), credited_user AS (
       UPDATE user_accounts u
          SET "Balance" = u."Balance" + c."Amount",
              "UpdatedAt" = CURRENT_TIMESTAMP
         FROM claimed_order c
        WHERE u."Id" = c."UserId"
       RETURNING u."Id", u."Balance" AS "BalanceAfter"
     ), ledger_entry AS (
       INSERT INTO balance_ledger (
         "UserId", "TopUpRequestId", "PaymentTransactionId", "EntryType",
         "Amount", "BalanceBefore", "BalanceAfter"
       )
       SELECT c."UserId", c."Id", r."Id", 'BankTopUp',
              c."Amount", u."BalanceAfter" - c."Amount", u."BalanceAfter"
         FROM claimed_order c
         JOIN credited_user u ON u."Id" = c."UserId"
         JOIN recorded r ON r."TopUpRequestId" = c."Id"
       RETURNING "Id"
     )
     SELECT
       NOT EXISTS (SELECT 1 FROM recorded) AS duplicate,
       EXISTS (SELECT 1 FROM ledger_entry) AS credited,
       COALESCE(
         (SELECT "TopUpRequestId" FROM recorded LIMIT 1),
         (SELECT "TopUpRequestId" FROM payment_transactions
           WHERE "Provider" = 'SePay' AND "ExternalTransactionId" = $1 LIMIT 1)
       ) AS "topUpRequestId",
       CASE
         WHEN EXISTS (SELECT 1 FROM ledger_entry) THEN 'Credited'
         WHEN EXISTS (SELECT 1 FROM recorded WHERE "TopUpRequestId" IS NULL) THEN 'Unmatched'
         WHEN NOT EXISTS (SELECT 1 FROM recorded) THEN 'Duplicate'
         ELSE 'DuplicateOrder'
       END AS status`,
    [
      externalTransactionId,
      paymentCode,
      amount,
      String(payload.gateway || '').trim(),
      receivingAccount,
      String(payload.referenceCode || '').trim(),
      rawBody,
      transactionTime(payload.transactionDate),
    ],
  )
  return {
    statusCode: 200,
    payload: { success: true },
    result: rows[0],
  }
}
