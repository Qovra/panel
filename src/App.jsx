import { useState } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'

function App() {
  const [authToken, setAuthToken] = useState(null)
  const [role, setRole] = useState(null)

  const handleLogin = (token, roleData) => {
    setAuthToken(token)
    setRole(roleData)
  }

  const handleLogout = () => {
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
