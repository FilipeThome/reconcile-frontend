import {
  BookOpen,
  Calculator,
  FileSpreadsheet,
  FileText,
  GitCompare,
  LayoutDashboard,
  Link2,
  LogOut,
  Receipt,
  Scale,
  Settings,
  ShoppingBag,
  Split,
  TriangleAlert,
  Undo2,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitch, useLocale } from '../context/LocaleContext'
import { displayRole } from '../lib/format'
import type { MessageKey } from '../i18n/locale'
import { SaleNotifier } from './SaleNotifier'

const groups: { label: MessageKey; items: { to: string; label: MessageKey; icon: typeof LayoutDashboard; end?: boolean }[] }[] = [
  {
    label: 'nav.operation',
    items: [
      { to: '/', label: 'nav.overview', icon: LayoutDashboard, end: true },
      { to: '/pedidos', label: 'nav.orders', icon: ShoppingBag },
      { to: '/pagamentos', label: 'nav.payments', icon: Wallet },
      { to: '/liquidacoes', label: 'nav.settlements', icon: Scale },
      { to: '/repasses', label: 'nav.payouts', icon: Split },
      { to: '/tarifas', label: 'nav.fees', icon: Receipt },
      { to: '/reembolsos', label: 'nav.refunds', icon: Undo2 },
    ],
  },
  {
    label: 'nav.reconciliation',
    items: [
      { to: '/divergencias', label: 'nav.discrepancies', icon: TriangleAlert },
      { to: '/motor', label: 'nav.engine', icon: Calculator },
      { to: '/regras', label: 'nav.rules', icon: GitCompare },
    ],
  },
  {
    label: 'nav.closing',
    items: [
      { to: '/fiscal', label: 'nav.fiscal', icon: FileText },
      { to: '/fechamentos', label: 'nav.closings', icon: BookOpen },
      { to: '/relatorios', label: 'nav.reports', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'nav.system',
    items: [
      { to: '/integracoes', label: 'nav.integrations', icon: Link2 },
      { to: '/configuracoes', label: 'nav.settings', icon: Settings },
    ],
  },
]

export function Layout() {
  const { session, logout } = useAuth()
  const { settings } = useAppState()
  const { t } = useLocale()
  const navigate = useNavigate()
  const name = session?.name ?? settings?.currentUser?.name ?? '—'
  const roleLabel = displayRole(session?.role ?? settings?.currentUser?.role ?? '')
  const tenantName = settings?.tenant.name ?? '—'
  const tenantId = session?.tenantId ?? settings?.tenant.id ?? '—'

  return (
    <div className="app-shell">
      <SaleNotifier />
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Scale size={16} color="#fff" />
          </div>
          <span>Reconcile</span>
        </div>
        {groups.map((group) => (
          <nav key={group.label} className="nav-group">
            <div className="nav-label">{t(group.label)}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <item.icon />
                <span>{t(item.label)}</span>
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar-foot">
          <div className="tenant">
            <strong>{tenantName}</strong>
            <span>{t('nav.tenant')} {tenantId}</span>
            <span>
              {name} · {roleLabel}
            </span>
            <button
              type="button"
              className="btn mt-10 w-full"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut size={14} /> {t('nav.logout')}
            </button>
            <LanguageSwitch />
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
