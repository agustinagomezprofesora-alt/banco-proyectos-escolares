export type WebSearchProvider = 'none' | 'wikipedia' | 'tavily' | 'brave' | 'serpapi'
export type WebSearchConfigurationState = 'disabled' | 'ready' | 'missing_api_key'

export type WebSource = {
  title: string
  url: string
  snippet: string
  description?: string
  summary?: string
  sourceType?: string
  status?: 'success' | 'partial' | 'failed'
  origin?: string
  accessedAt: string
}

export type UrlSourceContext = {
  title: string
  url: string
  summary: string
  sourceType?: string
  status: 'success' | 'partial' | 'failed'
  accessedAt: string
}

export type SourceNote = {
  title: string
  url: string
  note: string
  accessedAt: string
}

export type SourceLearningSummary = {
  webSummary: string
  sourceConcepts: string[]
  sourceVocabulary: string[]
  webSources: WebSource[]
  sourceNotes: SourceNote[]
  urlSources: UrlSourceContext[]
}

type SearchProject = {
  title?: unknown
  description?: unknown
  area?: unknown
  course?: unknown
  experienceType?: unknown
}

const trustedDomains = [
  'wikipedia.org',
  'unesco.org',
  'fao.org',
  'inta.gob.ar',
  'conicet.gov.ar',
  'educ.ar',
  'argentina.gob.ar',
  'buenosaires.gob.ar',
  'scielo.org',
  'redalyc.org',
  'oei.int'
]

const blockedDomains = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'pinterest.com',
  'mercadolibre.com',
  'amazon.com'
]

const genericQueryWords = new Set([
  'actividad', 'actividades', 'curso', 'educacion', 'escolar', 'escuela', 'experiencia', 'grado', 'proyecto'
])

const stopWords = new Set([
  'para', 'como', 'desde', 'sobre', 'entre', 'esta', 'este', 'estos', 'estas', 'tambien', 'puede', 'pueden',
  'donde', 'cuando', 'porque', 'segun', 'hacia', 'hasta', 'cada', 'otros', 'otras', 'todo', 'toda', 'todos',
  'todas', 'una', 'uno', 'unos', 'unas', 'del', 'las', 'los', 'con', 'por', 'que', 'sus', 'son', 'más',
  'mas', 'fue', 'han', 'ser', 'hay', 'the', 'and', 'for', 'from', 'this', 'that', 'https', 'www'
])

const cleanText = (value: unknown, maxLength = 500) => String(value ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength)

const normalizeText = (value: unknown) => cleanText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

const safeQueryText = (value: unknown) => cleanText(value, 180)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/https?:\/\/\S+/gi, ' ')
  .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, ' ')
  .replace(/\+?\d[\d\s().-]{7,}\d/g, ' ')
  .replace(/[^\p{L}\p{N}\s°]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const providerFromEnv = (): WebSearchProvider => {
  const value = String(process.env.WEB_SEARCH_PROVIDER ?? 'none').trim().toLowerCase()
  return ['wikipedia', 'tavily', 'brave', 'serpapi'].includes(value) ? value as WebSearchProvider : 'none'
}

export const getWebSearchProviderStatus = () => {
  const provider = providerFromEnv()
  const requiresApiKey = provider === 'tavily' || provider === 'brave' || provider === 'serpapi'
  const hasRequiredKey = provider === 'tavily'
    ? Boolean(process.env.TAVILY_API_KEY?.trim())
    : provider === 'brave'
      ? Boolean(process.env.BRAVE_SEARCH_API_KEY?.trim())
      : provider === 'serpapi'
        ? Boolean(process.env.SERPAPI_API_KEY?.trim())
        : true
  const configurationState: WebSearchConfigurationState = provider === 'none'
    ? 'disabled'
    : requiresApiKey && !hasRequiredKey
      ? 'missing_api_key'
      : 'ready'
  const message = configurationState === 'disabled'
    ? 'La búsqueda web está desactivada. Se usará el contexto interno del proyecto.'
    : configurationState === 'missing_api_key'
      ? 'El proveedor de búsqueda web está configurado, pero falta la API key.'
      : provider === 'wikipedia'
        ? 'Wikipedia está configurada como fuente educativa general y no requiere API key.'
        : `El proveedor de búsqueda web ${provider} está configurado.`

  return {
    provider,
    enabled: configurationState === 'ready',
    requiresApiKey,
    hasRequiredKey,
    configurationState,
    message
  }
}

export const isTrustedEducationalSource = (url: string) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    if (blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return false
    if (trustedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) return true
    return hostname.endsWith('.edu') ||
      hostname.endsWith('.edu.ar') ||
      hostname.includes('.edu.') ||
      hostname.endsWith('.gov') ||
      hostname.endsWith('.gov.ar') ||
      hostname.includes('.gov.') ||
      hostname.endsWith('.gob') ||
      hostname.endsWith('.gob.ar') ||
      hostname.includes('.gob.') ||
      hostname.endsWith('.org') ||
      hostname.includes('.org.')
  } catch {
    return false
  }
}

