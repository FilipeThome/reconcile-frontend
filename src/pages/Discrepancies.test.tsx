import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { initialCases } from '../data/mock'
import { renderApp } from '../test/render'
import { Discrepancies } from './Discrepancies'

describe('Discrepancies', () => {
  it('lists seeded cases and filters by search', async () => {
    const user = userEvent.setup()
    renderApp(<Discrepancies />)

    expect(screen.getByRole('heading', { name: 'Divergências' })).toBeInTheDocument()
    expect(screen.getByText('DIV-2026-000124')).toBeInTheDocument()
    expect(screen.getByText(`Casos no recorte`).parentElement).toHaveTextContent(String(initialCases.length))

    await user.type(screen.getByPlaceholderText('Buscar caso, pedido ou causa'), 'DIV-2026-000124')
    expect(screen.getByText('DIV-2026-000124')).toBeInTheDocument()
    expect(screen.queryByText('DIV-2026-000131')).not.toBeInTheDocument()
  })

  it('filters by status tab', async () => {
    const user = userEvent.setup()
    renderApp(<Discrepancies />)
    const resolvedTab = screen.getAllByRole('button', { name: 'resolvida' }).find((button) => button.classList.contains('tab'))
    await user.click(resolvedTab!)
    expect(screen.getByText('DIV-2026-000130')).toBeInTheDocument()
    expect(screen.queryByText('DIV-2026-000124')).not.toBeInTheDocument()
  })
})
