# Memoria Pedagógica Digital

Aplicación web institucional para registrar, organizar, revisar, publicar, reutilizar y documentar experiencias pedagógicas escolares.

La app está pensada para escuelas que quieren conservar una **memoria institucional viva** de sus proyectos, sin cargar a los docentes con burocracia extra. El docente carga información mínima, el sistema genera una ficha institucional, permite adjuntar evidencias, enviar a revisión, publicar en un banco institucional y descargar la ficha en PDF.

---

## Estado actual del proyecto

El proyecto se encuentra en una versión funcional avanzada. Ya permite registrar experiencias pedagógicas, generar fichas institucionales, enviarlas a revisión, publicarlas en un banco institucional, duplicarlas como base, adjuntar evidencias, descargar fichas PDF y administrar proyectos desde un panel de administración.

Fases implementadas:

- **Fase 1:** Base funcional, backend, frontend, Prisma, login, roles y seed.
- **Fase 2:** Experiencia docente, carga de proyectos, generación mock de ficha y envío a revisión.
- **Fase 3:** Banco institucional, búsqueda, filtros, detalle y duplicación de proyectos.
- **Fase 4:** Panel administrador, revisión, publicación, archivo y cambio de estado.
- **Fase 5:** Estabilización visual, mejoras UX, responsive, mensajes y correcciones de contraste.
- **Fase 6:** Generación de PDF institucional funcionando correctamente.
- **Fase 7:** Evidencias, múltiples links y archivos adjuntos por proyecto.
- **Fase 8:** Configuración institucional, uso de settings en la app/PDF, respaldo local SQLite y refuerzo de seguridad en archivos.
- **Fase 9:** Integración de IA real gratuita o de bajo costo para generar fichas y actividades pedagógicas, manteniendo fallback mock.
- **Fase 10:** Generación de materiales derivados del proyecto: actividades pedagógicas, juegos educativos y presentación del proyecto, con edición previa y fallback mock.

---

## Objetivo general

Crear una aplicación web para que una escuela pueda conservar, organizar y reutilizar sus experiencias pedagógicas, proyectos interdisciplinarios, ferias, actos, talleres, salidas, producciones audiovisuales, propuestas con IA, trabajos de radio, revistas escolares y demás producciones institucionales.

La app busca que el conocimiento producido por docentes y estudiantes no quede disperso en carpetas personales, WhatsApp, archivos sueltos o memorias individuales.

---

## Principio central de diseño

> El docente no carga un proyecto desde cero. El sistema recupera lo que ya existe, lo ordena y lo convierte en una ficha institucional reutilizable.

La aplicación debe reducir trabajo, no aumentarlo.

---

## Tecnologías usadas

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Fetch API o cliente API interno
- Componentes reutilizables

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite para desarrollo local
- JWT para autenticación
- bcryptjs para hash de contraseñas
- multer para subida de archivos
- pdfkit para generación de PDF
- pptxgenjs para generación de presentaciones PowerPoint editables

### Base de datos

- SQLite en desarrollo local.
- Prisma como ORM.
- Posible migración futura a PostgreSQL.

---

## Usuarios demo

El seed inicial crea usuarios de prueba:

### Administrador

```txt
Email: admin@escuela.local
Contraseña: admin123456
Rol: ADMIN
```

### Docente

```txt
Email: docente@escuela.local
Contraseña: docente123456
Rol: TEACHER
```

No cambiar estas credenciales sin avisar, porque se usan para pruebas.

---

## Instalación local

### 1. Abrir el proyecto

```bash
cd memoria-pedagogica-digital
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configurar variables de entorno del backend

Crear un archivo `.env` dentro de `backend`.

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change_this_secret"
PORT=4000
NODE_ENV="development"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=10
AI_PROVIDER="mock"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
DEEPSEEK_API_KEY=""
DEEPSEEK_MODEL="deepseek-chat"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.1-8b-instant"
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="openrouter/free"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
OLLAMA_BASE_URL="http://localhost:11434"
INSTITUTION_NAME="Escuela / Institución"
APP_NAME="Memoria Pedagógica Digital"
```

### 4. Crear base de datos y migraciones

```bash
npx prisma migrate dev
```

### 5. Ejecutar seed

```bash
npm run seed
```

Si no existe el script, verificar que en `backend/package.json` esté:

