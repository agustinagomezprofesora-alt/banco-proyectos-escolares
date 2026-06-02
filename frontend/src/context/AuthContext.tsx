import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { User } from '../types'
import { authLogin, authRegister } from '../api/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('memoria_token')
    const storedUser = localStorage.getItem('memoria_user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('memoria_token')
        localStorage.removeItem('memoria_user')
      }
    }
    setLoading(false)
  }, [])

  const saveSession = useCallback((userData: User, token: string) => {
    localStorage.setItem('memoria_token', token)
    localStorage.setItem('memoria_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authLogin({ email, password })
    saveSession(response.user, response.token)
  }, [saveSession])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await authRegister({ name, email, password })
    saveSession(response.user, response.token)
  }, [saveSession])

  const logout = useCallback(() => {
    localStorage.removeItem('memoria_token')
    localStorage.removeItem('memoria_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
