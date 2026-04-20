import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('qovra_token'))
  const [role, setRole] = useState(() => localStorage.getItem('qovra_role'))

  const handleLogin = (token, roleData) => {
    localStorage.setItem('qovra_token', token)
    localStorage.setItem('qovra_role', roleData)
    setAuthToken(token)
    setRole(roleData)
  }

  const handleLogout = () => {
    localStorage.removeItem('qovra_token')
    localStorage.removeItem('qovra_role')
    setAuthToken(null)
    setRole(null)
    window.location.reload()
  }

  if (!authToken) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard token={authToken} role={role} onLogout={handleLogout} />
}

export default App
