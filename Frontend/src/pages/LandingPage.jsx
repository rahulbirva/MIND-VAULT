import { useEffect, useRef, useState, useCallback } from 'react'

/* ─────────────────────────────────────────────────────────
   LANDING PAGE — MindVault
   Sections: Navbar · Hero · Stats · Features · Demo · FAQ · Footer
───────────────────────────────────────────────────────── */

// ── FAQ DATA ─────────────────────────────────────────────
const FAQS = [
  {
    q: 'What makes MindVault different from reading articles?',
    a: `MindVault doesn't just surface content — it simplifies it, personalises it to your interests, and then tests whether you actually understood it before saving it to your vault. Most platforms give you information; MindVault turns it into knowledge.`,
  },
  {
    q: 'How does the Knowledge Vault organize my saves and likes?',
    a: `Your vault automatically categorizes topics into smart domains (Finance, Law, Space, AI, Science, Health) and generates searchable hashtags. You can filter by category, hashtag clouds, or switch between your Saved and Liked posts anytime.`,
  },
  {
    q: 'Can I customise my interests after onboarding?',
    a: 'Absolutely. You can add, remove, or re-order your interest tags at any time from your profile settings. Your feed updates instantly.',
  },
  {
    q: 'Is my vault private?',
    a: 'Yes. Your vault — including mastered topics and saved bookmarks — is completely private and tied to your account. No content is shared with other users.',
  },
  {
    q: 'How often is new content added?',
    a: 'New simplified articles and discovery cards are added daily across all interest categories, curated by our editorial team and enhanced by AI-powered summarisation.',
  },
]

// ── FEATURES DATA ────────────────────────────────────────
const FEATURES = [
  {
    icon: '🎯',
    title: 'Personalised Feed',
    desc: 'Content curated to your exact interests — updated daily so your feed never feels stale.',
  },
  {
    icon: '🔍',
    title: 'Discovery Engine',
    desc: `Step outside your comfort zone. Explore topics you never knew you'd love, with one-tap save.`,
  },
  {
    icon: '🧠',
    title: 'Smart Categorization',
    desc: 'Automatic domain tagging and hashtag clouds organize your knowledge without manual filing.',
  },
  {
    icon: '✅',
    title: 'Quiz to Mastery',
    desc: 'Three targeted questions confirm you truly understand a topic before it earns a Mastered badge.',
  },
  {
    icon: '🏛️',
    title: 'Knowledge Vault',
    desc: `A curated archive of everything you've learned — filterable by Mastered or Saved status.`,
  },
  {
    icon: '⚡',
    title: 'Bite-sized Format',
    desc: 'Every topic distilled to its essence. Learn something meaningful in under 5 minutes.',
  },
]

// ── DEMO CARD DATA ───────────────────────────────────────
const DEMO_CARDS = [
  {
    cat: 'Space',
    title: 'Why the James Webb telescope changed astronomy forever',
    body: 'Its infrared sensors pierce dust clouds invisible to previous telescopes, revealing galaxies formed just 300 million years after the Big Bang.',
    tags: ['Astrophysics', 'NASA', 'Infrared'],
    status: 'mastered',
  },
  {
    cat: 'Psychology',
    title: 'The spotlight effect: everyone is watching themselves',
    body: 'We consistently overestimate how much others notice our appearance or mistakes — a cognitive bias rooted in anchored self-perception.',
    tags: ['Cognitive Bias', 'Social Psychology'],
    status: 'saved',
  },
  {
    cat: 'Biology',
    title: 'Mycorrhizal networks: how trees talk underground',
    body: 'Beneath forests lies a web of fungal filaments. Trees share sugars, water, and distress signals — challenging our view of forests as competitive.',
    tags: ['Ecology', 'Fungi'],
    status: 'mastered',
  },
]

// ── SCROLL ANIMATION HOOK ────────────────────────────────
function useScrollReveal(ref, options = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof window.anime === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.anime({
            targets: options.targets ? el.querySelectorAll(options.targets) : el,
            opacity: [0, 1],
            translateY: [options.fromY ?? 30, 0],
            delay: window.anime.stagger ? window.anime.stagger(options.stagger ?? 0) : 0,
            duration: options.duration ?? 700,
            easing: 'easeOutExpo',
          })
          observer.disconnect()
        }
      },
      { threshold: options.threshold ?? 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
}


// ── FAQ ITEM ─────────────────────────────────────────────
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (typeof window.anime !== 'undefined' && bodyRef.current) {
      window.anime({
        targets: bodyRef.current,
        maxHeight: next ? [0, 400] : [400, 0],
        opacity: next ? [0, 1] : [1, 0],
        duration: 380,
        easing: 'easeInOutQuart',
      })
    }
  }

  return (
    <div className={`faq-item${open ? ' open' : ''}`} style={{ animationDelay: `${index * 60}ms` }}>
      <button className="faq-q" onClick={toggle} aria-expanded={open}>
        <span>{q}</span>
        <span className="faq-chevron">{open ? '−' : '+'}</span>
      </button>
      <div
        ref={bodyRef}
        className="faq-a"
        style={{ maxHeight: 0, opacity: 0, overflow: 'hidden' }}
      >
        <p>{a}</p>
      </div>
    </div>
  )
}

