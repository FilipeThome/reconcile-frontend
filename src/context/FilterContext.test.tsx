import { render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FilterProvider, useFilters } from './FilterContext'

function Probe() {
  const { filters, draft, applyDraft, resetFilters, setDraft, openPanel, closePanel, refresh, panelOpen, refreshKey } =
    useFilters()
  return (
    <div>
      <p>{`${filters.from}:${filters.to}`}</p>
      <p>{`draft:${draft.from}`}</p>
      <p data-testid="panel">{panelOpen ? 'open' : 'closed'}</p>
      <p data-testid="refresh">{refreshKey}</p>
      <button type="button" onClick={openPanel}>
        open
      </button>
      <button type="button" onClick={closePanel}>
        close
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft({ from: 'nope', to: 'also-bad', marketplace: '', gateway: '' })
          applyDraft()
        }}
      >
        apply-bad
      </button>
      <button type="button" onClick={resetFilters}>
        reset
      </button>
      <button type="button" onClick={refresh}>
        refresh
      </button>
    </div>
  )
}

describe('FilterContext', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useFilters())).toThrow('useFilters deve ser usado dentro de FilterProvider')
  })

  it('normalizes invalid dates and refreshes', async () => {
    const user = userEvent.setup()
    render(
      <FilterProvider>
        <Probe />
      </FilterProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'open' }))
    expect(screen.getByTestId('panel').textContent).toBe('open')
    await user.click(screen.getByText('apply-bad'))
    expect(screen.getByText('2026-05-01:2026-05-31')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'refresh' }))
    expect(Number(screen.getByTestId('refresh').textContent)).toBeGreaterThan(1)
    await user.click(screen.getByText('reset'))
    expect(screen.getByTestId('panel').textContent).toBe('closed')
  })
})
