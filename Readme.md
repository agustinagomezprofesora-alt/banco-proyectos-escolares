# Memoria Pedagógica Digital

Aplicación web para crear un banco institucional de proyectos, experiencias pedagógicas, producciones escolares y recursos reutilizables, minimizando la carga administrativa docente.

La idea central del sistema es que los docentes no tengan que completar fichas extensas. Solo deben cargar información mínima y adjuntar o enlazar materiales ya existentes. Luego, el sistema genera automáticamente una ficha institucional ordenada, clara y reutilizable mediante asistencia de inteligencia artificial.

---

## 1. Objetivo general

Desarrollar una aplicación web institucional que permita registrar, organizar, consultar, reutilizar y publicar proyectos pedagógicos escolares de manera simple, atractiva y automatizada.

El sistema debe funcionar como una memoria institucional viva, donde cada proyecto, actividad, feria, acto, muestra, producción radial, audiovisual, secuencia didáctica o experiencia interdisciplinaria pueda quedar guardada como recurso reutilizable.

---

## 2. Problema que resuelve

En las escuelas se realizan muchas experiencias valiosas, pero suelen quedar dispersas en:

- Carpetas de Drive.
- Archivos Word o PDF.
- Grupos de WhatsApp.
- Correos electrónicos.
- Fotos sueltas.
- Planificaciones individuales.
- Classroom.
- Computadoras personales.
- Memoria de docentes o directivos.

Esto provoca que los proyectos se pierdan, se repitan esfuerzos y no exista una memoria pedagógica institucional organizada.

La aplicación busca resolver ese problema sin agregar carga administrativa innecesaria.

---

## 3. Principio de diseño

La aplicación debe respetar esta regla:

> El docente no carga un proyecto desde cero. El sistema recupera lo que ya existe, lo ordena y lo convierte en una ficha institucional reutilizable.

---

## 4. Nombre de la aplicación

Nombre sugerido:

**Memoria Pedagógica Digital**

Otros nombres posibles:

- Banco Institucional de Experiencias Pedagógicas
- Repositorio Vivo de Proyectos Escolares
- Archivo Pedagógico Institucional
- Mapa de Experiencias Escolares
- Proyectos que Dejan Huella

Usar como nombre principal: **Memoria Pedagógica Digital**.

---

## 5. Tipo de aplicación

Aplicación web responsive, accesible desde navegador en:

- Computadora de escritorio.
- Notebook.
- Tablet.
- Celular.

Debe tener:

- Frontend moderno y atractivo.
- Backend con API REST.
- Base de datos.
- Sistema de autenticación.
- Panel de administración.
- Generación automática de fichas.
- Buscador y filtros.
- Exportación a PDF.
- Carga de archivos o enlaces.
- Diseño institucional, claro y simple.

---

## 6. Stack tecnológico sugerido

Usar preferentemente este stack:

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios o Fetch API
- Lucide React para íconos
- React Hook Form
- Zod para validaciones

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL o SQLite para desarrollo local
- JWT para autenticación
- Multer para carga de archivos
- Zod para validaciones
- PDFKit o Puppeteer para generación de PDF

### Base de datos

Desarrollo local:

- SQLite

Producción:

- PostgreSQL

### IA

Preparar el backend para integrarse con una API de IA.

La app debe incluir una capa de servicio llamada `aiService`, que permita más adelante conectar con:

- OpenAI API
- Gemini API
- Ollama local
- Otro modelo compatible

Al principio, si no hay API configurada, el sistema debe funcionar con generación simulada usando plantillas internas.

---

## 7. Funcionalidades principales

### 7.1 Registro rápido de experiencias

El docente debe poder cargar una experiencia mediante un formulario muy simple.

Campos mínimos:

- Título del proyecto o actividad.
- Docente/s responsable/s.
- Curso o grupo.
- Área o materia.
- Fecha o período.
- Tipo de experiencia.
- Breve descripción en una frase.
- Link a carpeta, archivo o evidencia.
- Posibilidad de adjuntar archivos.
- Indicar si puede reutilizarse.

El formulario debe ser corto, claro y usable desde celular.

---

### 7.2 Generación automática de ficha institucional

A partir de la información mínima cargada, el sistema debe generar automáticamente una ficha institucional con:

