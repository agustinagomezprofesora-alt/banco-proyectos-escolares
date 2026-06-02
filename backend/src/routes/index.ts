import { Router } from 'express'
import authRoutes from './authRoutes'
import projectRoutes from './projectRoutes'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()

router.use('/auth', authRoutes)
router.use('/projects', authMiddleware, projectRoutes)

export default router
