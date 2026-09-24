import { useEffect } from 'react'
import { api, parseComponents } from '../api/client'
import type {
  CalculationSnapshot,
  Closing,
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
  WorkspaceSettings,
} from '../types'
import { useAppState } from './AppState'
import { useAuth } from './AuthContext'
import { useFilters } from './FilterContext'

type SnapshotPayload = Omit<CalculationSnapshot, 'components'> & { components?: unknown }

function toSnapshot(item: SnapshotPayload): CalculationSnapshot {
  return { ...item, components: parseComponents(item.components) }
}

function valueOf<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback
}

function firstError(results: PromiseSettledResult<unknown>[]): string | null {
  const failed = results.find((item): item is PromiseRejectedResult => item.status === 'rejected')
  if (!failed) return null
  return failed.reason instanceof Error ? failed.reason.message : 'Falha ao sincronizar o backend'
}

export function DataSync() {
  const { session } = useAuth()
  const { queryString, refreshKey } = useFilters()
  const { hydrate, setLoading, setError } = useAppState()

  useEffect(() => {
    if (!session) return
    let live = true
    const load = async () => {
      setLoading(true)
      try {
        const results = await Promise.allSettled([
          api<DashboardData>(`/dashboard?${queryString}`),
          api<ReconciliationCase[]>(`/cases?${queryString}`),
          api<Order[]>(`/orders?${queryString}`),
          api<Payment[]>(`/payments?${queryString}`),
          api<Settlement[]>(`/settlements?${queryString}`),
          api<Payout[]>(`/payouts?${queryString}`),
          api<Fee[]>(`/fees?${queryString}`),
          api<Refund[]>(`/refunds?${queryString}`),
          api<{ documents: Invoice[] }>(`/invoices?${queryString}`),
          api<SnapshotPayload[]>('/snapshots'),
          api<Closing[]>('/closings'),
          api<Integration[]>('/integrations'),
          api<ReconciliationRule[]>('/rules'),
          api<WorkspaceSettings>('/settings'),
          api<EngineOverview & { example?: SnapshotPayload | null }>('/engine'),
        ])
        if (!live) return
        const invoices = valueOf(results[8], { documents: [] })
        const engine = valueOf(results[14], null)
        hydrate({
          dashboard: valueOf(results[0], null),
          cases: valueOf(results[1], []),
          orders: valueOf(results[2], []),
          payments: valueOf(results[3], []),
          settlements: valueOf(results[4], []),
          payouts: valueOf(results[5], []),
          fees: valueOf(results[6], []),
          refunds: valueOf(results[7], []),
          invoices: invoices.documents ?? [],
          snapshots: valueOf(results[9], []).map(toSnapshot),
          closings: valueOf(results[10], []),
          integrations: valueOf(results[11], []),
          rules: valueOf(results[12], []),
          settings: valueOf(results[13], null),
          engine: engine
            ? {
                ...engine,
                example: engine.example ? toSnapshot(engine.example) : null,
              }
            : null,
        })
        setError(firstError(results))
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : 'Falha ao sincronizar o backend')
      } finally {
        if (live) setLoading(false)
      }
    }
    void load()
    return () => {
      live = false
    }
  }, [hydrate, queryString, refreshKey, session, setError, setLoading])

  return null
}
