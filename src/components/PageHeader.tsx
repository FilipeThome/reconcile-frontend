import { CalendarRange, Filter, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { period } from '../data/mock'

type Props = {
  title: string
  subtitle?: string
  children?: ReactNode
  showPeriod?: boolean
}

export function PageHeader({ title, subtitle, children, showPeriod = true }: Props) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        {showPeriod && (
          <span className="chip">
            <CalendarRange size={14} />
            {period.label}
          </span>
        )}
        <button type="button" className="btn">
          <Filter size={14} />
          Filtros
        </button>
        <button type="button" className="btn">
          <RefreshCw size={14} />
          Atualizar
        </button>
        {children}
      </div>
    </header>
  )
}
