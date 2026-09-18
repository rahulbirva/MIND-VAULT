export default function Card({ cat, title, body, tags, children }) {
  return (
    <div className="card page-enter">
      {children}
      <span className="card-label">
        <span className="card-label-dot" />
        {cat}
      </span>
      <h3 className="card-title">{title}</h3>
      <p className="card-summary">{body}</p>
      <div className="card-tags">
        {tags.map(t => <span key={t} className="tag">{t}</span>)}
      </div>
    </div>
  )
}
