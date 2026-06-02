import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password
    }
  })

  await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Proyecto Inicial de Memoria Pedagógica',
      description: 'Un proyecto de ejemplo para la memoria institucional con datos mínimos y carga rápida.',
      teacher: 'Dirección Escuela',
      course: 'Todos los cursos',
      area: 'Gestión Institucional',
      experienceType: 'Proyecto Escolar',
      link: 'https://example.com/documento',
      isReusable: true,
      status: 'Publicado',
      authorId: admin.id
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
