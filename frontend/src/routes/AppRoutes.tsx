import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectFormPage from '../pages/ProjectFormPage'
import NewProjectPage from '../pages/NewProjectPage'
import ViewFichaPage from '../pages/ViewFichaPage'
import BankPage from '../pages/BankPage'
import BankProjectDetailPage from '../pages/BankProjectDetailPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminProjectsPage from '../pages/AdminProjectsPage'
import AdminProjectDetailPage from '../pages/AdminProjectDetailPage'
import AdminSettingsPage from '../pages/AdminSettingsPage'
import MainLayout from '../components/MainLayout'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="container"><p>Cargando...</p></div>
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  if (loading) return <div className="container"><p>Cargando...</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') {
    return (
      <div className="container">
        <div className="error">Solo administradores pueden modificar esta sección.</div>
        <button onClick={() => navigate('/projects')}>Volver al dashboard</button>
      </div>
    )
  }
  return children
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/bank" element={<BankPage />} />
          <Route path="/bank/:id" element={<BankProjectDetailPage />} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><NewProjectPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ViewFichaPage /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
          <Route path="/projects/:id/ficha" element={<ProtectedRoute><ViewFichaPage /></ProtectedRoute>} />
          <Route path="/projects/:id/generated" element={<ProtectedRoute><ViewFichaPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/projects" element={<AdminRoute><AdminProjectsPage /></AdminRoute>} />
          <Route path="/admin/projects/:id" element={<AdminRoute><AdminProjectDetailPage /></AdminRoute>} />
          <Route path="/admin/projects/:id/edit" element={<AdminRoute><ProjectFormPage /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}
