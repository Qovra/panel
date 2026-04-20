import { useState } from 'react'

const API_BASE = '/api'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      onLogin(data.token, data.role)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split">

      {/* ── Left: Form Panel ─────────────────────────────── */}
      <div className="login-panel">
        {/* Logo */}
        <div className="login-brand">
          <div className="login-brand-icon">Q</div>
          <span className="login-brand-name">Qovra</span>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Welcome Back!</h1>
          <p>Sign in to manage your Hytale infrastructure</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="login-field">
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <span className="login-field-icon">
              {/* Mail icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </span>
          </div>

          {/* Password */}
          <div className="login-field">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-field-icon login-field-btn"
              onClick={() => setShowPass(v => !v)}
              tabIndex={-1}
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Qovra Platform · Alpha v0.1.0
        </p>
      </div>

      {/* ── Right: Visual Panel ───────────────────────────── */}
      <div className="login-visual" aria-hidden="true">
        <div className="login-visual-blob blob-1" />
        <div className="login-visual-blob blob-2" />
        <div className="login-visual-blob blob-3" />

        {/* Glassmorphism card overlay */}
        <div className="login-visual-card">
          <div className="login-visual-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
            </svg>
          </div>
          <div className="login-visual-title">Hytale Hosting</div>
          <div className="login-visual-sub">High-performance game infrastructure</div>
        </div>

        {/* Bottom copyright */}
        <div className="login-visual-copy">
          © 2025 Qovra. Alpha software — not for production use.
        </div>
      </div>

    </div>
  )
}