const sourceDiscardReason = (source: WebSource) => {
  const title = cleanText(source.title, 180)
  const url = cleanText(source.url, 600)
  const snippet = cleanText(source.summary || source.snippet, 1200)

  if (!title) return 'sin titulo'
  if (!url) return 'sin url'
  if (!snippet) return 'sin resumen legible'

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'protocolo no permitido'
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if (blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return `dominio bloqueado: ${hostname}`
    }
    if (!isTrustedEducationalSource(url)) return `dominio no reconocido como educativo: ${hostname}`
  } catch {
    return 'url invalida'
  }

  return ''
}

const isAcceptableGeneralSource = (source: WebSource) => {
  const reason = sourceDiscardReason(source)
  return reason === '' || reason.startsWith('dominio no reconocido como educativo:')
}

export const buildSearchQueryFromProject = (project: SearchProject, keyConcepts: string[] = []) => {
  const title = safeQueryText(project.title)
  const description = safeQueryText(project.description)
  const area = safeQueryText(project.area)
  const course = safeQueryText(project.course)
  const experienceType = safeQueryText(project.experienceType)
  const normalizedInput = normalizeText(`${title} ${description} ${area} ${experienceType}`)
  const normalizedCourse = normalizeText(course)
  const improvedDescriptionWords = description
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .filter((word) => !stopWords.has(normalizeText(word)))
    .slice(0, 12)
  const contextualConcepts = [
    normalizedInput.includes('robot') ? 'robotica educativa' : '',
    normalizedInput.includes('sensor') ? 'sensores' : '',
    normalizedInput.includes('automat') ? 'automatizacion' : '',
    normalizedInput.includes('huerta') ? 'huerta escolar' : '',
    normalizedInput.includes('riego') || normalizedInput.includes('humedad') ? 'riego sensor humedad' : '',
    normalizedInput.includes('tecnolog') ? 'educacion tecnologica' : ''
  ]
  const levelHints = [
    normalizedCourse.match(/\b[1-7]\s*(ano|anio|°|º)/) || normalizedCourse.includes('secund') ? 'secundaria' : ''
  ]
  const improvedQuery = Array.from(new Set([
    title,
    ...keyConcepts.slice(0, 8).map(safeQueryText),
    ...contextualConcepts,
    area,
    ...levelHints,
    experienceType,
    ...improvedDescriptionWords,
    'educacion'
  ].filter(Boolean))).join(' ').slice(0, 260)
  if (improvedQuery) return improvedQuery

  const descriptionWords = safeQueryText(project.description)
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .slice(0, 8)

  return Array.from(new Set([
    safeQueryText(project.title),
    ...keyConcepts.slice(0, 6).map(safeQueryText),
    safeQueryText(project.area),
    safeQueryText(project.course),
    safeQueryText(project.experienceType),
    ...descriptionWords,
    'educación actividades'
  ].filter(Boolean))).join(' ').slice(0, 360)
}

