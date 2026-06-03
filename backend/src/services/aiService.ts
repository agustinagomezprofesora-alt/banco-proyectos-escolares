export interface ProjectInput {
  title: string
  description: string
  teacher: string
  course: string
  area: string
  experienceType: string
  link?: string | null
  isReusable: boolean
  generatedSummary?: string | null
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
  links?: Array<{ label: string; url: string }>
  files?: Array<{ originalName: string }>
}

export interface GeneratedFicha {
  improvedTitle: string
  generatedSummary: string
  objectives: string
  mainActivities: string
  resourcesUsed: string
  finalProducts: string
  evidenceDescription: string
  reuseSuggestions: string
  improvementSuggestions: string
  suggestedTags: string
}

export interface GeneratedActivities {
  introActivities: string
  developmentActivities: string
  closingActivities: string
  assessmentCriteria: string
  rubric: string
  interdisciplinarySuggestions: string
  adaptations: string
  requiredResources: string
  estimatedTimeline: string
  studentReflectionQuestions: string
}

export interface GeneratedGames {
  quizQuestions: string
  trueFalse: string
  multipleChoice: string
  wordSearch: string
  crossword: string
  memoryGame: string
  bingoConcepts: string
  challengeCards: string
  rolePlayingGame: string
  reflectionGame: string
}

export interface GeneratedPresentation {
  presentationTitle: string
  presentationSubtitle: string
  slides: string
  oralScript: string
  visualSuggestions: string
  closingMessage: string
}

export type GenerationMode = 'mock' | 'ai' | 'fallback'

export type GeneratedFichaResult = {
  ficha: GeneratedFicha
  generationMode: GenerationMode
}

export type GeneratedActivitiesResult = {
  activities: GeneratedActivities
  generationMode: GenerationMode
}

export type GeneratedGamesResult = {
  games: GeneratedGames
  generationMode: GenerationMode
}

export type GeneratedPresentationResult = {
  presentation: GeneratedPresentation
  generationMode: GenerationMode
}

type AiProvider = 'mock' | 'gemini' | 'deepseek' | 'groq' | 'openrouter' | 'openai'

type GenerateWithAIOptions<T> = {
  schemaName: string
  schema: Record<string, any>
  normalize: (value: unknown) => T | null
  mock: () => T
  maxTokens?: number
}

const fichaFields = [
  'improvedTitle',
  'generatedSummary',
  'objectives',
  'mainActivities',
  'resourcesUsed',
  'finalProducts',
  'evidenceDescription',
  'reuseSuggestions',
  'improvementSuggestions',
  'suggestedTags'
] as const

const activityFields = [
  'introActivities',
  'developmentActivities',
  'closingActivities',
  'assessmentCriteria',
  'rubric',
  'interdisciplinarySuggestions',
  'adaptations',
  'requiredResources',
  'estimatedTimeline',
  'studentReflectionQuestions'
] as const

const gameFields = [
  'quizQuestions',
  'trueFalse',
  'multipleChoice',
  'wordSearch',
  'crossword',
  'memoryGame',
  'bingoConcepts',
  'challengeCards',
  'rolePlayingGame',
  'reflectionGame'
] as const

const presentationFields = [
  'presentationTitle',
  'presentationSubtitle',
  'slides',
  'oralScript',
  'visualSuggestions',
  'closingMessage'
] as const

const aiProvider = () => ((process.env.AI_PROVIDER || 'mock').trim().toLowerCase() || 'mock') as AiProvider
const envValue = (key: string) => process.env[key]?.trim()

const providerConfig = () => {
  const provider = aiProvider()

  if (provider === 'gemini') {
    return {
      provider,
      apiKey: envValue('GEMINI_API_KEY'),
      model: envValue('GEMINI_MODEL') || 'gemini-1.5-flash'
    }
  }

  if (provider === 'deepseek') {
    return {
      provider,
      apiKey: envValue('DEEPSEEK_API_KEY'),
      model: envValue('DEEPSEEK_MODEL') || 'deepseek-chat',
      endpoint: 'https://api.deepseek.com/chat/completions'
    }
  }

  if (provider === 'groq') {
    return {
      provider,
      apiKey: envValue('GROQ_API_KEY'),
      model: envValue('GROQ_MODEL') || 'llama-3.1-8b-instant',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions'
    }
  }

  if (provider === 'openrouter') {
    return {
      provider,
      apiKey: envValue('OPENROUTER_API_KEY'),
      model: envValue('OPENROUTER_MODEL') || 'openrouter/free',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions'
    }
  }

  if (provider === 'openai') {
    return {
      provider,
      apiKey: envValue('OPENAI_API_KEY'),
      model: envValue('OPENAI_MODEL') || 'gpt-4o-mini',
      endpoint: 'https://api.openai.com/v1/responses'
    }
  }

  return { provider: 'mock' as const, apiKey: undefined, model: 'mock' }
}

