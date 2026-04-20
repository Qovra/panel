import { Plus, HardDrive, RotateCcw } from 'lucide-react'
import Badge       from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

const ramColor = pct => pct > 85 ? 'red' : pct > 60 ? 'yellow' : 'green'

export default function NodesPage({ nodes, role, onMasterAction, onNavigate, loading }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Physical Nodes</div>
          <div className="page-subtitle">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} registered
          </div>
        </div>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => onNavigate('node_add')}>
            <Plus size={16} /> Add Node
          </button>
        )}
      </div>

      {nodes.length === 0 ? (
        <div className="card">
          <div className="empty-state"><HardDrive size={40} /><p>No nodes registered.</p></div>
        </div>
      ) : (
        <div className="item-grid">
          {nodes.map(n => {
            const pct = n.ram_total_mb > 0 ? Math.round((n.ram_used_mb / n.ram_total_mb) * 100) : 0
            return (
              <div key={n.id} className="item-card" style={{ cursor: 'default' }}>
                <div className="item-card-top">
                  <div>
                    <div className="item-card-name">{n.hostname}</div>
                    <div className="item-card-type">Physical Node</div>
                  </div>
                  <Badge status={n.status} />
                </div>

                <div className="item-card-meta" style={{ marginBottom: 10 }}>
                  <span>{n.ip}:{n.daemon_port}</span>
                </div>

                <div className="flex justify-between text-xs text-secondary mb-2">
                  <span>RAM Usage</span>
                  <span>{pct}% ({n.ram_used_mb}/{n.ram_total_mb} MB)</span>
                </div>
                <ProgressBar value={pct} color={ramColor(pct)} />

                {role === 'admin' && (
                  <button
                    className="btn-secondary w-full mt-3"
                    style={{ justifyContent: 'center', padding: '6px' }}
                    onClick={() => onMasterAction('restart')}
                    disabled={loading}
                  >
                    <RotateCcw size={13} /> Restart Proxy
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
