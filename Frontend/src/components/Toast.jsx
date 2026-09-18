export default function Toast({ msg, show }) {
  return (
    <div className={`toast${show ? ' show' : ''}`} aria-live="polite">
      {msg}
    </div>
  )
}
