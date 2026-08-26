import type { Filters, Marketplace, Order, Payment, ReconciliationCase } from '../types'
import { causeLabel } from './format'

function utcIso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function daysAgoUtc(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - days)
  return utcIso(date)
}

export const PERIOD_PRESETS = [
  { id: '90d', label: 'Últimos 90 dias', from: daysAgoUtc(90), to: utcIso(new Date()) },
  { id: '2026-08', label: 'Agosto/2026', from: '2026-08-01', to: '2026-08-31' },
  { id: '2026-06', label: 'Junho/2026', from: '2026-06-01', to: '2026-06-30' },
  { id: '2026-05', label: 'Maio/2026', from: '2026-05-01', to: '2026-05-31' },
  { id: '2026-04', label: 'Abril/2026', from: '2026-04-01', to: '2026-04-30' },
]

export const DEFAULT_FILTERS: Filters = {
  from: '2026-05-01',
  to: '2026-05-31',
  marketplace: '',
  gateway: '',
}

export const MARKETPLACES: Marketplace[] = ['Mercado Livre', 'CSV', 'Shopee']
export const GATEWAYS = ['Mercado Pago', 'CSV', 'Shopee'] as const

export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function normalizeFilters(filters: Filters): Filters {
  const from = isValidIsoDate(filters.from) ? filters.from : DEFAULT_FILTERS.from
  const to = isValidIsoDate(filters.to) ? filters.to : DEFAULT_FILTERS.to
  return {
    ...filters,
    from,
    to: from > to ? from : to,
  }
}

export function periodLabel(from: string, to: string) {
  const safe = normalizeFilters({ ...DEFAULT_FILTERS, from, to })
  const [yearFrom, monthFrom, dayFrom] = safe.from.split('-')
  const [yearTo, monthTo, dayTo] = safe.to.split('-')
  return `${dayFrom}/${monthFrom}/${yearFrom} — ${dayTo}/${monthTo}/${yearTo}`
}

export function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export function inPeriod(iso: string | null | undefined, filters: Filters) {
  if (!iso) return false
  const day = dayKey(iso)
  return day >= filters.from && day <= filters.to
}

export function toQueryString(filters: Filters) {
  const params = new URLSearchParams()
  params.set('from', filters.from)
  params.set('to', filters.to)
  if (filters.marketplace) params.set('marketplace', filters.marketplace)
  if (filters.gateway) params.set('gateway', filters.gateway)
  return params.toString()
}

export function orderMatches(order: Order, filters: Filters, payment?: Payment | null) {
  return (
    inPeriod(order.date, filters) &&
    (!filters.marketplace || order.marketplace === filters.marketplace) &&
    (!filters.gateway || payment?.gateway === filters.gateway)
  )
}

export function caseMatches(
  item: ReconciliationCase,
  filters: Filters,
  orders: Order[],
  payments: Payment[],
) {
  const order = orders.find((row) => row.id === item.orderId)
  const payment = payments.find((row) => row.id === item.paymentId || row.orderId === item.orderId)
  const date = order?.date ?? item.openedAt
  return (
    inPeriod(date, filters) &&
    (!filters.marketplace || order?.marketplace === filters.marketplace) &&
    (!filters.gateway || payment?.gateway === filters.gateway)
  )
}

export function caseSearchText(item: ReconciliationCase) {
  return `${item.id} ${item.orderId} ${item.description} ${causeLabel(item.cause)}`.toLowerCase()
}

export function countActiveFilters(filters: Filters) {
  return (filters.marketplace ? 1 : 0) + (filters.gateway ? 1 : 0)
}
