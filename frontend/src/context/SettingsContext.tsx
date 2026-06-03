import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchSettings } from '../api/api'
import { useAuth } from './AuthContext'
import { InstitutionSettings } from '../types'

const defaultSettings: InstitutionSettings = {
  institutionName: 'Escuela / Institución',
  appName: 'Memoria Pedagógica Digital',
  logoUrl: null,
  primaryColor: '#4f46e5',
  secondaryColor: '#0f172a',
  contactEmail: null,
  footerText: 'Ficha generada por Memoria Pedagógica Digital',
  allowPublicBank: false
}

interface SettingsContextValue {
  settings: InstitutionSettings
  loading: boolean
  reloadSettings: () => Promise<void>
  setSettings: (settings: InstitutionSettings) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<InstitutionSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const reloadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSettings()
      setSettings({ ...defaultSettings, ...data })
    } catch {
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setSettings(defaultSettings)
      setLoading(false)
      return
    }

    reloadSettings()
  }, [authLoading, user, reloadSettings])

  useEffect(() => {
    const primaryColor = settings.primaryColor || '#4f46e5'
    const secondaryColor = settings.secondaryColor || '#0f172a'
    document.documentElement.style.setProperty('--color-primary', primaryColor)
    document.documentElement.style.setProperty('--color-secondary', secondaryColor)
    document.documentElement.style.setProperty('--institution-primary', secondaryColor)
    document.documentElement.style.setProperty('--institution-secondary', primaryColor)
  }, [settings.primaryColor, settings.secondaryColor])

  return (
    <SettingsContext.Provider value={{ settings, loading, reloadSettings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
