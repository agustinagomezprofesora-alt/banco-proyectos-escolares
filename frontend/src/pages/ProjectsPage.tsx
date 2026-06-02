import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchProjects, deleteProject, generateFicha } from '../api/api'
import { Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, isReviewStatus, normalizeStatus } from '../utils/ui'

export default function ProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<'all' | 'drafts' | 'review' | 'published'>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const getFilterButtonClass = (isActive: boolean) =>
    isActive
      ? 'filter-button filter-button-active px-4 py-2 rounded-lg bg-slate-900 text-white border border-slate-900 font-semibold hover:bg-slate-800 transition'
      : 'filter-button filter-button-inactive px-4 py-2 rounded-lg bg-white text-slate-800 border border-slate-300 font-semibold hover:bg-slate-100 transition'

  const loadProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron cargar los proyectos.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este proyecto?')) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((project) => project.id !== id))
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo eliminar el proyecto.'))
    }
  }

  const handleGenerateFicha = async (id: number) => {
    setGeneratingId(id)
    setError('')
    try {
      await generateFicha(id)
      navigate(`/projects/${id}/generated`)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar la ficha.'))
    } finally {
      setGeneratingId(null)
    }
  }

  const filteredProjects = projects.filter((project) => {
    if (filter === 'drafts') return project.status === 'Borrador generado' || project.status === 'Cargado'
    if (filter === 'review') return isReviewStatus(project.status)
    if (filter === 'published') return project.status === 'Publicado'
    return true
  })

  const loadedCount = projects.filter((project) => project.status === 'Cargado').length
  const reviewCount = projects.filter((project) => isReviewStatus(project.status)).length
  const publishedCount = projects.filter((project) => project.status === 'Publicado').length

  const emptyMessage = projects.length === 0
    ? 'Todavía no hay proyectos en esta sección. Podés cargar una nueva experiencia para comenzar.'
    : 'No se encontraron proyectos con esos filtros.'

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Mis proyectos</h1>
          <p>Bienvenido, {user?.name}. Gestioná tus experiencias y fichas institucionales.</p>
        </div>
        <div>
          <button onClick={() => navigate('/projects/new')} className="primary-btn">
            Cargar nueva experiencia
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="quick-access">
        <div className="card-stat"><h3>En carga</h3><p>{loadedCount}</p></div>
        <div className="card-stat"><h3>En revisión</h3><p>{reviewCount}</p></div>
        <div className="card-stat"><h3>Publicados</h3><p>{publishedCount}</p></div>
      </div>

      <div className="filters">
        <button onClick={() => setFilter('all')} className={getFilterButtonClass(filter === 'all')}>Todos ({projects.length})</button>
        <button onClick={() => setFilter('drafts')} className={getFilterButtonClass(filter === 'drafts')}>Borradores y carga</button>
        <button onClick={() => setFilter('review')} className={getFilterButtonClass(filter === 'review')}>En revisión ({reviewCount})</button>
        <button onClick={() => setFilter('published')} className={getFilterButtonClass(filter === 'published')}>Publicados ({publishedCount})</button>
      </div>

      {loading ? (
        <p>Cargando proyectos...</p>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
          <button onClick={() => navigate('/projects/new')} className="primary-btn">Cargar nueva experiencia</button>
        </div>
      ) : (
        <div className="project-list">
          {filteredProjects.map((project) => (
            <article key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.improvedTitle || project.title}</h3>
                <span className={`badge ${getStatusBadgeClass(project.status)}`}>{normalizeStatus(project.status)}</span>
              </div>
              <p className="project-description">{project.generatedSummary || project.description}</p>
              <div className="project-meta">
                <span>{project.area}</span>
                <span>{project.course}</span>
                <span>{project.experienceType}</span>
                <span>{project.isReusable ? 'Reutilizable' : 'No reutilizable'}</span>
              </div>
              <div className="project-actions">
                {project.status === 'Cargado' && (
                  <button onClick={() => handleGenerateFicha(project.id)} className="btn-generate" disabled={generatingId === project.id}>
                    {generatingId === project.id ? 'Generando ficha...' : 'Generar ficha'}
                  </button>
                )}
                <button onClick={() => navigate(`/projects/${project.id}`)} className="btn-view">Ver ficha</button>
                <button onClick={() => navigate(`/projects/${project.id}/edit`)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(project.id)} className="btn-delete">Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
