import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom'
import { AppStateProvider } from '../context/AppState'

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string
  routerProps?: Omit<MemoryRouterProps, 'children'>
}

export function renderApp(ui: ReactElement, options: Options = {}) {
  const { route = '/', routerProps, ...rest } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <AppStateProvider>
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          {children}
        </MemoryRouter>
      </AppStateProvider>
    ),
    ...rest,
  })
}
