import { useState, useEffect } from 'react'
import { getVault } from '../api.js'
import { getLikedPosts } from '../utils/vaultStore.js'

/* ── Skeleton for Compact Title Card ───────────────────────── */
function SkeletonCard() {
  return (
    <div className="card vault-item-card" style={{ gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton sk-line sk-short" style={{ width: 80, height: 16 }} />
        <div className="skeleton sk-line sk-short" style={{ width: 70, height: 18, borderRadius: 20 }} />
      </div>
      <div className="skeleton sk-title" style={{ height: 24, margin: '8px 0 12px' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skeleton sk-line sk-short" style={{ width: 60, height: 20, borderRadius: 20 }} />
        <div className="skeleton sk-line sk-short" style={{ width: 70, height: 20, borderRadius: 20 }} />
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div className="skeleton sk-line sk-short" style={{ width: 100, height: 14 }} />
      </div>
    </div>
  )
}

/**
 * Map a backend VaultItem to the shape the UI expects.
 */
function mapItem(item) {
  const CATS = [
    'Space', 'Technology', 'History', 'Science', 'Philosophy',
    'Economics', 'Psychology', 'Biology', 'Mathematics', 'Politics',
    'Health', 'Art', 'Climate', 'Architecture', 'Linguistics',
    'Finance', 'Rights', 'Safety', 'Everyday Tech', 'Cognitive Models',
    'Everyday Engineering', 'Fascinating Knowledge'
  ]
  const lower = (item.topic || item.title || '').toLowerCase()
  const cat = CATS.find(c => lower.includes(c.toLowerCase())) || item.cat || 'General'

  return {
    _id:        item._id,
    cat,
    title:      item.topic || item.title,
    body:       item.body || item.summary || (item.keyFacts && item.keyFacts.length > 0 ? item.keyFacts.join('\n\n') : (item.keyPoints ? item.keyPoints.join('\n\n') : '')),
    summary:    item.summary || item.body || '',
    tags:       (item.tags && item.tags.length > 0) ? item.tags : (item.keyFacts || item.keyPoints || []).slice(0, 3),
    keyFacts:   item.keyFacts || item.keyPoints || [],
    videoUrl:   item.videoUrl || null,
    imageUrl:   item.imageUrl || null,
    status:     item.sourceType === 'mastered' ? 'mastered' : (item.sourceType === 'liked' ? 'liked' : 'saved'),
    masteredAt: item.masteredAt,
    createdAt:  item.createdAt || item.likedAt,
  }
}

/** Render body paragraphs cleanly */
function renderBodyParagraphs(body = '') {
  if (!body || !body.trim()) {
    return <p className="vault-modal-paragraph">No additional post text saved for this item.</p>
  }
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  if (paragraphs.length <= 1) {
    const lines = body.split('\n').filter(l => l.trim().length > 0)
    if (lines.length > 1) {
      return lines.map((line, idx) => (
        <p key={idx} className="vault-modal-paragraph">{line.trim()}</p>
      ))
    }
  }
  return paragraphs.map((para, idx) => (
    <p key={idx} className="vault-modal-paragraph">{para.trim()}</p>
  ))
}

export default function VaultPage({ userId, showToast, navigate, openDeepDive, initialTab = 'saves', onTabChange }) {
  const [activeTab, setActiveTab]       = useState(initialTab) // 'saves' | 'likes'
  const [savedItems, setSavedItems]     = useState([])
  const [likedItems, setLikedItems]     = useState([])
  const [status, setStatus]             = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg]         = useState('')
  const [filter, setFilter]             = useState('all') // 'all' | 'mastered' | 'saved'
  const [selectedItem, setSelectedItem] = useState(null)

  // Sync activeTab when initialTab prop updates from Navbar navigation
  useEffect(() => {
    if (initialTab && (initialTab === 'saves' || initialTab === 'likes')) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    if (!userId) {
      setStatus('error')
      setErrorMsg('No user found. Please log in to view your vault.')
      return
    }
    loadAllVaultData()

    function handleVaultSync() {
      const likes = getLikedPosts(userId)
      setLikedItems(likes.map(mapItem))
    }
    window.addEventListener('mindvault_vault_updated', handleVaultSync)
    return () => window.removeEventListener('mindvault_vault_updated', handleVaultSync)
  }, [userId])

  // Close full-screen modal on Escape key & disable background scroll
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSelectedItem(null)
    }
    if (selectedItem) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedItem])

  async function loadAllVaultData() {
    setStatus('loading')
    try {
      // 1. Load saved & mastered items from backend
      const raw = await getVault(userId)
      setSavedItems(raw.map(mapItem))

      // 2. Load liked items from local vault store
      const localLikes = getLikedPosts(userId)
      setLikedItems(localLikes.map(mapItem))

      setStatus('ok')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function handleTabSwitch(tab) {
    setActiveTab(tab)
    if (onTabChange) onTabChange(tab)
  }

  // Display items depending on active tab
  const displayedSaved = filter === 'all'
    ? savedItems
    : savedItems.filter(v => v.status === filter)

  const currentItems = activeTab === 'saves' ? displayedSaved : likedItems

  const masteredCount = savedItems.filter(i => i.status === 'mastered').length
  const bookmarkedCount = savedItems.filter(i => i.status === 'saved').length
  const likedCount = likedItems.length

  return (
    <div className="content-wrap page-enter">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Your Vault</h1>
            <p className="page-subtitle">Your personal repository of curated knowledge, favorites, and mastered concepts.</p>
          </div>

          {status === 'ok' && (
            <div className="vault-stats-badge-group">
              <div className="vault-stat-pill">
                <span className="vault-stat-num">{bookmarkedCount}</span>
                <span className="vault-stat-txt">Saves</span>
              </div>
              <div className="vault-stat-pill">
                <span className="vault-stat-num">{likedCount}</span>
                <span className="vault-stat-txt">Likes</span>
              </div>
              <div className="vault-stat-pill mastered">
                <span className="vault-stat-num">{masteredCount}</span>
                <span className="vault-stat-txt">Mastered</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Primary Vault Mode Switcher: Saves vs Likes ── */}
      <div className="vault-mode-switcher-wrap">
        <div className="vault-mode-switcher">
          <button
            className={`vault-mode-tab${activeTab === 'saves' ? ' active' : ''}`}
            onClick={() => handleTabSwitch('saves')}
          >
            <span className="tab-icon">📌</span>
            <span>Saved Posts</span>
            <span className="tab-counter">{savedItems.length}</span>
          </button>

          <button
            className={`vault-mode-tab${activeTab === 'likes' ? ' active' : ''}`}
            onClick={() => handleTabSwitch('likes')}
          >
            <span className="tab-icon">❤️</span>
            <span>Liked Posts</span>
            <span className="tab-counter">{likedItems.length}</span>
          </button>
        </div>
      </div>

      {/* ── Sub-filters for Saves ── */}
      {activeTab === 'saves' && (
        <div className="filter-bar">
          {[
            { id: 'all',      label: 'All Saves' },
            { id: 'mastered', label: '✓ Mastered' },
            { id: 'saved',    label: '· Bookmarked' },
          ].map(f => (
            <button
              key={f.id}
              className={`filter-btn${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Sub-info for Likes ── */}
      {activeTab === 'likes' && (
        <div className="likes-info-bar">
          <span className="likes-info-icon">❤️</span>
          <span>Showing all posts favorited from your Feed and Discovery. Click any card to read in full screen.</span>
        </div>
      )}

      {/* ── Grid of Saved / Liked Titles ── */}
      <div className="card-grid">
        {/* Loading skeletons */}
        {status === 'loading' && [1, 2, 3, 4, 5, 6].map(n => <SkeletonCard key={n} />)}

        {/* Error state */}
        {status === 'error' && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">⚠️</div>
            <h3 className="empty-title">Could not load your vault</h3>
            <p className="empty-sub">{errorMsg}</p>
            <button className="btn btn-primary" onClick={loadAllVaultData} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {status === 'ok' && currentItems.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">{activeTab === 'likes' ? '❤️' : '🗄️'}</div>
            <h3 className="empty-title">
              {activeTab === 'likes'
                ? 'No liked posts yet'
                : (filter === 'all' ? 'Your saves are empty' : `No ${filter} items yet`)}
            </h3>
            <p className="empty-sub">
              {activeTab === 'likes'
                ? 'Tap the ❤️ heart icon on any post in your Feed or Discovery to collect your favorites here.'
                : filter === 'mastered'
                  ? 'Complete a Deep Dive crash course to earn a Mastered badge.'
                  : 'Bookmark posts from your Feed or Discovery to save them for quick reference.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(activeTab === 'likes' ? 'feed' : (filter === 'mastered' ? 'deepdive' : 'discovery'))}
              style={{ marginTop: 12 }}
            >
              {activeTab === 'likes' ? 'Explore Feed' : (filter === 'mastered' ? 'Start a Deep Dive' : 'Browse Discovery')}
            </button>
          </div>
        )}

        {/* Title-only compact cards */}
        {status === 'ok' && currentItems.map((item, i) => (
          <div
            key={item._id || i}
            className="card vault-item-card page-enter"
            onClick={() => setSelectedItem(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedItem(item)
              }
            }}
          >
            <div className="vault-card-top">
              <span className="card-label" style={{ margin: 0 }}>
                <span className="card-label-dot" />
                {item.cat}
              </span>
              <span className={`card-badge-inline${item.status === 'mastered' ? ' mastered' : (item.status === 'liked' ? ' liked-badge' : ' saved-badge')}`}>
                {item.status === 'mastered' ? '✓ Mastered' : (item.status === 'liked' ? '❤️ Liked' : '· Saved')}
              </span>
            </div>

            <h3 className="vault-card-title">{item.title}</h3>

            {item.tags && item.tags.length > 0 && (
              <div className="card-tags vault-card-tags">
                {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            <div className="vault-card-action">
              <span>Read in full screen</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── Full Screen Post Reader Modal with Exit Option ── */}
      {selectedItem && (
        <div className="modal-overlay vault-fullscreen-overlay" onClick={() => setSelectedItem(null)}>
          <div
            className="modal-card vault-modal-card vault-fullscreen-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-modal-title"
          >
            {/* Top Navigation Bar with Exit Option */}
            <div className="vault-modal-header">
              <div className="vault-modal-meta-badges">
                <span className="card-label" style={{ margin: 0 }}>
                  <span className="card-label-dot" />
                  {selectedItem.cat}
                </span>
                <span className={`card-badge-inline${selectedItem.status === 'mastered' ? ' mastered' : (selectedItem.status === 'liked' ? ' liked-badge' : ' saved-badge')}`}>
                  {selectedItem.status === 'mastered' ? '✓ Mastered' : (selectedItem.status === 'liked' ? '❤️ Liked Post' : '· Saved in Vault')}
                </span>
              </div>

              {/* Dedicated Exit Button */}
              <button
                className="vault-exit-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="Exit fullscreen view"
                title="Exit (Esc)"
              >
                <span>✕ Exit</span>
              </button>
            </div>

            {/* Title */}
            <h2 id="vault-modal-title" className="vault-modal-title">
              {selectedItem.title}
            </h2>

            {/* Sub-meta */}
            <div className="vault-modal-timestamp">
              {selectedItem.createdAt ? (
                <span>Recorded on {new Date(selectedItem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              ) : (
                <span>Vault Entry</span>
              )}
              {selectedItem.status === 'mastered' && selectedItem.masteredAt && (
                <span> · Mastered on {new Date(selectedItem.masteredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              )}
            </div>

            {/* Optional Banner Image */}
            {selectedItem.imageUrl && (
              <div className="vault-modal-image-wrap">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="vault-modal-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Full Body Content */}
            <div className="vault-modal-body">
              {renderBodyParagraphs(selectedItem.body)}
            </div>

            {/* Core Principles & Takeaways */}
            {selectedItem.keyFacts && selectedItem.keyFacts.length > 0 && (
              <div className="vault-modal-takeaways">
                <div className="vault-modal-takeaways-title">
                  <span>💡</span> Core Principles & Takeaways
                </div>
                <ul className="vault-modal-takeaways-list">
                  {selectedItem.keyFacts.map((fact, idx) => (
                    <li key={idx} className="vault-modal-takeaway-item">
                      <span className="takeaway-bullet">▸</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="vault-modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const topic = selectedItem.title
                  setSelectedItem(null)
                  if (openDeepDive) {
                    openDeepDive(topic)
                  } else {
                    navigate('deepdive')
                  }
                }}
              >
                <span>🎯</span> Start Deep Dive on this Topic
              </button>
              <button
                className="btn btn-ghost vault-footer-exit-btn"
                onClick={() => setSelectedItem(null)}
              >
                ✕ Exit Full Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
