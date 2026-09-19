import { useState, useEffect } from 'react'
import { getVault } from '../api.js'

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
 * VaultItem: { _id, topic, body, summary, keyFacts, imageUrl, videoUrl, sourceType, masteredAt, createdAt }
 */
function mapItem(item) {
  const CATS = [
    'Space', 'Technology', 'History', 'Science', 'Philosophy',
    'Economics', 'Psychology', 'Biology', 'Mathematics', 'Politics',
    'Health', 'Art', 'Climate', 'Architecture', 'Linguistics',
    'Finance', 'Rights', 'Safety', 'Everyday Tech', 'Cognitive Models',
    'Everyday Engineering', 'Fascinating Knowledge'
  ]
  const lower = (item.topic || '').toLowerCase()
  const cat = CATS.find(c => lower.includes(c.toLowerCase())) || 'Practical Knowledge'

  return {
    _id:        item._id,
    cat,
    title:      item.topic,
    body:       item.body || item.summary || (item.keyFacts && item.keyFacts.length > 0 ? item.keyFacts.join('\n\n') : ''),
    summary:    item.summary || '',
    tags:       (item.keyFacts || []).slice(0, 3),
    keyFacts:   item.keyFacts || [],
    videoUrl:   item.videoUrl || null,
    imageUrl:   item.imageUrl || null,
    status:     item.sourceType === 'mastered' ? 'mastered' : 'saved',
    masteredAt: item.masteredAt,
    createdAt:  item.createdAt,
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

export default function VaultPage({ userId, showToast, navigate, openDeepDive }) {
  const [items, setItems]               = useState([])
  const [status, setStatus]             = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg]         = useState('')
  const [filter, setFilter]             = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    if (!userId) {
      setStatus('error')
      setErrorMsg('No user found. Please log in to view your vault.')
      return
    }
    loadVault()
  }, [userId])

  // Close modal on Escape key & disable body scroll
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

  async function loadVault() {
    setStatus('loading')
    try {
      const raw = await getVault(userId)
      setItems(raw.map(mapItem))
      setStatus('ok')
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  const filtered = filter === 'all'
    ? items
    : items.filter(v => v.status === filter)

  const masteredCount = items.filter(i => i.status === 'mastered').length
  const savedCount    = items.filter(i => i.status === 'saved').length

  return (
    <div className="content-wrap page-enter">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Your vault</h1>
          <p className="page-subtitle">Curated titles & mastered concepts. Click any title to open the full post.</p>
        </div>
        {status === 'ok' && items.length > 0 && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{masteredCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>mastered</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{savedCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>saved</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        {['all', 'mastered', 'saved'].map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'mastered' ? '✓ Mastered' : '· Saved'}
          </button>
        ))}
      </div>

      {/* ── Grid of Saved Titles ── */}
      <div className="card-grid">
        {/* Loading skeletons */}
        {status === 'loading' && [1, 2, 3, 4].map(n => <SkeletonCard key={n} />)}

        {/* Error state */}
        {status === 'error' && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">⚠️</div>
            <h3 className="empty-title">Could not load your vault</h3>
            <p className="empty-sub">{errorMsg}</p>
            <button className="btn btn-primary" onClick={loadVault} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {status === 'ok' && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">🗄️</div>
            <h3 className="empty-title">
              {filter === 'all' ? 'Your vault is empty' : `No ${filter} items yet`}
            </h3>
            <p className="empty-sub">
              {filter === 'all'
                ? 'Save articles from Discovery or master topics in Deep Dive to fill your vault.'
                : filter === 'mastered'
                  ? 'Complete a Deep Dive quiz to earn a Mastered badge.'
                  : 'Bookmark posts from your feed or Discovery to save them here.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(filter === 'mastered' ? 'deepdive' : 'discovery')}
              style={{ marginTop: 12 }}
            >
              {filter === 'mastered' ? 'Start a Deep Dive' : 'Browse Discovery'}
            </button>
          </div>
        )}

        {/* Title-only compact cards */}
        {status === 'ok' && filtered.map((item, i) => (
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
              <span className={`card-badge-inline${item.status === 'mastered' ? ' mastered' : ' saved-badge'}`}>
                {item.status === 'mastered' ? '✓ Mastered' : '· Saved'}
              </span>
            </div>

            <h3 className="vault-card-title">{item.title}</h3>

            {item.tags && item.tags.length > 0 && (
              <div className="card-tags vault-card-tags">
                {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            <div className="vault-card-action">
              <span>Read full post</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── Full Post Reader Modal ── */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div
            className="modal-card vault-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-modal-title"
          >
            {/* Header */}
            <div className="vault-modal-header">
              <div className="vault-modal-meta-badges">
                <span className="card-label" style={{ margin: 0 }}>
                  <span className="card-label-dot" />
                  {selectedItem.cat}
                </span>
                <span className={`card-badge-inline${selectedItem.status === 'mastered' ? ' mastered' : ' saved-badge'}`}>
                  {selectedItem.status === 'mastered' ? '✓ Mastered' : '· Saved in Vault'}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedItem(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <h2 id="vault-modal-title" className="vault-modal-title">
              {selectedItem.title}
            </h2>

            {/* Sub-meta */}
            <div className="vault-modal-timestamp">
              {selectedItem.createdAt ? (
                <span>Saved on {new Date(selectedItem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                className="btn btn-ghost"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
