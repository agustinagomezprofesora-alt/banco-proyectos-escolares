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
  links?: ProjectLink[]
  files?: ProjectFile[]
  author: {
    id: number
    name: string
    email: string
    role: string
  }
}

export type GenerationMode = 'mock' | 'ai' | 'fallback'

export type GeneratedProjectResponse = Project & {
  generationMode?: GenerationMode
}

export interface ProjectLink {
  id: number
  projectId: number
  label: string
  url: string
  createdAt: string
}

export interface ProjectFile {
  id: number
  projectId: number
  originalName: string
  storedName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
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

export interface InstitutionSettings {
  id?: number
  institutionName: string
  appName: string
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  contactEmail?: string | null
  footerText?: string | null
  allowPublicBank: boolean
  createdAt?: string
  updatedAt?: string
}
