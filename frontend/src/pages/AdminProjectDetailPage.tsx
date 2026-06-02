import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { archiveProject, fetchProject, publishProject } from '../api/api'
import { Project } from '../types'

const fichaSections: Array<{ key: keyof Project; title: string }> = [
  { key: 'generatedSummary', title: 'Resumen institucional' },
  { key: 'objectives', title: 'Objetivos' },
  { key: 'mainActivities', title: 'Actividades principales' },
  { key: 'resourcesUsed', title: 'Recursos utilizados' },
  { key: 'finalProducts', title: 'Producciones finales' },
  { key: 'evidenceDescription', title: 'Evidencias' },
  { key: 'reuseSuggestions', title: 'Sugerencias de reutilización' },
  { key: 'improvementSuggestions', title: 'Sugerencias de mejora' }
]

export default function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchProject(Number(id))
      .then(setProject)
      .catch((err: any) => setError(err?.message || 'No se pudo cargar el proyecto'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePublish = async () => {
    if (!project) return
    try {
      const response = await publishProject(project.id)
      setProject(response.project)
      setMessage(response.message || 'Proyecto publicado correctamente.')
      setError('')
    } catch (err: any) {
      setError(err?.message || 'No tenés permisos para realizar esta acción.')
    }
  }

  const handleArchive = async () => {
    if (!project) return
    try {
      const response = await archiveProject(project.id)
      setProject(response.project)
      setMessage(response.message || 'Proyecto archivado correctamente.')
      setError('')
    } catch (err: any) {
      setError(err?.message || 'No tenés permisos para realizar esta acción.')
    }
  }

  if (loading) return <div className="container"><p>Cargando proyecto...</p></div>
  if (!project) return <div className="container"><p>Proyecto no encontrado</p></div>

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>{project.improvedTitle || project.title}</h1>
          <p>Estado actual: {project.status}</p>
        </div>
        <div>
          <button onClick={() => navigate('/admin/projects')}>Volver</button>
          <button className="btn-edit" onClick={() => navigate(`/admin/projects/${project.id}/edit`)}>Editar</button>
          <button className="primary-btn" onClick={handlePublish}>Publicar</button>
          <button className="btn-delete" onClick={handleArchive}>Archivar</button>
        </div>
      </header>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <section className="detail-section">
        <h2>Datos básicos</h2>
        <div className="detail-grid">
          <div><strong>Título original</strong>{project.title}</div>
          <div><strong>Docente responsable</strong>{project.teacher}</div>
          <div><strong>Autor</strong>{project.author?.name} ({project.author?.email})</div>
          <div><strong>Curso</strong>{project.course}</div>
          <div><strong>Área</strong>{project.area}</div>
          <div><strong>Tipo de experiencia</strong>{project.experienceType}</div>
          <div><strong>Reutilizable</strong>{project.isReusable ? 'Sí' : 'No'}</div>
          <div><strong>Fecha de creación</strong>{new Date(project.createdAt).toLocaleDateString('es-AR')}</div>
        </div>
        <p className="project-description">{project.description}</p>
        {project.link && <p><strong>Link:</strong> <a href={project.link} target="_blank" rel="noreferrer">{project.link}</a></p>}
      </section>

      <section className="ficha-view">
        <h2>Ficha generada</h2>
        {fichaSections.map((section) => (
          <section key={String(section.key)}>
            <h2>{section.title}</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{String(project[section.key] || 'No disponible')}</p>
          </section>
        ))}

        {project.suggestedTags && (
          <section>
            <h2>Etiquetas</h2>
            <div className="tags">
              {project.suggestedTags.split(', ').map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  )
}
