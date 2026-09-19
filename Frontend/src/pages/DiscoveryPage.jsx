import { useState, useEffect } from 'react'
import { getDiscovery, saveFeedItem } from '../api.js'
import { isPostLiked, toggleLikePost } from '../utils/vaultStore.js'

/* ── Category → Visual Config ─────────────────────────────── */
const CAT_CONFIG = {
  Finance:              { emoji: '💳', grad: 'linear-gradient(135deg,#1E3A8A 0%,#0F172A 100%)',   text: '#fff' },
  Rights:               { emoji: '⚖️', grad: 'linear-gradient(135deg,#7C2D12 0%,#451A03 100%)',   text: '#fff' },
  Safety:               { emoji: '🛡️', grad: 'linear-gradient(135deg,#B91C1C 0%,#7F1D1D 100%)',   text: '#fff' },
  'Everyday Tech':      { emoji: '📶', grad: 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)',   text: '#fff' },
  'Cognitive Models':   { emoji: '🧩', grad: 'linear-gradient(135deg,#4338CA 0%,#312E81 100%)',   text: '#fff' },
  'Everyday Engineering': { emoji: '⚙️', grad: 'linear-gradient(135deg,#047857 0%,#064E3B 100%)', text: '#fff' },
  'Fascinating Knowledge': { emoji: '✨', grad: 'linear-gradient(135deg,#6B21A8 0%,#4C1D95 100%)', text: '#fff' },
  Linguistics:          { emoji: '🗣️', grad: 'linear-gradient(135deg,#9FB2AC 0%,#6F8E87 100%)',   text: '#fff' },
  Psychology:           { emoji: '🧠', grad: 'linear-gradient(135deg,#C4956A 0%,#8B5E3C 100%)',   text: '#fff' },
  Biology:              { emoji: '🌿', grad: 'linear-gradient(135deg,#5C8A6E 0%,#2E5C45 100%)',   text: '#fff' },
  Mathematics:          { emoji: '∞',  grad: 'linear-gradient(135deg,#5D6BA0 0%,#3A4575 100%)',   text: '#fff' },
  Architecture:         { emoji: '🏛️', grad: 'linear-gradient(135deg,#8C7B6E 0%,#5A4A3F 100%)',   text: '#fff' },
  Space:                { emoji: '🌌', grad: 'linear-gradient(135deg,#2B2B5E 0%,#1A1A3A 100%)',   text: '#fff' },
  History:              { emoji: '📜', grad: 'linear-gradient(135deg,#A07850 0%,#6B4F2A 100%)',   text: '#fff' },
  Technology:           { emoji: '⚡', grad: 'linear-gradient(135deg,#5D0D18 0%,#8B1A28 100%)',   text: '#fff' },
  Science:              { emoji: '🔬', grad: 'linear-gradient(135deg,#2E7D5A 0%,#1A5C3A 100%)',   text: '#fff' },
}
const DEFAULT_CFG = { emoji: '💡', grad: 'linear-gradient(135deg,#4F46E5 0%,#312E81 100%)', text: '#fff' }

function catFromTopic(topic = '') {
  const lower = topic.toLowerCase()
  if (lower.includes('credit') || lower.includes('saving') || lower.includes('tax') || lower.includes('money') || lower.includes('budget') || lower.includes('finance')) return 'Finance'
  if (lower.includes('tenant') || lower.includes('police') || lower.includes('right') || lower.includes('airline') || lower.includes('warrant') || lower.includes('law')) return 'Rights'
  if (lower.includes('heimlich') || lower.includes('burn') || lower.includes('fire') || lower.includes('cpr') || lower.includes('choking') || lower.includes('safety')) return 'Safety'
  if (lower.includes('wifi') || lower.includes('battery') || lower.includes('password') || lower.includes('headphone') || lower.includes('microwave') || lower.includes('tech')) return 'Everyday Tech'
  if (lower.includes('feynman') || lower.includes('hanlon') || lower.includes('listening') || lower.includes('eye strain') || lower.includes('parkinson') || lower.includes('cognitive')) return 'Cognitive Models'
  if (lower.includes('p-trap') || lower.includes('air condition') || lower.includes('refrigerant') || lower.includes('circuit') || lower.includes('plumbing') || lower.includes('engineer')) return 'Everyday Engineering'
  if (lower.includes('atomic clock') || lower.includes('sky is blue') || lower.includes('bioluminescence') || lower.includes('gps') || lower.includes('relativity')) return 'Fascinating Knowledge'
  return Object.keys(CAT_CONFIG).find(c => lower.includes(c.toLowerCase())) || 'Practical Life'
}

function deriveTags(topic = '', cat = '') {
  const cleanCat = cat ? cat.replace(/\s+/g, '') : 'Insight'
  const tags = [cleanCat]
  const words = topic.split(/[\s:,-]+/).filter(w => w.length > 3 && !['about', 'their', 'which', 'there', 'where', 'these', 'those', 'under', 'after', 'with', 'from'].includes(w.toLowerCase()))
  for (const w of words.slice(0, 2)) {
    const cleanWord = w.replace(/[^a-zA-Z0-9]/g, '')
    if (cleanWord && !tags.some(t => t.toLowerCase() === cleanWord.toLowerCase())) {
      tags.push(cleanWord)
    }
  }
  tags.push('PracticalDaily')
  return tags.slice(0, 4)
}

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

