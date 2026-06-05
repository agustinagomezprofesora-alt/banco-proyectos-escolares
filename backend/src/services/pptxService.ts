const pptxgen = require('pptxgenjs')
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { analyzeProjectPedagogicalFocus, buildProjectLearningContext, type ActivityOrientation } from './aiService'
import { ProjectAttachment, resolveProjectAttachmentPath } from './projectAttachmentService'

type PptxProject = {
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
  objectives?: string | null
  mainActivities?: string | null
  resourcesUsed?: string | null
  finalProducts?: string | null
  evidenceDescription?: string | null
  reuseSuggestions?: string | null
  improvementSuggestions?: string | null
  suggestedTags?: string | null
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
  links?: Array<{ label?: string | null; url?: string | null }>
  files?: ProjectAttachment[]
  sources?: Array<{ title?: string | null; url?: string | null; snippet?: string | null; note?: string | null; description?: string | null; summary?: string | null; status?: string | null; origin?: string | null; sourceType?: string | null; accessedAt?: Date | string | null }>
}

type PptxSettings = {
  institutionName?: string | null
  appName?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  footerText?: string | null
}

type ResolvedPptxSettings = {
  institutionName: string
  appName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  footerText: string
}

type ParsedSlide = {
  title: string
  content: string[]
  visualSuggestion?: string
}

type DeckSlide = {
  title: string
  subtitle?: string
  bullets: string[]
  sideTitle?: string
  sideText?: string
  accent?: string
  type?: 'cover' | 'content' | 'closing'
}

const defaultSettings = {
  institutionName: 'Escuela / Institución',
  appName: 'Memoria Pedagógica Digital',
  primaryColor: '2563EB',
  secondaryColor: '0F172A',
  accentColor: '7C3AED',
  footerText: 'Presentación generada por Memoria Pedagógica Digital'
}

const forbiddenTexts = new Set(['', 'undefined', 'null', 'NaN', '[object Object]'])

const cleanText = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return ''

  const text = String(value)
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  return forbiddenTexts.has(text) ? '' : text
}

const cleanSingleLine = (value: unknown) => cleanText(value).replace(/\s+/g, ' ').trim()

const activityOrientationLabel = (value: unknown) => {
  if (value === 'practical') return 'Orientación de actividades: Práctica'
  if (value === 'theoretical') return 'Orientación de actividades: Teórica'
  if (value === 'mixed') return 'Orientación de actividades: Mixta'
  return ''
}

const normalizeActivityOrientation = (value: unknown): ActivityOrientation | null =>
  value === 'practical' || value === 'theoretical' || value === 'mixed' ? value : null

const normalizeColor = (value: string | null | undefined, fallback: string) => {
  const color = cleanSingleLine(value).replace('#', '')
  return /^[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : fallback
}

const safeJsonParse = <T>(value?: string | null): T | undefined => {
  const text = cleanText(value)
  if (!text) return undefined

  try {
    return JSON.parse(text) as T
  } catch {
    return undefined
  }
}

const splitBlocks = (text: string) =>
  text
    .split(/\n(?=\s*\d+\.)/)
    .map((block) => block.trim())
    .filter(Boolean)

const splitBulletText = (value?: string | null, maxItems = 5) => {
  const parsed = safeJsonParse<unknown>(value)

  if (Array.isArray(parsed)) {
    return parsed
      .flatMap((item) => {
        if (typeof item === 'string') return [item]
        if (item && typeof item === 'object') return Object.values(item as Record<string, unknown>).map(cleanSingleLine)
        return []
      })
      .map(cleanSingleLine)
      .filter(Boolean)
      .slice(0, maxItems)
  }

  const text = cleanText(value)
  if (!text) return []

  return text
    .split(/\n+|[;•]+|(?:^|\s)-\s+/)
    .map((line) => line.replace(/^\s*\d+[\).]\s*/, '').trim())
    .map(cleanSingleLine)
    .filter(Boolean)
    .slice(0, maxItems)
}

