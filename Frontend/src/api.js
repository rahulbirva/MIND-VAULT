/**
 * api.js — MindVault API client
 * All backend calls go through here. Uses native fetch + /api proxy.
 */

const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }
  return data
}

// ── User ───────────────────────────────────────────────────────────────────────
/** Fetch full user profile including username, email, and interests. */
export const getUserProfile = (userId) =>
  request('GET', `/user/profile?userId=${encodeURIComponent(userId)}`)

/** Create or replace a user's interests. Omit userId to create a new user. */
export const upsertInterests = (userId, interests) =>
  request('POST', '/user/interests', { ...(userId ? { userId } : {}), interests })

/** Add a single interest to the user's profile. */
export const addInterest = (userId, interest) =>
  request('POST', '/user/interests/add', { userId, interest })

/** Remove a single interest from the user's profile. */
export const removeInterest = (userId, interest) =>
  request('DELETE', '/user/interests', { userId, interest })

// ── Auth ───────────────────────────────────────────────────────────────────────
/** Sign up a new account. Returns { userId, username }. */
export const signup = (email, username, password) =>
  request('POST', '/auth/signup', { email, username, password })

/** Log in with username + password. Returns { userId, username, hasInterests }. */
export const login = (username, password) =>
  request('POST', '/auth/login', { username, password })

// ── Feed ───────────────────────────────────────────────────────────────────────
/** Fetch the personalised interest feed for a user. */
export const getFeed = (userId, reload = false) =>
  request('GET', `/feed?userId=${encodeURIComponent(userId)}${reload ? '&reload=true' : ''}`)

/** Save a FeedItem to the user's vault (sourceType: "saved"). */
export const saveFeedItem = (feedItemId, userId) =>
  request('POST', `/feed/${feedItemId}/save`, { userId })

/** Mark a FeedItem as seen/dismissed so it leaves the feed. */
export const dismissFeedItem = (feedItemId) =>
  request('POST', `/feed/${feedItemId}/dismiss`)

// ── Discovery ─────────────────────────────────────────────────────────────────
/** Fetch the practical discovery feed (excluding user interests, zero duplicate topics). */
export const getDiscovery = (userId = '', refresh = false) =>
  request('GET', `/discovery?userId=${encodeURIComponent(userId || '')}${refresh ? '&refresh=true' : ''}`)

/** Fetch an autonomous proactive discovery post synthesized from real web knowledge. */
export const getDailyDiscoveryPost = (userId = 'default_user') =>
  request('POST', '/discovery/daily-post', { userId })



// ── Vault ─────────────────────────────────────────────────────────────────────
/** Fetch all vault items for a user, optionally filtered by sourceType. */
export const getVault = (userId, sourceType = '') =>
  request('GET', `/vault?userId=${encodeURIComponent(userId)}${sourceType ? `&sourceType=${encodeURIComponent(sourceType)}` : ''}`)

/** Persist a liked post directly to MongoDB database. */
export const likeVaultPost = (userId, post) =>
  request('POST', '/vault/like', {
    userId,
    topic: post.topic || post.title,
    body: post.body || post.summary || '',
    summary: post.summary || post.body || '',
    keyFacts: post.keyFacts || post.keyPoints || [],
    imageUrl: post.imageUrl || null,
    videoUrl: post.videoUrl || null,
    cat: post.cat || post.category || '',
    tags: post.tags || [],
  })

/** Remove a liked post from MongoDB database. */
export const unlikeVaultPost = (userId, topic) =>
  request('POST', '/vault/unlike', { userId, topic })

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = () => request('GET', '/health')
