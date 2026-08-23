import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { saveSession } from './api/client'
import App from './App'
import { testSession } from './test/session'

describe('app navigation', () => {
  it('asks for login when there is no session', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Entrar no Reconcile' })).toBeInTheDocument()
  })

  it('renders the dashboard shell', async () => {
    saveSession(testSession)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument()
    expect(screen.getByText('Reconcile')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Loja Exemplo')).toBeInTheDocument())
  })

  it('opens the discrepancies inbox from the sidebar', async () => {
    saveSession(testSession)
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByRole('link', { name: 'Divergências' })).toBeInTheDocument())
    await user.click(screen.getByRole('link', { name: 'Divergências' }))
    expect(screen.getByRole('heading', { name: 'Divergências' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('DIV-2026-000124')).toBeInTheDocument())
  })
})
