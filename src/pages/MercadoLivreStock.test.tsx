import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { MemoryRouter } from 'react-router-dom'
import { saveSession } from '../api/client'
import { setLocale } from '../i18n/locale'
import { AppStateProvider } from '../context/AppState'
import { AuthProvider } from '../context/AuthContext'
import { LocaleProvider } from '../context/LocaleContext'
import { renderApp } from '../test/render'
import { resetMockStock } from '../test/mockApi'
import { testSession } from '../test/session'
import { Integrations } from './Integrations'
import { MercadoLivreStock, editorsOf } from './MercadoLivreStock'

function renderStock(role: string | null) {
  const session = role ? { ...testSession, role } : null
  if (session) saveSession(session)
  return render(
    <LocaleProvider>
      <AuthProvider initialSession={session}>
        <AppStateProvider>
          <MemoryRouter>
            <MercadoLivreStock />
          </MemoryRouter>
        </AppStateProvider>
      </AuthProvider>
    </LocaleProvider>,
  )
}

describe('Mercado Livre stock', () => {
  beforeEach(() => {
    resetMockStock()
    setLocale('pt-BR')
  })

  it('opens the stock page from integrations', async () => {
    const user = userEvent.setup()
    renderApp(
      <Routes>
        <Route path="/integracoes" element={<Integrations />} />
        <Route path="/integracoes/mercado-livre/estoque" element={<MercadoLivreStock />} />
      </Routes>,
      { route: '/integracoes' },
    )
    await user.click(screen.getByRole('link', { name: 'Estoque' }))
    expect(await screen.findByRole('heading', { name: 'Estoque no Mercado Livre' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar às integrações' })).toHaveAttribute('href', '/integracoes')
  })

  it('lists listings and updates item, variation and warehouse stock', async () => {
    const user = userEvent.setup()
    renderStock('admin')
    expect(await screen.findByRole('link', { name: 'Camiseta azul' })).toBeInTheDocument()
    expect(screen.getByText('Flex: 8')).toBeInTheDocument()
    expect(screen.getByText('1–20 de 21')).toBeInTheDocument()
    expect(screen.getByText('other: 1')).toBeInTheDocument()
    expect(screen.getByText('Este estoque não pode ser alterado por aqui.')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível ler o estoque deste anúncio.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar MLB10000004 FON' })).not.toBeInTheDocument()

    const quantity = screen.getByRole('textbox', { name: 'Quantidade MLB10000001 CAM-AZ' })
    await user.clear(quantity)
    await user.type(quantity, 'abc')
    await user.click(screen.getByRole('button', { name: 'Salvar MLB10000001 CAM-AZ' }))
    expect(await screen.findByText('Informe uma quantidade inteira entre 0 e 99999.')).toBeInTheDocument()

    await user.clear(quantity)
    await user.type(quantity, '100000')
    await user.click(screen.getByRole('button', { name: 'Salvar MLB10000001 CAM-AZ' }))
    expect(screen.getAllByText('Informe uma quantidade inteira entre 0 e 99999.').length).toBeGreaterThan(0)

    await user.clear(quantity)
    await user.type(quantity, '13')
    await user.click(screen.getByRole('button', { name: 'Salvar MLB10000001 CAM-AZ' }))
    expect(await screen.findByText('A API do Mercado Livre recusou a atualização')).toBeInTheDocument()

    await user.clear(quantity)
    await user.type(quantity, '12')
    await user.click(screen.getByRole('button', { name: 'Salvar MLB10000001 CAM-AZ' }))
    expect(await screen.findByText('Estoque atualizado no Mercado Livre.')).toBeInTheDocument()
    expect(quantity).toHaveValue('12')
    expect(screen.getByText('Flex: 12')).toBeInTheDocument()

    const variation = screen.getByRole('textbox', { name: 'Quantidade MLB10000002 40' })
    await user.clear(variation)
    await user.type(variation, '6')
    await user.click(screen.getByRole('button', { name: 'Salvar MLB10000002 40' }))
    await waitFor(() => expect(variation).toHaveValue('6'))
    expect(screen.getByText('TEN-40')).toBeInTheDocument()

    const warehouse = screen.getByRole('textbox', { name: 'Quantidade MLB10000003 A1' })
    await user.clear(warehouse)
    await user.type(warehouse, '9')
    await user.click(screen.getByRole('button', { name: 'Salvar MLB10000003 A1' }))
    await waitFor(() => expect(warehouse).toHaveValue('9'))
    expect(screen.getByText(/Depósito: 9/)).toBeInTheDocument()
  })

  it('filters, paginates and keeps accountants on read only', async () => {
    const user = userEvent.setup()
    renderStock('operador')
    expect(await screen.findByRole('button', { name: 'Salvar MLB10000001 CAM-AZ' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Ultimo anuncio')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByRole('link', { name: 'Camiseta azul' })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('SKU, título ou MLB'), 'CAM-AZ')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(screen.queryByText('Tenis')).not.toBeInTheDocument())
    expect(screen.getByText('1–1 de 1')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('SKU, título ou MLB'))
    await user.type(screen.getByPlaceholderText('SKU, título ou MLB'), 'azul')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('link', { name: 'Camiseta azul' })).toBeInTheDocument()
    expect(screen.queryByText('Tenis')).not.toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('SKU, título ou MLB'))
    await user.type(screen.getByPlaceholderText('SKU, título ou MLB'), 'inexistente')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('Nenhum anúncio encontrado.')).toBeInTheDocument()
    expect(screen.getByText('0–0 de 0')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('SKU, título ou MLB'))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status do anúncio' }), 'paused')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    const paused = await screen.findByText('Anuncio pausado')
    expect(within(paused.closest('tr') as HTMLElement).getByText('Pausados')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status do anúncio' }), 'closed')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('Anuncio encerrado')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status do anúncio' }), 'all')
    await user.clear(screen.getByPlaceholderText('SKU, título ou MLB'))
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('inactive')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('SKU, título ou MLB'), 'erro')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText(/Falha ao consultar o Mercado Livre/)).toBeInTheDocument()
  })

  it('translates the page when the locale changes', async () => {
    renderStock('admin')
    expect(await screen.findByRole('heading', { name: 'Estoque no Mercado Livre' })).toBeInTheDocument()
    setLocale('en-US')
    expect(await screen.findByRole('heading', { name: 'Mercado Livre stock' })).toBeInTheDocument()
  })

  it('edits one warehouse from its own quantity', () => {
    const [editor] = editorsOf({
      id: 'MLB10000008',
      title: 'Bone',
      sku: 'BON',
      status: 'active',
      availableQuantity: 8,
      soldQuantity: 0,
      permalink: null,
      userProductId: 'MLBU10000008',
      editable: true,
      variations: [],
      locations: [{ type: 'seller_warehouse', quantity: 3, storeId: 'A1', networkNodeId: 'N1', editable: true }],
    })
    expect(editor.quantity).toBe(3)
    expect(editor.storeId).toBe('A1')
    expect(editor.networkNodeId).toBe('N1')
  })

  it('hides save actions without an operator session', async () => {
    renderStock('contador')
    expect(await screen.findByText('Camiseta azul')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Salvar/ })).not.toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
