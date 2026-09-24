import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppStateProvider } from '../context/AppState'
import { AuthProvider } from '../context/AuthContext'
import { FilterProvider } from '../context/FilterContext'
import { createTestSeed } from '../test/seed'
import { testSession } from '../test/session'
import { RequireAuth } from './RequireAuth'

function wrap(session: typeof testSession | null) {
  return render(
    <AuthProvider initialSession={session}>
      <FilterProvider>
        <AppStateProvider seed={createTestSeed()}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/login" element={<p>login</p>} />
              <Route element={<RequireAuth />}>
                <Route path="/" element={<p>private</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AppStateProvider>
      </FilterProvider>
    </AuthProvider>,
  )
}

describe('RequireAuth', () => {
  it('redirects anonymous users and keeps a session', () => {
    wrap(null)
    expect(screen.getByText('login')).toBeInTheDocument()
    wrap(testSession)
    expect(screen.getByText('private')).toBeInTheDocument()
  })
})
