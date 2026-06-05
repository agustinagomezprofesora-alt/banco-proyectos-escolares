import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import {
  getProjectAttachmentsByType,
  ProjectAttachment,
  resolveProjectAttachmentPath
} from './projectAttachmentService'

const PDFDocument = require('pdfkit')

type PdfProject = {
  id: number
  title: string
  improvedTitle?: string | null
  description?: string | null
  generatedSummary?: string | null
  teacher?: string | null
  course?: string | null
  educationalLevel?: string | null
  educationalCycle?: string | null
  activityOrientation?: string | null
  area?: string | null
  experienceType?: string | null
  link?: string | null
  isReusable?: boolean
  status?: string | null
  createdAt?: Date | string
  objectives?: string | null
  mainActivities?: string | null
  resourcesUsed?: string | null
  finalProducts?: string | null
  evidenceDescription?: string | null
  reuseSuggestions?: string | null
  improvementSuggestions?: string | null
  suggestedTags?: string | null
  introActivities?: string | null
  developmentActivities?: string | null
  closingActivities?: string | null
  assessmentCriteria?: string | null
  rubric?: string | null
  interdisciplinarySuggestions?: string | null
  adaptations?: string | null
  requiredResources?: string | null
  estimatedTimeline?: string | null
  studentReflectionQuestions?: string | null
  quizQuestions?: string | null
  trueFalse?: string | null
  multipleChoice?: string | null
  wordSearch?: string | null
  crossword?: string | null
  memoryGame?: string | null
  bingoConcepts?: string | null
  challengeCards?: string | null
  rolePlayingGame?: string | null
  reflectionGame?: string | null
  presentationTitle?: string | null
  presentationSubtitle?: string | null
  slides?: string | null
  oralScript?: string | null
  visualSuggestions?: string | null
  closingMessage?: string | null
  links?: Array<{ label: string; url: string }>
  files?: ProjectAttachment[]
  sources?: Array<{ title: string; url: string; summary?: string | null; description?: string | null; snippet?: string | null; note?: string | null; accessedAt: Date | string }>
}

type PdfSettings = {
  institutionName?: string | null
  appName?: string | null
  footerText?: string | null
}

const defaultPdfSettings = {
  institutionName: 'Escuela / Institución',
  appName: 'Memoria Pedagógica Digital',
  footerText: 'Ficha generada por Memoria Pedagógica Digital'
}

function hasValue(input: unknown) {
  if (input === null || input === undefined) return false
  if (input instanceof Date) return !Number.isNaN(input.getTime())
  if (typeof input === 'object') return false

  const text = String(input).trim()
  return text !== '' && text !== 'undefined' && text !== 'null' && text !== 'NaN'
}

const formatValue = (input: unknown) => {
  if (!hasValue(input)) return 'No especificado'
  if (input instanceof Date) return input.toLocaleDateString('es-AR')
  if (typeof input === 'boolean') return input ? 'Sí' : 'No'
  return String(input).trim()
}

const formatDate = (input: unknown) => {
  if (!hasValue(input)) return 'No especificado'

  const date = input instanceof Date ? input : new Date(String(input))
  if (Number.isNaN(date.getTime())) return 'No especificado'

  return date.toLocaleDateString('es-AR')
}

const activityOrientationLabel = (value: unknown) => {
  if (value === 'practical') return 'Práctica'
  if (value === 'theoretical') return 'Teórica'
  if (value === 'mixed') return 'Mixta'
  return ''
}

const safeText = (input: unknown) => formatValue(input).replace(/\s+/g, ' ').trim()

const formatEvidenceList = (items: string[]) => items.filter((item) => item.trim() !== '').join('\n')

