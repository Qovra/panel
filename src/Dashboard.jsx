import { useState, useEffect } from 'react'
import { Play, Square, RotateCcw, LogOut, ArrowLeft, Plus, Server, HardDrive, Trash2, Home, Activity, Users, Zap } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:3000/api'

export default function Dashboard({ token, role, onLogout }) {
  const [currentTab, setCurrentTab] = useState('home') // 'home', 'servers', 'nodes', 'node_add', 'server_add', 'server_detail'
  
  // Data States
  const [servers, setServers] = useState([])
  const [nodes, setNodes] = useState([])
  const [stats, setStats] = useState(null)
  const [activeServer, setActiveServer] = useState(null)
  
  // Active Server Dynamic States
  const [status, setStatus] = useState(null)
  const [logs, setLogs] = useState('')
  const [loading, setLoading] = useState(false)

  // Forms
  const [nodeForm, setNodeForm] = useState({ hostname: '', ip: '', daemon_port: 8550, ram_total_mb: 16384 })
  const [serverForm, setServerForm] = useState({ node_id: '', name: '', hostname: '', server_type: 'game', ram_mb: 1024, version: '1.0' })
  const [formError, setFormError] = useState('')

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  // Effect: General Fetchers based on Tab
  useEffect(() => {
    if (currentTab === 'servers' || currentTab === 'server_add' || currentTab === 'home') {
      fetch(`${API_BASE}/servers`, { headers: authHeaders })
        .then(res => res.json())
        .then(data => setServers(data || []))
        .catch(console.error)
    }
    if (currentTab === 'nodes' || currentTab === 'server_add' || currentTab === 'home') {
      fetch(`${API_BASE}/nodes`, { headers: authHeaders })
        .then(res => res.json())
        .then(data => setNodes(data || []))
        .catch(console.error)
    }
    if (currentTab === 'home') {
      fetch(`${API_BASE}/overview/stats`, { headers: authHeaders })
        .then(res => res.json())
        .then(setStats)
        .catch(console.error)
    }
  }, [currentTab])

  // Effect: Active Server Real-time Proxy & Logs (WebSocket)
  useEffect(() => {
    if (currentTab !== 'server_detail' || !activeServer) return

    // 1. Polling for Status/Progress (Backend Relay)
    const fetchProxyStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/servers/status?id=${activeServer.id}`, { headers: authHeaders })
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
          if (data.status === 'installing') {
            fetch(`${API_BASE}/servers`, { headers: authHeaders })
              .then(res => res.json())
              .then(d => setServers(d || []))
          }
        }
      } catch (e) {}
    }
    
    fetchProxyStatus()
    const statusInt = setInterval(fetchProxyStatus, 2000)

    // 2. WebSocket for Logs (Direct to Daemon)
    if (!activeServer.node_ip || !activeServer.daemon_port) {
      console.warn("[Dashboard] Missing node metadata for WebSocket connect:", activeServer)
      return
    }

    const wsUrl = `ws://${activeServer.node_ip}:${activeServer.daemon_port}/api/servers/console?id=${activeServer.id}&token=${activeServer.ws_token}`
    console.log("[Dashboard] Connecting to console WebSocket:", wsUrl)
    
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (event) => {
      setLogs(prev => prev + event.data)
    }
    ws.onopen = () => setLogs('') // Clear logs on connect
    ws.onerror = (err) => {
      console.error("[Dashboard] WebSocket error:", err)
      setLogs(prev => prev + "\n[UI] Failed to connect to real-time console. Retrying via polling fallback...\n")
    }

    return () => {
      clearInterval(statusInt)
      ws.close()
    }
  }, [activeServer?.id, currentTab])

  // Submissions
  const submitNode = async (e) => {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/nodes/create`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({...nodeForm, daemon_port: parseInt(nodeForm.daemon_port), ram_total_mb: parseInt(nodeForm.ram_total_mb)})
      })
      if (!res.ok) throw new Error("Failed to create node. Hostname might be taken.")
      setCurrentTab('nodes')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitServer = async (e) => {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/servers/create`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({...serverForm, ram_mb: parseInt(serverForm.ram_mb)})
      })
      if (!res.ok) throw new Error("Failed to allocate server. Hostname might be taken or Daemon unreachable.")
      setCurrentTab('servers')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const proxyAction = async (endpoint) => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/servers/${endpoint}?id=${activeServer.id}`, { method: 'POST', headers: authHeaders })
    } catch (err) {} finally { setLoading(false) }
  }

  const deleteServer = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this server and all its files?")) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/servers/delete?id=${activeServer.id}`, { 
        method: 'DELETE', 
        headers: authHeaders 
      })
      if (res.ok) {
        setCurrentTab('servers')
        setActiveServer(null)
      } else {
        const data = await res.json()
        alert(data.message || "Failed to delete server")
      }
    } catch (err) {
      alert("Error connecting to backend")
    } finally {
      setLoading(false)
    }
  }

  const masterProxyAction = async (action) => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/node/master/action?action=${action}`, { method: 'POST', headers: authHeaders })
      // Refresh stats
      fetch(`${API_BASE}/overview/stats`, { headers: authHeaders })
        .then(res => res.json())
        .then(setStats)
    } catch (err) {} finally { setLoading(false) }
  }

  // Component Renderers
  const renderHome = () => (
    <div className="home-overview">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1>Network Overview</h1>
        <div style={{display: 'flex', gap: '0.75rem'}}>
          <button className="btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => masterProxyAction('start')} disabled={loading}>Start Proxy</button>
          <button className="btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => masterProxyAction('restart')} disabled={loading}>Restart</button>
          <button className="btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444'}} onClick={() => masterProxyAction('stop')} disabled={loading}>Stop</button>
        </div>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem'}}>
        <div className="stats-card">
          <Activity className="icon" style={{color: stats?.master_status === 'running' ? '#22c55e' : '#ef4444'}} />
          <div className="label">Master Proxy Status</div>
          <div className="value" style={{textTransform: 'uppercase'}}>{stats?.master_status || 'Checking...'}</div>
          <div className="subtext">Port: {stats?.ingress_port || 5520} | Hot Reload: {stats?.hot_reload_status || 'N/A'}</div>
        </div>
        <div className="stats-card">
          <Users className="icon" style={{color: '#3b82f6'}} />
          <div className="label">Active Players</div>
          <div className="value">{stats?.active_players || 0}</div>
          <div className="subtext">Across all SNI routes</div>
        </div>
        <div className="stats-card">
          <Zap className="icon" style={{color: '#eab308'}} />
          <div className="label">Global Bandwidth</div>
          <div className="value">{stats?.global_bandwidth || '0 Mbps'}</div>
          <div className="subtext">Network Ingress Active</div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
        <div className="glass-panel" style={{padding: '1.5rem'}}>
          <h3 style={{marginBottom: '1rem'}}>Recent Servers</h3>
          {servers.slice(0, 5).map(s => (
            <div key={s.id} style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer'}}
              onClick={() => { setActiveServer(s); setCurrentTab('server_detail') }}>
              <span>{s.name}</span>
              <span style={{color: s.status === 'running' ? '#22c55e' : (s.status.includes('install') ? '#3b82f6' : '#ef4444'), fontSize: '0.9rem'}}>{s.status}</span>
            </div>
          ))}
          <button className="btn-secondary" style={{width: '100%', marginTop: '1rem'}} onClick={() => setCurrentTab('servers')}>View All Servers</button>
        </div>
        <div className="glass-panel" style={{padding: '1.5rem'}}>
          <h3 style={{marginBottom: '1rem'}}>Node Capacities</h3>
          {nodes.map(n => (
            <div key={n.id} style={{marginBottom: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem'}}>
                <span>{n.hostname}</span>
                <span>{Math.round((n.ram_used_mb / n.ram_total_mb) * 100)}%</span>
              </div>
              <div style={{height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px'}}>
                <div style={{height: '100%', width: `${(n.ram_used_mb / n.ram_total_mb) * 100}%`, background: 'var(--primary-color)', borderRadius: '3px'}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderServersGrid = () => (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
         <h2>Active Game Instances</h2>
         {(role === 'admin' || role === 'staff') && (
           <button onClick={() => setCurrentTab('server_add')} className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
             <Plus size={18} /> Deploy New Game
           </button>
         )}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem'}}>
         {servers.length === 0 ? <p style={{color: 'var(--text-muted)'}}>No servers provisioned yet.</p> : 
           servers.map(s => (
             <div key={s.id} onClick={() => { setActiveServer(s); setCurrentTab('server_detail') }}
               style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
               onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
               onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
             >
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <strong>{s.name}</strong>
                    <span style={{fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 600, textTransform: 'uppercase'}}>{s.server_type}</span>
                  </div>
                  <span style={{ color: s.status === 'running' ? '#22c55e' : (s.status.includes('install') ? '#3b82f6' : '#ef4444'), fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>• {s.status}</span>
                </div>
                
                {s.installing && (
                  <div style={{marginBottom: '1rem'}}>
                    <div style={{fontSize: '0.7rem', marginBottom: '0.25rem', color: '#3b82f6'}}>Downloading Files: {s.install_progress}%</div>
                    <div style={{height: '4px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '2px', overflow: 'hidden'}}>
                      <div style={{height: '100%', width: `${s.install_progress}%`, background: '#3b82f6', transition: 'width 0.3s'}}></div>
                    </div>
                  </div>
                )}

                <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{s.hostname}</div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>Port: {s.port} | RAM: {s.ram_mb}MB</div>
             </div>
           ))}
      </div>
    </>
  )

  const renderNodesGrid = () => (
    <>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
         <h2>Physical Nodes</h2>
         {(role === 'admin') && (
           <button onClick={() => setCurrentTab('node_add')} className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
             <Plus size={18} /> Add Node
           </button>
         )}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem'}}>
         {nodes.map(n => (
           <div key={n.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                <strong>{n.hostname}</strong>
                <span className={`status-badge`} style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem'}}>
                  <div className={`indicator ${n.status}`}></div> {n.status}
                </span>
              </div>
              <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                 IP: {n.ip}:{n.daemon_port}
                 <div style={{marginTop: '0.5rem'}}>RAM: {n.ram_used_mb}MB / {n.ram_total_mb}MB</div>
               {role === 'admin' && (
                 <div style={{marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem'}}>
                   <button className="btn-secondary" style={{width: '100%', fontSize: '0.75rem', padding: '0.4rem'}} 
                     onClick={() => masterProxyAction('restart')} disabled={loading}>
                     <RotateCcw size={12} style={{marginRight: '0.4rem'}} /> Restart Proxy
                   </button>
                 </div>
               )}
              </div>
           </div>
         ))}
      </div>
    </>
  )

  const renderNodeForm = () => (
    <div className="glass-panel" style={{padding: '2rem', maxWidth: '600px', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
        <button onClick={() => setCurrentTab('nodes')} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer'}}><ArrowLeft /></button>
        <h2>Register New Engine Node</h2>
      </div>
      <form onSubmit={submitNode} className="grid-forms">
        <div className="input-group">
          <label>Hostname (FQDN)</label>
          <input required placeholder="node-02.example.com" value={nodeForm.hostname} onChange={e => setNodeForm({...nodeForm, hostname: e.target.value})} />
        </div>
        <div className="input-group">
          <label>IP Address</label>
          <input required placeholder="192.168.1.10" value={nodeForm.ip} onChange={e => setNodeForm({...nodeForm, ip: e.target.value})} />
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div className="input-group" style={{flex: 1}}>
            <label>Daemon Port</label>
            <input required type="number" value={nodeForm.daemon_port} onChange={e => setNodeForm({...nodeForm, daemon_port: e.target.value})} />
          </div>
          <div className="input-group" style={{flex: 1}}>
            <label>RAM Allocation (MB)</label>
            <input required type="number" value={nodeForm.ram_total_mb} onChange={e => setNodeForm({...nodeForm, ram_total_mb: e.target.value})} />
          </div>
        </div>
        {formError && <div className="error-text" style={{marginTop: '1rem'}}>{formError}</div>}
        <button type="submit" className="btn-primary" style={{marginTop: '1rem'}} disabled={loading}>{loading ? 'Registering...' : 'Submit Node'}</button>
      </form>
    </div>
  )

  const renderServerForm = () => (
    <div className="glass-panel" style={{padding: '2rem', maxWidth: '600px', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
        <button onClick={() => setCurrentTab('servers')} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer'}}><ArrowLeft /></button>
        <h2>Deploy New Game Instance</h2>
      </div>
      <form onSubmit={submitServer} className="grid-forms">
        <div className="input-group">
          <label>Target Node Allocation</label>
          <select className="input-classic" required value={serverForm.node_id} onChange={e => setServerForm({...serverForm, node_id: e.target.value})}>
             <option value="" disabled>Select physical node...</option>
             {nodes.filter(n => n.status === 'online').map(n => <option key={n.id} value={n.id}>{n.hostname} (RAM: {n.ram_used_mb}/{n.ram_total_mb}MB)</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Allocation RAM Limit (MB)</label>
          <input required type="number" value={serverForm.ram_mb} onChange={e => setServerForm({...serverForm, ram_mb: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Instance Display Name</label>
          <input required placeholder="Survival Europe #01" value={serverForm.name} onChange={e => setServerForm({...serverForm, name: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Public Hostname / Domain (FQDN)</label>
          <input required placeholder="play.hytale.net" value={serverForm.hostname} onChange={e => setServerForm({...serverForm, hostname: e.target.value})} />
        </div>
        {formError && <div className="error-text" style={{marginTop: '1rem'}}>{formError}</div>}
        <button type="submit" className="btn-primary" style={{marginTop: '1rem'}} disabled={loading}>{loading ? 'Deploying and Provisioning...' : 'Build and Install'}</button>
      </form>
    </div>
  )

  const renderServerDetail = () => {
    const actualState = status?.actual_state?.toLowerCase() || 'stopped'
    const isInstalling = activeServer.status === 'installing' || status?.actual_state === 'INSTALLING'
    
    return (
      <div className="glass-panel dashboard-container" style={{margin: 0, border: 'none', boxShadow: 'none'}}>
        <div className="dashboard-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <button onClick={() => setCurrentTab('servers')} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer'}}>
              <ArrowLeft />
            </button>
            <h1 className="dashboard-title">
              <span>{activeServer.name}</span>
              <div className={`status-badge`}>
                 <div className={`indicator ${actualState}`}></div>
                 {status ? status.actual_state : "LOADING..."}
              </div>
            </h1>
          </div>
        </div>
        <div className="controls-grid">
          <button className="control-btn start" disabled={loading || isInstalling} onClick={() => proxyAction('start')}><Play /><span>Start Server</span></button>
          <button className="control-btn stop" disabled={loading || isInstalling} onClick={() => proxyAction('stop')}><Square /><span>Stop Process</span></button>
          <button className="control-btn restart" disabled={loading || isInstalling} onClick={() => proxyAction('restart')}><RotateCcw /><span>Reboot</span></button>
          <button className="control-btn stop" style={{borderColor: '#ef4444', color: '#ef4444'}} disabled={loading} onClick={deleteServer}><Trash2 /><span>Destroy</span></button>
        </div>
        <div className="logs-section">
          <div className="logs-header"><span>Real-time TTY Buffer</span><span style={{ fontSize: '0.8rem' }}>Node Relay</span></div>
          <pre className="logs-container">{logs || (isInstalling ? "System is installing core files... check progress in dashboard" : "Waiting for output stream...")}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-title">HYTALE_OPS</div>
        <div className="nav-menu">
          <button className={`nav-item ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>
            <Home size={18} /> Overview
          </button>
          <button className={`nav-item ${currentTab.includes('server') ? 'active' : ''}`} onClick={() => setCurrentTab('servers')}>
            <Server size={18} /> Servers
          </button>
          <button className={`nav-item ${currentTab.includes('node') ? 'active' : ''}`} onClick={() => setCurrentTab('nodes')}>
            <HardDrive size={18} /> Nodes
          </button>
        </div>
        <div style={{marginTop: 'auto'}}>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center'}}>
            Logged in as <b>{role}</b>
          </div>
          <button onClick={onLogout} className="nav-item" style={{color: '#ef4444', justifyContent: 'center'}}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentTab === 'home' && renderHome()}
        {currentTab === 'servers' && renderServersGrid()}
        {currentTab === 'nodes' && renderNodesGrid()}
        {currentTab === 'node_add' && renderNodeForm()}
        {currentTab === 'server_add' && renderServerForm()}
        {currentTab === 'server_detail' && renderServerDetail()}
      </main>

      <style>{`
        .home-overview .stats-card {
           background: rgba(0,0,0,0.3);
           border: 1px solid var(--border-color);
           padding: 1.5rem;
           border-radius: 12px;
           display: flex;
           flex-direction: column;
           gap: 0.5rem;
           position: relative;
        }
        .home-overview .stats-card .icon {
           position: absolute;
           top: 1.5rem;
           right: 1.5rem;
           opacity: 0.8;
        }
        .home-overview .stats-card .label {
           font-size: 0.9rem;
           color: var(--text-muted);
        }
        .home-overview .stats-card .value {
           font-size: 1.8rem;
           font-weight: 700;
        }
        .home-overview .stats-card .subtext {
           font-size: 0.8rem;
           color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
