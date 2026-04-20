import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from '../components/ui/Card'

export default function ServerForm({ nodes, onSubmit, onBack, loading }) {
  const [form, setForm] = useState({
    node_id: '', name: '', hostname: '', server_type: 'game', ram_mb: 1024, version: '1.0',
  })
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit({ ...form, ram_mb: parseInt(form.ram_mb) })
    } catch (err) {
      setError(err.message)
    }
  }

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const onlineNodes = nodes.filter(n => n.status === 'online')

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={onBack}><ArrowLeft size={16} /></button>
          <div>
            <div className="page-title">Deploy Server</div>
            <div className="page-subtitle">Provision a new game instance on an available node</div>
          </div>
        </div>
      </div>

      <Card title="Instance Configuration" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} className="grid-forms">
          <div className="input-group">
            <label>Target Node</label>
            <select className="input-classic" required value={form.node_id} onChange={set('node_id')}>
              <option value="" disabled>Select physical node…</option>
              {onlineNodes.length === 0
                ? <option disabled>No online nodes available</option>
                : onlineNodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.hostname} (RAM: {n.ram_used_mb}/{n.ram_total_mb} MB)
                    </option>
                  ))
              }
            </select>
          </div>
          <div className="input-group">
            <label>Display Name</label>
            <input required placeholder="Survival Europe #01" value={form.name} onChange={set('name')} />
          </div>
          <div className="input-group">
            <label>Public Hostname / FQDN</label>
            <input required placeholder="play.hytale.net" value={form.hostname} onChange={set('hostname')} />
          </div>
          <div className="input-group">
            <label>RAM Limit (MB)</label>
            <input required type="number" min={512} value={form.ram_mb} onChange={set('ram_mb')} />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Deploying…' : 'Build & Install'}
          </button>
        </form>
      </Card>
    </div>
  )
}
