export interface ProjectInput {
  title: string
  description: string
  teacher: string
  course: string
  area: string
  experienceType: string
  link?: string | null
  isReusable: boolean
}

export interface GeneratedFicha {
  improvedTitle: string
  generatedSummary: string
  objectives: string
  mainActivities: string
  resourcesUsed: string
  finalProducts: string
  evidenceDescription: string
  reuseSuggestions: string
  improvementSuggestions: string
  suggestedTags: string
}

export const generateProjectFicha = async (input: ProjectInput): Promise<GeneratedFicha> => {
  // Mock generation without real AI (OpenAI, Gemini, Ollama will be integrated later)
  
  const improvedTitle = `${input.title} - ${input.area} (${input.course})`
  
  const generatedSummary = `Experiencia pedagógica desarrollada en ${input.course} dentro del área de ${input.area}. 
${input.description} 
Esta actividad fue dirigida por ${input.teacher} y forma parte de las experiencias institucionales reutilizables.`
  
  const objectives = `- Desarrollar competencias en ${input.area}
- Fortalecer habilidades colaborativas en el grupo ${input.course}
- Generar una experiencia significativa vinculada a "${input.title}"
- Documentar la experiencia como recurso institucional reutilizable`
  
  const mainActivities = `1. Presentación de la propuesta: "${input.title}"
2. Exploración inicial sobre el tema
3. Desarrollo de la experiencia según el tipo: "${input.experienceType}"
4. Sistematización de resultados
5. Reflexión grupal y metacognición`
  
  const resourcesUsed = `Responsable: ${input.teacher}
Destinatarios: ${input.course}
Área vinculada: ${input.area}
Tipo de experiencia: ${input.experienceType}
Materiales: Según se detalla en la evidencia adjunta
${input.link ? `Documentación: ${input.link}` : 'Documentación: No especificada'}`
  
  const finalProducts = `- Producción/es derivada/s de "${input.title}"
- Registro de la experiencia en el archivo institucional
- Ficha pedagógica generada como recurso institucional
- Testimonio de la experiencia en el curso ${input.course}`
  
  const evidenceDescription = `Evidencias disponibles:
${input.link ? `- Link/Carpeta: ${input.link}` : '- Link: No especificado'}
- Descripción: ${input.description}
- Contexto: ${input.area} en ${input.course}
- Responsable: ${input.teacher}`
  
  const reuseSuggestions = input.isReusable
    ? `Esta experiencia puede reutilizarse en:
- Otros cursos del mismo nivel educativo
- Años académicos posteriores
- Contextos similares en otras áreas
- Como modelo para experiencias análogas
- Adaptándose según necesidades institucionales`
    : `Esta experiencia fue registrada con fines documentales. 
Podría estudiarse la posibilidad de reutilizarla en contextos similares con las adaptaciones necesarias.`
  
  const improvementSuggestions = `- Documentar mayores detalles del proceso desarrollado
- Registrar el impacto en el aprendizaje del grupo
- Integrar más evidencias multimedia si es posible
- Sistematizar las lecciones aprendidas
- Considerar variantes para futuras implementaciones`
  
  const suggestedTags = `${input.area}, ${input.course}, ${input.experienceType}, Experiencia Pedagógica, ${input.isReusable ? 'Reutilizable' : 'Documentación'}`
  
  return {
    improvedTitle,
    generatedSummary,
    objectives,
    mainActivities,
    resourcesUsed,
    finalProducts,
    evidenceDescription,
    reuseSuggestions,
    improvementSuggestions,
    suggestedTags
  }
}
