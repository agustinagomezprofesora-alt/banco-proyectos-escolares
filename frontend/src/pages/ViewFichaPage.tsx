import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProject, submitProjectReview, updateProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'

export default function ViewFichaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [editData, setEditData] = useState<Partial<Project>>({})

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const data = await fetchProject(Number(id))
        setProject(data)
        setEditData(data)
      } catch (err: any) {
        setError(err?.message || 'No se pudo cargar el proyecto')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project) return

    setSaving(true)
    try {
      const updated = await updateProject(project.id, editData)
      setProject(updated)
      setEditing(false)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container"><p>Cargando...</p></div>
  if (!project) return <div className="container"><p>Proyecto no encontrado</p></div>
  if (user?.role !== 'ADMIN' && user?.id !== project.author.id) {
    return <div className="container"><p>No tienes permiso para ver este proyecto</p></div>
  }

  return (
    <div className="container">
      <header className="header">
        <h1>{project.improvedTitle || project.title}</h1>
        <div>
          <button onClick={() => navigate('/projects')}>Volver</button>
          {project.status === 'Borrador generado' && (
            <button onClick={() => setEditing(!editing)}>
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          )}
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {editing ? (
        <form onSubmit={handleSave} className="form-ficha-edit">
          <label>
            Título mejorado
            <input
              value={editData.improvedTitle || ''}
              onChange={(e) => setEditData({ ...editData, improvedTitle: e.target.value })}
            />
          </label>
          <label>
            Resumen institucional
            <textarea
              value={editData.generatedSummary || ''}
              onChange={(e) => setEditData({ ...editData, generatedSummary: e.target.value })}
            />
          </label>
          <label>
            Objetivos
            <textarea
              value={editData.objectives || ''}
              onChange={(e) => setEditData({ ...editData, objectives: e.target.value })}
            />
          </label>
          <label>
            Actividades principales
            <textarea
              value={editData.mainActivities || ''}
              onChange={(e) => setEditData({ ...editData, mainActivities: e.target.value })}
            />
          </label>
          <label>
            Recursos utilizados
            <textarea
              value={editData.resourcesUsed || ''}
              onChange={(e) => setEditData({ ...editData, resourcesUsed: e.target.value })}
            />
          </label>
          <label>
            Producciones finales
            <textarea
              value={editData.finalProducts || ''}
              onChange={(e) => setEditData({ ...editData, finalProducts: e.target.value })}
            />
          </label>
          <label>
            Descripción de evidencias
            <textarea
              value={editData.evidenceDescription || ''}
              onChange={(e) => setEditData({ ...editData, evidenceDescription: e.target.value })}
            />
          </label>
          <label>
            Sugerencias de reutilización
            <textarea
              value={editData.reuseSuggestions || ''}
              onChange={(e) => setEditData({ ...editData, reuseSuggestions: e.target.value })}
            />
          </label>
          <label>
            Sugerencias de mejora
            <textarea
              value={editData.improvementSuggestions || ''}
              onChange={(e) => setEditData({ ...editData, improvementSuggestions: e.target.value })}
            />
          </label>
          <label>
            Etiquetas sugeridas
            <input
              value={editData.suggestedTags || ''}
              onChange={(e) => setEditData({ ...editData, suggestedTags: e.target.value })}
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      ) : (
        <div className="ficha-view">
          <section>
            <h2>Resumen institucional</h2>
            <p>{project.generatedSummary}</p>
          </section>

          <section>
            <h2>Objetivos</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.objectives}</p>
          </section>

          <section>
            <h2>Actividades principales</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.mainActivities}</p>
          </section>

          <section>
            <h2>Recursos utilizados</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.resourcesUsed}</p>
          </section>

          <section>
            <h2>Producciones finales</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.finalProducts}</p>
          </section>

          <section>
            <h2>Evidencias</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.evidenceDescription}</p>
          </section>

          <section>
            <h2>Sugerencias de reutilización</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.reuseSuggestions}</p>
          </section>

          <section>
            <h2>Sugerencias de mejora</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.improvementSuggestions}</p>
          </section>

          {project.suggestedTags && (
            <section>
              <h2>Etiquetas</h2>
              <div className="tags">
                {project.suggestedTags.split(', ').map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {project.status === 'Borrador generado' && (
            <div className="button-group">
              <button onClick={() => setEditing(true)}>Editar ficha</button>
              <button onClick={() => {
                submitProjectReview(project.id)
                  .then(() => navigate('/projects'))
                  .catch((err) => setError(err?.message || 'Error enviando a revisión'))
              }}>
                Enviar a revisión
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
