import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/layouts/DashboardLayout'
import './index.css'

function App() {
  const [user, setUser] = useState(() => {
    // Intentar recuperar usuario del localStorage
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          path="/*"
          element={
            user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
