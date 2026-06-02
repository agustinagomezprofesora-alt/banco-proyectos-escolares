import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectFormPage from '../pages/ProjectFormPage'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
