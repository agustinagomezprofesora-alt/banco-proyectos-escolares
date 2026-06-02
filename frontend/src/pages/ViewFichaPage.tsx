import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { downloadProjectPdf, fetchProject, submitProjectReview, updateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, normalizeStatus } from '../utils/ui'
import EvidenceSection from '../components/EvidenceSection'

const fichaFields: Array<{ key: keyof Project; title: string }> = [
  { key: 'generatedSummary', title: 'Resumen institucional' },
  { key: 'objectives', title: 'Objetivos' },
  { key: 'mainActivities', title: 'Actividades principales' },
  { key: 'resourcesUsed', title: 'Recursos utilizados' },
  { key: 'finalProducts', title: 'Producciones finales' },
  { key: 'evidenceDescription', title: 'Evidencias' },
  { key: 'reuseSuggestions', title: 'Sugerencias de reutilización' },
  { key: 'improvementSuggestions', title: 'Sugerencias de mejora' }
]

export default function ViewFichaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [editData, setEditData] = useState<Partial<Project>>({})

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const data = await fetchProject(Number(id))
        setProject(data)
        setEditData(data)
      } catch (err: any) {
        setError(getErrorMessage(err, 'No se pudo cargar el proyecto.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project) return
    setSaving(true)
    try {
      const updated = await updateProject(project.id, editData)
      setProject(updated)
      setEditing(false)
      setError('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron guardar los cambios.'))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!project) return
    setSubmitting(true)
    try {
      await submitProjectReview(project.id)
      navigate('/projects')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo enviar a revisión.'))
    } finally {
      setSubmitting(false)
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
  if (user?.role !== 'ADMIN' && user?.id !== project.author.id) {
    return <div className="container"><div className="error">No tenés permisos para acceder a esta sección.</div></div>
  }

  const canManageEvidence = user?.role === 'ADMIN' || (user?.id === project.author.id && project.status !== 'Archivado')

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>{project.improvedTitle || project.title}</h1>
          <p><span className={`badge ${getStatusBadgeClass(project.status)}`}>{normalizeStatus(project.status)}</span></p>
        </div>
        <div>
          <button onClick={() => navigate('/projects')}>Volver</button>
          <button onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? 'Descargando PDF...' : 'Descargar PDF'}
          </button>
          {project.status === 'Borrador generado' && (
            <button onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : 'Editar ficha'}</button>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {editing ? (
        <form onSubmit={handleSave} className="form-ficha-edit">
          <label>
            Título mejorado
            <input value={editData.improvedTitle || ''} onChange={(e) => setEditData({ ...editData, improvedTitle: e.target.value })} />
          </label>
          {fichaFields.map((field) => (
            <label key={String(field.key)}>
              {field.title}
              <textarea value={String(editData[field.key] || '')} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} />
            </label>
          ))}
          <label>
            Etiquetas sugeridas
            <input value={editData.suggestedTags || ''} onChange={(e) => setEditData({ ...editData, suggestedTags: e.target.value })} />
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Guardando cambios...' : 'Guardar cambios'}</button>
        </form>
      ) : (
        <div className="ficha-view">
          <section>
            <h2>Datos básicos</h2>
            <div className="detail-grid">
              <div><strong>Docente</strong><p>{project.teacher}</p></div>
              <div><strong>Área</strong><p>{project.area}</p></div>
              <div><strong>Curso</strong><p>{project.course}</p></div>
              <div><strong>Tipo</strong><p>{project.experienceType}</p></div>
              <div><strong>Reutilizable</strong><p>{project.isReusable ? 'Sí' : 'No'}</p></div>
            </div>
          </section>

          {fichaFields.map((field) => (
            <section key={String(field.key)}>
              <h2>{field.title}</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{String(project[field.key] || 'No disponible')}</p>
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

          <EvidenceSection
            projectId={project.id}
            initialLinks={project.links}
            initialFiles={project.files}
            canEdit={canManageEvidence}
          />

          {project.status === 'Borrador generado' && (
            <div className="button-group">
              <button onClick={() => setEditing(true)}>Editar ficha</button>
              <button onClick={handleSubmitReview} disabled={submitting}>{submitting ? 'Enviando a revisión...' : 'Enviar a revisión'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
