export type Marketplace = 'Mercado Livre' | 'CSV' | 'Shopee'
export type Gateway = 'Mercado Pago' | 'CSV' | 'Shopee'

export type ReconciliationStatus =
  | 'reconciliado'
  | 'reconciliado_alerta'
  | 'pendente_dados'
  | 'pendente_liquidacao'
  | 'divergente'
  | 'revisao_manual'
  | 'fechado'
  | 'ignorado'

export type CaseStatus = 'aberta' | 'em_analise' | 'resolvida' | 'ignorada'
export type CaseImpact = 'recuperavel' | 'perda_confirmada' | 'aguardando'
export type Priority = 'alta' | 'media' | 'baixa'
export type ClosingStatus = 'open' | 'closed'
export type InvoiceStatus = 'autorizada' | 'pendente' | 'rejeitada' | 'nao_obrigatoria'
export type PaymentStatus = 'aprovado' | 'pendente' | 'estornado' | 'chargeback'
export type OrderStatus = 'pago' | 'cancelado' | 'pendente'

export type DivergenceCause =
  | 'repasse_nao_realizado'
  | 'tarifa_inesperada'
  | 'nota_ausente'
  | 'valor_faturado_divergente'
  | 'estorno_parcial'
  | 'chargeback_sem_reflexo'
  | 'duplicidade'

export type Order = {
  id: string
  date: string
  buyer: string
  marketplace: Marketplace
  items: number
  grossAmount: number
  expectedNet: number
  actualNet: number | null
  status: OrderStatus
  reconciliation: ReconciliationStatus
  paymentId: string | null
  settlementId: string | null
  payoutId: string | null
  invoiceId: string | null
  caseId: string | null
}

export type Payment = {
  id: string
  orderId: string
  date: string
  gateway: Gateway
  method: 'Pix' | 'Cartão' | 'Boleto'
  grossAmount: number
  fees: number
  netAmount: number
  status: PaymentStatus
  reconciliation: ReconciliationStatus
}

export type Settlement = {
  id: string
  paymentId: string
  orderId: string
  date: string
  expectedNet: number
  actualNet: number | null
  status: ReconciliationStatus
  snapshotId: string
}

export type Payout = {
  id: string
  gateway: Gateway
  date: string
  grossAmount: number
  fees: number
  netAmount: number
  status: 'previsto' | 'concluido' | 'atrasado'
  reconciliation: ReconciliationStatus
  orderIds: string[]
}

export type Fee = {
  id: string
  orderId: string
  type: string
  expected: number
  actual: number
  source: string
  date: string
}

export type Refund = {
  id: string
  orderId: string
  type: 'estorno' | 'chargeback'
  date: string
  amount: number
  reflectedInSettlement: boolean
  status: string
}

export type Invoice = {
  id: string
  orderId: string
  type: 'NF-e' | 'NFC-e'
  number: string
  key: string
  issuedAt: string | null
  total: number
  status: InvoiceStatus
  cbs: number | null
  ibs: number | null
}

export type ReconciliationCase = {
  id: string
  openedAt: string
  orderId: string
  paymentId: string | null
  settlementId: string | null
  payoutId: string | null
  invoiceId: string | null
  cause: DivergenceCause
  description: string
  amount: number
  recoverable: number
  confirmedLoss: number
  impact: CaseImpact
  status: CaseStatus
  priority: Priority
  owner: string
  confidence: number
  suggestedAction: string
}

export type TimelineEvent = {
  id: string
  at: string
  title: string
  detail: string
  tone: 'neutral' | 'success' | 'warning' | 'danger'
}

export type Comment = {
  id: string
  caseId: string
  author: string
  at: string
  text: string
}

export type CalculationSnapshot = {
  id: string
  orderId: string
  version: string
  gross: number
  components: { label: string; amount: number }[]
  expected: number
  actual: number
  difference: number
}

export type Closing = {
  id: string
  period: string
  label: string
  status: ClosingStatus
  closedAt: string | null
  orders: number
  gross: number
  expected: number
  received: number
  fees: number
  refunds: number
  openDiff: number
  pendingInvoices: number
  deltas?: ClosingDelta[]
  causes?: { cause: string; value: number; pct: number }[]
}

export type Integration = {
  id: string
  name: string
  kind: 'marketplace' | 'gateway' | 'fiscal' | 'importacao'
  status: 'ativa' | 'disponivel' | 'erro'
  lastSync: string | null
  detail: string
}

export type ReconciliationRule = {
  id: string
  name: string
  description: string
  type: 'financeira' | 'temporal' | 'fiscal' | 'operacional'
  active: boolean
}

export type UserAccount = {
  name: string
  email: string
  role: 'admin' | 'operador' | 'contador'
}

export type Filters = {
  from: string
  to: string
  marketplace: '' | Marketplace
  gateway: '' | Gateway
}

export type DashboardKpis = {
  gross: number
  expected: number
  received: number
  divergence: number
  confirmedLoss: number
  recoverable: number
  pendingSettlement: number
  pendingInvoices: number
  orders: number
  avgTicket: number
  itemsSold: number
  reconciledPct: number
  divergentPct: number
  pendingPct: number
  vsGross: number
  vsExpected: number
  vsReceived: number
  vsDivergence: number
  vsLoss: number
}

export type DashboardData = {
  kpis: DashboardKpis
  dailySeries: { day: string; esperado: number; recebido: number; divergencia: number }[]
  causes: { cause: string; value: number; pct: number }[]
  periodLabel: string
  recoverable: number
  confirmedLoss: number
  actionQueue: { id: string; cause: string; description: string; amount: number; status: CaseStatus; priority: Priority }[]
  upcomingPayouts: { id: string; netAmount: number; status: string; date?: string; gateway?: string }[]
}

export type ClosingDelta = {
  reason: string
  amount: number
  createdAt: string
}

export type WorkspaceSettings = {
  tenant: { id: string; name: string; sellerId: string }
  currentUser?: UserAccount
  users: UserAccount[]
  tolerances: { cents: number; dateDays: number; settlementDeadlineDays: number; rawEventRetentionDays: number }
}

export type EngineOverview = {
  version: string
  calculations: number
  layers: string[]
  components: { label: string; amount: number; pct: number }[]
  example?: CalculationSnapshot | null
  tolerances?: { cents: number; dateDays: number; settlementDeadlineDays: number }
}
