import { Response } from 'express'
import { prisma } from '../config/prisma'
import { projectSchema } from '../validators/projectValidator'
import { AuthRequest } from '../middlewares/authMiddleware'
import { generateProjectFicha } from '../services/aiService'

export const listProjects = async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, email: true } } }
  })
  return res.json(projects)
}

export const getProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id }, include: { author: true } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }
  return res.json(project)
}

export const createProject = async (req: AuthRequest, res: Response) => {
  const parseResult = projectSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors })
  }

  const data = parseResult.data
  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      teacher: data.teacher,
      course: data.course,
      area: data.area,
      experienceType: data.experienceType,
      link: data.link || null,
      isReusable: data.isReusable ?? false,
      status: data.status ?? 'Cargado',
      authorId: req.user!.id
    }
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

  if (project.authorId !== req.user!.id) {
    return res.status(403).json({ message: 'No tienes permiso para editar este proyecto' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title: parseResult.data.title ?? project.title,
      description: parseResult.data.description ?? project.description,
      teacher: parseResult.data.teacher ?? project.teacher,
      course: parseResult.data.course ?? project.course,
      area: parseResult.data.area ?? project.area,
      experienceType: parseResult.data.experienceType ?? project.experienceType,
      link: parseResult.data.link ?? project.link,
      isReusable: parseResult.data.isReusable ?? project.isReusable,
      status: parseResult.data.status ?? project.status
    }
  })

  return res.json(updated)
}

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (project.authorId !== req.user!.id) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar este proyecto' })
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

  if (project.authorId !== req.user!.id) {
    return res.status(403).json({ message: 'No tienes permiso para generar ficha de este proyecto' })
  }

  try {
    const ficha = await generateProjectFicha({
      title: project.title,
      description: project.description,
      teacher: project.teacher,
      course: project.course,
      area: project.area,
      experienceType: project.experienceType,
      link: project.link,
      isReusable: project.isReusable
    })

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...ficha,
        status: 'Borrador generado'
      }
    })

    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: 'Error generando ficha' })
  }
}

export const submitForReview = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id)
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return res.status(404).json({ message: 'Proyecto no encontrado' })
  }

  if (project.authorId !== req.user!.id) {
    return res.status(403).json({ message: 'No tienes permiso para enviar este proyecto' })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status: 'En revisión' }
  })

  return res.json(updated)
}
