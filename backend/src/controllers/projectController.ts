import { Response } from 'express'
import { prisma } from '../config/prisma'
import { projectSchema } from '../validators/projectValidator'
import { AuthRequest } from '../middlewares/authMiddleware'
import { buildProjectLearningContext, generateProjectActivities, generateProjectFicha, generateProjectGames, generateProjectPresentation } from '../services/aiService'
import { generateProjectPdf } from '../services/pdfService'
import { generateProjectPresentationPptx } from '../services/pptxService'
import { buildSearchQueryFromProject, getWebSearchProviderStatus, searchEducationalSources, WebSource } from '../services/webSearchService'

const authorSelect = {
  id: true,
  name: true,
  email: true,
  role: true
} as const

const projectInclude = {
  author: { select: authorSelect },
  links: true,
  files: true,
  sources: { orderBy: { accessedAt: 'desc' as const } }
} as const

const fichaFields = [
  'improvedTitle',
  'generatedSummary',
  'objectives',
  'mainActivities',
  'resourcesUsed',
  'finalProducts',
  'evidenceDescription',
  'reuseSuggestions',
  'improvementSuggestions',
  'suggestedTags'
] as const

const activityFields = [
  'introActivities',
  'developmentActivities',
  'closingActivities',
  'assessmentCriteria',
  'rubric',
  'interdisciplinarySuggestions',
  'adaptations',
  'requiredResources',
  'estimatedTimeline',
  'studentReflectionQuestions'
] as const

const gameFields = [
  'quizQuestions',
  'trueFalse',
  'multipleChoice',
  'wordSearch',
  'crossword',
  'memoryGame',
  'bingoConcepts',
  'challengeCards',
  'rolePlayingGame',
  'reflectionGame'
] as const

const presentationFields = [
  'presentationTitle',
  'presentationSubtitle',
  'slides',
  'oralScript',
  'visualSuggestions',
  'closingMessage'
] as const

const baseFields = [
  'title',
  'description',
  'teacher',
  'course',
  'educationalLevel',
  'educationalCycle',
  'area',
  'experienceType',
  'link',
  'isReusable',
  'status',
  ...fichaFields,
  ...activityFields,
  ...gameFields,
  ...presentationFields
] as const

const isAdmin = (req: AuthRequest) => req.user?.role === 'ADMIN'
const reviewStatuses = ['En revisión', 'En revision']

const requireAdmin = (req: AuthRequest, res: Response) => {
  if (!isAdmin(req)) {
    res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
    return false
  }
  return true
}

const canAccessProject = (req: AuthRequest, authorId: number) => {
  return isAdmin(req) || req.user?.id === authorId
}

const canDownloadProject = (req: AuthRequest, project: { authorId: number; status: string }) => {
  return canAccessProject(req, project.authorId) || project.status === 'Publicado'
}

const buildUpdateData = (data: Record<string, any>) => {
  const updateData: Record<string, any> = {}

  for (const field of baseFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updateData[field] = ['link', 'educationalLevel', 'educationalCycle'].includes(field) && data[field] === ''
        ? null
        : data[field]
    }
  }

  return updateData
}

const getProjectEvidenceForAI = async (projectId: number) => {
  const [links, files] = await Promise.all([
    (prisma as any).projectLink.findMany({ where: { projectId }, select: { label: true, url: true } }),
    (prisma as any).projectFile.findMany({ where: { projectId }, select: { originalName: true } })
  ])

  return { links, files }
}

const toWebSource = (source: any): WebSource => ({
  title: source.title,
  url: source.url,
  snippet: source.note || source.snippet || '',
  sourceType: source.sourceType || undefined,
  accessedAt: source.accessedAt instanceof Date ? source.accessedAt.toISOString() : String(source.accessedAt)
})

const getProjectSourcesForAI = async (projectId: number): Promise<WebSource[]> => {
  const sources = await (prisma as any).projectSource.findMany({
    where: { projectId },
    orderBy: { accessedAt: 'desc' },
    take: 12
  })
  return sources.map(toWebSource)
}

