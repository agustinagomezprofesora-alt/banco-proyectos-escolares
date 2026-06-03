import { ChangeEvent, useMemo, useState } from 'react'
import { downloadSystemBackup, restoreSystemBackup } from '../api/api'
import { getErrorMessage } from '../utils/ui'

type RestoreStep = '' | 'Subiendo backup...' | 'Validando archivo...' | 'Restaurando datos...'

export default function AdminBackupPage() {
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreStep, setRestoreStep] = useState<RestoreStep>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [acceptedRisk, setAcceptedRisk] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const canRestore = useMemo(() => {
    return Boolean(selectedFile) && acceptedRisk && confirmationText === 'RESTAURAR' && !restoreLoading
  }, [acceptedRisk, confirmationText, restoreLoading, selectedFile])

  const handleDownload = async () => {
    setBackupLoading(true)
    setSuccess('')
    setError('')

    try {
      await downloadSystemBackup()
      setSuccess('Backup generado correctamente.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo generar el backup.'))
    } finally {
      setBackupLoading(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null)
    setSuccess('')
    setError('')
  }

  const handleRestore = async () => {
    if (!selectedFile || !canRestore) return

    const confirmed = window.confirm('¿Seguro que querés restaurar este backup? Esta acción reemplazará datos actuales.')
    if (!confirmed) return

    setRestoreLoading(true)
    setSuccess('')
    setError('')

    try {
      setRestoreStep('Subiendo backup...')
      await new Promise((resolve) => window.setTimeout(resolve, 150))
      setRestoreStep('Validando archivo...')
      await new Promise((resolve) => window.setTimeout(resolve, 150))
      setRestoreStep('Restaurando datos...')
      const result = await restoreSystemBackup(selectedFile)
      setSuccess(`${result.message}${result.warning ? ` ${result.warning}` : ''}`)
      setSelectedFile(null)
      setAcceptedRisk(false)
      setConfirmationText('')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo restaurar el backup.'))
    } finally {
      setRestoreLoading(false)
      setRestoreStep('')
    }
  }

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>Respaldo del sistema</h1>
          <p>El backup incluye la base de datos y los archivos subidos al sistema.</p>
        </div>
      </header>

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <section className="admin-section">
        <h2>Generar backup</h2>
        <p className="muted-text">Este backup no reemplaza una política institucional de copias de seguridad.</p>
        {backupLoading && <div className="success">Generando backup...</div>}
        <button className="primary-btn" type="button" onClick={handleDownload} disabled={backupLoading || restoreLoading}>
          {backupLoading ? 'Generando backup...' : 'Generar y descargar backup'}
        </button>
      </section>

      <section className="admin-section">
        <h2>Restaurar backup</h2>
        <p className="muted-text">
          Restaurar un backup reemplazará la base de datos actual y puede modificar los archivos subidos. Antes de
          restaurar, el sistema generará un backup automático del estado actual.
        </p>
        <div className="error">
          Este backup no reemplaza una política institucional de copias de seguridad. Revisá que el archivo provenga de
          esta app antes de continuar.
        </div>

        <div className="settings-form">
          <label>
            Archivo .zip de backup
            <input accept=".zip,application/zip" type="file" onChange={handleFileChange} disabled={restoreLoading} />
          </label>

          <label className="checkbox-label">
            <input
              checked={acceptedRisk}
              onChange={(event) => setAcceptedRisk(event.target.checked)}
              type="checkbox"
              disabled={restoreLoading}
            />
            Entiendo que esta acción reemplazará datos actuales.
          </label>

          <label>
            Escribir RESTAURAR para continuar
            <input
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              disabled={restoreLoading}
            />
          </label>

          {restoreStep && <div className="success">{restoreStep}</div>}

          <button className="btn-delete" type="button" onClick={handleRestore} disabled={!canRestore}>
            {restoreLoading ? 'Restaurando backup...' : 'Restaurar backup'}
          </button>
        </div>
      </section>
    </div>
  )
}