const parseSlides = (value?: string | null): ParsedSlide[] => {
  const parsed = safeJsonParse<Array<{ title?: unknown; content?: unknown; visualSuggestion?: unknown }>>(value)
  if (parsed?.length) {
    return parsed
      .map((slide, index) => {
        const content = Array.isArray(slide.content)
          ? slide.content.map(cleanSingleLine).filter(Boolean)
          : splitBulletText(cleanText(slide.content), 5)

        return {
          title: cleanSingleLine(slide.title) || `Diapositiva ${index + 1}`,
          content,
          visualSuggestion: cleanSingleLine(slide.visualSuggestion)
        }
      })
      .filter((slide) => slide.title || slide.content.length)
  }

  const rawText = cleanText(value)
  if (!rawText) return []

  return splitBlocks(rawText).map((block, index) => {
    const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    const firstLine = lines[0] || ''
    const titleMatch = firstLine.match(/^\s*\d+\.\s*([^:]+):\s*(.+)$/)

    if (titleMatch) {
      return {
        title: cleanSingleLine(titleMatch[1]) || `Diapositiva ${index + 1}`,
        content: [cleanSingleLine(titleMatch[2])].filter(Boolean)
      }
    }

    const [title, ...rest] = firstLine.split(/[:\-]\s*/)
    return {
      title: cleanSingleLine(title) || `Diapositiva ${index + 1}`,
      content: rest.length
        ? [cleanSingleLine(rest.join(': '))].filter(Boolean)
        : lines.slice(1).map(cleanSingleLine).filter(Boolean)
    }
  })
}

const findParsedSlideBullets = (slides: ParsedSlide[], keywords: string[], maxItems = 5) => {
  const slide = slides.find((item) => {
    const title = item.title.toLowerCase()
    return keywords.some((keyword) => title.includes(keyword))
  })

  return slide?.content.slice(0, maxItems) ?? []
}

const hasAnyValue = (...values: Array<string | null | undefined>) => values.some((value) => cleanText(value))

const pptxImageMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const pptxImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const isPptxImageAttachment = (attachment: ProjectAttachment) => {
  const mimeType = String(attachment.mimeType ?? '').toLowerCase()
  const extension = path.extname(attachment.originalName || attachment.storedName || attachment.url || '').toLowerCase()
  return pptxImageMimeTypes.has(mimeType) || pptxImageExtensions.has(extension)
}

const getPptxImageAttachments = (project: PptxProject) =>
  (project.files ?? []).filter(isPptxImageAttachment)

const getPptxDocumentAttachments = (project: PptxProject) =>
  (project.files ?? []).filter((file) => !isPptxImageAttachment(file))

const attachmentTypeLabel = (attachment: ProjectAttachment) => {
  const extension = path.extname(attachment.originalName || attachment.storedName || attachment.url || '').replace('.', '').toUpperCase()
  return extension || cleanSingleLine(attachment.mimeType) || 'Archivo'
}

const buildResourceBullets = (project: PptxProject) => {
  const links = (project.links ?? [])
    .map((link) => {
      const label = cleanSingleLine(link.label)
      const url = cleanSingleLine(link.url)
      if (!url) return ''
      return label ? `${label}: ${url}` : url
    })
    .filter(Boolean)

  const documents = getPptxDocumentAttachments(project)
    .map((file) => {
      const name = cleanSingleLine(file.originalName)
      const type = attachmentTypeLabel(file)
      const url = cleanSingleLine(file.url)
      if (!name) return ''
      return `Archivo: ${name}${type ? ` (${type})` : ''}${url ? ` - ${url}` : ''}`
    })
    .filter(Boolean)

  return [...links, ...documents, ...buildSourceBullets(project)].slice(0, 5)
}

