import { useState, useCallback } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import FeedPage from './pages/FeedPage.jsx'
import DiscoveryPage from './pages/DiscoveryPage.jsx'
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
      return (savedPage && !['landing', 'login'].includes(savedPage)) ? savedPage : 'feed'
    }
    return 'landing'
  })

  // Vault sub-tab state (saves | likes)
  const [vaultTab, setVaultTab] = useState(() => localStorage.getItem('mv_vault_tab') || 'saves')

  // Signal counter to trigger feed reload
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0)

  const [toast, setToast] = useState({ msg: '', show: false })

  // 1 = login form, 2 = sign-up interest picker
  const [loginStartStep, setLoginStartStep] = useState(1)

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }, [])

  const navigate = useCallback((p, options = {}) => {
    localStorage.setItem('mv_page', p)
    setPage(p)
    if (options?.tab) {
      setVaultTab(options.tab)
      localStorage.setItem('mv_vault_tab', options.tab)
    }
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
    localStorage.setItem('mv_page', 'feed')
    setUserId(uid)
    setFeedRefreshTrigger(n => n + 1)
    navigate('feed')
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

  const isAppPage = !['landing', 'login'].includes(page)

  return (
    <>
      {isAppPage && (
        <Navbar
          page={page}
          navigate={navigate}
          onRefreshFeed={triggerFeedRefresh}
          onLogout={handleLogout}
          userId={userId}
          vaultTab={vaultTab}
        />
      )}

      {page === 'landing'   && (
        <LandingPage navigate={navigate} userId={userId} onAuth={openAuth} />
      )}
      {page === 'login'     && (
        <LoginPage navigate={navigate} onLogin={handleLogin} startStep={loginStartStep} />
      )}
      {page === 'feed'      && (
        <FeedPage
          key={feedRefreshTrigger}
          userId={userId}
          navigate={navigate}
          showToast={showToast}
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
      {page === 'vault'     && (
        <VaultPage
          userId={userId}
          showToast={showToast}
          navigate={navigate}
          initialTab={vaultTab}
          onTabChange={(t) => {
            setVaultTab(t)
            localStorage.setItem('mv_vault_tab', t)
          }}
        />
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </>
  )
}
