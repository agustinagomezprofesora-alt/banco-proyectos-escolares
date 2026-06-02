import { Router } from 'express'
import { deleteProjectFile, deleteProjectLink } from '../controllers/evidenceController'

const router = Router()

router.delete('/links/:id', deleteProjectLink)
router.delete('/files/:id', deleteProjectFile)

export default router
