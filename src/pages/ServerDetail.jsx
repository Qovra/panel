import { Play, Square, RotateCcw, Trash2, ArrowLeft } from 'lucide-react'
import Badge       from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

export default function ServerDetail({ server, status, logs, loading, onAction, onDelete, onBack }) {
  const actualState  = status?.actual_state?.toLowerCase() || 'stopped'
  const isInstalling = server.status === 'installing' || status?.actual_state === 'INSTALLING'

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={onBack}><ArrowLeft size={16} /></button>
          <div>
            <div className="page-title">{server.name}</div>
            <div className="page-subtitle">
              {server.hostname} · Port {server.port} · {server.ram_mb} MB RAM
            </div>
          </div>
        </div>
        <Badge status={actualState} label={status ? status.actual_state : 'Loading…'} />
      </div>

      {/* Install progress */}
      {isInstalling && (
        <div className="card">
          <div className="card-body">
            <div className="text-sm font-semibold" style={{ color: 'var(--blue)', marginBottom: 8 }}>
              Installing server files… {server.install_progress}%
            </div>
            <ProgressBar value={server.install_progress} color="blue" height={8} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-grid">
        <button
          className="control-btn start"
          disabled={loading || isInstalling}
          onClick={() => onAction('start')}
        >
          <Play /><span>Start</span>
        </button>
        <button
          className="control-btn stop"
          disabled={loading || isInstalling}
          onClick={() => onAction('stop')}
        >
          <Square /><span>Stop</span>
        </button>
        <button
          className="control-btn restart"
          disabled={loading || isInstalling}
          onClick={() => onAction('restart')}
        >
          <RotateCcw /><span>Restart</span>
        </button>
        <button
          className="control-btn destroy"
          disabled={loading}
          onClick={onDelete}
        >
          <Trash2 /><span>Destroy</span>
        </button>
      </div>

      {/* Console */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="logs-header">
          <span>Real-time Console · TTY Buffer</span>
          <span style={{ opacity: 0.6 }}>Node Relay</span>
        </div>
        <pre className="logs-container">
          {logs || (isInstalling
            ? 'Installing core files… check install progress above.'
            : 'Waiting for output stream…'
          )}
        </pre>
      </div>
    </div>
  )
}
