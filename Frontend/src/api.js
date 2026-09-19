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
/** Create or update a user's interests. Omit userId to create a new user. */
export const upsertInterests = (userId, interests) =>
  request('POST', '/user/interests', { ...(userId ? { userId } : {}), interests })

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

/** Discover a new mental model synthesized from user vault concepts. */
export const discoverLaw = (vaultContext = []) =>
  request('POST', '/discover-law', { vaultContext })

/** Fetch an autonomous proactive discovery post synthesized from real web knowledge. */
export const getDailyDiscoveryPost = (userId = 'default_user') =>
  request('POST', '/discovery/daily-post', { userId })

// ── Deep Dive ─────────────────────────────────────────────────────────────────
/** Fetch crash-course content for a topic (does not persist). */
export const startDeepDive = (userId, topic) =>
  request('POST', '/deepdive', { userId, topic })

/** Submit quiz answers. Backend grades and optionally vaults the topic. */
export const submitAnswers = (userId, topic, questions, answers) =>
  request('POST', '/deepdive/answer', { userId, topic, questions, answers })

// ── Vault ─────────────────────────────────────────────────────────────────────
/** Fetch all vault items for a user, newest first. */
export const getVault = (userId) =>
  request('GET', `/vault?userId=${encodeURIComponent(userId)}`)

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = () => request('GET', '/health')

// ── LearnFeed ─────────────────────────────────────────────────────────────────
/** Fetch paginated LearnFeed posts (10–12 items per batch) with topic filtering */
export const getLearnFeed = (page = 1, limit = 10, tag = 'All') =>
  request('GET', `/learnfeed?page=${page}&limit=${limit}&tag=${encodeURIComponent(tag)}`)

/** Refresh LearnFeed posts with a fresh newly randomized 10–12 item batch */
export const refreshLearnFeed = (limit = 10, tag = 'All') =>
  request('POST', '/learnfeed/refresh', { limit, tag })

/** Toggle like state for a LearnFeed post */
export const likeLearnFeedPost = (id, isLiked) =>
  request('POST', `/learnfeed/${id}/like`, { isLiked })

/** Toggle bookmark state for a LearnFeed post */
export const bookmarkLearnFeedPost = (id, isBookmarked) =>
  request('POST', `/learnfeed/${id}/bookmark`, { isBookmarked })

/** Fetch discussion comments for a post */
export const getLearnFeedComments = (id) =>
  request('GET', `/learnfeed/${id}/comments`)

/** Submit a discussion comment for a post */
export const addLearnFeedComment = (id, text, username = 'you') =>
  request('POST', `/learnfeed/${id}/comments`, { text, username })

