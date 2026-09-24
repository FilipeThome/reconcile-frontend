import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { initialCases, orders, payments } from '../test/fixtures'
import { DEFAULT_FILTERS, caseMatches } from '../lib/filters'
import { renderApp } from '../test/render'
import { Discrepancies } from './Discrepancies'

const mayCases = initialCases.filter((item) => caseMatches(item, DEFAULT_FILTERS, orders, payments))

describe('Discrepancies', () => {
  it('lists seeded cases and filters by search', async () => {
    const user = userEvent.setup()
    renderApp(<Discrepancies />)

    expect(screen.getByRole('heading', { name: 'Divergências' })).toBeInTheDocument()
    expect(screen.getByText('DIV-2026-000124')).toBeInTheDocument()
    expect(screen.getByText(`Casos no recorte`).parentElement).toHaveTextContent(String(mayCases.length))

    await user.type(screen.getByPlaceholderText('Buscar caso, pedido ou causa'), 'DIV-2026-000124')
    expect(screen.getByText('DIV-2026-000124')).toBeInTheDocument()
    expect(screen.queryByText('DIV-2026-000130')).not.toBeInTheDocument()
  })

  it('filters by status tab', async () => {
    const user = userEvent.setup()
    renderApp(<Discrepancies />)
    const resolvedTab = screen.getAllByRole('button', { name: 'Resolvida' }).find((button) => button.classList.contains('tab'))
    await user.click(resolvedTab!)
    expect(screen.getByText('DIV-2026-000130')).toBeInTheDocument()
    expect(screen.queryByText('DIV-2026-000124')).not.toBeInTheDocument()
  })
})