const normalizeSources = (sources: WebSource[]) => {
  const unique = new Map<string, WebSource>()

  for (const source of sources) {
    const title = cleanText(source.title, 180)
    const url = cleanText(source.url, 600)
    const snippet = cleanText(source.summary || source.snippet, 1200)
    const isReadableManualSource = source.origin === 'manual_url' &&
      (source.status === 'success' || (source.status === 'partial' && Boolean(source.summary || source.snippet)))
    const isGeneralReviewSource = source.sourceType === 'Fuente general para revision' && isAcceptableGeneralSource(source)
    if (!title || !url || !snippet || (!isReadableManualSource && !isTrustedEducationalSource(url) && !isGeneralReviewSource)) continue
    if (!unique.has(url)) {
      unique.set(url, { ...source, title, url, snippet })
    }
  }

  return Array.from(unique.values())
}

const normalizeLinkedSources = (sources: WebSource[]) => {
  const unique = new Map<string, WebSource>()

  for (const source of sources) {
    const title = cleanText(source.title, 180)
    const url = cleanText(source.url, 600)
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol) || !title || unique.has(url)) continue
      unique.set(url, { ...source, title, url, snippet: cleanText(source.snippet, 1200) })
    } catch {
      continue
    }
  }

  return Array.from(unique.values())
}

const rankRelevantSources = (sources: WebSource[], query: string) => {
  const queryTerms = Array.from(new Set(
    normalizeText(query)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 4 && !stopWords.has(word) && !genericQueryWords.has(word))
  ))

  if (queryTerms.length === 0) return sources

  return sources
    .map((source) => {
      const title = normalizeText(source.title)
      const content = normalizeText(source.snippet)
      const matchedTerms = queryTerms.filter((term) => title.includes(term) || content.includes(term))
      const titleStartsWithTerm = queryTerms.some((term) => title === term || title.startsWith(`${term} `))
      const score = queryTerms.reduce((total, term) => {
        if (title.includes(term)) return total + 3
        if (content.includes(term)) return total + 1
        return total
      }, 0)
      return { source, score, isRelevant: titleStartsWithTerm || matchedTerms.length >= 2 || score >= 5 }
    })
    .filter(({ isRelevant }) => isRelevant)
    .sort((a, b) => b.score - a.score)
    .map(({ source }) => source)
    .slice(0, 6)
}

const buildFallbackSearchQueries = (query: string) => {
  const normalized = normalizeText(query)
  const terms = Array.from(new Set(
    normalized
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 4 && !stopWords.has(word) && !genericQueryWords.has(word))
  ))
  const thematicQueries = [
    normalized.includes('robot') ? 'robotica educativa' : '',
    normalized.includes('automat') ? 'automatizacion' : '',
    normalized.includes('sensor') ? 'sensor de humedad sensores' : '',
    normalized.includes('huerta') || normalized.includes('riego') ? 'huerta escolar automatizacion riego sensores' : '',
    normalized.includes('huerta') ? 'huerta escolar' : ''
  ]

  return Array.from(new Set([
    query,
    terms.slice(0, 6).join(' '),
    ...thematicQueries,
    terms.slice(0, 4).join(' '),
    terms.slice(-5).join(' ')
  ].map((item) => safeQueryText(item)).filter(Boolean))).slice(0, 7)
}

const uniqueSources = (sources: WebSource[]) => {
  const unique = new Map<string, WebSource>()

  for (const source of sources) {
    const url = cleanText(source.url, 600)
    if (!url || unique.has(url)) continue
    unique.set(url, source)
  }

  return Array.from(unique.values())
}

const logDiscardReasons = (sources: WebSource[]) => {
  const reasons = new Map<string, number>()

  for (const source of sources) {
    const reason = sourceDiscardReason(source)
    if (!reason || isAcceptableGeneralSource(source)) continue
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1)
  }

  if (reasons.size === 0) {
    console.log('[webSearch] discard reasons: none')
    return
  }

  console.log('[webSearch] discard reasons:', Object.fromEntries(reasons))
}

