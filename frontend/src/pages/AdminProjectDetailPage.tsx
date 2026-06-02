import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { archiveProject, downloadProjectPdf, fetchProject, publishProject } from '../api/api'
import { Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, normalizeStatus } from '../utils/ui'

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
  const [publishing, setPublishing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchProject(Number(id))
      .then(setProject)
      .catch((err: any) => setError(getErrorMessage(err, 'No se pudo cargar el proyecto.')))
      .finally(() => setLoading(false))
  }, [id])

  const handlePublish = async () => {
    if (!project) return
    if (!window.confirm('¿Querés publicar este proyecto en el banco institucional?')) return
    setPublishing(true)
    try {
      const response = await publishProject(project.id)
      setProject(response.project)
      setMessage(response.message || 'Proyecto publicado correctamente.')
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No tenés permisos para realizar esta acción.'))
    } finally {
      setPublishing(false)
    }
  }

  const handleArchive = async () => {
    if (!project) return
    if (!window.confirm('¿Querés archivar este proyecto? No aparecerá en el banco.')) return
    setArchiving(true)
    try {
      const response = await archiveProject(project.id)
      setProject(response.project)
      setMessage(response.message || 'Proyecto archivado correctamente.')
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No tenés permisos para realizar esta acción.'))
    } finally {
      setArchiving(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!project) return
    setDownloading(true)
    try {
      await downloadProjectPdf(project.id)
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo descargar el PDF.'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="container"><p>Cargando proyecto...</p></div>
  if (!project) return <div className="container"><div className="empty-state"><p>Proyecto no encontrado.</p></div></div>

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>{project.improvedTitle || project.title}</h1>
          <p><span className={`badge ${getStatusBadgeClass(project.status)}`}>{normalizeStatus(project.status)}</span></p>
        </div>
        <div>
          <button onClick={() => navigate('/admin/projects')}>Volver</button>
          <button onClick={handleDownloadPdf} disabled={downloading}>{downloading ? 'Descargando PDF...' : 'Descargar PDF'}</button>
          <button className="btn-edit" onClick={() => navigate(`/admin/projects/${project.id}/edit`)}>Editar</button>
          <button className="primary-btn" onClick={handlePublish} disabled={publishing}>{publishing ? 'Publicando proyecto...' : 'Publicar'}</button>
          <button className="btn-delete" onClick={handleArchive} disabled={archiving}>{archiving ? 'Archivando proyecto...' : 'Archivar'}</button>
        </div>
      </header>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <section className="detail-section">
        <h2>Datos básicos</h2>
        <div className="detail-grid">
          <div><strong>Título original</strong><p>{project.title}</p></div>
          <div><strong>Docente responsable</strong><p>{project.teacher}</p></div>
          <div><strong>Autor</strong><p>{project.author?.name} ({project.author?.email})</p></div>
          <div><strong>Curso</strong><p>{project.course}</p></div>
          <div><strong>Área</strong><p>{project.area}</p></div>
          <div><strong>Tipo de experiencia</strong><p>{project.experienceType}</p></div>
          <div><strong>Reutilizable</strong><p>{project.isReusable ? 'Sí' : 'No'}</p></div>
          <div><strong>Fecha de creación</strong><p>{new Date(project.createdAt).toLocaleDateString('es-AR')}</p></div>
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
              {project.suggestedTags.split(', ').map((tag) => <span key={tag} className="tag">{tag}</span>)}
            </div>
          </section>
        )}
      </section>
    </div>
  )
}
