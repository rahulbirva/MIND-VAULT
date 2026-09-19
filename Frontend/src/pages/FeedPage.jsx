import { useState, useEffect } from 'react'
import { getFeed, saveFeedItem, dismissFeedItem } from '../api.js'
import { isPostLiked, toggleLikePost } from '../utils/vaultStore.js'

/* ── Category → Visual Config ─────────────────────────────── */
const CAT_CONFIG = {
  Space:       { emoji: '🌌', grad: 'linear-gradient(135deg,#2B2B5E 0%,#1A1A3A 100%)', text: '#fff' },
  Technology:  { emoji: '⚡', grad: 'linear-gradient(135deg,#5D0D18 0%,#8B1A28 100%)', text: '#fff' },
  History:     { emoji: '📜', grad: 'linear-gradient(135deg,#A07850 0%,#6B4F2A 100%)', text: '#fff' },
  Science:     { emoji: '🔬', grad: 'linear-gradient(135deg,#2E7D5A 0%,#1A5C3A 100%)', text: '#fff' },
  Philosophy:  { emoji: '🧠', grad: 'linear-gradient(135deg,#5D6BA0 0%,#3A4575 100%)', text: '#fff' },
  Economics:   { emoji: '📊', grad: 'linear-gradient(135deg,#8C7B6E 0%,#5A4A3F 100%)', text: '#fff' },
  Psychology:  { emoji: '💭', grad: 'linear-gradient(135deg,#C4956A 0%,#8B5E3C 100%)', text: '#fff' },
  Biology:     { emoji: '🌿', grad: 'linear-gradient(135deg,#5C8A6E 0%,#2E5C45 100%)', text: '#fff' },
  Mathematics: { emoji: '∞',  grad: 'linear-gradient(135deg,#5D6BA0 0%,#3A4575 100%)', text: '#fff' },
  Politics:    { emoji: '🗳️', grad: 'linear-gradient(135deg,#3A3A6E 0%,#1E1E48 100%)', text: '#fff' },
  Health:      { emoji: '🌿', grad: 'linear-gradient(135deg,#5C8A6E 0%,#2E5C45 100%)', text: '#fff' },
  Art:         { emoji: '🎨', grad: 'linear-gradient(135deg,#7B5EA7 0%,#4A3470 100%)', text: '#fff' },
}
const DEFAULT_CFG = { emoji: '📚', grad: 'linear-gradient(135deg,#9FB2AC 0%,#6F8E87 100%)', text: '#fff' }

const FALLBACK_TOPIC_IMAGES = {
  Space:       'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  Technology:  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  History:     'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
  Science:     'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
  Philosophy:  'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80',
  Economics:   'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  Psychology:  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
  Biology:     'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
  Mathematics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
  Politics:    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
  Health:      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
  Art:         'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
  default:     'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
}

function getFallbackImage(cat) {
  return FALLBACK_TOPIC_IMAGES[cat] || FALLBACK_TOPIC_IMAGES.default
}

function deriveTags(topic = '', cat = '') {
  const cleanCategory = cat ? cat.replace(/\s+/g, '') : 'Insight'
  const tags = [cleanCategory]
  const words = topic.split(/[\s:,-]+/).filter(w => w.length > 3 && !['about', 'their', 'which', 'there', 'where', 'these', 'those', 'under', 'after', 'with', 'from'].includes(w.toLowerCase()))
  for (const w of words.slice(0, 2)) {
    const cleanWord = w.replace(/[^a-zA-Z0-9]/g, '')
    if (cleanWord && !tags.some(t => t.toLowerCase() === cleanWord.toLowerCase())) {
      tags.push(cleanWord)
    }
  }
  tags.push('MindVault')
  return tags.slice(0, 4)
}

/**
 * Derive a display category from the topic string.
 * Checks if any known category name is a substring of the topic.
 */
function catFromTopic(topic = '') {
  const lower = topic.toLowerCase()
  return (
    Object.keys(CAT_CONFIG).find(c => lower.includes(c.toLowerCase())) || 'General'
  )
}

/** Map a backend FeedItem to what the card UI expects. */
function mapItem(item) {
  const cat = catFromTopic(item.topic)
  const keyPoints = Array.isArray(item.keyPoints) ? item.keyPoints : []
  return {
    _id:       item._id,
    cat,
    title:     item.topic,
    body:      item.body || item.summary || '',
    keyPoints,
    imageUrl:  item.imageUrl || getFallbackImage(cat),
    tags:      deriveTags(item.topic, cat),
    videoUrl:  item.videoUrl,
  }
}

