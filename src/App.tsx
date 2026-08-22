import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AppStateProvider } from './context/AppState'
import { CalculationEngine } from './pages/CalculationEngine'
import { ClosingDetail } from './pages/ClosingDetail'
import { Closings } from './pages/Closings'
import { Dashboard } from './pages/Dashboard'
import { Discrepancies } from './pages/Discrepancies'
import { DiscrepancyDetail } from './pages/DiscrepancyDetail'
import { Fees } from './pages/Fees'
import { Fiscal } from './pages/Fiscal'
import { Integrations } from './pages/Integrations'
import { OrderDetail } from './pages/OrderDetail'
import { Orders } from './pages/Orders'
import { Payments } from './pages/Payments'
import { Payouts } from './pages/Payouts'
import { Refunds } from './pages/Refunds'
import { Reports } from './pages/Reports'
import { Rules } from './pages/Rules'
import { Settings } from './pages/Settings'
import { Settlements } from './pages/Settlements'

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/pedidos/:id" element={<OrderDetail />} />
            <Route path="/pagamentos" element={<Payments />} />
            <Route path="/liquidacoes" element={<Settlements />} />
            <Route path="/repasses" element={<Payouts />} />
            <Route path="/tarifas" element={<Fees />} />
            <Route path="/reembolsos" element={<Refunds />} />
            <Route path="/divergencias" element={<Discrepancies />} />
            <Route path="/divergencias/:id" element={<DiscrepancyDetail />} />
            <Route path="/motor" element={<CalculationEngine />} />
            <Route path="/regras" element={<Rules />} />
            <Route path="/fiscal" element={<Fiscal />} />
            <Route path="/fechamentos" element={<Closings />} />
            <Route path="/fechamentos/:id" element={<ClosingDetail />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/integracoes" element={<Integrations />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  )
}
