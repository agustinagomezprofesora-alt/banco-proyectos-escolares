import { useEffect, useRef, useState } from 'react'
import { enrichProjectContext, fetchWebSearchStatus } from '../api/api'
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

  return (
    <section className="ficha-view">
      <h2>Fuentes consultadas</h2>
      <p className="muted-text">
        Se priorizan fuentes educativas, académicas, gubernamentales y organizaciones reconocidas. Las notas son breves y requieren revisión humana.
      </p>

      {canSearch && (
        <div className="button-group">
          <button
            type="button"
            className="btn-generate"
            onClick={handleSearch}
            disabled={searching || loadingProviderStatus || Boolean(providerStatus && providerStatus.configurationState !== 'ready')}
          >
            {searching ? 'Buscando fuentes educativas...' : loadingProviderStatus ? 'Revisando configuración...' : 'Buscar fuentes educativas'}
          </button>
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
          <div className="success">Las fuentes pertinentes al tema se usarán para enriquecer la generación.</div>
          <div className="resource-grid">
            {sources.map((source) => (
              <article className="resource-card" key={source.id ?? source.url}>
                <div className="resource-card-title">{source.title}</div>
                {source.sourceType && <p className="muted-text">{source.sourceType}</p>}
                <p>{source.note || source.snippet || 'Sin resumen breve disponible.'}</p>
                <p><a href={source.url} target="_blank" rel="noreferrer">{source.url}</a></p>
                <p className="muted-text">Consultado el {formatAccessedAt(source.accessedAt)}</p>
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
