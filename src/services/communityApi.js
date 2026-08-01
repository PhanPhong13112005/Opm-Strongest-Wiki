import { authorizedRequest, getAccessToken, hasValidSession } from './authApi'
import { requestApi } from './apiClient'

const optionalAuthHeaders = () => hasValidSession()
  ? { Authorization: `Bearer ${getAccessToken()}` }
  : {}

export const getEventComments = (eventId) =>
  requestApi(`api/events/${encodeURIComponent(eventId)}/comments`)

export const createEventComment = (eventId, content) =>
  authorizedRequest(`api/events/${encodeURIComponent(eventId)}/comments`, {
    method: 'POST', body: JSON.stringify({ content }),
  })

export const getForumTopics = () => authorizedRequest('api/forum/topics')
export const getForumTopic = (id) => authorizedRequest(`api/forum/topics/${id}`)
export const createForumTopic = (title, content) => authorizedRequest('api/forum/topics', {
  method: 'POST', body: JSON.stringify({ title, content }),
})
export const createForumPost = (topicId, content) => authorizedRequest(`api/forum/topics/${topicId}/posts`, {
  method: 'POST', body: JSON.stringify({ content }),
})
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
