import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await register(name, email, password)
      navigate('/projects')
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar')
    }
  }

  return (
    <div className="container">
      <h1>Registrarse</h1>
      <form onSubmit={handleSubmit}>
        <label>Nombre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" required />
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Contraseña</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        {error && <div className="error">{error}</div>}
        <button type="submit">Crear cuenta</button>
      </form>
      <p>
        ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  )
}
