import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { saveSession } from '../api/client'
import { createTestSeed } from '../test/seed'
import { testSession } from '../test/session'
import { initialCases, initialClosings, initialIntegrations, initialRules } from '../test/fixtures'
import { AppStateProvider, useAppState } from './AppState'

function Probe() {
  const state = useAppState()
  const firstCase = state.cases[0]
  const openClosing = state.closings.find((item) => item.id === 'CLO-2026-05')
  const firstIntegration = state.integrations[0]
  const firstRule = state.rules[0]
  return (
    <div>
      <p data-testid="case-status">{firstCase.status}</p>
      <p data-testid="comments">{state.comments.filter((item) => item.caseId === firstCase.id).length}</p>
      <p data-testid="closing">{openClosing?.status ?? 'missing'}</p>
      <p data-testid="integration">{firstIntegration.status}</p>
      <p data-testid="rule">{String(firstRule.active)}</p>
      <p data-testid="toast">{state.toast ?? ''}</p>
      <button type="button" onClick={() => state.updateCaseStatus(firstCase.id, 'resolvida')}>
        resolver
      </button>
      <button type="button" onClick={() => state.addComment(firstCase.id, 'visto')}>
        comentar
      </button>
      <button type="button" onClick={() => state.closePeriod(openClosing?.id ?? '')}>
        fechar
      </button>
      <button type="button" onClick={() => state.toggleIntegration(firstIntegration.id)}>
        integrar
      </button>
      <button type="button" onClick={() => state.toggleRule(firstRule.id)}>
        regra
      </button>
      <button type="button" onClick={() => state.reprocessCase(firstCase.id)}>
        reprocessar
      </button>
      <button type="button" onClick={() => state.backfillIntegration(firstIntegration.id)}>
        backfill
      </button>
      <button
        type="button"
        onClick={() =>
          state.hydrate({
            cases: state.cases,
            comments: state.comments,
            closings: state.closings,
            integrations: state.integrations,
            rules: state.rules,
            orders: state.orders,
            payments: state.payments,
            settlements: state.settlements,
            payouts: state.payouts,
            fees: state.fees,
            refunds: state.refunds,
            invoices: state.invoices,
            snapshots: state.snapshots,
            timelines: state.timelines,
            dashboard: null,
            settings: null,
            engine: null,
          })
        }
      >
        hydrate
      </button>
    </div>
  )
}

describe('AppState', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useAppState())).toThrow('useAppState deve ser usado dentro de AppStateProvider')
  })

  it('updates case, comment, closing, integration and rule', async () => {
    const user = userEvent.setup()
    render(
      <AppStateProvider seed={createTestSeed()}>
        <Probe />
      </AppStateProvider>,
    )

    expect(screen.getByTestId('case-status').textContent).toBe(initialCases[0].status)
    expect(screen.getByTestId('closing').textContent).toBe(initialClosings[0].status)
    expect(screen.getByTestId('integration').textContent).toBe(initialIntegrations[0].status)
    expect(screen.getByTestId('rule').textContent).toBe(String(initialRules[0].active))

    await user.click(screen.getByText('resolver'))
    expect(screen.getByTestId('case-status').textContent).toBe('resolvida')
    expect(screen.getByTestId('toast').textContent).toMatch(/resolvido/)

    await user.click(screen.getByText('comentar'))
    expect(Number(screen.getByTestId('comments').textContent)).toBeGreaterThan(0)

    await user.click(screen.getByText('fechar'))
    expect(screen.getByTestId('closing').textContent).toBe('closed')

    await user.click(screen.getByText('integrar'))
    expect(screen.getByTestId('integration').textContent).toBe('disponivel')

    await user.click(screen.getByText('regra'))
    expect(screen.getByTestId('rule').textContent).toBe('false')

    await user.click(screen.getByText('reprocessar'))
    expect(screen.getByTestId('toast').textContent).toMatch(/Reprocessamento requer sessão/)
    await user.click(screen.getByText('backfill'))
    expect(screen.getByTestId('toast').textContent).toMatch(/Backfill requer sessão/)
  })

  it('calls the backend when a session exists', async () => {
    saveSession(testSession)
    const user = userEvent.setup()
    render(
      <AppStateProvider seed={createTestSeed()}>
        <Probe />
      </AppStateProvider>,
    )
    await user.click(screen.getByText('resolver'))
    expect(screen.getByTestId('case-status').textContent).toBe('resolvida')
    await user.click(screen.getByText('comentar'))
    await user.click(screen.getByText('fechar'))
    await user.click(screen.getByText('integrar'))
    await user.click(screen.getByText('regra'))
    await user.click(screen.getByText('reprocessar'))
    await user.click(screen.getByText('backfill'))
    expect(screen.getByTestId('toast').textContent).toMatch(/Backfill|reprocessado|fechado|resolvido/)
    await user.click(screen.getByText('hydrate'))
  })

  it('clears toast after the timeout', () => {
    vi.useFakeTimers()
    render(
      <AppStateProvider seed={createTestSeed()}>
        <Probe />
      </AppStateProvider>,
    )
    act(() => {
      screen.getAllByRole('button', { name: 'resolver' })[0]!.click()
    })
    expect(screen.getByTestId('toast').textContent).not.toBe('')
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(screen.getByTestId('toast').textContent).toBe('')
    vi.useRealTimers()
  })
})
