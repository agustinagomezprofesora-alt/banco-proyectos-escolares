import { useEffect, useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { getErrorMessage } from '../utils/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const message = sessionStorage.getItem('memoria_session_message')
    if (message) {
      setError(message)
      sessionStorage.removeItem('memoria_session_message')
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/projects')
    } catch (err: any) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container auth-container">
      <div className="auth-heading">
        {settings.logoUrl && <img src={settings.logoUrl} alt={settings.appName} />}
        <div>
          <p>{settings.institutionName}</p>
          <h1>{settings.appName}</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Contraseña
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Entrar'}</button>
      </form>
      <p>
        ¿No tenés cuenta? <Link to="/register">Registrarse</Link>
      </p>
    </div>
  )
}
