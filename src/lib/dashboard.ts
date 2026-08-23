import type { DashboardData, Filters, Invoice, Order, Payment, Payout, ReconciliationCase } from '../types'
import { caseMatches, orderMatches, periodLabel } from './filters'
import { causeLabel } from './format'

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function pct(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part * 1000) / total) / 10
}

function delta(current: number, previous: number) {
  if (!previous) return 0
  return Math.round(((current - previous) * 1000) / previous) / 10
}

function causeTitle(cause: ReconciliationCase['cause']) {
  if (cause === 'estorno_parcial' || cause === 'chargeback_sem_reflexo') return 'Estorno / chargeback'
  if (cause === 'nota_ausente') return 'Nota ausente ou atrasada'
  if (cause === 'tarifa_inesperada') return 'Tarifa inesperada'
  return causeLabel(cause)
}

export function buildDashboard(input: {
  orders: Order[]
  cases: ReconciliationCase[]
  payments: Payment[]
  payouts: Payout[]
  invoices: Invoice[]
  filters: Filters
}): DashboardData {
  const { orders, cases, payments, payouts, invoices, filters } = input
  const paymentByOrder = new Map(payments.map((item) => [item.orderId, item]))
  const scopedOrders = orders.filter((order) => orderMatches(order, filters, paymentByOrder.get(order.id)))
  const previousFilters: Filters = shiftPeriod(filters)
  const previousOrders = orders.filter((order) => orderMatches(order, previousFilters, paymentByOrder.get(order.id)))
  const scopedCases = cases.filter((item) => caseMatches(item, filters, orders, payments))
  const current = totals(scopedOrders, scopedCases, invoices)
  const prior = totals(previousOrders, [], invoices)
  const openCases = scopedCases.filter((item) => item.status === 'aberta' || item.status === 'em_analise')

  return {
    kpis: {
      ...current,
      vsGross: delta(current.gross, prior.gross),
      vsExpected: delta(current.expected, prior.expected),
      vsReceived: delta(current.received, prior.received),
      vsDivergence: delta(current.divergence, prior.divergence),
      vsLoss: delta(current.confirmedLoss, prior.confirmedLoss),
    },
    dailySeries: dailySeries(scopedOrders),
    causes: causeBreakdown(scopedCases),
    periodLabel: periodLabel(filters.from, filters.to),
    recoverable: current.recoverable,
    confirmedLoss: current.confirmedLoss,
    actionQueue: openCases.slice(0, 8).map((item) => ({
      id: item.id,
      cause: item.cause,
      description: item.description,
      amount: item.amount,
      status: item.status,
      priority: item.priority,
    })),
    upcomingPayouts: payouts
      .filter((item) => item.status === 'previsto' && (!filters.gateway || item.gateway === filters.gateway))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        netAmount: item.netAmount,
        status: item.status,
        date: item.date,
        gateway: item.gateway,
      })),
  }
}

function shiftPeriod(filters: Filters): Filters {
  const from = new Date(`${filters.from}T00:00:00Z`)
  const to = new Date(`${filters.to}T00:00:00Z`)
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
  const prevTo = new Date(from)
  prevTo.setUTCDate(prevTo.getUTCDate() - 1)
  const prevFrom = new Date(prevTo)
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1))
  return {
    ...filters,
    from: prevFrom.toISOString().slice(0, 10),
    to: prevTo.toISOString().slice(0, 10),
  }
}

function totals(scopedOrders: Order[], scopedCases: ReconciliationCase[], invoices: Invoice[]) {
  const invoiceOrders = new Set(invoices.map((item) => item.orderId))
  const gross = sum(scopedOrders.map((item) => item.grossAmount))
  const expected = sum(scopedOrders.map((item) => item.expectedNet))
  const received = sum(scopedOrders.map((item) => item.actualNet ?? 0))
  const count = scopedOrders.length
  const reconciled = scopedOrders.filter((item) => item.reconciliation.startsWith('reconciliado')).length
  const divergent = scopedOrders.filter((item) => item.reconciliation === 'divergente' || item.reconciliation === 'revisao_manual').length
  const pending = count - reconciled - divergent
  return {
    gross,
    expected,
    received,
    divergence: expected - received,
    confirmedLoss: sum(scopedCases.map((item) => item.confirmedLoss)),
    recoverable: sum(scopedCases.map((item) => item.recoverable)),
    pendingSettlement: sum(
      scopedOrders
        .filter((item) => item.reconciliation === 'pendente_liquidacao' || item.actualNet === null)
        .map((item) => item.expectedNet),
    ),
    pendingInvoices: scopedOrders.filter((item) => !item.invoiceId && !invoiceOrders.has(item.id)).length,
    orders: count,
    avgTicket: count === 0 ? 0 : gross / count,
    itemsSold: sum(scopedOrders.map((item) => item.items)),
    reconciledPct: pct(reconciled, count),
    divergentPct: pct(divergent, count),
    pendingPct: pct(Math.max(pending, 0), count),
  }
}

function dailySeries(scopedOrders: Order[]) {
  const byDay = new Map<string, { esperado: number; recebido: number }>()
  for (const order of scopedOrders) {
    const day = dayKeySafe(order.date)
    const current = byDay.get(day) ?? { esperado: 0, recebido: 0 }
    current.esperado += order.expectedNet
    current.recebido += order.actualNet ?? 0
    byDay.set(day, current)
  }
  return [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, value]) => ({
      day,
      esperado: value.esperado,
      recebido: value.recebido,
      divergencia: value.esperado - value.recebido,
    }))
}

function dayKeySafe(iso: string) {
  return iso.slice(8, 10)
}

function causeBreakdown(scopedCases: ReconciliationCase[]) {
  const grouped = new Map<string, number>()
  for (const item of scopedCases) {
    const label = causeTitle(item.cause)
    grouped.set(label, (grouped.get(label) ?? 0) + item.amount)
  }
  const rows = [...grouped.entries()].sort((left, right) => right[1] - left[1])
  const total = sum(rows.map(([, value]) => value))
  return rows.map(([cause, value]) => ({
    cause,
    value,
    pct: pct(value, total),
  }))
}