const trimText = (value: unknown, fallback = 'No especificado') => {
  if (typeof value !== 'string') return fallback
  const text = value.trim()
  return text || fallback
}

const evidenceText = (input: ProjectInput) => {
  const items = [
    input.link ? `Link principal: ${input.link}` : '',
    ...(input.links ?? []).map((link) => `${link.label}: ${link.url}`),
    ...(input.files ?? []).map((file) => `Archivo adjunto: ${file.originalName}`)
  ].filter(Boolean)

  return items.length > 0 ? items.join('\n') : 'No se cargaron evidencias específicas.'
}

const fichaContext = (input: ProjectInput) => {
  const parts = [
    input.generatedSummary ? `Resumen institucional: ${input.generatedSummary}` : '',
    input.objectives ? `Objetivos: ${input.objectives}` : '',
    input.mainActivities ? `Actividades principales: ${input.mainActivities}` : '',
    input.resourcesUsed ? `Recursos utilizados: ${input.resourcesUsed}` : '',
    input.finalProducts ? `Producciones finales: ${input.finalProducts}` : '',
    input.evidenceDescription ? `Evidencias: ${input.evidenceDescription}` : '',
    input.reuseSuggestions ? `Sugerencias de reutilización: ${input.reuseSuggestions}` : '',
    input.improvementSuggestions ? `Sugerencias de mejora: ${input.improvementSuggestions}` : '',
    input.suggestedTags ? `Etiquetas sugeridas: ${input.suggestedTags}` : ''
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('\n') : 'Todavía no hay ficha institucional generada.'
}

const activitiesContext = (input: ProjectInput) => {
  const parts = [
    input.introActivities ? `Actividades de inicio: ${input.introActivities}` : '',
    input.developmentActivities ? `Actividades de desarrollo: ${input.developmentActivities}` : '',
    input.closingActivities ? `Actividades de cierre: ${input.closingActivities}` : '',
    input.assessmentCriteria ? `Criterios de evaluacion: ${input.assessmentCriteria}` : '',
    input.rubric ? `Rubrica: ${input.rubric}` : '',
    input.interdisciplinarySuggestions ? `Sugerencias interdisciplinarias: ${input.interdisciplinarySuggestions}` : '',
    input.adaptations ? `Adecuaciones: ${input.adaptations}` : '',
    input.requiredResources ? `Recursos necesarios: ${input.requiredResources}` : '',
    input.estimatedTimeline ? `Cronograma estimado: ${input.estimatedTimeline}` : '',
    input.studentReflectionQuestions ? `Preguntas de reflexion: ${input.studentReflectionQuestions}` : ''
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('\n') : 'Todavia no hay actividades pedagogicas generadas.'
}

const normalizeObject = <T extends string>(value: unknown, fields: readonly T[]) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const result: Record<string, string> = {}
  for (const field of fields) {
    const fieldValue = (value as Record<string, unknown>)[field]
    if (typeof fieldValue !== 'string' || fieldValue.trim() === '') return null
    result[field] = fieldValue.trim()
  }

  return result
}

const normalizeFicha = (value: unknown): GeneratedFicha | null => {
  const result = normalizeObject(value, fichaFields)
  return result ? result as unknown as GeneratedFicha : null
}

const normalizeActivities = (value: unknown): GeneratedActivities | null => {
  const result = normalizeObject(value, activityFields)
  return result ? result as unknown as GeneratedActivities : null
}

const normalizeGames = (value: unknown): GeneratedGames | null => {
  const result = normalizeObject(value, gameFields)
  return result ? result as unknown as GeneratedGames : null
}

const normalizePresentation = (value: unknown): GeneratedPresentation | null => {
  const result = normalizeObject(value, presentationFields)
  return result ? result as unknown as GeneratedPresentation : null
}

const jsonSchemaForFields = (fields: readonly string[]) => ({
  type: 'object',
  additionalProperties: false,
  required: fields,
  properties: Object.fromEntries(fields.map((field) => [field, { type: 'string' }]))
})

const extractJsonObject = (text: string) => {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return trimmed
  return trimmed.slice(start, end + 1)
}

const parseJson = (text: string) => JSON.parse(extractJsonObject(text))

const extractChatCompletionText = (response: any) => {
  return response?.choices?.[0]?.message?.content || ''
}

const extractOpenAiResponseText = (response: any) => {
  if (typeof response?.output_text === 'string') return response.output_text

  const output = Array.isArray(response?.output) ? response.output : []
  const texts: string[] = []

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : []
    for (const contentItem of content) {
      if (typeof contentItem?.text === 'string') texts.push(contentItem.text)
    }
  }

  return texts.join('\n')
}

