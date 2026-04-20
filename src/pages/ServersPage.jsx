import { Plus, Server } from 'lucide-react'
import Badge       from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

export default function ServersPage({ servers, role, onOpenServer, onNavigate }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Game Servers</div>
          <div className="page-subtitle">
            {servers.length} instance{servers.length !== 1 ? 's' : ''} provisioned
          </div>
        </div>
        {(role === 'admin' || role === 'staff') && (
          <button className="btn-primary" onClick={() => onNavigate('server_add')}>
            <Plus size={16} /> Deploy New
          </button>
        )}
      </div>

      {servers.length === 0 ? (
        <div className="card">
          <div className="empty-state"><Server size={40} /><p>No servers provisioned yet.</p></div>
        </div>
      ) : (
        <div className="item-grid">
          {servers.map(s => (
            <div key={s.id} className="item-card" onClick={() => onOpenServer(s)}>
              <div className="item-card-top">
                <div>
                  <div className="item-card-name">{s.name}</div>
                  <div className="item-card-type">{s.server_type}</div>
                </div>
                <Badge status={s.status} />
              </div>

              {s.installing && (
                <div style={{ marginBottom: 10 }}>
                  <div className="text-xs" style={{ color: 'var(--blue)', marginBottom: 4 }}>
                    Installing: {s.install_progress}%
                  </div>
                  <ProgressBar value={s.install_progress} color="blue" />
                </div>
              )}

              <div className="item-card-meta">
                <span>{s.hostname}</span>
                <span>Port {s.port} · {s.ram_mb} MB RAM</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
