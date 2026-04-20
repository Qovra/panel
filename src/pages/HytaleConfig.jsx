import { useState } from 'react'
import { Key, Globe, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react'

export default function HytaleConfig({ nodes, token }) {
  const [selectedNode, setSelectedNode] = useState('')
  const [loading, setLoading] = useState(false)
  const [authData, setAuthData] = useState(null)
  const [error, setError] = useState('')

  const handleStartAuth = async () => {
    if (!selectedNode) return
    setLoading(true)
    setError('')
    setAuthData(null)

    try {
      const res = await fetch(`/api/node/cli-auth?id=${selectedNode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (res.ok) {
        if (data.message) {
          setError(data.message)
        } else {
          setAuthData(data)
        }
      } else {
        setError(data.message || 'Failed to trigger authentication')
      }
    } catch (err) {
      setError('Communication error with backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hytale-config">
      <div className="page-header">
        <div>
          <div className="page-title">Hytale Management</div>
          <div className="page-subtitle">Configure global downloader and node-level credentials</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CLI Downloader Section */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Globe size={18} className="text-secondary" />
            <h3 className="text-lg font-semibold">Global Downloader Auth</h3>
          </div>
          <div className="card-body">
            <p className="text-sm text-secondary mb-6">
              The Hytale CLI Downloader requires a one-time authentication with a licensed Hytale account 
              to download game files. This auth is stored per physical Node.
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold uppercase opacity-60 mb-2 block">Select Node</label>
              <select 
                className="input w-full"
                value={selectedNode}
                onChange={e => setSelectedNode(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Choose a node --</option>
                {nodes.filter(n => n.status === 'online').map(n => (
                  <option key={n.id} value={n.id}>{n.hostname} ({n.ip})</option>
                ))}
              </select>
            </div>

            <button 
              className="btn-primary w-full justify-center"
              onClick={handleStartAuth}
              disabled={loading || !selectedNode}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Requesting Code...' : 'Authenticate Downloader'}
            </button>

            {error && (
              <div className="mt-4 p-3 rounded bg-red-soft text-red text-sm border border-red-20">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Auth Display Card */}
        {authData && (
          <div className="card border-blue">
            <div className="card-header flex items-center gap-2 text-blue">
              <Key size={18} />
              <h3 className="text-lg font-semibold text-blue">OAuth2 Required</h3>
            </div>
            <div className="card-body">
              <p className="text-sm mb-4">
                Follow the link and enter the code below in the Hytale developer portal to authorize this node.
              </p>
              
              <div className="mb-6">
                <label className="text-xs font-bold uppercase opacity-60 mb-1 block">Device Code</label>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 8, border: '1px dashed var(--blue)', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: 4 }}>{authData.auth_code}</span>
                </div>
              </div>

              <a 
                href={authData.auth_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary w-full justify-center"
                style={{ background: 'var(--blue)' }}
              >
                <ExternalLink size={16} /> Open Authorization URL
              </a>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="card bg-secondary">
          <div className="card-header flex items-center gap-2">
            <ShieldCheck size={18} className="text-green" />
            <h3 className="text-lg font-semibold">Security Note</h3>
          </div>
          <div className="card-body">
            <ul className="text-sm list-disc pl-5 opacity-70 space-y-2">
              <li>Downloader credentials allow fetching game core files.</li>
              <li>Server identity (per-instance) will still require a separate auth step upon first launch.</li>
              <li>Multipass/VPS environments must have outgoing port 443 open for OAuth.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
