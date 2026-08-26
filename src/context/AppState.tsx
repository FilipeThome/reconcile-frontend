import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, loadSession } from '../api/client'
import { asCount, isSafeIntegrationId, isTrustedAuthorizationUrl } from '../lib/oauth'
import type {
  CalculationSnapshot,
  CaseStatus,
  Closing,
  Comment,
  DashboardData,
  EngineOverview,
  Fee,
  Integration,
  Invoice,
  Order,
  Payment,
  Payout,
  ReconciliationCase,
  ReconciliationRule,
  Refund,
  Settlement,
  TimelineEvent,
  WorkspaceSettings,
} from '../types'

export type AppSeed = {
  cases?: ReconciliationCase[]
  comments?: Comment[]
  closings?: Closing[]
  integrations?: Integration[]
  rules?: ReconciliationRule[]
  orders?: Order[]
  payments?: Payment[]
  settlements?: Settlement[]
  payouts?: Payout[]
  fees?: Fee[]
  refunds?: Refund[]
  invoices?: Invoice[]
  snapshots?: CalculationSnapshot[]
  timelines?: Record<string, TimelineEvent[]>
  dashboard?: DashboardData | null
  settings?: WorkspaceSettings | null
  engine?: EngineOverview | null
}

type AppStateValue = {
  cases: ReconciliationCase[]
  comments: Comment[]
  closings: Closing[]
  integrations: Integration[]
  rules: ReconciliationRule[]
  orders: Order[]
  payments: Payment[]
  settlements: Settlement[]
  payouts: Payout[]
  fees: Fee[]
  refunds: Refund[]
  invoices: Invoice[]
  snapshots: CalculationSnapshot[]
  timelines: Record<string, TimelineEvent[]>
  dashboard: DashboardData | null
  settings: WorkspaceSettings | null
  engine: EngineOverview | null
  loading: boolean
  error: string | null
  toast: string | null
  hydrate: (seed: AppSeed) => void
  setLoading: (value: boolean) => void
  setError: (value: string | null) => void
  updateCaseStatus: (id: string, status: CaseStatus) => void
  addComment: (caseId: string, text: string) => void
  closePeriod: (id: string) => void
  toggleIntegration: (id: string) => void
  toggleRule: (id: string) => void
  reprocessCase: (id: string) => void
  backfillIntegration: (id: string) => Promise<void>
  showToast: (message: string) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

const statusToast: Record<CaseStatus, string> = {
  aberta: 'reaberto',
  em_analise: 'marcado em análise',
  resolvida: 'resolvido',
  ignorada: 'ignorado',
}

function run(task: () => Promise<void>, fallback: () => void, onError: (message: string) => void): Promise<void> {
  if (!loadSession()) {
    fallback()
    return Promise.resolve()
  }
  return task().catch((err: Error) => onError(err.message))
}

export function AppStateProvider({ children, seed }: { children: ReactNode; seed?: AppSeed }) {
  const [cases, setCases] = useState(seed?.cases ?? [])
  const [comments, setComments] = useState(seed?.comments ?? [])
  const [closings, setClosings] = useState(seed?.closings ?? [])
  const [integrations, setIntegrations] = useState(seed?.integrations ?? [])
  const [rules, setRules] = useState(seed?.rules ?? [])
  const [orders, setOrders] = useState(seed?.orders ?? [])
  const [payments, setPayments] = useState(seed?.payments ?? [])
  const [settlements, setSettlements] = useState(seed?.settlements ?? [])
  const [payouts, setPayouts] = useState(seed?.payouts ?? [])
  const [fees, setFees] = useState(seed?.fees ?? [])
  const [refunds, setRefunds] = useState(seed?.refunds ?? [])
  const [invoices, setInvoices] = useState(seed?.invoices ?? [])
  const [snapshots, setSnapshots] = useState(seed?.snapshots ?? [])
  const [timelines, setTimelines] = useState(seed?.timelines ?? {})
  const [dashboard, setDashboard] = useState<DashboardData | null>(seed?.dashboard ?? null)
  const [settings, setSettings] = useState<WorkspaceSettings | null>(seed?.settings ?? null)
  const [engine, setEngine] = useState<EngineOverview | null>(seed?.engine ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const integrationsRef = useRef(integrations)
  integrationsRef.current = integrations

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const hydrate = useCallback((next: AppSeed) => {
    if (next.cases) setCases(next.cases)
    if (next.comments) setComments(next.comments)
    if (next.closings) setClosings(next.closings)
    if (next.integrations) setIntegrations(next.integrations)
    if (next.rules) setRules(next.rules)
    if (next.orders) setOrders(next.orders)
    if (next.payments) setPayments(next.payments)
    if (next.settlements) setSettlements(next.settlements)
    if (next.payouts) setPayouts(next.payouts)
    if (next.fees) setFees(next.fees)
    if (next.refunds) setRefunds(next.refunds)
    if (next.invoices) setInvoices(next.invoices)
    if (next.snapshots) setSnapshots(next.snapshots)
    if (next.timelines) setTimelines(next.timelines)
    if (next.dashboard !== undefined) setDashboard(next.dashboard)
    if (next.settings !== undefined) setSettings(next.settings)
    if (next.engine !== undefined) setEngine(next.engine)
  }, [])

  const updateCaseStatus = useCallback(
    (id: string, status: CaseStatus) => {
      run(
        async () => {
          await api(`/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
          setCases((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
          showToast(`Caso ${id} ${statusToast[status]}.`)
        },
        () => {
          setCases((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
          showToast(`Caso ${id} ${statusToast[status]}.`)
        },
        showToast,
      )
    },
    [showToast],
  )

  const addComment = useCallback(
    (caseId: string, text: string) => {
      const author = loadSession()?.name ?? 'Ana Dantas'
      run(
        async () => {
          await api(`/cases/${caseId}/comments`, { method: 'POST', body: JSON.stringify({ text }) })
          setComments((current) => [
            ...current,
            { id: `cmt-${Date.now()}`, caseId, author, at: new Date().toISOString(), text },
          ])
        },
        () => {
          setComments((current) => [
            ...current,
            { id: `cmt-${Date.now()}`, caseId, author, at: new Date().toISOString(), text },
          ])
        },
        showToast,
      )
    },
    [showToast],
  )

  const closePeriod = useCallback(
    (id: string) => {
      run(
        async () => {
          await api(`/closings/${id}/close`, { method: 'POST' })
          setClosings((current) =>
            current.map((item) => (item.id === id ? { ...item, status: 'closed', closedAt: new Date().toISOString() } : item)),
          )
          showToast(`Período ${id} fechado.`)
        },
        () => {
          setClosings((current) =>
            current.map((item) => (item.id === id ? { ...item, status: 'closed', closedAt: new Date().toISOString() } : item)),
          )
          showToast(`Período ${id} fechado.`)
        },
        showToast,
      )
    },
    [showToast],
  )

  const toggleIntegration = useCallback(
    (id: string) => {
      if (!isSafeIntegrationId(id)) return
      run(
        async () => {
          const current = integrationsRef.current.find((item) => item.id === id)
          const next = current?.status === 'ativa' ? 'disponivel' : 'ativa'
          const result = await api<{ authorizationUrl?: string }>(`/integrations/${id}/${next === 'ativa' ? 'connect' : 'disconnect'}`, {
            method: 'POST',
          })
          if (result?.authorizationUrl) {
            if (!isTrustedAuthorizationUrl(result.authorizationUrl)) {
              showToast('URL de autorização rejeitada.')
              return
            }
            window.location.assign(result.authorizationUrl)
            return
          }
          setIntegrations((list) => list.map((item) => (item.id === id ? { ...item, status: next } : item)))
        },
        () => {
          setIntegrations((list) =>
            list.map((item) => (item.id === id ? { ...item, status: item.status === 'ativa' ? 'disponivel' : 'ativa' } : item)),
          )
        },
        showToast,
      )
    },
    [showToast],
  )

  const toggleRule = useCallback(
    (id: string) => {
      run(
        async () => {
          await api(`/rules/${id}`, { method: 'PATCH' })
          setRules((current) => current.map((item) => (item.id === id ? { ...item, active: !item.active } : item)))
        },
        () => {
          setRules((current) => current.map((item) => (item.id === id ? { ...item, active: !item.active } : item)))
        },
        showToast,
      )
    },
    [showToast],
  )

  const reprocessCase = useCallback(
    (id: string) => {
      run(
        async () => {
          const result = await api<{ findings?: { code: string }[] }>(`/cases/${id}/reprocess`, { method: 'POST' })
          showToast(`Caso ${id} reprocessado. ${result.findings?.length ?? 0} achado(s) do motor.`)
        },
        () => showToast('Reprocessamento requer sessão no backend.'),
        showToast,
      )
    },
    [showToast],
  )

  const backfillIntegration = useCallback(
    (id: string) => {
      if (!isSafeIntegrationId(id)) return Promise.resolve()
      return run(
        async () => {
          const result = await api<{ orders?: number; invoices?: number }>(`/integrations/${id}/backfill`, { method: 'POST' })
          showToast(`Backfill: ${asCount(result?.orders)} pedidos, ${asCount(result?.invoices)} notas.`)
        },
        () => showToast('Backfill requer sessão no backend.'),
        showToast,
      )
    },
    [showToast],
  )

  const value = useMemo<AppStateValue>(
    () => ({
      cases,
      comments,
      closings,
      integrations,
      rules,
      orders,
      payments,
      settlements,
      payouts,
      fees,
      refunds,
      invoices,
      snapshots,
      timelines,
      dashboard,
      settings,
      engine,
      loading,
      error,
      toast,
      hydrate,
      setLoading,
      setError,
      updateCaseStatus,
      addComment,
      closePeriod,
      toggleIntegration,
      toggleRule,
      reprocessCase,
      backfillIntegration,
      showToast,
    }),
    [
      addComment,
      backfillIntegration,
      cases,
      closePeriod,
      closings,
      comments,
      dashboard,
      engine,
      error,
      fees,
      hydrate,
      integrations,
      invoices,
      loading,
      orders,
      payments,
      payouts,
      refunds,
      reprocessCase,
      rules,
      settings,
      settlements,
      showToast,
      snapshots,
      timelines,
      toast,
      toggleIntegration,
      toggleRule,
      updateCaseStatus,
    ],
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState deve ser usado dentro de AppStateProvider')
  return context
}
