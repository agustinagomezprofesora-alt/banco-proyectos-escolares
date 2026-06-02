import { Router } from 'express'
import authRoutes from './authRoutes'
import projectRoutes from './projectRoutes'
import { authMiddleware } from '../middlewares/authMiddleware'
import { getPublishedProject, getPublishedProjects, getStats } from '../controllers/projectController'

const router = Router()

router.use('/auth', authRoutes)
router.get('/projects/published', getPublishedProjects)
router.get('/projects/published/:id', getPublishedProject)
router.get('/stats', authMiddleware, getStats)
router.use('/projects', authMiddleware, projectRoutes)

export default router
