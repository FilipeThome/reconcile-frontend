import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SESSION_EXPIRED_EVENT } from '../api/client'
import { testSession } from '../test/session'
import { AuthProvider, useAuth } from './AuthContext'

function Probe() {
  const { session, login, logout } = useAuth()
  return (
    <div>
      <p>{session?.name ?? 'anon'}</p>
      <button type="button" onClick={() => void login('ana.dantas@lojaexemplo.com.br', 'senha123')}>
        entrar
      </button>
      <button type="button" onClick={logout}>
        sair
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth deve ser usado dentro de AuthProvider')
  })

  it('logs in, logs out and clears on session expired', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider initialSession={null}>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByText('anon')).toBeInTheDocument()
    await user.click(screen.getByText('entrar'))
    await waitFor(() => expect(screen.getByText(testSession.name)).toBeInTheDocument())
    await user.click(screen.getByText('sair'))
    expect(screen.getByText('anon')).toBeInTheDocument()

    render(
      <AuthProvider initialSession={testSession}>
        <Probe />
      </AuthProvider>,
    )
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    await waitFor(() => expect(screen.getAllByText('anon').length).toBeGreaterThan(0))
  })
})
