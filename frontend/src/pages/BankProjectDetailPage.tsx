import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPublishedProject, duplicateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'

export default function BankProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await fetchPublishedProject(Number(id))
        setProject(data)
      } catch (err: any) {
        setError(err?.message || 'No se pudo cargar el proyecto publicado')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDuplicate = async () => {
    if (!project) return
    setDuplicating(true)
    setError('')
    try {
      const copy = await duplicateProject(project.id)
      navigate(`/projects/${copy.id}/edit`)
    } catch (err: any) {
      setError(err?.message || 'No se pudo duplicar el proyecto')
    } finally {
      setDuplicating(false)
    }
  }

  if (loading) return <div className="container"><p>Cargando proyecto...</p></div>
  if (!project) return <div className="container"><p>Proyecto no encontrado</p></div>

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>{project.improvedTitle || project.title}</h1>
          <p>{project.area} · {project.course} · {project.experienceType}</p>
        </div>
        <div>
          <button onClick={() => navigate('/bank')}>Volver al banco</button>
          {user && (
            <button className="primary-btn" onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? 'Duplicando...' : 'Usar como base'}
            </button>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="detail-section">
        <h2>Resumen</h2>
        <p>{project.generatedSummary || project.description}</p>
      </section>

      <section className="detail-section">
        <h2>Datos del proyecto</h2>
        <div className="detail-grid">
          <div>
            <strong>Docente/s responsables</strong>
            <p>{project.teacher}</p>
          </div>
          <div>
            <strong>Área</strong>
            <p>{project.area}</p>
          </div>
          <div>
            <strong>Curso</strong>
            <p>{project.course}</p>
          </div>
          <div>
            <strong>Tipo de experiencia</strong>
            <p>{project.experienceType}</p>
          </div>
          <div>
            <strong>Reutilizable</strong>
            <p>{project.isReusable ? 'Sí' : 'No'}</p>
          </div>
          <div>
            <strong>Publicado</strong>
            <p>{new Date(project.createdAt).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h2>Objetivos</h2>
        <p>{project.objectives || 'No disponible'}</p>
      </section>

      <section className="detail-section">
        <h2>Actividades principales</h2>
        <p>{project.mainActivities || 'No disponible'}</p>
      </section>

      <section className="detail-section">
        <h2>Recursos utilizados</h2>
        <p>{project.resourcesUsed || 'No disponible'}</p>
      </section>

      <section className="detail-section">
        <h2>Producciones finales</h2>
        <p>{project.finalProducts || 'No disponible'}</p>
      </section>

      <section className="detail-section">
        <h2>Evidencias</h2>
        <p>{project.evidenceDescription || 'No disponible'}</p>
      </section>

      {project.link && (
        <section className="detail-section">
          <h2>Link asociado</h2>
          <a href={project.link} target="_blank" rel="noreferrer">Abrir enlace</a>
        </section>
      )}

      <section className="detail-section">
        <h2>Sugerencias de reutilización</h2>
        <p>{project.reuseSuggestions || 'No disponible'}</p>
      </section>

      <section className="detail-section">
        <h2>Recomendaciones de mejora</h2>
        <p>{project.improvementSuggestions || 'No disponible'}</p>
      </section>

      {project.suggestedTags && (
        <section className="detail-section">
          <h2>Etiquetas</h2>
          <div className="tags">
            {project.suggestedTags.split(', ').map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