```json
"scripts": {
  "seed": "tsx prisma/seed.ts"
},
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

### 6. Levantar backend

```bash
npm run dev
```

El backend debe quedar disponible en:

```txt
http://localhost:4000
```

---

## Frontend

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno del frontend

Crear archivo `.env` dentro de `frontend`.

```env
VITE_API_URL=http://localhost:4000/api
```

### 3. Levantar frontend

```bash
npm run dev
```

El frontend debe quedar disponible en:

```txt
http://localhost:5173
```

---

## Comandos principales

### Backend

```bash
npm install
npm run dev
npm run seed
npm run backup
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

### Frontend

```bash
npm install
npm run dev
npm run build
npm run preview
```

### Prisma Studio

Desde `backend`:

```bash
npx prisma studio
```

Permite ver y editar la base de datos desde navegador.

---

## Advertencia importante sobre migraciones

No usar este comando salvo autorización explícita:

```bash
npx prisma migrate reset
```

Ese comando borra todos los datos de la base SQLite.

Usar solamente durante desarrollo inicial o cuando sea aceptable perder los datos cargados.

Para agregar cambios al schema, usar:

```bash
npx prisma migrate dev --name nombre_de_la_migracion
```

---

## Estructura general de carpetas

```txt
memoria-pedagogica-digital/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── aiService.ts
│   │   │   ├── pdfService.ts
│   │   │   └── uploadService.ts
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── uploads/
│   ├── backups/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Modelo de datos resumido

### User

Representa a los usuarios del sistema.

Campos principales:

- id
- name
- email
- passwordHash
- role
- createdAt
- updatedAt

Roles actuales:

- ADMIN
- TEACHER

Nunca devolver `passwordHash` en respuestas del backend.

### Project

Representa una experiencia pedagógica o proyecto escolar.

Campos principales:

- id
- title
- description
- teacher
- course
- area
- experienceType
- link
- isReusable
- status
- createdAt
- updatedAt
- authorId

Campos generados por la ficha institucional, si existen:

- improvedTitle
- generatedSummary
- objectives
- mainActivities
- resourcesUsed
- finalProducts
- evidenceDescription
- reuseSuggestions
- improvementSuggestions
- suggestedTags

Campos de actividades pedagógicas, si existen:

- introActivities
- developmentActivities
- closingActivities
- assessmentCriteria
- rubric
- interdisciplinarySuggestions
- adaptations
- requiredResources
- estimatedTimeline
- studentReflectionQuestions

Campos de juegos educativos, si existen:

- quizQuestions
- trueFalse
- multipleChoice
- wordSearch
- crossword
- memoryGame
- bingoConcepts
- challengeCards
- rolePlayingGame
- reflectionGame

Campos de presentación del proyecto, si existen:

- presentationTitle
- presentationSubtitle
- slides
- oralScript
- visualSuggestions
- closingMessage

Estados usados:

- Cargado
- Borrador generado
- En revisión
- Publicado
- Archivado

### ProjectLink

Representa enlaces asociados a un proyecto.

Campos principales:

- id
- projectId
- label
- url
- createdAt

### ProjectFile

Representa archivos adjuntos de un proyecto.

Campos principales:

- id
- projectId
- originalName
- storedName
- mimeType
- size
- url
- createdAt

Los archivos se guardan localmente en:

```txt
backend/uploads
```

### InstitutionSettings

Representa la configuración institucional.

Campos principales:

- id
- institutionName
- appName
- logoUrl
- primaryColor
- secondaryColor
- contactEmail
- footerText
- allowPublicBank
- createdAt
- updatedAt

---

## Flujo docente

El docente puede:

1. Iniciar sesión.
2. Ver su dashboard.
3. Cargar una nueva experiencia.
4. Completar datos mínimos.
5. Guardar el proyecto.
6. Generar ficha institucional automáticamente.
7. Editar la ficha generada.
8. Generar actividades pedagógicas vinculadas al proyecto.
9. Generar juegos educativos vinculados al proyecto.
10. Generar una presentación atractiva del proyecto.
11. Editar la ficha y los materiales generados.
12. Agregar links y archivos como evidencias.
13. Enviar a revisión.
14. Ver sus proyectos por estado.
15. Descargar PDF de proyectos propios.
16. Descargar presentación PowerPoint editable del proyecto.
17. Usar proyectos publicados como base para una nueva experiencia.

---

## Flujo administrador

El administrador puede:

1. Iniciar sesión.
2. Acceder al panel de administración.
3. Ver todos los proyectos.
4. Filtrar por estado.
5. Revisar proyectos enviados.
6. Editar proyectos.
7. Publicar proyectos.
8. Archivar proyectos.
9. Cambiar proyectos a revisión o borrador.
10. Agregar o eliminar evidencias.
11. Descargar PDF de cualquier proyecto.
12. Descargar presentación PowerPoint de cualquier proyecto.
13. Ver proyectos publicados en el banco.
14. Gestionar configuración institucional.

---

## Banco institucional de proyectos

El banco muestra proyectos con estado:

```txt
Publicado
```

Permite:

- Ver tarjetas de proyectos.
- Buscar por palabra clave.
- Filtrar.
- Abrir detalle.
- Ver ficha completa.
- Ver evidencias.
- Descargar PDF.
- Descargar presentación PowerPoint si el usuario está logueado.
- Usar proyecto como base.

La acción **“Usar como base”** duplica un proyecto publicado y crea una copia asociada al usuario logueado con estado:

```txt
Cargado
```

---

## Generación mock de ficha institucional

La app incluye una generación automática simulada como fallback.

El servicio genera campos como:

- Título mejorado.
- Resumen institucional.
- Objetivos.
- Actividades principales.
- Recursos utilizados.
- Producciones finales.
- Evidencias.
- Sugerencias de reutilización.
- Recomendaciones de mejora.
- Etiquetas sugeridas.

## IA para fichas y actividades

La app puede generar fichas institucionales y actividades pedagógicas con asistencia de IA cuando el backend tiene proveedor y clave configurados.

Variables principales:

```env
AI_PROVIDER="mock"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
DEEPSEEK_API_KEY=""
DEEPSEEK_MODEL="deepseek-chat"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.1-8b-instant"
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="openrouter/free"
```

Valores de `AI_PROVIDER`:

- `mock`: usa siempre generación automática local.
- `gemini`: usa Gemini si `GEMINI_API_KEY` está configurada.
- `deepseek`: usa DeepSeek si `DEEPSEEK_API_KEY` está configurada.
- `groq`: usa Groq si `GROQ_API_KEY` está configurada.
- `openrouter`: usa OpenRouter si `OPENROUTER_API_KEY` está configurada.

Si falta la API key del proveedor elegido, la app usa mock. Si la API falla o devuelve una respuesta inválida, la app usa fallback mock para no romper el flujo docente.

La IA es asistiva: la ficha y las actividades generadas deben revisarse y editarse antes de enviar a revisión o usar en clase. El sistema no publica automáticamente contenido generado por IA.

## Generación de materiales derivados del proyecto

La app permite generar materiales derivados desde un proyecto cargado:

- Actividades pedagógicas.
- Juegos educativos.
- Presentación del proyecto.

Los materiales pueden generarse con IA real si el proveedor configurado está disponible. Si no hay API key, si el proveedor falla o si la respuesta no tiene JSON válido, la app usa generación mock como respaldo para no interrumpir el flujo docente.

Los juegos incluyen quiz, verdadero/falso, opción múltiple, sopa de letras, crucigrama, memotest, bingo de conceptos, tarjetas desafío, juego de roles y reflexión.

La presentación incluye título, subtítulo, estructura de diapositivas, guion oral, sugerencias visuales y mensaje de cierre.

Todo contenido generado es asistivo: debe revisarse, editarse y ajustarse antes de usarse en clase, publicarse o incorporarse al PDF institucional. La generación no publica proyectos automáticamente.

---

## PDF institucional

Cada proyecto puede descargarse como ficha PDF.

El PDF incluye:

- Nombre de la app.
- Nombre de la institución.
- Fecha de generación.
- Título del proyecto.
- Datos principales.
- Descripción.
- Ficha institucional generada.
- Actividades pedagógicas generadas, si existen.
- Juegos educativos generados, si existen.
- Presentación del proyecto generada, si existe.
- Evidencias y recursos si existen.
- Pie de página.
- Numeración correcta.

Reglas del PDF:

- No generar páginas en blanco.
- No imprimir secciones vacías.
- No mostrar `undefined`, `null`, `NaN` o `[object Object]`.
- El footer y la numeración se agregan dentro de páginas existentes.
- Si el proyecto entra en una página, el PDF debe tener una sola página.

---

## Exportación PowerPoint

Cada proyecto puede descargarse como una presentación PowerPoint editable en formato `.pptx`.

La exportación usa la dependencia backend `pptxgenjs` y el endpoint:

```txt
GET /api/projects/:id/pptx
```

La ruta requiere token JWT. Un usuario ADMIN puede descargar la presentación de cualquier proyecto. Un usuario TEACHER puede descargar presentaciones de sus propios proyectos. Los proyectos publicados también pueden descargarse por usuarios logueados.

El frontend muestra el botón **Descargar presentación PowerPoint** en:

- Vista del proyecto.
- Vista de materiales visuales.
- Vista admin del proyecto.
- Banco institucional, cuando el usuario está logueado y el proyecto está publicado.

La descarga no reemplaza el PDF institucional. Quedan separadas las acciones:

- Descargar ficha PDF.
- Ver o imprimir recursos visuales.
- Descargar presentación PowerPoint.

El archivo generado incluye una plantilla 16:9 con estilos, colores institucionales, portada, diapositivas internas, bloques laterales, pie de página y numeración. Si existen campos generados de presentación (`presentationTitle`, `presentationSubtitle`, `slides`, `oralScript`, `visualSuggestions`, `closingMessage`), se usan como base. Si no existen, se arma una presentación básica a partir de los datos del proyecto, la ficha generada, evidencias, recursos, producciones y sugerencias de reutilización.

Reglas de la exportación:

- Generar un archivo `.pptx` real, editable en PowerPoint o LibreOffice.
- No mostrar `undefined`, `null`, `NaN` ni `[object Object]`.
- Usar textos breves y entre 3 y 5 bullets por diapositiva.
- Incluir evidencias principales si hay links o archivos asociados.
- Incluir resumen de materiales generados si existen juegos o recursos visuales.

---

## Evidencias y archivos

Cada proyecto puede tener evidencias asociadas.

### Links

- Carpeta de Drive.
- Documento.
- Presentación.
- Video.
- Audio.
- Canva.
- Sitio web.

### Archivos

Se pueden subir archivos permitidos al backend local.

La app debe bloquear archivos peligrosos como:

- exe
- bat
- cmd
- ps1
- sh
- js
- ts
- html
- php
- jar
- vbs
- msi
- scr

El límite sugerido es 10 MB por archivo.

---

## Rutas principales del frontend

Rutas usadas o sugeridas:

```txt
/
/login
/dashboard
/projects
/projects/new
/projects/:id
/projects/:id/edit
/projects/:id/generated
/bank
/bank/:id
/admin
/admin/projects
/admin/projects/:id
/admin/settings
/admin/backup
```

`/admin/settings` permite a usuarios ADMIN gestionar la configuración institucional.

---

## Endpoints principales del backend

### Auth

```txt
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
```

### Projects

```txt
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id

