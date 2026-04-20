import { useState, useEffect, useRef } from 'react'
import { Terminal, RefreshCw } from 'lucide-react'

const SERVICES = [
  { id: 'daemon',  label: 'Daemon',  unit: 'qovra-daemon'   },
  { id: 'proxy',   label: 'Proxy',   unit: 'qovra-proxy'    },
  { id: 'backend', label: 'Backend', unit: 'qovra-backend'  },
]

export default function SystemLogs({ token }) {
  const [active, setActive]   = useState('daemon')
  const [logs, setLogs]       = useState({ daemon: '', proxy: '', backend: '' })
  const [running, setRunning] = useState({})
  const termRef               = useRef(null)
  const esRefs                = useRef({}) // EventSource refs per service

  // Auto-scroll
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [logs, active])

  const startStream = (serviceId) => {
    if (esRefs.current[serviceId]) esRefs.current[serviceId].close()

    const url = `/api/logs/${serviceId}?token=${token}`
    const es = new EventSource(url)

    es.onopen = () => setRunning(prev => ({ ...prev, [serviceId]: true }))
    es.onmessage = e => setLogs(prev => ({ ...prev, [serviceId]: prev[serviceId] + e.data + '\n' }))
    es.onerror = () => {
      setRunning(prev => ({ ...prev, [serviceId]: false }))
      setLogs(prev => ({ ...prev, [serviceId]: prev[serviceId] + '\n[QOVRA] Stream disconnected. Reconnecting...\n' }))
    }

    esRefs.current[serviceId] = es
    setRunning(prev => ({ ...prev, [serviceId]: true }))
  }

  const stopStream = (serviceId) => {
    if (esRefs.current[serviceId]) {
      esRefs.current[serviceId].close()
      delete esRefs.current[serviceId]
    }
    setRunning(prev => ({ ...prev, [serviceId]: false }))
  }

  const clearLog = (serviceId) => {
    setLogs(prev => ({ ...prev, [serviceId]: '' }))
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => Object.values(esRefs.current).forEach(es => es.close())
  }, [])

  const currentService = SERVICES.find(s => s.id === active)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">System Logs</div>
          <div className="page-subtitle">Real-time service logs via journald</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!running[active] ? (
            <button className="btn-primary" onClick={() => startStream(active)}>
              <Terminal size={15} /> Stream Logs
            </button>
          ) : (
            <button className="btn-secondary" onClick={() => stopStream(active)}>
              Stop
            </button>
          )}
          <button className="btn-secondary" onClick={() => clearLog(active)} title="Clear">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Service Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {SERVICES.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              fontWeight: active === s.id ? 700 : 400,
              background: active === s.id ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: active === s.id ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: running[s.id] ? 'var(--green)' : 'rgba(255,255,255,0.2)',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.78rem',
          opacity: 0.6,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={12} />
            journalctl -u {currentService?.unit} -f
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: running[active] ? 'var(--green)' : 'rgba(255,255,255,0.2)',
              display: 'inline-block',
            }} />
            {running[active] ? 'Streaming' : 'Idle'}
          </span>
        </div>
        <pre
          ref={termRef}
          className="logs-container"
          style={{ minHeight: 400, maxHeight: 600 }}
        >
          {logs[active] || (running[active]
            ? 'Connecting…'
            : 'Press "Stream Logs" to begin watching this service.'
          )}
        </pre>
      </div>
    </div>
  )
}