- Título mejorado.
- Resumen institucional.
- Objetivos.
- Actividades principales.
- Recursos utilizados.
- Producciones finales.
- Evidencias.
- Áreas involucradas.
- Cursos o destinatarios.
- Etiquetas sugeridas.
- Posibilidades de reutilización.
- Recomendaciones para repetir o mejorar la experiencia.

La ficha generada debe quedar en estado:

- Borrador generado automáticamente.

Luego un usuario administrador puede revisar, editar y publicar.

---

### 7.3 Estados de cada proyecto

Cada proyecto debe tener un estado:

- Cargado
- Borrador generado
- En revisión
- Publicado
- Archivado

Solo los proyectos publicados deben aparecer en el banco institucional visible para todos los usuarios.

---

### 7.4 Banco público/institucional de proyectos

Debe existir una sección visible para consultar proyectos publicados.

Debe permitir:

- Ver tarjetas de proyectos.
- Buscar por palabra clave.
- Filtrar por área.
- Filtrar por curso.
- Filtrar por tipo de experiencia.
- Filtrar por etiquetas.
- Filtrar por año.
- Ver detalle completo de cada proyecto.
- Descargar ficha PDF.
- Copiar proyecto como base para una nueva experiencia.

---

### 7.5 Panel de administración

Debe existir un panel para usuarios administradores.

Funciones:

- Ver todos los proyectos.
- Revisar proyectos cargados.
- Editar fichas generadas.
- Aprobar publicación.
- Archivar proyectos.
- Administrar etiquetas.
- Administrar áreas.
- Administrar tipos de experiencia.
- Ver estadísticas generales.
- Ver proyectos pendientes de revisión.

---

### 7.6 Roles de usuario

Implementar roles:

#### Docente

Puede:

- Crear cargas rápidas.
- Ver sus proyectos.
- Editar sus proyectos mientras no estén publicados.
- Ver proyectos publicados.
- Descargar fichas PDF.
- Copiar proyectos publicados para adaptarlos.

#### Administrador

Puede:

- Ver todos los proyectos.
- Editar cualquier proyecto.
- Aprobar o rechazar publicaciones.
- Archivar proyectos.
- Gestionar usuarios.
- Gestionar categorías.
- Ver estadísticas.

#### Visitante institucional

Puede:

- Ver proyectos publicados.
- Buscar y filtrar.
- Descargar fichas públicas si la configuración lo permite.

---

## 8. Tipos de experiencia

Crear una tabla o enumeración editable con estos valores iniciales:

- Proyecto interdisciplinario
- Secuencia didáctica
- Feria de Ciencias
- Acto escolar
- Taller
- Salida educativa
- Producción radial
- Producción audiovisual
- Revista escolar
- Muestra institucional
- Experiencia con IA
- Experiencia de lectura y escritura
- Experiencia de ciudadanía digital
- Proyecto comunitario
- Otro

---

## 9. Áreas o materias iniciales

Cargar valores iniciales:

- Lengua y Literatura
- Matemática
- Ciencias Sociales
- Ciencias Naturales
- Educación Tecnológica
- Nuevas Tecnologías
- Comunicación
- Arte
- Música
- Educación Física
- Inglés
- Formación Ética y Ciudadana
- EIS
- Taller de Ofimática
- Comercialización
- Educación Especial
- Biblioteca
- Preceptoría
- Equipo Directivo
- Interdisciplinario
- Otro

---

## 10. Etiquetas sugeridas

Crear etiquetas iniciales:

- Radio escolar
- Podcast
- IA
- Escritura
- Lectura
- Video
- Fotografía
- Identidad local
- Comunidad
- Ambiente
- Ciudadanía digital
- Feria
- Inclusión
- Accesibilidad
- Trabajo colaborativo
- ABP
- TIC
- Programación
- Robótica
- Comunicación
- Patrimonio cultural
- Trelew
- Chubut
- Producción escolar
- Evaluación
- Rúbrica

---

## 11. Modelo de datos sugerido

Usar Prisma.

### User

Campos:

- id
- name
- email
- passwordHash
- role
- createdAt
- updatedAt

Role:

- TEACHER
- ADMIN
- VIEWER

---

### Project

Campos:

- id
- title
- improvedTitle
- shortDescription
- generatedSummary
- objectives
- mainActivities
- resourcesUsed
- finalProducts
- evidenceDescription
- reuseSuggestions
- improvementSuggestions
- course
- period
- year
- status
- reusable
- createdById
- createdAt
- updatedAt
- publishedAt