const extractGeminiText = (response: any) => {
  const parts = response?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map((part) => typeof part?.text === 'string' ? part.text : '').join('\n')
}

const postJson = async (url: string, headers: Record<string, string>, body: Record<string, any>) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    await response.text().catch(() => '')
    throw new Error(`El proveedor respondió ${response.status}.`)
  }

  return response.json()
}

const callGemini = async (prompt: string, options: GenerateWithAIOptions<any>, config: ReturnType<typeof providerConfig>) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`
  const data = await postJson(
    url,
    { 'x-goog-api-key': config.apiKey || '' },
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: options.schema
      }
    }
  )

  return extractGeminiText(data)
}

const callOpenAiCompatible = async (prompt: string, options: GenerateWithAIOptions<any>, config: ReturnType<typeof providerConfig>) => {
  const headers: Record<string, string> = { Authorization: `Bearer ${config.apiKey}` }
  if (config.provider === 'openrouter') {
    headers['X-Title'] = 'Memoria Pedagógica Digital'
  }

  const body: Record<string, any> = {
    model: config.model,
    messages: [
      { role: 'system', content: 'Respondé únicamente JSON válido. No incluyas texto adicional.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: options.maxTokens || 2200,
    response_format: { type: 'json_object' }
  }

  if (config.provider === 'openrouter') {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: options.schemaName,
        strict: true,
        schema: options.schema
      }
    }
  }

  const data = await postJson(config.endpoint || '', headers, body)
  return extractChatCompletionText(data)
}

const callOpenAiResponses = async (prompt: string, options: GenerateWithAIOptions<any>, config: ReturnType<typeof providerConfig>) => {
  const data = await postJson(
    config.endpoint || '',
    { Authorization: `Bearer ${config.apiKey}` },
    {
      model: config.model,
      input: prompt,
      max_output_tokens: options.maxTokens || 2200,
      text: {
        format: {
          type: 'json_schema',
          name: options.schemaName,
          strict: true,
          schema: options.schema
        }
      }
    }
  )

  return extractOpenAiResponseText(data)
}

export const generateWithAI = async <T>(prompt: string, options: GenerateWithAIOptions<T>): Promise<{ data: T; generationMode: GenerationMode }> => {
  const config = providerConfig()

  if (config.provider === 'mock' || !config.apiKey) {
    return { data: options.mock(), generationMode: 'mock' }
  }

  try {
    const rawText = config.provider === 'gemini'
      ? await callGemini(prompt, options, config)
      : config.provider === 'openai'
        ? await callOpenAiResponses(prompt, options, config)
        : await callOpenAiCompatible(prompt, options, config)

    const parsed = parseJson(rawText)
    const normalized = options.normalize(parsed)

    if (!normalized) {
      throw new Error('La respuesta de IA no tiene la estructura esperada.')
    }

    return { data: normalized, generationMode: 'ai' }
  } catch (error) {
    console.error(`Error generando contenido con ${config.provider}. Se usa fallback mock.`, error)
    return { data: options.mock(), generationMode: 'fallback' }
  }
}

const generateMockProjectFicha = (input: ProjectInput): GeneratedFicha => {
  const improvedTitle = `${input.title} - ${input.area} (${input.course})`

  const generatedSummary = `Experiencia pedagógica desarrollada en ${input.course} dentro del área de ${input.area}.
${input.description}
Esta actividad fue dirigida por ${input.teacher} y forma parte de las experiencias institucionales reutilizables.`

  const objectives = `- Desarrollar competencias en ${input.area}
- Fortalecer habilidades colaborativas en el grupo ${input.course}
- Generar una experiencia significativa vinculada a "${input.title}"
- Documentar la experiencia como recurso institucional reutilizable`

  const mainActivities = `1. Presentación de la propuesta: "${input.title}"
