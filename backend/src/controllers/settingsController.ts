import { Response } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middlewares/authMiddleware'

const defaultSettings = {
  institutionName: 'Escuela / Institución',
  appName: 'Memoria Pedagógica Digital',
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  contactEmail: null,
  footerText: 'Ficha generada por Memoria Pedagógica Digital',
  allowPublicBank: false
}

const editableFields = [
  'institutionName',
  'appName',
  'logoUrl',
  'primaryColor',
  'secondaryColor',
  'contactEmail',
  'footerText',
  'allowPublicBank'
] as const

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const normalizeColor = (value: unknown) => {
  const color = normalizeString(value)
  if (!color) return null
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : undefined
}

const normalizeEmail = (value: unknown) => {
  const email = normalizeString(value)
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined
}

const normalizeUrl = (value: unknown) => {
  const url = normalizeString(value)
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined
    return parsed.toString()
  } catch {
    return undefined
  }
}

export const getInstitutionSettings = async (_req: AuthRequest, res: Response) => {
  const settings = await (prisma as any).institutionSettings.findFirst({ orderBy: { id: 'asc' } })
  return res.json(settings ?? defaultSettings)
}

export const updateInstitutionSettings = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Solo administradores pueden modificar esta sección.' })
  }

  const data: Record<string, any> = {}

  for (const field of editableFields) {
    if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue

    if (field === 'allowPublicBank') {
      data[field] = Boolean(req.body[field])
      continue
    }

    if (field === 'primaryColor' || field === 'secondaryColor') {
      const color = normalizeColor(req.body[field])
      if (color === undefined) return res.status(400).json({ message: 'Ingresá un color válido.' })
      data[field] = color
      continue
    }

    if (field === 'contactEmail') {
      const email = normalizeEmail(req.body[field])
      if (email === undefined) return res.status(400).json({ message: 'Ingresá un email válido.' })
      data[field] = email
      continue
    }

    if (field === 'logoUrl') {
      const url = normalizeUrl(req.body[field])
      if (url === undefined) return res.status(400).json({ message: 'Ingresá una URL de logo válida.' })
      data[field] = url
      continue
    }

    data[field] = normalizeString(req.body[field])
  }

  if (Object.prototype.hasOwnProperty.call(data, 'institutionName') && !data.institutionName) {
    data.institutionName = defaultSettings.institutionName
  }
  if (Object.prototype.hasOwnProperty.call(data, 'appName') && !data.appName) {
    data.appName = defaultSettings.appName
  }

  const existing = await (prisma as any).institutionSettings.findFirst({ orderBy: { id: 'asc' } })
  const settings = existing
    ? await (prisma as any).institutionSettings.update({ where: { id: existing.id }, data })
    : await (prisma as any).institutionSettings.create({ data: { ...defaultSettings, ...data } })

  return res.json(settings)
}
