import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(3, 'Título requerido'),
  description: z.string().min(10, 'Descripción mínima de 10 caracteres'),
  teacher: z.string().min(3, 'Docente requerido'),
  course: z.string().min(2, 'Curso requerido'),
  area: z.string().min(2, 'Área requerida'),
  experienceType: z.string().min(3, 'Tipo de experiencia requerido'),
  link: z.string().url('Link inválido').optional().nullable().or(z.literal('')),
  isReusable: z.boolean().optional(),
  status: z.enum(['Cargado', 'Borrador generado', 'En revisión', 'Publicado', 'Archivado']).optional(),
  improvedTitle: z.string().optional().nullable(),
  generatedSummary: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  mainActivities: z.string().optional().nullable(),
  resourcesUsed: z.string().optional().nullable(),
  finalProducts: z.string().optional().nullable(),
  evidenceDescription: z.string().optional().nullable(),
  reuseSuggestions: z.string().optional().nullable(),
  improvementSuggestions: z.string().optional().nullable(),
  suggestedTags: z.string().optional().nullable()
})
