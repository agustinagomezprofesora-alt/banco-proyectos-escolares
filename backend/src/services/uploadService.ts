import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'

export const uploadsDir = path.join(process.cwd(), 'uploads')

const allowedExtensions = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.mp3',
  '.wav',
  '.m4a',
  '.mp4',
  '.mov',
  '.webm'
])

const blockedExtensions = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.sh',
  '.js',
  '.ts',
  '.html',
  '.php',
  '.jar',
  '.vbs',
  '.msi',
  '.scr'
])

const allowedMimePrefixes = ['image/', 'audio/', 'video/']
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
])

fs.mkdirSync(uploadsDir, { recursive: true })

const sanitizeBaseName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'archivo'

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir)
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const baseName = sanitizeBaseName(path.basename(file.originalname, ext))
    const suffix = crypto.randomBytes(8).toString('hex')
    callback(null, `${Date.now()}-${suffix}-${baseName}${ext}`)
  }
})

export const uploadProjectFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const originalName = file.originalname.replace(/\0/g, '')
    const hasUnsafePath =
      originalName.includes('..') ||
      originalName.includes('/') ||
      originalName.includes('\\') ||
      path.basename(originalName) !== originalName
    const mimeAllowed = allowedMimeTypes.has(file.mimetype) || allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix))

    if (hasUnsafePath || blockedExtensions.has(ext) || !allowedExtensions.has(ext) || !mimeAllowed) {
      callback(new Error('Tipo de archivo no permitido.'))
      return
    }

    callback(null, true)
  }
})

export const removeUploadedFile = async (storedName: string) => {
  const filePath = path.join(uploadsDir, storedName)
  const resolvedPath = path.resolve(filePath)
  const resolvedUploadsDir = path.resolve(uploadsDir)

  if (!resolvedPath.startsWith(`${resolvedUploadsDir}${path.sep}`)) return

  try {
    await fs.promises.unlink(resolvedPath)
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error
  }
}
