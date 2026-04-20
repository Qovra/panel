import { useState, useEffect } from 'react'

import Sidebar      from './components/layout/Sidebar'
import Topbar       from './components/layout/Topbar'

import Overview    from './pages/Overview'
import ServersPage from './pages/ServersPage'
import NodesPage   from './pages/NodesPage'
import ServerDetail from './pages/ServerDetail'
import NodeForm    from './pages/NodeForm'
import ServerForm  from './pages/ServerForm'

const API_BASE = '/api'

export default function Dashboard({ token, role, onLogout }) {
  const [currentTab, setCurrentTab] = useState('home')

  // ── Data ──────────────────────────────────────────────────
  const [servers, setServers]           = useState([])
  const [nodes, setNodes]               = useState([])
  const [stats, setStats]               = useState(null)
  const [activeServer, setActiveServer] = useState(null)

  // ── Server detail ─────────────────────────────────────────
  const [status, setStatus]   = useState(null)
  const [logs, setLogs]       = useState('')
  const [loading, setLoading] = useState(false)

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
  }

  // ── Fetch on tab change ───────────────────────────────────
  useEffect(() => {
    if (['servers', 'server_add', 'home'].includes(currentTab)) {
      fetch(`${API_BASE}/servers`, { headers })
        .then(r => r.json()).then(d => setServers(d || [])).catch(console.error)
    }
    if (['nodes', 'server_add', 'home'].includes(currentTab)) {
      fetch(`${API_BASE}/nodes`, { headers })
        .then(r => r.json()).then(d => setNodes(d || [])).catch(console.error)
    }
    if (currentTab === 'home') {
      fetch(`${API_BASE}/overview/stats`, { headers })
        .then(r => r.json()).then(setStats).catch(console.error)
    }
  }, [currentTab])

  // ── Server detail: poll + WebSocket ──────────────────────
  useEffect(() => {
    if (currentTab !== 'server_detail' || !activeServer) return

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/servers/status?id=${activeServer.id}`, { headers })
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
          if (data.status === 'installing') {
            fetch(`${API_BASE}/servers`, { headers })
              .then(r => r.json()).then(d => setServers(d || []))
          }
        }
      } catch {}
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)

    if (!activeServer.node_ip || !activeServer.daemon_port) return

    const wsUrl = `ws://${activeServer.node_ip}:${activeServer.daemon_port}/api/servers/console?id=${activeServer.id}&token=${activeServer.ws_token}`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = e  => setLogs(prev => prev + e.data)
    ws.onopen    = () => setLogs('')
    ws.onerror   = () => setLogs(prev => prev + '\n[UI] Failed to connect to real-time console.\n')

    return () => { clearInterval(interval); ws.close() }
  }, [activeServer?.id, currentTab])

  // ── Actions ───────────────────────────────────────────────
  const openServer = server => {
    setActiveServer(server)
    setStatus(null)
    setLogs('')
    setCurrentTab('server_detail')
  }

  const proxyAction = async endpoint => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/servers/${endpoint}?id=${activeServer.id}`, { method: 'POST', headers })
    } catch {} finally { setLoading(false) }
  }

  const deleteServer = async () => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this server and all its files?')) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/servers/delete?id=${activeServer.id}`, { method: 'DELETE', headers })
      if (res.ok) { setCurrentTab('servers'); setActiveServer(null) }
      else { const d = await res.json(); alert(d.message || 'Failed to delete server') }
    } catch { alert('Error connecting to backend') }
    finally { setLoading(false) }
  }

  const masterAction = async action => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/node/master/action?action=${action}`, { method: 'POST', headers })
      fetch(`${API_BASE}/overview/stats`, { headers }).then(r => r.json()).then(setStats)
    } catch {} finally { setLoading(false) }
  }

  const submitNode = async data => {
    const res = await fetch(`${API_BASE}/nodes/create`, {
      method: 'POST', headers, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create node. Hostname might be taken.')
    setCurrentTab('nodes')
  }

  const submitServer = async data => {
    const res = await fetch(`${API_BASE}/servers/create`, {
      method: 'POST', headers, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to allocate server. Hostname might be taken or Daemon unreachable.')
    setCurrentTab('servers')
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onLogout={onLogout}
      />

      <div className="main-area">
        <Topbar currentTab={currentTab} role={role} />

        <main className="main-content">
          {currentTab === 'home' && (
            <Overview
              stats={stats}
              servers={servers}
              nodes={nodes}
              loading={loading}
              onMasterAction={masterAction}
              onOpenServer={openServer}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'servers' && (
            <ServersPage
              servers={servers}
              role={role}
              onOpenServer={openServer}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'nodes' && (
            <NodesPage
              nodes={nodes}
              role={role}
              loading={loading}
              onMasterAction={masterAction}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'node_add' && (
            <NodeForm
              loading={loading}
              onSubmit={async data => { setLoading(true); try { await submitNode(data) } finally { setLoading(false) } }}
              onBack={() => setCurrentTab('nodes')}
            />
          )}

          {currentTab === 'server_add' && (
            <ServerForm
              nodes={nodes}
              loading={loading}
              onSubmit={async data => { setLoading(true); try { await submitServer(data) } finally { setLoading(false) } }}
              onBack={() => setCurrentTab('servers')}
            />
          )}

          {currentTab === 'server_detail' && activeServer && (
            <ServerDetail
              server={activeServer}
              status={status}
              logs={logs}
              loading={loading}
              onAction={proxyAction}
              onDelete={deleteServer}
              onBack={() => setCurrentTab('servers')}
            />
          )}
        </main>
      </div>
    </div>
  )
}
