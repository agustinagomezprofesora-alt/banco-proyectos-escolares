import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import NavItem from './NavItem'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const { settings } = useSettings()

  const handleLogout = () => {
    if (window.confirm('¿Querés cerrar sesión?')) {
      logout()
      onClose()
    }
  }

  const projectMatch = (pathname: string) => (
    pathname === '/dashboard' ||
    pathname === '/projects' ||
    (pathname.startsWith('/projects/') && pathname !== '/projects/new')
  )
  const bankMatch = (pathname: string) => pathname === '/bank' || pathname.startsWith('/bank/')
  const adminHomeMatch = (pathname: string) => pathname === '/admin'
  const adminProjectsMatch = (pathname: string) => pathname.startsWith('/admin/projects')

  return (
    <>
      <button className={`sidebar-scrim ${open ? 'open' : ''}`} type="button" aria-label="Cerrar menú" onClick={onClose} />
      <aside className={`app-sidebar no-print ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.appName} />
          ) : (
            <div className="sidebar-logo-mark">MP</div>
          )}
          <Link to="/projects" onClick={onClose}>
            <span>Memoria Pedagógica</span>
            <strong>Digital</strong>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          <div className="sidebar-section">
            <p>Menú principal</p>
            <NavItem to="/bank" label="Banco de proyectos" match={bankMatch} onClick={onClose} />
            <NavItem to="/projects" label="Mis proyectos" match={projectMatch} onClick={onClose} />
            <NavItem to="/projects/new" label="Cargar nueva experiencia" onClick={onClose} />
          </div>

          {user?.role === 'ADMIN' && (
            <div className="sidebar-section">
              <p>Administración</p>
              <NavItem to="/admin" label="Administración" match={adminHomeMatch} onClick={onClose} />
              <NavItem to="/admin/projects" label="Gestión de proyectos" match={adminProjectsMatch} onClick={onClose} />
              <NavItem to="/admin/settings" label="Configuración institucional" onClick={onClose} />
              <NavItem to="/admin/backup" label="Respaldo" onClick={onClose} />
            </div>
          )}
        </nav>

        <div className="sidebar-system">
          <div>
            <span>{user?.name}</span>
            <strong>{user?.role === 'ADMIN' ? 'Administrador' : 'Docente'}</strong>
          </div>
          <button type="button" className="button button-secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
