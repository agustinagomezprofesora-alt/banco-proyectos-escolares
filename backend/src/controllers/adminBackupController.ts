import fs from 'fs'
import { Response } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middlewares/authMiddleware'
import { generateBackupZip } from '../services/backupService'
import { restoreBackupZip } from '../services/restoreService'

export const downloadSystemBackup = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'No tenés permisos para acceder a esta sección.' })
  }

  try {
    const settings = await (prisma as any).institutionSettings.findFirst({ orderBy: { id: 'asc' } })
    const backup = await generateBackupZip({ appName: settings?.appName })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${backup.fileName}"`)
    res.setHeader('Content-Length', backup.buffer.length)
    return res.send(backup.buffer)
  } catch (error: any) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('No se encontró la base de datos')) {
      return res.status(500).json({ message: 'No se encontró la base de datos para respaldar.' })
    }

    return res.status(500).json({ message: 'No se pudo generar el backup.' })
  }
}

export const restoreSystemBackup = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'No tenés permisos para acceder a esta sección.' })
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Seleccioná un archivo .zip de backup.' })
  }

  try {
    const result = await restoreBackupZip(req.file.path, {
      disconnectDatabase: () => prisma.$disconnect()
    })

    return res.json({
      message: 'Restauración completada correctamente. Reiniciá el servidor para aplicar completamente los cambios.',
      preRestoreBackup: result.preRestoreBackup,
      warning: result.metadataWarning
    })
  } catch (error: any) {
    const message = error instanceof Error ? error.message : ''

    if (message.includes('No se pudo generar backup previo')) {
      return res.status(500).json({ message: 'No se pudo generar backup previo. Restauración cancelada.' })
    }

    if (
      message.includes('base de datos') ||
      message.includes('rutas inseguras') ||
      message.includes('metadata') ||
      message.includes('ZIP')
    ) {
      return res.status(400).json({ message })
    }

    return res.status(500).json({ message: 'No se pudo restaurar el backup.' })
  } finally {
    if (req.file?.path) {
      await fs.promises.rm(req.file.path, { force: true }).catch(() => undefined)
    }
  }
}
