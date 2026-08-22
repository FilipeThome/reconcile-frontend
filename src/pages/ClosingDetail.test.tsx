import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/render'
import { ClosingDetail } from './ClosingDetail'

describe('ClosingDetail', () => {
  it('closes an open period', async () => {
    const user = userEvent.setup()
    renderApp(
      <Routes>
        <Route path="/fechamentos/:id" element={<ClosingDetail />} />
      </Routes>,
      { route: '/fechamentos/CLO-2026-05' },
    )

    expect(screen.getByRole('heading', { name: 'Fechamento Maio/2026' })).toBeInTheDocument()
    expect(screen.getByText('Aberto')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar período' }))
    expect(await screen.findByText('Fechado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fechar período' })).not.toBeInTheDocument()
  })
})
