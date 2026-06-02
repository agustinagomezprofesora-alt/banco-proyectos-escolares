import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})
