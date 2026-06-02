import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProject, fetchProject, updateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'

const initialState = {
  title: '',
  description: '',
  teacher: '',
  course: '',
  area: '',
  experienceType: '',
  link: '',
  isReusable: false,
  status: 'Cargado'
}

export default function ProjectFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'author'>>(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isEdit = Boolean(id)

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
          status: data.status
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
      navigate('/projects')
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el proyecto')
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>{isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>
        <button onClick={() => navigate('/projects')}>Volver</button>
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
        <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar proyecto'}</button>
      </form>
    </div>
  )
}
