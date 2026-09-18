import { useState, useRef } from 'react'
import { SUGGESTIONS } from '../data.js'
import { signup, login, upsertInterests } from '../api.js'

/**
 * LoginPage
 * ─────────────────────────────────────────────
 * startStep = 1 → Login form   (username + password)
 * startStep = 2 → Sign-up form (email + username + password)
 *
 * Both flows end at the Interest Picker → then navigate to Feed.
 */
export default function LoginPage({ navigate, onLogin, startStep = 1 }) {
  // step: 'login' | 'signup' | 'interests'
  const [step, setStep] = useState(startStep === 2 ? 'signup' : 'login')

  // ── Auth fields ──
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // ── Interest fields ──
  const [interests, setInterests] = useState([])
  const [inputVal, setInputVal]   = useState('')
  const inputRef = useRef(null)

  // ── Shared state ──
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [userId, setUserId]   = useState(null)

  // ──────────────────────────────────────────────────────────────────── Login
  async function handleLoginSubmit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please fill in both fields'); return
    }
    setLoading(true); setError(null)
    try {
      const data = await login(username.trim(), password)
      setUserId(data.userId)
      if (data.hasInterests) {
        // Already has interests → go straight to feed
        onLogin(data.userId)
      } else {
        // First-time or no interests → show interest picker
        setStep('interests')
      }
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────── Signup
  async function handleSignupSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !username.trim() || !password) {
      setError('Please fill in all fields'); return
    }
    setLoading(true); setError(null)
    try {
      const data = await signup(email.trim(), username.trim(), password)
      setUserId(data.userId)
      setStep('interests') // New user → must pick interests
    } catch (err) {
      setError(err.message || 'Sign-up failed.')
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────── Interests
  function addInterest(label) {
    if (!interests.includes(label)) setInterests(prev => [...prev, label])
  }
  function removeInterest(label) {
    setInterests(prev => prev.filter(i => i !== label))
  }
  function toggleSuggestion(label) {
    interests.includes(label) ? removeInterest(label) : addInterest(label)
  }
  function handleChipKey(e) {
    if (e.key === 'Enter' && inputVal.trim()) {
      addInterest(inputVal.trim())
      setInputVal('')
      e.preventDefault()
    }
  }

  async function handleContinue() {
    if (interests.length === 0) {
      setError('Pick at least one interest to personalise your feed.'); return
    }
    setLoading(true); setError(null)
    try {
      await upsertInterests(userId, interests)
      onLogin(userId)  // → saves to localStorage, navigates to feed
    } catch (err) {
      setError(err.message || 'Could not save interests.')
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-container">
        <div className="login-brand">
          <div className="login-brand-name">
            <div className="login-brand-icon">⚡</div>
            MindVault
          </div>
          <p className="login-brand-tagline">Learn it. Understand it. Keep it.</p>
        </div>

        <div className="login-card">

          {/* ═══════════════════════════════════════════ LOGIN STEP */}
          {step === 'login' && (
            <div className="page-enter">
              <h2 className="login-step-title">Welcome back</h2>
              <p className="login-step-sub">Sign in to continue to your vault</p>
              <form className="login-form" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-username">Username</label>
                  <input
                    id="login-username"
                    className="form-input"
                    type="text"
                    placeholder="Your username"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    className="form-input"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p style={{ color: '#e05', fontSize: 13, margin: '8px 0 0' }}>{error}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Logging in…' : 'Log in'}
                </button>
                <div className="login-divider">or</div>
                <button
                  type="button"
                  className="btn btn-ghost btn-full"
                  onClick={() => { setStep('signup'); setError(null) }}
                  style={{ fontSize: '14px', padding: '11px' }}
                >
                  Create a new account
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════ SIGNUP STEP */}
          {step === 'signup' && (
            <div className="page-enter">
              <h2 className="login-step-title">Create your account</h2>
              <p className="login-step-sub">Start building your personal knowledge vault</p>
              <form className="login-form" onSubmit={handleSignupSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">Email address</label>
                  <input
                    id="signup-email"
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-username">Username</label>
                  <input
                    id="signup-username"
                    className="form-input"
                    type="text"
                    placeholder="Choose a username (min 3 chars)"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    className="form-input"
                    type="password"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p style={{ color: '#e05', fontSize: 13, margin: '8px 0 0' }}>{error}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Creating account…' : 'Sign up'}
                </button>
                <div className="login-divider">or</div>
                <button
                  type="button"
                  className="btn btn-ghost btn-full"
                  onClick={() => { setStep('login'); setError(null) }}
                  style={{ fontSize: '14px', padding: '11px' }}
                >
                  Already have an account? Log in
                </button>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════ INTERESTS STEP */}
          {step === 'interests' && (
            <div className="page-enter">
              <h2 className="login-step-title">What do you want to learn about?</h2>
              <p className="login-step-sub">Pick a few topics and we'll curate your feed instantly</p>

              <div
                className="chip-input-wrap"
                onClick={() => inputRef.current?.focus()}
              >
                {interests.map(label => (
                  <span key={label} className="interest-chip">
                    {label}
                    <button
                      className="chip-remove"
                      onClick={(e) => { e.stopPropagation(); removeInterest(label) }}
                      aria-label={`Remove ${label}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={interests.length === 0 ? 'Type an interest and press Enter…' : ''}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={handleChipKey}
                />
              </div>

              <p className="suggestions-label">Popular topics</p>
              <div className="suggestion-pills">
                {SUGGESTIONS.map(({ emoji, label }) => (
                  <button
                    key={label}
                    className={`suggestion-pill${interests.includes(label) ? ' selected' : ''}`}
                    onClick={() => toggleSuggestion(label)}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>

              {error && (
                <p style={{ color: '#e05', fontSize: 13, marginTop: 12 }}>{error}</p>
              )}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleContinue}
                  disabled={loading}
                  style={{ padding: '13px 36px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Setting up…' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
