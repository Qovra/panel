import { useState } from 'react'
import { Play, Square, RotateCcw, Trash2, ArrowLeft, ExternalLink, Terminal } from 'lucide-react'
import Badge       from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

export default function ServerDetail({ server, status, logs, loading, onAction, onDelete, onBack, onCommand }) {
  const [command, setCommand] = useState('')
  const actualState  = status?.actual_state?.toLowerCase() || 'stopped'
  const isInstalling = server.status === 'installing' || status?.actual_state === 'INSTALLING'
  const isRunning    = actualState === 'running'

  const handleSendCommand = async e => {
    e.preventDefault()
    if (!command.trim()) return
    if (onCommand) await onCommand(command.trim())
    setCommand('')
  }

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
      {(isInstalling || (server.auth_url && server.status === 'installing')) && (
        <div className="card" style={{ border: server.auth_url ? '1px solid var(--blue)' : 'none' }}>
          <div className="card-body">
            <div className="text-sm font-semibold" style={{ color: 'var(--blue)', marginBottom: 8 }}>
              {server.auth_url ? '⚠️ Server Auth Required' : `Installing server files… ${server.install_progress}%`}
            </div>
            {server.auth_url ? (
              <div style={{ marginTop: 12 }}>
                <p className="text-sm" style={{ opacity: 0.8, marginBottom: 12 }}>
                  Your Hytale server needs identity authentication. Start the server, then use the 
                  command box below to send <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>/auth login device</code>.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <a 
                    href={server.auth_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ background: 'var(--blue)', padding: '8px 16px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <ExternalLink size={16} /> Open Hytale Auth
                  </a>
                  {server.auth_code && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: 6, border: '1px dashed var(--blue)' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: 2 }}>{server.auth_code}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <ProgressBar value={server.install_progress} color="blue" height={8} />
            )}
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

        {/* Send Command */}
        <form onSubmit={handleSendCommand} style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ display: 'flex', alignItems: 'center', opacity: 0.4, paddingLeft: 4 }}>
            <Terminal size={14} />
          </span>
          <input
            type="text"
            className="input"
            placeholder={isRunning ? 'Send command… (e.g. /auth login device)' : 'Start the server to send commands'}
            value={command}
            onChange={e => setCommand(e.target.value)}
            disabled={!isRunning || loading}
            style={{ flex: 1, padding: '6px 10px', fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!isRunning || !command.trim() || loading}
            style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