const buildAIInput = (
  project: any,
  evidence: { links: Array<{ label: string; url: string }>; files: Array<{ originalName: string }> },
  webSources: WebSource[] = []
) => ({
  title: project.title,
  description: project.description,
  teacher: project.teacher,
  course: project.course,
  educationalLevel: project.educationalLevel,
  educationalCycle: project.educationalCycle,
  area: project.area,
  experienceType: project.experienceType,
  link: project.link,
  isReusable: project.isReusable,
  generatedSummary: project.generatedSummary,
  objectives: project.objectives,
  mainActivities: project.mainActivities,
  resourcesUsed: project.resourcesUsed,
  finalProducts: project.finalProducts,
  evidenceDescription: project.evidenceDescription,
  reuseSuggestions: project.reuseSuggestions,
  improvementSuggestions: project.improvementSuggestions,
  suggestedTags: project.suggestedTags,
  introActivities: project.introActivities,
  developmentActivities: project.developmentActivities,
  closingActivities: project.closingActivities,
  assessmentCriteria: project.assessmentCriteria,
  rubric: project.rubric,
  interdisciplinarySuggestions: project.interdisciplinarySuggestions,
  adaptations: project.adaptations,
  requiredResources: project.requiredResources,
  estimatedTimeline: project.estimatedTimeline,
  studentReflectionQuestions: project.studentReflectionQuestions,
  links: evidence.links,
  files: evidence.files,
  webSources
})

const getSourceUsage = (input: ReturnType<typeof buildAIInput>): 'web' | 'internal' =>
  buildProjectLearningContext(input).sourceNotes.length > 0 ? 'web' : 'internal'

export const listProjects = async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: isAdmin(req) ? undefined : { authorId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: projectInclude
  })

  return res.json(projects)
}

export const getProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude
  })

  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para acceder a este proyecto.' })
  }

  return res.json(project)
}

export const downloadProjectPdf = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude
  })

  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canDownloadProject(req, project)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  try {
    const settings = await (prisma as any).institutionSettings.findFirst({ orderBy: { id: 'asc' } })
    const pdf = await generateProjectPdf(project, settings)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="ficha-proyecto-${project.id}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    return res.send(pdf)
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo generar el PDF.' })
  }
}

export const downloadProjectPptx = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude
  })

  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canDownloadProject(req, project)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  try {
    const settings = await (prisma as any).institutionSettings.findFirst({ orderBy: { id: 'asc' } })
    const pptx = await generateProjectPresentationPptx(project, settings)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    res.setHeader('Content-Disposition', `attachment; filename="presentación-proyecto-${project.id}.pptx"`)
    res.setHeader('Content-Length', pptx.length)
    return res.send(pptx)
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo generar el PowerPoint.' })
  }
}

export const getPublishedProjects = async (req: AuthRequest, res: Response) => {
  const { search, area, course, experienceType, isReusable, year } = req.query

  const filters: any = {
    status: 'Publicado'
  }

  if (area && typeof area === 'string' && area !== 'all') {
    filters.area = area
  }

  if (course && typeof course === 'string' && course !== 'all') {
    filters.course = course
  }

  if (experienceType && typeof experienceType === 'string' && experienceType !== 'all') {
    filters.experienceType = experienceType
  }

  if (isReusable === 'true' || isReusable === 'false') {
    filters.isReusable = isReusable === 'true'
  }

  if (year && typeof year === 'string' && year !== 'all') {
    const yearNumber = Number(year)
    if (!Number.isNaN(yearNumber)) {
      filters.createdAt = {
        gte: new Date(yearNumber, 0, 1),
        lt: new Date(yearNumber + 1, 0, 1)
      }
    }
  }

  if (search && typeof search === 'string') {
    filters.OR = [
      { title: { contains: search } },
      { improvedTitle: { contains: search } },
      { description: { contains: search } },
      { generatedSummary: { contains: search } },
      { area: { contains: search } },
      { course: { contains: search } },
      { experienceType: { contains: search } },
      { teacher: { contains: search } }
    ]
  }

  const projects = await prisma.project.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    include: projectInclude
  })

  return res.json(projects)
}

export const getPublishedProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findFirst({
    where: { id, status: 'Publicado' },
    include: projectInclude
  })

  if (!project) {
    return res.status(404).json({ message: 'Proyecto publicado no encontrado' })
  }

  return res.json(project)
}

