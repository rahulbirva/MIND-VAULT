import { useState, useEffect } from 'react'
import { getLikedPosts } from '../utils/vaultStore.js'
import { getVault } from '../api.js'

export default function Navbar({ page, navigate, onRefreshFeed, onLogout, userId, vaultTab = 'saves' }) {
  const [likedCount, setLikedCount] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false)

  // Sync counts
  useEffect(() => {
    function updateCounts() {
      const likes = getLikedPosts(userId)
      setLikedCount(likes.length)
      if (userId) {
        getVault(userId)
          .then(items => {
            if (Array.isArray(items)) setSavedCount(items.length)
          })
          .catch(() => {})
      }
    }

    updateCounts()
    window.addEventListener('mindvault_vault_updated', updateCounts)
    window.addEventListener('storage', updateCounts)
    return () => {
      window.removeEventListener('mindvault_vault_updated', updateCounts)
      window.removeEventListener('storage', updateCounts)
    }
  }, [userId])

  const tabs = [
    { id: 'feed',      label: 'Feed' },
    { id: 'discovery', label: 'Discovery' },
    { id: 'deepdive',  label: 'Deep Dive' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => navigate('feed')} style={{ cursor: 'pointer' }}>
        <div className="nav-icon">⚡</div>
        MindVault
      </div>

      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-tab${page === t.id ? ' active' : ''}`}
            onClick={() => {
              navigate(t.id)
              if (t.id === 'feed' && onRefreshFeed) {
                onRefreshFeed()
              }
            }}
          >
            {t.label}
          </button>
        ))}

        {/* ── Vault Tab with Likes & Saves Options ── */}
        <div
          className="nav-vault-container"
          onMouseEnter={() => setVaultDropdownOpen(true)}
          onMouseLeave={() => setVaultDropdownOpen(false)}
        >
          <button
            className={`nav-tab nav-vault-btn${page === 'vault' ? ' active' : ''}`}
            onClick={() => navigate('vault', { tab: vaultTab || 'saves' })}
          >
            <span>Vault</span>
            <span className="nav-vault-badge">{savedCount + likedCount}</span>
            <svg
              className={`nav-chevron${vaultDropdownOpen ? ' open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Dropdown Menu with 2 Options: Saves and Likes */}
          <div className={`nav-vault-dropdown${vaultDropdownOpen ? ' show' : ''}`}>
            <button
              className={`nav-dropdown-item${page === 'vault' && vaultTab === 'saves' ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setVaultDropdownOpen(false)
                navigate('vault', { tab: 'saves' })
              }}
            >
              <div className="nav-dropdown-icon saves-icon">📌</div>
              <div className="nav-dropdown-text">
                <span className="nav-dropdown-title">Saves</span>
                <span className="nav-dropdown-sub">Bookmarked & Mastered</span>
              </div>
              <span className="nav-dropdown-count">{savedCount}</span>
            </button>

            <button
              className={`nav-dropdown-item${page === 'vault' && vaultTab === 'likes' ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setVaultDropdownOpen(false)
                navigate('vault', { tab: 'likes' })
              }}
            >
              <div className="nav-dropdown-icon likes-icon">❤️</div>
              <div className="nav-dropdown-text">
                <span className="nav-dropdown-title">Likes</span>
                <span className="nav-dropdown-sub">Favorited Feed Posts</span>
              </div>
              <span className="nav-dropdown-count">{likedCount}</span>
            </button>
          </div>
        </div>
      </div>

      {onLogout && (
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-ghost"
            onClick={onLogout}
            style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--text-muted, #888)' }}
            title="Log out"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
