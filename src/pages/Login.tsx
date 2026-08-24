import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password.trim()) {
      setError('Informe e-mail e senha.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(trimmedEmail, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <article className="card login-card">
        <h1>Entrar no Reconcile</h1>
        <p className="muted">Entre com o e-mail e a senha da sua conta.</p>
        <form className="stack-fields" onSubmit={onSubmit}>
          <input className="field" type="email" aria-label="E-mail" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="field" type="password" aria-label="Senha" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="muted">{error}</p>}
          <button type="submit" className="btn-primary btn" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </article>
    </div>
  )
}
