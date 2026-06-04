import { Router } from 'express'
import { listProjects, getProject, createProject, updateProject, deleteProject, generateFicha, enrichProjectContext, generateActivities, generateGames, generatePresentation, submitForReview, getPublishedProjects, getPublishedProject, duplicateProject, publishProject, archiveProject, downloadProjectPdf, downloadProjectPptx } from '../controllers/projectController'
import { createProjectLink, listProjectFiles, listProjectLinks, uploadProjectFile } from '../controllers/evidenceController'
import { uploadProjectFile as uploadProjectFileMiddleware } from '../services/uploadService'

const router = Router()

const uploadSingleProjectFile = (req: any, res: any, next: any) => {
  uploadProjectFileMiddleware.single('file')(req, res, (error: any) => {
    if (!error) return next()

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo no puede superar los 10 MB.' })
    }

    return res.status(400).json({ message: error.message || 'No se pudo subir el archivo.' })
  })
}

router.get('/published', getPublishedProjects)
router.get('/published/:id', getPublishedProject)
router.get('/', listProjects)
router.get('/:id/pdf', downloadProjectPdf)
router.get('/:id/pptx', downloadProjectPptx)
router.get('/:id/links', listProjectLinks)
router.post('/:id/links', createProjectLink)
router.get('/:id/files', listProjectFiles)
router.post('/:id/files', uploadSingleProjectFile, uploadProjectFile)
router.get('/:id', getProject)
router.post('/', createProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)
router.post('/:id/generate', generateFicha)
router.post('/:id/enrich-context', enrichProjectContext)
router.post('/:id/generate-activities', generateActivities)
router.post('/:id/generate-games', generateGames)
router.post('/:id/generate-presentation', generatePresentation)
router.post('/:id/submit-review', submitForReview)
router.post('/:id/publish', publishProject)
router.post('/:id/archive', archiveProject)
router.post('/:id/duplicate', duplicateProject)

export default router
