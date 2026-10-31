import { authorizedRequest, getAccessToken, hasValidSession } from './authApi'
import { invalidateApiCache, requestApi, requestApiCached } from './apiClient'

const optionalAuthHeaders = () => hasValidSession()
  ? { Authorization: `Bearer ${getAccessToken()}` }
  : {}

export const getTierRankings = () =>
  requestApiCached('api/tier-rankings', null, { ttlMs: 15_000, timeoutMs: 20_000, retryCount: 1 })

export const getMyTierVotes = () =>
  authorizedRequest('api/tier-rankings/mine', { timeoutMs: 20_000, retryCount: 1 })

export const setTierVote = async characterId => {
  const result = await authorizedRequest('api/tier-rankings/votes/' + encodeURIComponent(characterId), {
    method: 'PUT',
    timeoutMs: 25_000,
    retryCount: 1,
    body: JSON.stringify({ active: true }),
  })
  invalidateApiCache('api/tier-rankings')
  return result
}

export const getEventComments = (eventId) =>
  requestApi(`api/events/${encodeURIComponent(eventId)}/comments`)

const communityReadOnlyCode = 'COMMUNITY_READ_ONLY'
export const isCommunityReadOnlyError = error => error?.code === communityReadOnlyCode

export const getCommunityCapabilities = async () => {
  const capability = await requestApi('api/forum/capabilities', null, {
    cache: 'no-store', retryCount: 0, trackLoading: false,
  })
  if (typeof capability?.communityReadOnly !== 'boolean') {
    throw new Error('Invalid community capability response.')
  }
  return capability
}

const postCommunityContent = async (path, body) => {
  try {
    return await authorizedRequest(path, { method: 'POST', retryCount: 0, body: JSON.stringify(body) })
  } catch (error) {
    // apiClient preserves the API message, not its code. Normalize only these posts.
    if (error?.status === 503 && error.message === communityReadOnlyCode) {
      error.code = communityReadOnlyCode
    }
    throw error
  }
}

export const createEventComment = (eventId, content) =>
  postCommunityContent(`api/events/${encodeURIComponent(eventId)}/comments`, { content })

export const getForumTopics = () => authorizedRequest('api/forum/topics')
export const getForumTopic = (id) => authorizedRequest(`api/forum/topics/${id}`)
export const createForumTopic = (title, content) => postCommunityContent('api/forum/topics', { title, content })
export const createForumPost = (topicId, content) => postCommunityContent(`api/forum/topics/${topicId}/posts`, { content })
export const deleteForumPost = (postId) => authorizedRequest(`api/moderation/forum/posts/${postId}`, {
  method: 'DELETE',
})
export const deleteForumTopic = (topicId) => authorizedRequest(`api/moderation/forum/topics/${topicId}`, {
  method: 'DELETE',
})

export const getMyTopUps = () => authorizedRequest('api/top-ups/mine')
export const createTopUp = (payload) => authorizedRequest('api/top-ups', {
  method: 'POST', body: JSON.stringify(payload),
})
export const updateCouponTopUp = (id, action) => authorizedRequest(`api/top-ups/${id}/coupon-order`, {
  method: 'PUT', body: JSON.stringify({ action }),
})
export const createBankTopUpQr = (amount) => authorizedRequest('api/top-ups/bank-qr', {
  method: 'POST', body: JSON.stringify({ amount }),
})
export const getBankTopUpQr = (id, { trackLoading = true } = {}) =>
  authorizedRequest(`api/top-ups/${id}/bank-qr`, { trackLoading })
export const updateBankTopUpPayment = (id, action) => authorizedRequest(`api/top-ups/${id}/bank-payment`, {
  method: 'PUT', body: JSON.stringify({ action }),
})
export const getModerationComments = () => authorizedRequest('api/moderation/comments')
export const deleteEventComment = (id) => authorizedRequest(`api/moderation/comments/${id}`, {
  method: 'DELETE',
})

export const askAdvisor = (question) => authorizedRequest('api/advisor/ask', {
  method: 'POST', body: JSON.stringify({ question }),
})

export const _optionalAuthHeadersForTests = optionalAuthHeaders
