import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppStateProvider } from '../context/AppState'
import { AuthProvider } from '../context/AuthContext'
import { LocaleProvider } from '../context/LocaleContext'
import { FilterProvider } from '../context/FilterContext'
import { createTestSeed } from '../test/seed'
import { testSession } from '../test/session'
import { render } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows tenant data and logs out', async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider>
      <AuthProvider initialSession={testSession}>
        <FilterProvider>
          <AppStateProvider seed={createTestSeed()}>
            <MemoryRouter>
              <Layout />
            </MemoryRouter>
          </AppStateProvider>
        </FilterProvider>
      </AuthProvider>
      </LocaleProvider>,
    )
    expect(screen.getByText('Loja Exemplo')).toBeInTheDocument()
    expect(screen.getByText(/Administrador/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Sair/ }))
  })
})
