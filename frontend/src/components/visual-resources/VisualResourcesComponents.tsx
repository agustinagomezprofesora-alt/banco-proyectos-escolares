import { ReactNode } from 'react'

export interface QuizQuestion {
  question: string
  answer?: string
}

export interface TrueFalseItem {
  statement: string
  answer?: boolean | null
}

export interface MultipleChoiceQuestion {
  question: string
  options: string[]
  answer?: string
}

export interface MemoryCardItem {
  concept: string
  definition: string
}

export interface ChallengeCardItem {
  title: string
  prompt: string
}

export interface RoleCardItem {
  role: string
  goal?: string
  actions?: string[]
}

export interface ReflectionItem {
  prompt: string
}

export interface SlideItem {
  number: number
  title: string
  content: string[]
  visualSuggestion?: string
}

export interface CrosswordEntry {
  number: number
  clue: string
  length: number
}

export interface BingoCard {
  id: string
  grid: string[][]
}

const trimText = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (value == null) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function safeJsonParse<T>(value?: unknown): T | undefined {
  if (value == null) return undefined
  if (typeof value !== 'string') return value as T
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed) as T
  } catch {
    return undefined
  }
}

export function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback
  if (Array.isArray(value)) return value as T
  if (typeof value !== 'string') return value as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const splitBlocks = (text: string) =>
  text
    .split(/\n(?=\s*\d+\.)/)
    .map((block) => block.trim())
    .filter(Boolean)

const removeNumberPrefix = (text: string) => text.replace(/^\s*\d+\.\s*/, '').trim()

const parseAnswerValue = (text: string) => {
  const match = text.match(/(?:Respuesta(?:\s+sugerida)?|Answer|Respuest[oa])\s*[:\-]?\s*(.+)/i)
  return match ? match[1].trim() : undefined
}

const parseWordsFromText = (text: string) => {
  if (!text) return []
  const afterColon = text.includes(':') ? text.split(':').slice(1).join(':') : text
  return afterColon
    .split(/[\n,;•·-]+/)
    .map((word) => word.trim())
    .filter(Boolean)
}

export const normalizeWord = (word: unknown): string => {
  return word
    ? String(word)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-zÑñ]/g, '')
    .toUpperCase()
    : ''
}

const randomLetter = () => {
  const alphabet = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'
  return alphabet.charAt(Math.floor(Math.random() * alphabet.length))
}

export const generateWordSearch = (words: string[], size = 12): string[][] => {
  const gridSize = Math.max(12, Math.min(15, size))

  const directions = [
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: -1, col: 1 }
  ]

  const cleanWords = words
    .map(normalizeWord)
    .filter((word) => word.length >= 3 && word.length <= gridSize)
    .filter((word, index, list) => list.indexOf(word) === index)
    .sort((a, b) => b.length - a.length)
    .slice(0, 12)

  const createEmptyGrid = () =>
    Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => ''))

  function canPlace(grid: string[][], word: string, row: number, col: number, dir: { row: number; col: number }) {
    for (let i = 0; i < word.length; i += 1) {
      const r = row + dir.row * i
      const c = col + dir.col * i

      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false
      if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false
    }

    return true
  }

  function placeWord(grid: string[][], word: string) {
    const candidates = directions
      .flatMap((dir) =>
        Array.from({ length: gridSize * gridSize }, (_, index) => ({
          dir,
          row: Math.floor(index / gridSize),
          col: index % gridSize,
          order: Math.random()
        }))
      )
      .sort((a, b) => a.order - b.order)

    for (const { dir, row, col } of candidates) {
      if (canPlace(grid, word, row, col, dir)) {
        for (let i = 0; i < word.length; i += 1) {
          const r = row + dir.row * i
          const c = col + dir.col * i
          grid[r][c] = word[i]
        }
        return true
      }
    }

    return false
  }

  let grid = createEmptyGrid()
  let bestGrid = grid
  let bestPlaced = -1

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidateGrid = createEmptyGrid()
    const placed = cleanWords.filter((word) => placeWord(candidateGrid, word)).length
    if (placed > bestPlaced) {
      bestGrid = candidateGrid
      bestPlaced = placed
    }
    if (placed === cleanWords.length) break
  }

  grid = bestGrid

  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      if (!grid[r][c]) {
        grid[r][c] = randomLetter()
      }
    }
  }

  return grid
}

export const generateWordSearchGrid = (words: string[], size = 12): string[][] => generateWordSearch(words, size)

