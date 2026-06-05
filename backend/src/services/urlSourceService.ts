import dns from 'dns/promises'
import net from 'net'
import { load } from 'cheerio'

export type UrlSourceStatus = 'success' | 'partial' | 'failed'

export type UrlSourceResult = {
  url: string
  title?: string
  description?: string
  extractedText?: string
  sourceType?: string
  accessedAt: string
  status: UrlSourceStatus
  errorMessage?: string
}

export class UrlSourceValidationError extends Error {}

const MAX_RESPONSE_BYTES = 1024 * 1024
const MAX_REDIRECTS = 3
const REQUEST_TIMEOUT_MS = 8000
const MAX_EXTRACTED_TEXT = 6000
const MAX_DESCRIPTION = 1200

const cleanText = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)

const hasPathTraversal = (value: string) => {
  let candidate = value
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (/(?:^|[\\/])\.\.(?:[\\/]|$)/.test(candidate)) return true
    try {
      const decoded = decodeURIComponent(candidate)
      if (decoded === candidate) return false
      candidate = decoded
    } catch {
      return true
    }
  }
  return /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(candidate)
}

const isBlockedIpv4 = (address: string) => {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b] = parts
  return a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
}

const isBlockedIp = (address: string) => {
  if (net.isIPv4(address)) return isBlockedIpv4(address)
  if (!net.isIPv6(address)) return true

  const normalized = address.toLowerCase().split('%')[0]
  if (normalized.startsWith('::ffff:')) return isBlockedIpv4(normalized.slice(7))
  return normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
}

const validateHost = async (hostname: string) => {
  const normalized = hostname.toLowerCase().replace(/\.$/, '')
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    throw new UrlSourceValidationError('No se permiten URLs locales o privadas.')
  }

  if (net.isIP(normalized)) {
    if (isBlockedIp(normalized)) throw new UrlSourceValidationError('No se permiten direcciones IP privadas o reservadas.')
    return
  }

  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await dns.lookup(normalized, { all: true, verbatim: true })
  } catch {
    throw new UrlSourceValidationError('No se pudo resolver el dominio de la URL.')
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new UrlSourceValidationError('La URL resuelve a una dirección privada o reservada.')
  }
}

export const validatePublicUrl = async (input: string) => {
  const raw = input.trim()
  if (!raw) throw new UrlSourceValidationError('URL no válida.')
  if (hasPathTraversal(raw)) {
    throw new UrlSourceValidationError('La URL contiene una ruta no permitida.')
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new UrlSourceValidationError('URL no válida.')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new UrlSourceValidationError('Solo se permiten URLs http o https.')
  }
  if (url.username || url.password) {
    throw new UrlSourceValidationError('No se permiten credenciales dentro de la URL.')
  }

  await validateHost(url.hostname)
  return url
}

const readLimitedBody = async (response: Response, controller: AbortController) => {
  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error('La respuesta supera el tamaño máximo permitido.')
  if (!response.body) return Buffer.alloc(0)

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      controller.abort()
      throw new Error('La respuesta supera el tamaño máximo permitido.')
    }
    chunks.push(value)
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
}

