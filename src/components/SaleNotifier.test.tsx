import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession } from '../api/client'
import { AppStateProvider } from '../context/AppState'
import { setLocale } from '../i18n/locale'
import { saleProviderName } from '../lib/sales'
import { failMockSales, mockFetch, pushMockSale, resetMockSales } from '../test/mockApi'
import { testSession } from '../test/session'
import { SaleNotifier } from './SaleNotifier'

function salesCalls(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.filter(([input]) => String(input).endsWith('/integrations/sales')).length
}

function renderNotifier() {
  saveSession(testSession)
  const spy = vi.fn(mockFetch)
  vi.stubGlobal('fetch', spy)
  const view = render(
    <AppStateProvider>
      <SaleNotifier intervalMs={20} />
    </AppStateProvider>,
  )
  return { spy, view }
}

describe('SaleNotifier', () => {
  beforeEach(() => {
    resetMockSales()
    setLocale('pt-BR')
    vi.stubGlobal('fetch', mockFetch)
  })

  it('seeds silently and toasts only unseen sold alerts', async () => {
    const { spy, view } = renderNotifier()
    await waitFor(() => expect(salesCalls(spy)).toBeGreaterThanOrEqual(2))
    expect(screen.queryByText(/Venda no/)).not.toBeInTheDocument()

    pushMockSale({ id: 'sale-8', sku: 'CANC-1', provider: 'ml', status: 'cancelado' })
    const before = salesCalls(spy)
    await waitFor(() => expect(salesCalls(spy)).toBeGreaterThanOrEqual(before + 2))
    expect(screen.queryByText(/Venda no/)).not.toBeInTheDocument()

    pushMockSale({ id: 'sale-9', sku: 'MOC', provider: 'olx', quantity: 4 })
    expect(await screen.findByText('Venda no OLX: MOC × 4')).toBeInTheDocument()

    view.unmount()
    const stopped = salesCalls(spy)
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(salesCalls(spy)).toBe(stopped)
    vi.stubGlobal('fetch', mockFetch)
  })

  it('ignores polling errors and seeds on the first successful load', async () => {
    failMockSales(true)
    const { spy } = renderNotifier()
    await waitFor(() => expect(salesCalls(spy)).toBeGreaterThanOrEqual(2))
    expect(screen.queryByText(/Falha/)).not.toBeInTheDocument()

    pushMockSale({ id: 'sale-7', sku: 'ANTIGA' })
    failMockSales(false)
    const before = salesCalls(spy)
    await waitFor(() => expect(salesCalls(spy)).toBeGreaterThanOrEqual(before + 2))
    expect(screen.queryByText(/Venda no/)).not.toBeInTheDocument()

    pushMockSale({ id: 'sale-9', sku: 'NOVA', quantity: 2 })
    expect(await screen.findByText('Venda no Manual: NOVA × 2')).toBeInTheDocument()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('names marketplaces for people', () => {
    expect(saleProviderName('ml')).toBe('Mercado Livre')
    expect(saleProviderName('olx')).toBe('OLX')
    expect(saleProviderName('manual')).toBe('Manual')
    expect(saleProviderName('loja')).toBe('loja')
  })
})
