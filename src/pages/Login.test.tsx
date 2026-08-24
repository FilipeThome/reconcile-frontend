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

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'ana.dantas@lojaexemplo.com.br')
  await user.type(screen.getByLabelText('Senha'), 'senha123')
}

describe('Login', () => {
  it('redirects when a session already exists', () => {
    renderLogin(testSession)
    expect(screen.queryByRole('heading', { name: 'Entrar no Reconcile' })).not.toBeInTheDocument()
  })

  it('does not embed demo credentials in the page', () => {
    const { container } = renderLogin()
    expect(container.textContent).not.toMatch(/senha123/)
    expect(container.textContent).not.toMatch(/ana\.dantas@lojaexemplo\.com\.br/)
    expect(screen.getByLabelText('E-mail')).toHaveValue('')
    expect(screen.getByLabelText('Senha')).toHaveValue('')
  })

  it('rejects blank credentials', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Informe e-mail e senha.')).toBeInTheDocument()
  })

  it('submits a successful login', async () => {
    const user = userEvent.setup()
    renderLogin()
    await fillCredentials(user)
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
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument())
    vi.stubGlobal('fetch', mockFetch)
  })
})
