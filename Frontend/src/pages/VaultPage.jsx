import { useState, useEffect } from 'react'
import { getVault } from '../api.js'

/* ── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card" style={{ gap: 12 }}>
      <div className="skeleton sk-line sk-short" style={{ marginBottom: 4 }} />
      <div className="skeleton sk-title" />
      <div className="skeleton sk-line" />
      <div className="skeleton sk-line sk-med" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div className="skeleton sk-line sk-short" style={{ height: 22, borderRadius: 20 }} />
        <div className="skeleton sk-line sk-short" style={{ height: 22, borderRadius: 20 }} />
      </div>
    </div>
  )
}

/**
 * Map a backend VaultItem to the card shape the UI expects.
 * VaultItem: { _id, topic, summary, keyFacts, sourceType, masteredAt, createdAt }
 */
function mapItem(item) {
  // Try to derive a category from the topic name
  const CATS = ['Space', 'Technology', 'History', 'Science', 'Philosophy',
                 'Economics', 'Psychology', 'Biology', 'Mathematics', 'Politics',
                 'Health', 'Art', 'Climate', 'Architecture', 'Linguistics']
  const lower = (item.topic || '').toLowerCase()
  const cat = CATS.find(c => lower.includes(c.toLowerCase())) || 'Learning'

  return {
    _id:      item._id,
    cat,
    title:    item.topic,
    body:     item.summary || item.keyFacts?.[0] || '',
    tags:     (item.keyFacts || []).slice(0, 3),
    status:   item.sourceType === 'mastered' ? 'mastered' : 'saved',
    masteredAt: item.masteredAt,
  }
}

export default function VaultPage({ userId, showToast, navigate }) {
  const [items, setItems]   = useState([])
  const [status, setStatus] = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!userId) {
      setStatus('error')
      setErrorMsg('No user found. Please log in to view your vault.')
      return
    }
    loadVault()
  }, [userId])

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Your vault</h1>
          <p className="page-subtitle">Everything you have learned and saved</p>
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

      <div className="card-grid">
        {/* Loading skeletons */}
        {status === 'loading' && [1, 2, 3].map(n => <SkeletonCard key={n} />)}

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

        {/* Items */}
        {status === 'ok' && filtered.map((item, i) => (
          <div key={item._id || i} className="card page-enter">
            <span className={`card-badge${item.status === 'mastered' ? ' mastered' : ' saved-badge'}`}>
              {item.status === 'mastered' ? '✓ Mastered' : '· Saved'}
            </span>
            <span className="card-label">
              <span className="card-label-dot" />
              {item.cat}
            </span>
            <h3 className="card-title">{item.title}</h3>
            <p className="card-summary">{item.body}</p>
            <div className="card-tags">
              {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
