import { ensureCommunitySchema, getSql } from './database.js'
import { ensureAdminSchema } from './adminDatabase.js'
import { bodyOf, json, methodNotAllowed, noContent, requireUser } from './http.js'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const characters = require('../../src/data/characters.json')
const events = require('../../src/data/events.json')

const mapComment = (row) => ({ ...row, id: Number(row.id) })
const mapTopic = (row) => ({ ...row, id: Number(row.id), postCount: Number(row.postCount || 0) })
const mapPost = (row) => ({ ...row, id: Number(row.id) })
const mapTopUp = (row) => ({ ...row, id: Number(row.id), amount: Number(row.amount || 0) })

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
         t."CreatedAt" AS "createdAt", t."ReviewedAt" AS "reviewedAt"
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
} = {}) => async (request, response, path) => {
  const isCommunityPath = path.startsWith('/events/') || path.startsWith('/forum/') ||
    path.startsWith('/moderation/') || path.startsWith('/top-ups') ||
    path.startsWith('/staff/top-ups') || path === '/admin/dashboard' || path === '/advisor/ask'
  if (!isCommunityPath) return false
  await ensureSchema()
  const sql = sqlProvider()

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
      const user = requireUser(request, response)
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
    if (!requireUser(request, response, ['Staff', 'Admin'])) return true
    const rows = await sql.query(`${commentSelect} WHERE c."IsDeleted" = false ORDER BY c."CreatedAt" DESC LIMIT 100`)
    return json(response, 200, rows.map(mapComment))
  }

  const deleteCommentMatch = /^\/moderation\/comments\/(\d+)$/.exec(path)
  if (deleteCommentMatch) {
    if (request.method !== 'DELETE') return methodNotAllowed(response, ['DELETE'])
    const user = requireUser(request, response, ['Staff', 'Admin'])
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
    const user = requireUser(request, response)
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
    if (!requireUser(request, response)) return true
    const topic = await getTopicDetail(Number(topicMatch[1]), sql)
    return topic ? json(response, 200, topic) : json(response, 404, { message: 'Không tìm thấy chủ đề.' })
  }

  const postMatch = /^\/forum\/topics\/(\d+)\/posts$/.exec(path)
  if (postMatch) {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const user = requireUser(request, response)
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
    const user = requireUser(request, response, ['Staff', 'Admin'])
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
    const user = requireUser(request, response)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) return json(response, 200, [])
    const rows = await sql.query(`${topUpSelect} WHERE t."UserId" = $1 ORDER BY t."CreatedAt" DESC`, [user.userId])
    return json(response, 200, rows.map(mapTopUp))
  }

  if (path === '/top-ups') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const user = requireUser(request, response)
    if (!user) return true
    if (String(user.userId).startsWith('admin:')) return json(response, 400, { message: 'Hãy dùng tài khoản người dùng để nạp.' })
    const { provider: rawProvider = '', referenceCode: rawReference = '', amount: rawAmount } = bodyOf(request)
    const provider = String(rawProvider).trim()
    const referenceCode = String(rawReference).trim()
    const amount = Number(rawAmount)
    if (provider.length < 2 || provider.length > 60 || referenceCode.length < 4 || referenceCode.length > 120) {
      return json(response, 400, { message: 'Nhà cung cấp hoặc mã giao dịch không hợp lệ.' })
    }
    if (!Number.isFinite(amount) || amount < 10_000 || amount > 100_000_000) {
      return json(response, 400, { message: 'Số tiền phải từ 10.000 đến 100.000.000.' })
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
      if (error?.code === '23505') return json(response, 409, { message: 'Mã giao dịch này đã được gửi trước đó.' })
      throw error
    }
  }

  if (path === '/staff/top-ups') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!requireUser(request, response, ['Staff', 'Admin'])) return true
    const status = String(request.query?.status || '')
    if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return json(response, 400, { message: 'Trạng thái không hợp lệ.' })
    }
    const rows = status
      ? await sql.query(`${topUpSelect} WHERE t."Status" = $1 ORDER BY t."CreatedAt" DESC`, [status])
      : await sql.query(`${topUpSelect} ORDER BY t."CreatedAt" DESC`)
    return json(response, 200, rows.map(mapTopUp))
  }

  const reviewMatch = /^\/staff\/top-ups\/(\d+)\/review$/.exec(path)
  if (reviewMatch) {
    if (request.method !== 'PUT') return methodNotAllowed(response, ['PUT'])
    const user = requireUser(request, response, ['Staff', 'Admin'])
    if (!user) return true
    const { status, staffNote = '' } = bodyOf(request)
    if (!['Approved', 'Rejected'].includes(status)) return json(response, 400, { message: 'Chỉ có thể duyệt hoặc từ chối yêu cầu.' })
    if (String(staffNote).length > 500) return json(response, 400, { message: 'Ghi chú không được vượt quá 500 ký tự.' })
    const reviewerId = String(user.userId).startsWith('admin:') ? null : user.userId
    const rows = await sql.query(
      `WITH reviewed AS (
         UPDATE top_up_requests
            SET "Status" = $2, "StaffNote" = $3, "ReviewedById" = $4,
                "ReviewedAt" = CURRENT_TIMESTAMP, "UpdatedAt" = CURRENT_TIMESTAMP
          WHERE "Id" = $1 AND "Status" = 'Pending' RETURNING *
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
              r."CreatedAt" AS "createdAt", r."ReviewedAt" AS "reviewedAt"
         FROM reviewed r JOIN user_accounts u ON u."Id" = r."UserId"`,
      [Number(reviewMatch[1]), status, String(staffNote).trim(), reviewerId],
    )
    return rows[0] ? json(response, 200, mapTopUp(rows[0])) : json(response, 409, { message: 'Yêu cầu không tồn tại hoặc đã được xử lý.' })
  }

  if (path === '/admin/dashboard') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    if (!requireUser(request, response, ['Admin'])) return true
    await ensureContentSchema()
    const rows = await sql.query(
      `SELECT
        COUNT(*) FILTER (WHERE "Role" = 'User')::int AS users,
        COUNT(*) FILTER (WHERE "Role" = 'Staff')::int AS staff,
        (COUNT(*) FILTER (WHERE "Role" = 'Admin') + 1)::int AS admins,
        (SELECT COUNT(*)::int FROM event_comments WHERE "IsDeleted" = false) AS "eventComments",
        (SELECT COUNT(*)::int FROM forum_topics WHERE "IsDeleted" = false) AS "forumTopics",
        (SELECT COUNT(*)::int FROM forum_posts WHERE "IsDeleted" = false) AS "forumPosts",
        (SELECT COUNT(*)::int FROM top_up_requests WHERE "Status" = 'Pending') AS "pendingTopUps",
        (SELECT COUNT(*)::int FROM characters) AS characters,
        (SELECT COUNT(*)::int FROM events) AS events,
        (SELECT COUNT(*)::int FROM release_schedule) AS "releaseEntries"
       FROM user_accounts`,
    )
    return json(response, 200, rows[0])
  }

  if (path === '/advisor/ask') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    if (!requireUser(request, response)) return true
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
