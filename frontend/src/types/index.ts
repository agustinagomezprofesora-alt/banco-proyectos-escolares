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
  educationalLevel?: string | null
  educationalCycle?: string | null
  activityOrientation?: 'practical' | 'theoretical' | 'mixed' | null
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
  quizQuestions?: string | null
  trueFalse?: string | null
  multipleChoice?: string | null
  wordSearch?: string | null
  crossword?: string | null
  memoryGame?: string | null
  bingoConcepts?: string | null
  challengeCards?: string | null
  rolePlayingGame?: string | null
  reflectionGame?: string | null
  presentationTitle?: string | null
  presentationSubtitle?: string | null
  slides?: string | null
  oralScript?: string | null
  visualSuggestions?: string | null
  closingMessage?: string | null
  links?: ProjectLink[]
  files?: ProjectFile[]
  sources?: ProjectSource[]
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
  sourceUsage?: 'web' | 'internal'
}

export interface ProjectLink {
  id: number
  projectId: number
  label: string
  url: string
  createdAt: string
}

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

export interface ProjectSource {
  id?: number
  projectId?: number
  title: string
  url: string
  snippet?: string | null
  note?: string | null
  sourceType?: string | null
  accessedAt: string
  createdAt?: string
}

export type WebSearchProvider = 'none' | 'wikipedia' | 'tavily' | 'brave' | 'serpapi'
export type WebSearchConfigurationState = 'disabled' | 'ready' | 'missing_api_key'

export interface WebSearchStatus {
  provider: WebSearchProvider
  enabled: boolean
  requiresApiKey: boolean
  hasRequiredKey: boolean
  configurationState: WebSearchConfigurationState
  message: string
}

export interface EnrichedProjectContextResponse {
  query: string
  provider: WebSearchProvider
  searchPerformed: boolean
  configurationState: WebSearchConfigurationState
  sources: ProjectSource[]
  context: unknown
  sourceUsage: 'web' | 'internal'
  message: string
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
