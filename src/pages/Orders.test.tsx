import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/render'
import { Orders } from './Orders'

describe('Orders', () => {
  it('lists orders and filters by buyer', async () => {
    const user = userEvent.setup()
    renderApp(<Orders />)

    expect(screen.getByRole('heading', { name: 'Pedidos' })).toBeInTheDocument()
    expect(screen.getByText('PED-200001234')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Buscar pedido ou comprador'), 'Amanda Dias')
    expect(screen.getByText('PED-200001242')).toBeInTheDocument()
    expect(screen.queryByText('PED-200001234')).not.toBeInTheDocument()
  })
})
