import { Router } from 'express'
import { getPublishedProjects, getPublishedProject } from '../controllers/projectController'

const router = Router()

router.get('/', getPublishedProjects)
router.get('/:id', getPublishedProject)

export default router
