import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { archiveProject, downloadProjectPdf, fetchProject, generateActivities, generateGames, generatePresentation, publishProject } from '../api/api'
import { GenerationMode, Project } from '../types'
import { getErrorMessage, getStatusBadgeClass, normalizeStatus } from '../utils/ui'
import EvidenceSection from '../components/EvidenceSection'

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

const activitySections: Array<{ key: keyof Project; title: string }> = [
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

const gameSections: Array<{ key: keyof Project; title: string }> = [
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

const presentationSections: Array<{ key: keyof Project; title: string }> = [
  { key: 'presentationTitle', title: 'Titulo de la presentacion' },
  { key: 'presentationSubtitle', title: 'Subtitulo' },
  { key: 'slides', title: 'Estructura de diapositivas' },
  { key: 'oralScript', title: 'Guion oral' },
  { key: 'visualSuggestions', title: 'Sugerencias visuales' },
  { key: 'closingMessage', title: 'Cierre final' }
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
  const [generatingActivities, setGeneratingActivities] = useState(false)
  const [generatingGames, setGeneratingGames] = useState(false)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)
  const [activitiesMode, setActivitiesMode] = useState<GenerationMode | undefined>(undefined)
  const [gamesMode, setGamesMode] = useState<GenerationMode | undefined>(undefined)
  const [presentationMode, setPresentationMode] = useState<GenerationMode | undefined>(undefined)

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

  const handleGenerateActivities = async () => {
    if (!project) return
    setGeneratingActivities(true)
    setMessage('')
    setError('')
    try {
      const updated = await generateActivities(project.id)
      setProject(updated)
      setActivitiesMode(updated.generationMode)
      setMessage('Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron generar las actividades.'))
    } finally {
      setGeneratingActivities(false)
    }
  }

  const handleGenerateGames = async () => {
    if (!project) return
    setGeneratingGames(true)
    setMessage('')
    setError('')
    try {
      const updated = await generateGames(project.id)
      setProject(updated)
      setGamesMode(updated.generationMode)
      setMessage('Contenido generado con asistencia de IA. RevisÃ¡ y ajustÃ¡ antes de usar.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron generar los juegos.'))
    } finally {
      setGeneratingGames(false)
    }
  }

  const handleGeneratePresentation = async () => {
    if (!project) return
    setGeneratingPresentation(true)
    setMessage('')
    setError('')
    try {
      const updated = await generatePresentation(project.id)
      setProject(updated)
      setPresentationMode(updated.generationMode)
      setMessage('Contenido generado con asistencia de IA. RevisÃ¡ y ajustÃ¡ antes de usar.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar la presentacion.'))
    } finally {
      setGeneratingPresentation(false)
    }
  }

  if (loading) return <div className="container"><p>Cargando proyecto...</p></div>
  if (!project) return <div className="container"><div className="empty-state"><p>Proyecto no encontrado.</p></div></div>

  const hasActivities = activitySections.some((section) => Boolean(String(project[section.key] || '').trim()))
  const hasGames = gameSections.some((section) => Boolean(String(project[section.key] || '').trim()))
  const hasPresentation = presentationSections.some((section) => Boolean(String(project[section.key] || '').trim()))

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
          <button onClick={handleGenerateActivities} disabled={generatingActivities}>
            {generatingActivities ? 'Generando actividades...' : 'Generar actividades'}
          </button>
          <button onClick={handleGenerateGames} disabled={generatingGames}>
            {generatingGames ? 'Generando juegos...' : 'Generar juegos'}
          </button>
          <button onClick={handleGeneratePresentation} disabled={generatingPresentation}>
            {generatingPresentation ? 'Generando presentacion...' : 'Generar presentacion'}
          </button>
          <button className="btn-view" onClick={() => navigate(`/admin/projects/${project.id}/materials`)}>
            Ver recursos visuales
          </button>
          <button className="btn-edit" onClick={() => navigate(`/admin/projects/${project.id}/edit`)}>Editar</button>
          <button className="primary-btn" onClick={handlePublish} disabled={publishing}>{publishing ? 'Publicando proyecto...' : 'Publicar'}</button>
          <button className="btn-delete" onClick={handleArchive} disabled={archiving}>{archiving ? 'Archivando proyecto...' : 'Archivar'}</button>
        </div>
      </header>

      {message && <div className="success">{message}</div>}
      {(activitiesMode || gamesMode || presentationMode) && !message && <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>}
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

      <section className="ficha-view">
        <h2>Materiales generados</h2>
        <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
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
          <button onClick={() => navigate(`/admin/projects/${project.id}/edit`)}>Editar materiales</button>
        </div>
      </section>

      {hasActivities && (
        <section className="ficha-view">
          <h2>Actividades pedagógicas</h2>
          <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
          {activitySections.map((section) => {
            const value = String(project[section.key] || '').trim()
            if (!value) return null
            return (
              <section key={String(section.key)}>
                <h2>{section.title}</h2>
                <p style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
              </section>
            )
          })}
        </section>
      )}

      {hasGames && (
        <section className="ficha-view">
          <h2>Juegos educativos</h2>
          <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
          {gameSections.map((section) => {
            const value = String(project[section.key] || '').trim()
            if (!value) return null
            return (
              <section key={String(section.key)}>
                <h2>{section.title}</h2>
                <p style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
              </section>
            )
          })}
        </section>
      )}

      {hasPresentation && (
        <section className="ficha-view">
          <h2>Presentacion del proyecto</h2>
          <div className="success">Contenido generado con asistencia de IA. Revisá y ajustá antes de usar.</div>
          {presentationSections.map((section) => {
            const value = String(project[section.key] || '').trim()
            if (!value) return null
            return (
              <section key={String(section.key)}>
                <h2>{section.title}</h2>
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
        canEdit
      />
    </div>
  )
}
