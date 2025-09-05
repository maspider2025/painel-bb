import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCNPJs from './pages/admin/CNPJs'
import AdminLigadores from './pages/admin/Ligadores'
import LigadorLogin from './pages/ligador/Login'
import LigadorDashboard from './pages/ligador/Dashboard'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect root to admin login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/cnpjs" element={<AdminCNPJs />} />
          <Route path="/admin/ligadores/novo" element={<AdminLigadores />} />
          
          {/* Ligador routes */}
          <Route path="/ligador/login" element={<LigadorLogin />} />
          <Route path="/ligador/dashboard" element={<LigadorDashboard />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
        
        <Toaster 
          position="top-right"
          richColors
          closeButton
        />
      </div>
    </Router>
  )
}

export default App
