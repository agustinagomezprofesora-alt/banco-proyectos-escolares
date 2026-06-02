import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchProjects, deleteProject } from '../api/api'
import { Project } from '../types'

export default function ProjectsPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<'all' | 'drafts' | 'review' | 'published'>('all')
  const [error, setError] = useState('')

  const loadProjects = async () => {
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los proyectos')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((project) => project.id !== id))
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar')
    }
  }

  const handleGenerateFicha = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:4000/api/projects/${id}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('memoria_token')}` }
      })
      if (response.ok) {
        navigate(`/projects/${id}/ficha`)
      } else {
        setError('No se pudo generar la ficha')
      }
    } catch (err: any) {
      setError(err?.message || 'Error generando ficha')
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (filter === 'drafts') return p.status === 'Borrador generado'
    if (filter === 'review') return p.status === 'En revisión'
    if (filter === 'published') return p.status === 'Publicado'
    return true
  })

  const draftCount = projects.filter((p) => p.status === 'Cargado').length
  const reviewCount = projects.filter((p) => p.status === 'En revisión').length
  const publishedCount = projects.filter((p) => p.status === 'Publicado').length

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Dashboard Docente</h1>
          <p>Bienvenido, {user?.name}</p>
        </div>
        <div>
          <button onClick={() => navigate('/projects/new')} className="primary-btn">
            + Cargar nueva experiencia
          </button>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="quick-access">
        <div className="card-stat">
          <h3>En carga</h3>
          <p>{draftCount}</p>
        </div>
        <div className="card-stat">
          <h3>En revisión</h3>
          <p>{reviewCount}</p>
        </div>
        <div className="card-stat">
          <h3>Publicados</h3>
          <p>{publishedCount}</p>
        </div>
      </div>

      <div className="filters">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'active' : ''}
        >
          Todos ({projects.length})
        </button>
        <button
          onClick={() => setFilter('drafts')}
          className={filter === 'drafts' ? 'active' : ''}
        >
          Mis borradores ({draftCount})
        </button>
        <button
          onClick={() => setFilter('review')}
          className={filter === 'review' ? 'active' : ''}
        >
          En revisión ({reviewCount})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={filter === 'published' ? 'active' : ''}
        >
          Publicados ({publishedCount})
        </button>
      </div>

      <div className="project-list">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>No hay proyectos en esta categoría</p>
            <button onClick={() => navigate('/projects/new')}>Cargar primera experiencia</button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className={`badge badge-${project.status.toLowerCase().replace(' ', '-')}`}>
                  {project.status}
                </span>
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-meta">
                <span>{project.area}</span>
                <span>{project.course}</span>
                <span>{project.experienceType}</span>
              </div>
              <div className="project-actions">
                {project.status === 'Cargado' && (
                  <button onClick={() => handleGenerateFicha(project.id)} className="btn-generate">
                    Generar ficha
                  </button>
                )}
                {project.status === 'Borrador generado' && (
                  <button onClick={() => navigate(`/projects/${project.id}/ficha`)} className="btn-view">
                    Ver ficha
                  </button>
                )}
                <button onClick={() => navigate(`/projects/${project.id}/edit`)} className="btn-edit">
                  Editar
                </button>
                <button onClick={() => handleDelete(project.id)} className="btn-delete">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
