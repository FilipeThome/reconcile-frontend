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
  if (path === '/integrations/ml/stock' && method === 'GET') return stockPage(url)
  const stockItem = path.match(/^\/integrations\/ml\/stock\/([^/]+)$/)
  if (stockItem && method === 'GET') {
    const item = stockItems.find((row) => row.id === stockItem[1])
    return item ? json(item) : json({ code: 'NOT_FOUND', message: 'Anúncio não encontrado' }, 404)
  }
  if (stockItem && method === 'PUT') return updateStock(stockItem[1], init?.body)
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

type MockStock = {
  id: string
  title: string
  sku: string | null
  status: string
  availableQuantity: number
  soldQuantity: number
  permalink: string | null
  userProductId: string | null
  editable: boolean
  stockAvailable?: boolean
  variations: { id: number; label: string; sku: string | null; availableQuantity: number; userProductId: string | null }[]
  locations: { type: string; quantity: number; storeId: string | null; networkNodeId: string | null; editable: boolean }[]
}

function stockRow(partial: Pick<MockStock, 'id' | 'title'> & Partial<MockStock>): MockStock {
  return {
    sku: null,
    status: 'active',
    availableQuantity: 1,
    soldQuantity: 0,
    permalink: null,
    userProductId: null,
    editable: true,
    variations: [],
    locations: [],
    ...partial,
  }
}

function defaultStock(): MockStock[] {
  const filler = Array.from({ length: 17 }, (_, index) =>
    stockRow({
      id: `MLB10001${String(index).padStart(3, '0')}`,
      title: index === 16 ? 'Ultimo anuncio' : `Item extra ${index}`,
      locations: index === 0 ? [{ type: 'other', quantity: 1, storeId: null, networkNodeId: null, editable: false }] : [],
      editable: index === 0 ? false : true,
      stockAvailable: index === 0 ? false : true,
    }),
  )
  return [
    stockRow({
      id: 'MLB10000001',
      title: 'Camiseta azul',
      sku: 'CAM-AZ',
      availableQuantity: 8,
      soldQuantity: 2,
      permalink: 'https://produto.mercadolivre.com.br/MLB10000001',
      locations: [{ type: 'selling_address', quantity: 8, storeId: null, networkNodeId: null, editable: true }],
    }),
    stockRow({
      id: 'MLB10000002',
      title: 'Tenis',
      sku: 'TEN',
      availableQuantity: 5,
      variations: [
        { id: 11, label: '40', sku: 'TEN-40', availableQuantity: 2, userProductId: null },
        { id: 12, label: '41', sku: 'TEN-41', availableQuantity: 3, userProductId: null },
      ],
    }),
    stockRow({
      id: 'MLB10000003',
      title: 'Mochila',
      sku: 'MOC',
      availableQuantity: 9,
      userProductId: 'MLBU10000003',
      locations: [
        { type: 'seller_warehouse', quantity: 4, storeId: 'A1', networkNodeId: 'N1', editable: true },
        { type: 'seller_warehouse', quantity: 5, storeId: 'B2', networkNodeId: 'N2', editable: true },
      ],
    }),
    stockRow({
      id: 'MLB10000004',
      title: 'Fone Full',
      sku: 'FON',
      availableQuantity: 3,
      editable: false,
      locations: [{ type: 'meli_facility', quantity: 3, storeId: null, networkNodeId: null, editable: false }],
    }),
    stockRow({ id: 'MLB10000005', title: 'Anuncio encerrado', sku: 'ENC', status: 'closed', editable: false }),
    stockRow({ id: 'MLB10000006', title: 'Anuncio pausado', sku: 'PAU', status: 'paused' }),
    stockRow({ id: 'MLB10000007', title: 'Anuncio inativo', sku: 'INA', status: 'inactive' }),
    ...filler,
  ]
}

let stockItems = defaultStock()

export function resetMockStock() {
  stockItems = defaultStock()
}

function stockPage(url: URL) {
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  if (q === 'erro') return json({ code: 'UNPROCESSABLE', message: 'Falha ao consultar o Mercado Livre' }, 422)
  const status = url.searchParams.get('status')
  const offset = Number(url.searchParams.get('offset') ?? 0)
  const limit = Number(url.searchParams.get('limit') ?? 20)
  const rows = stockItems.filter((item) => {
    const matchesStatus = !status || item.status === status
    const matchesQuery = !q || item.id.toLowerCase() === q || item.sku?.toLowerCase() === q || item.title.toLowerCase().includes(q)
    return matchesStatus && matchesQuery
  })
  return json({ total: rows.length, offset, limit, items: rows.slice(offset, offset + limit) })
}

function updateStock(id: string, raw: BodyInit | null | undefined) {
  const body = JSON.parse(String(raw ?? '{}')) as {
    availableQuantity?: number
    variationId?: number
    storeId?: string
    networkNodeId?: string
  }
  if (body.availableQuantity === 13) {
    return json({ code: 'UNPROCESSABLE', message: 'A API do Mercado Livre recusou a atualização' }, 422)
  }
  const item = stockItems.find((row) => row.id === id)
  if (!item) return json({ code: 'NOT_FOUND', message: 'Anúncio não encontrado' }, 404)
  const quantity = Number(body.availableQuantity)
  if (body.variationId) {
    item.variations = item.variations.map((variation) =>
      variation.id === body.variationId ? { ...variation, availableQuantity: quantity } : variation,
    )
  } else if (body.storeId) {
    item.locations = item.locations.map((location) =>
      location.storeId === body.storeId &&
      (body.networkNodeId == null || location.networkNodeId === body.networkNodeId)
        ? { ...location, quantity }
        : location,
    )
  } else {
    item.availableQuantity = quantity
    item.locations = item.locations.map((location) =>
      location.type === 'selling_address' ? { ...location, quantity } : location,
    )
  }
  return json(item)
}
