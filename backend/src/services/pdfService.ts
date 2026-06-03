const PDFDocument = require('pdfkit')

type PdfProject = {
  id: number
  title: string
  improvedTitle?: string | null
  description?: string | null
  generatedSummary?: string | null
  teacher?: string | null
  course?: string | null
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
  files?: Array<{ originalName: string; url?: string | null }>
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

const safeText = (input: unknown) => formatValue(input).replace(/\s+/g, ' ').trim()

const formatEvidenceList = (items: string[]) => items.filter((item) => item.trim() !== '').join('\n')

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
      ['Producciones finales', project.finalProducts],
      ['Evidencias', project.evidenceDescription],
      ['Link asociado', project.link],
      ['Sugerencias de reutilización', project.reuseSuggestions],
      ['Recomendaciones de mejora', project.improvementSuggestions],
      ['Etiquetas sugeridas', project.suggestedTags]
    ]
    const visibleSections = sections.filter(([, content]) => hasValue(content))

    if (visibleSections.length > 0) {
      doc.moveDown(0.8)
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#0f172a')
        .text('Ficha institucional', { width: contentWidth })

      visibleSections.forEach(([title, content]) => addSection(doc, title, content, contentWidth))
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
      ['OpciÃ³n mÃºltiple', project.multipleChoice],
      ['Sopa de letras', project.wordSearch],
      ['Crucigrama', project.crossword],
      ['Memotest', project.memoryGame],
      ['Bingo', project.bingoConcepts],
      ['Tarjetas desafÃ­o', project.challengeCards],
      ['Juego de roles', project.rolePlayingGame],
      ['ReflexiÃ³n', project.reflectionGame]
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
      ['TÃ­tulo de la presentaciÃ³n', project.presentationTitle],
      ['SubtÃ­tulo', project.presentationSubtitle],
      ['Estructura de diapositivas', project.slides],
      ['GuiÃ³n oral', project.oralScript],
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
        .text('PresentaciÃ³n del proyecto', { width: contentWidth })

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
