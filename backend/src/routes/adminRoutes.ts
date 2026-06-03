import { Router } from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import multer from 'multer'
import { downloadSystemBackup, restoreSystemBackup } from '../controllers/adminBackupController'

const router = Router()
const restoreTempDir = path.join(os.tmpdir(), 'memoria-backup-restore')
fs.mkdirSync(restoreTempDir, { recursive: true })

const upload = multer({
  dest: restoreTempDir,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.zip') {
      callback(new Error('El archivo debe ser un .zip.'))
      return
    }
    callback(null, true)
  }
})

const uploadBackup = (req: any, res: any, next: any) => {
  upload.single('backup')(req, res, (error: any) => {
    if (!error) return next()

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El backup no puede superar los 200 MB.' })
    }

    return res.status(400).json({ message: error.message || 'No se pudo recibir el archivo.' })
  })
}

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'No tenés permisos para acceder a esta sección.' })
  }
  return next()
}

router.get('/backup/download', requireAdmin, downloadSystemBackup)
router.post('/backup/restore', requireAdmin, uploadBackup, restoreSystemBackup)

export default router