export const parseQuizQuestions = (value?: unknown): QuizQuestion[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed
      .map((item) => {
        if (typeof item === 'string') return { question: item }
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const question = trimText(record.question ?? record.pregunta ?? record.statement)
        const answer = trimText(record.answer ?? record.respuesta)
        return question ? { question, answer: answer || undefined } : null
      })
      .filter(Boolean) as QuizQuestion[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.quizQuestions ?? record.questions ?? record.preguntas
    if (nested !== undefined && nested !== value) return parseQuizQuestions(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const blocks = splitBlocks(rawText)
  const items: QuizQuestion[] = blocks.map((block) => {
    const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    const question = removeNumberPrefix(lines[0])
    const answer = lines.slice(1).map(parseAnswerValue).find(Boolean)
    return { question, answer: answer?.trim() }
  })

  if (items.length) return items

  return rawText.split(/\n+/).map((line) => ({ question: line.trim() }))
}

export const parseTrueFalse = (value?: unknown): TrueFalseItem[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed
      .map((item) => {
        if (typeof item === 'string') return parseTrueFalse(item)[0]
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const statement = trimText(record.statement ?? record.afirmacion ?? record.question ?? record.pregunta)
        const rawAnswer = record.answer ?? record.respuesta
        const answer = typeof rawAnswer === 'boolean'
          ? rawAnswer
          : typeof rawAnswer === 'string'
            ? /verdadero|true/i.test(rawAnswer)
            : null
        return statement ? { statement, answer } : null
      })
      .filter(Boolean) as TrueFalseItem[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.trueFalse ?? record.items ?? record.questions ?? record.preguntas
    if (nested !== undefined && nested !== value) return parseTrueFalse(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const lines = rawText.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  return lines.map((line) => {
    const answerMatch = line.match(/\b(Verdadero|Falso|True|False)\b/i)
    const answer = answerMatch ? /verdadero|true/i.test(answerMatch[1]) : undefined
    const statement = removeNumberPrefix(line.replace(/\b(Verdadero|Falso|True|False)\b\.?$/i, '').trim())
    return { statement: statement || line, answer: answer ?? null }
  })
}

export const parseMultipleChoice = (value?: unknown): MultipleChoiceQuestion[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed
      .map((item) => {
        if (typeof item === 'string') return { question: item, options: ['A.', 'B.', 'C.', 'D.'] }
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const question = trimText(record.question ?? record.pregunta ?? record.statement)
        const rawOptions = record.options ?? record.opciones
        const options = Array.isArray(rawOptions)
          ? rawOptions.map(trimText).filter(Boolean)
          : parseWordsFromText(trimText(rawOptions))
        const answer = trimText(record.answer ?? record.respuesta ?? record.correctAnswer)
        return question ? { question, options: options.length ? options : ['A.', 'B.', 'C.', 'D.'], answer: answer || undefined } : null
      })
      .filter(Boolean) as MultipleChoiceQuestion[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.multipleChoice ?? record.questions ?? record.preguntas
    if (nested !== undefined && nested !== value) return parseMultipleChoice(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const blocks = splitBlocks(rawText)
  const items: MultipleChoiceQuestion[] = blocks.map((block) => {
    const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    const questionLine = removeNumberPrefix(lines[0])
    const options = lines
      .slice(1)
      .map((line) => {
        const optionMatch = line.match(/^[A-D]\.?\s*[:\-]?\s*(.+)$/i)
        return optionMatch ? optionMatch[1].trim() : undefined
      })
      .filter(Boolean) as string[]
    const answer = lines.map(parseAnswerValue).find(Boolean)
    return { question: questionLine, options: options.length ? options : ['A.', 'B.', 'C.', 'D.'], answer }
  })

  if (items.length) return items

  return rawText
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => ({ question: line, options: ['A.', 'B.', 'C.', 'D.'] }))
}

export const parseWordSearchWords = (value?: unknown): string[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    return Array.from(
      new Set(
        parsed
          .flatMap((word) => typeof word === 'string' ? word.split(/\s+/) : [])
          .map(normalizeWord)
          .filter((word) => word.length >= 3 && word.length <= 12)
      )
    )
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.wordSearch ?? record.words ?? record.palabras ?? record.concepts
    if (nested !== undefined && nested !== value) return parseWordSearchWords(nested)
  }

  const rawText = trimText(value)
  if (!rawText) return []

  const textAfterColon = rawText.replace(/^(?:Conceptos|Palabras)(?:\s+sugeridos?)?(?:\s+para\s+sopa\s+de\s+letras)?\s*:/i, '')
  const words = textAfterColon
    .split(/[\n,;•·:-]+/)
    .flatMap((word) => word.trim().split(/\s+/))
    .map(normalizeWord)
    .filter((word) => word.length >= 3 && word.length <= 12)

  return Array.from(new Set(words))
}

export const extractWordList = (
  value: unknown,
  project?: { title?: unknown; area?: unknown; course?: unknown; experienceType?: unknown; description?: unknown; suggestedTags?: unknown }
): string[] => {
  const wordsFromText = parseWordSearchWords(value)
  const projectText = [
    project?.title,
    project?.area,
    project?.course,
    project?.experienceType,
    project?.description,
    project?.suggestedTags
  ].filter(Boolean).join(' ')

  const fallback = [
    ...projectText.split(/\s+/),
    'PROYECTO',
    'ESCUELA',
    'EVIDENCIA',
    'REFLEXION',
    'APRENDIZAJE',
    ...(normalizeWord(projectText).includes('HUERTA')
      ? ['HUERTA', 'SEMILLA', 'COMPOST', 'RIEGO', 'SUELO', 'RAIZ', 'TALLO', 'COSECHA']
      : [])
  ]
    .map(normalizeWord)
    .filter((word) => word.length >= 3 && word.length <= 12)

  return Array.from(new Set([...wordsFromText, ...fallback])).slice(0, 12)
}

export const parseCrossword = (value?: unknown): CrosswordEntry[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => {
      const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
      const clue = trimText(record.clue ?? record.pista ?? item)
      const answer = trimText(record.answer ?? record.respuesta)
      return {
        number: typeof record.number === 'number' ? record.number : index + 1,
        clue,
        length: answer ? normalizeWord(answer).length : Math.max(4, Math.min(12, Math.round(clue.length / 6)))
      }
    }).filter((item) => item.clue)
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.crossword ?? record.entries ?? record.pistas
    if (nested !== undefined && nested !== value) return parseCrossword(nested)
  }

  const rawText = trimText(value)
  if (!rawText) return []

  const blocks = splitBlocks(rawText)
  return blocks.map((block, index) => {
    const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    const clue = removeNumberPrefix(lines[0])
    const answer = lines.map(parseAnswerValue).find(Boolean)
    const length = answer ? answer.replace(/\s+/g, '').length : Math.max(4, Math.min(12, Math.round(clue.length / 6)))
    return { number: index + 1, clue, length }
  })
}

export const parseMemoryGame = (value?: unknown): MemoryCardItem[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed.map((item, index) => {
      if (typeof item === 'string') return { concept: `Concepto ${index + 1}`, definition: item }
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const concept = trimText(record.concept ?? record.concepto ?? record.term)
      const definition = trimText(record.definition ?? record.definicion ?? record.description)
      return concept || definition ? { concept: concept || `Concepto ${index + 1}`, definition: definition || concept } : null
    }).filter(Boolean) as MemoryCardItem[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.memoryGame ?? record.items ?? record.cards ?? record.tarjetas
    if (nested !== undefined && nested !== value) return parseMemoryGame(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const lines = rawText.split(/[\n;•\-]+/).map((line) => line.trim()).filter(Boolean)
  const items: MemoryCardItem[] = []

  lines.forEach((line) => {
    const cleanLine = line.replace(/^Armar pares.*?:\s*/i, '')
    const parts = cleanLine.includes('/')
      ? cleanLine.split(/\s*\/\s*/)
      : cleanLine.split(/\s*[:-]\s*/)
    if (parts.length >= 2) {
      const [concept, ...rest] = parts
      items.push({ concept: concept.trim(), definition: rest.join(' / ').trim() })
    }
  })

  if (items.length) return items

  return rawText.split(/\n+/).map((line, index) => ({ concept: `Concepto ${index + 1}`, definition: line.trim() }))
}

export const parseBingoConcepts = (value?: unknown): string[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) return parsed.map(trimText).filter(Boolean)
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.bingoConcepts ?? record.words ?? record.palabras ?? record.concepts
    if (nested !== undefined && nested !== value) return parseBingoConcepts(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []
  return parseWordsFromText(rawText)
}

export const generateBingoCards = (words: string[], cardCount = 4, size = 4): BingoCard[] => {
  const uniqueWords = Array.from(new Set(words.map((word) => word.trim()).filter(Boolean)))
  const cards: BingoCard[] = []

  for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
    const shuffled = [...uniqueWords].sort(() => Math.random() - 0.5)
    const chosen = shuffled.slice(0, size * size)
    while (chosen.length < size * size) {
      chosen.push(uniqueWords[chosen.length % uniqueWords.length] || '---')
    }
    const grid: string[][] = []
    for (let row = 0; row < size; row += 1) {
      grid.push(chosen.slice(row * size, row * size + size))
    }
    cards.push({ id: `bingo-${cardIndex + 1}`, grid })
  }

  return cards
}

export const parseChallengeCards = (value?: unknown): ChallengeCardItem[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed.map((item, index) => {
      if (typeof item === 'string') return { title: `Desafío ${index + 1}`, prompt: item }
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title = trimText(record.title ?? record.titulo) || `Desafío ${index + 1}`
      const prompt = trimText(record.prompt ?? record.consigna ?? record.challenge ?? record.desafio)
      return prompt || title ? { title, prompt: prompt || title } : null
    }).filter(Boolean) as ChallengeCardItem[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.challengeCards ?? record.cards ?? record.tarjetas
    if (nested !== undefined && nested !== value) return parseChallengeCards(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const lines = rawText.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const items: ChallengeCardItem[] = []

  lines.forEach((line, index) => {
    const match = line.match(/^(?:Tarjeta\s*\d+\s*[:\-\.]+\s*)?(.*?)(?:[:\-]\s*(.+))?$/i)
    if (match) {
      const title = match[1] ? match[1].trim() : `Desafío ${index + 1}`
      const prompt = match[2] ? match[2].trim() : title
      items.push({ title, prompt })
    }
  })

  return items
}

export const parseRolePlayingGame = (value?: unknown): RoleCardItem[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed.map((item) => {
      if (typeof item === 'string') return { role: item, goal: 'Representar el rol en la presentación.' }
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const role = trimText(record.role ?? record.rol)
      const goal = trimText(record.goal ?? record.objetivo)
      const rawActions = record.actions ?? record.acciones
      const actions = Array.isArray(rawActions)
        ? rawActions.map(trimText).filter(Boolean)
        : undefined
      return role ? { role, goal: goal || undefined, actions } : null
    }).filter(Boolean) as RoleCardItem[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.rolePlayingGame ?? record.roles ?? record.items
    if (nested !== undefined && nested !== value) return parseRolePlayingGame(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const lines = rawText.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const items: RoleCardItem[] = []

  lines.forEach((line) => {
    const roleMatch = line.match(/^Roles?(?:\s+sugeridos?)?\s*[:\-]\s*(.+)$/i)
    if (roleMatch) {
      const roleDetails = roleMatch[1].match(/^(.*?)(?:\.\s*Objetivo\s*:\s*(.+))?$/i)
      const roles = (roleDetails?.[1] || roleMatch[1]).split(/[,;]+|\s+y\s+/).map((text) => text.trim()).filter(Boolean)
      const goal = roleDetails?.[2]?.trim() || 'Representar el rol en la presentación.'
      roles.forEach((role) => items.push({ role, goal }))
    } else {
      const parts = line.split(/\s*[\-:\|]\s*/)
      if (parts.length >= 2) {
        items.push({ role: parts[0].trim(), goal: parts[1].trim() })
      } else {
        items.push({ role: line, goal: 'Describir responsabilidades y acciónes del rol.' })
      }
    }
  })

  return items
}

export const parseReflectionGame = (value?: unknown): ReflectionItem[] => {
  const parsed = safeJsonParse<unknown>(value)
  if (Array.isArray(parsed)) {
    const items = parsed.map((item) => {
      if (typeof item === 'string') return { prompt: item }
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const prompt = trimText(record.prompt ?? record.pregunta ?? record.reflection ?? record.reflexion)
      return prompt ? { prompt } : null
    }).filter(Boolean) as ReflectionItem[]
    if (items.length) return items
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>
    const nested = record.reflectionGame ?? record.items ?? record.questions ?? record.preguntas
    if (nested !== undefined && nested !== value) return parseReflectionGame(nested)
  }
  const rawText = trimText(value)
  if (!rawText) return []

  const quoted = Array.from(rawText.matchAll(/["“”](.+?)["“”]/g)).map((match) => match[1].trim())
  if (quoted.length) return quoted.map((prompt) => ({ prompt }))

  const lines = rawText.split(/\n+|[;]+/).map((line) => line.trim()).filter(Boolean)
  return lines.map((line) => ({ prompt: line }))
}

export const parseSlides = (value?: string | null): SlideItem[] => {
  const parsed = safeJsonParse<SlideItem[]>(value)
  if (parsed?.length) return parsed
  const rawText = trimText(value)
  if (!rawText) return []

  const blocks = splitBlocks(rawText)
  const slides = blocks.map((block, index) => {
    const firstLine = block.split(/\n+/)[0].trim()
    const titleMatch = firstLine.match(/^\s*\d+\.\s*([^:]+):\s*(.+)$/)
    if (titleMatch) {
      return {
        number: index + 1,
        title: titleMatch[1].trim(),
        content: [titleMatch[2].trim()],
        visualSuggestion: undefined
      }
    }
    const [title, ...rest] = firstLine.split(/[:\-]\s*/)
    return {
      number: index + 1,
      title: title.trim() || `Diapositiva ${index + 1}`,
      content: rest.length ? [rest.join(': ').trim()] : block.split(/\n+/).slice(1).map((line) => line.trim()).filter(Boolean),
      visualSuggestion: undefined
    }
  })

  if (slides.length) return slides

  return [{ number: 1, title: 'Presentación', content: [rawText], visualSuggestion: undefined }]
}

const sectionCard = (title: string, children: ReactNode) => (
  <section className="resource-section" key={title}>
    <div className="resource-section-header">
      <h3>{title}</h3>
    </div>
    {children}
  </section>
)

export const QuizCards = ({ items }: { items: QuizQuestion[] }) => {
  if (!items.length) return null
  return (
    <div className="resource-grid">
      {items.map((item, index) => (
        <article key={`quiz-${index}`} className="resource-card">
          <div className="resource-card-title">Pregunta {index + 1}</div>
          <p className="resource-card-question">{item.question}</p>
          <div className="resource-card-answer">Respuesta: {item.answer || '__________'}</div>
        </article>
      ))}
    </div>
  )
}

export const TrueFalseCards = ({ items }: { items: TrueFalseItem[] }) => {
  if (!items.length) return null
  return (
    <div className="resource-grid">
      {items.map((item, index) => (
        <article key={`tf-${index}`} className="resource-card">
          <div className="resource-card-title">Afirmación {index + 1}</div>
          <p className="resource-card-question">{item.statement}</p>
          <div className="tf-options">
            <label><input type="checkbox" disabled /> Verdadero</label>
            <label><input type="checkbox" disabled /> Falso</label>
          </div>
          {item.answer != null && (
            <div className="resource-card-answer">Respuesta correcta: {item.answer ? 'Verdadero' : 'Falso'}</div>
          )}
        </article>
      ))}
    </div>
  )
}

export const MultipleChoiceCards = ({ items }: { items: MultipleChoiceQuestion[] }) => {
  if (!items.length) return null
  return (
    <div className="resource-grid">
      {items.map((item, index) => (
        <article key={`mc-${index}`} className="resource-card">
          <div className="resource-card-title">Pregunta {index + 1}</div>
          <p className="resource-card-question">{item.question}</p>
          <div className="mc-options">
            {item.options.map((option, optionIndex) => (
              <label key={optionIndex} className="mc-option">
                <input type="radio" name={`mc-${index}`} disabled />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {item.answer && <div className="resource-card-answer">Respuesta correcta: {item.answer}</div>}
        </article>
      ))}
    </div>
  )
}

export const WordSearchGrid = ({ words, grid }: { words: string[]; grid: string[][] }) => {
  if (!grid.length) return null
  return (
    <div className="wordsearch-block">
      <div
        className="wordsearch-grid"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? grid.length}, 2rem)` }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((letter, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="wordsearch-cell"
            >
              {letter}
            </div>
          ))
        )}
      </div>
      {words.length > 0 && (
        <div className="wordsearch-words">
          <h4>Palabras a encontrar</h4>
          <ul>
            {words.map((word, index) => (
              <li key={index}>{normalizeWord(word)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export const CrosswordGrid = ({ entries }: { entries: CrosswordEntry[] }) => {
  if (!entries.length) return null
  return (
    <div className="crossword-block">
      <div className="crossword-template">
        {entries.map((entry) => (
          <div key={entry.number} className="crossword-row">
            <span className="crossword-number">{entry.number}</span>
            <div className="crossword-spaces">
              {Array.from({ length: entry.length }, (_, index) => (
                <span key={index} className="crossword-space" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="crossword-clues">
        <h4>Pistas</h4>
        {entries.map((entry) => (
          <div key={`clue-${entry.number}`} className="crossword-clue">
            <strong>{entry.number}.</strong> {entry.clue}
          </div>
        ))}
      </div>
    </div>
  )
}

export const MemoryCards = ({ items }: { items: MemoryCardItem[] }) => {
  if (!items.length) return null
  return (
    <div className="memory-grid">
      {items.map((item, index) => (
        <article key={`memory-${index}`} className="resource-card memory-card">
          <div className="resource-card-title">Concepto</div>
          <p>{item.concept}</p>
        </article>
      ))}
      {items.map((item, index) => (
        <article key={`memory-def-${index}`} className="resource-card memory-card">
          <div className="resource-card-title">Definición</div>
          <p>{item.definition}</p>
        </article>
      ))}
    </div>
  )
}

export const BingoCards = ({ cards }: { cards: BingoCard[] }) => {
  if (!cards.length) return null
  return (
    <div className="bingo-grid">
      {cards.map((card) => (
        <article key={card.id} className="bingo-card">
          <h4>{card.id.replace('bingo-', 'Cartón ')}</h4>
          <div className="bingo-table">
            {card.grid.map((row, rowIndex) => (
              <div key={rowIndex} className="bingo-row">
                {row.map((cell, cellIndex) => (
                  <div key={cellIndex} className="bingo-cell">{cell}</div>
                ))}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

export const ChallengeCards = ({ items }: { items: ChallengeCardItem[] }) => {
  if (!items.length) return null
  return (
    <div className="resource-grid">
      {items.map((item, index) => (
        <article key={`challenge-${index}`} className="resource-card">
          <div className="resource-card-title">{item.title || `Desafío ${index + 1}`}</div>
          <p>{item.prompt}</p>
        </article>
      ))}
    </div>
  )
}

export const RoleCards = ({ items }: { items: RoleCardItem[] }) => {
  if (!items.length) return null
  return (
    <div className="resource-grid">
      {items.map((item, index) => (
        <article key={`role-${index}`} className="resource-card">
          <div className="resource-card-title">Rol: {item.role}</div>
          {item.goal && <p><strong>Objetivo:</strong> {item.goal}</p>}
          {item.actions?.length ? (
            <ul>
              {item.actions.map((action, actionIndex) => (
                <li key={actionIndex}>{action}</li>
              ))}
            </ul>
          ) : (
            <p>Acciónes sugeridas: explicar el rol en la muestra o exposición.</p>
          )}
        </article>
      ))}
    </div>
  )
}

export const ReflectionCards = ({ items }: { items: ReflectionItem[] }) => {
  if (!items.length) return null
  return (
    <div className="resource-grid">
      {items.map((item, index) => (
        <article key={`reflection-${index}`} className="resource-card">
          <div className="resource-card-title">Reflexión</div>
          <p>{item.prompt}</p>
        </article>
      ))}
    </div>
  )
}

export const SlidePreview = ({ slides }: { slides: SlideItem[] }) => {
  if (!slides.length) return null
  return (
    <div className="slide-list">
      {slides.map((slide) => (
        <article key={`slide-${slide.number}`} className="slide-card">
          <div className="slide-header">
            <span className="slide-number">{slide.number}</span>
            <h3>{slide.title}</h3>
          </div>
          <ul className="slide-bullets">
            {slide.content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          {slide.visualSuggestion && <p className="slide-suggestion">{slide.visualSuggestion}</p>}
        </article>
      ))}
    </div>
  )
}

export const ResourceSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="resource-section">
    <div className="resource-section-header">
      <h2>{title}</h2>
    </div>
    {children}
  </section>
)

export const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="resource-header">
    <h2>{title}</h2>
    {description && <p className="muted-text">{description}</p>}
  </div>
)

export const FallbackCard = ({ title, text }: { title: string; text: unknown }) => (
  <div className="resource-card fallback-card">
    <div className="resource-card-title">{title}</div>
    <p style={{ whiteSpace: 'pre-wrap' }}>{trimText(text)}</p>
  </div>
)

export const ButtonGroup = ({ children }: { children: ReactNode }) => (
  <div className="button-group">{children}</div>
)