export const duplicateProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const original = await prisma.project.findUnique({ where: { id } })

  if (!original || original.status !== 'Publicado') {
    return res.status(404).json({ message: 'Proyecto publicado no encontrado' })
  }

  const copy = await prisma.project.create({
    data: {
      title: `Copia de ${original.title}`,
      description: original.description,
      teacher: req.user!.name,
      course: original.course,
      educationalLevel: original.educationalLevel,
      educationalCycle: original.educationalCycle,
      area: original.area,
      experienceType: original.experienceType,
      link: original.link,
      isReusable: original.isReusable,
      status: 'Cargado',
      authorId: req.user!.id
    },
    include: projectInclude
  })

  return res.status(201).json(copy)
}

export const createProject = async (req: AuthRequest, res: Response) => {
  const parseResult = projectSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors })
  }

  const data = parseResult.data
  if (!isAdmin(req) && (data.status === 'Publicado' || data.status === 'Archivado')) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      teacher: data.teacher,
      course: data.course,
      educationalLevel: data.educationalLevel || null,
      educationalCycle: data.educationalCycle || null,
      area: data.area,
      experienceType: data.experienceType,
      link: data.link || null,
      isReusable: data.isReusable ?? false,
      status: data.status ?? 'Cargado',
      authorId: req.user!.id
    },
    include: projectInclude
  })

  return res.status(201).json(project)
}

export const updateProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const parseResult = projectSchema.partial().safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors })
  }

  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para editar este proyecto.' })
  }

  const requestedStatus = parseResult.data.status
  if (!isAdmin(req) && (requestedStatus === 'Publicado' || requestedStatus === 'Archivado')) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: buildUpdateData(parseResult.data),
    include: projectInclude
  })

  return res.json(updated)
}

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para eliminar este proyecto.' })
  }

  await prisma.project.delete({ where: { id } })
  return res.status(204).send()
}

export const generateFicha = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para generar ficha de este proyecto.' })
  }

  try {
    const evidence = await getProjectEvidenceForAI(id)
    const result = await generateProjectFicha(buildAIInput(project, evidence))

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...result.ficha,
        status: 'Borrador generado'
      },
      include: projectInclude
    })

    return res.json({ ...updated, generationMode: result.generationMode })
  } catch (error) {
    return res.status(500).json({ message: 'Error generando ficha' })
  }
}

export const getWebSearchStatus = async (_req: AuthRequest, res: Response) => {
  return res.json(getWebSearchProviderStatus())
}

export const enrichProjectContext = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para buscar fuentes de este proyecto.' })
  }

  try {
    const [evidence, existingSources] = await Promise.all([
      getProjectEvidenceForAI(id),
      getProjectSourcesForAI(id)
    ])
    const input = buildAIInput(project, evidence, existingSources)
    const internalContext = buildProjectLearningContext(input, [])
    const query = buildSearchQueryFromProject(input, internalContext.keyConcepts)
    const providerStatus = getWebSearchProviderStatus()
    const foundSources = await searchEducationalSources(query)

    if (foundSources.length > 0) {
      await Promise.all(foundSources.map((source) => (prisma as any).projectSource.upsert({
        where: { projectId_url: { projectId: id, url: source.url } },
        update: {
          title: source.title,
          snippet: source.snippet,
          note: source.snippet,
          sourceType: source.sourceType,
          accessedAt: new Date(source.accessedAt)
        },
        create: {
          projectId: id,
          title: source.title,
          url: source.url,
          snippet: source.snippet,
          note: source.snippet,
          sourceType: source.sourceType,
          accessedAt: new Date(source.accessedAt)
        }
      })))
    }

    const sources = await getProjectSourcesForAI(id)
    const context = buildProjectLearningContext(buildAIInput(project, evidence, sources), sources)
    const sourceUsage = context.sourceNotes.length > 0 ? 'web' : 'internal'
    const message = providerStatus.configurationState === 'disabled'
      ? 'La búsqueda web está desactivada. Se usará el contexto interno del proyecto.'
      : providerStatus.configurationState === 'missing_api_key'
        ? 'El proveedor de búsqueda web está configurado, pero falta la API key.'
      : foundSources.length > 0
        ? `Se encontraron ${foundSources.length} fuentes educativas confiables y quedaron disponibles para la generación.`
        : sourceUsage === 'web'
          ? 'No se encontraron fuentes nuevas. Se conservarán las fuentes pertinentes consultadas anteriormente.'
          : 'No se encontraron fuentes confiables y pertinentes para esta búsqueda. Se usará el contexto interno del proyecto.'

    return res.json({
      query,
      provider: providerStatus.provider,
      searchPerformed: providerStatus.enabled,
      configurationState: providerStatus.configurationState,
      sources,
      context,
      sourceUsage,
      message
    })
  } catch (error) {
    console.error('Error enriqueciendo contexto educativo.', error)
    return res.status(500).json({ message: 'No se pudo enriquecer el contexto educativo.' })
  }
}

