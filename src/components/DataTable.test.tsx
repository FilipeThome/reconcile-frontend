import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'

describe('DataTable', () => {
  it('renders headers and rows', () => {
    render(
      <DataTable
        rows={[{ id: 'PED-1', buyer: 'Maria' }]}
        rowKey={(row) => row.id}
        columns={[
          { key: 'id', header: 'Pedido', render: (row) => row.id },
          { key: 'buyer', header: 'Comprador', render: (row) => row.buyer },
        ]}
      />,
    )

    expect(screen.getByText('Pedido')).toBeInTheDocument()
    expect(screen.getByText('PED-1')).toBeInTheDocument()
    expect(screen.getByText('Maria')).toBeInTheDocument()
  })

  it('shows an empty state and handles row click', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const { rerender } = render(
      <DataTable
        rows={[]}
        rowKey={(row: { id: string }) => row.id}
        columns={[{ key: 'id', header: 'ID', render: (row) => row.id }]}
      />,
    )
    expect(screen.getByText('Nenhum registro neste recorte do protótipo.')).toBeInTheDocument()

    rerender(
      <DataTable
        rows={[{ id: 'DIV-1' }]}
        rowKey={(row) => row.id}
        onRowClick={onRowClick}
        columns={[{ key: 'id', header: 'ID', render: (row) => row.id }]}
      />,
    )
    await user.click(screen.getByText('DIV-1'))
    expect(onRowClick).toHaveBeenCalledWith({ id: 'DIV-1' })
  })
})
