import { useState, useEffect } from 'react'
import { getFeed, saveFeedItem } from '../api.js'

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
  return {
    _id:    item._id,
    cat:    catFromTopic(item.topic),
    title:  item.topic,
    body:   item.summary,
    tags:   (item.keyPoints || []).slice(0, 4),
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

/* ── Single Feed Post Card ─────────────────────────────────── */
function FeedPostCard({ item, liked, likeCount, onToggleLike, onDeepDive, onSave, saved }) {
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
        <div className="post-banner-emoji">{cfg.emoji}</div>
        <div className="post-banner-cat" style={{ color: cfg.text }}>{item.cat}</div>
        <div className="post-banner-deco post-banner-deco-1" />
        <div className="post-banner-deco post-banner-deco-2" />
        <div className="post-banner-pill">For you</div>
      </div>

      {/* ── Post Header ── */}
      <div className="post-header">
        <div className="post-avatar" style={{ background: cfg.grad }}>
          <span>{cfg.emoji}</span>
        </div>
        <div className="post-meta">
          <span className="post-username">MindVault · {item.cat}</span>
          <span className="post-time">In your interests</span>
        </div>
        <div className="post-interest-dot" />
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

          {/* Deep Dive CTA */}
          <button className="post-deep-dive-btn" onClick={onDeepDive} aria-label="Deep Dive">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Deep Dive
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

      {/* ── Body ── */}
      <p className="post-body">{item.body}</p>

      {/* ── Hashtags ── */}
      <div className="post-hashtags">
        {item.tags.map(t => (
          <span key={t} className="post-hashtag">#{t.replace(/\s+/g, '')}</span>
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
export default function FeedPage({ userId, navigate, showToast, openDeepDive }) {
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
    loadFeed()
  }, [userId])

  async function loadFeed() {
    setStatus('loading')
    try {
      const raw = await getFeed(userId)
      const mapped = raw.map(mapItem)
      setItems(mapped)
      setLikes(Object.fromEntries(mapped.map((_, i) => [i, false])))
      setLikeCounts(Object.fromEntries(mapped.map((_, i) => [i, Math.floor(Math.random() * 400) + 80])))
      setStatus('ok')

      // Animate cards in
      if (typeof window.anime !== 'undefined') {
        window.anime({
          targets: '.post-card',
          opacity: [0, 1],
          translateY: [24, 0],
          delay: window.anime.stagger(90),
          duration: 550,
          easing: 'easeOutExpo',
        })
      }
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function handleToggleLike(i) {
    setLikes(prev => ({ ...prev, [i]: !prev[i] }))
    setLikeCounts(prev => ({
      ...prev,
      [i]: prev[i] + (likes[i] ? -1 : 1),
    }))
  }

  async function handleSave(item) {
    if (saved[item._id]) return
    try {
      await saveFeedItem(item._id, userId)
      setSaved(prev => ({ ...prev, [item._id]: true }))
      showToast('📌 Saved to your vault')
    } catch (err) {
      showToast(`Failed to save: ${err.message}`)
    }
  }

  const totalLiked = Object.values(likes).filter(Boolean).length

  return (
    <div className="disc-wrap page-enter">
      {/* ── Header ── */}
      <div className="disc-header">
        <div className="disc-header-inner">
          <div>
            <h1 className="page-title">Your feed</h1>
            <p className="page-subtitle">Simplified knowledge tailored to your interests</p>
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
            <button className="btn btn-primary" onClick={loadFeed} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ok' && items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3 className="empty-title">Your feed is empty</h3>
            <p className="empty-sub">Update your interests to see personalised content.</p>
          </div>
        )}

        {status === 'ok' && items.map((item, i) => (
          <FeedPostCard
            key={item._id || i}
            item={item}
            liked={likes[i]}
            likeCount={likeCounts[i] ?? 100}
            onToggleLike={() => handleToggleLike(i)}
            onDeepDive={() => openDeepDive(item.title)}
            onSave={() => handleSave(item)}
            saved={!!saved[item._id]}
          />
        ))}
      </div>
    </div>
  )
}
