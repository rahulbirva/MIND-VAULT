export default function Navbar({ page, navigate, onRefreshFeed, onLogout }) {
  const tabs = [
    { id: 'feed',      label: 'Feed' },
    { id: 'discovery', label: 'Discovery' },
    { id: 'deepdive',  label: 'Deep Dive' },
    { id: 'vault',     label: 'Vault' },
  ]

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
      </div>
      {onLogout && (
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn btn-ghost"
            onClick={onLogout}
            style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--text-muted, #888)' }}
            title="Log out"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
