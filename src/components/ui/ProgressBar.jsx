/**
 * ProgressBar — horizontal progress indicator.
 *
 * Props:
 *   value   number  0-100
 *   color   'green' | 'blue' | 'yellow' | 'red' | '' (default = accent)
 *   height  number  px (default 5)
 */
export default function ProgressBar({ value = 0, color = '', height = 5 }) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="progress-bar" style={{ height }}>
      <div
        className={`progress-bar-fill ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
