import { InstitutionSettings, Project, ProjectFile, ProjectLink, ProjectStats } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

const getToken = () => localStorage.getItem('memoria_token')

const clearSession = () => {
  localStorage.removeItem('memoria_token')
  localStorage.removeItem('memoria_user')
}

const buildHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (includeAuth && token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const buildAuthHeaders = () => {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const friendlyMessage = (message?: string) => {
  if (!message) return 'Ocurrió un error inesperado.'
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'No se pudo conectar con el servidor.'
  if (message.includes('Invalid') || message.includes('expired') || message.includes('Authorization')) {
    return 'La sesión expiró. Iniciá sesión nuevamente.'
  }
  if (message.includes('permiso') || message.includes('permisos')) return 'No tenés permisos para realizar esta acción.'
  if (message.includes('Error interno')) return 'No se pudo completar la acción. Intentá nuevamente.'
  return message
}

const request = async <T>(path: string, options: RequestInit = {}, includeAuth = true): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...buildHeaders(includeAuth), ...((options.headers || {}) as Record<string, string>) }
    })
    const text = await response.text()
    let payload: any = {}
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = { message: text }
      }
    }

    if (!response.ok) {
      if (response.status === 401 && includeAuth) {
        clearSession()
        sessionStorage.setItem('memoria_session_message', 'La sesión expiró. Iniciá sesión nuevamente.')
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      }
      throw { ...payload, message: friendlyMessage(payload?.message) }
    }

    return payload as T
  } catch (error: any) {
    if (error?.message) {
      throw { ...error, message: friendlyMessage(error.message) }
    }
    throw { message: 'No se pudo conectar con el servidor.' }
  }
}

export const authRegister = (payload: { name: string; email: string; password: string }) =>
  request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }, false)

export const authLogin = (payload: { email: string; password: string }) =>
  request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }, false)

export const fetchProjects = () => request<Project[]>('/projects')

export const fetchProject = (id: number) => request<Project>(`/projects/${id}`)

export const createProject = (payload: Partial<Project>) =>
  request<Project>('/projects', { method: 'POST', body: JSON.stringify(payload) })

export const updateProject = (id: number, payload: Partial<Project>) =>
  request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) })

export const deleteProject = (id: number) =>
  request<Record<string, never>>(`/projects/${id}`, { method: 'DELETE' })

export const fetchPublishedProjects = (params?: {
  search?: string
  area?: string
  course?: string
  experienceType?: string
  isReusable?: string
  year?: string
}) => {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.area) query.set('area', params.area)
  if (params?.course) query.set('course', params.course)
  if (params?.experienceType) query.set('experienceType', params.experienceType)
  if (params?.isReusable) query.set('isReusable', params.isReusable)
  if (params?.year) query.set('year', params.year)

  return request<Project[]>(`/projects/published${query.toString() ? `?${query.toString()}` : ''}`, {}, false)
}

export const fetchPublishedProject = (id: number) =>
  request<Project>(`/projects/published/${id}`, {}, false)

export const duplicateProject = (id: number) =>
  request<Project>(`/projects/${id}/duplicate`, { method: 'POST' })

export const generateFicha = (id: number) =>
  request<Project>(`/projects/${id}/generate`, { method: 'POST' })

export const submitProjectReview = (id: number) =>
  request<Project>(`/projects/${id}/submit-review`, { method: 'POST' })

export const publishProject = (id: number) =>
  request<{ message: string; project: Project }>(`/projects/${id}/publish`, { method: 'POST' })

export const archiveProject = (id: number) =>
  request<{ message: string; project: Project }>(`/projects/${id}/archive`, { method: 'POST' })

export const fetchStats = () => request<ProjectStats>('/stats')

export const fetchSettings = () => request<InstitutionSettings>('/settings')

export const updateSettings = (payload: Partial<InstitutionSettings>) =>
  request<InstitutionSettings>('/settings', { method: 'PUT', body: JSON.stringify(payload) })

export const fetchProjectLinks = (projectId: number) =>
  request<ProjectLink[]>(`/projects/${projectId}/links`)

export const createProjectLink = (projectId: number, payload: { label: string; url: string }) =>
  request<ProjectLink>(`/projects/${projectId}/links`, { method: 'POST', body: JSON.stringify(payload) })

export const deleteProjectLink = (id: number) =>
  request<Record<string, never>>(`/links/${id}`, { method: 'DELETE' })

export const fetchProjectFiles = (projectId: number) =>
  request<ProjectFile[]>(`/projects/${projectId}/files`)

export const uploadProjectFile = async (projectId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: formData
    })

    const text = await response.text()
    let payload: any = {}
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = { message: text }
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearSession()
        sessionStorage.setItem('memoria_session_message', 'La sesión expiró. Iniciá sesión nuevamente.')
        window.location.assign('/login')
      }

      throw { message: friendlyMessage(payload?.message || 'No se pudo subir el archivo.') }
    }

    return payload as ProjectFile
  } catch (error: any) {
    if (error?.message) throw { ...error, message: friendlyMessage(error.message) }
    throw { message: 'No se pudo subir el archivo.' }
  }
}

export const deleteProjectFile = (id: number) =>
  request<Record<string, never>>(`/files/${id}`, { method: 'DELETE' })

export const getFileUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE.replace('/api', '')}${url}`
}

export const downloadProjectPdf = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE}/projects/${id}/pdf`, {
      headers: buildHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        clearSession()
        sessionStorage.setItem('memoria_session_message', 'La sesión expiró. Iniciá sesión nuevamente.')
        window.location.assign('/login')
      }

      const text = await response.text()
      let payload: any = {}
      try {
        payload = text ? JSON.parse(text) : {}
      } catch {
        payload = { message: text }
      }
      throw { message: friendlyMessage(payload?.message || 'No se pudo descargar el PDF.') }
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ficha-proyecto-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    if (error?.message) throw error
    throw { message: 'No se pudo descargar el PDF.' }
  }
}
