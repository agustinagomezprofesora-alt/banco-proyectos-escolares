import { FormEvent, useEffect, useRef, useState } from 'react'
import { addProjectUrlSource, deleteProjectSource, enrichProjectContext, fetchWebSearchStatus } from '../api/api'
import { ProjectSource, WebSearchStatus } from '../types'
import { getErrorMessage } from '../utils/ui'

type ProjectSourcesSectionProps = {
  projectId: number
  initialSources?: ProjectSource[]
  canSearch?: boolean
  onSourcesUpdated?: (sources: ProjectSource[]) => void
}

const formatAccessedAt = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-AR')
}

const sourceStatusLabel = (source: ProjectSource) => {
  if (source.status === 'success') return 'Fuente analizada correctamente'
  if (source.status === 'partial') return 'Fuente agregada parcialmente'
  if (source.status === 'failed') return 'No se pudo leer automáticamente, pero se guardó el enlace'
  return ''
}

export default function ProjectSourcesSection({
  projectId,
  initialSources = [],
  canSearch = false,
  onSourcesUpdated
}: ProjectSourcesSectionProps) {
  const [sources, setSources] = useState<ProjectSource[]>(initialSources)
  const [providerStatus, setProviderStatus] = useState<WebSearchStatus | null>(null)
  const [loadingProviderStatus, setLoadingProviderStatus] = useState(canSearch)
  const [searching, setSearching] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [sourceType, setSourceType] = useState('Página web')
  const [status, setStatus] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    setSources(initialSources)
  }, [initialSources])

  useEffect(() => {
    if (!canSearch) return

    let active = true
    setLoadingProviderStatus(true)
    fetchWebSearchStatus()
      .then((response) => {
        if (active) setProviderStatus(response)
      })
      .catch(() => {
        if (active) setProviderStatus(null)
      })
      .finally(() => {
        if (active) setLoadingProviderStatus(false)
      })

    return () => {
      active = false
    }
  }, [canSearch])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleSearch = async () => {
    if (providerStatus?.configurationState === 'disabled' || providerStatus?.configurationState === 'missing_api_key') {
      setMessage(providerStatus.message)
      return
    }

    setSearching(true)
    setMessage('')
    setError('')
    const initialSearchStatus = providerStatus?.provider === 'wikipedia'
      ? 'Buscando fuentes educativas generales…'
      : 'Detectando tema del proyecto...'
    setStatus(initialSearchStatus)
    timers.current.forEach(clearTimeout)
    timers.current = [
      setTimeout(() => setStatus(providerStatus?.provider === 'wikipedia' ? initialSearchStatus : 'Buscando fuentes confiables...'), 500),
      setTimeout(() => setStatus('Analizando información encontrada...'), 1200),
      setTimeout(() => setStatus('Construyendo contexto pedagógico...'), 1900)
    ]

    try {
      const response = await enrichProjectContext(projectId)
      setSources(response.sources)
      onSourcesUpdated?.(response.sources)
      setMessage(response.message)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudieron buscar fuentes educativas.'))
    } finally {
      timers.current.forEach(clearTimeout)
      timers.current = []
      setStatus('')
      setSearching(false)
    }
  }

  const handleAddUrl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!url.trim()) {
      setError('Ingresá una URL válida.')
      return
    }

    setAnalyzing(true)
    setStatus('Analizando URL...')
    setMessage('')
    setError('')
    try {
      const response = await addProjectUrlSource(projectId, {
        url: url.trim(),
        description: description.trim() || undefined,
        sourceType
      })
      const updated = [response.source, ...sources.filter((source) => source.id !== response.source.id && source.url !== response.source.url)]
      setSources(updated)
      onSourcesUpdated?.(updated)
      setUrl('')
      setDescription('')
      setMessage(response.message)
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo acceder a la fuente.'))
    } finally {
      setStatus('')
      setAnalyzing(false)
    }
  }

  const handleDelete = async (source: ProjectSource) => {
    if (!source.id || !window.confirm(`¿Eliminar la fuente "${source.title}"?`)) return

    setDeletingId(source.id)
    setMessage('')
    setError('')
    try {
      await deleteProjectSource(projectId, source.id)
      const updated = sources.filter((item) => item.id !== source.id)
      setSources(updated)
      onSourcesUpdated?.(updated)
      setMessage('Fuente eliminada.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo eliminar la fuente.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="ficha-view">
      <h2>Fuentes consultadas</h2>
      <p className="muted-text">
        Agregá fuentes relacionadas con el proyecto. Si su contenido es accesible, se usará como referencia breve para enriquecer los materiales generados.
      </p>

      {canSearch && (
        <div className="evidence-forms">
          <form className="evidence-form" onSubmit={handleAddUrl}>
            <h3>Agregar URL de referencia</h3>
            <label>
              URL
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              placeholder="Pegá un enlace relacionado con el proyecto, por ejemplo una página educativa, documento, video o recurso web."
                required
              />
            </label>
            <label>
              Descripción opcional
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Cómo se relaciona esta fuente con el proyecto"
              />
            </label>
            <label>
              Tipo de fuente
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="Página web">Página web</option>
                <option value="Documento">Documento</option>
                <option value="Video">Video</option>
                <option value="Recurso educativo">Recurso educativo</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <button type="submit" disabled={analyzing}>
              {analyzing ? 'Analizando URL...' : 'Agregar URL como fuente'}
            </button>
          </form>

          <div className="evidence-form">
            <h3>Búsqueda educativa automática</h3>
            <p className="muted-text">Busca fuentes educativas, académicas, gubernamentales y de organizaciones reconocidas.</p>
            <button
              type="button"
              className="btn-generate"
              onClick={handleSearch}
              disabled={searching || loadingProviderStatus || Boolean(providerStatus && providerStatus.configurationState !== 'ready')}
            >
              {searching ? 'Buscando fuentes educativas...' : loadingProviderStatus ? 'Revisando configuración...' : 'Buscar fuentes educativas'}
            </button>
          </div>
        </div>
      )}

      {canSearch && providerStatus && providerStatus.configurationState !== 'ready' && (
        <div className={providerStatus?.configurationState === 'missing_api_key' ? 'error' : 'muted-text'}>
          {providerStatus?.message}
        </div>
      )}
      {status && <div className="muted-text">{status}</div>}
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      {sources.length > 0 ? (
        <>
          <div className="success">Las fuentes legibles y pertinentes al tema se usarán para enriquecer la generación.</div>
          <div className="resource-grid">
            {sources.map((source) => (
              <article className="resource-card" key={source.id ?? source.url}>
                <div className="resource-card-title">{source.title}</div>
                {source.sourceType && <p className="muted-text">{source.sourceType}</p>}
                {sourceStatusLabel(source) && <p className="muted-text">{sourceStatusLabel(source)}</p>}
                <p>{source.description || source.summary || source.note || source.snippet || 'Sin resumen breve disponible.'}</p>
                <p><a href={source.url} target="_blank" rel="noreferrer">{source.url}</a></p>
                <p className="muted-text">Consultado el {formatAccessedAt(source.accessedAt)}</p>
                {canSearch && source.id && (
                  <button type="button" onClick={() => handleDelete(source)} disabled={deletingId === source.id}>
                    {deletingId === source.id ? 'Eliminando...' : 'Eliminar fuente'}
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="muted-text">No hay fuentes externas disponibles. Se usará contexto interno del proyecto.</div>
      )}
    </section>
  )
}
