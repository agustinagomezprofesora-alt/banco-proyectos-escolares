import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config'
import { prisma } from '../config/prisma'

export interface AuthRequest extends Request {
  user?: { id: number; email: string }
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing' })
  }

  const token = authHeader.replace('Bearer ', '').trim()
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = { id: user.id, email: user.email }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
