import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    if (window.confirm('¿Querés cerrar sesión?')) {
      logout()
    }
  }

  return (
    <div>
      <nav className="main-nav">
        <div className="nav-brand">
          <Link to={user ? '/projects' : '/bank'} className="nav-title">Memoria Pedagógica</Link>
        </div>
        <div className="nav-links">
          <NavLink to="/bank">Banco de proyectos</NavLink>
          {user && <NavLink to="/projects">Mis proyectos</NavLink>}
          {user && <NavLink to="/projects/new">Cargar nueva experiencia</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">Administración</NavLink>}
        </div>
        <div className="nav-auth">
          {user ? (
            <>
              <span className="user-chip">{user.name} · {user.role === 'ADMIN' ? 'Administrador' : 'Docente'}</span>
              <button type="button" onClick={handleLogout}>Cerrar sesión</button>
            </>
          ) : (
            <Link to="/login">Ingresar</Link>
          )}
        </div>
      </nav>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  )
}
