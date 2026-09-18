import { useState } from 'react'
import { discoverLaw } from '../api.js'
import './LawDiscoveryPanel.css'

export default function LawDiscoveryPanel({ vaultContext = [] }) {
  // Use user's vault items or standard realistic fallback
  const effectiveContext = Array.isArray(vaultContext) && vaultContext.length > 0
    ? vaultContext
    : ['React', 'MongoDB', 'GATE Exam Prep']

  const [lawData, setLawData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDiscover() {
    setLoading(true)
    setError(null)
    try {
      const data = await discoverLaw(effectiveContext)
      setLawData(data)
    } catch (err) {
      setError(err.message || 'Failed to synthesize mental model from local AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="law-discovery-card page-enter">
      {/* ── Top Bar ── */}
      <div className="law-top-bar">
        <div className="law-tag-badge">
          <span className="law-tag-badge-pulse" />
          Mental Model Discovery Engine
        </div>

        {lawData && !loading && (
          <button
            className="law-refresh-btn"
            onClick={handleDiscover}
            title="Discover another mental model"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Discover Another
          </button>
        )}
      </div>

      {/* ── Context Anchors ── */}
      <div className="law-context-row">
        <span className="law-context-label">Anchored to your vault:</span>
        {effectiveContext.map((c, i) => (
          <span key={i} className="law-chip">
            {c}
          </span>
        ))}
      </div>

      {/* ── Idle / Initial State ── */}
      {!lawData && !loading && !error && (
        <div style={{ textAlign: 'left', padding: '6px 0 10px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
            Expand Your Thinking Beyond What You Know
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 20, maxWidth: 640 }}>
            Our proactive AI engine synthesizes universal laws, psychological principles, and systems models you haven't encountered yet — bridged directly to your existing knowledge using intuitive analogies.
          </p>
          <button
            id="discover-law-btn"
            className="law-cta-btn"
            onClick={handleDiscover}
          >
            <span>⚡</span>
            Discover a New Mental Model
          </button>
        </div>
      )}

      {/* ── Loading Skeleton & Spinner ── */}
      {loading && (
        <div className="law-loading-state">
          <div className="law-loading-spinner-row">
            <div className="law-spinner" />
            <span className="law-loading-text">
              Synthesizing universal laws with local Llama 3 (anchoring to your vault)...
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="law-skeleton-line" style={{ height: 32, width: '55%' }} />
            <div className="law-skeleton-line" style={{ height: 18, width: '75%' }} />
            <div className="law-skeleton-line" style={{ height: 16, width: '95%' }} />
            <div className="law-skeleton-line" style={{ height: 16, width: '85%' }} />
            <div className="law-skeleton-line" style={{ height: 80, width: '100%', marginTop: 8 }} />
            <div className="law-skeleton-line" style={{ height: 50, width: '100%', marginTop: 8 }} />
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {error && !loading && (
        <div className="law-error-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 700 }}>
            <span>⚠️</span>
            <span>Local AI Discovery Error</span>
          </div>
          <p style={{ margin: 0, marginBottom: 14 }}>{error}</p>
          <button
            className="law-cta-btn"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={handleDiscover}
          >
            Retry Discovery
          </button>
        </div>
      )}

      {/* ── Rendered Mental Model Result ── */}
      {lawData && !loading && (
        <div className="page-enter">
          {/* Main Header */}
          <h2 className="law-title-header">{lawData.discovered_law}</h2>

          {/* Italicized Subheader */}
          <p className="law-utility-sub">{lawData.real_world_utility}</p>

          {/* Anchor Explanation */}
          <p className="law-explanation">{lawData.anchor_explanation}</p>

          {/* Distinct Highlighted Bridge Analogy Box */}
          <div className="law-analogy-box">
            <div className="law-analogy-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Bridge Analogy
            </div>
            <p className="law-analogy-text">{lawData.bridge_analogy}</p>
          </div>

          {/* Actionable Takeaway Banner (Success-colored) */}
          <div className="law-takeaway-banner">
            <div className="law-takeaway-icon">💡</div>
            <div>
              <div className="law-takeaway-title">Actionable Takeaway</div>
              <p className="law-takeaway-content">{lawData.actionable_takeaway}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
