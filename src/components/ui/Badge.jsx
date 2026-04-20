/**
 * Badge — coloured status pill.
 * status: 'running' | 'stopped' | 'installing' | 'crashed' | 'online' | 'offline' | 'maintenance'
 */
export default function Badge({ status, label, size = 'md' }) {
  const text = label ?? status
  const small = size === 'sm'

  return (
    <span
      className={`badge ${status}`}
      style={small ? { fontSize: '0.65rem', padding: '2px 8px' } : {}}
    >
      <span className="badge-dot" />
      {text}
    </span>
  )
}
