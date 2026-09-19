import { useState, useEffect, useCallback, useRef } from 'react'
import { getUserProfile, addInterest, removeInterest, getVault } from '../api.js'
import { getLikedPosts } from '../utils/vaultStore.js'
import { KNOWLEDGE_TOPICS } from '../data.js'

const MORE_SUGGESTIONS = [
  { emoji: '🌌', label: 'Space' },
  { emoji: '🤖', label: 'Artificial Intelligence' },
  { emoji: '💡', label: 'Technology' },
  { emoji: '📊', label: 'Economics' },
  { emoji: '📜', label: 'History' },
  { emoji: '🧠', label: 'Philosophy' },
  { emoji: '🧬', label: 'Biology' },
  { emoji: '🗳️', label: 'Politics' },
  { emoji: '🔬', label: 'Science' },
  { emoji: '🌿', label: 'Health' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '⚡', label: 'Quantum Computing' },
  { emoji: '🧩', label: 'Psychology' },
  { emoji: '🌍', label: 'Climate Science' },
]

export default function ProfilePage({ userId, navigate, showToast, onRefreshFeed }) {
  const [profile, setProfile] = useState(null)
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [newTopicInput, setNewTopicInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [vaultCount, setVaultCount] = useState(0)
  const [likesCount, setLikesCount] = useState(0)
  const searchContainerRef = useRef(null)

  // Fetch full profile data
  const loadProfile = useCallback(async () => {
    const activeUid = userId || localStorage.getItem('mv_userId')
    if (!activeUid) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getUserProfile(activeUid)
      setProfile(data)
      setInterests(data.interests || [])

      // Load counts for stats
      const likes = getLikedPosts(activeUid)
      setLikesCount(likes.length)

      try {
        const vaultItems = await getVault(activeUid)
        if (Array.isArray(vaultItems)) {
          setVaultCount(vaultItems.length)
        }
      } catch (_) {}
    } catch (err) {
      console.warn('Failed to fetch user profile:', err.message)
      // Fallback: try reading basic data from localStorage
      const savedUser = localStorage.getItem('mv_username') || 'Curious Learner'
      setProfile({
        username: savedUser,
        email: `${savedUser.toLowerCase().replace(/\s+/g, '')}@mindvault.io`,
        interests: ['space', 'technology', 'economics'],
      })
      setInterests(['space', 'technology', 'economics'])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Click outside to dismiss autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const trimmedQuery = newTopicInput.trim().toLowerCase()
  const matchingSuggestions = trimmedQuery.length > 0
    ? KNOWLEDGE_TOPICS.filter(item => {
        const labelMatches = item.label.toLowerCase().includes(trimmedQuery)
        const catMatches = item.category?.toLowerCase().includes(trimmedQuery)
        return labelMatches || catMatches
      }).slice(0, 8)
    : []

  const handleKeyDown = (e) => {
    if (!showSuggestions || matchingSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddInterest()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev < matchingSuggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : matchingSuggestions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && matchingSuggestions[highlightedIndex]) {
        const item = matchingSuggestions[highlightedIndex]
        handleAddInterest(item.label)
        setShowSuggestions(false)
        setHighlightedIndex(-1)
      } else {
        handleAddInterest()
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  // Add Interest handler
  const handleAddInterest = async (topicToAdd) => {
    const topic = (topicToAdd || newTopicInput).trim()
    if (!topic) {
      showToast?.('Please enter an interest topic')
      return
    }

    const lowerTopic = topic.toLowerCase()
    if (interests.some(i => i.toLowerCase() === lowerTopic)) {
      showToast?.(`"${topic}" is already in your interests`)
      setNewTopicInput('')
      return
    }

    const activeUid = userId || localStorage.getItem('mv_userId')
    setActionLoading(true)

    // Optimistic UI update
    const previousInterests = [...interests]
    const updated = [...interests, lowerTopic]
    setInterests(updated)
    setNewTopicInput('')

    try {
      if (activeUid) {
        await addInterest(activeUid, lowerTopic)
      }
      showToast?.(`✨ Added "${topic}" to your interests`)
      if (onRefreshFeed) onRefreshFeed()
    } catch (err) {
      console.error('Error adding interest:', err)
      setInterests(previousInterests)
      showToast?.(err.message || 'Failed to add interest')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete/Remove Interest handler
  const handleRemoveInterest = async (topicToRemove) => {
    const activeUid = userId || localStorage.getItem('mv_userId')
    const lowerTopic = topicToRemove.toLowerCase()

    // Optimistic UI update
    const previousInterests = [...interests]
    const updated = interests.filter(i => i.toLowerCase() !== lowerTopic)
    setInterests(updated)

    try {
      if (activeUid) {
        await removeInterest(activeUid, lowerTopic)
      }
      showToast?.(`🗑️ Removed "${topicToRemove}"`)
      if (onRefreshFeed) onRefreshFeed()
    } catch (err) {
      console.error('Error removing interest:', err)
      setInterests(previousInterests)
      showToast?.(err.message || 'Failed to remove interest')
    }
  }

  const getEmojiForInterest = (interestStr) => {
    const clean = (interestStr || '').toLowerCase()
    const match = MORE_SUGGESTIONS.find(s => clean.includes(s.label.toLowerCase()) || s.label.toLowerCase().includes(clean))
    return match ? match.emoji : '🎯'
  }

  const userInitial = profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'
  const memberDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recent Member'

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading-skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-text line-1" />
          <div className="skeleton-text line-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page-wrapper">
      {/* ── Main Container ── */}
      <div className="profile-container">

        {/* ── Back Navigation ── */}
        <div className="profile-top-nav">
          <button className="profile-back-btn" onClick={() => navigate('feed')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Feed</span>
          </button>
        </div>

        {/* ── Hero Profile Card ── */}
        <div className="profile-hero-card">
          <div className="profile-hero-bg-accent" />
          <div className="profile-hero-content">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                <span>{userInitial}</span>
              </div>
              <div className="profile-avatar-badge" title="Active Account">✓</div>
            </div>

            <div className="profile-hero-meta">
              <div className="profile-name-row">
                <h1 className="profile-username">{profile?.username || 'Learner'}</h1>
                <span className="profile-status-tag">Member</span>
              </div>
              <p className="profile-email">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {profile?.email || 'user@mindvault.io'}
              </p>
              <span className="profile-joined-text">Joined {memberDate}</span>
            </div>

            {/* Quick Stats Banner */}
            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="profile-stat-num">{interests.length}</span>
                <span className="profile-stat-lbl">Interests</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-num">{vaultCount}</span>
                <span className="profile-stat-lbl">Vault Saves</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-num">{likesCount}</span>
                <span className="profile-stat-lbl">Liked Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Account Details Card ── */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="section-header-icon">👤</div>
            <div>
              <h2 className="section-card-title">Account Information</h2>
              <p className="section-card-desc">Your personal account credentials and display profile details</p>
            </div>
          </div>

          <div className="profile-fields-grid">
            <div className="profile-field-item">
              <span className="field-label">Username</span>
              <div className="field-value-box">
                <span>{profile?.username || '—'}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="field-label">Email Address</span>
              <div className="field-value-box">
                <span>{profile?.email || '—'}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="field-label">Account Status</span>
              <div className="field-value-box">
                <span className="account-active-indicator">● Active & Syncing</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── My Interests Management Card ── */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="section-header-icon">🎯</div>
            <div>
              <div className="section-title-with-badge">
                <h2 className="section-card-title">My Chosen Interests</h2>
                <span className="interests-counter-badge">{interests.length} Selected</span>
              </div>
              <p className="section-card-desc">
                The MindVault AI curates and simplifies fresh articles based on these topics.
                Delete any interest you no longer want, or add new ones below.
              </p>
            </div>
          </div>

          {/* Active Interests Chips */}
          <div className="active-interests-container">
            {interests.length === 0 ? (
              <div className="no-interests-empty">
                <div className="empty-icon">📭</div>
                <h3>No interests selected yet</h3>
                <p>Pick some popular suggestions below or type a topic to personalize your learning feed!</p>
              </div>
            ) : (
              <div className="interests-chips-grid">
                {interests.map((interest) => (
                  <div key={interest} className="interest-chip-card">
                    <span className="interest-chip-emoji">{getEmojiForInterest(interest)}</span>
                    <span className="interest-chip-name">{interest}</span>
                    <button
                      className="interest-delete-btn"
                      onClick={() => handleRemoveInterest(interest)}
                      title={`Remove "${interest}"`}
                      aria-label={`Remove "${interest}"`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Custom Interest Input */}
          <div className="add-interest-form-section">
            <h3 className="add-interest-title">Add New Interest</h3>
            <p className="add-interest-subtitle">Type any subject, field, or concept you want to learn about:</p>

            <form
              className="add-interest-input-group"
              onSubmit={(e) => {
                e.preventDefault()
                handleAddInterest()
              }}
            >
              <div className="autocomplete-wrapper" ref={searchContainerRef}>
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="add-interest-text-input"
                    placeholder="Type to search topics (e.g. Space, Quantum, AI, History)..."
                    value={newTopicInput}
                    onChange={(e) => {
                      setNewTopicInput(e.target.value)
                      setShowSuggestions(true)
                      setHighlightedIndex(-1)
                    }}
                    onFocus={() => {
                      if (newTopicInput.trim()) setShowSuggestions(true)
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={actionLoading}
                    autoComplete="off"
                  />
                </div>

                {/* Live Auto-Suggestions Floating Dropdown */}
                {showSuggestions && trimmedQuery.length > 0 && (
                  <div className="autocomplete-dropdown">
                    <div className="autocomplete-header">
                      <span>Suggested Topics ({matchingSuggestions.length})</span>
                      <span className="autocomplete-hint">↑↓ to navigate, Enter to select</span>
                    </div>

                    {matchingSuggestions.length > 0 ? (
                      <div className="autocomplete-list">
                        {matchingSuggestions.map((item, idx) => {
                          const isAlreadyAdded = interests.some(
                            i => i.toLowerCase() === item.label.toLowerCase()
                          )
                          const isHighlighted = idx === highlightedIndex

                          return (
                            <div
                              key={item.label}
                              className={`autocomplete-item${isHighlighted ? ' highlighted' : ''}${isAlreadyAdded ? ' already-added' : ''}`}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onClick={() => {
                                if (!isAlreadyAdded) {
                                  handleAddInterest(item.label)
                                  setShowSuggestions(false)
                                  setHighlightedIndex(-1)
                                }
                              }}
                            >
                              <span className="autocomplete-item-emoji">{item.emoji}</span>
                              <div className="autocomplete-item-info">
                                <span className="autocomplete-item-title">{item.label}</span>
                                <span className="autocomplete-item-cat">{item.category}</span>
                              </div>
                              {isAlreadyAdded ? (
                                <span className="autocomplete-badge-added">Added ✓</span>
                              ) : (
                                <span className="autocomplete-badge-add">+ Add</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}

                    {/* Quick option to add custom topic as typed */}
                    {!interests.some(i => i.toLowerCase() === trimmedQuery) && (
                      <div
                        className="autocomplete-custom-add"
                        onClick={() => {
                          handleAddInterest(newTopicInput.trim())
                          setShowSuggestions(false)
                          setHighlightedIndex(-1)
                        }}
                      >
                        <span className="custom-add-icon">✨</span>
                        <div className="custom-add-text">
                          <span>Add "<strong>{newTopicInput.trim()}</strong>" as custom topic</span>
                        </div>
                        <span className="autocomplete-badge-add">+ Add</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary add-interest-btn"
                disabled={actionLoading || !newTopicInput.trim()}
              >
                {actionLoading ? 'Adding...' : '+ Add Interest'}
              </button>
            </form>
          </div>

          {/* Popular Suggestions Quick-Add Grid */}
          <div className="popular-suggestions-section">
            <span className="popular-suggestions-label">⚡ Popular Topics (Click to Add):</span>
            <div className="popular-tags-flex">
              {MORE_SUGGESTIONS.map((sug) => {
                const isSelected = interests.some(i => i.toLowerCase() === sug.label.toLowerCase())
                return (
                  <button
                    key={sug.label}
                    className={`popular-suggestion-tag${isSelected ? ' already-added' : ''}`}
                    onClick={() => {
                      if (!isSelected) {
                        handleAddInterest(sug.label)
                      }
                    }}
                    disabled={isSelected || actionLoading}
                    title={isSelected ? 'Already in your interests' : `Add "${sug.label}"`}
                  >
                    <span>{sug.emoji}</span>
                    <span>{sug.label}</span>
                    {isSelected ? (
                      <span className="tag-check-icon">✓</span>
                    ) : (
                      <span className="tag-plus-icon">+</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="profile-action-footer">
            <button
              className="btn btn-primary profile-apply-feed-btn"
              onClick={() => {
                if (onRefreshFeed) onRefreshFeed()
                navigate('feed')
                showToast?.('Feed refreshed with updated interests!')
              }}
            >
              <span>🚀 Explore Feed with Updated Interests</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
