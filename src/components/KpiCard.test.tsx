import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiCard } from './KpiCard'

describe('KpiCard', () => {
  it('shows value, hint and positive delta', () => {
    render(<KpiCard label="Em divergência" value="R$ 24,00" delta={8.7} hint="8 casos" tone="warning" />)
    expect(screen.getByText('Em divergência')).toBeInTheDocument()
    expect(screen.getByText('R$ 24,00')).toBeInTheDocument()
    expect(screen.getByText('+8,7% vs período anterior')).toHaveClass('up')
    expect(screen.getByText('8 casos')).toBeInTheDocument()
  })

  it('marks negative deltas as down', () => {
    render(<KpiCard label="Recebido" value="R$ 10" delta={-2} />)
    expect(screen.getByText('-2,0% vs período anterior')).toHaveClass('down')
  })
})
