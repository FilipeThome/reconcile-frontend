import { getLocale, labelOf, t } from '../i18n/locale'
import type { CaseStatus, ClosingStatus, DivergenceCause, InvoiceStatus, ReconciliationStatus } from '../types'

export function formatCount(value: number) {
  return value.toLocaleString(getLocale())
}

export function formatBRL(value: number) {
  return value.toLocaleString(getLocale(), { style: 'currency', currency: 'BRL' })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(getLocale())
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(getLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function displayRole(role: string) {
  return labelOf(role)
}

export function formatPct(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export function causeLabel(cause: DivergenceCause) {
  return t(`cause.${cause}`)
}

export function reconLabel(status: ReconciliationStatus) {
  return t(`status.${status}`)
}

export function caseStatusLabel(status: CaseStatus) {
  return t(`status.${status}`)
}

export function invoiceLabel(status: InvoiceStatus) {
  return t(`status.${status}`)
}

export function closingLabel(status: ClosingStatus) {
  return t(`status.${status}`)
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
