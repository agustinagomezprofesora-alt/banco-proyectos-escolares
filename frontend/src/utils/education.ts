export const educationalLevelOptions = [
  'Nivel Inicial',
  'Primaria',
  'Secundaria',
  'Superior',
  'Formación Docente',
  'EPJA',
  'Otro'
]

export const educationalCycleOptions = [
  'Primer ciclo',
  'Segundo ciclo',
  'Ciclo básico',
  'Ciclo orientado',
  'Adultos',
  'Superior',
  'No corresponde'
]

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const suggestEducationalCycle = (educationalLevel: string, course: string) => {
  const level = normalize(educationalLevel)
  const courseNumber = Number(course.match(/\d+/)?.[0] ?? 0)

  if (level.includes('epja')) return 'Adultos'
  if (level.includes('superior') || level.includes('formacion docente')) return 'Superior'
  if (level.includes('nivel inicial') || level === 'otro') return 'No corresponde'
  if (level.includes('secundaria')) {
    if (courseNumber >= 1 && courseNumber <= 3) return 'Ciclo básico'
    if (courseNumber >= 4 && courseNumber <= 6) return 'Ciclo orientado'
  }
  if (level.includes('primaria')) {
    if (courseNumber >= 1 && courseNumber <= 3) return 'Primer ciclo'
    if (courseNumber >= 4) return 'Segundo ciclo'
  }

  return ''
}

type EducationalTarget = {
  course: string
  educationalLevel: string
  educationalCycle: string
}

export const updateEducationalTarget = <T extends EducationalTarget>(
  current: T,
  patch: Partial<Pick<EducationalTarget, 'course' | 'educationalLevel'>>
): T => {
  const previousSuggestion = suggestEducationalCycle(current.educationalLevel, current.course)
  const next = { ...current, ...patch }
  if (!current.educationalCycle || current.educationalCycle === previousSuggestion) {
    next.educationalCycle = suggestEducationalCycle(next.educationalLevel, next.course)
  }
  return next
}
