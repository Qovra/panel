import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Card from '../components/ui/Card'

export default function NodeForm({ onSubmit, onBack, loading }) {
  const [form, setForm] = useState({
    hostname: '', ip: '', daemon_port: 8550, ram_total_mb: 16384,
  })
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit({
        ...form,
        daemon_port:  parseInt(form.daemon_port),
        ram_total_mb: parseInt(form.ram_total_mb),
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={onBack}><ArrowLeft size={16} /></button>
          <div>
            <div className="page-title">Register Node</div>
            <div className="page-subtitle">Add a new physical node to the cluster</div>
          </div>
        </div>
      </div>

      <Card title="Node Details" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} className="grid-forms">
          <div className="input-group">
            <label>Hostname (FQDN)</label>
            <input required placeholder="node-02.example.com" value={form.hostname} onChange={set('hostname')} />
          </div>
          <div className="input-group">
            <label>IP Address</label>
            <input required placeholder="192.168.1.10" value={form.ip} onChange={set('ip')} />
          </div>
          <div className="flex gap-3">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Daemon Port</label>
              <input required type="number" value={form.daemon_port} onChange={set('daemon_port')} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Total RAM (MB)</label>
              <input required type="number" value={form.ram_total_mb} onChange={set('ram_total_mb')} />
            </div>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Registering…' : 'Submit Node'}
          </button>
        </form>
      </Card>
    </div>
  )
}
