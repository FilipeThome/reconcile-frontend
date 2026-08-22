import { caseStatusLabel, closingLabel, invoiceLabel, reconLabel } from '../lib/format'
import type { CaseImpact, CaseStatus, ClosingStatus, InvoiceStatus, Priority, ReconciliationStatus } from '../types'

type Props = {
  kind: 'recon' | 'case' | 'invoice' | 'closing' | 'impact' | 'priority' | 'plain'
  value: string
}

const impactLabel: Record<CaseImpact, string> = {
  recuperavel: 'Recuperável',
  perda_confirmada: 'Perda confirmada',
  aguardando: 'Aguardando',
}

const priorityLabel: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export function StatusBadge({ kind, value }: Props) {
  let label = value
  if (kind === 'recon') label = reconLabel(value as ReconciliationStatus)
  if (kind === 'case') label = caseStatusLabel(value as CaseStatus)
  if (kind === 'invoice') label = invoiceLabel(value as InvoiceStatus)
  if (kind === 'closing') label = closingLabel(value as ClosingStatus)
  if (kind === 'impact') label = impactLabel[value as CaseImpact] ?? value
  if (kind === 'priority') label = priorityLabel[value as Priority] ?? value
  return <span className={`badge ${value}`}>{label}</span>
}
