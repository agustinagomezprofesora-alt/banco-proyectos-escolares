import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProjects, fetchStats } from '../api/api'
import { Project, ProjectStats } from '../types'
import { getErrorMessage, isReviewStatus } from '../utils/ui'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchStats(), fetchProjects()])
      .then(([statsData, projectsData]) => {
        setStats(statsData)
        setProjects(projectsData)
      })
      .catch((err: any) => setError(getErrorMessage(err, 'No se pudo cargar la administración.')))
      .finally(() => setLoading(false))
  }, [])

  const pendingProjects = useMemo(() => projects.filter((project) => isReviewStatus(project.status)), [projects])

  if (loading) return <div className="container"><p>Cargando administración...</p></div>

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>Administración</h1>
          <p>Revisión, publicación y seguimiento del banco institucional.</p>
        </div>
        <div>
          <button className="primary-btn" onClick={() => navigate('/admin/projects')}>Gestión de proyectos</button>
          <button onClick={() => navigate('/admin/settings')}>Configuración institucional</button>
          <button onClick={() => navigate('/admin/backup')}>Respaldo</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="quick-access">
          <div className="card-stat"><h3>Total de proyectos</h3><p>{stats.totalProjects}</p></div>
          <div className="card-stat"><h3>En revisión</h3><p>{stats.pendingReview}</p></div>
          <div className="card-stat"><h3>Publicados</h3><p>{stats.publishedProjects}</p></div>
          <div className="card-stat"><h3>Archivados</h3><p>{stats.archivedProjects}</p></div>
          <div className="card-stat"><h3>Reutilizables</h3><p>{stats.reusableProjects}</p></div>
        </div>
      )}

      <section className="admin-section">
        <div className="section-header">
          <h2>Proyectos pendientes de revisión</h2>
          <button onClick={() => navigate('/admin/projects?status=En%20revisi%C3%B3n')}>Ver todos</button>
        </div>
        {pendingProjects.length === 0 ? (
          <div className="empty-state"><p>No hay proyectos pendientes de revisión.</p></div>
        ) : (
          <div className="admin-list">
            {pendingProjects.slice(0, 5).map((project) => (
              <article key={project.id} className="admin-row">
                <div>
                  <h3>{project.improvedTitle || project.title}</h3>
                  <p>{project.teacher} · {project.course} · {project.area}</p>
                </div>
                <button onClick={() => navigate(`/admin/projects/${project.id}`)}>Revisar</button>
              </article>
            ))}
          </div>
        )}
      </section>

      {stats && (
        <section className="admin-section">
          <h2>Accesos rápidos de administración</h2>
          <div className="admin-actions-grid">
            <button onClick={() => navigate('/admin/projects')}>Todos los proyectos</button>
            <button onClick={() => navigate('/admin/settings')}>Configuración institucional</button>
            <button onClick={() => navigate('/admin/backup')}>Respaldo</button>
            <button onClick={() => navigate('/admin/projects?status=Publicado')}>Proyectos publicados</button>
            <button onClick={() => navigate('/admin/projects?status=Archivado')}>Proyectos archivados</button>
            <button onClick={() => navigate('/bank')}>Banco de proyectos</button>
          </div>
          <div className="derived-lists">
            <div>
              <h3>Áreas existentes</h3>
              {stats.projectsByArea.length === 0 ? <p>No hay áreas registradas.</p> : (
                <ul>{stats.projectsByArea.map((item) => <li key={item.area}>{item.area}: {item.count}</li>)}</ul>
              )}
            </div>
            <div>
              <h3>Tipos de experiencia</h3>
              {stats.projectsByType.length === 0 ? <p>No hay tipos registrados.</p> : (
                <ul>{stats.projectsByType.map((item) => <li key={item.type}>{item.type}: {item.count}</li>)}</ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
