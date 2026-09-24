import { describe, expect, it } from 'vitest'
import { initialCases, orders, payments } from '../test/fixtures'
import { caseMatches, DEFAULT_FILTERS, isValidIsoDate, normalizeFilters, orderMatches, periodLabel, toQueryString } from './filters'

describe('filters', () => {
  it('labels the selected period', () => {
    expect(periodLabel('2026-05-01', '2026-05-31')).toBe('01/05/2026 — 31/05/2026')
  })

  it('keeps May Mercado Livre orders in the default recorte', () => {
    const mayMl = orders.filter((order) =>
      orderMatches(order, { ...DEFAULT_FILTERS, marketplace: 'Mercado Livre' }, payments.find((item) => item.orderId === order.id)),
    )
    expect(mayMl.some((item) => item.id === 'PED-200001234')).toBe(true)
    expect(mayMl.some((item) => item.id === 'PED-200001241')).toBe(false)
    expect(mayMl.some((item) => item.id === 'PED-200001301')).toBe(false)
  })

  it('scopes cases by the related order date', () => {
    const mayCases = initialCases.filter((item) => caseMatches(item, DEFAULT_FILTERS, orders, payments))
    expect(mayCases.map((item) => item.id)).toContain('DIV-2026-000124')
    expect(mayCases.map((item) => item.id)).not.toContain('DIV-2026-000131')
    expect(mayCases.map((item) => item.id)).not.toContain('DIV-2026-000134')
  })

  it('normalizes invalid ranges and builds a query string', () => {
    expect(isValidIsoDate('2026-13-40')).toBe(false)
    expect(normalizeFilters({ from: 'x', to: '2026-04-01', marketplace: 'Shopee', gateway: '' })).toEqual({
      from: '2026-05-01',
      to: '2026-05-01',
      marketplace: 'Shopee',
      gateway: '',
    })
    expect(toQueryString({ ...DEFAULT_FILTERS, marketplace: 'Shopee', gateway: 'CSV' })).toContain('marketplace=Shopee')
  })
})
