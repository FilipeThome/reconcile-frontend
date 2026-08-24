import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mockFetch } from '../test/mockApi'
import { testSession } from '../test/session'
import { AuthProvider } from '../context/AuthContext'
import { Login } from './Login'

function renderLogin(session = null as typeof testSession | null) {
  return render(
    <AuthProvider initialSession={session}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Login', () => {
  it('redirects when a session already exists', () => {
    renderLogin(testSession)
    expect(screen.queryByRole('heading', { name: 'Entrar no Reconcile' })).not.toBeInTheDocument()
  })

  it('rejects blank credentials', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.clear(screen.getByLabelText('E-mail'))
    await user.clear(screen.getByLabelText('Senha'))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Informe e-mail e senha.')).toBeInTheDocument()
  })

  it('submits a successful login', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Entrar no Reconcile' })).not.toBeInTheDocument())
  })

  it('shows a backend error', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: 'Credenciais inválidas' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    )
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument())
    vi.stubGlobal('fetch', mockFetch)
  })
})
