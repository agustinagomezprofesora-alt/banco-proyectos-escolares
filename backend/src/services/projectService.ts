import { prisma } from '../config/prisma'

const authorSelect = { id: true, name: true, email: true, role: true } as const

export interface ProjectCreateData {
  title: string
  description: string
  teacher: string
  course: string
  educationalLevel?: string | null
  educationalCycle?: string | null
  activityOrientation?: string | null
  area: string
  experienceType: string
  link?: string | null
  isReusable: boolean
  status: string
  authorId: number
}

export interface ProjectUpdateData {
  title?: string
  description?: string
  teacher?: string
  course?: string
  educationalLevel?: string | null
  educationalCycle?: string | null
  activityOrientation?: string | null
  area?: string
  experienceType?: string
  link?: string | null
  isReusable?: boolean
  status?: string
}

export const getProjects = () => {
  return prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: authorSelect } }
  })
}

export const getProjectById = (id: number) => {
  return prisma.project.findUnique({ where: { id }, include: { author: { select: authorSelect } } })
}

export const createProject = (data: ProjectCreateData) => {
  return prisma.project.create({ data })
}

export const updateProject = (id: number, data: ProjectUpdateData) => {
  return prisma.project.update({ where: { id }, data })
}

export const deleteProject = (id: number) => {
  return prisma.project.delete({ where: { id } })
}
