import { ensureCommunitySchema, getSql } from './database.js'
import { ensureAdminSchema } from './adminDatabase.js'
import { bodyOf, json, methodNotAllowed, noContent, publicCache, requireCurrentUser, serverTiming } from './http.js'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'

const require = createRequire(import.meta.url)
const characters = require('../../src/data/characters.json')
const events = require('../../src/data/events.json')

const mapComment = (row) => ({ ...row, id: Number(row.id) })
const mapTopic = (row) => ({ ...row, id: Number(row.id), postCount: Number(row.postCount || 0) })
const mapPost = (row) => ({ ...row, id: Number(row.id) })
const mapTopUp = (row) => {
  const { reviewedBySubject: _reviewedBySubject, ...publicRow } = row
  return { ...publicRow, id: Number(row.id), amount: Number(row.amount || 0) }
}
const mapAdminTopUp = (row) => ({
  ...mapTopUp(row),
  reviewedBySubject: String(row.reviewedBySubject || ''),
})
const rankedCharacterTiers = new Set(['UR+', 'UR', 'SSR+', 'SSR', 'SR', 'R'])
const rankedCharacters = characters.filter(character => rankedCharacterTiers.has(character.tier))
const rankedCharacterIds = new Set(rankedCharacters.map(character => character.id))
const rankedCharacterById = new Map(rankedCharacters.map(character => [character.id, character]))
const verifiedMonthlyVoteLimit = 8
const unverifiedMonthlyVoteLimit = 1

export const tierVoteMonthFor = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  return `${year}-${month}`
}

export const tierVoteResetAt = (voteMonth) => {
  const [year, month] = String(voteMonth).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return ''
  return new Date(Date.UTC(year, month, 1, -7)).toISOString()
}

const defaultVoteMonth = () => tierVoteMonthFor()

const readVotePolicy = async (sql, userId) => {
  const rows = await sql.query(
    `SELECT "EmailVerified" AS "emailVerified", "PhoneVerified" AS "phoneVerified"
       FROM user_accounts
      WHERE "Id" = $1 AND "IsActive" = true
      LIMIT 1`,
    [userId],
  )
  const emailVerified = rows[0]?.emailVerified === true
  const phoneVerified = rows[0]?.phoneVerified === true
  const hasVerifiedContact = emailVerified || phoneVerified
  return {
    emailVerified,
    phoneVerified,
    hasVerifiedContact,
    maxVotesPerRarity: hasVerifiedContact ? verifiedMonthlyVoteLimit : unverifiedMonthlyVoteLimit,
  }
}

const couponOrderProvider = 'Coupon Order'
const couponUnitPrice = 13_000
const couponReferencePattern = /^UID:\d{5,20}\|SID:[A-Za-z0-9_-]{1,20}\|CP:6\|QTY:(10|[1-9])\|[A-Z0-9]+$/
const couponQuantity = referenceCode => Number(couponReferencePattern.exec(String(referenceCode || ''))?.[1] || 0)
const isValidCouponOrder = (referenceCode, amount) => {
  const quantity = couponQuantity(referenceCode)
  return quantity >= 1 && quantity <= 10 && Number(amount) === couponUnitPrice * quantity
}
const bankIdPattern = /^[A-Za-z0-9]{2,20}$/
const bankAccountPattern = /^[A-Za-z0-9]{6,19}$/
const bankPaymentWindowMs = 5 * 60 * 1000

const readBankTransferConfig = () => {
  const bankId = String(process.env.BANKTRANSFER__BANKID || '').trim()
  const accountNumber = String(process.env.BANKTRANSFER__ACCOUNTNUMBER || '').trim()
  const accountName = String(process.env.BANKTRANSFER__ACCOUNTNAME || '').trim()
  if (!bankIdPattern.test(bankId) || !bankAccountPattern.test(accountNumber) ||
      accountName.length < 2 || accountName.length > 80 || /[\u0000-\u001f\u007f]/.test(accountName)) {
    return null
  }
  return { bankId, accountNumber, accountName }
}

const createBankReference = () =>
  `OPM${randomUUID().replaceAll('-', '').slice(0, 12)}`.toUpperCase()