const buildMaterialBullets = (project: PptxProject) => {
  const items = [
    hasAnyValue(project.quizQuestions, project.trueFalse, project.multipleChoice) ? 'Preguntas, quiz y consignas de evaluación rápida.' : '',
    cleanText(project.wordSearch) ? 'Sopa de letras para trabajar vocabulario clave.' : '',
    cleanText(project.crossword) ? 'Crucigrama como recurso de repaso.' : '',
    cleanText(project.memoryGame) ? 'Memotest para asociar conceptos y definiciones.' : '',
    cleanText(project.bingoConcepts) ? 'Bingo de conceptos para cierre o revisión.' : '',
    hasAnyValue(project.challengeCards, project.rolePlayingGame, project.reflectionGame) ? 'Tarjetas, roles y preguntas para socializar aprendizajes.' : ''
  ]

  return items.filter(Boolean).slice(0, 5)
}

const buildEvidenceBullets = (project: PptxProject) => {
  const evidence = splitBulletText(project.evidenceDescription, 3)
  const links = (project.links ?? [])
    .map((link) => {
      const label = cleanSingleLine(link.label)
      const url = cleanSingleLine(link.url)
      if (!url) return ''
      return label ? `${label}: ${url}` : url
    })
    .filter(Boolean)
    .slice(0, 3)
  const files = (project.files ?? [])
    .map((file) => cleanSingleLine(file.originalName))
    .filter(Boolean)
    .slice(0, 2)

  return [...evidence, ...links, ...files].slice(0, 5)
}

const buildSourceBullets = (project: PptxProject) => (project.sources ?? [])
  .map((source) => {
    const title = cleanSingleLine(source.title)
    const url = cleanSingleLine(source.url)
    const accessedAt = source.accessedAt ? new Date(source.accessedAt) : null
    const date = accessedAt && !Number.isNaN(accessedAt.getTime()) ? accessedAt.toLocaleDateString('es-AR') : ''
    const summary = cleanSingleLine(source.description || source.summary || source.note || source.snippet)
    if (!title || !url) return ''
    return `${title}.${summary ? ` ${summary}` : ''} ${url}${date ? ` Consultado el ${date}.` : ''}`
  })
  .filter(Boolean)
  .slice(0, 5)

const firstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const text = cleanSingleLine(value)
    if (text) return text
  }
  return ''
}

const fallbackBullets = (items: string[]) => items.map(cleanSingleLine).filter(Boolean).slice(0, 5)

