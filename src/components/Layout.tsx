import {
  BookOpen,
  Calculator,
  FileSpreadsheet,
  FileText,
  GitCompare,
  LayoutDashboard,
  Link2,
  Receipt,
  Scale,
  Settings,
  ShoppingBag,
  Split,
  TriangleAlert,
  Undo2,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { currentUser, tenant } from '../data/mock'

const groups = [
  {
    label: 'Operação',
    items: [
      { to: '/', label: 'Visão Geral', icon: LayoutDashboard, end: true },
      { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
      { to: '/pagamentos', label: 'Pagamentos', icon: Wallet },
      { to: '/liquidacoes', label: 'Liquidações', icon: Scale },
      { to: '/repasses', label: 'Repasses', icon: Split },
      { to: '/tarifas', label: 'Tarifas', icon: Receipt },
      { to: '/reembolsos', label: 'Reembolsos', icon: Undo2 },
    ],
  },
  {
    label: 'Reconciliação',
    items: [
      { to: '/divergencias', label: 'Divergências', icon: TriangleAlert },
      { to: '/motor', label: 'Motor de cálculo', icon: Calculator },
      { to: '/regras', label: 'Regras', icon: GitCompare },
    ],
  },
  {
    label: 'Fechamento',
    items: [
      { to: '/fiscal', label: 'Fiscal', icon: FileText },
      { to: '/fechamentos', label: 'Fechamentos', icon: BookOpen },
      { to: '/relatorios', label: 'Relatórios', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/integracoes', label: 'Integrações', icon: Link2 },
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
]

export function Layout() {
  const { toast } = useAppState()
  const roleLabel = currentUser.role === 'admin' ? 'Administrador' : currentUser.role

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Scale size={16} color="#fff" />
          </div>
          <span>Reconcile</span>
        </div>
        {groups.map((group) => (
          <nav key={group.label} className="nav-group">
            <div className="nav-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar-foot">
          <div className="tenant">
            <strong>{tenant.name}</strong>
            <span>Tenant {tenant.id}</span>
            <span>
              {currentUser.name} · {roleLabel}
            </span>
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
