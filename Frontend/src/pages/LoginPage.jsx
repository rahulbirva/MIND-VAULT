import { useState, useRef } from 'react'
import { SUGGESTIONS } from '../data.js'
import { upsertInterests } from '../api.js'

export default function LoginPage({ navigate, onLogin }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [interests, setInterests] = useState([])
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  function handleLogin(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      alert('Please fill in both fields')
      return
    }
    setStep(2)
  }

  function addInterest(label) {
    if (!interests.includes(label)) {
      setInterests(prev => [...prev, label])
    }
  }

  function removeInterest(label) {
    setInterests(prev => prev.filter(i => i !== label))
  }

  function toggleSuggestion(label) {
    if (interests.includes(label)) removeInterest(label)
    else addInterest(label)
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
      setError('Pick at least one interest to personalise your feed.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Create (or update) the user in the backend and get back their userId
      const { userId } = await upsertInterests(null, interests)
      onLogin(userId)          // → saves to localStorage, navigates to 'feed'
    } catch (err) {
      setError(err.message || 'Could not connect to the server. Please try again.')
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
          {step === 1 ? (
            <div className="page-enter">
              <h2 className="login-step-title">Welcome back</h2>
              <p className="login-step-sub">Sign in to continue to your vault</p>
              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email-input">Email address</label>
                  <input
                    id="email-input"
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password-input">Password</label>
                  <input
                    id="password-input"
                    className="form-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg">
                  Log in
                </button>
                <div className="login-divider">or</div>
                <button
                  type="button"
                  className="btn btn-ghost btn-full"
                  onClick={() => setStep(2)}
                  style={{ fontSize: '14px', padding: '11px' }}
                >
                  Create a new account
                </button>
              </form>
            </div>
          ) : (
            <div className="page-enter">
              <h2 className="login-step-title">What do you want to learn about?</h2>
              <p className="login-step-sub">Pick a few topics and we will curate your feed instantly</p>

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
                <p style={{ color: 'var(--accent-red, #e05)', fontSize: 13, marginTop: 12 }}>
                  {error}
                </p>
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