const buildDeckSlides = (project: PptxProject, settings: ResolvedPptxSettings): DeckSlide[] => {
  const parsedSlides = parseSlides(project.slides)
  const pedagogicalInput = {
    title: project.title,
    description: project.description ?? '',
    teacher: project.teacher ?? '',
    course: project.course ?? '',
    educationalLevel: project.educationalLevel ?? '',
    educationalCycle: project.educationalCycle ?? '',
    activityOrientation: normalizeActivityOrientation(project.activityOrientation),
    area: project.area ?? '',
    experienceType: project.experienceType ?? '',
    generatedSummary: project.generatedSummary,
    objectives: project.objectives,
    mainActivities: project.mainActivities,
    evidenceDescription: project.evidenceDescription,
    suggestedTags: project.suggestedTags,
    links: (project.links ?? []).map((link) => ({ label: cleanSingleLine(link.label), url: cleanSingleLine(link.url) })),
    files: (project.files ?? []).map((file) => ({ originalName: cleanSingleLine(file.originalName) })),
    webSources: (project.sources ?? []).map((source) => ({
      title: cleanSingleLine(source.title),
      url: cleanSingleLine(source.url),
      snippet: cleanSingleLine(source.summary || source.description || source.note || source.snippet),
      description: cleanSingleLine(source.description),
      summary: cleanSingleLine(source.summary),
      status: (source.status === 'success' || source.status === 'partial' || source.status === 'failed' ? source.status : undefined) as 'success' | 'partial' | 'failed' | undefined,
      origin: cleanSingleLine(source.origin),
      sourceType: cleanSingleLine(source.sourceType),
      accessedAt: source.accessedAt ? new Date(source.accessedAt).toISOString() : new Date().toISOString()
    }))
  }
  const focus = analyzeProjectPedagogicalFocus(pedagogicalInput)
  const learningContext = buildProjectLearningContext(pedagogicalInput, focus)
  const title = firstNonEmpty(project.presentationTitle, project.improvedTitle, project.title, 'Presentación del proyecto')
  const subtitle = firstNonEmpty(project.presentationSubtitle, `${cleanSingleLine(project.area)} - ${cleanSingleLine(project.course)}`)
  const visualSuggestion = firstNonEmpty(project.visualSuggestions, 'Imagen o evidencia representativa del proyecto')
  const materials = buildMaterialBullets(project)
  const sourceBullets = buildSourceBullets(project)
  const resourceBullets = buildResourceBullets(project)

  const development = [
    ...findParsedSlideBullets(parsedSlides, ['desarrollo', 'actividad', 'proceso'], 5),
    ...splitBulletText(project.mainActivities, 5),
    ...learningContext.handsOnActivities
  ].slice(0, 5)

  const slides: DeckSlide[] = [
    {
      type: 'cover',
      title,
      subtitle,
      bullets: fallbackBullets([
        cleanSingleLine(project.course),
        cleanSingleLine(project.educationalLevel),
        cleanSingleLine(project.educationalCycle),
        activityOrientationLabel(project.activityOrientation),
        cleanSingleLine(project.area),
        cleanSingleLine(project.teacher),
        cleanSingleLine(project.experienceType)
      ]),
      sideTitle: settings.institutionName,
      sideText: settings.appName,
      accent: settings.primaryColor
    },
    {
      title: 'Problema o pregunta trabajada',
      subtitle: firstNonEmpty(project.experienceType, 'Punto de partida'),
      bullets: learningContext.possibleProblems.slice(0, 5),
      sideTitle: 'Tema',
      sideText: learningContext.topicSummary,
      accent: settings.accentColor
    },
    {
      title: 'Conceptos clave',
      subtitle: firstNonEmpty(project.area, 'Contenido disciplinar'),
      bullets: learningContext.keyConcepts.slice(0, 5),
      sideTitle: 'Vocabulario específico',
      sideText: learningContext.specificVocabulary.slice(0, 6).join(', '),
      accent: '16A34A'
    },
    {
      title: 'Cómo desarrollamos la experiencia',
      subtitle: 'Proceso de trabajo',
      bullets: development,
      sideTitle: 'Sugerencia visual',
      sideText: visualSuggestion,
      accent: settings.primaryColor
    },
    {
      title: 'Actividad práctica principal',
      subtitle: 'Acción, registro y producto',
      bullets: learningContext.handsOnActivities.slice(0, 5),
      sideTitle: 'Criterio de trabajo',
      sideText: learningContext.assessmentIdeas[0],
      accent: '0891B2'
    },
    {
      title: 'Evidencias',
      subtitle: 'Registros y enlaces principales',
      bullets: buildEvidenceBullets(project).length ? buildEvidenceBullets(project) : fallbackBullets(['Fotos, videos o documentos del proceso.', 'Producciónes de estudiantes.', 'Links o archivos adjuntos disponibles en la ficha.']),
      sideTitle: 'Banco institucional',
      sideText: 'Las evidencias ayudan a recuperar y reutilizar la experiencia.',
      accent: '0F766E'
    },
    {
      title: 'Aprendizajes específicos',
      subtitle: 'Qué observar y evaluar',
      bullets: learningContext.assessmentIdeas.slice(0, 5),
      sideTitle: 'Conexiones curriculares',
      sideText: learningContext.curricularConnections.slice(0, 4).join(', '),
      accent: settings.accentColor
    }
  ]

  if (resourceBullets.length) {
    slides.push({
      title: 'Fuentes y recursos',
      subtitle: 'Referencias, enlaces y documentos adjuntos',
      bullets: resourceBullets,
      sideTitle: 'Material disponible',
      sideText: sourceBullets.length
        ? 'Incluye fuentes consultadas y recursos cargados en el proyecto.'
        : 'Incluye enlaces y documentos adjuntos para recuperar la experiencia.',
      accent: '0F766E'
    })
  } else if (materials.length) {
    slides.push({
      title: 'Materiales generados',
      subtitle: 'Juegos y recursos visuales derivados',
      bullets: materials,
      sideTitle: 'Listos para usar',
      sideText: 'Se pueden imprimir, adaptar o usar como base para nuevas actividades.',
      accent: '9333EA'
    })
  } else {
    slides.push({
      title: 'Juegos y recursos posibles',
      subtitle: 'Vocabulario específico para reutilizar',
      bullets: learningContext.gameConcepts.slice(0, 5),
      sideTitle: 'Recursos visuales',
      sideText: 'Estos conceptos pueden convertirse en sopa de letras, bingo, memotest o tarjetas.',
      accent: '9333EA'
    })
  }

  slides.push({
    title: materials.length ? 'Aprendizajes y reutilización' : 'Reutilización',
    subtitle: 'Como puede volver a circular',
    bullets: splitBulletText(project.reuseSuggestions, 5).length ? splitBulletText(project.reuseSuggestions, 5) : fallbackBullets(['Puede servir como base para otros cursos o áreas.', 'Permite adaptar consignas, recursos y evidencias.', 'Favorece la memoria institucional compartida.']),
    sideTitle: 'Reutilizable',
    sideText: project.reuseSuggestions ? 'Hay sugerencias cargadas en la ficha.' : 'Se puede adaptar a nuevas propuestas.',
    accent: 'CA8A04'
  })

  slides.push({
    type: 'closing',
    title: 'Gracias',
    subtitle: firstNonEmpty(project.closingMessage, 'Cierre de la presentación'),
    bullets: fallbackBullets([
      firstNonEmpty(project.teacher, settings.institutionName),
      settings.appName,
      cleanSingleLine(project.closingMessage)
    ]),
    sideTitle: settings.institutionName,
    sideText: firstNonEmpty(project.closingMessage, 'Una memoria pedagógica viva para seguir compartiendo.'),
    accent: settings.primaryColor
  })

  return slides.slice(0, 10)
}

