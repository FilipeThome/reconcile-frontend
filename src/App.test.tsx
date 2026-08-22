import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('app navigation', () => {
  it('renders the dashboard shell', () => {
    render(<App />)
    expect(screen.getByText('Reconcile')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument()
    expect(screen.getByText('Loja Exemplo')).toBeInTheDocument()
  })

  it('opens the discrepancies inbox from the sidebar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('link', { name: 'Divergências' }))
    expect(screen.getByRole('heading', { name: 'Divergências' })).toBeInTheDocument()
    expect(screen.getByText('DIV-2026-000124')).toBeInTheDocument()
  })
})