2. Exploración inicial sobre el tema
3. Desarrollo de la experiencia según el tipo: "${input.experienceType}"
4. Sistematización de resultados
5. Reflexión grupal y metacognición`

  const resourcesUsed = `Responsable: ${input.teacher}
Destinatarios: ${input.course}
Área vinculada: ${input.area}
Tipo de experiencia: ${input.experienceType}
Materiales: Según se detalla en la evidencia adjunta
${input.link ? `Documentación: ${input.link}` : 'Documentación: No especificada'}`

  const finalProducts = `- Producción/es derivada/s de "${input.title}"
- Registro de la experiencia en el archivo institucional
- Ficha pedagógica generada como recurso institucional
- Testimonio de la experiencia en el curso ${input.course}`

  const evidenceDescription = `Evidencias disponibles:
${input.link ? `- Link/Carpeta: ${input.link}` : '- Link: No especificado'}
- Descripción: ${input.description}
- Contexto: ${input.area} en ${input.course}
- Responsable: ${input.teacher}`

  const reuseSuggestions = input.isReusable
    ? `Esta experiencia puede reutilizarse en:
- Otros cursos del mismo nivel educativo
- Años académicos posteriores
- Contextos similares en otras áreas
- Como modelo para experiencias análogas
- Adaptándose según necesidades institucionales`
    : `Esta experiencia fue registrada con fines documentales.
Podría estudiarse la posibilidad de reutilizarla en contextos similares con las adaptaciones necesarias.`

  const improvementSuggestions = `- Documentar mayores detalles del proceso desarrollado
