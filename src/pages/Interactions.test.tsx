import { Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppStateProvider } from '../context/AppState'
import { AuthProvider } from '../context/AuthContext'
import { FilterProvider } from '../context/FilterContext'
import { LocaleProvider } from '../context/LocaleContext'
import { renderApp } from '../test/render'
import { Closings } from './Closings'
import { Discrepancies } from './Discrepancies'
import { Fiscal } from './Fiscal'
import { Integrations } from './Integrations'
import { Orders } from './Orders'
import { Rules } from './Rules'
import { Settings } from './Settings'

describe('page interactions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports, toggles and navigates catalog actions', async () => {
    const user = userEvent.setup()
    const click = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const nativeCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = nativeCreate(tag)
      if (tag === 'a') element.click = click
      return element
    })

    const orders = renderApp(<Orders />)
    await user.click(screen.getAllByRole('button', { name: 'Exportar CSV' })[0]!)
    orders.unmount()

    const discrepancies = renderApp(<Discrepancies />)
    await user.click(screen.getAllByRole('button', { name: 'Exportar CSV' })[0]!)
    discrepancies.unmount()

    const rules = renderApp(<Rules />)
    await user.click(document.querySelector('.switch') as HTMLButtonElement)
    rules.unmount()

    const integrations = renderApp(<Integrations />)
    await user.click(screen.getAllByRole('button', { name: 'Desconectar' })[0]!)
    await user.click(screen.getAllByRole('button', { name: 'Backfill' })[0]!)
    integrations.unmount()

    const fiscal = renderApp(<Fiscal />)
    const pending = screen.queryAllByRole('button', { name: 'Ver pedido' })[0]
    if (pending) await user.click(pending)
    fiscal.unmount()

    const closings = renderApp(
      <Routes>
        <Route path="/fechamentos" element={<Closings />} />
        <Route path="/fechamentos/:id" element={<p>detalhe</p>} />
      </Routes>,
      { route: '/fechamentos' },
    )
    await user.click(screen.getByText('Maio/2026'))
    closings.unmount()
  })

  it('renders settings fallbacks without catalog data', () => {
    render(
      <LocaleProvider>
      <AuthProvider initialSession={null}>
        <FilterProvider>
          <AppStateProvider>
            <Settings />
          </AppStateProvider>
        </FilterProvider>
      </AuthProvider>
      </LocaleProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Configurações' })).toBeInTheDocument()
  })
})
