import { Router } from 'express'
import { listProjects, getProject, createProject, updateProject, deleteProject, generateFicha, submitForReview } from '../controllers/projectController'

const router = Router()

router.get('/', listProjects)
router.get('/:id', getProject)
router.post('/', createProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)
router.post('/:id/generate', generateFicha)
router.post('/:id/submit-review', submitForReview)

export default router
