import { labelOf } from '../i18n/locale'
import { caseStatusLabel, closingLabel, invoiceLabel, reconLabel } from '../lib/format'
import type { CaseStatus, ClosingStatus, InvoiceStatus, ReconciliationStatus } from '../types'

type Props = {
  kind: 'recon' | 'case' | 'invoice' | 'closing' | 'impact' | 'priority' | 'plain'
  value: string
}

export function StatusBadge({ kind, value }: Props) {
  let label = labelOf(value)
  if (kind === 'recon') label = reconLabel(value as ReconciliationStatus)
  if (kind === 'case') label = caseStatusLabel(value as CaseStatus)
  if (kind === 'invoice') label = invoiceLabel(value as InvoiceStatus)
  if (kind === 'closing') label = closingLabel(value as ClosingStatus)
  return <span className={`badge ${value}`}>{label}</span>
}
