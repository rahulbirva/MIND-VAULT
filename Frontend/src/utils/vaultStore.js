/**
 * vaultStore.js
 * Local persistence and sync for Liked & Saved posts in MindVault.
 */

const LIKES_KEY_PREFIX = 'mv_liked_posts_'
const SAVES_KEY_PREFIX = 'mv_saved_posts_'

function getStorageKey(prefix, userId) {
  return `${prefix}${userId || 'guest'}`
}

/**
 * Get all liked posts for a user
 */
export function getLikedPosts(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(LIKES_KEY_PREFIX, userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to parse liked posts from localStorage:', err)
    return []
  }
}

/**
 * Check if a post is liked
 */
export function isPostLiked(userId, postId, topic) {
  const list = getLikedPosts(userId)
  const cleanTopic = (topic || '').trim().toLowerCase()
  return list.some(item => (postId && item._id === postId) || (cleanTopic && (item.topic || item.title || '').trim().toLowerCase() === cleanTopic))
}

/**
 * Add or update a liked post
 */
export function saveLikedPost(userId, post) {
  if (!post) return
  const list = getLikedPosts(userId)
  const postId = post._id
  const cleanTopic = (post.topic || post.title || '').trim().toLowerCase()

  const exists = list.some(item => (postId && item._id === postId) || (cleanTopic && (item.topic || item.title || '').trim().toLowerCase() === cleanTopic))
  if (!exists) {
    const enrichedPost = {
      _id: post._id || `liked_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      topic: post.topic || post.title || 'Untitled Post',
      title: post.topic || post.title || 'Untitled Post',
      body: post.body || post.summary || '',
      summary: post.summary || post.body || '',
      keyPoints: Array.isArray(post.keyPoints) ? post.keyPoints : (Array.isArray(post.keyFacts) ? post.keyFacts : []),
      tags: Array.isArray(post.tags) ? post.tags : [],
      imageUrl: post.imageUrl || null,
      videoUrl: post.videoUrl || null,
      cat: post.cat || post.category || 'General',
      likedAt: new Date().toISOString(),
      sourceType: 'liked',
    }
    const updated = [enrichedPost, ...list]
    try {
      localStorage.setItem(getStorageKey(LIKES_KEY_PREFIX, userId), JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('mindvault_vault_updated', { detail: { type: 'like', count: updated.length } }))
    } catch (e) {
      console.warn('LocalStorage full or error saving liked post:', e)
    }
  }
}

/**
 * Remove a post from liked list
 */
export function removeLikedPost(userId, postId, topic) {
  const list = getLikedPosts(userId)
  const cleanTopic = (topic || '').trim().toLowerCase()
  const filtered = list.filter(item => {
    if (postId && item._id === postId) return false
    if (cleanTopic && (item.topic || item.title || '').trim().toLowerCase() === cleanTopic) return false
    return true
  })
  try {
    localStorage.setItem(getStorageKey(LIKES_KEY_PREFIX, userId), JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('mindvault_vault_updated', { detail: { type: 'unlike', count: filtered.length } }))
  } catch (e) {
    console.warn('Error updating liked posts:', e)
  }
}

/**
 * Toggle like status for a post
 */
export function toggleLikePost(userId, post) {
  if (!post) return false
  const liked = isPostLiked(userId, post._id, post.topic || post.title)
  if (liked) {
    removeLikedPost(userId, post._id, post.topic || post.title)
    return false
  } else {
    saveLikedPost(userId, post)
    return true
  }
}
