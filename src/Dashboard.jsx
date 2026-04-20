import { useState, useEffect } from 'react'

import Sidebar      from './components/layout/Sidebar'
import Topbar       from './components/layout/Topbar'

import Overview    from './pages/Overview'
import ServersPage from './pages/ServersPage'
import NodesPage   from './pages/NodesPage'
import ServerDetail from './pages/ServerDetail'
import NodeForm    from './pages/NodeForm'
import ServerForm  from './pages/ServerForm'
import HytaleConfig from './pages/HytaleConfig'
import SystemLogs  from './pages/SystemLogs'

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
    if (['servers', 'server_detail', 'home'].includes(currentTab)) {
      fetch(`${API_BASE}/servers`, { headers })
        .then(r => r.json()).then(d => {
          setServers(d || [])
          // Sync active server if currently in detail view
          if (currentTab === 'server_detail' && activeServer) {
            const updated = (d || []).find(s => s.id === activeServer.id)
            if (updated) setActiveServer(updated)
          }
        }).catch(console.error)
    }
    if (['nodes', 'home'].includes(currentTab)) {
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

    let isMounted = true
    const fetchStatus = async () => {
      if (!isMounted) return
      try {
        const res = await fetch(`${API_BASE}/servers/status?id=${activeServer.id}`, { headers })
        const data = await res.json()
        if (res.ok && isMounted) {
          setStatus(data)
          // If the server was installing (known by backend) or state is Installing, refresh list
          if (activeServer.status === 'installing' || activeServer.installing || data.actual_state === 'INSTALLING') {
            fetch(`${API_BASE}/servers`, { headers })
              .then(r => r.json()).then(d => {
                if (!isMounted) return
                const refreshed = (d || [])
                setServers(refreshed)
                const updated = refreshed.find(s => s.id === activeServer.id)
                if (updated) setActiveServer(updated)
              })
          }
        }
      } catch {}
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)

    // WebSocket logic with simplified reconnection via dependency bounce
    if (!activeServer.node_ip || !activeServer.daemon_port) return

    let ws = null
    let reconnectTimeout = null

    const connectWs = () => {
      const wsUrl = `ws://${activeServer.node_ip}:${activeServer.daemon_port}/api/servers/console?id=${activeServer.id}&token=${activeServer.ws_token || token}`
      ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        if (!isMounted) return
        setLogs('')
        console.log(`[UI] Console connected to ${activeServer.id}`)
      }
      
      ws.onmessage = e => {
        if (isMounted) setLogs(prev => prev + e.data)
      }

      ws.onclose = () => {
        if (!isMounted) return
        console.log(`[UI] Console disconnected. Retrying in 5s...`)
        reconnectTimeout = setTimeout(connectWs, 5000)
      }

      ws.onerror = () => {
        if (isMounted) setLogs(prev => prev + '\n[UI] Connection error. Please check if Daemon port 8550 is open in firewall.\n')
      }
    }

    connectWs()

    return () => { 
      isMounted = false
      clearInterval(interval)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws) ws.close() 
    }
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
      const res = await fetch(`${API_BASE}/servers/${endpoint}?id=${activeServer.id}`, { method: 'POST', headers })
      if (!res.ok) {
        const d = await res.json()
        alert(`Action failed: ${d.message || res.statusText}`)
      }
    } catch (e) {
      alert(`Error reaching backend: ${e.message}`)
    } finally { 
      setLoading(false) 
    }
  }

  const sendServerCommand = async (cmd) => {
    try {
      const res = await fetch(`${API_BASE}/servers/command?id=${activeServer.id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command: cmd }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(`Command failed: ${d.message || res.statusText}`)
      }
    } catch (e) {
      alert(`Error: ${e.message}`)
    }
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
              onCommand={sendServerCommand}
            />
          )}

          {currentTab === 'config' && (
            <HytaleConfig 
              nodes={nodes} 
              token={token} 
            />
          )}

          {currentTab === 'system_logs' && (
            <SystemLogs token={token} />
          )}
        </main>
      </div>
    </div>
  )
}
