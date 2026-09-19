import { useState, useEffect, useRef, useCallback } from 'react'
import { getReels, saveFeedItem, likeReel, recordReelView } from '../api.js'
import './ReelsPage.css'

const TOPIC_ICONS = {
  space: '🌌',
  history: '📜',
  politics: '🗳️',
  technology: '⚡',
  science: '🔬',
}

export default function ReelsPage({ userId, showToast, navigate }) {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [likedMap, setLikedMap] = useState({})
  const [likesCountMap, setLikesCountMap] = useState({})
  const [savedMap, setSavedMap] = useState({})
  const [showPrompt, setShowPrompt] = useState(false)
  const [progress, setProgress] = useState(0)
  const [indicatorState, setIndicatorState] = useState(null) // 'play' | 'pause' | null

  const videoRef = useRef(null)

  // Fetch Reels from MongoDB / Backend
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getReels(userId)
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data?.reels || [])
          setReels(list)
          setCurrentIndex(0)
          const initialLikes = {}
          const initialCounts = {}
          list.forEach((r) => {
            if (r._id) {
              initialLikes[r._id] = Boolean(r.liked)
              initialCounts[r._id] = r.likes_count || 0
            }
          })
          setLikedMap(initialLikes)
          setLikesCountMap(initialCounts)
        }
      })
      .catch((err) => {
        console.error('[ReelsPage] Fetch failed:', err)
        if (!cancelled) {
          showToast?.('Could not load reels from server.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, showToast])

  // Filter items
  const filteredReels = reels.filter((r) => {
    if (activeFilter === 'all') return true
    return (r.topic || '').toLowerCase() === activeFilter.toLowerCase()
  })

  const currentReel = filteredReels[currentIndex] || null

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
      setIndicatorState('play')
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      setIndicatorState('pause')
    }
    setTimeout(() => setIndicatorState(null), 600)
  }

  // Next / Previous Reel Navigation
  const goNext = useCallback(() => {
    if (currentIndex < filteredReels.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setProgress(0)
      setShowPrompt(false)
      setIsPlaying(true)
    }
  }, [currentIndex, filteredReels.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setProgress(0)
      setShowPrompt(false)
      setIsPlaying(true)
    }
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        goPrev()
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'm') {
        setIsMuted((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev])

  // Track video progress
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(p)
    }
  }

  // Track view in MongoDB whenever active reel changes
  useEffect(() => {
    if (currentReel?._id) {
      recordReelView(currentReel._id).catch(() => {})
    }
  }, [currentReel?._id])

  // Like toggle with live MongoDB sync
  const handleLike = async (id) => {
    const isCurrentlyLiked = likedMap[id]
    const nextState = !isCurrentlyLiked
    setLikedMap((prev) => ({ ...prev, [id]: nextState }))
    setLikesCountMap((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + (nextState ? 1 : -1)),
    }))

    if (nextState) {
      showToast?.('Liked reel! ❤️')
    }

    try {
      if (id) {
        const res = await likeReel(id, userId || 'anonymous')
        if (res && typeof res.likes_count === 'number') {
          setLikesCountMap((prev) => ({ ...prev, [id]: res.likes_count }))
        }
      }
    } catch (e) {
      console.warn('[reels] Like sync warning:', e)
    }
  }

  // Save to Vault
  const handleSave = async (reel) => {
    setSavedMap((prev) => ({ ...prev, [reel._id]: true }))
    try {
      if (reel._id && !reel._id.startsWith('mock_') && !reel._id.startsWith('disk_')) {
        await saveFeedItem(reel._id, userId)
      }
      showToast?.('Saved reel to your Vault! 📚')
    } catch {
      showToast?.('Saved reel locally.')
    }
  }

  // Share
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast?.('Link copied to clipboard! 🔗')
    } else {
      showToast?.('Share this reel with friends!')
    }
  }

  // Unique topics for filter chips
  const availableTopics = ['all', ...new Set(reels.map((r) => (r.topic || '').toLowerCase()).filter(Boolean))]

  return (
    <div className="reels-container">
      {/* ── Topic Filter Chips ── */}
      <div className="reels-filter-bar">
        {availableTopics.map((top) => (
          <button
            key={top}
            className={`reels-filter-chip${activeFilter === top ? ' active' : ''}`}
            onClick={() => {
              setActiveFilter(top)
              setCurrentIndex(0)
              setProgress(0)
            }}
          >
            {top === 'all' ? '✨ All Reels' : `${TOPIC_ICONS[top] || '🎯'} ${top.charAt(0).toUpperCase() + top.slice(1)}`}
          </button>
        ))}
      </div>

      {/* ── Main Reel Player ── */}
      {loading ? (
        <div className="reel-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ width: '80%', height: 28, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: '60%', height: 18, borderRadius: 6 }} />
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 12 }}>Loading AI video reels...</div>
        </div>
      ) : !currentReel ? (
        <div className="reels-empty">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎬</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem' }}>No AI Reels Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 16px 0' }}>
            Run the offline generation script to create local AI video clips for your interests.
          </p>
          <code style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', color: '#34d399' }}>
            python generate_reels.py
          </code>
        </div>
      ) : (
        <>
          <div className="reel-wrapper">
            {/* Native HTML5 Video */}
            <video
              ref={videoRef}
              key={currentReel.videoUrl}
              src={currentReel.videoUrl}
              className="reel-video"
              autoPlay
              loop
              playsInline
              muted={isMuted}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Play/Pause Animated Indicator */}
            {indicatorState === 'pause' && <div className="reel-play-indicator">⏸</div>}
            {indicatorState === 'play' && <div className="reel-play-indicator">▶</div>}

            {/* Top Overlay Bar */}
            <div className="reel-overlay-top">
              <span className="reel-model-tag">
                <span>✨</span> Wan 2.2 · Q6_K (720p)
              </span>
              <span className="reel-index-badge">
                {currentIndex + 1} / {filteredReels.length}
              </span>
            </div>

            {/* Side Action Buttons */}
            <div className="reel-actions-column">
              {/* Like */}
              <button
                className={`reel-action-btn${likedMap[currentReel._id] ? ' liked' : ''}`}
                onClick={() => handleLike(currentReel._id)}
                aria-label="Like reel"
              >
                {likedMap[currentReel._id] ? '❤️' : '🤍'}
              </button>
              <span className="reel-action-label">
                {likesCountMap[currentReel._id] ?? (likedMap[currentReel._id] ? 1 : 0)}
              </span>

              {/* Mute / Unmute */}
              <button
                className="reel-action-btn"
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <span className="reel-action-label">{isMuted ? 'Muted' : 'Audio'}</span>

              {/* Save to Vault */}
              <button
                className={`reel-action-btn${savedMap[currentReel._id] ? ' saved' : ''}`}
                onClick={() => handleSave(currentReel)}
                aria-label="Save reel to vault"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={savedMap[currentReel._id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <span className="reel-action-label">Vault</span>

              {/* Share */}
              <button className="reel-action-btn" onClick={handleShare} aria-label="Share reel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <span className="reel-action-label">Share</span>
            </div>

            {/* Bottom Content Info */}
            <div className="reel-overlay-bottom">
              <span className="reel-topic-pill">
                {TOPIC_ICONS[currentReel.topic] || '🎯'} {currentReel.topic}
              </span>
              <h2 className="reel-title">{currentReel.title}</h2>

              {currentReel.caption && (
                <div className="reel-caption-card">
                  <span className="reel-caption-badge">💡 Fact</span>
                  <p className="reel-caption-text">{currentReel.caption}</p>
                </div>
              )}

              {currentReel.prompt && (
                <div>
                  <button
                    className="reel-prompt-toggle"
                    onClick={() => setShowPrompt((prev) => !prev)}
                  >
                    <span>{showPrompt ? '▲' : '▼'}</span>
                    <span>{showPrompt ? 'Hide AI Prompt' : 'View AI Prompt'}</span>
                  </button>
                  {showPrompt && (
                    <div className="reel-prompt-box">
                      <strong>Prompt:</strong> {currentReel.prompt}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Timeline Bar */}
            <div className="reel-timeline-bar" style={{ width: `${progress}%` }} />
          </div>

          {/* ── Navigation Buttons (Next / Previous) ── */}
          <div className="reel-nav-controls">
            <button
              className="reel-nav-btn"
              onClick={goPrev}
              disabled={currentIndex === 0}
              title="Previous Reel (Up Arrow)"
            >
              ▲
            </button>
            <button
              className="reel-nav-btn"
              onClick={goNext}
              disabled={currentIndex === filteredReels.length - 1}
              title="Next Reel (Down Arrow)"
            >
              ▼
            </button>
          </div>
        </>
      )}
    </div>
  )
}