const normalizeSearchResults = (sources: WebSource[], query: string) => {
  const trusted: WebSource[] = []
  const acceptable: WebSource[] = []

  for (const source of sources) {
    const title = cleanText(source.title, 180)
    const url = cleanText(source.url, 600)
    const snippet = cleanText(source.summary || source.snippet, 1200)
    if (!title || !url || !snippet) continue

    const cleanSource = { ...source, title, url, snippet }
    if (isTrustedEducationalSource(url)) {
      trusted.push(cleanSource)
      continue
    }

    if (isAcceptableGeneralSource(cleanSource)) {
      acceptable.push({
        ...cleanSource,
        sourceType: 'Fuente general para revision'
      })
    }
  }

  const uniqueTrusted = uniqueSources(trusted)
  const rankedTrusted = rankRelevantSources(uniqueTrusted, query)
  const trustedResults = rankedTrusted.length ? rankedTrusted : uniqueTrusted.slice(0, 6)
  const uniqueAcceptable = uniqueSources(acceptable)
  const rankedAcceptable = rankRelevantSources(uniqueAcceptable, query)
  const acceptableResults = rankedAcceptable.length ? rankedAcceptable : uniqueAcceptable.slice(0, 6)

  return {
    trustedResults,
    acceptableResults,
    finalResults: uniqueSources([
      ...trustedResults,
      ...(trustedResults.length >= 3 ? [] : acceptableResults)
    ]).slice(0, 6)
  }
}

const searchWikipedia = async (query: string): Promise<WebSource[]> => {
  const queries = [query].filter(Boolean)
  const results: any[] = []

  for (const searchQuery of queries) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: searchQuery,
      gsrlimit: '6',
      prop: 'extracts|info',
      exintro: '1',
      explaintext: '1',
      inprop: 'url',
      redirects: '1',
      utf8: '1',
      format: 'json',
      formatversion: '2',
      origin: '*'
    })
    const response = await fetch(`https://es.wikipedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'MemoriaPedagogicaDigital/1.0 educational-source-search' }
    })
    if (!response.ok) throw new Error(`Wikipedia respondió ${response.status}`)
    const data = await response.json() as any
    results.push(...(data?.query?.pages ?? []).filter((item: any) => cleanText(item?.extract)))
  }

  const accessedAt = new Date().toISOString()

  return results.map((item: any) => ({
    title: cleanText(item?.title),
    url: cleanText(item?.fullurl) || `https://es.wikipedia.org/wiki/${encodeURIComponent(String(item?.title ?? '').replace(/\s+/g, '_'))}`,
    snippet: cleanText(item?.extract),
    sourceType: 'Wikipedia / fuente general',
    accessedAt
  }))
}

const searchTavily = async (query: string): Promise<WebSource[]> => {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 8,
      include_answer: false,
      include_raw_content: false
    })
  })
  if (!response.ok) throw new Error(`Tavily respondió ${response.status}`)
  const data = await response.json() as any
  const accessedAt = new Date().toISOString()
  return (data?.results ?? []).map((item: any) => ({
    title: cleanText(item?.title),
    url: cleanText(item?.url),
    snippet: cleanText(item?.content),
    sourceType: 'Búsqueda educativa',
    accessedAt
  }))
}

const searchBrave = async (query: string): Promise<WebSource[]> => {
  const params = new URLSearchParams({ q: query, count: '8', safesearch: 'strict' })
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY ?? ''
    }
  })
  if (!response.ok) throw new Error(`Brave Search respondió ${response.status}`)
  const data = await response.json() as any
  const accessedAt = new Date().toISOString()
  return (data?.web?.results ?? []).map((item: any) => ({
    title: cleanText(item?.title),
    url: cleanText(item?.url),
    snippet: cleanText(item?.description),
    sourceType: 'Búsqueda educativa',
    accessedAt
  }))
}

const searchSerpApi = async (query: string): Promise<WebSource[]> => {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: process.env.SERPAPI_API_KEY ?? '',
    num: '8',
    safe: 'active'
  })
  const response = await fetch(`https://serpapi.com/search.json?${params}`)
  if (!response.ok) throw new Error(`SerpAPI respondió ${response.status}`)
  const data = await response.json() as any
  const accessedAt = new Date().toISOString()
  return (data?.organic_results ?? []).map((item: any) => ({
    title: cleanText(item?.title),
    url: cleanText(item?.link),
    snippet: cleanText(item?.snippet),
    sourceType: 'Búsqueda educativa',
    accessedAt
  }))
}

