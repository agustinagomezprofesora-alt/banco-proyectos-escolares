import { Response } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middlewares/authMiddleware'
import { analyzeUrlSource, UrlSourceValidationError } from '../services/urlSourceService'

const isAdmin = (req: AuthRequest) => req.user?.role === 'ADMIN'
const canView = (req: AuthRequest, project: { authorId: number; status: string }) =>
  isAdmin(req) || req.user?.id === project.authorId || project.status === 'Publicado'
const canManage = (req: AuthRequest, project: { authorId: number; status: string }) =>
  isAdmin(req) || (req.user?.id === project.authorId && project.status !== 'Archivado')

const getProject = (id: number) => prisma.project.findUnique({
  where: { id },
  select: { id: true, authorId: true, status: true }
})

const cleanOptionalText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return null
  const text = value.replace(/\s+/g, ' ').trim()
  return text ? text.slice(0, maxLength) : null
}

const isValidId = (value: number) => Number.isInteger(value) && value > 0

const sourceMessage = (status: string) =>
  status === 'success'
    ? 'Fuente agregada correctamente.'
    : status === 'partial'
      ? 'Fuente agregada parcialmente. Se guardó el enlace y la información disponible.'
      : 'No se pudo leer el contenido, pero se guardó el enlace.'

export const listProjectSources = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  if (!isValidId(projectId)) return res.status(400).json({ message: 'ID de proyecto no válido.' })
  const project = await getProject(projectId)
  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' })
  if (!canView(req, project)) return res.status(403).json({ message: 'No tenés permisos para acceder a estas fuentes.' })

  const sources = await (prisma as any).projectSource.findMany({
    where: { projectId },
    orderBy: { accessedAt: 'desc' }
  })
  return res.json(sources)
}

export const addProjectUrlSource = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  if (!isValidId(projectId)) return res.status(400).json({ message: 'ID de proyecto no válido.' })
  const project = await getProject(projectId)
  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' })
  if (!canManage(req, project)) return res.status(403).json({ message: 'No tenés permisos para agregar fuentes a este proyecto.' })

  const url = cleanOptionalText(req.body?.url, 1600)
  if (!url) return res.status(400).json({ message: 'URL no válida.' })

  try {
    const analysis = await analyzeUrlSource(url)
    const description = cleanOptionalText(req.body?.description, 800)
    const requestedType = cleanOptionalText(req.body?.sourceType, 100)
    const summary = analysis.description || (analysis.extractedText ? analysis.extractedText.slice(0, 1200) : null)
    const source = await (prisma as any).projectSource.upsert({
      where: { projectId_url: { projectId, url: analysis.url } },
      update: {
        title: analysis.title || new URL(analysis.url).hostname,
        snippet: summary,
        note: description || summary,
        description,
        summary,
        extractedText: analysis.extractedText || null,
        status: analysis.status,
        origin: 'manual_url',
        sourceType: requestedType || analysis.sourceType || 'Recurso web',
        accessedAt: new Date(analysis.accessedAt)
      },
      create: {
        projectId,
        title: analysis.title || new URL(analysis.url).hostname,
        url: analysis.url,
        snippet: summary,
        note: description || summary,
        description,
        summary,
        extractedText: analysis.extractedText || null,
        status: analysis.status,
        origin: 'manual_url',
        sourceType: requestedType || analysis.sourceType || 'Recurso web',
        accessedAt: new Date(analysis.accessedAt)
      }
    })

    return res.status(201).json({ source, analysis, message: sourceMessage(analysis.status) })
  } catch (error: any) {
    if (error instanceof UrlSourceValidationError) {
      return res.status(400).json({ message: error.message || 'URL no válida.' })
    }
    console.error('No se pudo analizar la URL del proyecto.', error)
    return res.status(500).json({ message: 'No se pudo acceder a la fuente.' })
  }
}

export const deleteProjectSource = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  const sourceId = Number(req.params.sourceId)
  if (!isValidId(projectId) || !isValidId(sourceId)) return res.status(400).json({ message: 'ID no válido.' })
  const source = await (prisma as any).projectSource.findFirst({
    where: { id: sourceId, projectId },
    include: { project: { select: { authorId: true, status: true } } }
  })
  if (!source) return res.status(404).json({ message: 'Fuente no encontrada' })
  if (!canManage(req, source.project)) return res.status(403).json({ message: 'No tenés permisos para eliminar esta fuente.' })

  await (prisma as any).projectSource.delete({ where: { id: sourceId } })
  return res.status(204).send()
}
