/**
 * Card — white container with optional header.
 *
 * Props:
 *   title       string  (optional header title)
 *   action      ReactNode (optional right-side element in header)
 *   children    ReactNode
 *   style       object (extra styles on root)
 *   bodyStyle   object (extra styles on body)
 *   noPadding   bool   (skip card-body padding)
 */
export default function Card({ title, action, children, style, bodyStyle, noPadding = false }) {
  const hasHeader = title || action

  return (
    <div className="card" style={style}>
      {hasHeader && (
        <div className="card-header">
          {title && <span className="card-title">{title}</span>}
          {action && <div>{action}</div>}
        </div>
      )}
      {noPadding
        ? children
        : <div className="card-body" style={bodyStyle}>{children}</div>
      }
    </div>
  )
}
