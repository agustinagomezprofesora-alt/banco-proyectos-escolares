export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface Project {
  id: number
  title: string
  improvedTitle?: string | null
  description: string
  generatedSummary?: string | null
  teacher: string
  course: string
  area: string
  experienceType: string
  link?: string | null
  additionalLink?: string | null
  isReusable: boolean
  status: string
  createdAt: string
  updatedAt: string
  objectives?: string | null
  mainActivities?: string | null
  resourcesUsed?: string | null
  finalProducts?: string | null
  evidenceDescription?: string | null
  reuseSuggestions?: string | null
  improvementSuggestions?: string | null
  suggestedTags?: string | null
  observations?: string | null
  author: {
    id: number
    name: string
    email: string
    role: string
  }
}

export interface ProjectStats {
  totalProjects: number
  publishedProjects: number
  pendingReview: number
  archivedProjects: number
  reusableProjects: number
  projectsByArea: Array<{ area: string; count: number }>
  projectsByType: Array<{ type: string; count: number }>
  projectsByStatus: Array<{ status: string; count: number }>
}
