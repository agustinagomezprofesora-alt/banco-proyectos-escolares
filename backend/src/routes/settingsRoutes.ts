import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware'
import { getInstitutionSettings, updateInstitutionSettings } from '../controllers/settingsController'

const router = Router()

router.get('/', authMiddleware, getInstitutionSettings)
router.put('/', authMiddleware, updateInstitutionSettings)

export default router