- Registrar el impacto en el aprendizaje del grupo
- Integrar más evidencias multimedia si es posible
- Sistematizar las lecciones aprendidas
- Considerar variantes para futuras implementaciones`

  const suggestedTags = `${input.area}, ${input.course}, ${input.experienceType}, Experiencia Pedagógica, ${input.isReusable ? 'Reutilizable' : 'Documentación'}`

  return {
    improvedTitle,
    generatedSummary,
    objectives,
    mainActivities,
    resourcesUsed,
    finalProducts,
    evidenceDescription,
    reuseSuggestions,
    improvementSuggestions,
    suggestedTags
  }
}

const generateMockProjectActivities = (input: ProjectInput): GeneratedActivities => ({
  introActivities: `1. Presentar el propósito del proyecto "${input.title}" y recuperar saberes previos del grupo.\n2. Conversar sobre el vínculo entre la propuesta, el área ${input.area} y el contexto del curso ${input.course}.\n3. Registrar preguntas iniciales de los estudiantes para orientar el trabajo.`,
  developmentActivities: `1. Organizar equipos o roles de trabajo según la dinámica del grupo.\n2. Desarrollar actividades centrales vinculadas con ${input.experienceType}, usando la descripción del proyecto como guía.\n3. Producir registros, borradores, ensayos o materiales que permitan documentar el proceso.\n4. Realizar una puesta en común parcial para ajustar la propuesta.`,
  closingActivities: `1. Socializar las producciones finales o avances logrados.\n2. Recuperar aprendizajes, dificultades y decisiones tomadas durante el proceso.\n3. Elaborar una síntesis grupal que pueda integrarse a la memoria institucional.`,
  assessmentCriteria: `- Participación activa y responsable.\n- Comprensión de los contenidos trabajados en ${input.area}.\n- Calidad del proceso de producción y registro.\n- Capacidad para revisar, mejorar y comunicar lo realizado.\n- Colaboración y cumplimiento de acuerdos de trabajo.`,
  rubric: `Nivel avanzado: participa con autonomía, aporta ideas pertinentes y produce evidencias claras.\nNivel satisfactorio: cumple las consignas principales y participa en la producción grupal.\nNivel en proceso: requiere acompañamiento para sostener la tarea y registrar avances.\nNivel inicial: necesita apoyo frecuente para comprender consignas y completar actividades.`,
  interdisciplinarySuggestions: `Articular con otras áreas mediante lectura, escritura, producción audiovisual, análisis de datos, investigación territorial o comunicación institucional, según las posibilidades del proyecto.`,
  adaptations: `Ofrecer consignas por pasos, modelos de producción, apoyos visuales, roles diferenciados y alternativas orales, escritas o audiovisuales para que todos los estudiantes puedan participar.`,
  requiredResources: `Materiales de aula, dispositivos disponibles, registros del proyecto, evidencias cargadas, recursos digitales pertinentes y espacios de intercambio grupal.`,
  estimatedTimeline: `Inicio: 1 clase para presentación y organización.\nDesarrollo: 2 a 4 clases para producción, acompañamiento y revisión.\nCierre: 1 clase para socialización, evaluación y reflexión.`,
  studentReflectionQuestions: `- ¿Qué aprendimos durante esta experiencia?\n- ¿Qué decisiones ayudaron a mejorar el trabajo?\n- ¿Qué evidencias muestran mejor nuestro proceso?\n- ¿Cómo podríamos adaptar esta propuesta para otro grupo o contexto?\n- ¿Qué cambiaríamos si volviéramos a realizarla?`
})

const generateMockProjectGames = (input: ProjectInput): GeneratedGames => ({
  quizQuestions: `1. Cual es el proposito principal del proyecto "${input.title}"?\n2. Que contenidos del area ${input.area} se ponen en juego?\n3. Que evidencias permitirian mostrar el proceso realizado?\n4. Que decisiones del grupo ayudaron a mejorar la experiencia?\n5. Como podria reutilizarse esta propuesta en otro curso?`,
  trueFalse: `1. El proyecto se vincula con el area ${input.area}. Verdadero.\n2. Las evidencias solo pueden ser archivos impresos. Falso.\n3. La reflexion final ayuda a reconocer aprendizajes. Verdadero.\n4. Una experiencia pedagogica no puede adaptarse a otros grupos. Falso.\n5. El trabajo colaborativo puede formar parte de la evaluacion. Verdadero.`,
  multipleChoice: `1. El tipo de experiencia registrado es:\nA. ${input.experienceType}\nB. Evaluacion externa\nC. Tramite administrativo\nRespuesta sugerida: A.\n\n2. Para socializar el proyecto conviene:\nA. No registrar el proceso\nB. Organizar evidencias y explicar aprendizajes\nC. Evitar la participacion del grupo\nRespuesta sugerida: B.`,
  wordSearch: `Conceptos sugeridos para sopa de letras: ${input.area}, proyecto, evidencia, aprendizaje, equipo, reflexion, produccion, escuela, memoria, curso.`,
  crossword: `1. Area vinculada al proyecto: ${input.area}.\n2. Registro que muestra el proceso realizado: evidencia.\n3. Momento final para pensar lo aprendido: reflexion.\n4. Grupo destinatario de la experiencia: ${input.course}.\n5. Producto o resultado que se comparte: produccion.`,
  memoryGame: `Armar pares de tarjetas con concepto y explicacion: evidencia / registro del proceso; objetivo / proposito de trabajo; recurso / material utilizado; produccion / resultado final; reflexion / revision de aprendizajes.`,
  bingoConcepts: `Cartones con conceptos: ${input.area}, ${input.course}, ${input.experienceType}, evidencia, objetivo, recurso, produccion, equipo, evaluacion, reflexion, reutilizacion, escuela.`,
  challengeCards: `Tarjeta 1: Expliquen el proyecto en un minuto.\nTarjeta 2: Elijan la evidencia mas clara y justifiquen.\nTarjeta 3: Propongan una mejora posible.\nTarjeta 4: Disenen una adaptacion para otro curso.\nTarjeta 5: Identifiquen dos aprendizajes logrados.`,
  rolePlayingGame: `Roles sugeridos: equipo docente, estudiantes expositores, familias, directivos y visitantes. Cada grupo formula preguntas o respuestas para simular una muestra escolar del proyecto.`,
  reflectionGame: `Ronda final con tarjetas: "Me sorprendio...", "Aprendi que...", "Me gustaria mejorar...", "Una evidencia importante fue...", "Podriamos reutilizar esto para...".`
})

const generateMockProjectPresentation = (input: ProjectInput): GeneratedPresentation => ({
  presentationTitle: input.title,
  presentationSubtitle: `${input.area} - ${input.course} - ${input.experienceType}`,
  slides: `1. Titulo del proyecto: presentar "${input.title}" y el curso participante. Visual: imagen o evidencia general.\n2. Punto de partida: explicar brevemente la necesidad o pregunta que motivo la experiencia. Visual: frase disparadora.\n3. Propositos: sintetizar los objetivos principales. Visual: lista breve con iconos.\n4. Desarrollo: describir las actividades centrales. Visual: linea de tiempo.\n5. Recursos utilizados: mostrar materiales, espacios y herramientas. Visual: collage de recursos.\n6. Producciones: presentar resultados o productos finales. Visual: captura, foto o muestra.\n7. Evidencias: destacar registros del proceso. Visual: enlaces, archivos o fotografias.\n8. Aprendizajes: recuperar logros, dificultades y decisiones. Visual: nube de palabras.\n9. Reutilizacion: explicar como podria adaptarse a otros grupos. Visual: esquema de posibilidades.\n10. Cierre: agradecer y abrir preguntas. Visual: mensaje final institucional.`,
  oralScript: `Buenos dias. Vamos a presentar el proyecto "${input.title}", desarrollado en ${input.course} dentro del area ${input.area}. La experiencia permitio organizar una propuesta de tipo ${input.experienceType}, registrar el proceso y recuperar aprendizajes institucionales. Durante la presentacion mostraremos el punto de partida, las actividades realizadas, las evidencias disponibles y posibles formas de reutilizar la propuesta.`,
  visualSuggestions: `Usar fotos reales del proceso si estan disponibles, capturas de producciones, titulos breves, colores institucionales, una linea de tiempo simple y no mas de tres ideas por diapositiva.`,
  closingMessage: `Esta experiencia forma parte de la memoria pedagogica institucional y puede servir como punto de partida para nuevas propuestas, adaptaciones y recorridos de aprendizaje.`
})

const buildFichaPrompt = (input: ProjectInput) => {
  return `Actuá como especialista en tecnología educativa y gestión escolar.

