import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  caseStatusLabel,
  causeLabel,
  closingLabel,
  downloadCsv,
  formatBRL,
  formatDate,
  formatDateTime,
  formatPct,
  displayRole,
  invoiceLabel,
  reconLabel,
} from './format'

describe('formatBRL', () => {
  it('formats BRL with two decimals', () => {
    const value = formatBRL(842.31)
    expect(value).toContain('842,31')
    expect(value.replace(/\s/g, '')).toMatch(/R\$/)
  })
})

describe('formatPct', () => {
  it('adds a plus sign for positive deltas', () => {
    expect(formatPct(12.5)).toBe('+12,5%')
  })

  it('keeps the minus sign for negative deltas', () => {
    expect(formatPct(-3.1)).toBe('-3,1%')
  })
})

describe('formatDate and formatDateTime', () => {
  it('renders a Brazilian date', () => {
    expect(formatDate('2026-05-04T11:22:00')).toMatch(/\d{2}\/\d{2}\/2026/)
  })

  it('renders date and time', () => {
    expect(formatDateTime('2026-05-04T11:22:00')).toMatch(/\d{2}\/\d{2}\/2026/)
  })
})

describe('domain labels', () => {
  it('maps reconciliation and case statuses', () => {
    expect(reconLabel('pendente_liquidacao')).toBe('Pendente de liquidação')
    expect(caseStatusLabel('em_analise')).toBe('Em análise')
    expect(closingLabel('open')).toBe('Aberto')
    expect(closingLabel('closed')).toBe('Fechado')
    expect(invoiceLabel('autorizada')).toBe('Autorizada')
    expect(causeLabel('repasse_nao_realizado')).toBe('Repasse não realizado')
    expect(displayRole('ADMIN')).toBe('Administrador')
    expect(displayRole('operador')).toBe('Operador')
    expect(displayRole('contador')).toBe('Contador')
    expect(displayRole('outro')).toBe('outro')
  })
})

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('escapes quotes and triggers a download', () => {
    const click = vi.fn()
    const revoke = vi.fn()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke)
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      href: '',
      download: '',
    } as HTMLAnchorElement)

    downloadCsv('divergencias.csv', [
      ['id', 'nota'],
      ['DIV-1', 'valor "especial"'],
    ])

    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:csv')
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob
    expect(blob.type).toContain('text/csv')
  })
})
