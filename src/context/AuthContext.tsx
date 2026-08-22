import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { api, clearSession, loadSession, saveSession, type Session } from '../api/client'

type AuthValue = {
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode
  initialSession?: Session | null
}) {
  const [session, setSession] = useState<Session | null>(() => initialSession ?? loadSession())

  const value = useMemo<AuthValue>(
    () => ({
      session,
      login: async (email, password) => {
        const result = await api<Session>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        saveSession(result)
        setSession(result)
      },
      logout: () => {
        clearSession()
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