A partir de una experiencia pedagógica escolar, generá una ficha institucional clara, profesional y reutilizable.
No inventes datos específicos.
No incluyas datos personales de estudiantes.
No publiques automáticamente.
La ficha debe estar escrita en español rioplatense formal, con tono institucional, claro y concreto.

Datos:
- Título: ${trimText(input.title)}
- Docente/s: ${trimText(input.teacher)}
- Curso: ${trimText(input.course)}
- Área: ${trimText(input.area)}
- Tipo de experiencia: ${trimText(input.experienceType)}
- Descripción: ${trimText(input.description)}
- Links o evidencias:
${evidenceText(input)}
- Reutilizable: ${input.isReusable ? 'Sí' : 'No'}

Generá estos campos:
- improvedTitle
- generatedSummary
- objectives
- mainActivities
- resourcesUsed
- finalProducts
- evidenceDescription
- reuseSuggestions
- improvementSuggestions
- suggestedTags

Respondé únicamente JSON válido.`
}

const buildActivitiesPrompt = (input: ProjectInput) => {
  return `Actuá como docente especialista en diseño de propuestas didácticas para escuela secundaria y EPJA.

A partir del proyecto cargado, generá actividades concretas para trabajar con estudiantes.

Las actividades deben:
- Ser claras.
- Ser aplicables en aula.
- Tener inicio, desarrollo y cierre.
- Incluir criterios de evaluación.
- Incluir una rúbrica simple.
- Sugerir articulaciones interdisciplinarias.
- Proponer adecuaciones o alternativas inclusivas.
- Sugerir recursos necesarios.
- Incluir preguntas de reflexión para estudiantes.
- Evitar datos inventados.
- No usar datos sensibles.
- Estar escritas en español rioplatense formal y claro.

Datos del proyecto:
- Título: ${trimText(input.title)}
- Docente/s: ${trimText(input.teacher)}
- Curso: ${trimText(input.course)}
- Área: ${trimText(input.area)}
- Tipo de experiencia: ${trimText(input.experienceType)}
- Descripción: ${trimText(input.description)}
- Evidencias generales:
${evidenceText(input)}
- Reutilizable: ${input.isReusable ? 'Sí' : 'No'}

Ficha institucional disponible:
${fichaContext(input)}

Generá estos campos:
- introActivities
- developmentActivities
- closingActivities
- assessmentCriteria
- rubric
- interdisciplinarySuggestions
- adaptations
- requiredResources
- estimatedTimeline
- studentReflectionQuestions

Respondé únicamente JSON válido.`
}

const buildGamesPrompt = (input: ProjectInput) => {
  return `Actua como especialista en gamificacion educativa para escuela secundaria y EPJA.