const createBankQrUrl = ({ bankId, accountNumber, accountName }, amount, referenceCode) => {
  const parameters = new URLSearchParams({
    amount: String(amount),
    addInfo: referenceCode,
    accountName,
  })
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?${parameters}`
}

const createBankQrPayload = (topUp, bank) => ({
  topUp,
  bank,
  qrUrl: createBankQrUrl(bank, topUp.amount, topUp.referenceCode),
  expiresAt: new Date(new Date(topUp.createdAt).getTime() + bankPaymentWindowMs).toISOString(),
})

const commentSelect = `
  SELECT c."Id" AS id, c."EventId" AS "eventId", c."UserId" AS "userId",
         u."DisplayName" AS "displayName", u."Role" AS role,
         c."Content" AS content, c."CreatedAt" AS "createdAt"
    FROM event_comments c JOIN user_accounts u ON u."Id" = c."UserId"`

const topUpSelect = `
  SELECT t."Id" AS id, t."UserId" AS "userId", u."Username" AS username,
         u."DisplayName" AS "displayName", t."Provider" AS provider,
         t."ReferenceCode" AS "referenceCode", t."Amount" AS amount,
         t."Status" AS status, t."StaffNote" AS "staffNote",
         t."ReviewedBySubject" AS "reviewedBySubject",
         t."CreatedAt" AS "createdAt", t."ReviewedAt" AS "reviewedAt",
         t."PaidAt" AS "paidAt", t."ExternalTransactionId" AS "externalTransactionId"
    FROM top_up_requests t JOIN user_accounts u ON u."Id" = t."UserId"`

const getTopicDetail = async (id, sql = getSql()) => {
  const topics = await sql.query(
    `SELECT t."Id" AS id, t."Title" AS title, t."Content" AS content,
            u."DisplayName" AS author, u."Role" AS "authorRole",
            t."IsLocked" AS "isLocked", t."CreatedAt" AS "createdAt"
       FROM forum_topics t JOIN user_accounts u ON u."Id" = t."UserId"
      WHERE t."Id" = $1 AND t."IsDeleted" = false LIMIT 1`,
    [id],
  )
  if (!topics[0]) return null
  const posts = await sql.query(
    `SELECT p."Id" AS id, p."UserId" AS "userId", u."DisplayName" AS author,
            u."Role" AS "authorRole", p."Content" AS content, p."CreatedAt" AS "createdAt"
       FROM forum_posts p JOIN user_accounts u ON u."Id" = p."UserId"
      WHERE p."TopicId" = $1 AND p."IsDeleted" = false ORDER BY p."CreatedAt"`,
    [id],
  )
  return { ...topics[0], id: Number(topics[0].id), posts: posts.map(mapPost) }
}

export const createCommunityRouteHandler = ({
  ensureSchema = ensureCommunitySchema,
  ensureContentSchema = ensureAdminSchema,
  sqlProvider = getSql,
  voteMonthProvider = defaultVoteMonth,
} = {}) => async (request, response, path) => {
  const isCommunityPath = path.startsWith('/events/') || path.startsWith('/forum/') ||
    path.startsWith('/moderation/') || path.startsWith('/top-ups') ||
    path.startsWith('/staff/top-ups') || path.startsWith('/admin/top-ups') ||
    path.startsWith('/tier-rankings') ||
    path === '/admin/dashboard' || path === '/advisor/ask'
  if (!isCommunityPath) return false

  // Schema migration is handled by POST /api/migrate — not on every request.
  // Only authenticated write paths call ensureSchema() to guarantee tables exist.
  const isWritePath = request.method !== 'GET' || path === '/admin/dashboard'
  if (isWritePath) await ensureSchema()

  const sql = sqlProvider()

  const voteMonth = path.startsWith('/tier-rankings') ? String(voteMonthProvider()) : ''
  const resetsAt = voteMonth ? tierVoteResetAt(voteMonth) : ''
  if (voteMonth && !/^\d{4}-(0[1-9]|1[0-2])$/.test(voteMonth)) {
    throw new Error('Invalid tier ranking vote month.')
  }
  // VoteMonth backfill is handled by POST /api/migrate — not on GET requests.

  if (path === '/tier-rankings') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const t0 = performance.now()
    const rows = await sql.query(
      `SELECT "CharacterId" AS "characterId", COUNT(*)::int AS votes
         FROM tier_ranking_votes
        WHERE "VoteMonth" = $1
        GROUP BY "CharacterId"
        ORDER BY votes DESC, "CharacterId"`,
      [voteMonth],
    )
    const tVotes = performance.now()
    const totals = await sql.query(
      `SELECT COUNT(*)::int AS "totalVotes",
              COUNT(DISTINCT "UserId")::int AS "totalVoters"
         FROM tier_ranking_votes
        WHERE "VoteMonth" = $1`,
      [voteMonth],
    )
    const tTotals = performance.now()
    publicCache(response, { maxAge: 10, sMaxAge: 30, staleWhileRevalidate: 60 })
    serverTiming(response, {
      'db-votes': tVotes - t0,
      'db-totals': tTotals - tVotes,
      total: tTotals - t0,
    })
    return json(response, 200, {
      voteMonth,
      resetsAt,
      totalVotes: Number(totals[0]?.totalVotes || 0),
      totalVoters: Number(totals[0]?.totalVoters || 0),
      votes: rows.map(row => ({
        characterId: row.characterId,
        votes: Number(row.votes || 0),
      })),
    })
  }

  if (path === '/tier-rankings/mine') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 200, {
        characterIds: [],
        voteMonth,
        resetsAt,
        maxVotesPerRarity: 0,
        hasVerifiedContact: false,
        emailVerified: false,
        phoneVerified: false,
      })
    }
    const [rows, policy] = await Promise.all([
      sql.query(
        `SELECT "CharacterId" AS "characterId"
           FROM tier_ranking_votes
          WHERE "UserId" = $1 AND "VoteMonth" = $2
          ORDER BY "CharacterId"`,
        [user.userId, voteMonth],
      ),
      readVotePolicy(sql, user.userId),
    ])
    return json(response, 200, {
      characterIds: rows.map(row => row.characterId),
      voteMonth,
      resetsAt,
      ...policy,
    })
  }

  const tierVoteMatch = /^\/tier-rankings\/votes\/([^/]+)$/.exec(path)
  if (tierVoteMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const active = bodyOf(request).active
    const characterId = decodeURIComponent(tierVoteMatch[1])
    const rankedCharacter = rankedCharacterById.get(characterId)
    if (!rankedCharacter) {
      return json(response, 400, { message: 'Nhân vật không thuộc bảng xếp hạng.' })
    }
    if (typeof active !== 'boolean') {
      return json(response, 400, { message: 'Trạng thái bình chọn không hợp lệ.' })
    }
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 400, { message: 'Hãy dùng tài khoản người dùng để bình chọn.' })
    }

    const policy = await readVotePolicy(sql, user.userId)
    const rarity = rankedCharacter.tier

    if (active) {
      let voteSaved = false
      for (let attempt = 0; attempt <= policy.maxVotesPerRarity + 1; attempt += 1) {
        const currentRows = await sql.query(
          `SELECT "CharacterId" AS "characterId", "VoteSlot" AS "voteSlot"
             FROM tier_ranking_votes
            WHERE "UserId" = $1 AND "VoteMonth" = $2`,
          [user.userId, voteMonth],
        )
        if (currentRows.some(row => row.characterId === characterId)) {
          voteSaved = true
          break
        }

        const sameRarityRows = currentRows.filter(
          row => rankedCharacterById.get(row.characterId)?.tier === rarity,
        )
        if (sameRarityRows.length >= policy.maxVotesPerRarity) {
          return json(response, 409, {
            message: `Bạn đã chọn đủ ${policy.maxVotesPerRarity} nhân vật phẩm ${rarity} trong tháng này.`,
            voteMonth,
            rarity,
            ...policy,
          })
        }

        const legacyVoteCount = sameRarityRows.filter(row => row.voteSlot == null).length
        const usedSlots = new Set(sameRarityRows.map(row => Number(row.voteSlot)).filter(Number.isInteger))
        let voteSlot = 0
        for (let slot = legacyVoteCount + 1; slot <= policy.maxVotesPerRarity; slot += 1) {
          if (!usedSlots.has(slot)) {
            voteSlot = slot
            break
          }
        }
        if (!voteSlot) {
          return json(response, 409, {
            message: `Bạn đã chọn đủ ${policy.maxVotesPerRarity} nhân vật phẩm ${rarity} trong tháng này.`,
            voteMonth,
            rarity,
            ...policy,
          })
        }

        try {
          await sql.query(
            `INSERT INTO tier_ranking_votes
                ("UserId", "CharacterId", "VoteMonth", "Rarity", "VoteSlot", "CreatedAt")
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT ("UserId", "CharacterId", "VoteMonth") DO NOTHING`,
            [user.userId, characterId, voteMonth, rarity, voteSlot],
          )
          voteSaved = true
          break
        } catch (error) {
          if (error?.code !== '23505') throw error
        }
      }
      if (!voteSaved) {
        return json(response, 409, {
          message: 'Lượt bình chọn vừa thay đổi. Vui lòng thử lại.',
          voteMonth,
          rarity,
          ...policy,
        })
      }
    } else {
      return json(response, 409, {
        message: 'Phiếu bình chọn đã xác nhận và không thể hủy trong tháng hiện tại.',
        voteMonth,
        rarity,
        ...policy,
      })
    }

    const [rows, totals, currentRows] = await Promise.all([
      sql.query(
        `SELECT COUNT(*)::int AS votes
           FROM tier_ranking_votes
          WHERE "CharacterId" = $1 AND "VoteMonth" = $2`,
        [characterId, voteMonth],
      ),
      sql.query(
        `SELECT COUNT(*)::int AS "totalVotes",
                COUNT(DISTINCT "UserId")::int AS "totalVoters"
           FROM tier_ranking_votes
          WHERE "VoteMonth" = $1`,
        [voteMonth],
      ),
      sql.query(
        `SELECT "CharacterId" AS "characterId"
           FROM tier_ranking_votes
          WHERE "UserId" = $1 AND "VoteMonth" = $2`,
        [user.userId, voteMonth],
      ),
    ])
    const selectedInRarity = currentRows.filter(
      row => rankedCharacterById.get(row.characterId)?.tier === rarity,
    ).length
    return json(response, 200, {
      characterId,
      active,
      voteMonth,
      resetsAt,
      rarity,
      votes: Number(rows[0]?.votes || 0),
      totalVotes: Number(totals[0]?.totalVotes || 0),
      totalVoters: Number(totals[0]?.totalVoters || 0),
      selectedInRarity,
      remainingInRarity: Math.max(0, policy.maxVotesPerRarity - selectedInRarity),
      ...policy,
    })
  }

  const commentsMatch = /^\/events\/([^/]+)\/comments$/.exec(path)
  if (commentsMatch) {
    const eventId = decodeURIComponent(commentsMatch[1])
    if (request.method === 'GET') {
      const rows = await sql.query(
        `${commentSelect} WHERE c."EventId" = $1 AND c."IsDeleted" = false ORDER BY c."CreatedAt"`,
        [eventId],
      )
      return json(response, 200, rows.map(mapComment))
    }
    if (request.method === 'POST') {
      const user = await requireCurrentUser(request, response, sql)
      if (!user) return true
      if (String(user.userId).startsWith('admin:')) {
        return json(response, 400, { message: 'Tài khoản quản trị hệ thống không dùng để bình luận.' })
      }
      const content = String(bodyOf(request).content || '').trim()
      if (content.length < 1 || content.length > 1000) {
        return json(response, 400, { message: 'Bình luận phải có 1-1000 ký tự.' })
      }
      const rows = await sql.query(
        `WITH inserted AS (
           INSERT INTO event_comments ("EventId", "UserId", "Content") VALUES ($1, $2, $3)
           RETURNING *
         )
         SELECT i."Id" AS id, i."EventId" AS "eventId", i."UserId" AS "userId",
                u."DisplayName" AS "displayName", u."Role" AS role,
                i."Content" AS content, i."CreatedAt" AS "createdAt"
           FROM inserted i JOIN user_accounts u ON u."Id" = i."UserId"`,
        [eventId, user.userId, content],
      )
      return rows[0] ? json(response, 200, mapComment(rows[0])) : json(response, 404, { message: 'Không tìm thấy tài khoản.' })
    }
    return methodNotAllowed(response, ['GET', 'POST'])
  }

  if (path === '/moderation/comments') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!await requireCurrentUser(request, response, sql, ['Staff', 'Admin'])) return true
    const rows = await sql.query(`${commentSelect} WHERE c."IsDeleted" = false ORDER BY c."CreatedAt" DESC LIMIT 100`)
    return json(response, 200, rows.map(mapComment))
  }

  const deleteCommentMatch = /^\/moderation\/comments\/(\d+)$/.exec(path)
  if (deleteCommentMatch) {
    if (request.method !== 'DELETE') return methodNotAllowed(response, ['DELETE'])
    const user = await requireCurrentUser(request, response, sql, ['Staff', 'Admin'])
    if (!user) return true
    const moderatorId = String(user.userId).startsWith('admin:') ? null : user.userId
    const rows = await sql.query(
      `UPDATE event_comments SET "IsDeleted" = true, "DeletedById" = $2, "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1 AND "IsDeleted" = false RETURNING "Id"`,
      [Number(deleteCommentMatch[1]), moderatorId],
    )
    return rows[0] ? noContent(response) : json(response, 404, { message: 'Không tìm thấy bình luận.' })
  }

  if (path === '/forum/topics') {
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (request.method === 'GET') {
      const rows = await sql.query(
        `SELECT t."Id" AS id, t."Title" AS title, u."DisplayName" AS author,
                u."Role" AS "authorRole", COUNT(p."Id") FILTER (WHERE p."IsDeleted" = false) AS "postCount",
                t."IsLocked" AS "isLocked", t."UpdatedAt" AS "updatedAt"
           FROM forum_topics t JOIN user_accounts u ON u."Id" = t."UserId"
           LEFT JOIN forum_posts p ON p."TopicId" = t."Id"
          WHERE t."IsDeleted" = false
          GROUP BY t."Id", u."DisplayName", u."Role"
          ORDER BY t."UpdatedAt" DESC`,
      )
      return json(response, 200, rows.map(mapTopic))
    }
    if (request.method === 'POST') {
      if (String(user.userId).startsWith('admin:')) {
        return json(response, 400, { message: 'Hãy dùng tài khoản cộng đồng để tạo chủ đề.' })
      }
      const { title: rawTitle = '', content: rawContent = '' } = bodyOf(request)
      const title = String(rawTitle).trim()
      const content = String(rawContent).trim()
      if (title.length < 3 || title.length > 160 || content.length < 3 || content.length > 5000) {
        return json(response, 400, { message: 'Tiêu đề cần 3-160 ký tự và nội dung cần 3-5000 ký tự.' })
      }
      const rows = await sql.query(
        `INSERT INTO forum_topics ("UserId", "Title", "Content") VALUES ($1, $2, $3)
         RETURNING "Id" AS id`,
        [user.userId, title, content],
      )
      const topic = await getTopicDetail(rows[0].id, sql)
      response.setHeader('Location', `/api/forum/topics/${rows[0].id}`)
      return json(response, 201, topic)
    }
    return methodNotAllowed(response, ['GET', 'POST'])
  }

  const topicMatch = /^\/forum\/topics\/(\d+)$/.exec(path)
  if (topicMatch) {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!await requireCurrentUser(request, response, sql)) return true
    const topic = await getTopicDetail(Number(topicMatch[1]), sql)
    return topic ? json(response, 200, topic) : json(response, 404, { message: 'Không tìm thấy chủ đề.' })
  }

  const postMatch = /^\/forum\/topics\/(\d+)\/posts$/.exec(path)
  if (postMatch) {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 400, { message: 'Hãy dùng tài khoản cộng đồng để trò chuyện.' })
    }
    const content = String(bodyOf(request).content || '').trim()
    if (content.length < 1 || content.length > 3000) {
      return json(response, 400, { message: 'Tin nhắn phải có 1-3000 ký tự.' })
    }
    const rows = await sql.query(
      `WITH topic AS (
         UPDATE forum_topics SET "UpdatedAt" = CURRENT_TIMESTAMP
          WHERE "Id" = $1 AND "IsDeleted" = false AND "IsLocked" = false RETURNING "Id"
       ), inserted AS (
         INSERT INTO forum_posts ("TopicId", "UserId", "Content")
         SELECT "Id", $2, $3 FROM topic RETURNING *
       )
       SELECT i."Id" AS id, i."UserId" AS "userId", u."DisplayName" AS author,
              u."Role" AS "authorRole", i."Content" AS content, i."CreatedAt" AS "createdAt"
         FROM inserted i JOIN user_accounts u ON u."Id" = i."UserId"`,
      [Number(postMatch[1]), user.userId, content],
    )
    return rows[0] ? json(response, 200, mapPost(rows[0])) : json(response, 404, { message: 'Chủ đề không tồn tại hoặc đã bị khóa.' })
  }

  const deleteForumMatch = /^\/moderation\/forum\/(topics|posts)\/(\d+)$/.exec(path)
  if (deleteForumMatch) {
    if (request.method !== 'DELETE') return methodNotAllowed(response, ['DELETE'])
    const user = await requireCurrentUser(request, response, sql, ['Staff', 'Admin'])
    if (!user) return true
    const table = deleteForumMatch[1] === 'topics' ? 'forum_topics' : 'forum_posts'
    const moderatorId = String(user.userId).startsWith('admin:') ? null : user.userId
    const query = table === 'forum_topics'
      ? `UPDATE forum_topics SET "IsDeleted" = true, "UpdatedAt" = CURRENT_TIMESTAMP WHERE "Id" = $1 AND "IsDeleted" = false RETURNING "Id"`
      : `UPDATE forum_posts SET "IsDeleted" = true, "DeletedById" = $2, "UpdatedAt" = CURRENT_TIMESTAMP WHERE "Id" = $1 AND "IsDeleted" = false RETURNING "Id"`
    const rows = await sql.query(query, table === 'forum_topics' ? [Number(deleteForumMatch[2])] : [Number(deleteForumMatch[2]), moderatorId])
    return rows[0] ? noContent(response) : json(response, 404, { message: 'Không tìm thấy nội dung.' })
  }

  if (path === '/top-ups/mine') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) return json(response, 200, [])
    await sql.query(
      `UPDATE top_up_requests
          SET "Status" = 'Expired', "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "UserId" = $1 AND "Provider" = 'Bank transfer'
          AND "Status" = 'Pending'
          AND "CreatedAt" <= CURRENT_TIMESTAMP - INTERVAL '5 minutes'`,
      [user.userId],
    )
    const rows = await sql.query(`${topUpSelect} WHERE t."UserId" = $1 ORDER BY t."CreatedAt" DESC`, [user.userId])
    return json(response, 200, rows.map(mapTopUp))
  }

  const bankPaymentMatch = /^\/top-ups\/(\d+)\/bank-payment$/.exec(path)
  if (bankPaymentMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 404, { message: 'Không tìm thấy yêu cầu thanh toán.' })
    }

    const action = String(bodyOf(request).action || '').trim().toLowerCase()
    if (action !== 'cancel') {
      return json(response, 400, { message: 'Hành động thanh toán không hợp lệ.' })
    }

    const id = Number(bankPaymentMatch[1])
    await sql.query(
      `UPDATE top_up_requests
          SET "Status" = 'Expired', "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1 AND "UserId" = $2 AND "Provider" = 'Bank transfer'
          AND "Status" = 'Pending'
          AND "CreatedAt" <= CURRENT_TIMESTAMP - INTERVAL '5 minutes'`,
      [id, user.userId],
    )
    let rows = await sql.query(
      `${topUpSelect}
        WHERE t."Id" = $1 AND t."UserId" = $2 AND t."Provider" = 'Bank transfer'
        LIMIT 1`,
      [id, user.userId],
    )
    if (!rows[0]) return json(response, 404, { message: 'Không tìm thấy yêu cầu thanh toán.' })

    const targetStatus = 'Cancelled'
    if (rows[0].status === targetStatus) return json(response, 200, mapTopUp(rows[0]))
    if (!['Pending', 'PaymentReported'].includes(rows[0].status)) {
      return json(response, 409, { message: 'Yêu cầu thanh toán không còn có thể cập nhật.' })
    }

    const updated = await sql.query(
      `UPDATE top_up_requests
          SET "Status" = $3, "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1 AND "UserId" = $2 AND "Provider" = 'Bank transfer'
          AND "Status" IN ('Pending', 'PaymentReported')
        RETURNING "Id"`,
      [id, user.userId, targetStatus],
    )
    if (!updated[0]) {
      return json(response, 409, { message: 'Trạng thái vừa được cập nhật ở nơi khác. Vui lòng tải lại.' })
    }
    rows = await sql.query(
      `${topUpSelect} WHERE t."Id" = $1 AND t."UserId" = $2 LIMIT 1`,
      [id, user.userId],
    )
    return json(response, 200, mapTopUp(rows[0]))
  }

  const couponCancelMatch = /^\/top-ups\/(\d+)\/coupon-order$/.exec(path)
  if (couponCancelMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 404, { message: 'Không tìm thấy yêu cầu Coupon.' })
    }
    const action = String(bodyOf(request).action || '').trim().toLowerCase()
    if (action !== 'cancel') {
      return json(response, 400, { message: 'Hành động Coupon không hợp lệ.' })
    }

    const id = Number(couponCancelMatch[1])
    let rows = await sql.query(
      `${topUpSelect}
        WHERE t."Id" = $1 AND t."UserId" = $2 AND t."Provider" = 'Coupon Order'
        LIMIT 1`,
      [id, user.userId],
    )
    if (!rows[0]) return json(response, 404, { message: 'Không tìm thấy yêu cầu Coupon.' })
    if (rows[0].status === 'Cancelled') return json(response, 200, mapTopUp(rows[0]))
    if (!['Pending', 'PaymentReported'].includes(rows[0].status)) {
      return json(response, 409, { message: 'Yêu cầu Coupon không còn có thể hủy.' })
    }

    const updated = await sql.query(
      `UPDATE top_up_requests
          SET "Status" = 'Cancelled', "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1 AND "UserId" = $2 AND "Provider" = 'Coupon Order'
          AND "Status" IN ('Pending', 'PaymentReported')
        RETURNING "Id"`,
      [id, user.userId],
    )
    if (!updated[0]) {
      return json(response, 409, { message: 'Trạng thái vừa được cập nhật ở nơi khác. Vui lòng tải lại.' })
    }
    rows = await sql.query(
      `${topUpSelect} WHERE t."Id" = $1 AND t."UserId" = $2 LIMIT 1`,
      [id, user.userId],
    )
    return json(response, 200, mapTopUp(rows[0]))
  }
  const bankQrMatch = /^\/top-ups\/(\d+)\/bank-qr$/.exec(path)
  if (bankQrMatch) {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 404, { message: 'Không tìm thấy yêu cầu thanh toán.' })
    }

    const id = Number(bankQrMatch[1])
    await sql.query(
      `UPDATE top_up_requests
          SET "Status" = 'Expired', "UpdatedAt" = CURRENT_TIMESTAMP
        WHERE "Id" = $1 AND "UserId" = $2 AND "Provider" = 'Bank transfer'
          AND "Status" = 'Pending'
          AND "CreatedAt" <= CURRENT_TIMESTAMP - INTERVAL '5 minutes'`,
      [id, user.userId],
    )
    const rows = await sql.query(
      `${topUpSelect}
        WHERE t."Id" = $1 AND t."UserId" = $2 AND t."Provider" = 'Bank transfer'
        LIMIT 1`,
      [id, user.userId],
    )
    if (!rows[0]) return json(response, 404, { message: 'Không tìm thấy yêu cầu thanh toán.' })

    const bank = readBankTransferConfig()
    if (!bank) {
      return json(response, 503, { message: 'Kênh chuyển khoản ngân hàng chưa được cấu hình.' })
    }
    const topUp = mapTopUp(rows[0])
    return json(response, 200, createBankQrPayload(topUp, bank))
  }

  if (path === '/top-ups/bank-qr') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) {
      return json(response, 400, { message: 'Hãy dùng tài khoản người dùng để nạp.' })
    }

    const amount = Number(bodyOf(request).amount)
    if (!Number.isInteger(amount) || amount < 10_000 || amount > 100_000_000) {
      return json(response, 400, { message: 'Số tiền phải là số nguyên từ 10.000 đến 100.000.000.' })
    }

    const bank = readBankTransferConfig()
    if (!bank) {
      return json(response, 503, { message: 'Kênh chuyển khoản ngân hàng chưa được cấu hình.' })
    }

    const referenceCode = createBankReference()
    try {
      const rows = await sql.query(
        `WITH inserted AS (
           INSERT INTO top_up_requests ("UserId", "Provider", "ReferenceCode", "Amount")
           VALUES ($1, 'Bank transfer', $2, $3) RETURNING *
         )
         SELECT i."Id" AS id, i."UserId" AS "userId", u."Username" AS username,
                u."DisplayName" AS "displayName", i."Provider" AS provider,
                i."ReferenceCode" AS "referenceCode", i."Amount" AS amount,
                i."Status" AS status, i."StaffNote" AS "staffNote",
                i."CreatedAt" AS "createdAt", i."ReviewedAt" AS "reviewedAt"
           FROM inserted i JOIN user_accounts u ON u."Id" = i."UserId"`,
        [user.userId, referenceCode, amount],
      )
      const topUp = mapTopUp(rows[0])
      response.setHeader('Location', `/api/top-ups/${topUp.id}`)
      return json(response, 201, createBankQrPayload(topUp, bank))
    } catch (error) {
      if (error?.code === '23505') {
        return json(response, 409, { message: 'Không thể tạo mã chuyển khoản. Vui lòng thử lại.' })
      }
      throw error
    }
  }

  if (path === '/top-ups') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const user = await requireCurrentUser(request, response, sql)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) return json(response, 400, { message: 'Hãy dùng tài khoản người dùng để nạp.' })
    const { provider: rawProvider = '', referenceCode: rawReference = '', amount: rawAmount } = bodyOf(request)
    const provider = String(rawProvider).trim()
    const referenceCode = String(rawReference).trim()
    const amount = Number(rawAmount)
    if (provider !== couponOrderProvider) {
      return json(response, 400, { message: 'Phương thức nạp không được hỗ trợ.' })
    }
    if (referenceCode.length < 4 || referenceCode.length > 120 || /[\u0000-\u001f\u007f]/.test(referenceCode)) {
      return json(response, 400, { message: 'Mã giao dịch phải có 4-120 ký tự hợp lệ.' })
    }
    if (!Number.isFinite(amount) || amount < 10_000 || amount > 100_000_000) {
      return json(response, 400, { message: 'Số tiền phải từ 10.000 đến 100.000.000.' })
    }
    const quantity = couponQuantity(referenceCode)
    if (!quantity) {
      return json(response, 400, { message: 'Thông tin đơn Coupon không hợp lệ.' })
    }
    if (amount !== couponUnitPrice * quantity) {
      return json(response, 400, { message: 'Giá trị đơn Coupon không hợp lệ.' })
    }
    try {
      const rows = await sql.query(
        `WITH inserted AS (
           INSERT INTO top_up_requests ("UserId", "Provider", "ReferenceCode", "Amount")
           VALUES ($1, $2, $3, $4) RETURNING *
         )
         SELECT i."Id" AS id, i."UserId" AS "userId", u."Username" AS username,
                u."DisplayName" AS "displayName", i."Provider" AS provider,
                i."ReferenceCode" AS "referenceCode", i."Amount" AS amount,
                i."Status" AS status, i."StaffNote" AS "staffNote",
                i."CreatedAt" AS "createdAt", i."ReviewedAt" AS "reviewedAt"
           FROM inserted i JOIN user_accounts u ON u."Id" = i."UserId"`,
        [user.userId, provider, referenceCode, amount],
      )
      response.setHeader('Location', `/api/top-ups/${rows[0].id}`)
      return json(response, 201, mapTopUp(rows[0]))
    } catch (error) {
      if (error?.code === '23505') {
        const existing = await sql.query(
          `${topUpSelect}
            WHERE t."UserId" = $1 AND t."ReferenceCode" = $2
            LIMIT 1`,
          [user.userId, referenceCode],
        )
        if (existing[0]?.provider === couponOrderProvider && Number(existing[0].amount) === amount) {
          response.setHeader('Location', `/api/top-ups/${existing[0].id}`)
          return json(response, 200, mapTopUp(existing[0]))
        }
        return json(response, 409, { message: 'Mã giao dịch này đã được dùng cho yêu cầu khác.' })
      }
      throw error
    }
  }

  if (path === '/admin/top-ups' || path === '/staff/top-ups') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!await requireCurrentUser(request, response, sql, ['Admin'])) return true
    const status = String(request.query?.status || '')
    if (status && !['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return json(response, 400, { message: 'Trạng thái không hợp lệ.' })
    }
    const rows = status === 'Pending'
      ? await sql.query(`${topUpSelect} WHERE t."Provider" = 'Coupon Order' AND t."Status" IN ('Pending', 'PaymentReported') ORDER BY t."CreatedAt" DESC`)
      : status
        ? await sql.query(`${topUpSelect} WHERE t."Provider" = 'Coupon Order' AND t."Status" = $1 ORDER BY t."CreatedAt" DESC`, [status])
      : await sql.query(`${topUpSelect} WHERE t."Provider" = 'Coupon Order' ORDER BY t."CreatedAt" DESC`)
    return json(response, 200, rows.map(mapAdminTopUp))
  }

  const reviewMatch = /^\/(?:admin|staff)\/top-ups\/(\d+)\/review$/.exec(path)
  if (reviewMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const user = await requireCurrentUser(request, response, sql, ['Admin'])
    if (!user) return true
    const { status, staffNote = '' } = bodyOf(request)
    const cleanStaffNote = String(staffNote).trim()
    if (!['Approved', 'Rejected'].includes(status)) return json(response, 400, { message: 'Chỉ có thể duyệt hoặc từ chối yêu cầu.' })
    if (cleanStaffNote.length > 500) return json(response, 400, { message: 'Ghi chú không được vượt quá 500 ký tự.' })
    if (status === 'Rejected' && !cleanStaffNote) return json(response, 400, { message: 'Vui lòng nhập lý do từ chối.' })
    const reviewerSubject = String(user.userId || '').slice(0, 160)
    const reviewerId = reviewerSubject.startsWith('admin:') ? null : reviewerSubject
    const existing = await sql.query(
      `SELECT "UserId" AS "userId", "ReferenceCode" AS "referenceCode",
              "Amount" AS amount, "Status" AS status
         FROM top_up_requests
        WHERE "Id" = $1 AND "Provider" = 'Coupon Order'
        LIMIT 1`,
      [Number(reviewMatch[1])],
    )
    if (!existing[0] || !['Pending', 'PaymentReported'].includes(existing[0].status)) {
      return json(response, 409, { message: 'Yêu cầu không tồn tại hoặc đã được xử lý.' })
    }
    if (reviewerId && String(existing[0].userId) === reviewerId) {
      return json(response, 409, { message: 'Không thể tự xử lý đơn Coupon của chính bạn.' })
    }
    if (status === 'Approved' && !isValidCouponOrder(existing[0].referenceCode, existing[0].amount)) {
      return json(response, 409, { message: 'Thông tin hoặc giá trị đơn Coupon không hợp lệ. Chỉ có thể từ chối đơn.' })
    }
    const rows = await sql.query(
      `WITH reviewed AS (
         UPDATE top_up_requests
            SET "Status" = $2, "StaffNote" = $3, "ReviewedById" = $4,
                "ReviewedBySubject" = $5,
                "ReviewedAt" = CURRENT_TIMESTAMP, "UpdatedAt" = CURRENT_TIMESTAMP
          WHERE "Id" = $1 AND "Provider" = 'Coupon Order'
            AND ($4::uuid IS NULL OR "UserId" <> $4::uuid)
            AND "Status" IN ('Pending', 'PaymentReported') RETURNING *
       ), credited AS (
         UPDATE user_accounts u SET "Balance" = u."Balance" + r."Amount", "UpdatedAt" = CURRENT_TIMESTAMP
           FROM reviewed r
          WHERE r."Status" = 'Approved' AND r."Provider" <> 'Coupon Order' AND u."Id" = r."UserId"
          RETURNING u."Id"
       )
       SELECT r."Id" AS id, r."UserId" AS "userId", u."Username" AS username,
              u."DisplayName" AS "displayName", r."Provider" AS provider,
              r."ReferenceCode" AS "referenceCode", r."Amount" AS amount,
              r."Status" AS status, r."StaffNote" AS "staffNote",
              r."ReviewedBySubject" AS "reviewedBySubject",
              r."CreatedAt" AS "createdAt", r."ReviewedAt" AS "reviewedAt"
         FROM reviewed r JOIN user_accounts u ON u."Id" = r."UserId"`,
      [Number(reviewMatch[1]), status, cleanStaffNote, reviewerId, reviewerSubject],
    )
    return rows[0] ? json(response, 200, mapAdminTopUp(rows[0])) : json(response, 409, { message: 'Yêu cầu không tồn tại hoặc đã được xử lý.' })
  }

  if (path === '/admin/dashboard') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!await requireCurrentUser(request, response, sql, ['Admin'])) return true
    await ensureContentSchema()
    const rows = await sql.query(
      `SELECT
        COUNT(*) FILTER (WHERE "Role" = 'User')::int AS users,
        COUNT(*) FILTER (WHERE "Role" = 'Staff')::int AS staff,
        (COUNT(*) FILTER (WHERE "Role" = 'Admin') + 1)::int AS admins,
        (SELECT COUNT(*)::int FROM event_comments WHERE "IsDeleted" = false) AS "eventComments",
        (SELECT COUNT(*)::int FROM forum_topics WHERE "IsDeleted" = false) AS "forumTopics",
        (SELECT COUNT(*)::int FROM forum_posts WHERE "IsDeleted" = false) AS "forumPosts",
        (SELECT COUNT(*)::int FROM top_up_requests
          WHERE "Provider" = 'Coupon Order' AND "Status" IN ('Pending', 'PaymentReported')) AS "pendingTopUps",
        (SELECT COUNT(*)::int FROM characters) AS characters,
        (SELECT COUNT(*)::int FROM events) AS events,
        (SELECT COUNT(*)::int FROM release_schedule) AS "releaseEntries"
       FROM user_accounts`,
    )
    return json(response, 200, rows[0])
  }

  if (path === '/advisor/ask') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    if (!await requireCurrentUser(request, response, sql)) return true
    const question = String(bodyOf(request).question || '').trim()
    if (question.length < 2 || question.length > 1000) {
      return json(response, 400, { message: 'Câu hỏi phải có 2-1000 ký tự.' })
    }
    const terms = question.toLocaleLowerCase('vi').split(/\s+/).filter((term) => term.length > 1)
    const score = (text) => terms.reduce(
      (total, term) => total + (String(text).toLocaleLowerCase('vi').includes(term) ? 1 : 0),
      0,
    )
    const characterMatches = characters
      .map((character) => ({
        character,
        relevance: score([character.name, character.tier, character.type, character.faction, ...(character.roles || [])].join(' ')),
      }))
      .filter((item) => item.relevance > 0)
      .sort((left, right) => right.relevance - left.relevance)
      .slice(0, 5)
      .map(({ character }) => `${character.name} (${character.tier}) — ${character.type}, ${character.faction}; ${(character.roles || []).join(', ')}`)
    const eventMatches = events
      .map((event) => ({
        event,
        relevance: score(`${event.titleVi} ${event.titleEn} ${event.descriptionVi} ${event.descriptionEn}`),
      }))
      .filter((item) => item.relevance > 0)
      .sort((left, right) => right.relevance - left.relevance)
      .slice(0, 5)
      .map(({ event }) => `${event.titleVi} (${event.startDate} → ${event.endDate})`)

    if (!characterMatches.length && !eventMatches.length) {
      return json(response, 200, {
        answer: 'Tôi chưa tìm thấy dữ liệu phù hợp. Hãy thử nhập chính xác tên nhân vật, phe, hệ hoặc tên sự kiện.',
        source: 'wiki-local',
      })
    }
    const sections = []
    if (characterMatches.length) sections.push(`Nhân vật phù hợp:\n- ${characterMatches.join('\n- ')}`)
    if (eventMatches.length) sections.push(`Sự kiện phù hợp:\n- ${eventMatches.join('\n- ')}`)
    return json(response, 200, { answer: sections.join('\n\n'), source: 'wiki-local' })
  }

  return false
}

export const handleCommunityRoute = createCommunityRouteHandler()
