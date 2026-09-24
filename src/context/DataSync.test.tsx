import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { saveSession } from '../api/client'
import { mockFetch } from '../test/mockApi'
import { testSession } from '../test/session'
import { AppStateProvider, useAppState } from './AppState'
import { AuthProvider } from './AuthContext'
import { DataSync } from './DataSync'
import { FilterProvider } from './FilterContext'

function Probe() {
  const { cases, settings, error } = useAppState()
  return (
    <div>
      <p>{settings?.tenant.name ?? 'sem-tenant'}</p>
      <p>{cases[0]?.id ?? 'sem-caso'}</p>
      <p>{error ?? 'ok'}</p>
    </div>
  )
}

describe('DataSync', () => {
  it('hydrates the catalog from the API', async () => {
    saveSession(testSession)
    const view = render(
      <AuthProvider>
        <FilterProvider>
          <AppStateProvider>
            <DataSync />
            <Probe />
          </AppStateProvider>
        </FilterProvider>
      </AuthProvider>,
    )
    await waitFor(() => expect(view.getByText('Loja Exemplo')).toBeInTheDocument())
    expect(view.getByText('DIV-2026-000124')).toBeInTheDocument()
  })

  it('keeps partial data when one request fails', async () => {
    saveSession(testSession)
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (raw.includes('/engine')) throw new Error('engine down')
      return mockFetch(input, init)
    })
    const view = render(
      <AuthProvider>
        <FilterProvider>
          <AppStateProvider>
            <DataSync />
            <Probe />
          </AppStateProvider>
        </FilterProvider>
      </AuthProvider>,
    )
    await waitFor(() => expect(view.getByText('Loja Exemplo')).toBeInTheDocument())
    expect(view.getByText(/Não foi possível conectar|engine down/)).toBeInTheDocument()
    vi.stubGlobal('fetch', mockFetch)
  })
})
