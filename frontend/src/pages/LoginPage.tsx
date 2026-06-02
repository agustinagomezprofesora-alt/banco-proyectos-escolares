import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await login(email, password)
      navigate('/projects')
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar sesión')
    }
  }

  return (
    <div className="container">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Contraseña</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        {error && <div className="error">{error}</div>}
        <button type="submit">Entrar</button>
      </form>
      <p>
        ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
      </p>
    </div>
  )
}
