/**
 * StatCard — metric tile with icon, value and subtitle.
 *
 * Props:
 *   icon      ReactNode
 *   iconColor 'purple' | 'green' | 'blue' | 'yellow' | 'red'
 *   label     string
 *   value     string | number
 *   sub       string
 *   valueSize CSS font-size (optional override)
 */
export default function StatCard({ icon, iconColor = 'purple', label, value, sub, valueSize }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value" style={valueSize ? { fontSize: valueSize } : {}}>
          {value ?? '—'}
        </div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  )
}