POST /api/projects/:id/generate
POST /api/projects/:id/generate-activities
POST /api/projects/:id/generate-games
POST /api/projects/:id/generate-presentation
POST /api/projects/:id/submit-review
POST /api/projects/:id/publish
POST /api/projects/:id/archive
POST /api/projects/:id/duplicate
GET /api/projects/:id/pdf
GET /api/projects/:id/pptx
```

### Banco institucional

```txt
GET /api/projects/published
GET /api/projects/published/:id
```

### Links

```txt
GET /api/projects/:id/links
POST /api/projects/:id/links
DELETE /api/links/:id
```

### Archivos

```txt
GET /api/projects/:id/files
POST /api/projects/:id/files
DELETE /api/files/:id
```

### Settings

Requieren usuario logueado. `PUT /api/settings` requiere rol ADMIN.

```txt
GET /api/settings
PUT /api/settings
```

### Stats

Si está implementado:

```txt
GET /api/stats
```

### Backup y restauración

Requieren usuario logueado con rol ADMIN.

```txt
GET /api/admin/backup/download
POST /api/admin/backup/restore
```

---

## Seguridad y permisos

### ADMIN

Puede:

- Ver todos los proyectos.
- Editar cualquier proyecto.
- Publicar.
- Archivar.
- Gestionar evidencias.
- Descargar PDFs.
- Acceder a administración.
- Modificar configuración institucional.

### TEACHER

Puede:

- Crear proyectos.
- Ver sus proyectos.
- Editar sus proyectos según estado.
- Generar ficha.
- Enviar a revisión.
- Agregar evidencias a sus proyectos.
- Ver proyectos publicados.
- Duplicar proyectos publicados.
- Descargar PDF de sus proyectos o publicados.

### Reglas importantes

- Un docente no debe acceder al panel admin.
- Un docente no debe publicar o archivar proyectos.
- No devolver `passwordHash`.
- Validar token JWT.
- Validar permisos en backend, no solo en frontend.
- Bloquear archivos peligrosos.
- No exponer carpetas internas.

---

## Backup y restauración

Desde la app, un usuario ADMIN puede entrar a:

```txt
Administración → Respaldo
```

Para generar un backup, usar el botón **Generar y descargar backup**.

Desde `backend`:

```bash
npm run backup
```

Crea un archivo `.zip` local. Desde consola, el archivo se guarda en:

```txt
backend/backups
```

Ejemplo de nombre:

```txt
backup-memoria-pedagogica-2026-06-02-18-30.zip
```

El backup incluye:

- Base SQLite actual en `database/dev.db`.
- Carpeta `uploads` si existe.
- `metadata.json` con fecha, nombre de la app y advertencia de seguridad.

El backup no incluye:

- `.env`.
- Secretos o claves privadas.
- `node_modules`.
- `.git`.
- `dist`.
- Backups anteriores.

Para restaurar desde la app, entrar a `Administración → Respaldo`, seleccionar un archivo `.zip` generado por la app, marcar la confirmación obligatoria y escribir `RESTAURAR`. La restauración reemplaza la base de datos actual y puede modificar los archivos subidos.

Antes de restaurar, el sistema genera automáticamente un backup del estado actual con nombre:

```txt
pre-restore-YYYY-MM-DD-HH-mm.zip
```

Si la restauración se completa, puede ser necesario reiniciar el backend para que Prisma use correctamente el archivo SQLite restaurado. Conviene descargar y conservar un backup actual antes de restaurar. Luego es recomendable copiar el archivo generado a Google Drive, OneDrive o un disco externo. Este respaldo local no reemplaza backups institucionales ni políticas formales de conservación de datos.

---

## Reglas para futuras modificaciones

Antes de agregar una fase nueva:

1. Verificar que backend levanta.
2. Verificar que frontend levanta.
3. Probar login admin.
4. Probar login docente.
5. Probar dashboard.
6. Probar carga de experiencia.
7. Probar banco de proyectos.
8. Probar administración.
9. Probar PDF.
10. Probar evidencias.

Reglas obligatorias:

- No romper login.
- No cambiar credenciales demo sin avisar.
- No ejecutar `npx prisma migrate reset` salvo autorización explícita.
- No borrar datos existentes.
- No modificar `schema.prisma` sin crear migración normal.
- No devolver `passwordHash` en respuestas del backend.
- No agregar funcionalidades nuevas sin verificar que las fases anteriores sigan funcionando.
- No tocar varias áreas a la vez si el cambio es pequeño.
- Si Codex agrega una dependencia, ejecutar `npm install`.
- Si Codex agrega campos al schema, ejecutar migración y `npx prisma generate`.

---

## Pruebas manuales recomendadas

### Prueba docente

```txt
Login docente
→ Mis proyectos
→ Cargar nueva experiencia
→ Generar ficha
→ Editar ficha
→ Agregar evidencia
→ Enviar a revisión
→ Descargar PDF
```

### Prueba administrador

```txt
Login admin
→ Administración
→ Ver proyectos en revisión
→ Abrir proyecto
→ Publicar
→ Ver en Banco
→ Descargar PDF
```

### Prueba banco

```txt
Banco de proyectos
→ Buscar
→ Filtrar
→ Abrir proyecto
→ Ver evidencias
→ Usar como base
→ Confirmar copia en Mis proyectos
```

### Prueba archivos

```txt
Abrir proyecto
→ Agregar link
→ Subir archivo permitido
→ Intentar subir archivo prohibido
→ Confirmar bloqueo
```

---

## Próximas fases sugeridas

### Fase 10: Estadísticas institucionales

- Proyectos por área.
- Proyectos por curso.
- Proyectos por tipo.
- Proyectos por estado.
- Cantidad de proyectos reutilizables.
- Actividad por período.

### Fase 11: Exportación Word

- Descargar ficha en DOCX.
- Plantilla institucional editable.

### Fase 12: Integración con Google Drive

- Vincular carpetas.
- Guardar evidencias externas.
- No duplicar archivos innecesariamente.

---

## Frase guía del proyecto

> Una escuela moderna no es la que usa más plataformas, sino la que logra que el conocimiento producido por sus docentes y estudiantes no se pierda y pueda volver a circular.

---

## Nota final

Este README refleja el estado funcional avanzado del proyecto hasta la Fase 10.

Si se retoma el desarrollo con Codex, usar este README como referencia actualizada y no el plan inicial viejo.