export const generateActivities = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para generar actividades de este proyecto.' })
  }

  try {
    const [evidence, sources] = await Promise.all([getProjectEvidenceForAI(id), getProjectSourcesForAI(id)])
    const input = buildAIInput(project, evidence, sources)
    const result = await generateProjectActivities(input)
    const sourceUsage = getSourceUsage(input)

    const updated = await prisma.project.update({
      where: { id },
      data: result.activities,
      include: projectInclude
    })

    return res.json({ ...updated, generationMode: result.generationMode, sourceUsage })
  } catch (error) {
    return res.status(500).json({ message: 'Error generando actividades' })
  }
}

export const generateGames = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para generar juegos de este proyecto.' })
  }

  try {
    const [evidence, sources] = await Promise.all([getProjectEvidenceForAI(id), getProjectSourcesForAI(id)])
    const input = buildAIInput(project, evidence, sources)
    const result = await generateProjectGames(input)
    const sourceUsage = getSourceUsage(input)

    const updated = await prisma.project.update({
      where: { id },
      data: result.games,
      include: projectInclude
    })

    return res.json({ ...updated, generationMode: result.generationMode, sourceUsage })
  } catch (error) {
    return res.status(500).json({ message: 'Error generando juegos educativos' })
  }
}

export const generatePresentation = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para generar presentación de este proyecto.' })
  }

  try {
    const [evidence, sources] = await Promise.all([getProjectEvidenceForAI(id), getProjectSourcesForAI(id)])
    const input = buildAIInput(project, evidence, sources)
    const result = await generateProjectPresentation(input)
    const sourceUsage = getSourceUsage(input)

    const updated = await prisma.project.update({
      where: { id },
      data: result.presentation,
      include: projectInclude
    })

    return res.json({ ...updated, generationMode: result.generationMode, sourceUsage })
  } catch (error) {
    return res.status(500).json({ message: 'Error generando presentación del proyecto' })
  }
}

export const submitForReview = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (!canAccessProject(req, project.authorId)) {
    return res.status(403).json({ message: 'No tenés permisos para enviar este proyecto.' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status: 'En revisión' },
    include: projectInclude
  })

  return res.json(updated)
}

export const publishProject = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return

  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status: 'Publicado' },
    include: projectInclude
  })

  return res.json({
    ...updated,
    message: 'Proyecto publicado correctamente. La experiencia ya está disponible en el banco institucional.',
    project: updated
  })
}

export const archiveProject = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return

  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status: 'Archivado' },
    include: projectInclude
  })

  return res.json({ ...updated, message: 'Proyecto archivado correctamente.', project: updated })
}

export const getStats = async (req: AuthRequest, res: Response) => {
  if (!requireAdmin(req, res)) return

  const [
    totalProjects,
    publishedProjects,
    pendingReview,
    archivedProjects,
    reusableProjects,
    areaGroups,
    typeGroups,
    statusGroups
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'Publicado' } }),
    prisma.project.count({ where: { status: { in: reviewStatuses } } }),
    prisma.project.count({ where: { status: 'Archivado' } }),
    prisma.project.count({ where: { isReusable: true } }),
    prisma.project.groupBy({ by: ['area'], _count: { _all: true }, orderBy: { area: 'asc' } }),
    prisma.project.groupBy({ by: ['experienceType'], _count: { _all: true }, orderBy: { experienceType: 'asc' } }),
    prisma.project.groupBy({ by: ['status'], _count: { _all: true }, orderBy: { status: 'asc' } })
  ])

  return res.json({
    totalProjects,
    publishedProjects,
    pendingReview,
    archivedProjects,
    reusableProjects,
    projectsByArea: areaGroups.map((item) => ({ area: item.area, count: item._count._all })),
    projectsByType: typeGroups.map((item) => ({ type: item.experienceType, count: item._count._all })),
    projectsByStatus: statusGroups.map((item) => ({ status: item.status, count: item._count._all }))
  })
}
