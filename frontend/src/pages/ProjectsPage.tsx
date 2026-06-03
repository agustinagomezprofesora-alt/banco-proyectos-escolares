import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchProjects, deleteProject, generateFicha } from '../api/api'
import { Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, isReviewStatus, normalizeStatus } from '../utils/ui'
import Tabs from '../components/ui/Tabs'

type ProjectFilter = 'all' | 'drafts' | 'review' | 'published'

export default function ProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<number | null>(null)

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
    if (!window.confirm('¿Estas seguro de que querés eliminar este proyecto?')) return
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
      const generated = await generateFicha(id)
      navigate(`/projects/${id}/generated`, { state: { generationMode: generated.generationMode } })
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
    ? 'Todavia no hay proyectos en esta seccion. Podés cargar una nueva experiencia para comenzar.'
    : 'No se encontraron proyectos con esos filtros.'

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Mis proyectos</h1>
          <p>Bienvenido, {user?.name}. Gestioná tus experiencias y fichas institucionales.</p>
        </div>
        <div>
          <button type="button" onClick={() => navigate('/projects/new')} className="primary-btn">
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

      <Tabs
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'all', label: `Todos (${projects.length})` },
          { value: 'drafts', label: 'Borradores y carga' },
          { value: 'review', label: `En revisión (${reviewCount})` },
          { value: 'published', label: `Publicados (${publishedCount})` }
        ]}
      />

      {loading ? (
        <div className="loading-state">Cargando proyectos...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
          <button type="button" onClick={() => navigate('/projects/new')} className="primary-btn">Cargar nueva experiencia</button>
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
                  <button type="button" onClick={() => handleGenerateFicha(project.id)} className="btn-generate" disabled={generatingId === project.id}>
                    {generatingId === project.id ? 'Generando ficha institucional...' : 'Generar ficha'}
                  </button>
                )}
                <button type="button" onClick={() => navigate(`/projects/${project.id}`)} className="btn-view">Ver ficha</button>
                <button type="button" onClick={() => navigate(`/projects/${project.id}/edit`)} className="button button-secondary">Editar</button>
                <button type="button" onClick={() => handleDelete(project.id)} className="btn-delete">Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
