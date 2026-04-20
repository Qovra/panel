import { useState } from 'react'

// Use a relative path so the panel works regardless of the server IP/hostname.
// Since the backend serves both the API and this SPA on the same port,
// '/api' always resolves to the correct host.
const API_BASE = '/api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json()
      onLogin(data.token, data.role)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel login-container">
      <h2 className="login-title">Hytale Control Panel</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input 
            id="email"
            type="email" 
            placeholder="admin@hytale.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input 
            id="password"
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="error-text">{error}</div>}
        
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Authenticating..." : "Log In"}
        </button>
      </form>
    </div>
  )
}
