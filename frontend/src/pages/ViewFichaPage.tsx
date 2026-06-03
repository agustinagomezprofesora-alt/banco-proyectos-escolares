import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { downloadProjectPdf, fetchProject, generateActivities, generateGames, generatePresentation, submitProjectReview, updateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { GenerationMode, Project } from '../types'
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

const activityFields: Array<{ key: keyof Project; title: string }> = [
  { key: 'introActivities', title: 'Actividades de inicio' },
  { key: 'developmentActivities', title: 'Actividades de desarrollo' },
  { key: 'closingActivities', title: 'Actividades de cierre' },
  { key: 'assessmentCriteria', title: 'Criterios de evaluación' },
  { key: 'rubric', title: 'Rúbrica' },
  { key: 'interdisciplinarySuggestions', title: 'Sugerencias interdisciplinarias' },
  { key: 'adaptations', title: 'Adecuaciones' },
  { key: 'requiredResources', title: 'Recursos necesarios' },
  { key: 'estimatedTimeline', title: 'Cronograma estimado' },
  { key: 'studentReflectionQuestions', title: 'Preguntas de reflexión' }
]

const gameFields: Array<{ key: keyof Project; title: string }> = [
  { key: 'quizQuestions', title: 'Quiz' },
  { key: 'trueFalse', title: 'Verdadero/Falso' },
  { key: 'multipleChoice', title: 'Opcion multiple' },
  { key: 'wordSearch', title: 'Sopa de letras' },
  { key: 'crossword', title: 'Crucigrama' },
  { key: 'memoryGame', title: 'Memotest' },
  { key: 'bingoConcepts', title: 'Bingo' },
  { key: 'challengeCards', title: 'Tarjetas desafio' },
  { key: 'rolePlayingGame', title: 'Juego de roles' },
  { key: 'reflectionGame', title: 'Reflexion' }
]

const presentationFields: Array<{ key: keyof Project; title: string }> = [
  { key: 'presentationTitle', title: 'Titulo de la presentacion' },
  { key: 'presentationSubtitle', title: 'Subtitulo' },
  { key: 'slides', title: 'Estructura de diapositivas' },
  { key: 'oralScript', title: 'Guion oral' },
  { key: 'visualSuggestions', title: 'Sugerencias visuales' },
  { key: 'closingMessage', title: 'Cierre final' }
]

export default function ViewFichaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const generationMode = (location.state as { generationMode?: GenerationMode } | null)?.generationMode
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [generatingActivities, setGeneratingActivities] = useState(false)
  const [generatingGames, setGeneratingGames] = useState(false)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)
  const [activitiesMode, setActivitiesMode] = useState<GenerationMode | undefined>(undefined)
  const [gamesMode, setGamesMode] = useState<GenerationMode | undefined>(undefined)
  const [presentationMode, setPresentationMode] = useState<GenerationMode | undefined>(undefined)
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

  const handleGenerateActivities = async () => {
    if (!project) return
    setGeneratingActivities(true)
    setError('')
    try {
      const updated = await generateActivities(project.id)
      setProject(updated)
      setEditData(updated)
      setActivitiesMode(updated.generationMode)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron generar las actividades.'))
    } finally {
      setGeneratingActivities(false)
    }
  }

  const handleGenerateGames = async () => {
    if (!project) return
    setGeneratingGames(true)
    setError('')
    try {
      const updated = await generateGames(project.id)
      setProject(updated)
      setEditData(updated)
      setGamesMode(updated.generationMode)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron generar los juegos.'))
    } finally {
      setGeneratingGames(false)
    }
  }

  const handleGeneratePresentation = async () => {
    if (!project) return
    setGeneratingPresentation(true)
    setError('')
    try {
      const updated = await generatePresentation(project.id)
      setProject(updated)
      setEditData(updated)
      setPresentationMode(updated.generationMode)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar la presentacion.'))
    } finally {
      setGeneratingPresentation(false)
    }
  }

  if (loading) return <div className="container"><p>Cargando proyecto...</p></div>
  if (!project) return <div className="container"><div className="empty-state"><p>Proyecto no encontrado.</p></div></div>
  if (user?.role !== 'ADMIN' && user?.id !== project.author.id) {
    return <div className="container"><div className="error">No tenés permisos para acceder a esta sección.</div></div>
  }

  const canManageEvidence = user?.role === 'ADMIN' || (user?.id === project.author.id && project.status !== 'Archivado')
  const hasActivities = activityFields.some((field) => Boolean(String(project[field.key] || '').trim()))
  const hasGames = gameFields.some((field) => Boolean(String(project[field.key] || '').trim()))
  const hasPresentation = presentationFields.some((field) => Boolean(String(project[field.key] || '').trim()))

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
          <button className="btn-view" onClick={() => navigate(`/projects/${project.id}/materials`)}>
            Ver recursos visuales
          </button>
          {project.status === 'Borrador generado' && (
            <button onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : 'Editar ficha'}</button>
          )}
          <button onClick={handleGenerateActivities} disabled={generatingActivities}>
            {generatingActivities ? 'Generando actividades...' : 'Generar actividades'}
          </button>
          <button onClick={handleGenerateGames} disabled={generatingGames}>
            {generatingGames ? 'Generando juegos...' : 'Generar juegos'}
          </button>
          <button onClick={handleGeneratePresentation} disabled={generatingPresentation}>
            {generatingPresentation ? 'Generando presentacion...' : 'Generar presentacion'}
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}
      {generationMode && (
        <div className="success">
          {generationMode === 'ai'
            ? 'Ficha generada con asistencia de IA. Revisá antes de enviar.'
            : 'Ficha generada automáticamente. Revisá antes de enviar.'}
        </div>
      )}
      {activitiesMode && (
        <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
      )}

      {(gamesMode || presentationMode) && (
        <div className="success">Contenido generado con asistencia de IA. Revisa y ajusta antes de usar.</div>
      )}

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
          <h2>Actividades pedagógicas</h2>
          {activityFields.map((field) => (
            <label key={String(field.key)}>
              {field.title}
              <textarea value={String(editData[field.key] || '')} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} />
            </label>
          ))}
          <h2>Juegos educativos</h2>
          {gameFields.map((field) => (
            <label key={String(field.key)}>
              {field.title}
              <textarea value={String(editData[field.key] || '')} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} />
            </label>
          ))}
          <h2>Presentacion del proyecto</h2>
          {presentationFields.map((field) => (
            <label key={String(field.key)}>
              {field.title}
              {field.key === 'presentationTitle' || field.key === 'presentationSubtitle' ? (
                <input value={String(editData[field.key] || '')} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} />
              ) : (
                <textarea value={String(editData[field.key] || '')} onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })} />
              )}
            </label>
          ))}
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

          <section>
            <h2>Materiales generados</h2>
            <div className="success">Contenido generado con asistencia de IA. Revisa y ajusta antes de usar.</div>
            <div className="button-group">
              <button onClick={handleGenerateActivities} disabled={generatingActivities}>
                {generatingActivities ? 'Generando actividades...' : 'Generar actividades pedagogicas'}
              </button>
              <button onClick={handleGenerateGames} disabled={generatingGames}>
                {generatingGames ? 'Generando juegos...' : 'Generar juegos educativos'}
              </button>
              <button onClick={handleGeneratePresentation} disabled={generatingPresentation}>
                {generatingPresentation ? 'Generando presentacion...' : 'Generar presentacion del proyecto'}
              </button>
              <button onClick={() => setEditing(true)}>Editar materiales</button>
            </div>
          </section>

          {hasActivities && (
            <section>
              <h2>Actividades pedagógicas</h2>
              <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
              {activityFields.map((field) => {
                const value = String(project[field.key] || '').trim()
                if (!value) return null
                return (
                  <section key={String(field.key)}>
                    <h2>{field.title}</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
                  </section>
                )
              })}
            </section>
          )}

          {hasGames && (
            <section>
              <h2>Juegos educativos</h2>
              {gameFields.map((field) => {
                const value = String(project[field.key] || '').trim()
                if (!value) return null
                return (
                  <section key={String(field.key)}>
                    <h2>{field.title}</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
                  </section>
                )
              })}
            </section>
          )}

          {hasPresentation && (
            <section>
              <h2>Presentacion del proyecto</h2>
              {presentationFields.map((field) => {
                const value = String(project[field.key] || '').trim()
                if (!value) return null
                return (
                  <section key={String(field.key)}>
                    <h2>{field.title}</h2>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
                  </section>
                )
              })}
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