export const searchEducationalSources = async (query: string): Promise<WebSource[]> => {
  const status = getWebSearchProviderStatus()
  console.log('[webSearch] provider:', status.provider)
  console.log('[webSearch] query:', query)
  if (!status.enabled || !query.trim()) {
    console.log('[webSearch] raw results:', 0)
    console.log('[webSearch] trusted results:', 0)
    console.log('[webSearch] final results:', 0)
    return []
  }

  try {
    const queries = buildFallbackSearchQueries(query)
    console.log('[webSearch] query variants:', queries)
    const rawSources: WebSource[] = []

    for (const searchQuery of queries) {
      try {
        const partialSources = status.provider === 'wikipedia'
          ? await searchWikipedia(searchQuery)
          : status.provider === 'tavily'
            ? await searchTavily(searchQuery)
            : status.provider === 'brave'
              ? await searchBrave(searchQuery)
              : status.provider === 'serpapi'
                ? await searchSerpApi(searchQuery)
                : []
        console.log('[webSearch] raw results for query:', searchQuery, partialSources.length)
        rawSources.push(...partialSources)
      } catch (error) {
        console.warn('[webSearch] query failed:', searchQuery, error)
      }
    }

    const uniqueRawSources = uniqueSources(rawSources)
    const normalized = normalizeSearchResults(uniqueRawSources, query)
    console.log('[webSearch] raw results:', uniqueRawSources.length)
    console.log('[webSearch] trusted results:', normalized.trustedResults.length)
    console.log('[webSearch] acceptable general results:', normalized.acceptableResults.length)
    console.log('[webSearch] final results:', normalized.finalResults.length)
    logDiscardReasons(uniqueRawSources)

    return normalized.finalResults
  } catch (error) {
    console.error(`No se pudieron buscar fuentes educativas con ${status.provider}.`, error)
    return []
  }
}

const extractKeywords = (sources: WebSource[]) => {
  const counts = new Map<string, { count: number; original: string }>()
  const text = sources.map((source) => `${source.title} ${source.snippet}`).join(' ')

  for (const rawWord of text.split(/[^\p{L}\p{N}]+/u)) {
    const normalized = normalizeText(rawWord)
    if (normalized.length < 5 || stopWords.has(normalized)) continue
    const current = counts.get(normalized)
    counts.set(normalized, { count: (current?.count ?? 0) + 1, original: cleanText(rawWord, 40) })
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.original.localeCompare(b.original))
    .map((item) => item.original)
    .slice(0, 12)
}

export const summarizeSourcesForLearningContext = (sources: WebSource[], relevanceQuery = ''): SourceLearningSummary => {
  const normalizedSources = normalizeSources(sources)
  const trustedSources = Array.from(new Map([
    ...normalizedSources.filter((source) => source.origin === 'manual_url'),
    ...rankRelevantSources(normalizedSources, relevanceQuery)
  ].map((source) => [source.url, source])).values())
  const sourceVocabulary = extractKeywords(trustedSources)
  const urlSources = normalizeLinkedSources(sources)
    .filter((source) => source.origin === 'manual_url')
    .map((source) => ({
      title: source.title,
      url: source.url,
      summary: source.status === 'failed' ? '' : cleanText(source.summary || source.snippet, 1200),
      sourceType: source.sourceType,
      status: source.status ?? 'partial',
      accessedAt: source.accessedAt
    }))

  return {
    webSummary: trustedSources.map((source) => `${source.title}: ${source.snippet}`).join('\n').slice(0, 2200),
    sourceConcepts: sourceVocabulary.slice(0, 8),
    sourceVocabulary,
    webSources: trustedSources,
    sourceNotes: trustedSources.map((source) => ({
      title: source.title,
      url: source.url,
      note: source.snippet,
      accessedAt: source.accessedAt
    })),
    urlSources
  }
}

export const formatSourceCitations = (sources: WebSource[]) => normalizeLinkedSources(sources).slice(0, 6).map((source) => {
  const accessedAt = new Date(source.accessedAt)
  const date = Number.isNaN(accessedAt.getTime()) ? source.accessedAt : accessedAt.toLocaleDateString('es-AR')
  return `${source.title}. ${source.url}. Consultado el ${date}.`
})
