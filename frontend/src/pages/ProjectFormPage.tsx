import { FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createProject, fetchProject, updateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'

const initialState = {
  title: '',
  description: '',
  teacher: '',
  course: '',
  area: '',
  experienceType: '',
  link: '',
  isReusable: false,
  status: 'Cargado',
  improvedTitle: '',
  generatedSummary: '',
  objectives: '',
  mainActivities: '',
  resourcesUsed: '',
  finalProducts: '',
  evidenceDescription: '',
  reuseSuggestions: '',
  improvementSuggestions: '',
  suggestedTags: ''
}

export default function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [project, setProject] = useState<any>(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isEdit = Boolean(id)
  const isAdmin = user?.role === 'ADMIN'
  const isAdminRoute = location.pathname.startsWith('/admin')

  const backTo = isAdminRoute && id ? `/admin/projects/${id}` : '/projects'

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchProject(Number(id))
      .then((data) => {
        setProject({
          title: data.title,
          description: data.description,
          teacher: data.teacher,
          course: data.course,
          area: data.area,
          experienceType: data.experienceType,
          link: data.link ?? '',
          isReusable: data.isReusable,
          status: data.status,
          improvedTitle: data.improvedTitle ?? '',
          generatedSummary: data.generatedSummary ?? '',
          objectives: data.objectives ?? '',
          mainActivities: data.mainActivities ?? '',
          resourcesUsed: data.resourcesUsed ?? '',
          finalProducts: data.finalProducts ?? '',
          evidenceDescription: data.evidenceDescription ?? '',
          reuseSuggestions: data.reuseSuggestions ?? '',
          improvementSuggestions: data.improvementSuggestions ?? '',
          suggestedTags: data.suggestedTags ?? ''
        })
      })
      .catch((err: any) => setError(err?.message || 'No se pudo cargar el proyecto'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      if (isEdit && id) {
        await updateProject(Number(id), project)
      } else {
        await createProject(project)
      }
      navigate(isAdminRoute && id ? `/admin/projects/${id}` : '/projects')
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el proyecto')
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>
        <button onClick={() => navigate(backTo)}>Volver</button>
      </header>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Título
          <input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} required />
        </label>
        <label>
          Descripción
          <textarea value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} required />
        </label>
        <label>
          Docente
          <input value={project.teacher} onChange={(e) => setProject({ ...project, teacher: e.target.value })} required />
        </label>
        <label>
          Curso
          <input value={project.course} onChange={(e) => setProject({ ...project, course: e.target.value })} required />
        </label>
        <label>
          Área
          <input value={project.area} onChange={(e) => setProject({ ...project, area: e.target.value })} required />
        </label>
        <label>
          Tipo de experiencia
          <input value={project.experienceType} onChange={(e) => setProject({ ...project, experienceType: e.target.value })} required />
        </label>
        <label>
          Link de evidencia
          <input value={project.link} onChange={(e) => setProject({ ...project, link: e.target.value })} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={project.isReusable} onChange={(e) => setProject({ ...project, isReusable: e.target.checked })} />
          Reutilizable
        </label>

        {isAdmin && (
          <label>
            Estado
            <select value={project.status} onChange={(e) => setProject({ ...project, status: e.target.value })}>
              <option value="Cargado">Cargado</option>
              <option value="Borrador generado">Borrador generado</option>
              <option value="En revisión">En revisión</option>
              <option value="Publicado">Publicado</option>
              <option value="Archivado">Archivado</option>
            </select>
          </label>
        )}

        {isAdmin && isEdit && (
          <fieldset className="admin-fieldset">
            <legend>Campos generados de la ficha</legend>
            <label>
              Título mejorado
              <input value={project.improvedTitle || ''} onChange={(e) => setProject({ ...project, improvedTitle: e.target.value })} />
            </label>
            <label>
              Resumen institucional
              <textarea value={project.generatedSummary || ''} onChange={(e) => setProject({ ...project, generatedSummary: e.target.value })} />
            </label>
            <label>
              Objetivos
              <textarea value={project.objectives || ''} onChange={(e) => setProject({ ...project, objectives: e.target.value })} />
            </label>
            <label>
              Actividades principales
              <textarea value={project.mainActivities || ''} onChange={(e) => setProject({ ...project, mainActivities: e.target.value })} />
            </label>
            <label>
              Recursos utilizados
              <textarea value={project.resourcesUsed || ''} onChange={(e) => setProject({ ...project, resourcesUsed: e.target.value })} />
            </label>
            <label>
              Producciones finales
              <textarea value={project.finalProducts || ''} onChange={(e) => setProject({ ...project, finalProducts: e.target.value })} />
            </label>
            <label>
              Evidencias
              <textarea value={project.evidenceDescription || ''} onChange={(e) => setProject({ ...project, evidenceDescription: e.target.value })} />
            </label>
            <label>
              Sugerencias de reutilización
              <textarea value={project.reuseSuggestions || ''} onChange={(e) => setProject({ ...project, reuseSuggestions: e.target.value })} />
            </label>
            <label>
              Sugerencias de mejora
              <textarea value={project.improvementSuggestions || ''} onChange={(e) => setProject({ ...project, improvementSuggestions: e.target.value })} />
            </label>
            <label>
              Etiquetas sugeridas
              <input value={project.suggestedTags || ''} onChange={(e) => setProject({ ...project, suggestedTags: e.target.value })} />
            </label>
          </fieldset>
        )}

        <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar proyecto'}</button>
      </form>
    </div>
  )
}
