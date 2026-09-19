import { useState, useEffect, useMemo } from 'react'
import { getVault } from '../api.js'
import { getLikedPosts, deriveCategory, deriveHashtags, getCategoryIcon, syncLikesFromBackend } from '../utils/vaultStore.js'

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
 * Map a backend or local VaultItem to the shape the UI expects.
 */
function mapItem(item) {
  const title = item.topic || item.title || 'Untitled Knowledge'
  const cat = deriveCategory(title, item.cat || item.category)
  const tags = (Array.isArray(item.tags) && item.tags.length > 0)
    ? item.tags.map(t => (t.startsWith('#') ? t : `#${t}`))
    : deriveHashtags(title, cat)

  return {
    _id:        item._id,
    cat,
    title,
    body:       item.body || item.summary || (item.keyFacts && item.keyFacts.length > 0 ? item.keyFacts.join('\n\n') : (item.keyPoints ? item.keyPoints.join('\n\n') : '')),
    summary:    item.summary || item.body || '',
    tags,
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

export default function VaultPage({ userId, showToast, navigate, initialTab = 'saves', onTabChange }) {
  const [activeTab, setActiveTab]             = useState(initialTab) // 'saves' | 'likes'
  const [savedItems, setSavedItems]           = useState([])
  const [likedItems, setLikedItems]           = useState([])
  const [status, setStatus]                   = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg]               = useState('')
  const [statusFilter, setStatusFilter]       = useState('all') // 'all' | 'mastered' | 'saved'
  const [categoryFilter, setCategoryFilter]   = useState('all') // 'all' | specific category name
  const [hashtagFilter, setHashtagFilter]     = useState(null) // null | string tag like '#Space'
  const [searchQuery, setSearchQuery]         = useState('')
  const [selectedItem, setSelectedItem]       = useState(null)

  // Sync activeTab when initialTab prop updates from Navbar navigation
  useEffect(() => {
    if (initialTab && (initialTab === 'saves' || initialTab === 'likes')) {
      setActiveTab(initialTab)
      setCategoryFilter('all')
      setHashtagFilter(null)
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
      const activeUid = userId || localStorage.getItem('mv_userId') || 'default_user'
      // 1. Sync likes from MongoDB backend into local store
      await syncLikesFromBackend(activeUid)

      // 2. Load all vault items from MongoDB backend
      const raw = await getVault(activeUid)
      const savedDocs = raw.filter(item => item.sourceType !== 'liked')
      const dbLikes = raw.filter(item => item.sourceType === 'liked')

      setSavedItems(savedDocs.map(mapItem))

      // 3. Load liked items from local vault store (which merged with DB)
      const localLikes = getLikedPosts(activeUid)
      const mergedLikesMap = new Map()
      for (const it of [...dbLikes, ...localLikes]) {
        const key = (it.topic || it.title || '').trim().toLowerCase()
        if (key && !mergedLikesMap.has(key)) {
          mergedLikesMap.set(key, it)
        }
      }
      setLikedItems(Array.from(mergedLikesMap.values()).map(mapItem))

      setStatus('ok')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  function handleTabSwitch(tab) {
    setActiveTab(tab)
    setCategoryFilter('all')
    setHashtagFilter(null)
    setSearchQuery('')
    if (onTabChange) onTabChange(tab)
  }

  // Base list depending on active tab
  const baseItems = activeTab === 'saves' ? savedItems : likedItems

  // Extract unique categories for active tab with counts
  const availableCategories = useMemo(() => {
    const counts = {}
    for (const item of baseItems) {
      counts[item.cat] = (counts[item.cat] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count, icon: getCategoryIcon(cat) }))
  }, [baseItems])

  // Extract popular hashtags across active items
  const popularHashtags = useMemo(() => {
    const counts = {}
    for (const item of baseItems) {
      if (Array.isArray(item.tags)) {
        for (const tag of item.tags) {
          counts[tag] = (counts[tag] || 0) + 1
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  }, [baseItems])

  // Filter items by status, category, hashtag, and search query
  const filteredItems = useMemo(() => {
    return baseItems.filter(item => {
      // Status filter (for Saves tab)
      if (activeTab === 'saves' && statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      // Category filter
      if (categoryFilter !== 'all' && item.cat !== categoryFilter) {
        return false
      }
      // Hashtag filter
      if (hashtagFilter) {
        const cleanFilter = hashtagFilter.toLowerCase()
        const hasTag = Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase() === cleanFilter)
        if (!hasTag) return false
      }
      // Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = item.title.toLowerCase().includes(q)
        const catMatch = item.cat.toLowerCase().includes(q)
        const tagMatch = Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes(q))
        const bodyMatch = (item.body || '').toLowerCase().includes(q)
        if (!titleMatch && !catMatch && !tagMatch && !bodyMatch) return false
      }
      return true
    })
  }, [baseItems, activeTab, statusFilter, categoryFilter, hashtagFilter, searchQuery])

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
            <p className="page-subtitle">Categorized knowledge, bookmarked insights, and favorited hashtags.</p>
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

      {/* ── Category & Hashtag Filter Section ── */}
      <div className="vault-filter-panel">
        {/* Sub-filters for Saves (Mastered / Bookmarked) */}
        {activeTab === 'saves' && (
          <div className="filter-bar" style={{ marginBottom: 16 }}>
            {[
              { id: 'all',      label: 'All Saves' },
              { id: 'mastered', label: '✓ Mastered' },
              { id: 'saved',    label: '· Bookmarked' },
            ].map(f => (
              <button
                key={f.id}
                className={`filter-btn${statusFilter === f.id ? ' active' : ''}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Categories Bar */}
        {availableCategories.length > 0 && (
          <div className="vault-categories-bar">
            <span className="vault-filter-label">Categories:</span>
            <button
              className={`vault-cat-pill${categoryFilter === 'all' ? ' active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              <span>All</span>
              <span className="vault-cat-count">{baseItems.length}</span>
            </button>
            {availableCategories.map(({ cat, count, icon }) => (
              <button
                key={cat}
                className={`vault-cat-pill${categoryFilter === cat ? ' active' : ''}`}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              >
                <span>{icon} {cat}</span>
                <span className="vault-cat-count">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Popular Hashtags Cloud */}
        {popularHashtags.length > 0 && (
          <div className="vault-hashtags-cloud">
            <span className="vault-filter-label">Hashtags:</span>
            {popularHashtags.map(({ tag, count }) => (
              <button
                key={tag}
                className={`vault-hashtag-chip${hashtagFilter === tag ? ' active' : ''}`}
                onClick={() => setHashtagFilter(hashtagFilter === tag ? null : tag)}
              >
                <span>{tag}</span>
                <span className="tag-count">({count})</span>
              </button>
            ))}

            {hashtagFilter && (
              <button
                className="vault-clear-filter-btn"
                onClick={() => setHashtagFilter(null)}
                title="Clear hashtag filter"
              >
                ✕ Clear Tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Active Filter Summary & Search ── */}
      {(categoryFilter !== 'all' || hashtagFilter) && (
        <div className="vault-active-filter-indicator">
          <span>Filtering by:</span>
          {categoryFilter !== 'all' && (
            <span className="active-tag-badge">
              Category: {categoryFilter}
              <button onClick={() => setCategoryFilter('all')}>✕</button>
            </span>
          )}
          {hashtagFilter && (
            <span className="active-tag-badge">
              Tag: {hashtagFilter}
              <button onClick={() => setHashtagFilter(null)}>✕</button>
            </span>
          )}
          <button
            className="clear-all-link"
            onClick={() => {
              setCategoryFilter('all')
              setHashtagFilter(null)
            }}
          >
            Reset Filters
          </button>
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
        {status === 'ok' && filteredItems.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">{activeTab === 'likes' ? '❤️' : '🗄️'}</div>
            <h3 className="empty-title">
              {categoryFilter !== 'all' || hashtagFilter
                ? 'No matching entries found'
                : (activeTab === 'likes' ? 'No liked posts yet' : 'Your saves are empty')}
            </h3>
            <p className="empty-sub">
              {categoryFilter !== 'all' || hashtagFilter
                ? 'Try selecting a different category or clearing the active hashtag filter.'
                : activeTab === 'likes'
                  ? 'Tap the ❤️ heart icon on any post in your Feed or Discovery to collect your favorites here.'
                  : 'Bookmark posts from your Feed or Discovery to organize them in your vault.'}
            </p>
            {categoryFilter !== 'all' || hashtagFilter ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setCategoryFilter('all')
                  setHashtagFilter(null)
                }}
                style={{ marginTop: 12 }}
              >
                Show All Entries
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => navigate(activeTab === 'likes' ? 'feed' : 'discovery')}
                style={{ marginTop: 12 }}
              >
                {activeTab === 'likes' ? 'Explore Feed' : 'Browse Discovery'}
              </button>
            )}
          </div>
        )}

        {/* Title & Tag compact cards */}
        {status === 'ok' && filteredItems.map((item, i) => (
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
                {getCategoryIcon(item.cat)} {item.cat}
              </span>
              <span className={`card-badge-inline${item.status === 'mastered' ? ' mastered' : (item.status === 'liked' ? ' liked-badge' : ' saved-badge')}`}>
                {item.status === 'mastered' ? '✓ Mastered' : (item.status === 'liked' ? '❤️ Liked' : '· Saved')}
              </span>
            </div>

            <h3 className="vault-card-title">{item.title}</h3>

            {/* Hashtags list */}
            {item.tags && item.tags.length > 0 && (
              <div className="card-tags vault-card-tags">
                {item.tags.map(t => (
                  <span
                    key={t}
                    className="tag vault-hashtag-tag"
                    onClick={(e) => {
                      e.stopPropagation()
                      setHashtagFilter(t)
                    }}
                    title={`Filter by ${t}`}
                  >
                    {t}
                  </span>
                ))}
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
                  {getCategoryIcon(selectedItem.cat)} {selectedItem.cat}
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

            {/* Hashtags Section */}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className="vault-modal-hashtags">
                <span className="vault-modal-tag-label">Hashtags:</span>
                <div className="vault-modal-tag-list">
                  {selectedItem.tags.map(t => (
                    <span
                      key={t}
                      className="tag vault-hashtag-tag active"
                      onClick={() => {
                        setHashtagFilter(t)
                        setSelectedItem(null)
                      }}
                      title={`Filter vault by ${t}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
