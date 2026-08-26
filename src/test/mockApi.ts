import { buildDashboard } from '../lib/dashboard'
import { DEFAULT_FILTERS } from '../lib/filters'
import {
  caseTimelines,
  causeBreakdown,
  currentUser,
  engineComponents,
  initialCases,
  initialClosings,
  initialComments,
  initialIntegrations,
  initialRules,
  invoices,
  orders,
  payments,
  payouts,
  refunds,
  fees,
  settlements,
  snapshots,
  tenant,
  users,
} from './fixtures'
import { testSession } from './session'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function text(body: string, contentType = 'text/csv', status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType },
  })
}

function empty() {
  return new Response(null, { status: 204 })
}

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const url = new URL(raw, 'http://localhost')
  const method = (init?.method ?? 'GET').toUpperCase()
  const path = url.pathname.replace(/^\/api\/v1/, '') || '/'

  if (path === '/auth/login' && method === 'POST') return json(testSession)
  if (path === '/dashboard') {
    return json(buildDashboard({ orders, cases: initialCases, payments, payouts, invoices, filters: DEFAULT_FILTERS }))
  }
  if (path === '/cases' && method === 'GET') return json(initialCases)
  const caseMatch = path.match(/^\/cases\/([^/]+)(.*)$/)
  if (caseMatch) {
    const id = caseMatch[1]
    const rest = caseMatch[2]
    const item = initialCases.find((row) => row.id === id)
    if (!item) return json({ code: 'NOT_FOUND', message: 'Caso não encontrado' }, 404)
    if (rest === '' && method === 'GET') {
      return json({
        ...item,
        comments: initialComments.filter((row) => row.caseId === id),
        timeline: caseTimelines[id] ?? [],
        calculation: snapshots.find((row) => row.orderId === item.orderId) ?? null,
      })
    }
    if (rest === '/status' && method === 'PATCH') return empty()
    if (rest === '/comments' && method === 'POST') return empty()
    if (rest === '/reprocess' && method === 'POST') return json({ findings: [] })
  }
  if (path === '/orders' && method === 'GET') return json(orders)
  const orderMatch = path.match(/^\/orders\/([^/]+)$/)
  if (orderMatch && method === 'GET') {
    const item = orders.find((row) => row.id === orderMatch[1])
    if (!item) return json({ code: 'NOT_FOUND', message: 'Pedido não encontrado' }, 404)
    return json({
      ...item,
      payment: payments.find((row) => row.orderId === item.id) ?? null,
      settlement: settlements.find((row) => row.orderId === item.id) ?? null,
      payout: payouts.find((row) => row.orderIds.includes(item.id)) ?? null,
      invoice: invoices.find((row) => row.orderId === item.id) ?? null,
      snapshot: snapshots.find((row) => row.orderId === item.id) ?? null,
    })
  }
  if (path === '/payments') return json(payments)
  if (path === '/settlements') return json(settlements)
  if (path === '/payouts') return json(payouts)
  if (path === '/fees') return json(fees)
  if (path === '/refunds') return json(refunds)
  if (path === '/invoices') {
    return json({
      documents: invoices,
      pendingOrders: orders.filter((item) => !item.invoiceId).map((item) => item.id),
    })
  }
  if (path === '/snapshots') return json(snapshots)
  const snapshotMatch = path.match(/^\/snapshots\/([^/]+)$/)
  if (snapshotMatch) {
    const item = snapshots.find((row) => row.id === snapshotMatch[1])
    return item ? json(item) : json({ code: 'NOT_FOUND', message: 'Snapshot não encontrado' }, 404)
  }
  if (path === '/closings' && method === 'GET') return json(initialClosings)
  const closingMatch = path.match(/^\/closings\/([^/]+)(.*)$/)
  if (closingMatch) {
    const item = initialClosings.find((row) => row.id === closingMatch[1])
    if (!item) return json({ code: 'NOT_FOUND', message: 'Fechamento não encontrado' }, 404)
    if (closingMatch[2] === '' && method === 'GET') return json({ ...item, deltas: [], causes: causeBreakdown })
    if (closingMatch[2] === '/close' && method === 'POST') return empty()
  }
  if (path === '/integrations' && method === 'GET') return json(initialIntegrations)
  if (/^\/integrations\/[^/]+\/backfill$/.test(path) && method === 'POST') {
    return json({ id: 'ml', status: 'done', orders: 0, payments: 0, fees: 0, refunds: 0, invoices: 0 })
  }
  if (/^\/integrations\/[^/]+\/(connect|disconnect)$/.test(path) && method === 'POST') return empty()
  if (path === '/rules' && method === 'GET') return json(initialRules)
  if (/^\/rules\/[^/]+$/.test(path) && method === 'PATCH') return empty()
  if (path === '/settings') {
    return json({
      tenant,
      currentUser,
      users,
      tolerances: { cents: 0.05, dateDays: 2, settlementDeadlineDays: 14, rawEventRetentionDays: 180 },
    })
  }
  if (path === '/engine') {
    return json({
      version: 'sce-v1.4',
      calculations: snapshots.length,
      layers: ['ORDER_PAYMENT', 'PAYMENT_SETTLEMENT', 'SETTLEMENT_PAYOUT', 'ORDER_INVOICE', 'CASE_CONSISTENCY'],
      components: engineComponents,
      example: snapshots[0],
      tolerances: { cents: 0.05, dateDays: 2, settlementDeadlineDays: 14 },
    })
  }
  if (path === '/reports' && method === 'GET') return json([])
  const exportMatch = path.match(/^\/reports\/([^/]+)\/export$/)
  if (exportMatch && method === 'POST') return text(`tipo;arquivo\n${exportMatch[1]};${exportMatch[1]}.csv`)

  return json({ code: 'NOT_FOUND', message: `Rota de teste não mapeada: ${method} ${path}` }, 404)
}
