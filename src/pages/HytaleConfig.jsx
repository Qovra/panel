import { useState, useRef, useEffect, useCallback } from 'react'
import { Globe, ShieldCheck, Terminal, RefreshCw } from 'lucide-react'

export default function HytaleConfig({ nodes, token }) {
  const [selectedNode, setSelectedNode] = useState('')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState('')
  const termRef = useRef(null)
  const wsRef = useRef(null)

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [output])

  const handleStartAuth = useCallback(() => {
    if (!selectedNode || running) return
    const node = nodes.find(n => n.id === selectedNode)
    if (!node) return

    setOutput('')
    setRunning(true)

    // Close any existing connection
    if (wsRef.current) wsRef.current.close()

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${window.location.host}/api/node/cli-auth?id=${node.id}&token=${token}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = e => setOutput(prev => prev + e.data)
    ws.onopen    = () => setOutput('[QOVRA] Connected to node. Launching downloader...\n')
    ws.onclose   = () => { setRunning(false); setOutput(prev => prev + '\n[QOVRA] Session ended.\n') }
    ws.onerror   = () => { setRunning(false); setOutput(prev => prev + '\n[QOVRA-ERR] Connection error. Check if port 8550 is open.\n') }
  }, [selectedNode, nodes, token, running])

  const handleStop = () => {
    if (wsRef.current) wsRef.current.close()
    setRunning(false)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Hytale Management</div>
          <div className="page-subtitle">Configure global downloader and node-level credentials</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* CLI Downloader Section */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} style={{ opacity: 0.6 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Global Downloader Auth</h3>
          </div>
          <div className="card-body">
            <p className="text-sm" style={{ opacity: 0.7, marginBottom: 16 }}>
              Authenticate the Hytale CLI Downloader on a Node. This is a one-time step that 
              lets the downloader fetch game files. A terminal will open showing the auth URL and code.
            </p>

            <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Select Node
            </label>
            <select
              className="input"
              style={{ width: '100%', marginBottom: 12 }}
              value={selectedNode}
              onChange={e => setSelectedNode(e.target.value)}
              disabled={running}
            >
              <option value="">-- Choose a node --</option>
              {nodes.filter(n => n.status === 'online').map(n => (
                <option key={n.id} value={n.id}>{n.hostname} ({n.ip})</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleStartAuth}
                disabled={running || !selectedNode}
              >
                <RefreshCw size={16} className={running ? 'animate-spin' : ''} />
                {running ? 'Running...' : 'Authenticate Downloader'}
              </button>
              {running && (
                <button className="btn-secondary" onClick={handleStop}>Stop</button>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: 'var(--green)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Auth Flow Guide</h3>
          </div>
          <div className="card-body">
            <ol style={{ fontSize: '0.85rem', opacity: 0.8, paddingLeft: 16, lineHeight: 2 }}>
              <li>Select an online node and click <b>Authenticate Downloader</b></li>
              <li>The terminal below will show a URL and a code (e.g. <code>ABCD-1234</code>)</li>
              <li>Visit the URL in your browser and enter the code</li>
              <li>Once done, create a server — the downloader will run automatically</li>
              <li>After the server starts, go to Server Detail to authenticate the server identity via <code>/auth login device</code></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Live Terminal */}
      {(output !== '') && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', opacity: 0.6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={14} /> Downloader Output
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: running ? 'var(--green)' : 'var(--text-secondary)', display: 'inline-block' }} />
              {running ? 'Live' : 'Done'}
            </span>
          </div>
          <pre ref={termRef} className="logs-container" style={{ maxHeight: 300 }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}