function mapItem(item) {
  const title = item.topic || item.title || ''
  const cat = catFromTopic(title)
  const keyPoints = Array.isArray(item.keyPoints) && item.keyPoints.length > 0
    ? item.keyPoints
    : (Array.isArray(item.key_points) ? item.key_points : [])

  return {
    _id:   item._id,
    cat,
    title,
    body:  item.body || item.summary || '',
    keyPoints,
    imageUrl: item.imageUrl || item.image_url || getFallbackImage(cat),
    tags:  deriveTags(title, cat),
    videoUrl: item.videoUrl,
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

/* ── Single Post Card ─────────────────────────────────────── */
function PostCard({ item, liked, likeCount, onToggleLike, onSave, saved }) {
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
        </div>
      </div>

      {/* ── Post Header ── */}
      <div className="post-header">
        <div className="post-avatar" style={{ background: cfg.grad }}>
          <span>{cfg.emoji}</span>
        </div>
        <div className="post-meta">
          <span className="post-username">MindVault · {item.cat}</span>
          <span className="post-time">Practical discovery</span>
        </div>
        <button className="post-follow-btn">Explore</button>
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

        {/* Bookmark / Save */}
        <button
          className={`post-action-btn post-bookmark-btn${saved ? ' bookmarked' : ''}`}
          onClick={onSave}
          aria-label={saved ? 'Remove from vault' : 'Save to vault'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      {/* ── Like Count ── */}
      <div className="post-likes-count">
        <strong>{likeCount.toLocaleString()} likes</strong>
      </div>

      {/* ── Caption / Content ── */}
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

      {/* ── Key Takeaways / Practical Actions ── */}
      {item.keyPoints && item.keyPoints.length > 0 && (
        <div className="post-keypoints-box">
          <div className="post-keypoints-title">
            <span>💡</span> Practical Insights & Rules
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

      {/* ── Tags as Hashtags ── */}
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

/* ── Discovery Page ───────────────────────────────────────── */
export default function DiscoveryPage({ userId, showToast, navigate }) {
  const [items, setItems]   = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg] = useState('')
  const [likes, setLikes]   = useState({})
  const [likeCounts, setLikeCounts] = useState({})
  const [saved, setSaved]   = useState({}) // { [_id]: true }

  useEffect(() => {
    loadDiscovery(false)
  }, [userId])

  async function loadDiscovery(isRefresh = false) {
    setStatus('loading')
    try {
      const raw = await getDiscovery(userId, isRefresh)
      const mapped = raw.map(mapItem)
      setItems(mapped)
      setLikes(Object.fromEntries(mapped.map((item, i) => [i, isPostLiked(userId, item._id, item.title)])))
      setLikeCounts(Object.fromEntries(mapped.map((item, i) => [i, (isPostLiked(userId, item._id, item.title) ? 1 : 0) + Math.floor(Math.random() * 200) + 50])))
      setStatus('ok')

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
    setLikeCounts(prev => ({ ...prev, [i]: Math.max(0, (prev[i] || 0) + (isNowLiked ? 1 : -1)) }))
    if (showToast) {
      showToast(isNowLiked ? '❤️ Added to Liked Posts in Vault' : 'Removed from Liked Posts')
    }
  }

  async function handleSave(item) {
    const activeUid = userId || 'default_user'
    if (saved[item._id]) { showToast('Already saved to vault'); return }
    try {
      await saveFeedItem(item._id, activeUid)
      setSaved(prev => ({ ...prev, [item._id]: true }))
      showToast('📌 Saved to your vault')
      window.dispatchEvent(new CustomEvent('mindvault_vault_updated', { detail: { type: 'save' } }))
    } catch (err) {
      showToast(`Couldn't save: ${err.message}`)
    }
  }

  return (
    <div className="disc-wrap page-enter">
      {/* ── Header ── */}
      <div className="disc-header">
        <div className="disc-header-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="page-title" style={{ margin: 0 }}>Discovery</h1>
              <button
                className="btn btn-ghost"
                onClick={() => loadDiscovery(true)}
                title="Refresh practical discovery topics (guaranteed non-repeating)"
                style={{ fontSize: '12px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '20px' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                Refresh Discovery
              </button>
            </div>
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Practical life skills & serendipitous knowledge outside your usual interests
            </p>
          </div>
          <div className="disc-header-stats">
            <div className="disc-stat">
              <span className="disc-stat-num">{items.length}</span>
              <span className="disc-stat-label">posts</span>
            </div>
            <div className="disc-stat">
              <span className="disc-stat-num">{Object.values(likes).filter(Boolean).length}</span>
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
        {status === 'loading' && [1, 2, 3].map(n => <SkeletonCard key={n} />)}

        {status === 'error' && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3 className="empty-title">Could not load discovery</h3>
            <p className="empty-sub">{errorMsg}</p>
            <button className="btn btn-primary" onClick={loadDiscovery} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ok' && items.map((item, i) => (
          <PostCard
            key={item._id || i}
            item={item}
            liked={likes[i]}
            likeCount={likeCounts[i] ?? 100}
            onToggleLike={() => handleToggleLike(i)}
            onSave={() => handleSave(item)}
            saved={!!saved[item._id]}
          />
        ))}
      </div>
    </div>
  )
}