/* ── Skeleton Card ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <article className="post-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 140, borderRadius: 0 }} />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton sk-line sk-short" />
        <div className="skeleton sk-title" />
        <div className="skeleton sk-line" />
        <div className="skeleton sk-line sk-med" />
      </div>
    </article>
  )
}

/* ── Single Feed Post Card ─────────────────────────────────── */
function FeedPostCard({ item, liked, likeCount, onToggleLike, onSave, saved, onDismiss, isNew }) {
  const cfg = CAT_CONFIG[item.cat] || DEFAULT_CFG
  const [animatingHeart, setAnimatingHeart] = useState(false)

  function handleLike() {
    onToggleLike()
    if (!liked) {
      setAnimatingHeart(true)
      setTimeout(() => setAnimatingHeart(false), 600)
    }
  }

  return (
    <article className="post-card">
      {/* ── Banner ── */}
      <div className="post-banner" style={{ background: cfg.grad }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="post-banner-img"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = getFallbackImage(item.cat)
            }}
          />
        )}
        <div className="post-banner-overlay" />
        <div className="post-banner-badge-row">
          <div className="post-banner-cat">{cfg.emoji} {item.cat}</div>
          <div className="post-banner-pill">{isNew ? '⚡ New Article' : 'Curated'}</div>
        </div>
      </div>

      {/* ── Post Header ── */}
      <div className="post-header">
        <div className="post-avatar" style={{ background: cfg.grad }}>
          <span>{cfg.emoji}</span>
        </div>
        <div className="post-meta">
          <span className="post-username">MindVault · {item.cat}</span>
          <span className="post-time">{isNew ? 'Just arrived' : 'Curated insight'}</span>
        </div>
        {onDismiss && (
          <button
            className="post-dismiss-btn"
            onClick={onDismiss}
            title="Mark as seen (remove from feed)"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #888)',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Action Bar ── */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button
            className={`post-action-btn post-like-btn${liked ? ' liked' : ''}`}
            onClick={handleLike}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <span className={`heart-icon${animatingHeart ? ' heart-burst' : ''}`}>
              {liked ? '❤️' : '🤍'}
            </span>
          </button>

          <button className="post-action-btn" aria-label="Comment">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          <button className="post-action-btn" aria-label="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Save to vault */}
          <button
            className={`post-action-btn post-bookmark-btn${saved ? ' bookmarked' : ''}`}
            onClick={onSave}
            aria-label={saved ? 'Saved to vault' : 'Save to vault'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Like Count ── */}
      <div className="post-likes-count">
        <strong>{likeCount.toLocaleString()} likes</strong>
      </div>

      {/* ── Caption ── */}
      <div className="post-caption">
        <span className="post-caption-user">mindvault</span>
        {' '}{item.title}
      </div>

      {/* ── In-Depth Body Content ── */}
      <div className="post-body">
        {item.body ? (
          item.body.split(/\n\s*\n/).map((para, pIdx) => (
            <p key={pIdx} className="post-paragraph">
              {para.trim()}
            </p>
          ))
        ) : (
          <p className="post-paragraph">{item.title}</p>
        )}
      </div>

      {/* ── Key Takeaways & Core Principles ── */}
      {item.keyPoints && item.keyPoints.length > 0 && (
        <div className="post-keypoints-box">
          <div className="post-keypoints-title">
            <span>💡</span> Core Principles & Takeaways
          </div>
          <ul className="post-keypoints-list">
            {item.keyPoints.map((point, ptIdx) => (
              <li key={ptIdx} className="post-keypoint-item">
                <span className="post-keypoint-dot">▸</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Hashtags ── */}
      <div className="post-hashtags">
        {item.tags.map(t => (
          <span key={t} className="post-hashtag">#{t}</span>
        ))}
      </div>

      {saved && (
        <div className="post-saved-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Saved to vault
        </div>
      )}
    </article>
  )
}

/* ── Feed Page ─────────────────────────────────────────────── */
export default function FeedPage({ userId, navigate, showToast, refreshTrigger }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg] = useState('')
  const [likes, setLikes] = useState({})
  const [likeCounts, setLikeCounts] = useState({})
  const [saved, setSaved] = useState({}) // { [_id]: true }

  useEffect(() => {
    if (!userId) {
      setStatus('error')
      setErrorMsg('No user found. Please go back and set your interests first.')
      return
    }
    // Check if the browser page was reloaded (F5 / refresh) or triggered from Navbar/tabs
    const isBrowserReload = (performance.getEntriesByType('navigation')?.[0]?.type === 'reload')
    loadFeed(isBrowserReload || (refreshTrigger > 0))
  }, [userId, refreshTrigger])

  async function loadFeed(isReload = false) {
    setStatus('loading')
    try {
      const raw = await getFeed(userId, isReload)
      const mapped = []
      const seenIds = new Set()
      const seenTitles = new Set()
      for (const r of raw) {
        const item = mapItem(r)
        const titleKey = (item.title || '').trim().toLowerCase()
        if ((!item._id || !seenIds.has(item._id)) && !seenTitles.has(titleKey)) {
          if (item._id) seenIds.add(item._id)
          seenTitles.add(titleKey)
          mapped.push(item)
        }
      }
      setItems(mapped)
      setLikes(Object.fromEntries(mapped.map((item, i) => [i, isPostLiked(userId, item._id, item.title)])))
      setLikeCounts(Object.fromEntries(mapped.map((item, i) => [i, (isPostLiked(userId, item._id, item.title) ? 1 : 0) + Math.floor(Math.random() * 200) + 50])))
      setStatus('ok')
      if (isReload && showToast) {
        showToast('✨ Feed updated with fresh articles!')
      }

      // Animate cards in safely after DOM mount
      setTimeout(() => {
        if (typeof window !== 'undefined' && typeof window.anime !== 'undefined') {
          window.anime({
            targets: '.post-card',
            opacity: [0, 1],
            translateY: [16, 0],
            delay: window.anime.stagger(60, { start: 50 }),
            duration: 400,
            easing: 'easeOutExpo',
          })
        }
      }, 50)
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function handleToggleLike(i) {
    const item = items[i]
    if (!item) return
    const isNowLiked = toggleLikePost(userId, item)
    setLikes(prev => ({ ...prev, [i]: isNowLiked }))
    setLikeCounts(prev => ({
      ...prev,
      [i]: Math.max(0, (prev[i] || 0) + (isNowLiked ? 1 : -1)),
    }))
    if (showToast) {
      showToast(isNowLiked ? '❤️ Added to Liked Posts in Vault' : 'Removed from Liked Posts')
    }
  }

  async function handleDismiss(id) {
    try {
      if (id) {
        await dismissFeedItem(id)
      }
      setItems(prev => prev.filter(item => item._id !== id))
      showToast('Article marked as seen')
    } catch (err) {
      console.error('Dismiss failed:', err)
    }
  }

  async function handleSave(item) {
    if (saved[item._id]) return
    try {
      const activeUid = userId || 'default_user'
      await saveFeedItem(item._id, activeUid)
      setSaved(prev => ({ ...prev, [item._id]: true }))
      showToast('📌 Saved to your vault')
      window.dispatchEvent(new CustomEvent('mindvault_vault_updated', { detail: { type: 'save' } }))
    } catch (err) {
      showToast(`Failed to save: ${err.message}`)
    }
  }

  const totalLiked = Object.values(likes).filter(Boolean).length

  return (
    <div className="disc-wrap page-enter">
      {/* ── Header ── */}
      <div className="disc-header">
        <div className="disc-header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="page-title" style={{ margin: 0 }}>Your feed</h1>
              <button
                className="btn btn-ghost"
                onClick={() => loadFeed(true)}
                title="Reload feed (fetch new articles, retire seen)"
                style={{ fontSize: '12px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '20px' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Reload Feed
              </button>
            </div>
            <p className="page-subtitle" style={{ marginTop: 4 }}>Simplified knowledge tailored to your interests</p>
          </div>
          <div className="disc-header-stats">
            <div className="disc-stat">
              <span className="disc-stat-num">{items.length}</span>
              <span className="disc-stat-label">posts</span>
            </div>
            <div className="disc-stat">
              <span className="disc-stat-num">{totalLiked}</span>
              <span className="disc-stat-label">liked</span>
            </div>
            <div className="disc-stat">
              <span className="disc-stat-num">{Object.values(saved).filter(Boolean).length}</span>
              <span className="disc-stat-label">saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="disc-feed">
        {status === 'loading' && (
          [1, 2, 3].map(n => <SkeletonCard key={n} />)
        )}

        {status === 'error' && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3 className="empty-title">Could not load your feed</h3>
            <p className="empty-sub">{errorMsg}</p>
            <button className="btn btn-primary" onClick={() => loadFeed(true)} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ok' && items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">Your feed is caught up!</h3>
            <p className="empty-sub">All previous articles were seen. Hit "Reload Feed" to generate fresh ones.</p>
            <button className="btn btn-primary" onClick={() => loadFeed(true)} style={{ marginTop: 12 }}>
              Fetch Fresh Articles
            </button>
          </div>
        )}

        {status === 'ok' && items.map((item, i) => (
          <FeedPostCard
            key={item._id || i}
            item={item}
            isNew={i === 0}
            liked={likes[i]}
            likeCount={likeCounts[i] ?? 100}
            onToggleLike={() => handleToggleLike(i)}
            onSave={() => handleSave(item)}
            saved={!!saved[item._id]}
            onDismiss={() => handleDismiss(item._id)}
          />
        ))}
      </div>
    </div>
  )
}
