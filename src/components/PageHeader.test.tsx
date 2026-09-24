import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/render'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('applies period and marketplace filters', async () => {
    const user = userEvent.setup()
    renderApp(<PageHeader title="Visão Geral" />)

    expect(screen.getByText('01/05/2026 — 31/05/2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Período'), '2026-06')
    await user.selectOptions(screen.getByLabelText('Marketplace'), 'Shopee')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(screen.getByText('01/06/2026 — 30/06/2026')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('refreshes the current recorte', async () => {
    const user = userEvent.setup()
    renderApp(<PageHeader title="Visão Geral" />)
    await user.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(screen.getByText('Dados atualizados para o recorte selecionado.')).toBeInTheDocument()
  })

  it('resets filters and closes on escape', async () => {
    const user = userEvent.setup()
    renderApp(<PageHeader title="Visão Geral" />)
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Marketplace'), 'Shopee')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(screen.queryByRole('dialog', { name: 'Filtros do recorte' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.selectOptions(screen.getByLabelText('Período'), 'custom')
    await user.clear(screen.getByLabelText('De'))
    await user.type(screen.getByLabelText('De'), '2026-05-10')
    await user.clear(screen.getByLabelText('Até'))
    await user.type(screen.getByLabelText('Até'), '2026-05-20')
    await user.selectOptions(screen.getByLabelText('Gateway'), 'CSV')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Filtros do recorte' })).not.toBeInTheDocument()
  })
})
