/**
 * vaultStore.js
 * Local persistence, category classification, and hashtag generation for Liked & Saved posts in MindVault.
 */

const LIKES_KEY_PREFIX = 'mv_liked_posts_'
const SAVES_KEY_PREFIX = 'mv_saved_posts_'

const KNOWN_CATEGORIES = [
  'Finance', 'Rights', 'Safety', 'Space', 'Technology', 'Science',
  'Philosophy', 'Economics', 'Psychology', 'Biology', 'Mathematics',
  'Politics', 'Health', 'Art', 'Climate', 'Architecture', 'Linguistics',
  'Everyday Tech', 'Cognitive Models', 'Everyday Engineering', 'Fascinating Knowledge'
]

const CATEGORY_ICONS = {
  Finance: '💳',
  Rights: '⚖️',
  Safety: '🛡️',
  Space: '🌌',
  Technology: '⚡',
  Science: '🔬',
  Philosophy: '🧠',
  Economics: '📊',
  Psychology: '💭',
  Biology: '🌿',
  Mathematics: '∞',
  Politics: '🗳️',
  Health: '🩺',
  Art: '🎨',
  Climate: '🌍',
  Architecture: '🏛️',
  Linguistics: '🗣️',
  'Everyday Tech': '📶',
  'Cognitive Models': '🧩',
  'Everyday Engineering': '⚙️',
  'Fascinating Knowledge': '✨',
  General: '📚',
}

export function getCategoryIcon(cat = 'General') {
  return CATEGORY_ICONS[cat] || '📚'
}

/**
 * Derive clean category from topic string and raw category
 */
export function deriveCategory(topic = '', rawCat = '') {
  if (rawCat && KNOWN_CATEGORIES.includes(rawCat)) return rawCat
  const lower = (topic || '').toLowerCase()
  if (lower.includes('credit') || lower.includes('saving') || lower.includes('tax') || lower.includes('money') || lower.includes('budget') || lower.includes('finance') || lower.includes('loan') || lower.includes('invest')) return 'Finance'
  if (lower.includes('tenant') || lower.includes('police') || lower.includes('right') || lower.includes('airline') || lower.includes('warrant') || lower.includes('law') || lower.includes('legal')) return 'Rights'
  if (lower.includes('heimlich') || lower.includes('burn') || lower.includes('fire') || lower.includes('cpr') || lower.includes('choking') || lower.includes('safety') || lower.includes('first aid')) return 'Safety'
  if (lower.includes('space') || lower.includes('galaxy') || lower.includes('telescope') || lower.includes('orbit') || lower.includes('black hole') || lower.includes('moon') || lower.includes('mars') || lower.includes('solar')) return 'Space'
  if (lower.includes('quantum') || lower.includes('ai') || lower.includes('algorithm') || lower.includes('network') || lower.includes('computer') || lower.includes('software') || lower.includes('code') || lower.includes('tech')) return 'Technology'
  if (lower.includes('biology') || lower.includes('dna') || lower.includes('cell') || lower.includes('ocean') || lower.includes('species') || lower.includes('biolum')) return 'Biology'
  if (lower.includes('economic') || lower.includes('inflation') || lower.includes('game theory') || lower.includes('market') || lower.includes('supply')) return 'Economics'
  if (lower.includes('psycholog') || lower.includes('bias') || lower.includes('cognitive') || lower.includes('brain') || lower.includes('memory') || lower.includes('habit')) return 'Psychology'
  if (lower.includes('philosoph') || lower.includes('ethics') || lower.includes('stoic') || lower.includes('logic')) return 'Philosophy'
  if (lower.includes('health') || lower.includes('sleep') || lower.includes('nutrition') || lower.includes('diet') || lower.includes('circadian') || lower.includes('exercise')) return 'Health'
  if (lower.includes('history') || lower.includes('rome') || lower.includes('empire') || lower.includes('war') || lower.includes('renaissance') || lower.includes('ancient')) return 'History'
  
  const found = KNOWN_CATEGORIES.find(c => lower.includes(c.toLowerCase()))
  return found || (rawCat ? rawCat : 'General')
}

/**
 * Derive rich hashtag list with '#' prefix from topic and category
 */
export function deriveHashtags(topic = '', category = '') {
  const cat = category || deriveCategory(topic)
  const cleanCatTag = `#${cat.replace(/\s+/g, '')}`
  const tags = [cleanCatTag]

  const stopWords = new Set([
    'about', 'their', 'which', 'there', 'where', 'these', 'those', 'under',
    'after', 'with', 'from', 'into', 'that', 'this', 'what', 'when', 'your',
    'how', 'why', 'core', 'laws', 'principles', 'investigation', 'study', 'reference'
  ])

  const words = (topic || '')
    .split(/[\s:,\-_/()]+/)
    .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(w => w.length >= 3 && !stopWords.has(w.toLowerCase()))

  for (const w of words) {
    const formattedTag = `#${w.charAt(0).toUpperCase() + w.slice(1)}`
    if (!tags.some(t => t.toLowerCase() === formattedTag.toLowerCase()) && tags.length < 4) {
      tags.push(formattedTag)
    }
  }

  if (!tags.includes('#MindVault') && tags.length < 5) {
    tags.push('#MindVault')
  }

  return tags
}

function getStorageKey(prefix, userId) {
  return `${prefix}${userId || 'guest'}`
}

/**
 * Get all liked posts for a user with category and hashtags guaranteed
 */
export function getLikedPosts(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(LIKES_KEY_PREFIX, userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(item => {
      const cat = deriveCategory(item.topic || item.title, item.cat || item.category)
      const hashtags = (Array.isArray(item.tags) && item.tags.length > 0)
        ? item.tags.map(t => (t.startsWith('#') ? t : `#${t}`))
        : deriveHashtags(item.topic || item.title, cat)
      return {
        ...item,
        cat,
        tags: hashtags,
      }
    })
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
 * Add or update a liked post with category and hashtags
 */
export function saveLikedPost(userId, post) {
  if (!post) return
  const list = getLikedPosts(userId)
  const postId = post._id
  const topicTitle = post.topic || post.title || 'Untitled Post'
  const cleanTopic = topicTitle.trim().toLowerCase()

  const exists = list.some(item => (postId && item._id === postId) || (cleanTopic && (item.topic || item.title || '').trim().toLowerCase() === cleanTopic))
  if (!exists) {
    const cat = deriveCategory(topicTitle, post.cat || post.category)
    const hashtags = (Array.isArray(post.tags) && post.tags.length > 0)
      ? post.tags.map(t => (t.startsWith('#') ? t : `#${t}`))
      : deriveHashtags(topicTitle, cat)

    const enrichedPost = {
      _id: post._id || `liked_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      topic: topicTitle,
      title: topicTitle,
      body: post.body || post.summary || '',
      summary: post.summary || post.body || '',
      keyPoints: Array.isArray(post.keyPoints) ? post.keyPoints : (Array.isArray(post.keyFacts) ? post.keyFacts : []),
      tags: hashtags,
      imageUrl: post.imageUrl || null,
      videoUrl: post.videoUrl || null,
      cat,
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
