import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectFormPage from '../pages/ProjectFormPage'
import NewProjectPage from '../pages/NewProjectPage'
import ViewFichaPage from '../pages/ViewFichaPage'
import VisualResourcesPage from '../pages/VisualResourcesPage'
import BankPage from '../pages/BankPage'
import BankProjectDetailPage from '../pages/BankProjectDetailPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminProjectsPage from '../pages/AdminProjectsPage'
import AdminProjectDetailPage from '../pages/AdminProjectDetailPage'
import AdminSettingsPage from '../pages/AdminSettingsPage'
import AdminBackupPage from '../pages/AdminBackupPage'
import AppLayout from '../components/layout/AppLayout'

const ProtectedRoute = ({ children }: { children?: JSX.Element }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-shell"><div className="loading-state">Cargando...</div></div>
  if (!user) return <Navigate to="/login" replace />
  return children ?? <Outlet />
}

const AdminRoute = ({ children }: { children?: JSX.Element }) => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  if (loading) return <div className="loading-state">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') {
    return (
      <div className="empty-state">
        <div className="error">No tenés permisos para acceder a esta seccion.</div>
        <button type="button" onClick={() => navigate('/projects')}>Volver al dashboard</button>
      </div>
    )
  }
  return children ?? <Outlet />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ProjectsPage />} />
            <Route path="/bank" element={<BankPage />} />
            <Route path="/bank/:id" element={<BankProjectDetailPage />} />
            <Route path="/bank/:id/materials" element={<VisualResourcesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<NewProjectPage />} />
            <Route path="/projects/:id" element={<ViewFichaPage />} />
            <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
            <Route path="/projects/:id/ficha" element={<ViewFichaPage />} />
            <Route path="/projects/:id/generated" element={<ViewFichaPage />} />
            <Route path="/projects/:id/materials" element={<VisualResourcesPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/projects" element={<AdminProjectsPage />} />
              <Route path="/admin/projects/:id" element={<AdminProjectDetailPage />} />
              <Route path="/admin/projects/:id/materials" element={<VisualResourcesPage />} />
              <Route path="/admin/projects/:id/edit" element={<ProjectFormPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/backup" element={<AdminBackupPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}
