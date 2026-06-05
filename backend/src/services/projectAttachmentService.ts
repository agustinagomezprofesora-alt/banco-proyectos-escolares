import path from 'path'
import { uploadsDir } from './uploadService'

export type ProjectAttachment = {
  id?: number
  projectId?: number
  originalName: string
  storedName?: string | null
  mimeType?: string | null
  size?: number | null
  url?: string | null
  createdAt?: Date | string | null
  description?: string | null
}

export type ProjectAttachmentsByType = {
  images: ProjectAttachment[]
  pdfs: ProjectAttachment[]
  documents: ProjectAttachment[]
  others: ProjectAttachment[]
}

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const documentExtensions = new Set(['.doc', '.docx', '.ppt', '.pptx', '.txt', '.xls', '.xlsx'])

const attachmentExtension = (attachment: ProjectAttachment) =>
  path.extname(attachment.originalName || attachment.storedName || attachment.url || '').toLowerCase()

export const getProjectAttachmentsByType = (project: { files?: ProjectAttachment[] | null }): ProjectAttachmentsByType => {
  const result: ProjectAttachmentsByType = { images: [], pdfs: [], documents: [], others: [] }
  const seen = new Set<string>()

  for (const attachment of project.files ?? []) {
    const identity = attachment.storedName || attachment.url || `${attachment.id ?? ''}:${attachment.originalName}`
    if (seen.has(identity)) continue
    seen.add(identity)

    const mimeType = String(attachment.mimeType ?? '').toLowerCase()
    const extension = attachmentExtension(attachment)

    if (mimeType.startsWith('image/') || imageExtensions.has(extension)) {
      result.images.push(attachment)
    } else if (mimeType === 'application/pdf' || extension === '.pdf') {
      result.pdfs.push(attachment)
    } else if (documentExtensions.has(extension) || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint') || mimeType.startsWith('text/')) {
      result.documents.push(attachment)
    } else {
      result.others.push(attachment)
    }
  }

  return result
}

export const resolveProjectAttachmentPath = (attachment: ProjectAttachment) => {
  const storedName = attachment.storedName?.trim()
  if (!storedName || path.basename(storedName) !== storedName) return null

  const resolvedUploadsDir = path.resolve(uploadsDir)
  const resolvedPath = path.resolve(uploadsDir, storedName)
  if (!resolvedPath.startsWith(`${resolvedUploadsDir}${path.sep}`)) return null

  return resolvedPath
}
