import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchProjects, deleteProject } from '../api/api'
import { Project } from '../types'

export default function ProjectsPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState('')

  const loadProjects = async () => {
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los proyectos')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este proyecto?')) return
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((project) => project.id !== id))
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar')
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Proyectos</h1>
          <p>Usuario: {user?.name}</p>
        </div>
        <div>
          <button onClick={() => navigate('/projects/new')}>Nuevo proyecto</button>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="card-list">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div className="meta">
              <span>{project.area} · {project.course}</span>
              <span>Estado: {project.status}</span>
            </div>
            <div className="actions">
              <button onClick={() => navigate(`/projects/${project.id}/edit`)}>Editar</button>
              <button onClick={() => handleDelete(project.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
