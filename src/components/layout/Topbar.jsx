import { Home, ChevronRight } from 'lucide-react'

const TAB_LABELS = {
  home:          'Overview',
  servers:       'Servers',
  server_add:    'Deploy Server',
  server_detail: 'Server Detail',
  nodes:         'Nodes',
  node_add:      'Add Node',
}

export default function Topbar({ currentTab, role }) {
  const currentLabel = TAB_LABELS[currentTab] || currentTab

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span className="crumb-root">
          <Home size={14} /> Dashboard
        </span>
        <ChevronRight size={14} className="crumb-sep" />
        <span className="crumb-current">{currentLabel}</span>
      </div>

      <div className="topbar-right">
        <span className={`topbar-role ${role}`}>{role}</span>
        <div className="topbar-badge">
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem',
            flexShrink: 0,
          }}>
            {role?.[0]?.toUpperCase()}
          </span>
          Administrator
        </div>
      </div>
    </header>
  )
}
