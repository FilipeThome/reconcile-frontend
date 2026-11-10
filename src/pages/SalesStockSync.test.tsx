import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { saveSession } from '../api/client'
import { setLocale } from '../i18n/locale'
import { AppStateProvider } from '../context/AppState'
import { AuthProvider } from '../context/AuthContext'
import { LocaleProvider } from '../context/LocaleContext'
import { renderApp } from '../test/render'
import { failMockSales, pushMockSale, resetMockSales } from '../test/mockApi'
import { testSession } from '../test/session'
import { Integrations } from './Integrations'
import { SalesStockSync } from './SalesStockSync'

function renderSales(role: string, refreshMs?: number) {
  const session = { ...testSession, role }
  saveSession(session)
  return render(
    <LocaleProvider>
      <AuthProvider initialSession={session}>
        <AppStateProvider>
          <MemoryRouter>
            <SalesStockSync refreshMs={refreshMs} />
          </MemoryRouter>
        </AppStateProvider>
      </AuthProvider>
    </LocaleProvider>,
  )
}

describe('Sales and stock sync', () => {
  beforeEach(() => {
    resetMockSales()
    setLocale('pt-BR')
  })

  it('opens the sales page from integrations', async () => {
    const user = userEvent.setup()
    renderApp(
      <Routes>
        <Route path="/integracoes" element={<Integrations />} />
        <Route path="/integracoes/vendas" element={<SalesStockSync />} />
      </Routes>,
      { route: '/integracoes' },
    )
    await user.click(screen.getByRole('link', { name: 'Vendas e estoque' }))
    expect(await screen.findByRole('heading', { name: 'Vendas e estoque' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar às integrações' })).toHaveAttribute('href', '/integracoes')
    expect(screen.queryByRole('form', { name: 'Registrar venda manual' })).not.toBeInTheDocument()
  })

  it('renders alerts with the result of every target', async () => {
    renderSales('admin')
    const row = (await screen.findByText('CAM-AZ')).closest('tr') as HTMLElement
    expect(within(row).getByText('Mercado Livre')).toBeInTheDocument()
    expect(within(row).getByText('Camiseta azul')).toBeInTheDocument()
    expect(within(row).getByText('Vendido')).toBeInTheDocument()
    expect(within(row).getByText(/18\/06\/2026/)).toBeInTheDocument()
    expect(within(row).getByText(/Shopee · Camiseta azul Shopee/)).toBeInTheDocument()
    expect(within(row).getByText('8 → 6')).toBeInTheDocument()
    expect(within(row).getByText(/OLX · Camiseta azul OLX/)).toBeInTheDocument()
    expect(within(row).getByText('Anúncio pausado na OLX')).toBeInTheDocument()
    expect(within(row).getByText('Não foi possível alterar o estoque.')).toBeInTheDocument()
    expect(within(row).getByText(/loja · Camiseta azul loja/)).toBeInTheDocument()
    expect(within(row).getByText('— → 3')).toBeInTheDocument()

    const canceled = screen.getByText('TEN-40').closest('tr') as HTMLElement
    expect(within(canceled).getByText('Shopee')).toBeInTheDocument()
    expect(within(canceled).getByText('Cancelado')).toBeInTheDocument()
    expect(within(canceled).getByText('Nenhum outro anúncio com este SKU.')).toBeInTheDocument()
  })

  it('shows the empty state and a load failure', async () => {
    const user = userEvent.setup()
    resetMockSales([])
    renderSales('operador')
    expect(await screen.findByText('Nenhuma venda registrada ainda.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    failMockSales(true)
    await user.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(await screen.findByText(/Falha ao consultar vendas/)).toBeInTheDocument()
  })

  it('records a manual sale and reloads the list', async () => {
    const user = userEvent.setup()
    renderSales('admin')
    await screen.findByText('CAM-AZ')
    const form = screen.getByRole('form', { name: 'Registrar venda manual' })
    const sku = within(form).getByRole('textbox', { name: 'SKU' })
    const quantity = within(form).getByRole('textbox', { name: 'Quantidade' })

    await user.click(within(form).getByRole('button', { name: 'Registrar venda' }))
    expect(await screen.findByText('Informe o SKU e uma quantidade inteira a partir de 1.')).toBeInTheDocument()

    await user.type(sku, 'MOC')
    await user.clear(quantity)
    await user.type(quantity, '0')
    await user.click(within(form).getByRole('button', { name: 'Registrar venda' }))
    expect(screen.getByText('Informe o SKU e uma quantidade inteira a partir de 1.')).toBeInTheDocument()
    expect(screen.queryByText('MOC')).not.toBeInTheDocument()

    await user.clear(quantity)
    await user.type(quantity, '3')
    await user.type(within(form).getByRole('textbox', { name: 'Referência (opcional)' }), 'balcao-17')
    await user.click(within(form).getByRole('button', { name: 'Registrar venda' }))
    expect(await screen.findByText('Venda registrada.')).toBeInTheDocument()
    const row = (await screen.findByText('MOC')).closest('tr') as HTMLElement
    expect(within(row).getByText('Manual')).toBeInTheDocument()
    expect(within(row).getByText('3')).toBeInTheDocument()
    expect(sku).toHaveValue('')
    expect(quantity).toHaveValue('1')
  })

  it('shows the backend message when the manual sale is refused', async () => {
    const user = userEvent.setup()
    renderSales('operador')
    await screen.findByText('CAM-AZ')
    await user.type(screen.getByRole('textbox', { name: 'SKU' }), 'ERRO')
    await user.click(screen.getByRole('button', { name: 'Registrar venda' }))
    expect(await screen.findByText('SKU sem anúncio vinculado')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'SKU' })).toHaveValue('ERRO')
  })

  it('keeps accountants on read only', async () => {
    renderSales('contador')
    expect(await screen.findByText('CAM-AZ')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Registrar venda manual' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar venda' })).not.toBeInTheDocument()
  })

  it('refreshes the list on the interval and stops after unmount', async () => {
    const view = renderSales('admin', 250)
    await screen.findByText('CAM-AZ')
    pushMockSale({ id: 'sale-9', sku: 'BON-01', provider: 'amazon' })
    const row = (await screen.findByText('BON-01')).closest('tr') as HTMLElement
    expect(within(row).getByText('Amazon')).toBeInTheDocument()
    view.unmount()
    await waitFor(() => expect(screen.queryByText('BON-01')).not.toBeInTheDocument())
  })

  it('translates the page when the locale changes', async () => {
    renderSales('admin')
    expect(await screen.findByRole('heading', { name: 'Vendas e estoque' })).toBeInTheDocument()
    setLocale('en-US')
    expect(await screen.findByRole('heading', { name: 'Sales and stock' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Record sale' })).toBeInTheDocument()
  })
})
