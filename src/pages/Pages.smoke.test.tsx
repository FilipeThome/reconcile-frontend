import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/render'
import { CalculationEngine } from './CalculationEngine'
import { Closings } from './Closings'
import { Dashboard } from './Dashboard'
import { Fees } from './Fees'
import { Fiscal } from './Fiscal'
import { Integrations } from './Integrations'
import { OrderDetail } from './OrderDetail'
import { Payments } from './Payments'
import { Payouts } from './Payouts'
import { Refunds } from './Refunds'
import { Reports } from './Reports'
import { Rules } from './Rules'
import { Settings } from './Settings'
import { Settlements } from './Settlements'

describe('page catalog', () => {
  it('renders operational list pages', async () => {
    const user = userEvent.setup()
    renderApp(<Dashboard />)
    expect(screen.getByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument()

    renderApp(<Payments />)
    expect(screen.getByRole('heading', { name: 'Pagamentos' })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Buscar pagamento ou pedido'), 'PAY')

    renderApp(<Settlements />)
    expect(screen.getByRole('heading', { name: 'Liquidações' })).toBeInTheDocument()

    renderApp(<Payouts />)
    expect(screen.getByRole('heading', { name: 'Repasses' })).toBeInTheDocument()

    renderApp(<Fees />)
    expect(screen.getByRole('heading', { name: 'Tarifas' })).toBeInTheDocument()

    renderApp(<Refunds />)
    expect(screen.getByRole('heading', { name: 'Reembolsos e chargebacks' })).toBeInTheDocument()
  })

  it('renders closing and system pages', async () => {
    const user = userEvent.setup()
    renderApp(<Fiscal />)
    expect(screen.getByRole('heading', { name: 'Fiscal' })).toBeInTheDocument()

    renderApp(<Closings />)
    expect(screen.getByRole('heading', { name: 'Fechamentos' })).toBeInTheDocument()

    renderApp(<CalculationEngine />)
    expect(screen.getByRole('heading', { name: 'Motor de cálculo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Componentes' }))
    await user.click(screen.getByRole('button', { name: 'Configurações' }))

    renderApp(<Rules />)
    expect(screen.getByRole('heading', { name: 'Regras de reconciliação' })).toBeInTheDocument()

    renderApp(<Integrations />)
    expect(screen.getByRole('heading', { name: 'Integrações' })).toBeInTheDocument()

    renderApp(<Settings />)
    expect(screen.getByRole('heading', { name: 'Configurações' })).toBeInTheDocument()

    renderApp(<Reports />)
    expect(screen.getByRole('heading', { name: 'Relatórios' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Gerar' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Agendamentos' }))
    await user.click(screen.getByRole('button', { name: 'Historico' }))
  })

  it('renders order detail from the catalog', () => {
    renderApp(
      <Routes>
        <Route path="/pedidos/:id" element={<OrderDetail />} />
      </Routes>,
      { route: '/pedidos/PED-200001234' },
    )
    expect(screen.getByRole('heading', { name: 'PED-200001234' })).toBeInTheDocument()
  })
})
