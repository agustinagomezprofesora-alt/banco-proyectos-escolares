export const reviewStatuses = ['En revisión', 'En revision']

export const isReviewStatus = (status: string) => reviewStatuses.includes(status)

export const normalizeStatus = (status: string) => {
  if (isReviewStatus(status)) return 'En revisión'
  return status
}

export const getStatusBadgeClass = (status: string) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'En revisión') return 'badge-en-revision'
  return `badge-${normalized.toLowerCase().replaceAll(' ', '-')}`
}

export const getErrorMessage = (error: any, fallback: string) => {
  if (!error) return fallback
  const message = typeof error === 'string' ? error : error.message
  if (!message || message === 'undefined') return fallback
  if (message.includes('Failed to fetch') || message.includes('fetch') || message.includes('NetworkError')) {
    return 'No se pudo conectar con el servidor.'
  }
  if (message.includes('Invalid') || message.includes('expired') || message.includes('expir')) {
    return 'La sesión expiró. Iniciá sesión nuevamente.'
  }
  if (message.includes('permiso') || message.includes('permisos')) {
    return 'No tenés permisos para realizar esta acción.'
  }
  if (message.includes('Error interno')) return fallback
  return message
}
