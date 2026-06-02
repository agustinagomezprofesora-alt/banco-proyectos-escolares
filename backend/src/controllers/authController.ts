import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { JWT_SECRET } from '../config'
import { registerSchema, loginSchema } from '../validators/authValidator'

export const register = async (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors })
  }

  const { name, email, password } = parseResult.data
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return res.status(409).json({ message: 'El email ya está registrado' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      role: 'TEACHER'
    }
  })
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })

  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
}

export const login = async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body)
  if (!parseResult.success) {
    return res.status(400).json({ errors: parseResult.error.errors })
  }

  const { email, password } = parseResult.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ message: 'Email o contraseña incorrectos' })
  }
  const passwordValid = await bcrypt.compare(password, (user as any).passwordHash)
  if (!passwordValid) {
    return res.status(401).json({ message: 'Email o contraseña incorrectos' })
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token })
}

export const getCurrentUser = async (req: any, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' })
  }

  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}
