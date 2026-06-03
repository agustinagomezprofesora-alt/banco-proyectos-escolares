import fs from 'fs'
import path from 'path'
import os from 'os'
import AdmZip from 'adm-zip'
import { generateBackupZip, resolveDatabasePath } from './backupService'

type RestoreOptions = {
  backendRoot?: string
  disconnectDatabase?: () => Promise<void>
}

export type RestoreResult = {
  preRestoreBackup: string
  metadataWarning?: string
}

const normalizeEntryName = (entryName: string) => entryName.replace(/\\/g, '/')

const isUnsafeEntryName = (entryName: string) => {
  const normalized = normalizeEntryName(entryName)
  const parts = normalized.split('/').filter(Boolean)

  return (
    normalized.startsWith('/') ||
    normalized.startsWith('\\') ||
    /^[a-zA-Z]:[\\/]/.test(entryName) ||
    parts.includes('..')
  )
}

const ensureSafeEntryNames = (entries: AdmZip.IZipEntry[]) => {
  for (const entry of entries) {
    if (isUnsafeEntryName(entry.entryName)) {
      throw new Error('El ZIP contiene rutas inseguras.')
    }
  }
}

const readMetadata = (zip: AdmZip) => {
  const entry = zip.getEntry('metadata.json')
  if (!entry) {
    return { warning: 'El backup no incluye metadata.json.' }
  }

  try {
    const metadata = JSON.parse(entry.getData().toString('utf8'))
    const validApp = metadata?.app === 'Memoria Pedagógica Digital' || metadata?.appName === 'Memoria Pedagógica Digital'
    if (!validApp || !metadata?.generatedAt) {
      throw new Error('metadata inválida')
    }
    return {}
  } catch {
    throw new Error('El metadata.json del backup no es válido.')
  }
}

const findDatabaseEntry = (zip: AdmZip) => {
  const candidates = ['database/dev.db', 'prisma/dev.db', 'dev.db']
  for (const candidate of candidates) {
    const entry = zip.getEntry(candidate)
    if (entry && !entry.isDirectory) return entry
  }
  return null
}

const copyDirectory = async (source: string, target: string) => {
  if (!fs.existsSync(source)) return

  await fs.promises.mkdir(target, { recursive: true })
  const entries = await fs.promises.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath)
      continue
    }

    if (entry.isFile()) {
      await fs.promises.copyFile(sourcePath, targetPath)
    }
  }
}

const replaceDirectory = async (source: string, target: string) => {
  await fs.promises.rm(target, { recursive: true, force: true })
  await fs.promises.mkdir(path.dirname(target), { recursive: true })
  await copyDirectory(source, target)
}

const extractUploadsToTemp = async (zip: AdmZip, targetDir: string) => {
  const uploadEntries = zip.getEntries().filter((entry) => {
    const normalized = normalizeEntryName(entry.entryName)
    return normalized.startsWith('uploads/') && !entry.isDirectory
  })

  if (uploadEntries.length === 0) return false

  for (const entry of uploadEntries) {
    const normalized = normalizeEntryName(entry.entryName)
    const relative = normalized.replace(/^uploads\//, '')
    if (!relative || isUnsafeEntryName(relative)) {
      throw new Error('El ZIP contiene archivos de uploads con rutas inseguras.')
    }

    const destination = path.resolve(targetDir, relative)
    const resolvedTarget = path.resolve(targetDir)
    if (!destination.startsWith(`${resolvedTarget}${path.sep}`)) {
      throw new Error('El ZIP intenta escribir fuera de uploads.')
    }

    await fs.promises.mkdir(path.dirname(destination), { recursive: true })
    await fs.promises.writeFile(destination, entry.getData())
  }

  return true
}

export const restoreBackupZip = async (zipPath: string, options: RestoreOptions = {}): Promise<RestoreResult> => {
  const backendRoot = options.backendRoot ?? process.cwd()
  const databasePath = resolveDatabasePath(backendRoot)
  const uploadsDir = path.join(backendRoot, 'uploads')
  const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'memoria-restore-'))

  try {
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()
    ensureSafeEntryNames(entries)

    const databaseEntry = findDatabaseEntry(zip)
    if (!databaseEntry) {
      throw new Error('El backup no contiene una base de datos válida.')
    }

    const { warning } = readMetadata(zip)
    const preRestore = await generateBackupZip({
      backendRoot,
      saveToBackupsDir: true,
      fileNamePrefix: 'pre-restore'
    })

    if (!preRestore.filePath) {
      throw new Error('No se pudo generar backup previo. Restauración cancelada.')
    }

    const nextDatabasePath = path.join(tempRoot, 'next-dev.db')
    const currentDatabaseCopy = path.join(tempRoot, 'current-dev.db')
    const nextUploadsDir = path.join(tempRoot, 'uploads-next')
    const currentUploadsDir = path.join(tempRoot, 'uploads-current')
    const hasUploads = await extractUploadsToTemp(zip, nextUploadsDir)

    await fs.promises.writeFile(nextDatabasePath, databaseEntry.getData())
    await fs.promises.copyFile(databasePath, currentDatabaseCopy)
    if (fs.existsSync(uploadsDir)) {
      await copyDirectory(uploadsDir, currentUploadsDir)
    }

    try {
      if (options.disconnectDatabase) {
        await options.disconnectDatabase()
      }

      await fs.promises.copyFile(nextDatabasePath, databasePath)

      if (hasUploads) {
        await replaceDirectory(nextUploadsDir, uploadsDir)
      }
    } catch (error) {
      try {
        if (fs.existsSync(currentDatabaseCopy)) {
          await fs.promises.copyFile(currentDatabaseCopy, databasePath)
        }
        if (hasUploads) {
          if (fs.existsSync(currentUploadsDir)) {
            await replaceDirectory(currentUploadsDir, uploadsDir)
          } else {
            await fs.promises.rm(uploadsDir, { recursive: true, force: true })
          }
        }
      } catch {
        // El error original es más útil para el usuario.
      }

      throw error
    }

    return {
      preRestoreBackup: path.basename(preRestore.filePath),
      metadataWarning: warning
    }
  } finally {
    await fs.promises.rm(tempRoot, { recursive: true, force: true })
  }
}
