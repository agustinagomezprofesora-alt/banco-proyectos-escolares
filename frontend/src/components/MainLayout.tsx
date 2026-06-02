import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const { user, logout } = useAuth()

  return (
    <div>
      <nav className="main-nav">
        <div className="nav-brand">
          <Link to="/" className="nav-title">Memoria Pedagógica</Link>
        </div>
        <div className="nav-links">
          <Link to="/bank">Banco de proyectos</Link>
          {user && <Link to="/projects">Mis proyectos</Link>}
          {user && <Link to="/projects/new">Cargar nueva experiencia</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin">Administración</Link>}
        </div>
        <div className="nav-auth">
          {user ? (
            <>
              <span>{user.name}</span>
              <button type="button" onClick={logout}>Cerrar sesión</button>
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
