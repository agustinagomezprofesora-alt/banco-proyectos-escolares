export interface User {
  id: number
  name: string
  email: string
}

export interface Project {
  id: number
  title: string
  description: string
  teacher: string
  course: string
  area: string
  experienceType: string
  link?: string | null
  isReusable: boolean
  status: string
  createdAt: string
  updatedAt: string
  author: {
    id: number
    name: string
    email: string
  }
}
