import type { AppSeed } from '../context/AppState'
import { buildDashboard } from '../lib/dashboard'
import { DEFAULT_FILTERS } from '../lib/filters'
import {
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
  caseTimelines,
  tenant,
  users,
} from './fixtures'

export function createTestSeed(): AppSeed {
  return {
    cases: initialCases,
    comments: initialComments,
    closings: initialClosings,
    integrations: initialIntegrations,
    rules: initialRules,
    orders,
    payments,
    settlements,
    payouts,
    fees,
    refunds,
    invoices,
    snapshots,
    timelines: caseTimelines,
    dashboard: buildDashboard({ orders, cases: initialCases, payments, payouts, invoices, filters: DEFAULT_FILTERS }),
    settings: {
      tenant,
      currentUser,
      users,
      tolerances: { cents: 0.05, dateDays: 2, settlementDeadlineDays: 14, rawEventRetentionDays: 180 },
    },
    engine: {
      version: 'sce-v1.4',
      calculations: snapshots.length,
      layers: ['ORDER_PAYMENT', 'PAYMENT_SETTLEMENT', 'SETTLEMENT_PAYOUT', 'ORDER_INVOICE', 'CASE_CONSISTENCY'],
      components: engineComponents,
      example: snapshots[0],
      tolerances: { cents: 0.05, dateDays: 2, settlementDeadlineDays: 14 },
    },
  }
}
