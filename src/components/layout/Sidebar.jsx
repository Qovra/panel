import { Home, Server, HardDrive, LogOut, LayoutDashboard, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home',    label: 'Home',    icon: LayoutDashboard },
  { id: 'servers', label: 'Servers', icon: Server },
  { id: 'nodes',   label: 'Nodes',   icon: HardDrive },
  { id: 'config',  label: 'Hytale Config', icon: Settings },
]

export default function Sidebar({ currentTab, onNavigate, onLogout }) {
  const isActive = id => {
    if (id === 'servers') return currentTab.includes('server')
    if (id === 'nodes')   return currentTab.includes('node')
    return currentTab === id
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">Q</div>

      <div className="nav-menu">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${isActive(id) ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
            title={label}
          >
            <Icon size={20} />
            <span className="nav-item-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="nav-divider" />
        <button className="nav-item logout" onClick={onLogout} title="Sign Out">
          <LogOut size={20} />
          <span className="nav-item-label">Logout</span>
        </button>
      </div>
    </nav>
  )
}
