import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { saveSession } from '../api/client'
import { AppStateProvider, useAppState } from '../context/AppState'
import { mockFetch } from '../test/mockApi'
import { createTestSeed } from '../test/seed'
import { testSession } from '../test/session'
import { renderApp } from '../test/render'
import { Integrations } from './Integrations'

function Probe() {
  const { toggleIntegration } = useAppState()
  return (
    <button type="button" onClick={() => toggleIntegration('ml')}>
      conectar-ml
    </button>
  )
}

describe('Integrations oauth', () => {
  it('shows Mercado Livre success after the callback', () => {
    renderApp(<Integrations />, { route: '/integracoes?connected=ml' })
    expect(screen.getByText('Mercado Livre autorizado.')).toBeInTheDocument()
  })

  it('maps oauth errors to fixed copy', () => {
    renderApp(<Integrations />, { route: '/integracoes?oauth_error=access_denied' })
    expect(screen.getByText('Autorização recusada na conta do marketplace.')).toBeInTheDocument()
  })

  it('does not reflect attacker text from callback query params', () => {
    renderApp(<Integrations />, { route: '/integracoes?oauth_error=Reconecte%20em%20https://evil.example' })
    expect(screen.queryByText(/evil/i)).not.toBeInTheDocument()
    expect(screen.getByText('Não foi possível concluir a autorização.')).toBeInTheDocument()
  })

  it('ignores unknown connected values', () => {
    renderApp(<Integrations />, { route: '/integracoes?connected=other' })
    expect(screen.queryByText(/other/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/autorizado/i)).not.toBeInTheDocument()
  })

  it('redirects connect to the official authorize page', async () => {
    saveSession(testSession)
    const assign = vi.fn()
    const location = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...location, assign },
    })
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(JSON.stringify({ authorizationUrl: 'https://auth.mercadolivre.com.br/authorization?response_type=code' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    )
    const seed = createTestSeed()
    seed.integrations = seed.integrations?.map((item) => (item.id === 'ml' ? { ...item, status: 'disponivel' as const } : item))
    const { unmount } = render(
      <AppStateProvider seed={seed}>
        <Probe />
      </AppStateProvider>,
    )
    screen.getByRole('button', { name: 'conectar-ml' }).click()
    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith('https://auth.mercadolivre.com.br/authorization?response_type=code')
    })
    unmount()
    vi.stubGlobal('fetch', mockFetch)
    Object.defineProperty(window, 'location', { configurable: true, value: location })
  })

  it('does not follow an untrusted authorizationUrl', async () => {
    saveSession(testSession)
    const assign = vi.fn()
    const location = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...location, assign },
    })
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(JSON.stringify({ authorizationUrl: 'https://evil.example/login' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    )
    const seed = createTestSeed()
    seed.integrations = seed.integrations?.map((item) => (item.id === 'ml' ? { ...item, status: 'disponivel' as const } : item))
    const { unmount } = render(
      <AppStateProvider seed={seed}>
        <Probe />
      </AppStateProvider>,
    )
    screen.getByRole('button', { name: 'conectar-ml' }).click()
    await waitFor(() => {
      expect(screen.getByText('URL de autorização rejeitada.')).toBeInTheDocument()
    })
    expect(assign).not.toHaveBeenCalled()
    unmount()
    vi.stubGlobal('fetch', mockFetch)
    Object.defineProperty(window, 'location', { configurable: true, value: location })
  })
})
