import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { archiveProject, fetchProjects, publishProject, updateProject } from '../api/api'
import { Project } from '../types'

const statusOptions = ['Todos', 'Cargado', 'Borrador generado', 'En revisión', 'Publicado', 'Archivado']
const reviewAliases = ['En revisión', 'En revision', 'En revisiÃ³n']

const statusMatches = (projectStatus: string, selectedStatus: string) => {
  if (selectedStatus === 'Todos') return true
  if (selectedStatus === 'En revisión') return reviewAliases.includes(projectStatus)
  return projectStatus === selectedStatus
}

const badgeClass = (status: string) => {
  if (reviewAliases.includes(status)) return 'badge-en-revision'
  return `badge-${status.toLowerCase().replaceAll(' ', '-')}`
}

export default function AdminProjectsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState(searchParams.get('status') || 'Todos')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadProjects = () => {
    setLoading(true)
    fetchProjects()
      .then(setProjects)
      .catch((err: any) => setError(err?.message || 'No se pudieron cargar los proyectos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    setFilter(searchParams.get('status') || 'Todos')
  }, [searchParams])

  const filteredProjects = useMemo(
    () => projects.filter((project) => statusMatches(project.status, filter)),
    [projects, filter]
  )

  const changeFilter = (status: string) => {
    setFilter(status)
    if (status === 'Todos') {
      setSearchParams({})
    } else {
      setSearchParams({ status })
    }
  }

  const replaceProject = (updated: Project) => {
    setProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
  }

  const handlePublish = async (projectId: number) => {
    try {
      const response = await publishProject(projectId)
      replaceProject(response.project)
      setMessage(response.message || 'Proyecto publicado correctamente.')
      setError('')
    } catch (err: any) {
      setError(err?.message || 'No tenés permisos para realizar esta acción.')
    }
  }

  const handleArchive = async (projectId: number) => {
    try {
      const response = await archiveProject(projectId)
      replaceProject(response.project)
      setMessage(response.message || 'Proyecto archivado correctamente.')
      setError('')
    } catch (err: any) {
      setError(err?.message || 'No tenés permisos para realizar esta acción.')
    }
  }

  const handleStatus = async (projectId: number, status: string) => {
    try {
      const updated = await updateProject(projectId, { status })
      replaceProject(updated as Project)
      setMessage(`Proyecto devuelto a ${status.toLowerCase()}.`)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el estado')
    }
  }

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>Gestión de proyectos</h1>
          <p>Listado completo para revisión, edición, publicación y archivo.</p>
        </div>
        <div>
          <button onClick={() => navigate('/admin')}>Volver</button>
        </div>
      </header>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="filters">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => changeFilter(status)}
            className={filter === status ? 'active' : ''}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Cargando proyectos...</p>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>{filter === 'En revisión' ? 'No hay proyectos pendientes de revisión.' : 'No hay proyectos para este filtro.'}</p>
        </div>
      ) : (
        <div className="admin-table">
          {filteredProjects.map((project) => (
            <article key={project.id} className="admin-project-card">
              <div className="project-header">
                <h3>{project.improvedTitle || project.title}</h3>
                <span className={`badge ${badgeClass(project.status)}`}>{project.status}</span>
              </div>
              <div className="admin-project-grid">
                <span><strong>Docente:</strong> {project.teacher}</span>
                <span><strong>Curso:</strong> {project.course}</span>
                <span><strong>Área:</strong> {project.area}</span>
                <span><strong>Tipo:</strong> {project.experienceType}</span>
                <span><strong>Creación:</strong> {new Date(project.createdAt).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="project-actions">
                <button className="btn-view" onClick={() => navigate(`/admin/projects/${project.id}`)}>Ver ficha</button>
                <button className="btn-edit" onClick={() => navigate(`/admin/projects/${project.id}/edit`)}>Editar</button>
                {project.status !== 'Publicado' && <button className="primary-btn" onClick={() => handlePublish(project.id)}>Publicar</button>}
                {project.status !== 'Archivado' && <button className="btn-delete" onClick={() => handleArchive(project.id)}>Archivar</button>}
                {!reviewAliases.includes(project.status) && <button onClick={() => handleStatus(project.id, 'En revisión')}>Enviar a revisión</button>}
                {project.status !== 'Borrador generado' && <button onClick={() => handleStatus(project.id, 'Borrador generado')}>Volver a borrador</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