const truncate = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}...`
}

const addFooter = (pptx: any, slide: any, footerText: string, slideNumber: number, color: string) => {
  slide.addText(footerText, {
    x: 0.55,
    y: 7.05,
    w: 10.4,
    h: 0.18,
    fontFace: 'Aptos',
    fontSize: 7.5,
    color: '64748B',
    margin: 0
  })

  slide.addShape(pptx.ShapeType.ellipse, {
    x: 12.08,
    y: 6.86,
    w: 0.36,
    h: 0.36,
    fill: { color },
    line: { color, transparency: 100 }
  })
  slide.addText(String(slideNumber), {
    x: 12.08,
    y: 6.925,
    w: 0.36,
    h: 0.12,
    fontFace: 'Aptos',
    fontSize: 8.5,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    margin: 0
  })
}

const addBackground = (pptx: any, slide: any, accent: string) => {
  slide.background = { color: 'F8FAFC' }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.16,
    fill: { color: accent },
    line: { color: accent, transparency: 100 }
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 6.9,
    w: 13.333,
    h: 0.6,
    fill: { color: 'E2E8F0' },
    line: { color: 'E2E8F0', transparency: 100 }
  })
}

const addBullets = (slide: any, bullets: string[], options: { x: number; y: number; w: number; h: number }) => {
  const cleanBullets = bullets.map((item) => truncate(cleanSingleLine(item), 160)).filter(Boolean).slice(0, 5)
  const lines = cleanBullets.length ? cleanBullets : ['Contenido a completar.']

  slide.addText(
    lines.map((item) => ({
      text: item,
      options: { bullet: { indent: 18 }, hanging: 4, breakLine: true }
    })),
    {
      ...options,
      fontFace: 'Aptos',
      fontSize: lines.length > 4 ? 16 : 18,
      color: '1E293B',
      fit: 'shrink',
      valign: 'mid',
      breakLine: false,
      margin: 0.03
    }
  )
}

const addSideBlock = (pptx: any, slide: any, item: DeckSlide, accent: string) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.2,
    y: 1.15,
    w: 3.15,
    h: 4.65,
    rectRadius: 0.12,
    fill: { color: 'FFFFFF' },
    line: { color: 'CBD5E1' },
    shadow: { type: 'outer', color: '94A3B8', opacity: 0.14, blur: 1, angle: 45, distance: 1 }
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 9.45,
    y: 1.45,
    w: 2.65,
    h: 1.35,
    rectRadius: 0.1,
    fill: { color: accent, transparency: 8 },
    line: { color: accent, transparency: 100 }
  })
  slide.addText(item.sideTitle || 'Dato clave', {
    x: 9.58,
    y: 3.15,
    w: 2.4,
    h: 0.35,
    fontFace: 'Aptos',
    fontSize: 11,
    bold: true,
    color: accent,
    margin: 0
  })
  slide.addText(truncate(item.sideText || 'Sugerencia visual o evidencia representativa.', 240), {
    x: 9.58,
    y: 3.55,
    w: 2.36,
    h: 1.55,
    fontFace: 'Aptos',
    fontSize: 12.5,
    color: '334155',
    fit: 'shrink',
    valign: 'mid',
    margin: 0.03
  })
}

const addCoverSlide = (pptx: any, deck: DeckSlide, settings: ResolvedPptxSettings, slideNumber: number) => {
  const slide = pptx.addSlide()
  const accent = deck.accent || settings.primaryColor
  addBackground(pptx, slide, accent)
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.16,
    w: 4.1,
    h: 6.74,
    fill: { color: accent },
    line: { color: accent, transparency: 100 }
  })
  slide.addText(settings.institutionName, {
    x: 0.65,
    y: 0.7,
    w: 2.9,
    h: 0.5,
    fontFace: 'Aptos',
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    fit: 'shrink',
    margin: 0
  })
  slide.addText(settings.appName, {
    x: 0.65,
    y: 5.82,
    w: 2.9,
    h: 0.45,
    fontFace: 'Aptos',
    fontSize: 11,
    color: 'DBEAFE',
    fit: 'shrink',
    margin: 0
  })
  slide.addText(truncate(deck.title, 130), {
    x: 4.85,
    y: 1.15,
    w: 7.25,
    h: 1.35,
    fontFace: 'Aptos Display',
    fontSize: 34,
    bold: true,
    color: '0F172A',
    fit: 'shrink',
    margin: 0.02
  })
  slide.addText(deck.subtitle || 'Presentación del proyecto', {
    x: 4.9,
    y: 2.75,
    w: 6.8,
    h: 0.5,
    fontFace: 'Aptos',
    fontSize: 17,
    color: '475569',
    fit: 'shrink',
    margin: 0
  })
  addBullets(slide, deck.bullets, { x: 5.05, y: 3.65, w: 6.2, h: 1.85 })
  addFooter(pptx, slide, settings.footerText, slideNumber, settings.secondaryColor)
}

const addContentSlide = (pptx: any, deck: DeckSlide, settings: ResolvedPptxSettings, slideNumber: number) => {
  const slide = pptx.addSlide()
  const accent = deck.accent || settings.primaryColor
  addBackground(pptx, slide, accent)
  slide.addText(deck.subtitle || settings.institutionName, {
    x: 0.7,
    y: 0.45,
    w: 6.9,
    h: 0.25,
    fontFace: 'Aptos',
    fontSize: 10,
    bold: true,
    color: accent,
    margin: 0
  })
  slide.addText(truncate(deck.title, 80), {
    x: 0.7,
    y: 0.88,
    w: 7.95,
    h: 0.92,
    fontFace: 'Aptos Display',
    fontSize: 29,
    bold: true,
    color: '0F172A',
    fit: 'shrink',
    margin: 0.02
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.75,
    y: 2.05,
    w: 7.85,
    h: 3.95,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0' }
  })
  addBullets(slide, deck.bullets, { x: 1.05, y: 2.4, w: 7.15, h: 3.2 })
  addSideBlock(pptx, slide, deck, accent)
  addFooter(pptx, slide, settings.footerText, slideNumber, settings.secondaryColor)
}

type PreparedPptxImage = {
  attachment: ProjectAttachment
  data: string
  widthPx: number
  heightPx: number
}

const preparePptxImages = async (attachments: ProjectAttachment[]): Promise<PreparedPptxImage[]> => {
  const prepared: PreparedPptxImage[] = []

  for (const attachment of attachments) {
    const imagePath = resolveProjectAttachmentPath(attachment)
    if (!imagePath) {
      console.warn(`No se pudo resolver la ruta de la imagen adjunta para PowerPoint: ${attachment.originalName}`)
      continue
    }

    if (!fs.existsSync(imagePath)) {
      console.warn(`La imagen adjunta no existe para PowerPoint: ${imagePath}`)
      continue
    }

    try {
      const output = await sharp(imagePath)
        .rotate()
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer({ resolveWithObject: true })

      prepared.push({
        attachment,
        data: `data:image/png;base64,${output.data.toString('base64')}`,
        widthPx: output.info.width || 1,
        heightPx: output.info.height || 1
      })
    } catch (error) {
      console.warn(`No se pudo incorporar la imagen adjunta "${attachment.originalName}" al PowerPoint.`, error)
    }
  }

  return prepared
}

const fitImageToBox = (image: PreparedPptxImage, box: { x: number; y: number; w: number; h: number }) => {
  const ratio = Math.min(box.w / image.widthPx, box.h / image.heightPx)
  const w = image.widthPx * ratio
  const h = image.heightPx * ratio

  return {
    x: box.x + (box.w - w) / 2,
    y: box.y + (box.h - h) / 2,
    w,
    h
  }
}

const addVisualEvidenceSlides = (
  pptx: any,
  images: PreparedPptxImage[],
  settings: ResolvedPptxSettings,
  firstSlideNumber: number
) => {
  let slideNumber = firstSlideNumber

  for (let index = 0; index < images.length; index += 2) {
    const slide = pptx.addSlide()
    const row = images.slice(index, index + 2)
    const accent = '0F766E'

    addBackground(pptx, slide, accent)
    slide.addText(settings.institutionName, {
      x: 0.7,
      y: 0.45,
      w: 6.9,
      h: 0.25,
      fontFace: 'Aptos',
      fontSize: 10,
      bold: true,
      color: accent,
      margin: 0
    })
    slide.addText('Evidencias visuales', {
      x: 0.7,
      y: 0.88,
      w: 7.95,
      h: 0.92,
      fontFace: 'Aptos Display',
      fontSize: 29,
      bold: true,
      color: '0F172A',
      fit: 'shrink',
      margin: 0.02
    })

    const boxes = row.length === 1
      ? [{ x: 1.45, y: 1.62, w: 10.45, h: 4.55 }]
      : [
          { x: 0.75, y: 1.75, w: 5.95, h: 4.2 },
          { x: 6.85, y: 1.75, w: 5.95, h: 4.2 }
        ]

    row.forEach((image, column) => {
      const box = boxes[column]
      const frameY = box.y - 0.12
      const frameH = box.h + 0.72

      slide.addShape(pptx.ShapeType.roundRect, {
        x: box.x - 0.12,
        y: frameY,
        w: box.w + 0.24,
        h: frameH,
        rectRadius: 0.1,
        fill: { color: 'FFFFFF' },
        line: { color: 'D7E0EA' }
      })

      try {
        slide.addImage({
          data: image.data,
          ...fitImageToBox(image, box)
        })
      } catch (error) {
        console.warn(`No se pudo dibujar la imagen adjunta "${image.attachment.originalName}" en el PowerPoint.`, error)
      }

      slide.addText(truncate(image.attachment.description || image.attachment.originalName, 120), {
        x: box.x,
        y: box.y + box.h + 0.2,
        w: box.w,
        h: 0.32,
        fontFace: 'Aptos',
        fontSize: 9,
        color: '475569',
        align: 'center',
        fit: 'shrink',
        margin: 0
      })
    })

    addFooter(pptx, slide, settings.footerText, slideNumber, settings.secondaryColor)
    slideNumber += 1
  }

  return slideNumber
}

const addClosingSlide = (pptx: any, deck: DeckSlide, settings: ResolvedPptxSettings, slideNumber: number) => {
  const slide = pptx.addSlide()
  const accent = deck.accent || settings.primaryColor
  addBackground(pptx, slide, accent)
  slide.addText(deck.title, {
    x: 1.35,
    y: 1.15,
    w: 10.6,
    h: 0.95,
    fontFace: 'Aptos Display',
    fontSize: 42,
    bold: true,
    color: '0F172A',
    align: 'center',
    margin: 0
  })
  slide.addText(truncate(deck.subtitle || '', 260), {
    x: 1.65,
    y: 2.35,
    w: 10,
    h: 1.35,
    fontFace: 'Aptos',
    fontSize: 22,
    bold: true,
    color: '1E293B',
    align: 'center',
    fit: 'shrink',
    valign: 'mid',
    margin: 0.04
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 3.3,
    y: 4.35,
    w: 6.75,
    h: 0.92,
    rectRadius: 0.12,
    fill: { color: accent, transparency: 6 },
    line: { color: accent, transparency: 100 }
  })
  slide.addText(settings.appName, {
    x: 3.55,
    y: 4.62,
    w: 6.25,
    h: 0.25,
    fontFace: 'Aptos',
    fontSize: 14,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    margin: 0
  })
  addFooter(pptx, slide, settings.footerText, slideNumber, settings.secondaryColor)
}

export const generateProjectPresentationPptx = async (
  project: PptxProject,
  settings?: PptxSettings | null
): Promise<Buffer> => {
  const pptxSettings = {
    institutionName: cleanSingleLine(settings?.institutionName) || defaultSettings.institutionName,
    appName: cleanSingleLine(settings?.appName) || defaultSettings.appName,
    primaryColor: normalizeColor(settings?.primaryColor, defaultSettings.primaryColor),
    secondaryColor: normalizeColor(settings?.secondaryColor, defaultSettings.secondaryColor),
    accentColor: normalizeColor(settings?.secondaryColor, defaultSettings.accentColor),
    footerText: cleanSingleLine(settings?.footerText) || defaultSettings.footerText
  }

  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = pptxSettings.appName
  pptx.company = pptxSettings.institutionName
  pptx.subject = cleanSingleLine(project.title)
  pptx.title = firstNonEmpty(project.presentationTitle, project.improvedTitle, project.title, `Proyecto ${project.id}`)
  pptx.lang = 'es-AR'
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
    lang: 'es-AR'
  }

  const visualEvidenceImages = await preparePptxImages(getPptxImageAttachments(project))
  const deck = buildDeckSlides(project, pptxSettings)
  let slideNumber = 1

  deck.forEach((slide) => {
    if (slide.type === 'closing' && visualEvidenceImages.length) {
      slideNumber = addVisualEvidenceSlides(pptx, visualEvidenceImages, pptxSettings, slideNumber)
    }

    if (slide.type === 'cover') {
      addCoverSlide(pptx, slide, pptxSettings, slideNumber)
      slideNumber += 1
      return
    }
    if (slide.type === 'closing') {
      addClosingSlide(pptx, slide, pptxSettings, slideNumber)
      slideNumber += 1
      return
    }
    addContentSlide(pptx, slide, pptxSettings, slideNumber)
    slideNumber += 1
  })

  const output = await pptx.write({ outputType: 'nodebuffer' })
  return Buffer.isBuffer(output) ? output : Buffer.from(output as ArrayBuffer)
}

export const generateProjectPptx = generateProjectPresentationPptx
