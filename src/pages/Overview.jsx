import { Activity, Server, Users, Zap } from 'lucide-react'
import StatCard   from '../components/ui/StatCard'
import Card       from '../components/ui/Card'
import Badge      from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

const ramColor = pct => pct > 85 ? 'red' : pct > 60 ? 'yellow' : 'green'

export default function Overview({ stats, servers, nodes, onMasterAction, onOpenServer, loading, onNavigate }) {
  return (
    <div>
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="page-title">Network Overview</div>
          <div className="page-subtitle">Real-time status of your Hytale infrastructure</div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => onMasterAction('start')}   disabled={loading}>▶ Start Proxy</button>
          <button className="btn-secondary" onClick={() => onMasterAction('restart')} disabled={loading}>↺ Restart</button>
          <button className="btn-danger"    onClick={() => onMasterAction('stop')}    disabled={loading}>■ Stop</button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          icon={<Activity size={20} />}
          iconColor={stats?.master_status === 'running' ? 'green' : 'red'}
          label="Master Proxy"
          value={stats?.master_status ?? '—'}
          sub={`Port ${stats?.ingress_port ?? 5520}`}
          valueSize="1.1rem"
        />
        <StatCard
          icon={<Server size={20} />}
          iconColor="purple"
          label="Servers"
          value={servers.length}
          sub={`${servers.filter(s => s.status === 'running').length} running`}
        />
        <StatCard
          icon={<Users size={20} />}
          iconColor="blue"
          label="Active Players"
          value={stats?.active_players ?? 0}
          sub="Across all SNI routes"
        />
        <StatCard
          icon={<Zap size={20} />}
          iconColor="yellow"
          label="Bandwidth"
          value={stats?.global_bandwidth ?? '0 Mbps'}
          sub="Network Ingress"
          valueSize="1.1rem"
        />
      </div>

      {/* ── Content Row ──────────────────────────────────── */}
      <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>

        {/* Recent Servers */}
        <Card
          style={{ flex: 1 }}
          title="Recent Servers"
          action={
            <button
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
              onClick={() => onNavigate('servers')}
            >
              View All
            </button>
          }
          noPadding
        >
          {servers.length === 0 ? (
            <div className="empty-state">
              <Server size={32} />
              <p>No servers provisioned yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Port</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {servers.slice(0, 6).map(s => (
                  <tr key={s.id} onClick={() => onOpenServer(s)}>
                    <td className="font-semibold">{s.name}</td>
                    <td>
                      <span className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        {s.server_type}
                      </span>
                    </td>
                    <td className="text-sm text-secondary">{s.port}</td>
                    <td><Badge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Node Capacities */}
        <Card title="Node Capacities" style={{ width: 280 }} bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {nodes.length === 0 ? (
            <p className="text-sm text-muted">No nodes registered.</p>
          ) : nodes.map(n => {
            const pct = n.ram_total_mb > 0 ? Math.round((n.ram_used_mb / n.ram_total_mb) * 100) : 0
            return (
              <div key={n.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold truncate" style={{ maxWidth: 140 }}>{n.hostname}</span>
                  <span className="text-secondary">{pct}%</span>
                </div>
                <ProgressBar value={pct} color={ramColor(pct)} />
                <div className="flex justify-between mt-2">
                  <Badge status={n.status} size="sm" />
                  <span className="text-xs text-muted">{n.ram_used_mb}/{n.ram_total_mb} MB</span>
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
