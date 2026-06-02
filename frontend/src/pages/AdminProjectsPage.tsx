import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { archiveProject, fetchProjects, publishProject, updateProject } from '../api/api'
import { Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, isReviewStatus, normalizeStatus } from '../utils/ui'

const statusOptions = ['Todos', 'Cargado', 'Borrador generado', 'En revisión', 'Publicado', 'Archivado']

const getFilterButtonClass = (isActive: boolean) =>
  isActive
    ? 'filter-button filter-button-active px-4 py-2 rounded-lg bg-slate-900 text-white border border-slate-900 font-semibold hover:bg-slate-800 transition'
    : 'filter-button filter-button-inactive px-4 py-2 rounded-lg bg-white text-slate-800 border border-slate-300 font-semibold hover:bg-slate-100 transition'

const statusMatches = (projectStatus: string, selectedStatus: string) => {
  if (selectedStatus === 'Todos') return true
  if (selectedStatus === 'En revisión') return isReviewStatus(projectStatus)
  return normalizeStatus(projectStatus) === selectedStatus
}

export default function AdminProjectsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState(searchParams.get('status') || 'Todos')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<number | null>(null)

  const loadProjects = () => {
    setLoading(true)
    setError('')
    fetchProjects()
      .then(setProjects)
      .catch((err: any) => setError(getErrorMessage(err, 'No se pudieron cargar los proyectos.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    setFilter(searchParams.get('status') || 'Todos')
  }, [searchParams])

  const filteredProjects = useMemo(() => projects.filter((project) => statusMatches(project.status, filter)), [projects, filter])

  const changeFilter = (status: string) => {
    setFilter(status)
    setSearchParams(status === 'Todos' ? {} : { status })
  }

  const replaceProject = (updated: Project) => {
    setProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
  }

  const handlePublish = async (projectId: number) => {
    if (!window.confirm('¿Querés publicar este proyecto en el banco institucional?')) return
    setWorkingId(projectId)
    try {
      const response = await publishProject(projectId)
      replaceProject(response.project)
      setMessage(response.message || 'Proyecto publicado correctamente.')
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No tenés permisos para realizar esta acción.'))
    } finally {
      setWorkingId(null)
    }
  }

  const handleArchive = async (projectId: number) => {
    if (!window.confirm('¿Querés archivar este proyecto? No aparecerá en el banco.')) return
    setWorkingId(projectId)
    try {
      const response = await archiveProject(projectId)
      replaceProject(response.project)
      setMessage(response.message || 'Proyecto archivado correctamente.')
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No tenés permisos para realizar esta acción.'))
    } finally {
      setWorkingId(null)
    }
  }

  const handleStatus = async (projectId: number, status: string) => {
    setWorkingId(projectId)
    try {
      const updated = await updateProject(projectId, { status })
      replaceProject(updated as Project)
      setMessage(`Proyecto actualizado a ${status.toLowerCase()}.`)
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo actualizar el estado.'))
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>Gestión de proyectos</h1>
          <p>Listado completo para revisión, edición, publicación y archivo.</p>
        </div>
        <button onClick={() => navigate('/admin')}>Volver</button>
      </header>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="filters">
        {statusOptions.map((status) => (
          <button key={status} onClick={() => changeFilter(status)} className={getFilterButtonClass(filter === status)}>
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Cargando proyectos...</p>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>{filter === 'En revisión' ? 'No hay proyectos pendientes de revisión.' : 'No se encontraron proyectos con esos filtros.'}</p>
        </div>
      ) : (
        <div className="admin-table">
          {filteredProjects.map((project) => (
            <article key={project.id} className="admin-project-card">
              <div className="project-header">
                <h3>{project.improvedTitle || project.title}</h3>
                <span className={`badge ${getStatusBadgeClass(project.status)}`}>{normalizeStatus(project.status)}</span>
              </div>
              <p className="project-description">{project.generatedSummary || project.description}</p>
              <div className="admin-project-grid">
                <span><strong>Docente:</strong> {project.teacher}</span>
                <span><strong>Curso:</strong> {project.course}</span>
                <span><strong>Área:</strong> {project.area}</span>
                <span><strong>Tipo:</strong> {project.experienceType}</span>
                <span><strong>Reutilizable:</strong> {project.isReusable ? 'Sí' : 'No'}</span>
                <span><strong>Creación:</strong> {new Date(project.createdAt).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="project-actions">
                <button className="btn-view" onClick={() => navigate(`/admin/projects/${project.id}`)}>Ver ficha</button>
                <button className="btn-edit" onClick={() => navigate(`/admin/projects/${project.id}/edit`)}>Editar</button>
                {project.status !== 'Publicado' && (
                  <button className="primary-btn" onClick={() => handlePublish(project.id)} disabled={workingId === project.id}>
                    {workingId === project.id ? 'Publicando proyecto...' : 'Publicar'}
                  </button>
                )}
                {project.status !== 'Archivado' && (
                  <button className="btn-delete" onClick={() => handleArchive(project.id)} disabled={workingId === project.id}>
                    {workingId === project.id ? 'Archivando proyecto...' : 'Archivar'}
                  </button>
                )}
                {!isReviewStatus(project.status) && <button onClick={() => handleStatus(project.id, 'En revisión')} disabled={workingId === project.id}>Enviar a revisión</button>}
                {project.status !== 'Borrador generado' && <button onClick={() => handleStatus(project.id, 'Borrador generado')} disabled={workingId === project.id}>Volver a borrador</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
