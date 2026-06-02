import { FormEvent, useState } from 'react'
import {
  createProjectLink,
  deleteProjectFile,
  deleteProjectLink,
  getFileUrl,
  uploadProjectFile
} from '../api/api'
import { ProjectFile, ProjectLink } from '../types'
import { getErrorMessage } from '../utils/ui'

type EvidenceSectionProps = {
  projectId: number
  initialLinks?: ProjectLink[]
  initialFiles?: ProjectFile[]
  canEdit?: boolean
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function EvidenceSection({ projectId, initialLinks = [], initialFiles = [], canEdit = false }: EvidenceSectionProps) {
  const [links, setLinks] = useState<ProjectLink[]>(initialLinks)
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const hasEvidence = links.length > 0 || files.length > 0

  const handleAddLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!label.trim()) {
      setError('La etiqueta es obligatoria.')
      return
    }

    try {
      new URL(url)
    } catch {
      setError('Ingresá una URL válida.')
      return
    }

    setAddingLink(true)
    try {
      const created = await createProjectLink(projectId, { label: label.trim(), url: url.trim() })
      setLinks((current) => [created, ...current])
      setLabel('')
      setUrl('')
      setMessage('Link agregado correctamente.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo agregar el link.'))
    } finally {
      setAddingLink(false)
    }
  }

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setError('Seleccioná un archivo para subir.')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')
    try {
      const uploaded = await uploadProjectFile(projectId, selectedFile)
      setFiles((current) => [uploaded, ...current])
      setSelectedFile(null)
      setMessage('Archivo subido correctamente.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo subir el archivo.'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteLink = async (id: number) => {
    if (!window.confirm('¿Querés eliminar este link?')) return
    setDeletingId(`link-${id}`)
    setError('')
    setMessage('')
    try {
      await deleteProjectLink(id)
      setLinks((current) => current.filter((link) => link.id !== id))
      setMessage('Link eliminado correctamente.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo eliminar el link.'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteFile = async (id: number) => {
    if (!window.confirm('¿Querés eliminar este archivo?')) return
    setDeletingId(`file-${id}`)
    setError('')
    setMessage('')
    try {
      await deleteProjectFile(id)
      setFiles((current) => current.filter((file) => file.id !== id))
      setMessage('Archivo eliminado correctamente.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo eliminar el archivo.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="detail-section evidence-section">
      <h2>Evidencias y recursos</h2>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      {!hasEvidence && (
        <p className="muted-text">Todavía no hay evidencias asociadas a este proyecto.</p>
      )}

      {links.length > 0 && (
        <div className="evidence-list">
          <h3>Links asociados</h3>
          {links.map((link) => (
            <div key={link.id} className="evidence-item">
              <div>
                <strong>{link.label}</strong>
                <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
              </div>
              <div className="evidence-actions">
                <a className="button-link" href={link.url} target="_blank" rel="noreferrer">Abrir link</a>
                {canEdit && (
                  <button className="btn-delete" onClick={() => handleDeleteLink(link.id)} disabled={deletingId === `link-${link.id}`}>
                    {deletingId === `link-${link.id}` ? 'Eliminando...' : 'Eliminar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="evidence-list">
          <h3>Archivos adjuntos</h3>
          {files.map((file) => (
            <div key={file.id} className="evidence-item">
              <div>
                <strong>{file.originalName}</strong>
                <span>{file.mimeType} · {formatFileSize(file.size)}</span>
              </div>
              <div className="evidence-actions">
                <a className="button-link" href={getFileUrl(file.url)} target="_blank" rel="noreferrer">Ver archivo</a>
                {canEdit && (
                  <button className="btn-delete" onClick={() => handleDeleteFile(file.id)} disabled={deletingId === `file-${file.id}`}>
                    {deletingId === `file-${file.id}` ? 'Eliminando...' : 'Eliminar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="evidence-forms">
          <form onSubmit={handleAddLink} className="evidence-form">
            <h3>Agregar link</h3>
            <label>
              Nombre o etiqueta
              <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Carpeta de evidencias" />
            </label>
            <label>
              URL
              <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." />
            </label>
            <button type="submit" className="primary-btn" disabled={addingLink}>
              {addingLink ? 'Guardando link...' : 'Agregar link'}
            </button>
          </form>

          <div className="evidence-form">
            <h3>Subir archivo</h3>
            <input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            <button type="button" className="primary-btn" onClick={handleUploadFile} disabled={uploading}>
              {uploading ? 'Subiendo archivo...' : 'Subir archivo'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
