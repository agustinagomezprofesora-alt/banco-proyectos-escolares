import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { downloadProjectPdf, fetchPublishedProject, duplicateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'
import { getErrorMessage } from '../utils/ui'

export default function BankProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [duplicating, setDuplicating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const data = await fetchPublishedProject(Number(id))
        setProject(data)
      } catch (err: any) {
        setError(getErrorMessage(err, 'No se pudo cargar el proyecto.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDuplicate = async () => {
    if (!project) return
    if (!window.confirm('¿Querés usar este proyecto como base para una nueva experiencia?')) return
    setDuplicating(true)
    setError('')
    try {
      const copy = await duplicateProject(project.id)
      navigate(`/projects/${copy.id}/edit`)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo duplicar el proyecto.'))
    } finally {
      setDuplicating(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!project) return
    setDownloading(true)
    setError('')
    try {
      await downloadProjectPdf(project.id)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo descargar el PDF.'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="container"><p>Cargando proyecto...</p></div>
  if (!project) return <div className="container"><div className="empty-state"><p>Proyecto no encontrado.</p></div></div>

  const detailSections: Array<[string, string | null | undefined]> = [
    ['Objetivos', project.objectives],
    ['Actividades principales', project.mainActivities],
    ['Recursos utilizados', project.resourcesUsed],
    ['Producciones finales', project.finalProducts],
    ['Evidencias', project.evidenceDescription],
    ['Sugerencias de reutilización', project.reuseSuggestions],
    ['Recomendaciones de mejora', project.improvementSuggestions]
  ]

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>{project.improvedTitle || project.title}</h1>
          <p>{project.area} · {project.course} · {project.experienceType}</p>
        </div>
        <div>
          <button onClick={() => navigate('/bank')}>Volver al banco</button>
          {user && (
            <>
              <button onClick={handleDownloadPdf} disabled={downloading}>
                {downloading ? 'Descargando PDF...' : 'Descargar PDF'}
              </button>
              <button className="primary-btn" onClick={handleDuplicate} disabled={duplicating}>
                {duplicating ? 'Duplicando proyecto...' : 'Usar como base'}
              </button>
            </>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="detail-section">
        <h2>Resumen</h2>
        <p>{project.generatedSummary || project.description}</p>
      </section>

      <section className="detail-section">
        <h2>Datos del proyecto</h2>
        <div className="detail-grid">
          <div><strong>Docente responsable</strong><p>{project.teacher}</p></div>
          <div><strong>Área</strong><p>{project.area}</p></div>
          <div><strong>Curso</strong><p>{project.course}</p></div>
          <div><strong>Tipo de experiencia</strong><p>{project.experienceType}</p></div>
          <div><strong>Reutilizable</strong><p>{project.isReusable ? 'Sí' : 'No'}</p></div>
          <div><strong>Publicado</strong><p>{new Date(project.createdAt).toLocaleDateString('es-AR')}</p></div>
        </div>
      </section>

      {detailSections.map(([title, value]) => (
        <section key={title} className="detail-section">
          <h2>{title}</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{value || 'No disponible'}</p>
        </section>
      ))}

      {project.link && (
        <section className="detail-section">
          <h2>Link asociado</h2>
          <a href={project.link} target="_blank" rel="noreferrer">Abrir enlace</a>
        </section>
      )}

      {project.suggestedTags && (
        <section className="detail-section">
          <h2>Etiquetas</h2>
          <div className="tags">
            {project.suggestedTags.split(', ').map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>
        </section>
      )}
    </div>
  )
}
