import { useState, useCallback } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import FeedPage from './pages/FeedPage.jsx'
import DiscoveryPage from './pages/DiscoveryPage.jsx'
import DeepDivePage from './pages/DeepDivePage.jsx'
import LearnFeedPage from './pages/LearnFeedPage.jsx'
import VaultPage from './pages/VaultPage.jsx'
import Navbar from './components/Navbar.jsx'
import Toast from './components/Toast.jsx'

export default function App() {
  // userId is persisted in localStorage so it survives refreshes
  const [userId, setUserId] = useState(() => localStorage.getItem('mv_userId') || null)

  // Persist the active page across reloads so user stays on feed/vault etc.
  const [page, setPage] = useState(() => {
    const savedUid = localStorage.getItem('mv_userId')
    const savedPage = localStorage.getItem('mv_page')
    if (savedUid) {
      return (savedPage && !['landing', 'login'].includes(savedPage)) ? savedPage : 'learnfeed'
    }
    return 'landing'
  })

  // Signal counter to trigger feed reload
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0)

  const [toast, setToast] = useState({ msg: '', show: false })

  // Topic lifted here so FeedPage can pre-load DeepDivePage
  const [pendingTopic, setPendingTopic] = useState(null)

  // 1 = login form, 2 = sign-up interest picker
  const [loginStartStep, setLoginStartStep] = useState(1)

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }, [])

  const navigate = useCallback((p) => {
    localStorage.setItem('mv_page', p)
    setPage(p)
    if (p === 'feed') {
      setFeedRefreshTrigger(n => n + 1)
    }
    window.scrollTo(0, 0)
  }, [])

  const triggerFeedRefresh = useCallback(() => {
    setFeedRefreshTrigger(n => n + 1)
  }, [])

  /** Called by LoginPage once the user has been created in the backend. */
  const handleLogin = useCallback((uid) => {
    localStorage.setItem('mv_userId', uid)
    localStorage.setItem('mv_page', 'learnfeed')
    setUserId(uid)
    setFeedRefreshTrigger(n => n + 1)
    navigate('learnfeed')
  }, [navigate])

  /** Log out and return to landing page */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('mv_userId')
    localStorage.removeItem('mv_page')
    setUserId(null)
    setPage('landing')
  }, [])

  /** Open the auth page at a specific step (1=login, 2=signup). */
  const openAuth = useCallback((step = 1) => {
    setLoginStartStep(step)
    navigate('login')
  }, [navigate])

  /** Called by FeedPage "Deep Dive" button to pre-fill the topic. */
  const openDeepDive = useCallback((topic) => {
    setPendingTopic(topic)
    navigate('deepdive')
  }, [navigate])

  /** Clear the pending topic once DeepDivePage has consumed it. */
  const clearPendingTopic = useCallback(() => setPendingTopic(null), [])

  const isAppPage = !['landing', 'login'].includes(page)

  return (
    <>
      {isAppPage && (
        <Navbar
          page={page}
          navigate={navigate}
          onRefreshFeed={triggerFeedRefresh}
          onLogout={handleLogout}
        />
      )}

      {page === 'landing'   && (
        <LandingPage navigate={navigate} userId={userId} onAuth={openAuth} />
      )}
      {page === 'login'     && (
        <LoginPage navigate={navigate} onLogin={handleLogin} startStep={loginStartStep} />
      )}
      {page === 'learnfeed' && (
        <LearnFeedPage showToast={showToast} />
      )}
      {page === 'feed'      && (
        <FeedPage
          key={feedRefreshTrigger}
          userId={userId}
          navigate={navigate}
          showToast={showToast}
          openDeepDive={openDeepDive}
          refreshTrigger={feedRefreshTrigger}
        />
      )}
      {page === 'discovery' && (
        <DiscoveryPage
          userId={userId}
          showToast={showToast}
          navigate={navigate}
        />
      )}
      {page === 'deepdive'  && (
        <DeepDivePage
          userId={userId}
          showToast={showToast}
          navigate={navigate}
          initialTopic={pendingTopic}
          onTopicConsumed={clearPendingTopic}
        />
      )}
      {page === 'vault'     && (
        <VaultPage
          userId={userId}
          showToast={showToast}
          navigate={navigate}
          openDeepDive={openDeepDive}
        />
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </>
  )
}
