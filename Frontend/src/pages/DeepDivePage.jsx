import { useState, useRef, useEffect } from 'react'
import { startDeepDive, submitAnswers } from '../api.js'

// Skeleton loader shown while the crash-course is being fetched
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="skel-card">
        <div className="skeleton sk-line sk-short" />
        <div className="skeleton sk-title" />
        <div className="skeleton sk-line sk-med" />
        <div className="skeleton sk-line" />
        <div className="skeleton sk-line sk-med" />
      </div>
      <div className="skel-card">
        <div className="skeleton sk-line sk-short" />
        <div className="skeleton sk-line" />
        <div className="skeleton sk-line sk-med" />
        <div className="skeleton sk-line sk-short" />
      </div>
    </div>
  )
}

export default function DeepDivePage({
  userId,
  showToast,
  navigate,
  initialTopic,
  onTopicConsumed,
}) {
  const [query, setQuery] = useState(initialTopic || '')
  const [phase, setPhase] = useState('idle')   // idle | loading | result | submitting
  const [result, setResult] = useState(null)   // { topic, summary, keyFacts, videoUrl, questions }
  const [quizStep, setQuizStep] = useState(1)
  const [answers, setAnswers] = useState({ 1: '', 2: '', 3: '' })
  const [quizPhase, setQuizPhase] = useState('questions') // questions | success | retry
  const [feedback, setFeedback] = useState('')
  const inputRef = useRef(null)

  // Auto-start if we received a topic from the feed
  useEffect(() => {
    if (initialTopic) {
      onTopicConsumed?.()
      handleStart(initialTopic)
    }
  }, [])

  async function handleStart(topicOverride) {
    const topic = (topicOverride || query).trim()
    if (!topic) { showToast('Type a topic to dive into'); return }
    if (!userId) { showToast('Please log in first'); return }

    setQuery(topic)
    setPhase('loading')
    setQuizStep(1)
    setAnswers({ 1: '', 2: '', 3: '' })
    setQuizPhase('questions')
    setFeedback('')
    setResult(null)

    try {
      const data = await startDeepDive(userId, topic)
      setResult(data)
      setPhase('result')
    } catch (err) {
      showToast(`Error: ${err.message}`)
      setPhase('idle')
    }
  }

  function nextQuestion(from) {
    if (!answers[from].trim()) { showToast('Please write an answer first'); return }
    setQuizStep(from + 1)
  }

  async function submitQuiz() {
    if (!answers[3].trim()) { showToast('Please write an answer first'); return }
    setPhase('submitting')

    try {
      const { passed, feedback: fb } = await submitAnswers(
        userId,
        result.topic,
        result.questions,
        [answers[1], answers[2], answers[3]]
      )
      setFeedback(fb || '')
      setQuizPhase(passed ? 'success' : 'retry')
    } catch (err) {
      showToast(`Grading error: ${err.message}`)
    } finally {
      setPhase('result')
    }
  }

  function retryQuiz() {
    setAnswers({ 1: '', 2: '', 3: '' })
    setQuizStep(1)
    setQuizPhase('questions')
    setFeedback('')
  }

  function resetDeepDive() {
    setPhase('idle')
    setQuery('')
    setResult(null)
    setAnswers({ 1: '', 2: '', 3: '' })
    setQuizStep(1)
    setQuizPhase('questions')
    setFeedback('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isSubmitting = phase === 'submitting'

  return (
    <div className="content-wrap page-enter">
      <div className="page-header">
        <h1 className="page-title">Deep Dive</h1>
        <p className="page-subtitle">Go deep on any topic, then prove you understand it</p>
      </div>

      {/* ── Search bar ── */}
      <div className="dive-search-box">
        <p className="dive-search-label">What do you want to learn right now?</p>
        <div className="dive-input-row">
          <input
            ref={inputRef}
            className="dive-input"
            type="text"
            placeholder="e.g. How does the stock market work?…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            disabled={phase === 'loading' || isSubmitting}
          />
          <button
            className="btn btn-primary btn-lg"
            onClick={() => handleStart()}
            disabled={phase === 'loading' || isSubmitting}
            style={{ whiteSpace: 'nowrap', padding: '13px 32px' }}
          >
            {phase === 'loading' ? 'Loading…' : 'Start →'}
          </button>
        </div>
      </div>

      {/* ── Skeleton ── */}
      {phase === 'loading' && <Skeleton />}

      {/* ── Results ── */}
      {(phase === 'result' || phase === 'submitting') && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">

          {/* Content card */}
          <div className="result-card">
            <p className="result-topic-label">Overview</p>
            <h2 className="result-title">{result.topic}</h2>
            <p className="result-summary">{result.summary}</p>
            <p className="result-facts-title">Key facts</p>
            <ul className="result-facts">
              {(result.keyFacts || []).map((f, i) => (
                <li key={i} className="result-fact">
                  <span className="result-fact-dot" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {result.videoUrl && (
              <a
                className="video-thumb"
                href={result.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch a short explainer"
              >
                <div className="video-play-icon">▶</div>
                <span>Watch a short explainer</span>
              </a>
            )}
            {!result.videoUrl && (
              <div className="video-thumb" role="button" aria-label="Watch a short explainer">
                <div className="video-play-icon">▶</div>
                <span>Watch a short explainer</span>
              </div>
            )}
          </div>

          {/* Quiz card */}
          <div className="quiz-card">
            {quizPhase === 'questions' && (
              <>
                <div className="quiz-header">
                  <span className="quiz-title">Test your understanding</span>
                  <div className="progress-dots">
                    {[1, 2, 3].map(n => (
                      <div
                        key={n}
                        className={`progress-dot${n === quizStep ? ' active' : ''}${n < quizStep ? ' done' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {[1, 2, 3].map(n =>
                  quizStep === n && (
                    <div key={n} className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <p className="quiz-q-text">{(result.questions || [])[n - 1]}</p>
                      <textarea
                        className="quiz-answer"
                        placeholder="Type your answer here…"
                        value={answers[n]}
                        onChange={e => setAnswers(a => ({ ...a, [n]: e.target.value }))}
                        disabled={isSubmitting}
                      />
                      <div className="quiz-actions">
                        {n < 3 ? (
                          <button className="btn btn-primary" onClick={() => nextQuestion(n)} disabled={isSubmitting}>
                            Next question →
                          </button>
                        ) : (
                          <button className="btn btn-primary" onClick={submitQuiz} disabled={isSubmitting}>
                            {isSubmitting ? 'Grading…' : 'Submit answers'}
                          </button>
                        )}
                        <span className="quiz-prog-label">{n} of 3</span>
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            {quizPhase === 'success' && (
              <div className="quiz-result page-enter">
                <div className="quiz-result-icon success">✅</div>
                <h3 className="quiz-result-title">Mastered!</h3>
                <p className="quiz-result-sub">
                  {feedback || 'Great work. This topic has been saved to your Vault with a Mastered badge.'}
                </p>
                <div className="quiz-result-actions">
                  <button className="btn btn-primary" onClick={() => navigate('vault')}>
                    View in Vault
                  </button>
                  <button className="btn btn-ghost" onClick={resetDeepDive}>
                    Dive into another topic
                  </button>
                </div>
              </div>
            )}

            {quizPhase === 'retry' && (
              <div className="quiz-result page-enter">
                <div className="quiz-result-icon retry">🔁</div>
                <h3 className="quiz-result-title">Not quite yet</h3>
                <p className="quiz-result-sub">
                  {feedback || 'Some answers need more depth. Review the summary above and give it another try.'}
                </p>
                <div className="quiz-result-actions">
                  <button className="btn btn-primary" onClick={retryQuiz}>
                    Try again
                  </button>
                  <button className="btn btn-ghost" onClick={resetDeepDive}>
                    Choose a new topic
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
