import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  initialCases,
  initialClosings,
  initialComments,
  initialIntegrations,
  initialRules,
} from '../data/mock'
import type { CaseStatus, Closing, Comment, Integration, ReconciliationCase, ReconciliationRule } from '../types'

type AppStateValue = {
  cases: ReconciliationCase[]
  comments: Comment[]
  closings: Closing[]
  integrations: Integration[]
  rules: ReconciliationRule[]
  toast: string | null
  updateCaseStatus: (id: string, status: CaseStatus) => void
  addComment: (caseId: string, text: string) => void
  closePeriod: (id: string) => void
  toggleIntegration: (id: string) => void
  toggleRule: (id: string) => void
  showToast: (message: string) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

const statusToast: Record<CaseStatus, string> = {
  aberta: 'reaberto',
  em_analise: 'marcado em análise',
  resolvida: 'resolvido',
  ignorada: 'ignorado',
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState(initialCases)
  const [comments, setComments] = useState(initialComments)
  const [closings, setClosings] = useState(initialClosings)
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const [rules, setRules] = useState(initialRules)
  const [toast, setToast] = useState<string | null>(null)

  const value = useMemo<AppStateValue>(() => {
    const showToast = (message: string) => {
      setToast(message)
      window.setTimeout(() => setToast(null), 2800)
    }

    return {
      cases,
      comments,
      closings,
      integrations,
      rules,
      toast,
      updateCaseStatus: (id, status) => {
        setCases((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))
        showToast(`Caso ${id} ${statusToast[status]}.`)
      },
      addComment: (caseId, text) => {
        setComments((current) => [
          ...current,
          {
            id: `cmt-${Date.now()}`,
            caseId,
            author: 'Ana Dantas',
            at: new Date().toISOString(),
            text,
          },
        ])
      },
      closePeriod: (id) => {
        setClosings((current) =>
          current.map((item) => (item.id === id ? { ...item, status: 'closed', closedAt: new Date().toISOString() } : item)),
        )
        showToast(`Período ${id} fechado.`)
      },
      toggleIntegration: (id) => {
        setIntegrations((current) =>
          current.map((item) =>
            item.id === id ? { ...item, status: item.status === 'ativa' ? 'disponivel' : 'ativa' } : item,
          ),
        )
      },
      toggleRule: (id) => {
        setRules((current) => current.map((item) => (item.id === id ? { ...item, active: !item.active } : item)))
      },
      showToast,
    }
  }, [cases, comments, closings, integrations, rules, toast])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState deve ser usado dentro de AppStateProvider')
  return context
}