// ── MAIN LANDING PAGE ────────────────────────────────────
export default function LandingPage({ navigate, userId, onAuth }) {
  const heroRef       = useRef(null)
  const statsRef      = useRef(null)
  const featuresRef   = useRef(null)
  const demoRef       = useRef(null)
  const faqRef        = useRef(null)
  const floatRef      = useRef(null)
  const [demoTab, setDemoTab] = useState(0)

  // "Login" → auth page step 1 (email/password → interests)
  const handleLogin = useCallback(() => onAuth(1), [onAuth])

  // "Sign up" → auth page step 2 (interests directly)
  const handleSignup = useCallback(() => onAuth(2), [onAuth])


  // ── Hero load animation ──────────────────────────────
  useEffect(() => {
    if (typeof window.anime === 'undefined') return
    const tl = window.anime.timeline({ easing: 'easeOutExpo' })
    tl.add({ targets: '.hero-badge',       opacity: [0, 1], translateY: [-12, 0], duration: 600 })
      .add({ targets: '.hero-headline',    opacity: [0, 1], translateY: [28, 0],  duration: 800 }, '-=300')
      .add({ targets: '.hero-sub',         opacity: [0, 1], translateY: [18, 0],  duration: 700 }, '-=500')
      .add({ targets: '.hero-ctas button', opacity: [0, 1], translateY: [12, 0],  duration: 500, delay: window.anime.stagger(100) }, '-=400')
      .add({ targets: '.hero-visual',      opacity: [0, 1], scale: [0.94, 1],      duration: 900 }, '-=600')
  }, [])

  // ── Floating badge gentle loop ───────────────────────
  useEffect(() => {
    if (typeof window.anime === 'undefined') return
    window.anime({
      targets: '.float-badge',
      translateY: [-6, 6],
      duration: 2200,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      delay: window.anime.stagger(400),
    })
  }, [])

  // ── Scroll reveal sections ───────────────────────────
  useScrollReveal(statsRef,    { targets: '.stat-item', stagger: 80, fromY: 20, duration: 600 })
  useScrollReveal(featuresRef, { targets: '.feat-card', stagger: 70, fromY: 32, duration: 650 })
  useScrollReveal(demoRef,     { fromY: 40, duration: 750 })
  useScrollReveal(faqRef,      { targets: '.faq-item',  stagger: 50, fromY: 20, duration: 550 })

  // ── Button micro-interaction ─────────────────────────
  function punchBtn(e) {
    if (typeof window.anime === 'undefined') return
    window.anime({
      targets: e.currentTarget,
      scale: [1, 0.94, 1],
      duration: 320,
      easing: 'easeInOutQuad',
    })
  }

  return (
    <div className="lp-root">

      {/* ── LANDING NAV ─────────────────────────────── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="nav-brand" style={{ margin: 0 }}>
            <div className="nav-icon">⚡</div>
            MindVault
          </div>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#demo"     className="lp-nav-link">Demo</a>
            <a href="#faq"      className="lp-nav-link">FAQ</a>
          </div>
          <div className="lp-nav-actions">
            <button
              className="btn btn-ghost"
              onClick={handleLogin}
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              Login
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSignup}
              onMouseDown={punchBtn}
              style={{ padding: '8px 20px', fontSize: '13px' }}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <div className="hero-badge float-badge" style={{ opacity: 0 }}>
              ✨ Free during beta — no credit card needed
            </div>
            <h1 className="hero-headline" style={{ opacity: 0 }}>
              Learn anything.<br />
              <span className="hero-headline-accent">Understand everything.</span><br />
              Remember it forever.
            </h1>
            <p className="hero-sub" style={{ opacity: 0 }}>
              MindVault curates bite-sized knowledge tailored to you, then tests whether you truly 
              understand it before sealing it in your personal vault.
            </p>
            <div className="hero-ctas" style={{ opacity: 0 }}>
              <button className="btn btn-primary btn-lg" onClick={handleSignup} onMouseDown={punchBtn}>
                Start learning — sign up free →
              </button>
              <button
                className="btn btn-ghost btn-lg"
                onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
              >
                See how it works
              </button>
            </div>
          </div>

          {/* ── Floating visual cards ─────────────── */}
          <div className="lp-hero-visual hero-visual" style={{ opacity: 0 }}>
            <div className="hero-card hero-card-main">
              <div className="hero-card-top">
                <span className="hero-card-cat">🌌 Space</span>
                <span className="card-badge mastered">✓ Mastered</span>
              </div>
              <p className="hero-card-title">Why the James Webb telescope changed astronomy forever</p>
              <p className="hero-card-body">Infrared sensors reveal galaxies just 300 million years after the Big Bang…</p>
              <div className="hero-card-tags">
                <span className="tag">Astrophysics</span>
                <span className="tag">NASA</span>
              </div>
            </div>

            <div className="hero-card hero-card-sm float-badge" style={{ top: '12%', right: '-24px' }}>
              <span style={{ fontSize: 20 }}>🧠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Saved to Vault!</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Black Holes · Space & Astronomy</div>
              </div>
            </div>

            <div className="hero-card hero-card-sm float-badge" style={{ bottom: '14%', left: '-20px' }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>7-day streak</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Keep it up!</div>
              </div>
            </div>

            <div className="hero-card hero-card-sm float-badge" style={{ bottom: '-10px', right: '15%' }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>12 topics mastered</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>This month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────── */}
      <section className="lp-stats" ref={statsRef}>
        {[
          { num: '10,000+', label: 'Topics available' },
          { num: '5 min',   label: 'Avg. per session' },
          { num: '94%',     label: 'Quiz pass rate' },
          { num: '3×',      label: 'Better retention' },
        ].map((s, i) => (
          <div key={i} className="stat-item" style={{ opacity: 0 }}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section className="lp-section" id="features" ref={featuresRef}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <div className="lp-eyebrow">Everything you need</div>
            <h2 className="lp-section-title">Built for lasting knowledge retention</h2>
            <p className="lp-section-sub">
              Six interconnected tools that take you from curious to confident — all in one place.
            </p>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card" style={{ opacity: 0 }}>
                <div className="feat-icon">{f.icon}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ───────────────────────────────── */}
      <section className="lp-section lp-section-tinted" id="demo" ref={demoRef} style={{ opacity: 0 }}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <div className="lp-eyebrow">Interactive preview</div>
            <h2 className="lp-section-title">See MindVault in action</h2>
            <p className="lp-section-sub">
              Tap a card to preview exactly how knowledge is presented in the app.
            </p>
          </div>

          {/* Tab selector */}
          <div className="demo-tabs">
            {DEMO_CARDS.map((c, i) => (
              <button
                key={i}
                className={`demo-tab-btn${demoTab === i ? ' active' : ''}`}
                onClick={() => setDemoTab(i)}
                onMouseDown={punchBtn}
              >
                {c.cat}
              </button>
            ))}
          </div>

          {/* Demo card */}
          <div className="demo-card-wrap">
            {DEMO_CARDS.map((c, i) => (
              demoTab === i && (
                <div key={i} className="demo-card page-enter">
                  <div className="demo-card-header">
                    <div>
                      <div className="result-topic-label">{c.cat}</div>
                      <h3 className="demo-card-title">{c.title}</h3>
                    </div>
                    <span className={`card-badge${c.status === 'mastered' ? ' mastered' : ' saved-badge'}`}>
                      {c.status === 'mastered' ? '✓ Mastered' : '· Saved'}
                    </span>
                  </div>
                  <p className="demo-card-body">{c.body}</p>
                  <div className="demo-card-divider" />
                  <div className="demo-card-meta">
                    <div className="card-tags" style={{ flex: 1 }}>
                      {c.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: 13 }}
                      onClick={handleSignup}
                      onMouseDown={punchBtn}
                    >
                      Sign up free →
                    </button>
                  </div>
                  {/* Fake quiz teaser */}
                  <div className="demo-quiz-teaser">
                    <div className="demo-quiz-header">
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Test your understanding</span>
                      <div className="progress-dots">
                        {[1, 2, 3].map(n => (
                          <div key={n} className={`progress-dot${n === 1 ? ' active' : ''}`} />
                        ))}
                      </div>
                    </div>
                    <p className="demo-quiz-q">In your own words, explain the core concept of this topic.</p>
                    <div className="demo-quiz-input-fake">Type your answer here…</div>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 12, padding: '9px 20px', fontSize: 13 }}
                      onClick={handleSignup}
                      onMouseDown={punchBtn}
                    >
                      Sign up to take quiz →
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="lp-section" id="faq" ref={faqRef}>
        <div className="lp-section-inner lp-section-narrow">
          <div className="lp-section-header">
            <div className="lp-eyebrow">Got questions?</div>
            <h2 className="lp-section-title">Frequently asked</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────── */}
      <section className="lp-footer-cta">
        <div className="lp-footer-cta-inner">
          <div className="float-badge footer-badge">⚡ Free during beta</div>
          <h2 className="footer-cta-title">
            Your brain deserves<br />better than scrolling.
          </h2>
          <p className="footer-cta-sub">
            Join thousands of curious people learning smarter with MindVault.
          </p>
          <button
            className="btn btn-primary btn-lg footer-cta-btn"
            onClick={handleSignup}
            onMouseDown={punchBtn}
          >
            Create free account →
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="nav-brand" style={{ margin: 0 }}>
            <div className="nav-icon" style={{ width: 24, height: 24, fontSize: 12, borderRadius: 6 }}>⚡</div>
            <span style={{ fontSize: 15 }}>MindVault</span>
          </div>
          <p className="lp-footer-copy">© 2026 MindVault. All rights reserved.</p>
          <div className="lp-footer-links">
            <a href="#" className="lp-nav-link">Privacy</a>
            <a href="#" className="lp-nav-link">Terms</a>
            <a href="#" className="lp-nav-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
