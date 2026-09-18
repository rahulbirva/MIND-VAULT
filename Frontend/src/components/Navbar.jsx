export default function Navbar({ page, navigate }) {
  const tabs = [
    { id: 'feed',      label: 'Feed' },
    { id: 'discovery', label: 'Discovery' },
    { id: 'deepdive',  label: 'Deep Dive' },
    { id: 'vault',     label: 'Vault' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-icon">⚡</div>
        MindVault
      </div>
      <div className="nav-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-tab${page === t.id ? ' active' : ''}`}
            onClick={() => navigate(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
