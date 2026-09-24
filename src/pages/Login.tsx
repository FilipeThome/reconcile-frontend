import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitch, useLocale } from '../context/LocaleContext'

export function Login() {
  const { session, login } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<'missing' | 'failed' | string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password.trim()) {
      setError('missing')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await login(trimmedEmail, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <article className="card login-card">
        <LanguageSwitch />
        <h1>{t('login.title')}</h1>
        <p className="muted">{t('login.subtitle')}</p>
        <form className="stack-fields" onSubmit={onSubmit}>
          <input className="field" type="email" aria-label={t('login.email')} autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="field" type="password" aria-label={t('login.password')} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="muted">{error === 'missing' ? t('login.missing') : error === 'failed' ? t('login.failed') : error}</p>}
          <button type="submit" className="btn-primary btn" disabled={busy}>
            {busy ? t('login.busy') : t('login.submit')}
          </button>
        </form>
      </article>
    </div>
  )
}
