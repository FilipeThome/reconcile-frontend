import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders reconciliation and case labels', () => {
    const { rerender } = render(<StatusBadge kind="recon" value="divergente" />)
    expect(screen.getByText('Divergente')).toHaveClass('divergente')

    rerender(<StatusBadge kind="case" value="em_analise" />)
    expect(screen.getByText('Em análise')).toHaveClass('em_analise')
  })

  it('renders impact, priority and closing labels', () => {
    const { rerender } = render(<StatusBadge kind="impact" value="recuperavel" />)
    expect(screen.getByText('Recuperável')).toBeInTheDocument()

    rerender(<StatusBadge kind="priority" value="alta" />)
    expect(screen.getByText('Alta')).toBeInTheDocument()

    rerender(<StatusBadge kind="closing" value="open" />)
    expect(screen.getByText('Aberto')).toBeInTheDocument()
  })
})
