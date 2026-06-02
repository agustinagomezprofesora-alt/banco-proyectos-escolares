import { User, Project } from '../types'

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
