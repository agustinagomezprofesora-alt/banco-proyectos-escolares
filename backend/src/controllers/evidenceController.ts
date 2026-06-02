import { Response } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middlewares/authMiddleware'
import { removeUploadedFile } from '../services/uploadService'

const isAdmin = (req: AuthRequest) => req.user?.role === 'ADMIN'

const canViewEvidence = (req: AuthRequest, project: { authorId: number; status: string }) =>
  isAdmin(req) || req.user?.id === project.authorId || project.status === 'Publicado'

const canManageEvidence = (req: AuthRequest, project: { authorId: number; status: string }) =>
  isAdmin(req) || (req.user?.id === project.authorId && project.status !== 'Archivado')

const getProjectForEvidence = async (id: number) => {
  return prisma.project.findUnique({
    where: { id },
    select: { id: true, authorId: true, status: true }
  })
}

const parseUrl = (url: unknown) => {
  if (typeof url !== 'string') return null

  try {
    const parsed = new URL(url.trim())
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

export const listProjectLinks = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  const project = await getProjectForEvidence(projectId)

  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' })
  if (!canViewEvidence(req, project)) {
    return res.status(403).json({ message: 'No tenés permisos para acceder a esta sección.' })
  }

  const links = await (prisma as any).projectLink.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(links)
}

export const createProjectLink = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  const project = await getProjectForEvidence(projectId)

  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' })
  if (!canManageEvidence(req, project)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  const label = typeof req.body.label === 'string' ? req.body.label.trim() : ''
  const url = parseUrl(req.body.url)

  if (!label) return res.status(400).json({ message: 'La etiqueta es obligatoria.' })
  if (!url) return res.status(400).json({ message: 'Ingresá una URL válida.' })

  const link = await (prisma as any).projectLink.create({
    data: { projectId, label, url }
  })

  return res.status(201).json(link)
}

export const deleteProjectLink = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const link = await (prisma as any).projectLink.findUnique({
    where: { id },
    include: { project: { select: { id: true, authorId: true, status: true } } }
  })

  if (!link) return res.status(404).json({ message: 'Link no encontrado' })
  if (!canManageEvidence(req, link.project)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  await (prisma as any).projectLink.delete({ where: { id } })
  return res.status(204).send()
}

export const listProjectFiles = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  const project = await getProjectForEvidence(projectId)

  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' })
  if (!canViewEvidence(req, project)) {
    return res.status(403).json({ message: 'No tenés permisos para acceder a esta sección.' })
  }

  const files = await (prisma as any).projectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  })

  return res.json(files)
}

export const uploadProjectFile = async (req: AuthRequest, res: Response) => {
  const projectId = Number(req.params.id)
  const project = await getProjectForEvidence(projectId)

  if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' })
  if (!canManageEvidence(req, project)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  if (!req.file) return res.status(400).json({ message: 'Seleccioná un archivo para subir.' })

  const file = await (prisma as any).projectFile.create({
    data: {
      projectId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    }
  })

  return res.status(201).json(file)
}

export const deleteProjectFile = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const file = await (prisma as any).projectFile.findUnique({
    where: { id },
    include: { project: { select: { id: true, authorId: true, status: true } } }
  })

  if (!file) return res.status(404).json({ message: 'Archivo no encontrado' })
  if (!canManageEvidence(req, file.project)) {
    return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })
  }

  await (prisma as any).projectFile.delete({ where: { id } })
  await removeUploadedFile(file.storedName)

  return res.status(204).send()
}
