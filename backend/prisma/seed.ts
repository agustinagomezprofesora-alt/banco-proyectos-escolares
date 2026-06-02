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

  const teacher = await prisma.user.upsert({
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

  const publishedExample = await prisma.project.findFirst({
    where: { title: 'Proyecto Inicial de Memoria Pedagógica' }
  })

  if (!publishedExample) {
    await prisma.project.create({
      data: {
        title: 'Proyecto Inicial de Memoria Pedagógica',
        description: 'Una experiencia de ejemplo que demuestra cómo publicar y reutilizar un proyecto pedagógico.',
        teacher: teacher.name,
        course: '5to grado',
        area: 'Ciencias Sociales',
        experienceType: 'Proyecto pedagógico',
        link: 'https://ejemplo.local/proyecto-inicial',
        isReusable: true,
        status: 'Publicado',
        authorId: teacher.id,
        improvedTitle: 'Proyecto Inicial de Memoria Pedagógica - Ciencias Sociales',
        generatedSummary: 'Esta experiencia pedagógica publicada muestra una propuesta de trabajo en Ciencias Sociales para 5to grado con enfoque en colaboración y documentación institucional.',
        objectives: '1. Promover el pensamiento crítico con actividades de investigación.\n2. Fomentar la participación de estudiantes en producciones colaborativas.\n3. Generar evidencia didáctica con registro de trabajos.\n4. Documentar el proyecto como recurso reutilizable.',
        mainActivities: '1. Presentar la propuesta a la comunidad escolar.\n2. Desarrollar actividades de análisis histórico.\n3. Registrar resultados y producciones.\n4. Compartir evidencias en exposiciones.\n5. Evaluar el proceso y su impacto.',
        resourcesUsed: 'Recursos: material didáctico, guía docente, recursos digitales y cuaderno de registro.',
        finalProducts: 'Producciones: informe final, presentación para la escuela y poster de evidencias.',
        evidenceDescription: 'Evidencia en fichas de trabajo, fotografía de actividades y presentación final.',
        reuseSuggestions: 'Reutilizable en otras aulas de Ciencias Sociales con pequeños ajustes temáticos.',
        improvementSuggestions: 'Mejorar la documentación de evaluaciones y ampliar la participación de familias.',
        suggestedTags: 'Ciencias Sociales, 5to grado, Proyecto pedagógico, Publicado',
        observations: 'Esta versión de ejemplo facilita la creación de nuevos proyectos a partir de una base publicada.'
      }
    })
  }

  const existingSettings = await (prisma as any).institutionSettings.findFirst()
  if (!existingSettings) {
    await (prisma as any).institutionSettings.create({
      data: {
        institutionName: 'Escuela / Institución',
        appName: 'Memoria Pedagógica Digital',
        footerText: 'Ficha generada por Memoria Pedagógica Digital',
        allowPublicBank: false
      }
    })
  }

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