const formatFileSize = (size: unknown) => {
  const bytes = Number(size)
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const attachmentTypeLabel = (attachment: ProjectAttachment) => {
  const extension = path.extname(attachment.originalName).replace('.', '').toUpperCase()
  if (extension) return extension
  if (attachment.mimeType) return attachment.mimeType
  return 'Archivo'
}

const pageContentBottom = (doc: any) => doc.page.height - doc.page.margins.bottom - 30

const ensureSpace = (doc: any, requiredHeight: number) => {
  if (doc.y + requiredHeight > pageContentBottom(doc)) doc.addPage()
}

const addVisualSectionTitle = (doc: any, title: string, width: number, requiredHeight = 50) => {
  ensureSpace(doc, requiredHeight)
  doc
    .moveDown(0.8)
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#0f172a')
    .text(title, { width })
  doc.moveDown(0.45)
}

type PreparedImageAttachment = {
  attachment: ProjectAttachment
  image: Buffer
}

const prepareImageAttachments = async (attachments: ProjectAttachment[]): Promise<PreparedImageAttachment[]> => {
  const prepared: PreparedImageAttachment[] = []

  for (const attachment of attachments) {
    const filePath = resolveProjectAttachmentPath(attachment)
    if (!filePath) {
      console.warn(`No se pudo resolver la ruta de la imagen adjunta: ${attachment.originalName}`)
      continue
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
      const image = await sharp(filePath)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer()
      prepared.push({ attachment, image })
    } catch (error) {
      console.warn(`No se pudo incorporar la imagen adjunta "${attachment.originalName}" al PDF.`, error)
    }
  }

  return prepared
}

const addImageGallery = (doc: any, images: PreparedImageAttachment[], contentWidth: number) => {
  if (images.length === 0) return

  addVisualSectionTitle(doc, 'Galería de evidencias', contentWidth, 250)

  const gap = 12
  const cellWidth = (contentWidth - gap) / 2
  const imageHeight = 155
  const captionHeight = 34
  const cellHeight = imageHeight + captionHeight + 18

  for (let index = 0; index < images.length; index += 2) {
    ensureSpace(doc, cellHeight + 8)
    const rowY = doc.y
    const row = images.slice(index, index + 2)

    row.forEach(({ attachment, image }, column) => {
      const x = doc.page.margins.left + column * (cellWidth + gap)

      doc
        .roundedRect(x, rowY, cellWidth, cellHeight, 8)
        .fillAndStroke('#f8fafc', '#dbe4ee')

      try {
        doc.image(image, x + 9, rowY + 9, {
          fit: [cellWidth - 18, imageHeight],
          align: 'center',
          valign: 'center'
        })
      } catch (error) {
        console.warn(`No se pudo dibujar la imagen adjunta "${attachment.originalName}" en el PDF.`, error)
      }

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#475569')
        .text(attachment.description || attachment.originalName, x + 9, rowY + imageHeight + 14, {
          width: cellWidth - 18,
          height: captionHeight,
          align: 'center',
          ellipsis: true
        })
    })

    doc.y = rowY + cellHeight + 8
  }
}

const addDocumentCards = (doc: any, attachments: ProjectAttachment[], contentWidth: number) => {
  if (attachments.length === 0) return

  addVisualSectionTitle(doc, 'Documentos adjuntos', contentWidth, 120)
  const left = doc.page.margins.left

  attachments.forEach((attachment) => {
    const cardHeight = attachment.description ? 78 : 62
    ensureSpace(doc, cardHeight + 9)
    const top = doc.y
    const metadata = [
      `Tipo: ${attachmentTypeLabel(attachment)}`,
      formatFileSize(attachment.size),
      attachment.createdAt ? `Adjuntado el ${formatDate(attachment.createdAt)}` : ''
    ].filter(Boolean).join(' · ')

    doc
      .roundedRect(left, top, contentWidth, cardHeight, 8)
      .fillAndStroke('#f8fafc', '#dbe4ee')
    doc
      .roundedRect(left + 10, top + 11, 42, 40, 6)
      .fill('#e2e8f0')
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#334155')
      .text(attachmentTypeLabel(attachment).slice(0, 5), left + 10, top + 27, {
        width: 42,
        align: 'center',
        lineBreak: false
      })
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(attachment.originalName, left + 64, top + 11, {
        width: contentWidth - 76,
        ellipsis: true,
        lineBreak: false
      })
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#64748b')
      .text(metadata, left + 64, top + 29, {
        width: contentWidth - 76,
        ellipsis: true,
        lineBreak: false
      })

    if (attachment.description) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#475569')
        .text(attachment.description, left + 64, top + 45, {
          width: contentWidth - 76,
          height: 24,
          ellipsis: true
        })
    }

    doc.y = top + cardHeight + 9
  })
}

const addLabel = (doc: any, label: string, content: unknown, width: number) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#0f172a')
    .text(`${label}: `, { continued: true, width })
  doc
    .font('Helvetica')
    .fillColor('#334155')
    .text(formatValue(content), { width })
}

