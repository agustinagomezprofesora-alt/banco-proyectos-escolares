import { useState, useEffect, useRef, FormEvent } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { downloadProjectPdf, downloadProjectPptx, fetchProject, generateActivities, generateGames, generatePresentation, submitProjectReview, updateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { GenerationMode, Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, normalizeStatus } from '../utils/ui'
import EvidenceSection from '../components/EvidenceSection'
import Button from '../components/ui/Button'
import ProjectActionCards, { type ProjectActionCardGroup } from '../components/project/ProjectActionCards'
import ProjectSourcesSection from '../components/ProjectSourcesSection'

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
  { key: 'multipleChoice', title: 'Opción múltiple' },
  { key: 'wordSearch', title: 'Sopa de letras' },
  { key: 'crossword', title: 'Crucigrama' },
  { key: 'memoryGame', title: 'Memotest' },
  { key: 'bingoConcepts', title: 'Bingo' },
  { key: 'challengeCards', title: 'Tarjetas desafío' },
  { key: 'rolePlayingGame', title: 'Juego de roles' },
  { key: 'reflectionGame', title: 'Reflexión' }
]

const presentationFields: Array<{ key: keyof Project; title: string }> = [
  { key: 'presentationTitle', title: 'Título de la presentación' },
  { key: 'presentationSubtitle', title: 'Subtítulo' },
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
  const [downloadingPptx, setDownloadingPptx] = useState(false)
  const [generatingActivities, setGeneratingActivities] = useState(false)
  const [generatingGames, setGeneratingGames] = useState(false)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)
  const [activitiesMode, setActivitiesMode] = useState<GenerationMode | undefined>(undefined)
  const [gamesMode, setGamesMode] = useState<GenerationMode | undefined>(undefined)
  const [presentationMode, setPresentationMode] = useState<GenerationMode | undefined>(undefined)
  const [generationStatus, setGenerationStatus] = useState('')
  const [sourceUsageNotice, setSourceUsageNotice] = useState('')
  const generationTimers = useRef<ReturnType<typeof setTimeout>[]>([])
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

  const handleDownloadPptx = async () => {
    if (!project) return
    setDownloadingPptx(true)
    setError('')
    try {
      await downloadProjectPptx(project.id)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar la presentación.'))
    } finally {
      setDownloadingPptx(false)
    }
  }

  const startGenerationStatus = () => {
    generationTimers.current.forEach(clearTimeout)
    setSourceUsageNotice(project?.sources?.length
      ? 'Hay fuentes educativas consultadas; se usarán únicamente las pertinentes al tema.'
      : 'No hay fuentes externas disponibles. Se usará contexto interno del proyecto.')
    setGenerationStatus('Analizando el tema del proyecto...')
    generationTimers.current = [
      setTimeout(() => setGenerationStatus('Construyendo contexto pedagógico...'), 600),
      setTimeout(() => setGenerationStatus('Generando materiales específicos...'), 1400)
    ]
  }

  const stopGenerationStatus = () => {
    generationTimers.current.forEach(clearTimeout)
    generationTimers.current = []
    setGenerationStatus('')
  }

  const reportSourceUsage = (usage?: 'web' | 'internal') => {
    setSourceUsageNotice(usage === 'web'
      ? 'La generación usó fuentes educativas pertinentes y visibles.'
      : 'La generación usó el contexto interno del proyecto porque no había fuentes externas pertinentes.')
  }

  const handleGenerateActivities = async () => {
    if (!project) return
    startGenerationStatus()
    setGeneratingActivities(true)
    setError('')
    try {
      const updated = await generateActivities(project.id)
      setProject(updated)
      setEditData(updated)
      setActivitiesMode(updated.generationMode)
      reportSourceUsage(updated.sourceUsage)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron generar las actividades.'))
    } finally {
      setGeneratingActivities(false)
      stopGenerationStatus()
    }
  }

  const handleGenerateGames = async () => {
    if (!project) return
    startGenerationStatus()
    setGeneratingGames(true)
    setError('')
    try {
      const updated = await generateGames(project.id)
      setProject(updated)
      setEditData(updated)
      setGamesMode(updated.generationMode)
      reportSourceUsage(updated.sourceUsage)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron generar los juegos.'))
    } finally {
      setGeneratingGames(false)
      stopGenerationStatus()
    }
  }

  const handleGeneratePresentation = async () => {
    if (!project) return
    startGenerationStatus()
    setGeneratingPresentation(true)
    setError('')
    try {
      const updated = await generatePresentation(project.id)
      setProject(updated)
      setEditData(updated)
      setPresentationMode(updated.generationMode)
      reportSourceUsage(updated.sourceUsage)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar la presentación.'))
    } finally {
      setGeneratingPresentation(false)
      stopGenerationStatus()
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
  const materialsUrl = `/projects/${project.id}/materials`
  const actionGroups: ProjectActionCardGroup[] = [
    {
      title: 'Documentos',
      actions: [
        {
          title: 'Ficha institucional',
          actionLabel: downloading ? 'Descargando...' : 'PDF',
          variant: 'secondary',
          onClick: handleDownloadPdf,
          disabled: downloading
        },
        {
          title: 'Presentación PowerPoint',
          actionLabel: downloadingPptx ? 'Generando...' : 'PowerPoint',
          variant: 'secondary',
          onClick: handleDownloadPptx,
          disabled: downloadingPptx
        }
      ]
    },
    {
      title: 'Recursos visuales',
      actions: [
        {
          title: 'Recursos visuales',
          actionLabel: 'Abrir recursos',
          variant: 'secondary',
          onClick: () => navigate(materialsUrl)
        },
        {
          title: 'Imprimir recursos',
          actionLabel: 'Imprimir',
          variant: 'secondary',
          onClick: () => navigate(`${materialsUrl}?print=1`)
        }
      ]
    },
    {
      title: 'Generar',
      actions: [
        {
          title: 'Actividades pedagógicas',
          actionLabel: generatingActivities ? 'Generando...' : 'Actividades',
          variant: 'accent',
          onClick: handleGenerateActivities,
          disabled: generatingActivities
        },
        {
          title: 'Juegos educativos',
          actionLabel: generatingGames ? 'Generando...' : 'Juegos',
          variant: 'accent',
          onClick: handleGenerateGames,
          disabled: generatingGames
        },
        {
          title: 'Presentación visual',
          actionLabel: generatingPresentation ? 'Generando...' : 'Presentación',
          variant: 'accent',
          onClick: handleGeneratePresentation,
          disabled: generatingPresentation
        }
      ]
    }
  ]

  return (
    <div className="container">
      <header className="project-detail-header">
        <div>
          <h1>{project.improvedTitle || project.title}</h1>
          <div className="project-title-meta">
            <span>{project.course}</span>
            <span>{project.area}</span>
            <span className={`badge ${getStatusBadgeClass(project.status)}`}>{normalizeStatus(project.status)}</span>
          </div>
        </div>
        <div className="project-header-actions">
          <Button variant="secondary" onClick={() => navigate('/projects')}>Volver</Button>
          {project.status === 'Borrador generado' && (
            <Button variant="primary" onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : 'Editar ficha'}</Button>
          )}
        </div>
      </header>

      <ProjectActionCards groups={actionGroups} />

      {generationStatus && <div className="muted-text">{generationStatus}</div>}
      {sourceUsageNotice && <div className="muted-text">{sourceUsageNotice}</div>}
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
        <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
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
          <h2>Presentación del proyecto</h2>
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
              <div><strong>Nivel educativo</strong><p>{project.educationalLevel || 'No especificado'}</p></div>
              <div><strong>Ciclo educativo</strong><p>{project.educationalCycle || 'No especificado'}</p></div>
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
            <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
            <div className="button-group">
              <Button variant="primary" onClick={() => setEditing(true)}>Editar materiales</Button>
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
              <h2>Presentación del proyecto</h2>
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

          <ProjectSourcesSection
            projectId={project.id}
            initialSources={project.sources}
            canSearch
            onSourcesUpdated={(sources) => {
              setProject((current) => current ? { ...current, sources } : current)
              setEditData((current) => ({ ...current, sources }))
            }}
          />

          <EvidenceSection
            projectId={project.id}
            initialLinks={project.links}
            initialFiles={project.files}
            canEdit={canManageEvidence}
          />

          {project.status === 'Borrador generado' && (
            <div className="button-group">
              <Button variant="primary" onClick={() => setEditing(true)}>Editar ficha</Button>
              <Button variant="accent" onClick={handleSubmitReview} disabled={submitting}>{submitting ? 'Enviando a revisión...' : 'Enviar a revisión'}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