A partir del proyecto cargado, genera juegos educativos simples, claros y aplicables en el aula.
Los juegos deben poder realizarse con pocos recursos, preferentemente sin depender de internet.
No inventes datos especificos.
No incluyas datos personales de estudiantes.
No incluyas datos sensibles.
Usa espanol rioplatense formal, claro y concreto.

Datos del proyecto:
- Titulo: ${trimText(input.title)}
- Docente/s: ${trimText(input.teacher)}
- Curso: ${trimText(input.course)}
- Area: ${trimText(input.area)}
- Tipo de experiencia: ${trimText(input.experienceType)}
- Descripcion: ${trimText(input.description)}
- Evidencias generales:
${evidenceText(input)}
- Reutilizable: ${input.isReusable ? 'Si' : 'No'}

Ficha institucional disponible:
${fichaContext(input)}

Actividades pedagogicas disponibles:
${activitiesContext(input)}

Genera estos campos:
- quizQuestions
- trueFalse
- multipleChoice
- wordSearch
- crossword
- memoryGame
- bingoConcepts
- challengeCards
- rolePlayingGame
- reflectionGame

Responde unicamente JSON valido.`
}

const buildPresentationPrompt = (input: ProjectInput) => {
  return `Actua como especialista en comunicacion educativa y diseno de presentaciones escolares.

A partir del proyecto cargado, genera una presentacion atractiva, clara y visual para socializar el proyecto.
La presentacion debe servir para feria, muestra escolar, socializacion institucional, exposicion ante directivos o presentacion a familias.
Inclui titulo, subtitulo, estructura de 8 a 10 diapositivas, guion oral, sugerencias visuales y mensaje de cierre.
Cada diapositiva debe tener numero, titulo, contenido breve y sugerencia visual.
El tono debe ser institucional, claro y motivador.
No inventes datos especificos.
No incluyas datos personales de estudiantes.
No incluyas datos sensibles.
Usa espanol rioplatense formal.

Datos del proyecto:
- Titulo: ${trimText(input.title)}
- Docente/s: ${trimText(input.teacher)}
- Curso: ${trimText(input.course)}
- Area: ${trimText(input.area)}
- Tipo de experiencia: ${trimText(input.experienceType)}
- Descripcion: ${trimText(input.description)}
- Evidencias generales:
${evidenceText(input)}
- Reutilizable: ${input.isReusable ? 'Si' : 'No'}

Ficha institucional disponible:
${fichaContext(input)}

Actividades pedagogicas disponibles:
${activitiesContext(input)}

Genera estos campos:
- presentationTitle
- presentationSubtitle
- slides
- oralScript
- visualSuggestions
- closingMessage

Responde unicamente JSON valido.`
}

export const generateProjectFicha = async (input: ProjectInput): Promise<GeneratedFichaResult> => {
  const result = await generateWithAI<GeneratedFicha>(buildFichaPrompt(input), {
    schemaName: 'ficha_institucional',
    schema: jsonSchemaForFields(fichaFields),
    normalize: normalizeFicha,
    mock: () => generateMockProjectFicha(input)
  })

  return { ficha: result.data, generationMode: result.generationMode }
}

export const generateProjectActivities = async (input: ProjectInput): Promise<GeneratedActivitiesResult> => {
  const result = await generateWithAI<GeneratedActivities>(buildActivitiesPrompt(input), {
    schemaName: 'actividades_pedagogicas',
    schema: jsonSchemaForFields(activityFields),
    normalize: normalizeActivities,
    mock: () => generateMockProjectActivities(input)
  })

  return { activities: result.data, generationMode: result.generationMode }
}

export const generateProjectGames = async (input: ProjectInput): Promise<GeneratedGamesResult> => {
  const result = await generateWithAI<GeneratedGames>(buildGamesPrompt(input), {
    schemaName: 'juegos_educativos',
    schema: jsonSchemaForFields(gameFields),
    normalize: normalizeGames,
    mock: () => generateMockProjectGames(input),
    maxTokens: 3200
  })

  return { games: result.data, generationMode: result.generationMode }
}

export const generateProjectPresentation = async (input: ProjectInput): Promise<GeneratedPresentationResult> => {
  const result = await generateWithAI<GeneratedPresentation>(buildPresentationPrompt(input), {
    schemaName: 'presentacion_proyecto',
    schema: jsonSchemaForFields(presentationFields),
    normalize: normalizePresentation,
    mock: () => generateMockProjectPresentation(input),
    maxTokens: 3400
  })

  return { presentation: result.data, generationMode: result.generationMode }
}
