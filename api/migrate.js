import { ensureCommunitySchema, getSql } from './_lib/database.js'
import { ensureAdminSchema } from './_lib/adminDatabase.js'
import { json, requireUser } from './_lib/http.js'
import { tierVoteMonthFor } from './_lib/communityRoutes.js'
import { enforceStandaloneWriterFence } from './_lib/writerFence.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return json(response, 405, { message: 'Use POST to run migrations.' })
  }

  if (enforceStandaloneWriterFence(response)) return

  // Require Admin role to run migrations
  const user = requireUser(request, response, ['Admin'])
  if (!user) return

  const timings = {}
  const t0 = performance.now()

  try {
    // 1. Community schema (user_accounts, tier_ranking_votes, forum, etc.)
    const tCommunity0 = performance.now()
    await ensureCommunitySchema()
    timings.communitySchema = performance.now() - tCommunity0

    // 2. Admin/content schema (characters, events, release_schedule, seeds)
    const tAdmin0 = performance.now()
    await ensureAdminSchema()
    timings.adminSchema = performance.now() - tAdmin0

    // 3. VoteMonth backfill — derive VoteMonth from CreatedAt timestamp for any legacy rows
    const sql = getSql()
    const currentMonth = tierVoteMonthFor()
    const tBackfill0 = performance.now()
    const backfilled = await sql.query(
      `UPDATE tier_ranking_votes
          SET "VoteMonth" = COALESCE(
                NULLIF(TO_CHAR("CreatedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM'), ''),
                $1
              )
        WHERE "VoteMonth" = '' OR "VoteMonth" IS NULL
      RETURNING "UserId", "CharacterId", "VoteMonth"`,
      [currentMonth],
    )
    timings.voteMonthBackfill = performance.now() - tBackfill0
    timings.backfilledRows = Array.isArray(backfilled) ? backfilled.length : 0

    timings.total = performance.now() - t0

    return json(response, 200, {
      status: 'ok',
      message: 'All migrations completed successfully.',
      timings: Object.fromEntries(
        Object.entries(timings).map(([key, value]) => [
          key,
          typeof value === 'number' && key !== 'backfilledRows'
            ? `${value.toFixed(1)}ms`
            : value,
        ]),
      ),
    })
  } catch (error) {
    timings.total = performance.now() - t0
    console.error('Migration failed', { message: error?.message, code: error?.code })
    return json(response, 500, {
      status: 'error',
      message: error?.message || 'Migration failed.',
      timings: Object.fromEntries(
        Object.entries(timings).map(([key, value]) => [
          key,
          typeof value === 'number' && key !== 'backfilledRows'
            ? `${value.toFixed(1)}ms`
            : value,
        ]),
      ),
    })
  }
}
