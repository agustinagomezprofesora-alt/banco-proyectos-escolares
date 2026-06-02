import { User, Project, ProjectStats } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

const getToken = () => localStorage.getItem('memoria_token')

const buildHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (includeAuth && token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const handleResponse = async (response: Response) => {
  const text = await response.text()
  try {
    const payload = text ? JSON.parse(text) : {}
    if (!response.ok) {
      throw payload
    }
    return payload
  } catch (error) {
    throw error
  }
}

export const authRegister = (payload: { name: string; email: string; password: string }) =>
  fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: buildHeaders(false), body: JSON.stringify(payload) }).then(handleResponse)

export const authLogin = (payload: { email: string; password: string }) =>
  fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: buildHeaders(false), body: JSON.stringify(payload) }).then(handleResponse)

export const fetchProjects = () =>
  fetch(`${API_BASE}/projects`, { headers: buildHeaders() }).then(handleResponse) as Promise<Project[]>

export const fetchProject = (id: number) =>
  fetch(`${API_BASE}/projects/${id}`, { headers: buildHeaders() }).then(handleResponse) as Promise<Project>

export const createProject = (payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'author'>) =>
  fetch(`${API_BASE}/projects`, { method: 'POST', headers: buildHeaders(), body: JSON.stringify(payload) }).then(handleResponse)

export const updateProject = (id: number, payload: Partial<Project>) =>
  fetch(`${API_BASE}/projects/${id}`, { method: 'PUT', headers: buildHeaders(), body: JSON.stringify(payload) }).then(handleResponse)

export const deleteProject = (id: number) =>
  fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE', headers: buildHeaders() }).then(handleResponse)

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

  const url = `${API_BASE}/projects/published${query.toString() ? `?${query.toString()}` : ''}`
  return fetch(url, { headers: buildHeaders(false) }).then(handleResponse) as Promise<Project[]>
}

export const fetchPublishedProject = (id: number) =>
  fetch(`${API_BASE}/projects/published/${id}`, { headers: buildHeaders(false) }).then(handleResponse) as Promise<Project>

export const duplicateProject = (id: number) =>
  fetch(`${API_BASE}/projects/${id}/duplicate`, { method: 'POST', headers: buildHeaders() }).then(handleResponse)

export const generateFicha = (id: number) =>
  fetch(`${API_BASE}/projects/${id}/generate`, { method: 'POST', headers: buildHeaders() }).then(handleResponse)

export const submitProjectReview = (id: number) =>
  fetch(`${API_BASE}/projects/${id}/submit-review`, { method: 'POST', headers: buildHeaders() }).then(handleResponse)

export const publishProject = (id: number) =>
  fetch(`${API_BASE}/projects/${id}/publish`, { method: 'POST', headers: buildHeaders() }).then(handleResponse) as Promise<{ message: string; project: Project }>

export const archiveProject = (id: number) =>
  fetch(`${API_BASE}/projects/${id}/archive`, { method: 'POST', headers: buildHeaders() }).then(handleResponse) as Promise<{ message: string; project: Project }>

export const fetchStats = () =>
  fetch(`${API_BASE}/stats`, { headers: buildHeaders() }).then(handleResponse) as Promise<ProjectStats>
