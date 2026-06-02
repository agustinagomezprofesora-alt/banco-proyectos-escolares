import { FormEvent, useEffect, useState } from 'react'
import { updateSettings } from '../api/api'
import { useSettings } from '../context/SettingsContext'
import { InstitutionSettings } from '../types'
import { getErrorMessage } from '../utils/ui'

type SettingsForm = {
  institutionName: string
  appName: string
  logoUrl: string
  contactEmail: string
  footerText: string
  primaryColor: string
  secondaryColor: string
  allowPublicBank: boolean
}

const toForm = (settings: InstitutionSettings): SettingsForm => ({
  institutionName: settings.institutionName || '',
  appName: settings.appName || '',
  logoUrl: settings.logoUrl || '',
  contactEmail: settings.contactEmail || '',
  footerText: settings.footerText || '',
  primaryColor: settings.primaryColor || '#0f172a',
  secondaryColor: settings.secondaryColor || '#059669',
  allowPublicBank: settings.allowPublicBank
})

export default function AdminSettingsPage() {
  const { settings, setSettings } = useSettings()
  const [form, setForm] = useState<SettingsForm>(() => toForm(settings))
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(toForm(settings))
  }, [settings])

  const updateField = (field: keyof SettingsForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')

    try {
      const saved = await updateSettings({
        institutionName: form.institutionName,
        appName: form.appName,
        logoUrl: form.logoUrl || null,
        contactEmail: form.contactEmail || null,
        footerText: form.footerText || null,
        primaryColor: form.primaryColor || null,
        secondaryColor: form.secondaryColor || null,
        allowPublicBank: form.allowPublicBank
      })
      setSettings(saved)
      setSuccess('Configuración guardada correctamente.')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo guardar la configuración.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container admin-page">
      <header className="header">
        <div>
          <h1>Configuración institucional</h1>
          <p>Personalización básica de la institución y de la app.</p>
        </div>
      </header>

      {success && <div className="success">{success}</div>}
      {error && <div className="error">{error}</div>}

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-grid">
          <label>
            Nombre de la institución
            <input
              value={form.institutionName}
              onChange={(event) => updateField('institutionName', event.target.value)}
              required
            />
          </label>
          <label>
            Nombre de la app
            <input value={form.appName} onChange={(event) => updateField('appName', event.target.value)} required />
          </label>
          <label>
            Email institucional
            <input
              value={form.contactEmail}
              onChange={(event) => updateField('contactEmail', event.target.value)}
              type="email"
            />
          </label>
          <label>
            URL de logo
            <input
              value={form.logoUrl}
              onChange={(event) => updateField('logoUrl', event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label>
            Color principal
            <input
              value={form.primaryColor}
              onChange={(event) => updateField('primaryColor', event.target.value)}
              type="color"
            />
          </label>
          <label>
            Color secundario
            <input
              value={form.secondaryColor}
              onChange={(event) => updateField('secondaryColor', event.target.value)}
              type="color"
            />
          </label>
        </div>

        <label>
          Texto de pie de página
          <textarea value={form.footerText} onChange={(event) => updateField('footerText', event.target.value)} />
        </label>

        <label className="checkbox-label">
          <input
            checked={form.allowPublicBank}
            onChange={(event) => updateField('allowPublicBank', event.target.checked)}
            type="checkbox"
          />
          Permitir banco público: {form.allowPublicBank ? 'Sí' : 'No'}
        </label>

        <button className="primary-btn" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  )
}
