import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Boom({ fail }: { fail: boolean }) {
  if (fail) throw new Error('explodiu')
  return <p>ok</p>
}

describe('ErrorBoundary', () => {
  it('catches render errors and allows retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const { rerender } = render(
      <ErrorBoundary>
        <Boom fail />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('explodiu')
    rerender(
      <ErrorBoundary>
        <Boom fail={false} />
      </ErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(screen.getByText('ok')).toBeInTheDocument()
    vi.mocked(console.error).mockRestore()
  })
})