const fetchPublicUrl = async (initialUrl: URL) => {
  let currentUrl = initialUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await validatePublicUrl(currentUrl.toString())
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/pdf,text/plain;q=0.8,*/*;q=0.2',
          'User-Agent': 'MemoriaPedagogicaDigital/1.0 URL-source-analyzer'
        }
      })

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        if (!location || redirectCount === MAX_REDIRECTS) throw new Error('La URL tiene demasiadas redirecciones.')
        await response.body?.cancel()
        currentUrl = new URL(location, currentUrl)
        continue
      }

      if (!response.ok) throw new Error(`La fuente respondió con estado ${response.status}.`)
      return {
        finalUrl: currentUrl,
        contentType: String(response.headers.get('content-type') ?? '').toLowerCase(),
        body: await readLimitedBody(response, controller)
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error('La URL tiene demasiadas redirecciones.')
}

const inferSourceType = (url: URL, contentType: string) => {
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'youtu.be' || hostname.endsWith('.youtube.com')) return 'Video'
  if ((hostname === 'docs.google.com' || hostname === 'drive.google.com') &&
    (url.pathname.includes('/document/') || url.pathname.includes('/file/'))) return 'Documento'
  if (contentType.includes('application/pdf')) return 'Documento PDF'
  if (contentType.includes('text/html')) return 'Página web'
  return 'Recurso web'
}

const analyzeHtml = (html: string) => {
  const $ = load(html)
  $('script, style, nav, footer, header, aside, form, svg, noscript, iframe').remove()

  const title = cleanText(
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text() ||
    $('h1').first().text(),
    220
  )
  const metaDescription = cleanText(
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content'),
    MAX_DESCRIPTION
  )
  const main = $('main, article').first()
  const root = main.length ? main : $('body')
  const textParts = root.find('h1, h2, h3, p, li')
    .map((_index, element) => cleanText($(element).text(), 500))
    .get()
    .filter((text) => text.length >= 30)
  const extractedText = cleanText(textParts.join(' '), MAX_EXTRACTED_TEXT)
  const description = metaDescription || cleanText(extractedText, MAX_DESCRIPTION)

  return { title, description, extractedText }
}

const isRestrictedGoogleDocument = (
  originalUrl: URL,
  finalUrl: URL,
  analyzed: ReturnType<typeof analyzeHtml>
) => {
  const hostname = originalUrl.hostname.toLowerCase()
  if (hostname !== 'docs.google.com' && hostname !== 'drive.google.com') return false
  if (finalUrl.hostname.toLowerCase() === 'accounts.google.com') return true

  const accessPageText = cleanText(`${analyzed.title} ${analyzed.description} ${analyzed.extractedText}`, 1800).toLowerCase()
  return [
    'sign in',
    'iniciar sesión',
    'solicitar acceso',
    'request access',
    'you need access',
    'necesitas acceso',
    'file does not exist',
    'archivo no existe'
  ].some((message) => accessPageText.includes(message))
}

export const analyzeUrlSource = async (input: string): Promise<UrlSourceResult> => {
  const accessedAt = new Date().toISOString()
  const url = await validatePublicUrl(input)

  try {
    const response = await fetchPublicUrl(url)
    const sourceType = inferSourceType(response.finalUrl, response.contentType)

    if (response.contentType.includes('text/html')) {
      const analyzed = analyzeHtml(response.body.toString('utf8'))
      if (isRestrictedGoogleDocument(url, response.finalUrl, analyzed)) {
        return {
          url: url.toString(),
          title: analyzed.title || response.finalUrl.hostname,
          sourceType,
          accessedAt,
          status: 'partial',
          errorMessage: 'No se pudo acceder automáticamente al contenido. Se guardará como fuente enlazada.'
        }
      }
      const hasUsefulText = Boolean(analyzed.description || analyzed.extractedText)
      return {
        url: url.toString(),
        title: analyzed.title || response.finalUrl.hostname,
        description: analyzed.description || undefined,
        extractedText: analyzed.extractedText || undefined,
        sourceType,
        accessedAt,
        status: hasUsefulText ? 'success' : 'partial',
        errorMessage: hasUsefulText ? undefined : 'No se encontró texto principal legible. Se guardará como fuente enlazada.'
      }
    }

    if (response.contentType.includes('text/plain')) {
      const extractedText = cleanText(response.body.toString('utf8'), MAX_EXTRACTED_TEXT)
      return {
        url: url.toString(),
        title: response.finalUrl.pathname.split('/').pop() || response.finalUrl.hostname,
        description: cleanText(extractedText, MAX_DESCRIPTION) || undefined,
        extractedText: extractedText || undefined,
        sourceType,
        accessedAt,
        status: extractedText ? 'success' : 'partial'
      }
    }

    return {
      url: url.toString(),
      title: response.finalUrl.pathname.split('/').pop() || response.finalUrl.hostname,
      sourceType,
      accessedAt,
      status: 'partial',
      errorMessage: 'No se pudo extraer texto automáticamente. Se guardará como fuente enlazada.'
    }
  } catch (error: any) {
    const isGoogleDocument = url.hostname.toLowerCase() === 'docs.google.com' ||
      url.hostname.toLowerCase() === 'drive.google.com'
    return {
      url: url.toString(),
      title: url.hostname,
      sourceType: inferSourceType(url, ''),
      accessedAt,
      status: 'failed',
      errorMessage: isGoogleDocument
        ? 'No se pudo acceder automáticamente al contenido. Se guardará como fuente enlazada.'
        : cleanText(error?.message || 'No se pudo acceder a la fuente.', 400)
    }
  }
}
