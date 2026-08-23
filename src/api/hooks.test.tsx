import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueryStatus, useApi } from './hooks'

function Probe({ path }: { path: string | null }) {
  const { data, error, loading, reload } = useApi<{ ok: boolean }>(path)
  return (
    <div>
      <p>{loading ? 'loading' : 'idle'}</p>
      <p>{data ? 'ok' : 'empty'}</p>
      <p>{error ?? ''}</p>
      <button type="button" onClick={reload}>
        reload
      </button>
    </div>
  )
}

describe('useApi', () => {
  it('loads, reloads and clears when the path is null', async () => {
    const { rerender } = render(<Probe path="/settings" />)
    await waitFor(() => expect(screen.getByText('ok')).toBeInTheDocument())
    screen.getByText('reload').click()
    await waitFor(() => expect(screen.getByText('idle')).toBeInTheDocument())
    rerender(<Probe path={null} />)
    expect(screen.getByText('empty')).toBeInTheDocument()
  })

  it('surfaces request errors', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    render(<Probe path="/boom" />)
    await waitFor(() => expect(screen.getByText(/Não foi possível conectar/)).toBeInTheDocument())
    vi.stubGlobal('fetch', (await import('../test/mockApi')).mockFetch)
  })
})

describe('QueryStatus', () => {
  it('renders loading and error states', () => {
    const { rerender } = render(<QueryStatus loading error={null} />)
    expect(screen.getByText(/Carregando dados do backend/)).toBeInTheDocument()
    rerender(<QueryStatus loading={false} error="falhou" />)
    expect(screen.getByText(/Não foi possível carregar: falhou/)).toBeInTheDocument()
    rerender(<QueryStatus loading={false} error={null} />)
    expect(screen.queryByText(/Carregando/)).not.toBeInTheDocument()
  })
})
