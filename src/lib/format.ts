import type { CaseStatus, ClosingStatus, DivergenceCause, InvoiceStatus, ReconciliationStatus } from '../types'

export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function displayRole(role: string) {
  const normalized = role.toLowerCase()
  if (normalized === 'admin') return 'Administrador'
  if (normalized === 'operador') return 'Operador'
  if (normalized === 'contador') return 'Contador'
  return role
}

export function formatPct(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export function causeLabel(cause: DivergenceCause) {
  const map: Record<DivergenceCause, string> = {
    repasse_nao_realizado: 'Repasse não realizado',
    tarifa_inesperada: 'Tarifa inesperada',
    nota_ausente: 'Nota ausente',
    valor_faturado_divergente: 'Valor faturado divergente',
    estorno_parcial: 'Estorno parcial',
    chargeback_sem_reflexo: 'Chargeback sem reflexo',
    duplicidade: 'Duplicidade',
  }
  return map[cause]
}

export function reconLabel(status: ReconciliationStatus) {
  const map: Record<ReconciliationStatus, string> = {
    reconciliado: 'Reconciliado',
    reconciliado_alerta: 'Reconciliado com alerta',
    pendente_dados: 'Pendente de dados',
    pendente_liquidacao: 'Pendente de liquidação',
    divergente: 'Divergente',
    revisao_manual: 'Revisão manual',
    fechado: 'Fechado',
    ignorado: 'Ignorado',
  }
  return map[status]
}

export function caseStatusLabel(status: CaseStatus) {
  const map: Record<CaseStatus, string> = {
    aberta: 'Aberta',
    em_analise: 'Em análise',
    resolvida: 'Resolvida',
    ignorada: 'Ignorada',
  }
  return map[status]
}

export function invoiceLabel(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    autorizada: 'Autorizada',
    pendente: 'Pendente',
    rejeitada: 'Rejeitada',
    nao_obrigatoria: 'Não obrigatória',
  }
  return map[status]
}

export function closingLabel(status: ClosingStatus) {
  return status === 'open' ? 'Aberto' : 'Fechado'
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
