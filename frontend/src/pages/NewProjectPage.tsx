import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function NewProjectPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
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
    additionalLink: '',
    observations: '',
    isReusable: false,
    reuseComment: ''
  })

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!form.title.trim()) {
        setError('Título es obligatorio')
        return false
      }
      if (!form.teacher.trim()) {
        setError('Docente es obligatorio')
        return false
      }
      if (!form.course.trim()) {
        setError('Curso es obligatorio')
        return false
      }
      if (!form.area.trim()) {
        setError('Área es obligatoria')
        return false
      }
      if (!form.experienceType.trim()) {
        setError('Tipo de experiencia es obligatorio')
        return false
      }
    }

    if (currentStep === 2) {
      if (!form.description.trim()) {
        setError('Descripción breve es obligatoria')
        return false
      }
      if (form.link && !isValidUrl(form.link)) {
        setError('Link de evidencia debe ser una URL válida')
        return false
      }
      if (form.additionalLink && !isValidUrl(form.additionalLink)) {
        setError('Link adicional debe ser una URL válida')
        return false
      }
    }

    setError('')
    return true
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateStep(3)) return

    setLoading(true)
    try {
      await createProject({
        title: form.title,
        description: form.description,
        teacher: form.teacher,
        course: form.course,
        area: form.area,
        experienceType: form.experienceType,
        link: form.link || null,
        isReusable: form.isReusable,
        status: 'Cargado'
      })
      navigate('/projects')
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar el proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Cargar Nueva Experiencia</h1>
        <button onClick={() => navigate('/projects')}>Cancelar</button>
      </header>

      <div className="form-steps">
        <div className="step-indicator">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
            >
              {s}
            </div>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Paso 1: Datos básicos */}
          {step === 1 && (
            <div className="step-content">
              <h2>Paso 1: Datos Básicos</h2>
              <label>
                Título del proyecto *
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  type="text"
                  placeholder="Ej: Proyecto de huerta escolar"
                  required
                />
              </label>
              <label>
                Docente/s responsable/s *
                <input
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                  type="text"
                  placeholder="Ej: Mgter. Juan Pérez"
                  required
                />
              </label>
              <label>
                Curso o grupo *
                <input
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  type="text"
                  placeholder="Ej: 5to grado B"
                  required
                />
              </label>
              <label>
                Área o materia *
                <input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  type="text"
                  placeholder="Ej: Ciencias Naturales"
                  required
                />
              </label>
              <label>
                Tipo de experiencia *
                <select
                  value={form.experienceType}
                  onChange={(e) => setForm({ ...form, experienceType: e.target.value })}
                  required
                >
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
              <div className="button-group">
                <button type="button" onClick={handleNext}>
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Descripción y evidencias */}
          {step === 2 && (
            <div className="step-content">
              <h2>Paso 2: Descripción y Evidencias</h2>
              <label>
                Descripción breve *
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe brevemente la experiencia (máx. 300 caracteres)"
                  required
                />
              </label>
              <label>
                Link a carpeta, archivo o evidencia
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  type="url"
                  placeholder="Ej: https://drive.google.com/..."
                />
              </label>
              <label>
                Link adicional (opcional)
                <input
                  value={form.additionalLink}
                  onChange={(e) => setForm({ ...form, additionalLink: e.target.value })}
                  type="url"
                  placeholder="Ej: https://..."
                />
              </label>
              <label>
                Observaciones (opcional)
                <textarea
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  placeholder="Notas adicionales sobre la experiencia"
                />
              </label>
              <div className="button-group">
                <button type="button" onClick={handlePrevious}>
                  Anterior
                </button>
                <button type="button" onClick={handleNext}>
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Reutilización */}
          {step === 3 && (
            <div className="step-content">
              <h2>Paso 3: Reutilización</h2>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isReusable}
                  onChange={(e) => setForm({ ...form, isReusable: e.target.checked })}
                />
                ¿Esta experiencia puede reutilizarse en otros contextos?
              </label>
              <label>
                Comentario sobre reutilización (opcional)
                <textarea
                  value={form.reuseComment}
                  onChange={(e) => setForm({ ...form, reuseComment: e.target.value })}
                  placeholder="¿Cómo y en qué contextos podría reutilizarse?"
                />
              </label>
              <div className="button-group">
                <button type="button" onClick={handlePrevious}>
                  Anterior
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Experiencia'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
