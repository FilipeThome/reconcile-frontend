import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/render'
import { DiscrepancyDetail } from './DiscrepancyDetail'

function renderDetail(id = 'DIV-2026-000124') {
  return renderApp(
    <Routes>
      <Route path="/divergencias/:id" element={<DiscrepancyDetail />} />
    </Routes>,
    { route: `/divergencias/${id}` },
  )
}

describe('DiscrepancyDetail', () => {
  it('shows case evidence and calculation snapshot', async () => {
    const user = userEvent.setup()
    renderDetail()

    expect(screen.getByRole('heading', { name: 'DIV-2026-000124' })).toBeInTheDocument()
    expect(screen.getByText('PED-200001234')).toBeInTheDocument()
    expect(screen.getByText(/Repasse não realizado/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cálculo' }))
    expect(screen.getByText(/sce-v1.4/)).toBeInTheDocument()
    expect(screen.getAllByText(/842,31/).length).toBeGreaterThan(0)
  })

  it('resolves the case and adds a comment', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getAllByRole('button', { name: 'Resolver' })[0]!)
    expect(await screen.findByText('Resolvida')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Comentarios' }))
    await user.type(screen.getByPlaceholderText('Adicionar comentário interno'), 'conferido')
    await user.click(screen.getByRole('button', { name: 'Comentar' }))
    expect(screen.getByText('conferido')).toBeInTheDocument()
  })

  it('shows a fallback for unknown cases', () => {
    renderDetail('DIV-nao-existe')
    expect(screen.getByText('Caso não encontrado neste protótipo.')).toBeInTheDocument()
  })
})
