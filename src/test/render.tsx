import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { AppStateProvider } from '../context/AppState'
import { AuthProvider } from '../context/AuthContext'
import { FilterProvider } from '../context/FilterContext'
import { createTestSeed } from './seed'

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string
  routerProps?: Omit<MemoryRouterProps, 'children'>
}

export function renderApp(ui: ReactElement, options: Options = {}) {
  const { route = '/', routerProps, ...rest } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider initialSession={null}>
        <FilterProvider>
          <AppStateProvider seed={createTestSeed()}>
            <MemoryRouter initialEntries={[route]} {...routerProps}>
              {children}
            </MemoryRouter>
          </AppStateProvider>
        </FilterProvider>
      </AuthProvider>
    ),
    ...rest,
  })
}
