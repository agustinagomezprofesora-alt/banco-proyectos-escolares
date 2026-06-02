import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { JWT_SECRET } from '../config'

export const registerUser = async (name: string, email: string, password: string) => {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error('Email registrado')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, passwordHash: hashedPassword, role: 'TEACHER' } })
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
}

export const authenticateUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return null
  }

  const valid = await bcrypt.compare(password, (user as any).passwordHash)
  if (!valid) {
    return null
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
}