Status:

- LOADED
- GENERATED_DRAFT
- IN_REVIEW
- PUBLISHED
- ARCHIVED

Relaciones:

- createdBy -> User
- areas -> ProjectArea[]
- tags -> ProjectTag[]
- files -> ProjectFile[]
- links -> ProjectLink[]
- type -> ExperienceType

---

### Area

Campos:

- id
- name
- createdAt
- updatedAt

---

### Tag

Campos:

- id
- name
- createdAt
- updatedAt

---

### ExperienceType

Campos:

- id
- name
- createdAt
- updatedAt

---

### ProjectFile

Campos:

- id
- projectId
- originalName
- storedName
- mimeType
- size
- url
- createdAt

---

### ProjectLink

Campos:

- id
- projectId
- label
- url
- createdAt

---

### ProjectArea

Tabla intermedia:

- projectId
- areaId

---

### ProjectTag

Tabla intermedia:

- projectId
- tagId

---

## 12. Diseño visual

La interfaz debe ser moderna, clara y amable.

Estilo sugerido:

- Fondo claro.
- Tarjetas con bordes suaves.
- Sombras sutiles.
- Íconos simples.
- Colores institucionales configurables.
- Tipografía legible.
- Mucho espacio en blanco.
- Diseño responsive.

Inspiración visual:

- Notion
- Google Classroom
- Linear
- Trello
- Canva educativo

Evitar una apariencia de sistema administrativo viejo.

La app debe sentirse como una herramienta escolar moderna, no como una planilla disfrazada.

---

## 13. Pantallas principales

### 13.1 Landing / Inicio

Debe mostrar:

- Nombre de la app.
- Breve explicación.
- Botón “Explorar proyectos”.
- Botón “Registrar experiencia”.
- Estadísticas simples:
  - Proyectos publicados.
  - Áreas participantes.
  - Docentes involucrados.
  - Experiencias reutilizables.

---

### 13.2 Login

Formulario:

- Email.
- Contraseña.
- Botón ingresar.

Incluir usuario administrador inicial para pruebas.

---

### 13.3 Dashboard docente

Debe mostrar:

- Botón destacado “Cargar nueva experiencia”.
- Mis proyectos.
- Estado de cada proyecto.
- Proyectos publicados recientes.
- Accesos rápidos.

---

### 13.4 Formulario de carga rápida

Formulario corto y dividido en pasos.

Paso 1: Datos básicos

- Título.
- Docentes responsables.
- Curso.
- Área.
- Tipo de experiencia.

Paso 2: Evidencias

- Descripción breve.
- Link a carpeta o archivo.
- Subida opcional de archivos.

Paso 3: Reutilización

- ¿Puede reutilizarse?
- Comentario opcional.

Al finalizar, debe aparecer un botón:

- “Generar ficha automáticamente”.

---

### 13.5 Vista de ficha generada

Mostrar la ficha institucional generada.

El usuario debe poder:

- Revisar.
- Editar.
- Guardar como borrador.
- Enviar a revisión.

---

### 13.6 Banco de proyectos

Vista tipo tarjetas.

Cada tarjeta debe mostrar:

- Título.
- Área.
- Curso.
- Tipo.
- Etiquetas.
- Resumen corto.
- Estado de reutilización.
- Botón “Ver ficha”.

---

### 13.7 Detalle de proyecto

Debe mostrar:

- Título.
- Resumen.
- Objetivos.
- Actividades principales.
- Recursos utilizados.
- Producciones finales.
- Evidencias.
- Enlaces.
- Archivos.
- Etiquetas.
- Recomendaciones de reutilización.
- Botón descargar PDF.
- Botón copiar como nuevo proyecto.

---

### 13.8 Panel administrador

Debe mostrar:

- Proyectos pendientes.
- Proyectos publicados.
- Proyectos archivados.
- Usuarios.
- Áreas.
- Etiquetas.
- Tipos de experiencia.
- Estadísticas.

---

## 14. Automatización con IA

Crear un servicio en backend:

`src/services/aiService.ts`

Debe tener una función:

```ts
generateProjectFicha(input: GenerateFichaInput): Promise<GeneratedFicha>