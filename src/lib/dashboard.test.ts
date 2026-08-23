import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS } from './filters'
import { buildDashboard } from './dashboard'
import { initialCases, invoices, orders, payments, payouts } from '../test/fixtures'

describe('buildDashboard', () => {
  it('computes kpis and empty-safe deltas', () => {
    const data = buildDashboard({
      orders,
      cases: initialCases,
      payments,
      payouts,
      invoices,
      filters: DEFAULT_FILTERS,
    })
    expect(data.kpis.orders).toBeGreaterThan(0)
    expect(data.periodLabel).toContain('05/2026')
    expect(data.actionQueue.length).toBeGreaterThan(0)
  })

  it('returns zeros when the catalog is empty', () => {
    const data = buildDashboard({
      orders: [],
      cases: [],
      payments: [],
      payouts: [],
      invoices: [],
      filters: DEFAULT_FILTERS,
    })
    expect(data.kpis.gross).toBe(0)
    expect(data.kpis.vsGross).toBe(0)
    expect(data.dailySeries).toEqual([])
    expect(data.causes).toEqual([])
  })
})
