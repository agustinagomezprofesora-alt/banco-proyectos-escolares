export const activityOrientationOptions = [
  { value: '', label: 'Sin definir' },
  { value: 'practical', label: 'Práctica' },
  { value: 'theoretical', label: 'Teórica' },
  { value: 'mixed', label: 'Mixta' }
] as const

export const activityOrientationHelpText =
  'Si no seleccionás una orientación, el sistema generará actividades con el criterio general actual.'

export const getActivityOrientationLabel = (value?: string | null) =>
  activityOrientationOptions.find((option) => option.value === value)?.label ?? 'Sin definir'
