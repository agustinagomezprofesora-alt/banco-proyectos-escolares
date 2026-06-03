import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPublishedProjects } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { Project } from '../types'
import { getErrorMessage } from '../utils/ui'

export default function BankPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('all')
  const [course, setCourse] = useState('all')
  const [experienceType, setExperienceType] = useState('all')
  const [isReusable, setIsReusable] = useState('all')
  const [year, setYear] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hasFilters = Boolean(search || area !== 'all' || course !== 'all' || experienceType !== 'all' || isReusable !== 'all' || year !== 'all')

  const loadProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPublishedProjects({ search, area, course, experienceType, isReusable, year })
      setProjects(data)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron cargar los proyectos.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [area, course, experienceType, isReusable, year])

  const areas = useMemo(() => Array.from(new Set(projects.map((project) => project.area))).sort(), [projects])
  const courses = useMemo(() => Array.from(new Set(projects.map((project) => project.course))).sort(), [projects])
  const experienceTypes = useMemo(() => Array.from(new Set(projects.map((project) => project.experienceType))).sort(), [projects])
  const years = useMemo(
    () => Array.from(new Set(projects.map((project) => new Date(project.createdAt).getFullYear().toString()))).sort(),
    [projects]
  )

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Banco de proyectos</h1>
          <p>Explorá proyectos publicados disponibles para adaptar y compartir.</p>
        </div>
        {user && <button className="primary-btn" onClick={() => navigate('/projects/new')}>Cargar nueva experiencia</button>}
      </header>

      <div className="bank-controls">
        <div className="bank-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, área, curso, docente o palabra clave"
          />
          <button type="button" onClick={loadProjects} disabled={loading}>Buscar</button>
        </div>

        <div className="bank-filters">
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">Todas las áreas</option>
            {areas.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="all">Todos los cursos</option>
            {courses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={experienceType} onChange={(e) => setExperienceType(e.target.value)}>
            <option value="all">Todos los tipos</option>
            {experienceTypes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={isReusable} onChange={(e) => setIsReusable(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="true">Reutilizable</option>
            <option value="false">No reutilizable</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">Todos los años</option>
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p>Cargando proyectos...</p>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>{hasFilters ? 'No se encontraron proyectos con esos filtros.' : 'Todavía no hay proyectos en esta sección.'}</p>
          {user && <button className="primary-btn" onClick={() => navigate('/projects/new')}>Cargar nueva experiencia</button>}
        </div>
      ) : (
        <div className="bank-grid">
          {projects.map((project) => (
            <article key={project.id} className="bank-card">
              <div className="bank-card-header">
                <h2>{project.improvedTitle || project.title}</h2>
                <span className="badge badge-publicado">Publicado</span>
              </div>
              <p>{project.generatedSummary || project.description}</p>
              <div className="bank-card-meta">
                <span>{project.area}</span>
                <span>{project.course}</span>
                <span>{project.experienceType}</span>
                <span>{project.isReusable ? 'Reutilizable' : 'No reutilizable'}</span>
              </div>
              <button className="btn-view" onClick={() => navigate(`/bank/${project.id}`)}>Ver ficha</button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
