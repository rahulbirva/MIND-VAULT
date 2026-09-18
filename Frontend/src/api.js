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
export const getFeed = (userId) =>
  request('GET', `/feed?userId=${encodeURIComponent(userId)}`)

/** Save a FeedItem to the user's vault (sourceType: "saved"). */
export const saveFeedItem = (feedItemId, userId) =>
  request('POST', `/feed/${feedItemId}/save`, { userId })

// ── Discovery ─────────────────────────────────────────────────────────────────
/** Fetch the daily rotating discovery feed. */
export const getDiscovery = () => request('GET', '/discovery')

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
