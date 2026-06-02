import { Router } from 'express'
import { listProjects, getProject, createProject, updateProject, deleteProject, generateFicha, submitForReview, getPublishedProjects, getPublishedProject, duplicateProject, publishProject, archiveProject } from '../controllers/projectController'

const router = Router()

router.get('/published', getPublishedProjects)
router.get('/published/:id', getPublishedProject)
router.get('/', listProjects)
router.get('/:id', getProject)
router.post('/', createProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)
router.post('/:id/generate', generateFicha)
router.post('/:id/submit-review', submitForReview)
router.post('/:id/publish', publishProject)
router.post('/:id/archive', archiveProject)
router.post('/:id/duplicate', duplicateProject)

export default router
