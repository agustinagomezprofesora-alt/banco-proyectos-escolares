import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPass = await bcrypt.hash('admin123456', 10)
  const teacherPass = await bcrypt.hash('docente123456', 10)

  await prisma.user.upsert({
    where: { email: 'admin@escuela.local' },
    update: {
      name: 'Administrador',
      passwordHash: adminPass,
      role: 'ADMIN'
    },
    create: {
      name: 'Administrador',
      email: 'admin@escuela.local',
      passwordHash: adminPass,
      role: 'ADMIN'
    }
  })

  await prisma.user.upsert({
    where: { email: 'docente@escuela.local' },
    update: {
      name: 'Docente Ejemplo',
      passwordHash: teacherPass,
      role: 'TEACHER'
    },
    create: {
      name: 'Docente Ejemplo',
      email: 'docente@escuela.local',
      passwordHash: teacherPass,
      role: 'TEACHER'
    }
  })

  console.log('Seed ejecutado correctamente.')
  console.log('Usuario admin: admin@escuela.local / admin123456')
  console.log('Usuario docente: docente@escuela.local / docente123456')
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })