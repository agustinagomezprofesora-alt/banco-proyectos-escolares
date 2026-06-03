import { useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { downloadProjectPptx, fetchProject, fetchPublishedProject, generateGames, generatePresentation } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'
import { getErrorMessage } from '../utils/ui'
import EvidenceSection from '../components/EvidenceSection'
import {
  parseQuizQuestions,
  parseTrueFalse,
  parseMultipleChoice,
  parseWordSearchWords,
  generateWordSearch,
  parseCrossword,
  parseMemoryGame,
  parseBingoConcepts,
  generateBingoCards,
  parseChallengeCards,
  parseRolePlayingGame,
  parseReflectionGame,
  parseSlides,
  QuizCards,
  TrueFalseCards,
  MultipleChoiceCards,
  WordSearchGrid,
  CrosswordGrid,
  MemoryCards,
  BingoCards,
  ChallengeCards,
  RoleCards,
  ReflectionCards,
  SlidePreview,
  ResourceSection,
  SectionHeader,
  FallbackCard,
  ButtonGroup
} from '../components/visual-resources/VisualResourcesComponents'

const activitySections: Array<{ title: string; value?: string | null }> = [
  { title: 'Resumen institucional', value: undefined },
  { title: 'Objetivos', value: undefined },
  { title: 'Actividades principales', value: undefined },
  { title: 'Recursos utilizados', value: undefined },
  { title: 'Producciones finales', value: undefined },
  { title: 'Evidencias', value: undefined },
  { title: 'Sugerencias de reutilización', value: undefined },
  { title: 'Sugerencias de mejora', value: undefined }
]

export default function VisualResourcesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const bankMatch = useMatch('/bank/:id/materials')
  const adminMatch = useMatch('/admin/projects/:id/materials')
  const isBankView = Boolean(bankMatch)
  const isAdminView = Boolean(adminMatch)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Juegos visuales')
  const [generatingGames, setGeneratingGames] = useState(false)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)
  const [downloadingPptx, setDownloadingPptx] = useState(false)
  const [wordSearchSeed, setWordSearchSeed] = useState(0)
  const didAutoPrint = useRef(false)

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const data = isBankView ? await fetchPublishedProject(Number(id)) : await fetchProject(Number(id))
        setProject(data)
      } catch (err: any) {
        setError(getErrorMessage(err, 'No se pudo cargar el proyecto.'))
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [id, isBankView])

  useEffect(() => {
    if (loading || !project || searchParams.get('print') !== '1' || didAutoPrint.current) return
    didAutoPrint.current = true
    const timer = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(timer)
  }, [loading, project, searchParams])

  const canGenerate = !isBankView && Boolean(project && (user?.role === 'ADMIN' || user?.id === project.author.id))
  const canEditEvidence = !isBankView && Boolean(project && (user?.role === 'ADMIN' || user?.id === project.author.id))

  const activityData = useMemo(
    () => [
      { title: 'Resumen institucional', value: project?.generatedSummary },
      { title: 'Objetivos', value: project?.objectives },
      { title: 'Actividades principales', value: project?.mainActivities },
      { title: 'Recursos utilizados', value: project?.resourcesUsed },
      { title: 'Producciones finales', value: project?.finalProducts },
      { title: 'Evidencias', value: project?.evidenceDescription },
      { title: 'Sugerencias de reutilización', value: project?.reuseSuggestions },
      { title: 'Sugerencias de mejora', value: project?.improvementSuggestions }
    ],
    [project]
  )

  const quizItems = useMemo(() => parseQuizQuestions(project?.quizQuestions), [project?.quizQuestions])
  const trueFalseItems = useMemo(() => parseTrueFalse(project?.trueFalse), [project?.trueFalse])
  const multipleChoiceItems = useMemo(() => parseMultipleChoice(project?.multipleChoice), [project?.multipleChoice])
  const wordSearchWords = useMemo(() => {
    if (!project) return []

    const parsed = parseWordSearchWords(project.wordSearch)
    const fallbackFields = [
      project.title,
      project.area,
      project.course,
      project.experienceType,
      project.generatedSummary,
      project.suggestedTags
    ].filter(Boolean).map((value) => String(value).trim())

    const fallbackWords = fallbackFields.flatMap((value) => parseWordSearchWords(value))
    const combined = Array.from(new Set([...parsed, ...fallbackWords])).slice(0, 12)
    return combined
  }, [project])
  const wordSearchGrid = useMemo(
    () => (wordSearchWords.length ? generateWordSearch(wordSearchWords, 12) : []),
    [wordSearchWords, wordSearchSeed]
  )
  const crosswordItems = useMemo(() => parseCrossword(project?.crossword), [project?.crossword])
  const memoryItems = useMemo(() => parseMemoryGame(project?.memoryGame), [project?.memoryGame])
  const bingoWords = useMemo(() => parseBingoConcepts(project?.bingoConcepts), [project?.bingoConcepts])
  const bingoCards = useMemo(() => (bingoWords.length ? generateBingoCards(bingoWords, 4, 4) : []), [bingoWords])
  const challengeItems = useMemo(() => parseChallengeCards(project?.challengeCards), [project?.challengeCards])
  const roleItems = useMemo(() => parseRolePlayingGame(project?.rolePlayingGame), [project?.rolePlayingGame])
  const reflectionItems = useMemo(() => parseReflectionGame(project?.reflectionGame), [project?.reflectionGame])
  const parsedSlides = useMemo(() => parseSlides(project?.slides), [project?.slides])

  const presentationSlides = useMemo(() => {
    const cover = project?.presentationTitle || project?.presentationSubtitle
      ? {
          number: 1,
          title: project?.presentationTitle || 'Portada del proyecto',
          content: [project?.presentationSubtitle || 'Presentación visual del proyecto'],
          visualSuggestion: project?.visualSuggestions || 'Usar colores institucionales y una imagen representativa'
        }
      : null

    const slides = parsedSlides.map((slide, index) => ({
      ...slide,
      number: cover ? index + 2 : index + 1
    }))

    return cover ? [cover, ...slides] : slides
  }, [project?.presentationTitle, project?.presentationSubtitle, project?.visualSuggestions, parsedSlides])

  const hasGameContent = Boolean(
    quizItems.length || trueFalseItems.length || multipleChoiceItems.length || wordSearchWords.length || crosswordItems.length || memoryItems.length || bingoWords.length || challengeItems.length || roleItems.length || reflectionItems.length
  )
  const hasPresentationContent = Boolean(presentationSlides.length || project?.presentationTitle || project?.presentationSubtitle || project?.visualSuggestions || project?.closingMessage)

  const handleGenerateGames = async () => {
    if (!project) return
    setGeneratingGames(true)
    setError('')
    try {
      const updated = await generateGames(project.id)
      setProject(updated)
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
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar la presentación.'))
    } finally {
      setGeneratingPresentation(false)
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

  const backUrl = isBankView ? `/bank/${project?.id}` : isAdminView ? `/admin/projects/${project?.id}` : `/projects/${project?.id}`

  if (loading) return <div className="container"><p>Cargando recursos visuales...</p></div>
  if (!project) return <div className="container"><div className="empty-state"><p>Proyecto no encontrado.</p></div></div>

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Recursos visuales imprimibles</h1>
          <p>{project.improvedTitle || project.title}</p>
        </div>
        <div>
          <button onClick={() => navigate(backUrl)}>Volver</button>
          {canGenerate && (
            <>
              <button className="btn-generate" onClick={handleGenerateGames} disabled={generatingGames}>
                {generatingGames ? 'Generando juegos...' : 'Generar juegos'}
              </button>
              <button className="btn-generate" onClick={handleGeneratePresentation} disabled={generatingPresentation}>
                {generatingPresentation ? 'Generando presentación...' : 'Generar presentación'}
              </button>
            </>
          )}
          <button className="btn-view" onClick={handleDownloadPptx} disabled={downloadingPptx}>
            {downloadingPptx ? 'Generando presentación...' : 'Descargar presentación PowerPoint'}
          </button>
          <button className="btn-view" onClick={() => window.print()}>Imprimir recursos</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}
      <div className="resource-header">
        <p className="muted-text">Esta vista convierte el contenido existente en recursos visuales listos para imprimir. Las páginas y tarjetas se adaptan a impresión con saltos claros.</p>
      </div>

      <div className="resource-tabs">
        {['Actividades', 'Juegos visuales', 'Presentación visual', 'Evidencias'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Actividades' && (
        <>
          <SectionHeader title="Actividades pedagógicas" description="Visualiza las actividades ya generadas con un formato claro para consulta." />
          {activityData.some((item) => item.value?.trim()) ? (
            <div className="resource-grid">
              {activityData.map((item) =>
                item.value?.trim() ? (
                  <div key={item.title} className="resource-card">
                    <div className="resource-card-title">{item.title}</div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{item.value}</p>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div className="empty-state"><p>No hay actividades generadas aún.</p></div>
          )}
        </>
      )}

      {activeTab === 'Juegos visuales' && (
        <>
          <SectionHeader title="Juegos visuales" description="Cada juego se presenta con tarjetas, grillas y plantillas listas para imprimir." />
          <ResourceSection title="Quiz visual">
            {quizItems.length ? <QuizCards items={quizItems} /> : project.quizQuestions ? <FallbackCard title="Quiz" text={project.quizQuestions} /> : <p>No hay quiz generado aún.</p>}
          </ResourceSection>

          <ResourceSection title="Verdadero/Falso">
            {trueFalseItems.length ? <TrueFalseCards items={trueFalseItems} /> : project.trueFalse ? <FallbackCard title="Verdadero/Falso" text={project.trueFalse} /> : <p>No hay Verdadero/Falso generado aún.</p>}
          </ResourceSection>

          <ResourceSection title="Opción múltiple">
            {multipleChoiceItems.length ? <MultipleChoiceCards items={multipleChoiceItems} /> : project.multipleChoice ? <FallbackCard title="Opción múltiple" text={project.multipleChoice} /> : <p>No hay preguntas de opción múltiple generadas aún.</p>}
          </ResourceSection>

          <ResourceSection title="Sopa de letras">
            {wordSearchWords.length ? (
              <div>
                <div className="button-group">
                  <button type="button" className="btn-generate" onClick={() => setWordSearchSeed((prev) => prev + 1)}>
                    Regenerar sopa de letras
                  </button>
                </div>
                {wordSearchGrid.length ? (
                  <WordSearchGrid words={wordSearchWords} grid={wordSearchGrid} />
                ) : (
                  <div className="error">No se pudo generar la sopa de letras.</div>
                )}
              </div>
            ) : project.wordSearch ? (
              <FallbackCard title="Sopa de letras" text={project.wordSearch} />
            ) : (
              <p>No hay sopa de letras generada aún.</p>
            )}
          </ResourceSection>

          <ResourceSection title="Crucigrama">
            {crosswordItems.length ? <CrosswordGrid entries={crosswordItems} /> : project.crossword ? <FallbackCard title="Crucigrama" text={project.crossword} /> : <p>No hay crucigrama generado aún.</p>}
          </ResourceSection>

          <ResourceSection title="Memotest">
            {memoryItems.length ? <MemoryCards items={memoryItems} /> : project.memoryGame ? <FallbackCard title="Memotest" text={project.memoryGame} /> : <p>No hay memotest generado aún.</p>}
          </ResourceSection>

          <ResourceSection title="Bingo">
            {bingoWords.length ? <BingoCards cards={bingoCards} /> : project.bingoConcepts ? <FallbackCard title="Bingo" text={project.bingoConcepts} /> : <p>No hay bingo generado aún.</p>}
          </ResourceSection>

          <ResourceSection title="Tarjetas desafío">
            {challengeItems.length ? <ChallengeCards items={challengeItems} /> : project.challengeCards ? <FallbackCard title="Tarjetas desafío" text={project.challengeCards} /> : <p>No hay tarjetas desafío generadas aún.</p>}
          </ResourceSection>

          <ResourceSection title="Juego de roles">
            {roleItems.length ? <RoleCards items={roleItems} /> : project.rolePlayingGame ? <FallbackCard title="Juego de roles" text={project.rolePlayingGame} /> : <p>No hay juego de roles generado aún.</p>}
          </ResourceSection>

          <ResourceSection title="Reflexión">
            {reflectionItems.length ? <ReflectionCards items={reflectionItems} /> : project.reflectionGame ? <FallbackCard title="Reflexión" text={project.reflectionGame} /> : <p>No hay tarjetas de reflexión generadas aún.</p>}
          </ResourceSection>

          {!hasGameContent && <div className="empty-state"><p>No hay materiales de juegos disponibles. Puedes generar nuevos juegos si tenés permisos.</p></div>}
        </>
      )}

      {activeTab === 'Presentación visual' && (
        <>
          <SectionHeader title="Presentación visual" description="Presentación tipo diapositivas con un diseño simple, lista para imprimir o descargar en PDF desde el navegador." />
          {hasPresentationContent ? (
            <div className="slide-list">
              <SlidePreview slides={presentationSlides} />
              {project.visualSuggestions && (
                <div className="resource-card">
                  <div className="resource-card-title">Sugerencias visuales</div>
                  <p>{project.visualSuggestions}</p>
                </div>
              )}
              {project.closingMessage && (
                <div className="resource-card">
                  <div className="resource-card-title">Cierre visual</div>
                  <p>{project.closingMessage}</p>
                </div>
              )}
            </div>
          ) : project.presentationTitle || project.slides || project.presentationSubtitle ? (
            <FallbackCard title="Presentación" text={`${project.presentationTitle || ''}\n${project.presentationSubtitle || ''}\n${project.slides || ''}`} />
          ) : (
            <div className="empty-state"><p>No hay presentación generada aún.</p></div>
          )}
        </>
      )}

      {activeTab === 'Evidencias' && (
        <>
          <SectionHeader title="Evidencias" description="Visualiza y gestióna las evidencias del proyecto desde este espacio." />
          <EvidenceSection
            projectId={project.id}
            initialLinks={project.links || []}
            initialFiles={project.files || []}
            canEdit={Boolean(canEditEvidence)}
          />
        </>
      )}
    </div>
  )
}