const addSection = (doc: any, title: string, content: unknown, width: number) => {
  if (!hasValue(content)) return

  doc.moveDown(0.7)
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#0f172a')
    .text(title, { width })
  doc
    .moveDown(0.25)
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#334155')
    .text(formatValue(content), { width, align: 'left', lineGap: 3 })
}

export const generateProjectPdf = async (project: PdfProject, settings?: PdfSettings | null): Promise<Buffer> => {
  const attachments = getProjectAttachmentsByType(project)
  const preparedImages = await prepareImageAttachments(attachments.images)
  const documentAttachments = [...attachments.pdfs, ...attachments.documents, ...attachments.others]

  return new Promise((resolve, reject) => {
    const pdfSettings = {
      institutionName: settings?.institutionName || defaultPdfSettings.institutionName,
      appName: settings?.appName || defaultPdfSettings.appName,
      footerText: settings?.footerText || defaultPdfSettings.footerText
    }

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Ficha proyecto ${project.id}`,
        Author: pdfSettings.appName,
        Subject: safeText(project.title)
      }
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const left = doc.page.margins.left
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const right = doc.page.width - doc.page.margins.right

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#0f172a')
      .text(pdfSettings.appName, { width: contentWidth })
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text(pdfSettings.institutionName, { width: contentWidth })
      .text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`, { width: contentWidth })

    doc.moveDown(0.8)
    doc
      .strokeColor('#cbd5e1')
      .lineWidth(1)
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke()

    doc.moveDown(1)
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#111827')
      .text(formatValue(project.improvedTitle || project.title), { width: contentWidth, lineGap: 4 })

    if (hasValue(project.improvedTitle)) {
      doc
        .moveDown(0.2)
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor('#475569')
        .text(`Título original: ${formatValue(project.title)}`, { width: contentWidth })
    }

    doc.moveDown(1)
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#0f172a')
      .text('Datos principales', { width: contentWidth })
    doc.moveDown(0.35)

    addLabel(doc, 'Docente/s responsable/s', project.teacher, contentWidth)
    addLabel(doc, 'Curso', project.course, contentWidth)
    addLabel(doc, 'Nivel educativo', project.educationalLevel, contentWidth)
    addLabel(doc, 'Ciclo educativo', project.educationalCycle, contentWidth)
    if (hasValue(project.activityOrientation)) {
      addLabel(doc, 'Orientación de actividades', activityOrientationLabel(project.activityOrientation), contentWidth)
    }
    addLabel(doc, 'Área', project.area, contentWidth)
    addLabel(doc, 'Tipo de experiencia', project.experienceType, contentWidth)
    addLabel(doc, 'Estado', project.status, contentWidth)
    addLabel(doc, 'Reutilizable', project.isReusable ? 'Sí' : 'No', contentWidth)
    addLabel(doc, 'Fecha de creación', formatDate(project.createdAt), contentWidth)

    const sections: Array<[string, unknown]> = [
      ['Descripción', project.description],
      ['Resumen generado', project.generatedSummary],
      ['Objetivos', project.objectives],
      ['Actividades principales', project.mainActivities],
      ['Recursos utilizados', project.resourcesUsed],
      ['Producciónes finales', project.finalProducts],
      ['Evidencias', project.evidenceDescription],
      ['Link asociado', project.link],
      ['Sugerencias de reutilización', project.reuseSuggestions],
      ['Recomendaciones de mejora', project.improvementSuggestions],
      ['Etiquetas sugeridas', project.suggestedTags]
    ]
    const visibleSections = sections.filter(([, content]) => hasValue(content))
    const hasVisualAttachments = preparedImages.length > 0 || documentAttachments.length > 0

    if (visibleSections.length > 0) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Ficha institucional', { width: contentWidth })

      if (hasVisualAttachments) {
        const insertionIndex = visibleSections.findIndex(([title]) =>
          ['Sugerencias de reutilización', 'Recomendaciones de mejora', 'Etiquetas sugeridas'].includes(title)
        )
        const sectionsBeforeAttachments = insertionIndex >= 0 ? visibleSections.slice(0, insertionIndex) : visibleSections
        const sectionsAfterAttachments = insertionIndex >= 0 ? visibleSections.slice(insertionIndex) : []

        sectionsBeforeAttachments.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
        addImageGallery(doc, preparedImages, contentWidth)
        addDocumentCards(doc, documentAttachments, contentWidth)
        sectionsAfterAttachments.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
      } else {
        visibleSections.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
      }
    } else {
      addImageGallery(doc, preparedImages, contentWidth)
      addDocumentCards(doc, documentAttachments, contentWidth)
    }

    const activitySections: Array<[string, unknown]> = [
      ['Actividades de inicio', project.introActivities],
      ['Actividades de desarrollo', project.developmentActivities],
      ['Actividades de cierre', project.closingActivities],
      ['Criterios de evaluación', project.assessmentCriteria],
      ['Rúbrica', project.rubric],
      ['Sugerencias interdisciplinarias', project.interdisciplinarySuggestions],
      ['Adecuaciones', project.adaptations],
      ['Recursos necesarios', project.requiredResources],
      ['Cronograma estimado', project.estimatedTimeline],
      ['Preguntas de reflexión', project.studentReflectionQuestions]
    ]
    const visibleActivitySections = activitySections.filter(([, content]) => hasValue(content))

    if (visibleActivitySections.length > 0) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Actividades pedagógicas', { width: contentWidth })

      visibleActivitySections.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
    }

    const gameSections: Array<[string, unknown]> = [
      ['Quiz', project.quizQuestions],
      ['Verdadero/Falso', project.trueFalse],
      ['Opción múltiple', project.multipleChoice],
      ['Sopa de letras', project.wordSearch],
      ['Crucigrama', project.crossword],
      ['Memotest', project.memoryGame],
      ['Bingo', project.bingoConcepts],
      ['Tarjetas desafío', project.challengeCards],
      ['Juego de roles', project.rolePlayingGame],
      ['Reflexión', project.reflectionGame]
    ]
    const visibleGameSections = gameSections.filter(([, content]) => hasValue(content))

    if (visibleGameSections.length > 0) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Juegos educativos', { width: contentWidth })

      visibleGameSections.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
    }

    const presentationSections: Array<[string, unknown]> = [
      ['Título de la presentación', project.presentationTitle],
      ['Subtítulo', project.presentationSubtitle],
      ['Estructura de diapositivas', project.slides],
      ['Guión oral', project.oralScript],
      ['Sugerencias visuales', project.visualSuggestions],
      ['Cierre final', project.closingMessage]
    ]
    const visiblePresentationSections = presentationSections.filter(([, content]) => hasValue(content))

    if (visiblePresentationSections.length > 0) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Presentación del proyecto', { width: contentWidth })

      visiblePresentationSections.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
    }

    const evidenceItems = [
      ...(project.links ?? []).map((link) => `${link.label}: ${link.url}`),
      ...(project.files ?? []).map((file) => `${file.originalName}${file.url ? ` - ${file.url}` : ''}`)
    ]
    const evidenceText = formatEvidenceList(evidenceItems)

    if (hasValue(evidenceText)) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Evidencias y recursos', { width: contentWidth })
      addSection(doc, 'Links y archivos adjuntos', evidenceText, contentWidth)
    }

    const sourceItems = (project.sources ?? [])
      .filter((source) => hasValue(source.title) && hasValue(source.url))
      .map((source) => {
        const summary = source.description || source.summary || source.note || source.snippet
        return `${source.title}${hasValue(summary) ? `\n${summary}` : ''}\n${source.url}\nConsultado el ${formatDate(source.accessedAt)}`
      })
    const sourcesText = formatEvidenceList(sourceItems)

    if (hasValue(sourcesText)) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Fuentes consultadas', { width: contentWidth })
      addSection(doc, 'Fuentes educativas utilizadas', sourcesText, contentWidth)
    }

    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i)

      const pageNumber = i - range.start + 1
      const totalPages = range.count
      const footerY = doc.page.height - doc.page.margins.bottom - 12
      const footerLeft = doc.page.margins.left
      const footerWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666')
        .text(pdfSettings.footerText, footerLeft, footerY, {
          width: footerWidth,
          align: 'left',
          lineBreak: false
        })

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666')
        .text(`Página ${pageNumber} de ${totalPages}`, footerLeft, footerY, {
          width: footerWidth,
          align: 'right',
          lineBreak: false
        })
    }

    doc.end()
  })
}
