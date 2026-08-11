import { invalidateApiCache, isSameOriginApiAvailable } from './apiClient'
import {
  authorizedRequest,
  clearSession,
  getAccessToken,
  hasRole,
  hasValidSession,
  login,
} from './authApi'

export const getAdminToken = getAccessToken
export const hasValidAdminToken = () => hasValidSession() && hasRole('Admin')
export const clearAdminSession = clearSession
export const loginAdmin = login

export const getAdminCharacters = (query = {}) =>
  authorizedRequest('api/admin/characters', {}, query)

const mutateAndInvalidate = async (path, options, cachePrefix) => {
  const result = await authorizedRequest(path, options)
  invalidateApiCache(cachePrefix)
  return result
}

export const createAdminCharacter = (character) =>
  mutateAndInvalidate('api/admin/characters', {
    method: 'POST', body: JSON.stringify(character),
  }, 'api/characters')

export const updateAdminCharacter = (character) =>
  mutateAndInvalidate(`api/admin/characters/${encodeURIComponent(character.id)}`, {
    method: 'PUT', body: JSON.stringify(character),
  }, 'api/characters')

export const deleteAdminCharacter = (id) =>
  mutateAndInvalidate(`api/admin/characters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }, 'api/characters')

export const updateAdminKeepsake = (characterId, iconUrl) =>
  mutateAndInvalidate(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, {
    method: 'PUT', body: JSON.stringify({ iconUrl }),
  }, 'api/characters')

export const deleteAdminKeepsake = (characterId) =>
  mutateAndInvalidate(`api/admin/keepsakes/${encodeURIComponent(characterId)}`, {
    method: 'DELETE',
  }, 'api/characters')

export const getAdminDashboard = async () => {
  try {
    return await authorizedRequest('api/admin/dashboard')
  } catch (error) {
    if (import.meta.env?.DEV) {
      return {
        characters: 154,
        events: 18,
        releaseEntries: 12,
        eventComments: 45,
        forumTopics: 28,
        forumPosts: 92,
        users: 120,
        staff: 5,
        admins: 2,
        pendingTopUps: 0,
      }
    }
    throw error
  }
}

export const getAdminUsers = async () => {
  try {
    return await authorizedRequest('api/admin/users')
  } catch (error) {
    if (import.meta.env?.DEV) {
      return [
        { id: '1', username: 'admin', displayName: 'Quản Trị Viên (Dev)', role: 'Admin', balance: 999999, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', username: 'staff1', displayName: 'Kiểm Duyệt Viên 1', role: 'Staff', balance: 50000, isActive: true, createdAt: '2026-02-15T00:00:00Z' },
        { id: '3', username: 'user_qa', displayName: 'Người Dùng QA', role: 'User', balance: 10000, isActive: true, createdAt: '2026-03-20T00:00:00Z' },
      ]
    }
    throw error
  }
}
export const updateAdminUserRole = (id, role) => authorizedRequest(`api/admin/users/${id}/role`, {
  method: 'PUT', body: JSON.stringify({ role }),
})
export const updateAdminUserStatus = (id, isActive) => authorizedRequest(`api/admin/users/${id}/status`, {
  method: 'PUT', body: JSON.stringify({ isActive }),
})
export const getAdminTopUps = (status = '') =>
  authorizedRequest('api/admin/top-ups', {}, { status })
export const reviewAdminTopUp = (id, status, staffNote = '') =>
  authorizedRequest(`api/admin/top-ups/${encodeURIComponent(id)}/review`, {
    method: 'PUT', body: JSON.stringify({ status, staffNote }),
  })
export const getAdminEvents = () => authorizedRequest('api/admin/events')
export const createAdminEvent = (event) => mutateAndInvalidate('api/admin/events', {
  method: 'POST', body: JSON.stringify(event),
}, 'api/events')
export const updateAdminEvent = (event) => mutateAndInvalidate(`api/admin/events/${encodeURIComponent(event.id)}`, {
  method: 'PUT', body: JSON.stringify(event),
}, 'api/events')
export const deleteAdminEvent = (id) => mutateAndInvalidate(`api/admin/events/${encodeURIComponent(id)}`, {
  method: 'DELETE',
}, 'api/events')
export const getAdminReleases = () => authorizedRequest('api/admin/releases')
export const createAdminRelease = (release) => mutateAndInvalidate('api/admin/releases', {
  method: 'POST', body: JSON.stringify(release),
}, 'api/releases')
export const updateAdminRelease = (release) => mutateAndInvalidate(`api/admin/releases/${encodeURIComponent(release.id)}`, {
  method: 'PUT', body: JSON.stringify(release),
}, 'api/releases')
export const deleteAdminRelease = (id) => mutateAndInvalidate(`api/admin/releases/${encodeURIComponent(id)}`, {
  method: 'DELETE',
}, 'api/releases')

export const getAdminTierRankingStats = async () => {
  try {
    return await authorizedRequest('api/admin/tier-ranking/stats')
  } catch (error) {
    if (import.meta.env?.DEV) {
      return {
        totalVotes: 1240,
        votedCount: 42,
        characters: [
          { id: '100316-urplus', nameVi: 'Rover UR+', nameEn: 'Rover UR+', tier: 'SS+', baseVotes: 100, communityVotes: 450 },
          { id: '100314-urplus', nameVi: 'G5 UR+', nameEn: 'G5 UR+', tier: 'SS+', baseVotes: 80, communityVotes: 320 },
          { id: '100312-urplus', nameVi: 'Nyan UR+', nameEn: 'Nyan UR+', tier: 'SS', baseVotes: 50, communityVotes: 210 },
          { id: '100029-urplus', nameVi: 'Amai Mask UR+', nameEn: 'Amai Mask UR+', tier: 'S', baseVotes: 30, communityVotes: 180 },
        ],
      }
    }
    throw error
  }
}

export const updateAdminBaseVotes = async (characterId, baseVotes) => {
  try {
    return await authorizedRequest(`api/admin/tier-ranking/${encodeURIComponent(characterId)}/base-votes`, {
      method: 'PUT', body: JSON.stringify({ baseVotes }),
    })
  } catch (error) {
    if (import.meta.env?.DEV) return { success: true, baseVotes }
    throw error
  }
}

export const getAdminCommunityFeed = async () => {
  try {
    return await authorizedRequest('api/admin/community/feed')
  } catch (error) {
    if (import.meta.env?.DEV) {
      return {
        topics: [
          { id: 1, title: 'Thảo luận xây dựng đội hình Rover UR+', author: 'user_qa', postCount: 14, isLocked: false, createdAt: new Date().toISOString(), contentSnippet: 'Rover UR+ có khả năng chống chịu cực mạnh khi kết hợp với bộ ấn...' },
          { id: 2, title: 'Hướng dẫn tham gia sự kiện Mirage Trial', author: 'staff1', postCount: 8, isLocked: true, createdAt: new Date().toISOString(), contentSnippet: 'Tổng hợp các mẹo vượt ải Mirage Trial nhận phần thưởng tối đa...' },
        ],
        comments: [
          { id: 101, author: 'user_qa', content: 'Sự kiện này quà ngon thật!', eventId: 'event-mirage-2026', createdAt: new Date().toISOString() },
          { id: 102, author: 'gamer99', content: 'Bao giờ ra mắt banner Tatsumaki UR+ vậy mọi người?', eventId: 'event-banner-jul', createdAt: new Date().toISOString() },
        ],
      }
    }
    throw error
  }
}

export const toggleAdminForumTopicLock = async (id, isLocked) => {
  try {
    return await authorizedRequest(`api/admin/community/topics/${id}/lock`, {
      method: 'PUT', body: JSON.stringify({ isLocked }),
    })
  } catch (error) {
    if (import.meta.env?.DEV) return { success: true, isLocked }
    throw error
  }
}

export const deleteAdminForumTopic = async (id) => {
  try {
    return await authorizedRequest(`api/admin/community/topics/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    if (import.meta.env?.DEV) return { success: true }
    throw error
  }
}

export const deleteAdminEventComment = async (id) => {
  try {
    return await authorizedRequest(`api/admin/community/comments/${id}`, {
      method: 'DELETE',
    })
  } catch (error) {
    if (import.meta.env?.DEV) return { success: true }
    throw error
  }
}

export const isAdminApiConfigured = isSameOriginApiAvailable
