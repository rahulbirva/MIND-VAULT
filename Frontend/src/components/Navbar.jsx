import { useState, useEffect } from 'react'
import { getLikedPosts } from '../utils/vaultStore.js'
import { getVault, getUserProfile } from '../api.js'

export default function Navbar({ page, navigate, onRefreshFeed, onLogout, userId, vaultTab = 'saves' }) {
  const [likedCount, setLikedCount] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [vaultDropdownOpen, setVaultDropdownOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [username, setUsername] = useState(() => localStorage.getItem('mv_username') || '')

  // Sync counts and profile
  useEffect(() => {
    function updateCounts() {
      const activeUid = userId || localStorage.getItem('mv_userId') || 'default_user'
      const likes = getLikedPosts(activeUid)
      setLikedCount(likes.length)
      getVault(activeUid)
        .then(items => {
          if (Array.isArray(items)) setSavedCount(items.length)
        })
        .catch(() => {})

      getUserProfile(activeUid)
        .then(p => {
          if (p?.username) {
            setUsername(p.username)
            localStorage.setItem('mv_username', p.username)
          }
        })
        .catch(() => {})
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
  ]

  const userInitial = username ? username.charAt(0).toUpperCase() : 'U'

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
            {(savedCount + likedCount) > 0 && (
              <span className="nav-vault-badge">{savedCount + likedCount}</span>
            )}
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

      {/* ── Right-side Actions: User Profile Pill & Dropdown ── */}
      <div className="nav-right-actions">
        <div
          className="nav-profile-container"
          onMouseEnter={() => setProfileDropdownOpen(true)}
          onMouseLeave={() => setProfileDropdownOpen(false)}
        >
          <button
            className={`nav-profile-pill${page === 'profile' ? ' active' : ''}`}
            onClick={() => navigate('profile')}
            title="Account & Interests Profile"
          >
            <div className="nav-profile-avatar-circle">
              {userInitial}
            </div>
            <span className="nav-profile-pill-name">{username || 'Profile'}</span>
            <svg
              className={`nav-chevron${profileDropdownOpen ? ' open' : ''}`}
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

          {/* Profile Dropdown Menu */}
          <div className={`nav-profile-dropdown${profileDropdownOpen ? ' show' : ''}`}>
            <div className="nav-profile-dropdown-header">
              <span className="dropdown-user-greeting">Signed in as</span>
              <span className="dropdown-user-name">{username || 'Learner'}</span>
            </div>

            <div className="nav-dropdown-divider" />

            <button
              className={`nav-dropdown-item${page === 'profile' ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setProfileDropdownOpen(false)
                navigate('profile')
              }}
            >
              <div className="nav-dropdown-icon profile-icon">👤</div>
              <div className="nav-dropdown-text">
                <span className="nav-dropdown-title">Profile & Interests</span>
                <span className="nav-dropdown-sub">Name, email, add/delete topics</span>
              </div>
            </button>

            <div className="nav-dropdown-divider" />

            {onLogout && (
              <button
                className="nav-dropdown-item nav-logout-item"
                onClick={(e) => {
                  e.stopPropagation()
                  setProfileDropdownOpen(false)
                  onLogout()
                }}
              >
                <div className="nav-dropdown-icon logout-icon">🚪</div>
                <div className="nav-dropdown-text">
                  <span className="nav-dropdown-title">Log out</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

