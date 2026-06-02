import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/ui'

export default function NewProjectPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    teacher: user?.name ?? '',
    course: '',
    area: '',
    experienceType: '',
    description: '',
    link: '',
    isReusable: false
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createProject({ ...form, link: form.link || null, status: 'Cargado' } as any)
      navigate('/projects')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo guardar el proyecto.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Cargar nueva experiencia</h1>
          <p>Registrá los datos básicos para generar luego la ficha institucional.</p>
        </div>
        <button onClick={() => navigate('/projects')}>Cancelar</button>
      </header>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Título del proyecto
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          Docente responsable
          <input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} required />
        </label>
        <label>
          Curso o grupo
          <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required />
        </label>
        <label>
          Área o materia
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />
        </label>
        <label>
          Tipo de experiencia
          <select value={form.experienceType} onChange={(e) => setForm({ ...form, experienceType: e.target.value })} required>
            <option value="">Seleccionar...</option>
            <option value="Proyecto pedagógico">Proyecto pedagógico</option>
            <option value="Secuencia didáctica">Secuencia didáctica</option>
            <option value="Taller">Taller</option>
            <option value="Feria">Feria</option>
            <option value="Producción audiovisual">Producción audiovisual</option>
            <option value="Muestra">Muestra</option>
            <option value="Acto escolar">Acto escolar</option>
            <option value="Otro">Otro</option>
          </select>
        </label>
        <label>
          Descripción breve
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </label>
        <label>
          Link de evidencia
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} type="url" />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.isReusable} onChange={(e) => setForm({ ...form, isReusable: e.target.checked })} />
          Esta experiencia puede reutilizarse en otros contextos.
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Guardando cambios...' : 'Guardar experiencia'}</button>
      </form>
    </div>
  )
}
