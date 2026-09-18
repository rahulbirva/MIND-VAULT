import { useState, useCallback } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import FeedPage from './pages/FeedPage.jsx'
import DiscoveryPage from './pages/DiscoveryPage.jsx'
import DeepDivePage from './pages/DeepDivePage.jsx'
import VaultPage from './pages/VaultPage.jsx'
import Navbar from './components/Navbar.jsx'
import Toast from './components/Toast.jsx'

export default function App() {
  const [page, setPage] = useState('landing')
  const [toast, setToast] = useState({ msg: '', show: false })

  // userId is persisted in localStorage so it survives refreshes
  const [userId, setUserId] = useState(() => localStorage.getItem('mv_userId') || null)

  // Topic lifted here so FeedPage can pre-load DeepDivePage
  const [pendingTopic, setPendingTopic] = useState(null)

  // 1 = login form, 2 = sign-up interest picker
  const [loginStartStep, setLoginStartStep] = useState(1)

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }, [])

  const navigate = useCallback((p) => {
    setPage(p)
    window.scrollTo(0, 0)
  }, [])

  /** Called by LoginPage once the user has been created in the backend. */
  const handleLogin = useCallback((uid) => {
    localStorage.setItem('mv_userId', uid)
    setUserId(uid)
    navigate('feed')
  }, [navigate])

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
      {isAppPage && <Navbar page={page} navigate={navigate} />}

      {page === 'landing'   && (
        <LandingPage navigate={navigate} userId={userId} onAuth={openAuth} />
      )}
      {page === 'login'     && (
        <LoginPage navigate={navigate} onLogin={handleLogin} startStep={loginStartStep} />
      )}
      {page === 'feed'      && (
        <FeedPage
          userId={userId}
          navigate={navigate}
          showToast={showToast}
          openDeepDive={openDeepDive}
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
        />
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </>
  )
}
